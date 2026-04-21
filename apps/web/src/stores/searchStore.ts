import type { SearchResult } from '@cosmos/shared-types';
import { create } from 'zustand';

import {
  ApiError,
  searchAutocomplete,
  searchText,
  type AutocompleteItem,
  type TextSearchItem,
} from '@/api';
import {
  searchLocalAutocomplete,
  searchLocalText,
} from '@/data/localSearchIndex';

import type { AutocompleteSuggestion } from './types.js';

/**
 * Dev-fallback flag: once the backend search endpoint returns an error
 * (e.g. Elasticsearch down in local dev) we flip this and keep serving the
 * local in-memory catalog so the search bar stays usable. A successful HTTP
 * response clears the flag. Exported for tests + the dev-tools overlay.
 */
let localFallbackActive = false;
export function isLocalSearchFallbackActive(): boolean {
  return localFallbackActive;
}
export function resetLocalSearchFallback(): void {
  localFallbackActive = false;
}

/**
 * Warm state: query, results, autocomplete.
 * Source: Doc 27 §5.5.
 */
export interface SearchFilters {
  /** ENT category id (null = all 96 types). */
  category: number | null;
  /** Upper magnitude cut (dimmer than this is excluded). */
  magnitudeMax: number | null;
  /** Upper distance cut in parsecs (ignored for galactic/cosmic scales). */
  distanceMaxPc: number | null;
}

export interface SearchPagination {
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  /** Raw API items for UI rendering (category badges, distance, etc). */
  resultItems: TextSearchItem[];
  autocomplete: AutocompleteSuggestion[];
  autocompleteItems: AutocompleteItem[];
  isSearching: boolean;
  /** True while an autocomplete request is in flight. Separate from search. */
  isAutocompleting: boolean;
  /** Last error surfaced to the UI (cleared on next call). */
  searchError: string | null;
  filters: SearchFilters;
  totalResults: number;
  pagination: SearchPagination;

  // Actions
  setQuery: (q: string) => void;
  setResults: (results: SearchResult[], totalResults: number, hasMore: boolean) => void;
  appendResults: (results: SearchResult[], hasMore: boolean) => void;
  setAutocomplete: (suggestions: AutocompleteSuggestion[]) => void;
  setSearching: (loading: boolean) => void;
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  clearFilters: () => void;
  clear: () => void;
  resetToDefault: () => void;

  /**
   * T19: fetch autocomplete suggestions for the current query, debounced by
   * the caller. Internally race-guards against an older query overwriting a
   * fresher one (last-writer-wins on arrival order is unsafe when the
   * keystroke before this one sees slower network).
   */
  fetchAutocomplete: (opts?: { signal?: AbortSignal }) => Promise<void>;
  /** Full-text search — runs `/search`. Resets pagination. */
  runTextSearch: (opts?: { signal?: AbortSignal }) => Promise<void>;
  /** Fetch the next page of the current query, appending. */
  loadMore: (opts?: { signal?: AbortSignal }) => Promise<void>;
}

export const SEARCH_DEFAULT_FILTERS: SearchFilters = {
  category: null,
  magnitudeMax: null,
  distanceMaxPc: null,
};

export const SEARCH_DEFAULT_PAGINATION: SearchPagination = {
  offset: 0,
  limit: 25,
  hasMore: false,
};

export const SEARCH_DEFAULT_STATE: Omit<
  SearchState,
  | 'setQuery'
  | 'setResults'
  | 'appendResults'
  | 'setAutocomplete'
  | 'setSearching'
  | 'setFilter'
  | 'clearFilters'
  | 'clear'
  | 'resetToDefault'
  | 'fetchAutocomplete'
  | 'runTextSearch'
  | 'loadMore'
