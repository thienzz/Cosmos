import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../api/client';
import type { BinaryResponse } from '../../api/client';
import { useTileStore } from '../../stores/tileStore';
import {
  TileStreamingManager,
  tilePriorityHintsFromWsUrls,
} from '../TileStreamingManager';


/**
 * In-memory stand-in for the TileDiskCache. Lets tests exercise the
 * cache-hit / cache-miss paths without a real IndexedDB.
 */
class MemoryDiskCache {
  public readonly stored = new Map<string, ArrayBuffer>();
  public stats = { gets: 0, hits: 0, puts: 0 };

  async get(address: string): Promise<ArrayBuffer | null> {
    this.stats.gets += 1;
    const buf = this.stored.get(address);
    if (buf) this.stats.hits += 1;
    return buf ?? null;
  }
  async put(address: string, _version: string, buffer: ArrayBuffer): Promise<{ stored: true; evictedBytes: 0 }> {
    this.stats.puts += 1;
    this.stored.set(address, buffer);
    return { stored: true, evictedBytes: 0 };
  }
  async evictLRU(): Promise<number> {
    return 0;
  }
  async clear(): Promise<void> {
    this.stored.clear();
  }
  async stats__(): Promise<{ count: number; bytes: number; budgetBytes: number }> {
    return { count: this.stored.size, bytes: 0, budgetBytes: 0 };
  }
  async keepOnlyVersion(): Promise<number> {
    return 0;
  }
  async clearVersion(): Promise<number> {
    return 0;
  }
  async delete(): Promise<void> {
    /* no-op */
  }
}

