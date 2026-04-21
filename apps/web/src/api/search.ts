/**
 * Search endpoints (Doc 26 §6).
 *
 *   - `searchAutocomplete(q)` — §6.2, <50 ms P95 target. Returns highlighted
 *     suggestions for the top-nav dropdown.
 *   - `searchText(q, opts)` — §6.1, full-text with pagination + filters.
 *   - `searchCone(ra, dec, radius)` — §6.3, spatial query used by T19 future
 *     "nearby objects" affordance; the typed entry point lives here so future
 *     UI can consume it without re-rolling.
 *
 * Autocomplete answers are cached in a 100-query LRU (Doc 27 §7.2) so the
 * user can backspace / retype without hammering the server. The cache is
 * invalidated when the WebSocket data_version_update frame fires (T19
 * handshake lives in a later task — for now we expose `clearAutocompleteCache`
 * so the WS manager can call it).
 */

import { searchLocalAutocomplete, searchLocalText } from '@/data/localSearchIndex';

import { ApiError, apiGet, apiGetCollection, type CollectionResult } from './client';
import type { ApiCatalogIds, ApiCollectionEnvelope, ApiEnvelope } from './types';

/**
 * Doc 26 §6 resilience: when the backend is unreachable (network error)
 * or returns a 5xx/503 (SERVICE_UNAVAILABLE), we transparently answer
 * from the client-bundled `localSearchIndex` so the user still gets
 * useful results. This is not a silent failure — we `console.warn` once
 * per fallback so developers see the backend is down without flooding
 * the console like a caught error would.
 */
function isFallbackError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  return (
    err.code === 'NETWORK_ERROR' ||
    err.code === 'SERVICE_UNAVAILABLE' ||
    err.status >= 500
  );
}

let fallbackWarned = false;
function warnOnceOnFallback(endpoint: string, err: ApiError): void {
  if (fallbackWarned) return;
  fallbackWarned = true;
  // eslint-disable-next-line no-console
  console.warn(
    `[api] ${endpoint}: backend unavailable (${err.code} ${err.status}) — falling back to local seed catalog`,
  );
}

/** Visible-for-tests: reset the warn-once latch. */
export function resetApiFallbackWarning(): void {
  fallbackWarned = false;
}

// ---------------------------------------------------------------------------
// Autocomplete (Doc 26 §6.2)
// ---------------------------------------------------------------------------

export interface AutocompleteItem {
  text: string;
  ent_id: string;
  /**
   * Entity id. Historically a number (NAIF), but deep-sky objects returned
   * by the T38 catalog ingest carry string catalog refs like `messier:M31`.
   * Accept both until the T40 EntityRef refactor normalises everything.
   */
  id?: number | string;
  /** Doc 26 category 1..9. */
  category: number;
  category_name: string;
  magnitude?: number;
  /** Server returns `<em>…</em>`-wrapped substring match. */
  highlight?: string;
  /** ICRS J2000.0 right ascension, degrees [0, 360). */
  ra?: number;
  /** ICRS J2000.0 declination, degrees [-90, 90]. */
  dec?: number;
  /** Distance in parsecs (may be null for unknown-distance objects). */
  distance_pc?: number | null;
  /**
   * T51 — cross-catalog IDs the server already knows about for this hit.
   * When present, the client can render the Cross-IDs section of the
   * S-3.1 Full InfoPanel immediately without a second `/entities/{id}`
   * round-trip.
   */
  catalog_ids?: ApiCatalogIds;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteItem[];
  query: string;
  took_ms?: number;
  /** Which layer answered this request — `api` or the in-memory offline seed. */
  source?: 'api' | 'fallback';
}

const AUTOCOMPLETE_CACHE_MAX = 100;
const autocompleteCache = new Map<string, AutocompleteResponse>();

function autocompleteKey(q: string, category: number | null | undefined): string {
  return `${category ?? ''}::${q.toLowerCase()}`;
}

export function clearAutocompleteCache(): void {
  autocompleteCache.clear();
}

export interface AutocompleteOptions {
  category?: number | null;
  limit?: number;
  signal?: AbortSignal;
}

