/**
 * TileStreamingManager — Doc 27 §8 pipeline orchestrator.
 *
 *   Camera update → priority list → fetch (≤6 concurrent) → decode → store
 *
 * Responsibilities:
 *   - Accept external priority hints (from `CosmosWebSocket.onTilePriority`
 *     or from a frustum-cull worker in a later iteration) and merge them
 *     into a persistent priority queue.
 *   - Cap concurrent fetches at 6 (browser HTTP/2 stream limit per origin).
 *   - Three-tier lookup on each address: in-memory tile store → IndexedDB
 *     (`TileDiskCache`) → network (`fetchTileByAddress`).
 *   - Graceful fallback on 404 / parse errors — mark the tile failed and
 *     drop it from the queue so we don't thrash on it.
 *   - LRU eviction when in-memory budget would be exceeded; budget comes
 *     from `tileStore.gpuMemoryBudgetBytes` (default 192 MB, Doc 27 §8.5).
 *
 * This manager is the ONLY module that drives the tileStore's
 * `markTileLoading` / `markTileLoaded` / `markTileFailed` actions. The
 * frustum-cull worker lands in a later pass (octree-backed culling); until
 * then, the WebSocket `tile_priority` frame is the only external priority
 * source.
 */

import { ApiError } from '../api/client';
import { fetchTileByAddress, type TileFetchOptions } from '../api/tiles';
import { TileDiskCache } from '../persistence/tileCache';
import { useTileStore } from '../stores/tileStore';
import type { ScaleRegime, TileAddress } from '../stores/types';

import { isAddressRelevantForRegime } from './ScaleRegimeController';

export const DEFAULT_MAX_CONCURRENT_FETCHES = 6;

export interface TileStreamingManagerOptions {
  /** Cap for in-flight fetches. Default 6 (Doc 27 §8.3 — browser HTTP/2 limit). */
  maxConcurrent?: number;
  /** IDB cache instance (test override). Default: new TileDiskCache(). */
  diskCache?: TileDiskCache;
  /** Fetcher override — signature matches `fetchTileByAddress`. */
  fetcher?: (address: string, opts: TileFetchOptions) => ReturnType<typeof fetchTileByAddress>;
  /**
   * Optional sink called after a tile lands in the in-memory store. Use this
   * to hand the ArrayBuffer to a decode worker or straight to a renderer.
   */
  onTileLoaded?: (address: TileAddress, buffer: ArrayBuffer) => void;
  /** Optional error sink. Fires on permanent failures (404s, decode errors). */
  onTileFailed?: (address: TileAddress, error: Error) => void;
  /**
   * T25 — active scale regime. Enqueued hints whose tile kind isn't visible
   * in the current regime are dropped (no fetch, no queue entry). Defaults
   * to `null` which disables the filter (accept everything — back-compat
   * with pre-T25 callers).
   */
  activeRegime?: ScaleRegime | null;
}

interface QueueEntry {
  address: TileAddress;
  priority: number;
  estimatedSize: number;
  enqueuedAt: number;
}

export interface EnqueueHint {
  address: TileAddress;
  priority: number;
  estimatedSize?: number;
}

export class TileStreamingManager {
  private readonly maxConcurrent: number;
  private readonly diskCache: TileDiskCache;
  private readonly fetcher: NonNullable<TileStreamingManagerOptions['fetcher']>;
  private readonly onTileLoaded: TileStreamingManagerOptions['onTileLoaded'];
  private readonly onTileFailed: TileStreamingManagerOptions['onTileFailed'];

  /** Priority queue — highest-priority first. Max size bounded by manifest scope. */
  private readonly queue: QueueEntry[] = [];
  /** Quick `has`-check so we don't double-queue. */
  private readonly queuedSet = new Set<TileAddress>();
  private readonly inFlight = new Map<TileAddress, AbortController>();

  private cacheAttempts = 0;
  private cacheHits = 0;
  private disposed = false;
  private activeRegime: ScaleRegime | null;
  /** Addresses dropped this session because their tile kind didn't match
   *  the active regime. Exposed as a counter for smoke tests + telemetry. */
  private regimeFilteredCount = 0;

  // T-E-08 network-stat telemetry. Counters feed `/metrics` and the
  // streaming smoke-test `preview_eval` block; they're distinct from the
  // local-disk hit counters because a server-side cache (`x-cache: HIT`)
  // still counts as a network fetch — it just shows how effective the
  // CDN / Rust L1 is, not our IDB layer.
  private networkFetches = 0;
  private networkFetchMsTotal = 0;
  private networkFetchMsLastSample = 0;
  private serverCacheHits = 0;
  private serverCacheMisses = 0;

  constructor(options: TileStreamingManagerOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? DEFAULT_MAX_CONCURRENT_FETCHES;
    this.diskCache = options.diskCache ?? new TileDiskCache();
    this.fetcher = options.fetcher ?? ((address, opts) => fetchTileByAddress(address, opts));
    this.onTileLoaded = options.onTileLoaded;
    this.onTileFailed = options.onTileFailed;
    this.activeRegime = options.activeRegime ?? null;
  }