function binaryResponse(
  buffer: ArrayBuffer,
  version = 'v1',
  overrides: Partial<BinaryResponse> = {},
): BinaryResponse {
  return {
    buffer,
    version,
    contentType: 'application/octet-stream',
    serverCache: null,
    fetchDurationMs: 3,
    ...overrides,
  };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('TileStreamingManager', () => {
  beforeEach(() => {
    useTileStore.getState().resetToDefault();
  });

  it('enqueues + fetches with network miss path (TS-TILE-004 miss)', async () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(async (_address: string) => binaryResponse(new ArrayBuffer(64)));
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
    });
    mgr.enqueue([{ address: 'stars/3/12/5/2', priority: 1 }]);

    // Allow microtasks + network + store update.
    await flush();

    expect(fetcher).toHaveBeenCalledWith('stars/3/12/5/2', expect.any(Object));
    const tile = useTileStore.getState().loadedTiles.get('stars/3/12/5/2');
    expect(tile?.status).toBe('loaded');
    expect(disk.stored.has('stars/3/12/5/2')).toBe(true);
    expect(mgr.inFlightCount()).toBe(0);
    mgr.dispose();
  });

  it('serves a cached tile without hitting the network (TS-TILE-004 hit)', async () => {
    const disk = new MemoryDiskCache();
    disk.stored.set('stars/0/0/0/0', new ArrayBuffer(32));
    const fetcher = vi.fn(async () => binaryResponse(new ArrayBuffer(32)));
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
    });

    mgr.enqueue([{ address: 'stars/0/0/0/0', priority: 1 }]);
    await flush();

    expect(fetcher).not.toHaveBeenCalled();
    expect(useTileStore.getState().loadedTiles.get('stars/0/0/0/0')?.status).toBe('loaded');
    expect(useTileStore.getState().cacheHitRate).toBeGreaterThan(0);
    mgr.dispose();
  });

  it('404 response marks the tile failed without crashing (TS-TILE-005)', async () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(async () => {
      throw new ApiError(
        { code: 'TILE_NOT_FOUND', message: 'not found', status: 404, request_id: 'x' },
        404,
      );
    });
    const onTileFailed = vi.fn();
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
      onTileFailed,
    });

    mgr.enqueue([{ address: 'stars/8/99/99/3', priority: 1 }]);
    // ApiError.isRetryable() is false for 404, so only one attempt — but we
    // still need to let the retry loop settle.
    await flush();
    await flush();

    const tile = useTileStore.getState().loadedTiles.get('stars/8/99/99/3');
    expect(tile?.status).toBe('failed');
    if (tile?.status === 'failed') expect(tile.error).toBe('TILE_NOT_FOUND');
    expect(onTileFailed).toHaveBeenCalledTimes(1);
    mgr.dispose();
  });

  it('caps in-flight fetches at maxConcurrent=2', async () => {
    const disk = new MemoryDiskCache();
    let resolveFn: ((r: BinaryResponse) => void) | null = null;
    const pending: Array<(r: BinaryResponse) => void> = [];

    const fetcher = vi.fn(async (_address: string) => {
      return new Promise<BinaryResponse>((resolve) => {
        pending.push(resolve);
        resolveFn = resolve;
      });
    });

    const mgr = new TileStreamingManager({
      maxConcurrent: 2,
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
    });

    mgr.enqueue([
      { address: 'a', priority: 1 },
      { address: 'b', priority: 2 },
      { address: 'c', priority: 3 },
      { address: 'd', priority: 4 },
    ]);
    await flush();
    expect(mgr.inFlightCount()).toBe(2);
    expect(mgr.pendingCount()).toBe(2);

    // Resolve one — another should dispatch.
    pending.shift()?.(binaryResponse(new ArrayBuffer(16)));
    await flush();
    expect(mgr.inFlightCount()).toBe(2);
    expect(mgr.pendingCount()).toBe(1);

    // Drain the rest so teardown doesn't leak.
    while (pending.length > 0) {
      pending.shift()?.(binaryResponse(new ArrayBuffer(16)));
      await flush();
    }
    expect(resolveFn).not.toBeNull();
    mgr.dispose();
  });

  it('dispatches highest-priority tile first', async () => {
    const disk = new MemoryDiskCache();
    const seen: string[] = [];
    const fetcher = vi.fn(async (address: string) => {
      seen.push(address);
      return binaryResponse(new ArrayBuffer(16));
    });
    const mgr = new TileStreamingManager({
      maxConcurrent: 1,
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
    });

    mgr.enqueue([
      { address: 'low', priority: 0.1 },
      { address: 'high', priority: 1.0 },
      { address: 'mid', priority: 0.5 },
    ]);
    await flush();
    await flush();
    await flush();
    await flush();
    await flush();

    expect(seen).toEqual(['high', 'mid', 'low']);
    mgr.dispose();
  });

  it('evicts LRU when adding a buffer would exceed the GPU budget (TS-TILE-003)', async () => {
    useTileStore.getState().setGpuBudget(1000);
    useTileStore.getState().markTileLoaded('old', new ArrayBuffer(800));
    // Wait a tick so `lastAccessedAt` differs across entries.
    await new Promise((r) => setTimeout(r, 2));

    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(async () => binaryResponse(new ArrayBuffer(500)));
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
    });

    mgr.enqueue([{ address: 'new', priority: 1 }]);
    await flush();

    const state = useTileStore.getState();
    expect(state.loadedTiles.has('new')).toBe(true);
    expect(state.loadedTiles.has('old')).toBe(false);
    expect(state.gpuMemoryUsedBytes).toBeLessThanOrEqual(state.gpuMemoryBudgetBytes);
    mgr.dispose();
  });

  it('clear() drops the queue and aborts in-flight', async () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(
      async (_address: string, opts: { signal?: AbortSignal }) =>
        new Promise<BinaryResponse>((_resolve, reject) => {
          opts.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
    });

    mgr.enqueue([{ address: 'x', priority: 1 }]);
    await flush();
    expect(mgr.inFlightCount()).toBe(1);
    mgr.clear();
    expect(mgr.inFlightCount()).toBe(0);
    mgr.dispose();
  });
});