export async function searchAutocomplete(
  q: string,
  opts: AutocompleteOptions = {},
): Promise<AutocompleteResponse> {
  const trimmed = q.trim();
  if (trimmed.length === 0) {
    return { suggestions: [], query: '' };
  }
  const cacheKey = autocompleteKey(trimmed, opts.category);
  const cached = autocompleteCache.get(cacheKey);
  if (cached) {
    // Bump to MRU position.
    autocompleteCache.delete(cacheKey);
    autocompleteCache.set(cacheKey, cached);
    return cached;
  }
  let response: AutocompleteResponse;
  try {
    const raw = await apiGet<AutocompleteResponse | AutocompleteItem[]>(
      '/search/autocomplete',
      {
        query: {
          q: trimmed,
          category: opts.category ?? undefined,
          limit: opts.limit ?? undefined,
        },
        signal: opts.signal,
        // Autocomplete is cached in-app; skip ETag revalidation to avoid
        // conditional-GET latency on every keystroke.
        bypassCache: true,
      },
    );
    response = Array.isArray(raw)
      ? { suggestions: raw, query: trimmed, source: 'api' }
      : { ...raw, source: raw.source ?? 'api' };
  } catch (err) {
    if (!isFallbackError(err)) throw err;
    warnOnceOnFallback('/search/autocomplete', err as ApiError);
    const suggestions = searchLocalAutocomplete(trimmed, {
      category: opts.category ?? null,
      limit: opts.limit ?? 10,
    });
    response = { suggestions, query: trimmed, source: 'fallback' };
  }
  autocompleteCache.set(cacheKey, response);
  if (autocompleteCache.size > AUTOCOMPLETE_CACHE_MAX) {
    const oldest = autocompleteCache.keys().next().value;
    if (oldest !== undefined) autocompleteCache.delete(oldest);
  }
  return response;
}

// ---------------------------------------------------------------------------
// Full-text search (Doc 26 §6.1)
// ---------------------------------------------------------------------------

export interface TextSearchItem {
  /** Numeric NAIF id, or string catalog ref (e.g. `messier:M31`) for deep-sky. */
  id: number | string;
  ent_id: string;
  name: string;
  category: number;
  category_name: string;
  type_name: string;
  magnitude_apparent?: number;
  distance_ly?: number;
  constellation?: string;
  /** ICRS J2000.0 right ascension, degrees [0, 360). */
  ra?: number;
  /** ICRS J2000.0 declination, degrees [-90, 90]. */
  dec?: number;
  /** Distance in parsecs (may be null for unknown-distance objects). */
  distance_pc?: number | null;
  _score?: number;
  _links: { self: string; [key: string]: string | undefined };
  /** T51 — cross-catalog IDs carried alongside each hit. Same rationale as
   *  {@link AutocompleteItem.catalog_ids}: lets the Info Panel render the
   *  full cross-IDs table without refetching. */
  catalog_ids?: ApiCatalogIds;
}

export interface TextSearchOptions {
  category?: number | null;
  magnitudeMax?: number | null;
  distanceMaxPc?: number | null;
  limit?: number;
  offset?: number;
  sort?: '_score' | 'name' | 'magnitude' | 'distance';
  order?: 'asc' | 'desc';
  cursor?: string;
  signal?: AbortSignal;
}

