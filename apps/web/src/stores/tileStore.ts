import { create } from 'zustand';

import type { TileAddress, TileLoadState, TileManifest } from './types.js';

/**
 * Warm/hot state: the engine's tile streaming pipeline (Doc 27 §8) writes
 * here on every viewport update. The `loadedTiles` Map is mutated in place
 * to keep memory flat — callers must treat it as the source of truth.
 * Source: Doc 27 §5.6.
 */
export interface TileState {
  loadedTiles: Map<TileAddress, TileLoadState>;
  pendingTiles: Set<TileAddress>;

  manifest: TileManifest | null;
  manifestVersion: string | null;

  gpuMemoryUsedBytes: number;
  gpuMemoryBudgetBytes: number;

  cacheHitRate: number;
  tilesInMemory: number;
  tilesOnDisk: number;

  // Actions
  setManifest: (manifest: TileManifest) => void;
  invalidateManifest: (newVersion: string) => void;
  setGpuBudget: (bytes: number) => void;
  markTileLoading: (address: TileAddress) => void;
  markTileLoaded: (address: TileAddress, data: ArrayBuffer) => void;
  markTileFailed: (address: TileAddress, error: string) => void;
  touchTile: (address: TileAddress) => void;
  evictTile: (address: TileAddress) => void;
  evictLRU: (targetBytes: number) => void;
  updateCacheHitRate: (rate: number) => void;
  resetToDefault: () => void;
}

/** Doc 27 §8.5: mid-tier GPU tile budget. */
export const DEFAULT_GPU_MEMORY_BUDGET_BYTES = 192 * 1024 * 1024;

export const TILE_DEFAULT_STATE: Omit<
  TileState,
  | 'setManifest'
  | 'invalidateManifest'
  | 'setGpuBudget'
  | 'markTileLoading'
  | 'markTileLoaded'
  | 'markTileFailed'
  | 'touchTile'
  | 'evictTile'
  | 'evictLRU'
  | 'updateCacheHitRate'
  | 'resetToDefault'
> = {
  loadedTiles: new Map(),
  pendingTiles: new Set(),
  manifest: null,
  manifestVersion: null,
  gpuMemoryUsedBytes: 0,
  gpuMemoryBudgetBytes: DEFAULT_GPU_MEMORY_BUDGET_BYTES,
  cacheHitRate: 0,
  tilesInMemory: 0,
  tilesOnDisk: 0,
};

function freshDefaultState(): typeof TILE_DEFAULT_STATE {
  return {
    ...TILE_DEFAULT_STATE,
    loadedTiles: new Map(),
    pendingTiles: new Set(),
  };
}

export const useTileStore = create<TileState>()((set, get) => ({
  ...freshDefaultState(),

  setManifest: (manifest) =>
    set({
      manifest,
      manifestVersion: manifest.version,
      tilesOnDisk: manifest.totalTiles,
    }),

  invalidateManifest: (newVersion) =>
    set({
      manifest: null,
      manifestVersion: newVersion,
      loadedTiles: new Map(),
      tilesInMemory: 0,
      gpuMemoryUsedBytes: 0,
    }),

  setGpuBudget: (bytes) => set({ gpuMemoryBudgetBytes: bytes }),

  markTileLoading: (address) => {
    const { loadedTiles, pendingTiles } = get();
    loadedTiles.set(address, { status: 'loading', startedAt: Date.now() });
    pendingTiles.add(address);
    set({
      loadedTiles: new Map(loadedTiles),
      pendingTiles: new Set(pendingTiles),
    });
  },

  markTileLoaded: (address, data) => {
    const { loadedTiles, pendingTiles, gpuMemoryUsedBytes } = get();
    const now = Date.now();
    const sizeBytes = data.byteLength;
    loadedTiles.set(address, {
      status: 'loaded',
      buffer: data,
      loadedAt: now,
      lastAccessedAt: now,
      sizeBytes,
    });
    pendingTiles.delete(address);
    set({
      loadedTiles: new Map(loadedTiles),
      pendingTiles: new Set(pendingTiles),
      gpuMemoryUsedBytes: gpuMemoryUsedBytes + sizeBytes,
      tilesInMemory: loadedTiles.size,
    });
  },

  markTileFailed: (address, error) => {
    const { loadedTiles, pendingTiles } = get();
    const previous = loadedTiles.get(address);
    const retryCount = previous?.status === 'failed' ? previous.retryCount + 1 : 1;
    loadedTiles.set(address, {
      status: 'failed',
      error,
      failedAt: Date.now(),
      retryCount,
    });
    pendingTiles.delete(address);
    set({
      loadedTiles: new Map(loadedTiles),
      pendingTiles: new Set(pendingTiles),
    });
  },

  touchTile: (address) => {
    const { loadedTiles } = get();
    const tile = loadedTiles.get(address);
    if (tile?.status !== 'loaded') return;
    loadedTiles.set(address, { ...tile, lastAccessedAt: Date.now() });
    set({ loadedTiles: new Map(loadedTiles) });
  },

  evictTile: (address) => {
    const { loadedTiles, gpuMemoryUsedBytes } = get();
    const tile = loadedTiles.get(address);
    if (!tile) return;
    const freed = tile.status === 'loaded' ? tile.sizeBytes : 0;
    loadedTiles.delete(address);
    set({
      loadedTiles: new Map(loadedTiles),
      gpuMemoryUsedBytes: Math.max(0, gpuMemoryUsedBytes - freed),
      tilesInMemory: loadedTiles.size,
    });
  },

  evictLRU: (targetBytes) => {
    const { loadedTiles, gpuMemoryUsedBytes } = get();
    const loaded = [...loadedTiles.entries()]
      .filter(
        (entry): entry is [TileAddress, Extract<TileLoadState, { status: 'loaded' }>] =>
          entry[1].status === 'loaded',
      )
      .sort(([, a], [, b]) => a.lastAccessedAt - b.lastAccessedAt);

    let freed = 0;
    for (const [address, tile] of loaded) {
      if (freed >= targetBytes) break;
      loadedTiles.delete(address);
      freed += tile.sizeBytes;
    }

    set({
      loadedTiles: new Map(loadedTiles),
      gpuMemoryUsedBytes: Math.max(0, gpuMemoryUsedBytes - freed),
      tilesInMemory: loadedTiles.size,
    });
  },

  updateCacheHitRate: (rate) => set({ cacheHitRate: rate }),

  resetToDefault: () => set(freshDefaultState()),
}));
