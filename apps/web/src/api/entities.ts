/**
 * Entity endpoints (Doc 26 §5).
 *
 * Module-scoped LRU (cap 500) sits on top of the client's ETag cache.
 * Why two layers? The ETag cache skips the response body parse; the LRU
 * skips the network round-trip entirely for hot entities (the currently
 * selected body, its neighbours). Both are invalidated on
 * `data_version_update` WS frames once T19 wires them.
 */

import { apiGet, clearEtagCache, ApiError } from './client';
import type { ApiEntity } from './types';

const MAX_ENTRIES = 500;
const lru = new Map<string, ApiEntity>();

function remember(key: string, entity: ApiEntity): void {
  if (lru.has(key)) lru.delete(key);
  lru.set(key, entity);
  if (lru.size > MAX_ENTRIES) {
    const oldest = lru.keys().next().value;
    if (oldest !== undefined) lru.delete(oldest);
  }
}

function bump(key: string): ApiEntity | undefined {
  const cached = lru.get(key);
  if (!cached) return undefined;
  lru.delete(key);
  lru.set(key, cached);
  return cached;
}

export function clearEntityCache(): void {
  lru.clear();
  clearEtagCache();
}

export function peekEntityCache(id: number): ApiEntity | undefined {
  return lru.get(`id:${id}`);
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export interface EntityFetchOptions {
  /** `fields=…` sparse fieldset (Doc 26 §16.3). Applied on miss only. */
  fields?: string[];
  /** Skip LRU + ETag. Forces a fresh GET. */
  bypassCache?: boolean;
  signal?: AbortSignal;
}

function query(opts: EntityFetchOptions): Record<string, string> | undefined {
  if (!opts.fields || opts.fields.length === 0) return undefined;
  return { fields: opts.fields.join(',') };
}

/** `GET /entities/{id}`. Throws {@link ApiError} on non-2xx. */
export async function getEntity(
  id: number,
  opts: EntityFetchOptions = {},
): Promise<ApiEntity> {
  if (!Number.isInteger(id) || id < 0) {
    throw new ApiError(
      {
        code: 'INVALID_ID',
        message: `Invalid entity id: ${id}`,
        status: 400,
        request_id: 'client',
      },
      400,
    );
  }
  const key = `id:${id}`;
  if (!opts.bypassCache) {
    const hit = bump(key);
    if (hit) return hit;
  }
  const entity = await apiGet<ApiEntity>(`/entities/${id}`, {
    query: query(opts),
    signal: opts.signal,
    bypassCache: opts.bypassCache,
  });
  remember(key, entity);
  // Cross-index by ent_id so the ENT-xxxx fetcher sees the same object.
  if (entity.ent_id) remember(`ent:${entity.ent_id}`, entity);
  return entity;
}

/**
 * `GET /entities/catalog/{catalog}/{id}` — T51 catalog-prefix resolver.
 * Routes parsed prefixes like `HD 48915` / `Messier 31` / `NGC 224` directly
 * to the definitive catalog endpoint (Doc 26 §5.3) instead of running a
 * fuzzy text search. Returns the same `ApiEntity` shape as §5.1.
 *
 * `catalog` must be one of the keys listed in Doc 26 §5.3 "Supported
 * Catalogs" (messier, ngc, ic, hip, gaia, hd, sao, tycho2, sdss, mpc).
 */
export async function getEntityByCatalog(
  catalog: string,
  id: string,
  opts: EntityFetchOptions = {},
): Promise<ApiEntity> {
  const normalisedCatalog = catalog.toLowerCase();
  const normalisedId = id.trim();
  if (normalisedCatalog.length === 0 || normalisedId.length === 0) {
    throw new ApiError(
      {
        code: 'INVALID_ID',
        message: `catalog + id required (got ${catalog}/${id})`,
        status: 400,
        request_id: 'client',
      },
      400,
    );
  }
  const key = `cat:${normalisedCatalog}:${normalisedId.toLowerCase()}`;
  if (!opts.bypassCache) {
    const hit = bump(key);
    if (hit) return hit;
  }
  const path = `/entities/catalog/${encodeURIComponent(normalisedCatalog)}/${encodeURIComponent(normalisedId)}`;
  const entity = await apiGet<ApiEntity>(path, {
    query: query(opts),
    signal: opts.signal,
    bypassCache: opts.bypassCache,
  });
  remember(key, entity);
  // Cross-index so a later `getEntity(id)` or `getEntityByEntId` hits the
  // cache without a second round-trip.
  remember(`id:${entity.id}`, entity);
  if (entity.ent_id) remember(`ent:${entity.ent_id}`, entity);
  return entity;
}

/** `GET /entities/ent/{entId}` — flagship by 4-digit ENT code. */
export async function getEntityByEntId(
  entId: string,
  opts: EntityFetchOptions = {},
): Promise<ApiEntity> {
  if (!/^ENT-\d{4}$/i.test(entId)) {
    throw new ApiError(
      {
        code: 'INVALID_ID',
        message: `ent_id must match ENT-dddd (got ${entId})`,
        status: 400,
        request_id: 'client',
      },
      400,
    );
  }
  const normalised = entId.toUpperCase();
  const key = `ent:${normalised}`;
  if (!opts.bypassCache) {
    const hit = bump(key);
    if (hit) return hit;
  }
  const entity = await apiGet<ApiEntity>(`/entities/ent/${normalised}`, {
    query: query(opts),
    signal: opts.signal,
    bypassCache: opts.bypassCache,
  });
  remember(key, entity);
  remember(`id:${entity.id}`, entity);
  return entity;
}