export async function searchText(
  q: string,
  opts: TextSearchOptions = {},
): Promise<CollectionResult<TextSearchItem>> {
  const trimmed = q.trim();
  if (trimmed.length === 0) {
    return {
      items: [],
      pagination: { total: 0, limit: opts.limit ?? 50, offset: 0, has_more: false },
    };
  }
  let result: CollectionResult<TextSearchItem>;
  try {
    result = await apiGetCollection<TextSearchItem>('/search', {
      query: {
        q: trimmed,
        category: opts.category ?? undefined,
        mag_max: opts.magnitudeMax ?? undefined,
        distance_max_pc: opts.distanceMaxPc ?? undefined,
        limit: opts.limit ?? undefined,
        offset: opts.offset ?? undefined,
        sort: opts.sort ?? undefined,
        order: opts.order ?? undefined,
        cursor: opts.cursor ?? undefined,
      },
      signal: opts.signal,
      bypassCache: true,
    });
  } catch (err) {
    if (!isFallbackError(err)) throw err;
    warnOnceOnFallback('/search', err as ApiError);
    const local = searchLocalText(trimmed, {
      category: opts.category ?? null,
      limit: opts.limit ?? 20,
      offset: opts.offset ?? 0,
    });
    const limit = opts.limit ?? local.items.length;
    const offset = opts.offset ?? 0;
    return {
      items: local.items,
      pagination: {
        total: local.total,
        limit,
        offset,
        has_more: offset + local.items.length < local.total,
      },
    };
  }
  // T51 — apply client-side popularity boosts when the server is sorting
  // by `_score` (its default). Leaves explicit `name` / `magnitude` /
  // `distance` orderings alone so users who picked a sort get it.
  const sortField = opts.sort ?? '_score';
  if (sortField === '_score' && result.items.length > 1) {
    const boosted = result.items
      .map((item) => ({
        item,
        score: computeBoostedScore(item),
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => ({ ...entry.item, _score: entry.score }));
    return { ...result, items: boosted };
  }
  return result;
}

/**
 * T51 — client-side popularity re-score. Doc 26 §6.1 already gives us a
 * server `_score` (exact name ×10, alias ×5, catalog ×3); this function
 * folds in *popularity* factors the server's Elasticsearch index doesn't
 * know about (Messier / IAU-named / brightness). Reason: the same text
 * query may match millions of Gaia hits with near-identical `_score`;
 * without a popularity boost, the flagship object (e.g. Sirius for
 * `"Sirius"`) would sink below homonyms that happened to alphabetise
 * earlier.
 *
 * Exported for testability.
 */
export function computeBoostedScore(item: TextSearchItem): number {
  const baseline = typeof item._score === 'number' ? item._score : 50;
  let boost = 0;
  const ids = item.catalog_ids ?? {};
  // Messier objects are the 110 canonical deep-sky targets — always top of
  // the list for their name.
  if (typeof ids.messier === 'number') boost += 20;
  // IAU-named stars (Sirius, Vega, …) are the ~500 popular handles users
  // are likely to have in mind. We don't get a dedicated flag in the
  // payload today, so we approximate: presence of an HD/HIP/SAO ID on a
  // star-category result is a strong signal it's been catalog-curated
  // rather than procedurally generated.
  if (item.category === 1 && (ids.hd !== undefined || ids.hipparcos !== undefined)) {
    boost += 15;
  }
  // Planet hosts: the server tags these with an `exoplanet_archive` alias
  // (Doc 33 §9.1). Not in ApiCatalogIds today — forward-compatible no-op.
  // Brightness: −1 mag (Sirius-tier) → +15, 0 mag → +10, 4 mag → +2, 8
  // mag → 0. The scoring floor keeps faint objects from going negative.
  const mag = item.magnitude_apparent;
  if (typeof mag === 'number' && Number.isFinite(mag)) {
    boost += Math.max(0, 10 - mag);
  }
  return baseline + boost;
}

// ---------------------------------------------------------------------------
// Cone search (Doc 26 §6.3)
// ---------------------------------------------------------------------------

export interface ConeSearchItem extends TextSearchItem {
  angular_separation_deg: number;
}

export interface ConeSearchOptions {
  magnitudeMax?: number | null;
  category?: number | null;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export async function searchCone(
  ra: number,
  dec: number,
  radiusDeg: number,
  opts: ConeSearchOptions = {},
): Promise<CollectionResult<ConeSearchItem>> {
  if (ra < 0 || ra >= 360) {
    throw new RangeError(`ra must be in [0, 360) (got ${ra})`);
  }
  if (dec < -90 || dec > 90) {
    throw new RangeError(`dec must be in [-90, 90] (got ${dec})`);
  }
  if (radiusDeg <= 0 || radiusDeg > 10) {
    throw new RangeError(`radius must be in (0, 10] deg (got ${radiusDeg})`);
  }
  return apiGetCollection<ConeSearchItem>('/search/cone', {
    query: {
      ra,
      dec,
      radius: radiusDeg,
      mag_max: opts.magnitudeMax ?? undefined,
      category: opts.category ?? undefined,
      limit: opts.limit ?? undefined,
      offset: opts.offset ?? undefined,
    },
    signal: opts.signal,
    bypassCache: true,
  });
}

// Re-export envelope helpers (keeps `@/api` barrel tidy).
export type { ApiCollectionEnvelope, ApiEnvelope };
