import type { SearchResult } from '@cosmos/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiConfig, clearAutocompleteCache } from '@/api';

import {
  SEARCH_DEFAULT_FILTERS,
  SEARCH_DEFAULT_PAGINATION,
  useSearchStore,
} from '../searchStore.js';
import type { AutocompleteSuggestion } from '../types.js';

function env<T>(data: T, extra: Record<string, unknown> = {}): unknown {
  return { data, meta: { request_id: 'r', data_version: 'v', timestamp: 't' }, ...extra };
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
function resultItem(id: number, name: string, overrides: Record<string, unknown> = {}): unknown {
  return {
    id,
    ent_id: `ENT-${1000 + id}`,
    name,
    category: 1,
    category_name: 'Stars',
    type_name: 'Main Sequence Star',
    _score: 0.8,
    _links: { self: `/v1/entities/${id}` },
    ...overrides,
  };
}

const result = (id: number, name: string): SearchResult => ({
  objectId: String(id),
  objectType: 'star',
  displayName: name,
  score: 0.8,
  position: { x: 0, y: 0, z: 0 },
  distance: 10,
});

const suggestion = (id: number, name: string): AutocompleteSuggestion => ({
  id,
  name,
  object_type: 'star',
  score: 0.9,
});

describe('searchStore', () => {
  beforeEach(() => {
    useSearchStore.getState().resetToDefault();
  });

  it('starts empty with default filters and pagination', () => {
    const state = useSearchStore.getState();
    expect(state.query).toBe('');
    expect(state.results).toEqual([]);
    expect(state.autocomplete).toEqual([]);
    expect(state.isSearching).toBe(false);
    expect(state.filters).toEqual(SEARCH_DEFAULT_FILTERS);
    expect(state.pagination).toEqual(SEARCH_DEFAULT_PAGINATION);
  });

  it('setQuery / setSearching update primitives', () => {
    const { setQuery, setSearching } = useSearchStore.getState();
    setQuery('Sirius');
    setSearching(true);
    const state = useSearchStore.getState();
    expect(state.query).toBe('Sirius');
    expect(state.isSearching).toBe(true);
  });

  it('setResults replaces results and resets pagination offset', () => {
    const { setResults } = useSearchStore.getState();
    setResults([result(1, 'Sirius'), result(2, 'Betelgeuse')], 120, true);
    const state = useSearchStore.getState();
    expect(state.results).toHaveLength(2);
    expect(state.totalResults).toBe(120);
    expect(state.pagination.offset).toBe(0);
    expect(state.pagination.hasMore).toBe(true);
  });

  it('appendResults concatenates and advances the offset', () => {
    const { setResults, appendResults } = useSearchStore.getState();
    setResults([result(1, 'Sirius')], 50, true);
    appendResults([result(2, 'Betelgeuse'), result(3, 'Vega')], false);
    const state = useSearchStore.getState();
    expect(state.results.map((r) => r.displayName)).toEqual(['Sirius', 'Betelgeuse', 'Vega']);
    expect(state.pagination.offset).toBe(3);
    expect(state.pagination.hasMore).toBe(false);
  });

  it('setAutocomplete stores suggestions', () => {
    useSearchStore.getState().setAutocomplete([suggestion(1, 'Sirius'), suggestion(2, 'Sirt')]);
    expect(useSearchStore.getState().autocomplete).toHaveLength(2);
  });

  it('setFilter updates a single filter key without touching the others', () => {
    const { setFilter } = useSearchStore.getState();
    setFilter('category', 2000);
    setFilter('magnitudeMax', 6.5);
    const state = useSearchStore.getState();
    expect(state.filters.category).toBe(2000);
    expect(state.filters.magnitudeMax).toBe(6.5);
    expect(state.filters.distanceMaxPc).toBeNull();
  });

  it('clearFilters resets only the filter block', () => {
    const { setQuery, setFilter, clearFilters } = useSearchStore.getState();
    setQuery('test');
    setFilter('category', 5000);
    clearFilters();
    const state = useSearchStore.getState();
    expect(state.filters).toEqual(SEARCH_DEFAULT_FILTERS);
    expect(state.query).toBe('test');
  });

  it('clear wipes query + results but keeps filters', () => {
    const { setQuery, setResults, setFilter, clear } = useSearchStore.getState();
    setQuery('foo');
    setResults([result(1, 'Sirius')], 10, true);
    setFilter('category', 7000);
    clear();
    const state = useSearchStore.getState();
    expect(state.query).toBe('');
    expect(state.results).toEqual([]);
    expect(state.filters.category).toBe(7000);
  });

  it('resetToDefault wipes filters too', () => {
    const { setFilter, resetToDefault } = useSearchStore.getState();
    setFilter('category', 8000);
    resetToDefault();
    expect(useSearchStore.getState().filters).toEqual(SEARCH_DEFAULT_FILTERS);
  });

  // -------------------------------------------------------------------
  // T19 — async actions (fetchAutocomplete / runTextSearch / loadMore)
  // -------------------------------------------------------------------

  describe('T19 async actions', () => {
    beforeEach(() => {
      apiConfig.reset();
      apiConfig.setBaseUrl('https://api.test/v1');
      clearAutocompleteCache();
      useSearchStore.getState().resetToDefault();
    });
    afterEach(() => {
      vi.restoreAllMocks();
      apiConfig.reset();
    });

    it('fetchAutocomplete populates both raw + legacy lists', async () => {
      apiConfig.setFetchImpl(
        vi.fn().mockResolvedValue(
          json(
            env({
              query: 'sir',
              suggestions: [
                { text: 'Sirius', ent_id: 'ENT-1001', id: 1, category: 1, category_name: 'Stars' },
                { text: 'Sirene', ent_id: 'ENT-1002', id: 2, category: 1, category_name: 'Stars' },
              ],
            }),
          ),
        ) as unknown as typeof fetch,
      );
      useSearchStore.getState().setQuery('sir');
      await useSearchStore.getState().fetchAutocomplete();
      const s = useSearchStore.getState();
      expect(s.autocompleteItems).toHaveLength(2);
      expect(s.autocomplete).toHaveLength(2);
      expect(s.autocomplete[0]?.name).toBe('Sirius');
      expect(s.isAutocompleting).toBe(false);
    });

    it('fetchAutocomplete drops stale responses when a newer one supersedes', async () => {
      let resolveFirst!: (v: Response) => void;
      const firstPending = new Promise<Response>((r) => {
        resolveFirst = r;
      });
      const fetchImpl = vi.fn();
      fetchImpl
        .mockReturnValueOnce(firstPending)
        .mockResolvedValueOnce(
          json(
            env({
              query: 'sirius',
              suggestions: [
                { text: 'Sirius', ent_id: 'ENT-1001', id: 1, category: 1, category_name: 'Stars' },
              ],
            }),
          ),
        );
      apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

      useSearchStore.getState().setQuery('sir');
      const slow = useSearchStore.getState().fetchAutocomplete();
      useSearchStore.getState().setQuery('sirius');
      await useSearchStore.getState().fetchAutocomplete();

      // Now release the stale first response — it must NOT overwrite.
      resolveFirst(
        json(
          env({
            query: 'sir',
            suggestions: [{ text: 'STALE', ent_id: 'ENT-9999', id: 999, category: 1, category_name: 'Stars' }],
          }),
        ),
      );
      await slow;

      const finalState = useSearchStore.getState();
      expect(finalState.autocompleteItems.map((i) => i.text)).toEqual(['Sirius']);
    });

    it('runTextSearch stores items + totalResults + hasMore', async () => {
      apiConfig.setFetchImpl(
        vi.fn().mockResolvedValue(
          json({
            data: [resultItem(1, 'Sirius', { distance_ly: 8.6 })],
            meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
            pagination: { total: 12, limit: 25, offset: 0, has_more: true },
          }),
        ) as unknown as typeof fetch,
      );
      useSearchStore.getState().setQuery('sir');
      await useSearchStore.getState().runTextSearch();
      const s = useSearchStore.getState();
      expect(s.results).toHaveLength(1);
      expect(s.resultItems).toHaveLength(1);
      expect(s.totalResults).toBe(12);
      expect(s.pagination.hasMore).toBe(true);
      expect(s.searchError).toBeNull();
    });

    it('runTextSearch surfaces API errors without dropping query', async () => {
      apiConfig.setFetchImpl(
        vi.fn().mockResolvedValue(
          json(
            {
              error: {
                code: 'INVALID_PARAMETER',
                message: 'q must be ≥1 char',
                status: 400,
                request_id: 'r',
              },
            },
            400,
          ),
        ) as unknown as typeof fetch,
      );
      // Query that matches nothing in the local search index — otherwise
      // the offline fallback populates results and suppresses the error
      // message (expected UX: if local has data, we prefer surfacing it
      // over the raw API error).
      useSearchStore.getState().setQuery('qzxnoexist');
      await useSearchStore.getState().runTextSearch();
      const s = useSearchStore.getState();
      expect(s.results).toEqual([]);
      expect(s.searchError).toContain('INVALID_PARAMETER');
      expect(s.query).toBe('qzxnoexist');
    });

    it('loadMore appends the next page and updates offset', async () => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(
          json({
            data: [resultItem(1, 'A'), resultItem(2, 'B')],
            meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
            pagination: { total: 4, limit: 2, offset: 0, has_more: true },
          }),
        )
        .mockResolvedValueOnce(
          json({
            data: [resultItem(3, 'C'), resultItem(4, 'D')],
            meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
            pagination: { total: 4, limit: 2, offset: 2, has_more: false },
          }),
        );
      apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

      useSearchStore.setState({ pagination: { ...SEARCH_DEFAULT_PAGINATION, limit: 2 } });
      useSearchStore.getState().setQuery('abc');
      await useSearchStore.getState().runTextSearch();
      expect(useSearchStore.getState().results.map((r) => r.displayName)).toEqual(['A', 'B']);
      await useSearchStore.getState().loadMore();
      const s = useSearchStore.getState();
      expect(s.results.map((r) => r.displayName)).toEqual(['A', 'B', 'C', 'D']);
      expect(s.pagination.hasMore).toBe(false);
      expect(s.pagination.offset).toBe(4);
    });
  });
});