describe('T25 regime filter', () => {
  beforeEach(() => useTileStore.getState().resetToDefault());

  it('drops star-tile hints while in solar_system regime', async () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(async () => binaryResponse(new ArrayBuffer(32)));
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
      activeRegime: 'solar_system',
    });
    mgr.enqueue([
      { address: 'stars/3/12/5/2', priority: 1 },
      { address: 'galaxies/1024', priority: 0.5 },
    ]);
    await flush();
    expect(fetcher).not.toHaveBeenCalled();
    expect(mgr.pendingCount()).toBe(0);
    expect(mgr.getRegimeFilteredCount()).toBe(2);
    mgr.dispose();
  });

  it('stellar regime admits stars, rejects galaxies + cosmic-web', async () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(async () => binaryResponse(new ArrayBuffer(32)));
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
      activeRegime: 'stellar',
    });
    mgr.enqueue([
      { address: 'stars/0/0/0/0', priority: 1 },
      { address: 'galaxies/1024', priority: 1 },
      { address: 'cosmic-web/3', priority: 1 },
    ]);
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('stars/0/0/0/0', expect.any(Object));
    expect(mgr.getRegimeFilteredCount()).toBe(2);
    mgr.dispose();
  });

  it('setActiveRegime prunes already-queued addresses', async () => {
    const disk = new MemoryDiskCache();
    // Fetcher that never resolves so the queue fills past maxConcurrent.
    const fetcher = vi.fn(
      (_addr: string, opts: { signal?: AbortSignal }) =>
        new Promise<BinaryResponse>((_resolve, reject) => {
          opts.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const mgr = new TileStreamingManager({
      maxConcurrent: 1,
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
      activeRegime: 'galactic',
    });
    mgr.enqueue([
      { address: 'stars/0/0/0/0', priority: 0.1 },
      { address: 'galaxies/1', priority: 0.2 },
      { address: 'galaxies/2', priority: 0.3 },
    ]);
    await flush();
    // Max-concurrent=1 → highest-priority (galaxies/2) goes in-flight;
    // the other two sit in queue.
    expect(mgr.inFlightCount()).toBe(1);
    expect(mgr.pendingCount()).toBe(2);

    // Jump to cosmic — `stars/0/0/0/0` is not visible in cosmic so it's
    // pruned. `galaxies/1` survives; the in-flight `galaxies/2` is left
    // alone (bandwidth already committed).
    mgr.setActiveRegime('cosmic');
    expect(mgr.pendingCount()).toBe(1);
    expect(mgr.getRegimeFilteredCount()).toBe(1);

    // Step down to stellar — galaxies/* are no longer relevant, so the
    // remaining queued entry is pruned. In-flight still running.
    mgr.setActiveRegime('stellar');
    expect(mgr.pendingCount()).toBe(0);
    expect(mgr.getRegimeFilteredCount()).toBe(2);
    mgr.dispose();
  });

  it('setActiveRegime(null) disables the filter again', async () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(async () => binaryResponse(new ArrayBuffer(16)));
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
      activeRegime: 'solar_system',
    });
    mgr.enqueue([{ address: 'stars/0/0/0/0', priority: 1 }]);
    await flush();
    expect(fetcher).not.toHaveBeenCalled();

    mgr.setActiveRegime(null);
    mgr.enqueue([{ address: 'stars/0/0/0/0', priority: 1 }]);
    await flush();
    expect(fetcher).toHaveBeenCalledOnce();
    mgr.dispose();
  });
});