  /** Test helper — exposes the live disk cache so callers can stat/clear it. */
  getDiskCache(): TileDiskCache {
    return this.diskCache;
  }

  /** How many addresses are queued but not yet in-flight. */
  pendingCount(): number {
    return this.queue.length;
  }

  /** How many addresses currently have outstanding fetch requests. */
  inFlightCount(): number {
    return this.inFlight.size;
  }

  /** Active scale regime (or `null` → filter disabled). */
  getActiveRegime(): ScaleRegime | null {
    return this.activeRegime;
  }

  /** Diagnostic — how many enqueue hints have been rejected by the regime
   *  filter since construction. */
  getRegimeFilteredCount(): number {
    return this.regimeFilteredCount;
  }

  /**
   * Snapshot of network fetch stats (T-E-08). Exposes rollup numbers the
   * smoke tests and `/metrics` can use to verify tile streaming is
   * actually hitting the Rust tile server and getting warm responses.
   *
   * `serverCacheHitRate` is the rate of `x-cache: HIT` responses across
   * fetches that returned an `x-cache` header — `null` when no server
   * reported it (older server, misconfigured edge, or mock fetcher).
   */
  getNetworkStats(): {
    fetches: number;
    avgFetchMs: number;
    lastFetchMs: number;
    serverCacheHits: number;
    serverCacheMisses: number;
    serverCacheHitRate: number | null;
  } {
    const total = this.serverCacheHits + this.serverCacheMisses;
    return {
      fetches: this.networkFetches,
      avgFetchMs:
        this.networkFetches === 0 ? 0 : this.networkFetchMsTotal / this.networkFetches,
      lastFetchMs: this.networkFetchMsLastSample,
      serverCacheHits: this.serverCacheHits,
      serverCacheMisses: this.serverCacheMisses,
      serverCacheHitRate: total === 0 ? null : this.serverCacheHits / total,
    };
  }

  /**
   * Update the active regime. When the regime changes we also drop any
   * *queued* (not yet in-flight) addresses that the new regime doesn't need
   * — keeping the pipeline focused on what the user can actually see and
   * freeing concurrency slots for the incoming regime's tiles. In-flight
   * fetches are left to complete: they're already bandwidth-spent, and
   * canceling mid-stream would not save network work.
   */
  setActiveRegime(regime: ScaleRegime | null): void {
    if (regime === this.activeRegime) return;
    this.activeRegime = regime;
    if (regime === null) return;
    // Prune queue: drop addresses that aren't in the new regime's kind set.
    if (this.queue.length > 0) {
      const kept: QueueEntry[] = [];
      for (const entry of this.queue) {
        if (isAddressRelevantForRegime(entry.address, regime)) {
          kept.push(entry);
        } else {
          this.queuedSet.delete(entry.address);
          this.regimeFilteredCount++;
        }
      }
      this.queue.length = 0;
      this.queue.push(...kept);
    }
    this.pump();
  }

  /**
   * Bulk-enqueue. Duplicate addresses have their priority raised to the
   * larger value (lead-in keystroke raises priority monotonically).
   */
  enqueue(hints: readonly EnqueueHint[]): void {
    if (this.disposed || hints.length === 0) return;
    const tileStore = useTileStore.getState();
    for (const hint of hints) {
      // T25 — drop hints whose tile kind isn't visible in the active regime
      // (Doc 27 §9.3). `activeRegime=null` disables the filter.
      if (
        this.activeRegime !== null &&
        !isAddressRelevantForRegime(hint.address, this.activeRegime)
      ) {
        this.regimeFilteredCount++;
        continue;
      }

      const loaded = tileStore.loadedTiles.get(hint.address);
      if (loaded?.status === 'loaded') continue;

      if (this.queuedSet.has(hint.address)) {
        // Raise priority if the new hint is stronger.
        const existing = this.queue.find((e) => e.address === hint.address);
        if (existing && hint.priority > existing.priority) {
          existing.priority = hint.priority;
        }
        continue;
      }
      if (this.inFlight.has(hint.address)) continue;

      this.queue.push({
        address: hint.address,
        priority: hint.priority,
        estimatedSize: hint.estimatedSize ?? 0,
        enqueuedAt: Date.now(),
      });
      this.queuedSet.add(hint.address);
    }
    this.pump();
  }

  /** Drop every pending request and abort in-flight fetches. */
  clear(): void {
    this.queue.length = 0;
    this.queuedSet.clear();
    for (const controller of this.inFlight.values()) {
      controller.abort();
    }
    this.inFlight.clear();
  }

  /** Release handles; safe to call after `clear()`. */
  dispose(): void {
    this.disposed = true;
    this.clear();
  }

  /**
   * Force-kick a drain cycle — useful after a WebSocket `tile_priority` frame
   * or when enqueue() has already been called but budget allowed more slots.
   */
  kick(): void {
    this.pump();
  }

