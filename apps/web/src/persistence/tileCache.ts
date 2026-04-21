/**
 * IndexedDB tile cache (Doc 27 §13.2 middle tier, Doc 12 §5, 500 MB budget).
 *
 * Responsibilities:
 *   - `put(address, version, buffer)` — write + refresh last-access timestamp.
 *   - `get(address)` — read + touch LRU. Returns `null` on miss.
 *   - `hasSpace(required)` — predicate so the streaming manager can
 *     pre-evict before writing.
 *   - `evictLRU(targetBytes)` — evict least-recently-accessed tiles until
 *     `targetBytes` have been freed (or the cache is empty). Triggered both
 *     proactively on put() and reactively on `data_version_update`.
 *   - `clearVersion(version)` — delete everything stamped with a stale
 *     manifest version (invoked on version bump).
 *
 * Everything is wrapped in try/catch: the streaming manager degrades
 * gracefully to network-only when IndexedDB fails (quota, private mode).
 */

import { getDb, type StoredTile } from './db';

/** Doc 27 §8.5: IndexedDB budget. */
export const DEFAULT_IDB_BUDGET_BYTES = 500 * 1024 * 1024;

export interface TileCacheOptions {
  budgetBytes?: number;
  /** Time source override for tests. Default `Date.now`. */
  now?: () => number;
}

export interface TileCachePutResult {
  stored: boolean;
  evictedBytes: number;
}

export interface TileCacheStats {
  count: number;
  bytes: number;
  budgetBytes: number;
}

export class TileDiskCache {
  private readonly budgetBytes: number;
  private readonly now: () => number;

  constructor(options: TileCacheOptions = {}) {
    this.budgetBytes = options.budgetBytes ?? DEFAULT_IDB_BUDGET_BYTES;
    this.now = options.now ?? Date.now;
  }

  /** Current disk byte footprint. O(n) — intended for telemetry, not hot paths. */
  async stats(): Promise<TileCacheStats> {
    const db = getDb();
    if (!db) return { count: 0, bytes: 0, budgetBytes: this.budgetBytes };
    try {
      const entries = await db.tiles.toArray();
      const bytes = entries.reduce((acc, tile) => acc + (tile.sizeBytes ?? 0), 0);
      return { count: entries.length, bytes, budgetBytes: this.budgetBytes };
    } catch {
      return { count: 0, bytes: 0, budgetBytes: this.budgetBytes };
    }
  }

  async get(address: string): Promise<ArrayBuffer | null> {
    const db = getDb();
    if (!db) return null;
    try {
      const tile = await db.tiles.get(address);
      if (!tile) return null;
      // Touch LRU. Fire-and-forget — a failed touch is survivable.
      db.tiles
        .update(address, { lastAccessedAt: this.now() })
        .catch(() => undefined);
      return tile.buffer;
    } catch {
      return null;
    }
  }

  async put(address: string, version: string, buffer: ArrayBuffer): Promise<TileCachePutResult> {
    const db = getDb();
    if (!db) return { stored: false, evictedBytes: 0 };

    const sizeBytes = buffer.byteLength;
    let evictedBytes = 0;

    try {
      const stats = await this.stats();
      const projected = stats.bytes + sizeBytes;
      if (projected > this.budgetBytes) {
        const overflow = projected - this.budgetBytes;
        evictedBytes = await this.evictLRU(overflow);
      }

      const now = this.now();
      await db.tiles.put({
        address,
        version,
        buffer,
        sizeBytes,
        lastAccessedAt: now,
        loadedAt: now,
      });
      return { stored: true, evictedBytes };
    } catch {
      return { stored: false, evictedBytes };
    }
  }

  async delete(address: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      await db.tiles.delete(address);
    } catch {
      /* ignore */
    }
  }

  /**
   * Evict least-recently-accessed tiles until at least `targetBytes` have
   * been freed. Returns the byte count actually freed.
   */
  async evictLRU(targetBytes: number): Promise<number> {
    if (targetBytes <= 0) return 0;
    const db = getDb();
    if (!db) return 0;

    let freed = 0;
    try {
      // Order scans by lastAccessedAt ascending (oldest first). `orderBy`
      // uses the index we declared in `db.ts`.
      const sorted: StoredTile[] = await db.tiles.orderBy('lastAccessedAt').toArray();
      const toDelete: string[] = [];
      for (const tile of sorted) {
        if (freed >= targetBytes) break;
        toDelete.push(tile.address);
        freed += tile.sizeBytes ?? 0;
      }
      if (toDelete.length > 0) {
        await db.tiles.bulkDelete(toDelete);
      }
    } catch {
      /* ignore */
    }
    return freed;
  }

  /** Drop every tile stamped with a stale manifest version. */
  async clearVersion(version: string): Promise<number> {
    const db = getDb();
    if (!db) return 0;
    try {
      return await db.tiles.where('version').equals(version).delete();
    } catch {
      return 0;
    }
  }

  /** Drop every tile whose version does NOT match `keepVersion`. */
  async keepOnlyVersion(keepVersion: string): Promise<number> {
    const db = getDb();
    if (!db) return 0;
    try {
      return await db.tiles.where('version').notEqual(keepVersion).delete();
    } catch {
      return 0;
    }
  }

  async clear(): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      await db.tiles.clear();
    } catch {
      /* ignore */
    }
  }
}