> = {
  query: '',
  results: [],
  resultItems: [],
  autocomplete: [],
  autocompleteItems: [],
  isSearching: false,
  isAutocompleting: false,
  searchError: null,
  filters: SEARCH_DEFAULT_FILTERS,
  totalResults: 0,
  pagination: SEARCH_DEFAULT_PAGINATION,
};

const CATEGORY_TO_OBJECT_TYPE: Readonly<Record<number, SearchResult['objectType']>> = {
  1: 'star',
  2: 'planet',
  3: 'planet',
  4: 'moon',
  5: 'nebula',
  6: 'galaxy',
  7: 'asteroid',
  8: 'galaxy',
  9: 'star',
};

/** Map a backend result row → the shared `SearchResult` shape. */
function toSearchResult(item: TextSearchItem): SearchResult {
  return {
    objectId: String(item.id),
    objectType: CATEGORY_TO_OBJECT_TYPE[item.category] ?? 'star',
    displayName: item.name,
    score: typeof item._score === 'number' ? item._score : 0,
    position: { x: 0, y: 0, z: 0 },
    // Doc 26 returns light-years; convert to parsecs for shared-types.
    distance:
      typeof item.distance_ly === 'number' ? item.distance_ly / 3.261_563_8 : 0,
  };
}

/** Map a backend autocomplete row → the legacy suggestion shape. */
function toAutocompleteSuggestion(item: AutocompleteItem): AutocompleteSuggestion {
  return {
    id: typeof item.id === 'number' ? item.id : 0,
    name: item.text,
    object_type: CATEGORY_TO_OBJECT_TYPE[item.category] ?? 'star',
    score: 1,
  };
}

// Each action holds a monotonically-growing request id so stale responses
// can detect they've been superseded. Kept at module scope because Zustand
// state should only hold serializable values.
let autocompleteRequestId = 0;
let searchRequestId = 0;

