/**
 * Dexie-backed IndexedDB schema for Cosmos Explorer (Doc 27 §13.1).
 *
 * Tables:
 *   - tiles:      raw ArrayBuffers keyed by `address`. Source of truth for the
 *                 middle cache tier (Doc 27 §13.2). LRU eviction at 500 MB.
 *   - manifest:   the single cached manifest document, keyed by version so a
 *                 `data_version_update` can replace it atomically.
 *   - settings:   a k-v backup of the persisted Zustand store (Doc 27 §5.7).
 *   - bookmarks / observations: placeholders for T32+ user-data flows; we
 *                 declare the shape now so `db.version(1)` stays stable.
 *
 * The database itself is lazy-constructed so tests that swap in a `fake-
 * indexeddb` shim can call `resetDatabase()` between runs and stay hermetic.
 */

import Dexie, { type Table } from 'dexie';

export const DB_NAME = 'CosmosExplorer';
export const DB_VERSION = 1;

export interface StoredTile {
  /** `stars/3/12/5/2`, `galaxies/1024`, `cosmic-web/0` — matches the URL suffix. */
  address: string;
  /** Manifest version this tile was fetched for. Mismatches trigger eviction. */
  version: string;
  /** Raw bytes straight from the tile server. */
  buffer: ArrayBuffer;
  sizeBytes: number;
  /** Wall-clock millis — LRU key. */
  lastAccessedAt: number;
  loadedAt: number;
}

export interface StoredManifest {
  version: string;
  generatedAt: string;
  /** Parsed manifest JSON (TileManifestDocument). */
  payload: unknown;
  savedAt: number;
}

export interface StoredSetting {
  key: string;
  value: unknown;
  savedAt: number;
}

export class CosmosExplorerDb extends Dexie {
  public tiles!: Table<StoredTile, string>;
  public manifest!: Table<StoredManifest, string>;
  public settings!: Table<StoredSetting, string>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores({
      // `&address` is the primary key; extra indices power the LRU scan.
      tiles: '&address, version, lastAccessedAt, sizeBytes',
      manifest: '&version, savedAt',
      settings: '&key',
    });
  }
}

let singleton: CosmosExplorerDb | null = null;

/**
 * Open (and memoise) the Cosmos Explorer database. Returns `null` if the
 * runtime has no IndexedDB (SSR, ancient browsers). Callers must cope.
 */
export function getDb(): CosmosExplorerDb | null {
  if (singleton !== null) return singleton;
  if (typeof indexedDB === 'undefined') return null;
  singleton = new CosmosExplorerDb();
  return singleton;
}

/** Test-only: close the live DB and drop the memoised reference. */
export async function resetDatabaseForTest(): Promise<void> {
  if (singleton) {
    try {
      singleton.close();
    } catch {
      /* ignore */
    }
    singleton = null;
  }
}

/** Test-only: point the singleton at a caller-owned DB (e.g. with a fake name). */
export function setDbForTest(db: CosmosExplorerDb | null): void {
  singleton = db;
}
