/**
 * Tile-manifest IndexedDB cache (Doc 27 §13.2).
 *
 * The manifest is ~5 MB compressed; once decoded we want to keep it across
 * reloads so cold starts avoid the network hop. On a `data_version_update`
 * frame we replace the stored record atomically — the cache only ever holds
 * one manifest at a time.
 */

import { getDb } from './db';

export interface CachedManifest {
  version: string;
  generatedAt: string;
  payload: unknown;
}

export class ManifestDiskCache {
  async save(record: CachedManifest): Promise<boolean> {
    const db = getDb();
    if (!db) return false;
    try {
      // Keep a single row: drop old versions atomically.
      await db.transaction('rw', db.manifest, async () => {
        await db.manifest.clear();
        await db.manifest.put({
          version: record.version,
          generatedAt: record.generatedAt,
          payload: record.payload,
          savedAt: Date.now(),
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  async load(): Promise<CachedManifest | null> {
    const db = getDb();
    if (!db) return null;
    try {
      const rows = await db.manifest.orderBy('savedAt').reverse().limit(1).toArray();
      const top = rows[0];
      if (!top) return null;
      return { version: top.version, generatedAt: top.generatedAt, payload: top.payload };
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      await db.manifest.clear();
    } catch {
      /* ignore */
    }
  }
}