  /**
   * P3 — recompute priorities for every queued (not-yet-in-flight) address
   * from a `(address) -> priority` supplier. Typically called from the
   * render loop with a camera-distance function so the queue front mirrors
   * the camera's current vantage point without having to clear + re-enqueue.
   *
   * Entries whose supplier returns `undefined` are left at their existing
   * priority. Entries whose priority went negative are dropped from the
   * queue (caller-controlled eviction for "outside the view frustum" tiles).
   * The next {@link pump} will re-sort the queue so the new ordering applies
   * on the very next free fetch slot.
   */
  reprioritize(
    supplier: (address: TileAddress) => number | undefined,
  ): void {
    if (this.queue.length === 0) return;
    const kept: QueueEntry[] = [];
    for (const entry of this.queue) {
      const next = supplier(entry.address);
      if (next === undefined) {
        kept.push(entry);
        continue;
      }
      if (next < 0) {
        // Caller signalled "drop this one" — remove from the queued set so a
        // later enqueue() can resurrect it.
        this.queuedSet.delete(entry.address);
        continue;
      }
      entry.priority = next;
      kept.push(entry);
    }
    this.queue.length = 0;
    this.queue.push(...kept);
    this.pump();
  }

  // -------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------

  private pump(): void {
    if (this.disposed) return;
    while (this.inFlight.size < this.maxConcurrent && this.queue.length > 0) {
      this.queue.sort((a, b) => b.priority - a.priority);
      const next = this.queue.shift();
      if (!next) break;
      this.queuedSet.delete(next.address);
      this.dispatch(next).catch(() => undefined);
    }
  }

  private async dispatch(entry: QueueEntry): Promise<void> {
    const { address } = entry;
    const controller = new AbortController();
    this.inFlight.set(address, controller);
    const tileStore = useTileStore.getState();
    tileStore.markTileLoading(address);

    try {
      // Tier 1: IndexedDB cache.
      this.cacheAttempts += 1;
      const cached = await this.diskCache.get(address);
      if (cached) {
        this.cacheHits += 1;
        this.recordLoaded(address, cached);
        return;
      }

      // Tier 2: network.
      const manifestVersion = useTileStore.getState().manifestVersion ?? 'unknown';
      const response = await this.fetcher(address, { signal: controller.signal });
      if (controller.signal.aborted) return;

      // Roll up network-fetch telemetry (T-E-08).
      this.networkFetches += 1;
      this.networkFetchMsLastSample = response.fetchDurationMs;
      this.networkFetchMsTotal += response.fetchDurationMs;
      if (response.serverCache === 'HIT') {
        this.serverCacheHits += 1;
      } else if (response.serverCache === 'MISS') {
        this.serverCacheMisses += 1;
      }

      // Stamp the disk copy with the CURRENT manifest version so a later
      // data_version_update can sweep stale tiles without diffing individual
      // blobs.
      const version = response.version ?? manifestVersion;
      this.recordLoaded(address, response.buffer);
      this.diskCache.put(address, version, response.buffer).catch(() => undefined);
    } catch (error) {
      if (controller.signal.aborted) return;
      this.recordFailed(address, error);
    } finally {
      this.inFlight.delete(address);
      this.updateCacheHitRate();
      this.pump();
    }
  }

  private recordLoaded(address: TileAddress, buffer: ArrayBuffer): void {
    const tileStore = useTileStore.getState();
    // Pre-evict if adding this buffer would breach the GPU budget.
    const projected = tileStore.gpuMemoryUsedBytes + buffer.byteLength;
    if (projected > tileStore.gpuMemoryBudgetBytes) {
      tileStore.evictLRU(projected - tileStore.gpuMemoryBudgetBytes);
    }
    useTileStore.getState().markTileLoaded(address, buffer);
    this.onTileLoaded?.(address, buffer);
  }

  private recordFailed(address: TileAddress, error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const code = error instanceof ApiError ? error.code : err.message;
    useTileStore.getState().markTileFailed(address, code);
    this.onTileFailed?.(address, err);
  }

  private updateCacheHitRate(): void {
    if (this.cacheAttempts === 0) return;
    useTileStore.getState().updateCacheHitRate(this.cacheHits / this.cacheAttempts);
  }
}

/**
 * Parse a `WsTilePriorityMessage` payload into `EnqueueHint`s. Accepts the
 * versioned URL (`/v1/tiles/stars/3/12/5/2`) or bare suffix; strips the
 * `/v1/tiles/` prefix so the manager key matches the manifest address.
 */
export function tilePriorityHintsFromWsUrls(
  urls: ReadonlyArray<{ url: string; priority: number }>,
): EnqueueHint[] {
  return urls.map(({ url, priority }) => ({
    address: normaliseTileUrl(url),
    priority,
  }));
}

function normaliseTileUrl(url: string): TileAddress {
  // Strip leading slashes + optional versioning + `tiles/` prefix.
  const cleaned = url
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/+/, '')
    .replace(/^v\d+\//, '')
    .replace(/^tiles\//, '');
  return cleaned;
}
