import { describe, expect, it, vi } from 'vitest';

import { DecoderWorkerPool, DecodeError } from '../DecoderWorkerPool';
import {
  handleDecode,
  type DecodeRequest,
  type DecodeResponse,
} from '../tileDecoder.worker';
import { buildStarTileBuffer } from './fixtures';

/**
 * Mock Worker that runs `handleDecode` synchronously on the next microtask
 * and dispatches the reply back to itself. Close enough to a real Worker
 * for driving DecoderWorkerPool through the protocol without spawning
 * threads (which Vitest/jsdom can't do cleanly).
 */
/** Close-enough stand-in for a Worker in vitest (jsdom). We don't extend
 *  `Partial<Worker>` because the real overload signature of `postMessage`
 *  fights TypeScript when we want an override hook in individual tests. */
class MockWorker {
  private listeners = new Map<string, Set<(ev: unknown) => void>>();
  public terminated = false;

  addEventListener(type: string, listener: (ev: unknown) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (ev: unknown) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  postMessage = (data: DecodeRequest, _transfer?: Transferable[]): void => {
    queueMicrotask(() => {
      if (this.terminated) return;
      const { response } = handleDecode(data);
      const ev = { data: response } as MessageEvent<DecodeResponse>;
      for (const l of this.listeners.get('message') ?? []) l(ev);
    });
  };

  terminate(): void {
    this.terminated = true;
    this.listeners.clear();
  }
}

function buildMockPool(size = 2): { pool: DecoderWorkerPool; workers: MockWorker[] } {
  const workers: MockWorker[] = [];
  const factory = (): Worker => {
    const w = new MockWorker() as unknown as Worker;
    workers.push(w as unknown as MockWorker);
    return w;
  };
  const pool = new DecoderWorkerPool({ workerFactory: factory, size });
  return { pool, workers };
}

describe('DecoderWorkerPool', () => {
  it('spins up the requested number of workers', () => {
    const { pool, workers } = buildMockPool(3);
    expect(pool.size()).toBe(3);
    expect(workers).toHaveLength(3);
    pool.dispose();
  });

  it('decodes a star tile and returns the expected buffers', async () => {
    const { pool } = buildMockPool(1);
    const buffer = buildStarTileBuffer([
      { x: 0.5, y: -0.25, z: 1, magnitude: 128, color: 64, spectralType: 4 },
      { x: -1, y: 2, z: -0.5, magnitude: 200, color: 128, spectralType: 6 },
    ]);

    const decoded = await pool.decode('stars', '0/0/0/0', buffer);
    expect(decoded.kind).toBe('stars');
    expect(decoded.buffers.header.star_count).toBe(2);
    expect(decoded.buffers.positions).toHaveLength(6);
    // Quantised colour byte round-trips exactly — no precision loss there.
    expect(decoded.buffers.colorIndices[0]).toBe(64);
    expect(decoded.buffers.spectralTypes[1]).toBe(6);
    pool.dispose();
  });

  it('rejects with a DecodeError on corrupt buffers', async () => {
    const { pool } = buildMockPool(1);
    const bad = new ArrayBuffer(8); // too small for even the header
    await expect(pool.decode('stars', 'bad', bad)).rejects.toBeInstanceOf(DecodeError);
    pool.dispose();
  });

  it('zero-copy transfer detaches the input ArrayBuffer from the main thread', async () => {
    // Real Workers detach via `postMessage(data, [buffer])`; MockWorker can't
    // actually detach (jsdom doesn't transfer), so we verify the pool at least
    // LISTS the buffer in the transfer array. We spy postMessage.
    const postSpy = vi.fn((_data: DecodeRequest, _transfer?: Transferable[]) => {});
    const factory = (): Worker => {
      const w = new MockWorker();
      const original = w.postMessage.bind(w);
      w.postMessage = (data: DecodeRequest, transfer?: Transferable[]) => {
        postSpy(data, transfer);
        original(data, transfer);
      };
      return w as unknown as Worker;
    };
    const pool = new DecoderWorkerPool({ workerFactory: factory, size: 1 });
    const buffer = buildStarTileBuffer([
      { x: 0, y: 0, z: 0, magnitude: 0, color: 0, spectralType: 0 },
    ]);
    await pool.decode('stars', 'x/0/0/0', buffer);
    expect(postSpy).toHaveBeenCalledOnce();
    const transfer = postSpy.mock.calls[0][1];
    expect(transfer).toContain(buffer);
    pool.dispose();
  });

  it('dispose rejects every in-flight job', async () => {
    // Build a pool whose mock worker never replies.
    class StallWorker extends MockWorker {
      override postMessage = (): void => {
        /* no-op — never reply */
      };
    }
    const stalls: StallWorker[] = [];
    const pool = new DecoderWorkerPool({
      workerFactory: () => {
        const w = new StallWorker();
        stalls.push(w);
        return w as unknown as Worker;
      },
      size: 1,
    });
    const buffer = buildStarTileBuffer([
      { x: 0, y: 0, z: 0, magnitude: 0, color: 0, spectralType: 0 },
    ]);
    const pending = pool.decode('stars', 'stall', buffer);
    pool.dispose();
    await expect(pending).rejects.toBeInstanceOf(DecodeError);
  });

  it('round-robins jobs across workers', async () => {
    const { pool, workers } = buildMockPool(3);
    const counts = workers.map(() => 0);
    const spies = workers.map((w, i) => {
      const original = w.postMessage.bind(w);
      w.postMessage = ((data: DecodeRequest, transfer?: Transferable[]) => {
        counts[i]++;
        original(data, transfer);
      }) as MockWorker['postMessage'];
      return { w };
    });
    expect(spies).toHaveLength(3);

    const jobs: Promise<unknown>[] = [];
    for (let i = 0; i < 6; i++) {
      const buffer = buildStarTileBuffer([
        { x: 0, y: 0, z: 0, magnitude: 0, color: 0, spectralType: 0 },
      ]);
      jobs.push(pool.decode('stars', `addr-${i}`, buffer));
    }
    await Promise.all(jobs);

    // 6 jobs across 3 workers in strict round-robin → 2 jobs each.
    expect(counts).toEqual([2, 2, 2]);
    pool.dispose();
  });
});
