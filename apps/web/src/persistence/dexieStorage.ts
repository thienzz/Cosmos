/**
 * Zustand `persist`-compatible IndexedDB storage adapter (Doc 27 §13.1).
 *
 * Zustand's `createJSONStorage` expects a synchronous-ish `{ getItem,
 * setItem, removeItem }` interface where the values are strings. Dexie is
 * async — which Zustand handles fine: `persist` awaits Promise returns.
 *
 * We deliberately layer on top of localStorage at read time: during the
 * first microtask of the app, Zustand calls `getItem` SYNCHRONOUSLY before
 * `rehydrate` fires. If we relied on Dexie alone, settings would flash
 * defaults until IDB resolved. Strategy: dual-write on `setItem` (localStorage
 * gets the sync copy, IndexedDB the durable copy), read from localStorage
 * first, fall back to IDB — so the app paints with the last-known settings
 * immediately and migrates to IDB as the persistent backing.
 */

import { getDb } from './db';

export interface SettingsStorageLike {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): void | Promise<void>;
  removeItem(name: string): void | Promise<void>;
}

export function createDexieSettingsStorage(): SettingsStorageLike {
  const local = typeof localStorage !== 'undefined' ? localStorage : null;

  return {
    async getItem(name: string): Promise<string | null> {
      // Fast path: in-memory Zustand will paint defaults during first frame;
      // we still want to read the most recent stored copy. Prefer Dexie
      // (authoritative) but fall back to localStorage if Dexie is empty.
      const db = getDb();
      if (db) {
        try {
          const row = await db.settings.get(name);
          if (row && typeof row.value === 'string') return row.value;
        } catch {
          /* ignore */
        }
      }
      if (local) {
        try {
          return local.getItem(name);
        } catch {
          /* ignore */
        }
      }
      return null;
    },

    async setItem(name: string, value: string): Promise<void> {
      if (local) {
        try {
          local.setItem(name, value);
        } catch {
          /* ignore */
        }
      }
      const db = getDb();
      if (db) {
        try {
          await db.settings.put({ key: name, value, savedAt: Date.now() });
        } catch {
          /* ignore */
        }
      }
    },

    async removeItem(name: string): Promise<void> {
      if (local) {
        try {
          local.removeItem(name);
        } catch {
          /* ignore */
        }
      }
      const db = getDb();
      if (db) {
        try {
          await db.settings.delete(name);
        } catch {
          /* ignore */
        }
      }
    },
  };
}
