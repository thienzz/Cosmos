import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  apiConfig,
  clearAutocompleteCache,
  clearEtagCache,
  searchAutocomplete,
  searchCone,
  searchText,
} from '../index';
import { resetApiFallbackWarning } from '../search';

function env<T>(data: T, extra: Record<string, unknown> = {}): unknown {
  return { data, meta: { request_id: 'r', data_version: 'v', timestamp: 't' }, ...extra };
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api/search', () => {
  beforeEach(() => {
    apiConfig.reset();
    apiConfig.setBaseUrl('https://api.test/v1');
    clearAutocompleteCache();
    clearEtagCache();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    apiConfig.reset();
  });

  it('searchAutocomplete short-circuits empty queries without hitting fetch', async () => {
    const f = vi.fn();
    apiConfig.setFetchImpl(f as unknown as typeof fetch);
    const result = await searchAutocomplete('   ');
    expect(result.suggestions).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });

  it('searchAutocomplete caches by query+category (second call reuses)', async () => {
    const f = vi
      .fn()
      .mockResolvedValue(
        json(
          env({
            query: 'sir',
            suggestions: [
              { text: 'Sirius', ent_id: 'ENT-1001', category: 1, category_name: 'Stars' },
            ],
          }),
        ),
      );
    apiConfig.setFetchImpl(f as unknown as typeof fetch);

    const a = await searchAutocomplete('sir');
    const b = await searchAutocomplete('SIR'); // case-insensitive key
    expect(a).toBe(b);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('searchAutocomplete accepts a bare array envelope (Doc 26 variant)', async () => {
    const f = vi.fn().mockResolvedValue(
      json(
        env([
          { text: 'Vega', ent_id: 'ENT-1002', category: 1, category_name: 'Stars' },
        ]),
      ),
    );
    apiConfig.setFetchImpl(f as unknown as typeof fetch);
    const result = await searchAutocomplete('veg');
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0]?.text).toBe('Vega');
    expect(result.query).toBe('veg');
  });

  it('searchText forwards filters + pagination + sort', async () => {
    const f = vi.fn().mockResolvedValue(
      json({
        data: [
          {
            id: 1,
            ent_id: 'ENT-1001',
            name: 'Sirius',
            category: 1,
            category_name: 'Stars',
            type_name: 'Main Sequence Star',
            magnitude_apparent: -1.46,
            distance_ly: 8.6,
            constellation: 'Canis Major',
            _score: 0.99,
            _links: { self: '/v1/entities/1' },
          },
        ],
        meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
        pagination: { total: 1, limit: 25, offset: 0, has_more: false },
      }),
    );
    apiConfig.setFetchImpl(f as unknown as typeof fetch);

    const { items, pagination } = await searchText('sirius', {
      category: 1,
      magnitudeMax: 6,
      limit: 25,
      sort: 'name',
      order: 'asc',
    });
    const url = (f.mock.calls[0] as [string])[0];
    expect(url).toContain('q=sirius');
    expect(url).toContain('category=1');
    expect(url).toContain('mag_max=6');
    expect(url).toContain('sort=name');
    expect(url).toContain('order=asc');
    expect(items[0]?.name).toBe('Sirius');
    expect(pagination.total).toBe(1);
  });

  it('searchText short-circuits empty queries', async () => {
    const f = vi.fn();
    apiConfig.setFetchImpl(f as unknown as typeof fetch);
    const { items, pagination } = await searchText('   ');
    expect(items).toEqual([]);
    expect(pagination.total).toBe(0);
    expect(f).not.toHaveBeenCalled();
  });

  it('searchCone validates ranges before hitting fetch', async () => {
    const f = vi.fn();
    apiConfig.setFetchImpl(f as unknown as typeof fetch);
    await expect(searchCone(-1, 0, 1)).rejects.toBeInstanceOf(RangeError);
    await expect(searchCone(10, 95, 1)).rejects.toBeInstanceOf(RangeError);
    await expect(searchCone(10, 0, 0)).rejects.toBeInstanceOf(RangeError);
    await expect(searchCone(10, 0, 20)).rejects.toBeInstanceOf(RangeError);
    expect(f).not.toHaveBeenCalled();
  });

  it('searchAutocomplete falls back to local seed on network error', async () => {
    resetApiFallbackWarning();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const f = vi.fn().mockRejectedValue(new TypeError('Network failed'));
    apiConfig.setFetchImpl(f as unknown as typeof fetch);

    const result = await searchAutocomplete('Androm');
    expect(result.source).toBe('fallback');
    // The local seed index ships 600+ catalog entities; Andromeda must be
    // in it. We check for *any* suggestion so we aren't coupled to the
    // exact catalog layout.
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('searchAutocomplete falls back on 5xx upstream', async () => {
    resetApiFallbackWarning();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const f = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'db down',
            status: 500,
            request_id: 'r',
          },
        }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      ),
    );
    apiConfig.setFetchImpl(f as unknown as typeof fetch);

    const result = await searchAutocomplete('Sirius');
    expect(result.source).toBe('fallback');
    expect(result.suggestions.length).toBeGreaterThan(0);
    warnSpy.mockRestore();
  });

  it('searchText falls back to local seed on network error', async () => {
    resetApiFallbackWarning();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const f = vi.fn().mockRejectedValue(new TypeError('offline'));
    apiConfig.setFetchImpl(f as unknown as typeof fetch);

    const { items, pagination } = await searchText('Andromeda');
    expect(items.length).toBeGreaterThan(0);
    expect(pagination.total).toBeGreaterThan(0);
    warnSpy.mockRestore();
  });

  it('searchCone posts ra/dec/radius as query params', async () => {
    const f = vi.fn().mockResolvedValue(
      json({
        data: [],
        meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
        pagination: { total: 0, limit: 100, offset: 0, has_more: false },
      }),
    );
    apiConfig.setFetchImpl(f as unknown as typeof fetch);
    await searchCone(101.287, -16.716, 2.5, { magnitudeMax: 8 });
    const url = (f.mock.calls[0] as [string])[0];
    expect(url).toContain('ra=101.287');
    expect(url).toContain('dec=-16.716');
    expect(url).toContain('radius=2.5');
    expect(url).toContain('mag_max=8');
  });
});