export const useSearchStore = create<SearchState>()((set, get) => ({
  ...SEARCH_DEFAULT_STATE,

  setQuery: (query) => set({ query }),

  setResults: (results, totalResults, hasMore) => {
    const { pagination } = get();
    set({
      results,
      totalResults,
      pagination: { ...pagination, offset: 0, hasMore },
    });
  },

  appendResults: (results, hasMore) => {
    const { results: existing, pagination } = get();
    set({
      results: [...existing, ...results],
      pagination: {
        ...pagination,
        offset: existing.length + results.length,
        hasMore,
      },
    });
  },

  fetchAutocomplete: async (opts = {}) => {
    const { query, filters } = get();
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      set({ autocomplete: [], autocompleteItems: [], isAutocompleting: false });
      return;
    }
    const myId = ++autocompleteRequestId;
    set({ isAutocompleting: true });
    try {
      const response = await searchAutocomplete(trimmed, {
        category: filters.category ?? null,
        signal: opts.signal,
      });
      if (myId !== autocompleteRequestId) return; // stale
      localFallbackActive = false;
      set({
        autocompleteItems: response.suggestions,
        autocomplete: response.suggestions.map(toAutocompleteSuggestion),
        isAutocompleting: false,
        searchError: null,
      });
    } catch (err) {
      if (myId !== autocompleteRequestId) return;
      // Backend unreachable — fall back to the local in-memory catalog so the
      // user can still resolve Sun + planets + named bodies + notable
      // exoplanets. The message stays visible as a dev hint but results flow.
      if (!localFallbackActive) {
        // eslint-disable-next-line no-console
        console.warn('[api] falling back to local seed (autocomplete)', err);
      }
      localFallbackActive = true;
      const local = searchLocalAutocomplete(trimmed, {
        category: filters.category ?? null,
        limit: 10,
      });
      const message =
        err instanceof ApiError
          ? `${err.code}`
          : err instanceof Error
            ? err.message
            : String(err);
      set({
        autocompleteItems: local,
        autocomplete: local.map(toAutocompleteSuggestion),
        isAutocompleting: false,
        searchError: local.length === 0 ? message : null,
      });
    }
  },

  runTextSearch: async (opts = {}) => {
    const { query, filters, pagination } = get();
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      set({
        results: [],
        resultItems: [],
        totalResults: 0,
        pagination: { ...pagination, offset: 0, hasMore: false },
        isSearching: false,
        searchError: null,
      });
      return;
    }
    const myId = ++searchRequestId;
    set({ isSearching: true, searchError: null });
    try {
      const { items, pagination: next } = await searchText(trimmed, {
        category: filters.category ?? null,
        magnitudeMax: filters.magnitudeMax ?? null,
        distanceMaxPc: filters.distanceMaxPc ?? null,
        limit: pagination.limit,
        offset: 0,
        signal: opts.signal,
      });
      if (myId !== searchRequestId) return;
      localFallbackActive = false;
      set({
        results: items.map(toSearchResult),
        resultItems: items,
        totalResults: next.total,
        pagination: {
          ...pagination,
          offset: 0,
          hasMore: next.has_more,
        },
        isSearching: false,
      });
    } catch (err) {
      if (myId !== searchRequestId) return;
      // Offline-dev fallback: scan the local catalog for the same query.
      if (!localFallbackActive) {
        // eslint-disable-next-line no-console
        console.warn('[api] falling back to local seed (text search)', err);
      }
      localFallbackActive = true;
      const local = searchLocalText(trimmed, {
        category: filters.category ?? null,
        limit: pagination.limit,
        offset: 0,
      });
      const message =
        err instanceof ApiError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      set({
        results: local.items.map(toSearchResult),
        resultItems: local.items,
        totalResults: local.total,
        pagination: {
          ...pagination,
          offset: 0,
          hasMore: local.items.length < local.total,
        },
        isSearching: false,
        searchError: local.items.length === 0 ? message : null,
      });
    }
  },

  loadMore: async (opts = {}) => {
    const { query, filters, pagination, results, resultItems } = get();
    const trimmed = query.trim();
    if (trimmed.length === 0 || !pagination.hasMore) return;
    const myId = ++searchRequestId;
    set({ isSearching: true });
    try {
      const { items, pagination: next } = await searchText(trimmed, {
        category: filters.category ?? null,
        magnitudeMax: filters.magnitudeMax ?? null,
        distanceMaxPc: filters.distanceMaxPc ?? null,
        limit: pagination.limit,
        offset: results.length,
        signal: opts.signal,
      });
      if (myId !== searchRequestId) return;
      const mapped = items.map(toSearchResult);
      set({
        results: [...results, ...mapped],
        resultItems: [...resultItems, ...items],
        totalResults: next.total,
        pagination: {
          ...pagination,
          offset: results.length + mapped.length,
          hasMore: next.has_more,
        },
        isSearching: false,
      });
    } catch (err) {
      if (myId !== searchRequestId) return;
      const message =
        err instanceof ApiError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      set({ isSearching: false, searchError: message });
    }
  },

  setAutocomplete: (autocomplete) => set({ autocomplete }),
  setSearching: (isSearching) => set({ isSearching }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  clearFilters: () => set({ filters: SEARCH_DEFAULT_FILTERS }),

  clear: () =>
    set({
      query: '',
      results: [],
      resultItems: [],
      autocomplete: [],
      autocompleteItems: [],
      totalResults: 0,
      pagination: SEARCH_DEFAULT_PAGINATION,
      searchError: null,
      isSearching: false,
      isAutocompleting: false,
    }),

  resetToDefault: () => set(SEARCH_DEFAULT_STATE),
}));

// Dev-only: expose the store on `window.__cosmosSearchStore` so the preview
// harness + devtools can introspect search state (query, autocomplete, error,
// local-fallback flag) without spelunking into Zustand internals.
declare global {
  interface Window {
    __cosmosSearchStore?: typeof useSearchStore;
  }
}
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__cosmosSearchStore = useSearchStore;
}