describe('TileStreamingManager.reprioritize — P3 distance-based updates', () => {
  beforeEach(() => {
    useTileStore.getState().resetToDefault();
  });

  it('updates priorities so the highest survivor is fetched first', async () => {
    const disk = new MemoryDiskCache();
    const fetchOrder: string[] = [];
    const fetcher = vi.fn(async (address: string) => {
      fetchOrder.push(address);
      return binaryResponse(new ArrayBuffer(32));
    });
    // maxConcurrent = 1 so the pump drains one at a time and the sort
    // order becomes observable via the fetch call sequence.
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
      maxConcurrent: 1,
    });
    // Enqueue 'near' with a HIGH baseline so it beats whatever the pump
    // grabs first (pump sorts descending); then reprioritize raises 'mid'
    // and drops 'far' so the remaining drain order is mid before far.
    mgr.enqueue([
      { address: 'stars/far', priority: 0.1 },
      { address: 'stars/mid', priority: 0.05 },
      { address: 'stars/near', priority: 0.9 },
    ]);
    mgr.reprioritize((a) => {
      if (a === 'stars/mid') return 0.8;
      if (a === 'stars/far') return 0.02;
      return undefined;
    });
    await flush();
    await flush();
    await flush();
    await flush();
    // near fetched first (baseline priority 0.9 > reweighted mid 0.8 > far 0.02).
    expect(fetchOrder[0]).toBe('stars/near');
    // mid second because reprioritize raised it above far.
    expect(fetchOrder[1]).toBe('stars/mid');
    expect(fetchOrder[2]).toBe('stars/far');
    mgr.dispose();
  });

  it('dropping priority below zero removes the tile from the queue', () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(async () => binaryResponse(new ArrayBuffer(32)));
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
      maxConcurrent: 0, // no auto-drain, inspect queue state directly.
    });
    mgr.enqueue([
      { address: 'stars/keep', priority: 0.5 },
      { address: 'stars/drop', priority: 0.5 },
    ]);
    expect(mgr.pendingCount()).toBe(2);
    mgr.reprioritize((a) => (a === 'stars/drop' ? -1 : undefined));
    expect(mgr.pendingCount()).toBe(1);
    mgr.dispose();
  });

  it('records network telemetry on network miss (T-E-08)', async () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn(async (_address: string) =>
      binaryResponse(new ArrayBuffer(32), 'v1', {
        serverCache: 'MISS',
        fetchDurationMs: 42,
      }),
    );
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
    });
    mgr.enqueue([{ address: 'stars/0/0/0/0', priority: 1.0 }]);
    await flush();
    await flush();

    const stats = mgr.getNetworkStats();
    expect(stats.fetches).toBe(1);
    expect(stats.avgFetchMs).toBe(42);
    expect(stats.lastFetchMs).toBe(42);
    expect(stats.serverCacheHits).toBe(0);
    expect(stats.serverCacheMisses).toBe(1);
    expect(stats.serverCacheHitRate).toBe(0);
    mgr.dispose();
  });

  it('tracks x-cache HIT responses as server-cache hits', async () => {
    const disk = new MemoryDiskCache();
    let call = 0;
    const fetcher = vi.fn(async (_address: string) => {
      call += 1;
      return binaryResponse(new ArrayBuffer(16), 'v1', {
        serverCache: call === 1 ? 'MISS' : 'HIT',
        fetchDurationMs: call * 10,
      });
    });
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
      maxConcurrent: 1,
    });
    mgr.enqueue([
      { address: 'stars/a', priority: 1 },
      { address: 'stars/b', priority: 0.9 },
      { address: 'stars/c', priority: 0.8 },
    ]);
    for (let i = 0; i < 8; i++) await flush();

    const stats = mgr.getNetworkStats();
    expect(stats.fetches).toBe(3);
    // Avg of 10 + 20 + 30 = 20.
    expect(stats.avgFetchMs).toBe(20);
    expect(stats.serverCacheHits).toBe(2);
    expect(stats.serverCacheMisses).toBe(1);
    expect(stats.serverCacheHitRate).toBeCloseTo(2 / 3, 5);
    mgr.dispose();
  });

  it('is a no-op when the queue is empty', () => {
    const disk = new MemoryDiskCache();
    const fetcher = vi.fn();
    const mgr = new TileStreamingManager({
      diskCache: disk as unknown as never,
      fetcher: fetcher as unknown as never,
    });
    // Should not throw nor call the supplier.
    const supplier = vi.fn(() => 0.5);
    mgr.reprioritize(supplier);
    expect(supplier).not.toHaveBeenCalled();
    mgr.dispose();
  });
});

describe('tilePriorityHintsFromWsUrls', () => {
  it('strips the /v1/tiles/ prefix', () => {
    const hints = tilePriorityHintsFromWsUrls([
      { url: '/v1/tiles/stars/5/128/64/3', priority: 1.0 },
      { url: '/tiles/galaxies/1024', priority: 0.3 },
      { url: 'stars/0/0/0/0', priority: 0.1 },
    ]);
    expect(hints[0]!.address).toBe('stars/5/128/64/3');
    expect(hints[1]!.address).toBe('galaxies/1024');
    expect(hints[2]!.address).toBe('stars/0/0/0/0');
  });

  it('strips scheme + host too', () => {
    const hints = tilePriorityHintsFromWsUrls([
      { url: 'https://api.cosmosexplorer.app/v1/tiles/cosmic-web/0', priority: 0.5 },
    ]);
    expect(hints[0]!.address).toBe('cosmic-web/0');
  });
});
