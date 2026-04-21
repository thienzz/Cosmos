import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_GPU_MEMORY_BUDGET_BYTES, useTileStore } from '../tileStore.js';
import type { TileManifest } from '../types.js';

const manifest = (version: string): TileManifest => ({
  version,
  generatedAt: '2026-04-19T00:00:00Z',
  totalTiles: 1024,
  totalBytes: 1_000_000,
  lodLevels: 4,
});

function makeBuffer(bytes: number): ArrayBuffer {
  return new ArrayBuffer(bytes);
}

function advanceClock(): Promise<void> {
  // vitest's jsdom env shares a single clock; resolve a microtask then tick Date
  return new Promise((resolve) => setTimeout(resolve, 2));
}

describe('tileStore', () => {
  beforeEach(() => {
    useTileStore.getState().resetToDefault();
  });

  it('starts with empty collections and the mid-tier GPU budget', () => {
    const state = useTileStore.getState();
    expect(state.loadedTiles.size).toBe(0);
    expect(state.pendingTiles.size).toBe(0);
    expect(state.manifest).toBeNull();
    expect(state.manifestVersion).toBeNull();
    expect(state.gpuMemoryBudgetBytes).toBe(DEFAULT_GPU_MEMORY_BUDGET_BYTES);
    expect(state.gpuMemoryUsedBytes).toBe(0);
    expect(state.tilesInMemory).toBe(0);
  });

  it('setManifest stores the manifest and captures its version', () => {
    useTileStore.getState().setManifest(manifest('v1'));
    const state = useTileStore.getState();
    expect(state.manifest?.version).toBe('v1');
    expect(state.manifestVersion).toBe('v1');
  });

  it('invalidateManifest replaces version and drops cached tiles', () => {
    const store = useTileStore.getState();
    store.setManifest(manifest('v1'));
    store.markTileLoaded('stars/0/0/0', makeBuffer(100));
    store.invalidateManifest('v2');
    const state = useTileStore.getState();
    expect(state.manifest).toBeNull();
    expect(state.manifestVersion).toBe('v2');
    expect(state.loadedTiles.size).toBe(0);
  });

  it('markTileLoading adds to pending; markTileLoaded removes and accounts bytes', () => {
    const store = useTileStore.getState();
    store.markTileLoading('stars/0/0/0');
    expect(useTileStore.getState().pendingTiles.has('stars/0/0/0')).toBe(true);

    store.markTileLoaded('stars/0/0/0', makeBuffer(2048));
    const after = useTileStore.getState();
    expect(after.pendingTiles.has('stars/0/0/0')).toBe(false);
    expect(after.gpuMemoryUsedBytes).toBe(2048);
    expect(after.tilesInMemory).toBe(1);
    const entry = after.loadedTiles.get('stars/0/0/0');
    expect(entry?.status).toBe('loaded');
  });

  it('markTileFailed records the error and increments retryCount on re-fail', () => {
    const store = useTileStore.getState();
    store.markTileFailed('stars/1/0/0', 'ECONN');
    let entry = useTileStore.getState().loadedTiles.get('stars/1/0/0');
    expect(entry?.status).toBe('failed');
    if (entry?.status === 'failed') expect(entry.retryCount).toBe(1);

    store.markTileFailed('stars/1/0/0', 'ECONN');
    entry = useTileStore.getState().loadedTiles.get('stars/1/0/0');
    if (entry?.status === 'failed') expect(entry.retryCount).toBe(2);
  });

  it('evictTile frees memory and removes the entry', () => {
    const store = useTileStore.getState();
    store.markTileLoaded('stars/0/0/0', makeBuffer(1024));
    store.evictTile('stars/0/0/0');
    const state = useTileStore.getState();
    expect(state.loadedTiles.size).toBe(0);
    expect(state.gpuMemoryUsedBytes).toBe(0);
  });

  it('evictLRU frees the least-recently-accessed tiles up to targetBytes', async () => {
    const store = useTileStore.getState();
    store.markTileLoaded('a', makeBuffer(1000));
    await advanceClock();
    store.markTileLoaded('b', makeBuffer(1500));
    await advanceClock();
    store.markTileLoaded('c', makeBuffer(2000));
    await advanceClock();
    // Touch 'a' so it becomes the most-recently-accessed.
    store.touchTile('a');

    store.evictLRU(2500);
    const state = useTileStore.getState();
    // 'b' (1500) should have been evicted first, then 'c' (2000) since we still need 1000 bytes.
    expect(state.loadedTiles.has('a')).toBe(true);
    expect(state.loadedTiles.has('b')).toBe(false);
    expect(state.loadedTiles.has('c')).toBe(false);
    expect(state.gpuMemoryUsedBytes).toBe(1000);
  });

  it('setGpuBudget and updateCacheHitRate update single fields', () => {
    const store = useTileStore.getState();
    store.setGpuBudget(256 * 1024 * 1024);
    store.updateCacheHitRate(0.82);
    const state = useTileStore.getState();
    expect(state.gpuMemoryBudgetBytes).toBe(256 * 1024 * 1024);
    expect(state.cacheHitRate).toBeCloseTo(0.82);
  });

  it('resetToDefault clears tiles and memory accounting', () => {
    const store = useTileStore.getState();
    store.markTileLoaded('stars/0/0/0', makeBuffer(100));
    store.updateCacheHitRate(0.5);
    store.resetToDefault();
    const state = useTileStore.getState();
    expect(state.loadedTiles.size).toBe(0);
    expect(state.gpuMemoryUsedBytes).toBe(0);
    expect(state.cacheHitRate).toBe(0);
  });
});
