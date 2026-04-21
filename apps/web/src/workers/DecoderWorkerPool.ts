/**
 * DecoderWorkerPool — fans out tile decode jobs across N Workers with
 * zero-copy ArrayBuffer transfer (Doc 27 §8.4, §12.1–§12.2).
 *
 * Why: `TileStreamingManager` currently decodes tiles on the main thread.
 * At tile-rich moments (20 fetches in flight during a fly-through), decode
 * spikes show up as multi-frame jank in the Chrome profiler. Moving decode
 * to workers keeps the main thread under 5 ms/frame even with a burst of
 * incoming tiles, per the Doc 27 §14 perf budget.
 *
 * Pool design:
 *   - 4 workers by default (tunable; caps at `hardwareConcurrency - 1` to
 *     leave a core for render / react).
 *   - Round-robin dispatch: simple, fair, no priority inversion.
 *   - Job registry keyed by a monotonic u32 id; resolves a Promise when
 *     the matching reply arrives. Timeouts are the caller's concern —
 *     this class doesn't bake one in because long/slow tiles are valid
 *     (e.g. cold-cache Postgres fetches).
 *
 * The pool is test-friendly: you can inject a factory to return mock
 * Worker instances, and `handleDecode` is exported from the worker module
 * so synchronous decode paths can still be exercised without spawning.
 */

import type { StarTileBuffers } from '@cosmos/tile-decoder';

import type { DecodeRequest, DecodeResponse, TileKind } from './tileDecoder.worker';

export interface DecoderPoolOptions {
  /** Override for tests — otherwise defaults to `new Worker(new URL(...))`. */
  workerFactory?: () => Worker;
  /** Number of workers. Default: min(4, hardwareConcurrency - 1). */
  size?: number;
}

export interface DecodedStarTilePayload {
  kind: 'stars';
  address: string;
  buffers: StarTileBuffers;
}

export type DecodedTilePayload = DecodedStarTilePayload;

export class DecodeError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'DecodeError';
    this.code = code;
  }
}

interface PendingJob {
  resolve: (payload: DecodedTilePayload) => void;
  reject: (err: DecodeError) => void;
  address: string;
  kind: TileKind;
}

const DEFAULT_POOL_SIZE = 4;

/** Default worker factory. Kept separate so tests can inject their own. */
export function defaultDecoderWorkerFactory(): Worker {
  return new Worker(new URL('./tileDecoder.worker.ts', import.meta.url), {
    type: 'module',
    name: 'tile-decoder',
  });
}

export class DecoderWorkerPool {
  private readonly workers: Worker[] = [];
  private readonly pending = new Map<number, PendingJob>();
  private nextJobId = 1;
  private rr = 0;
  private disposed = false;

  constructor(options: DecoderPoolOptions = {}) {
    const factory = options.workerFactory ?? defaultDecoderWorkerFactory;
    const hc =
      typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : DEFAULT_POOL_SIZE + 1;
    const requested = options.size ?? Math.min(DEFAULT_POOL_SIZE, Math.max(1, hc - 1));

    for (let i = 0; i < requested; i++) {
      const worker = factory();
      worker.addEventListener('message', (event: MessageEvent<DecodeResponse>) => {
        this.handleMessage(event.data);
      });
      worker.addEventListener('error', (event) => {
        // Worker-level fatal — fail every pending job pinned to this worker.
        // Simpler: fail ALL pending since we can't cheaply tell which worker
        // owned each; the caller can retry via the streaming manager.
        const err = new DecodeError(
          'WORKER_CRASH',
          event.message || 'decoder worker emitted error event',
        );
        for (const job of this.pending.values()) job.reject(err);
        this.pending.clear();
      });
      this.workers.push(worker);
    }
  }

  /** Number of live workers. */
  size(): number {
    return this.workers.length;
  }

  /** Current queue depth (jobs awaiting a reply). */
  pendingCount(): number {
    return this.pending.size;
  }

  /**
   * Submit a buffer for decoding. The buffer is transferred (zero-copy);
   * the caller must not touch it after `decode` returns — doing so throws
   * a DOMException in strict browsers.
   */
  decode(kind: TileKind, address: string, buffer: ArrayBuffer): Promise<DecodedTilePayload> {
    if (this.disposed) {
      return Promise.reject(new DecodeError('POOL_DISPOSED', 'decoder pool has been disposed'));
    }
    if (this.workers.length === 0) {
      return Promise.reject(new DecodeError('NO_WORKERS', 'decoder pool has zero workers'));
    }

    const id = this.nextJobId++;
    const worker = this.workers[this.rr % this.workers.length];
    this.rr = (this.rr + 1) % this.workers.length;

    return new Promise<DecodedTilePayload>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, address, kind });
      const request: DecodeRequest = { id, kind, address, buffer };
      worker.postMessage(request, [buffer]);
    });
  }

  /** Terminate every worker and reject any in-flight jobs. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const worker of this.workers) worker.terminate();
    this.workers.length = 0;
    const err = new DecodeError('POOL_DISPOSED', 'decoder pool disposed with jobs in flight');
    for (const job of this.pending.values()) job.reject(err);
    this.pending.clear();
  }

  private handleMessage(msg: DecodeResponse): void {
    const job = this.pending.get(msg.id);
    if (!job) return; // stale reply — pool was cleared or job already settled
    this.pending.delete(msg.id);
    if (msg.ok) {
      if (msg.kind === 'stars' && msg.starBuffers) {
        job.resolve({ kind: 'stars', address: msg.address, buffers: msg.starBuffers });
      } else {
        job.reject(new DecodeError('UNSUPPORTED_KIND', `worker returned unknown kind ${msg.kind}`));
      }
    } else {
      job.reject(new DecodeError(msg.code, msg.message));
    }
  }
}
