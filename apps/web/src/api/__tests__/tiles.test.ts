import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiConfig, clearEtagCache } from '../index';
import { fetchManifest, fetchStarTile } from '../tiles';

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  const headers = new Headers({ 'content-type': 'application/json', ...init.headers });
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers });
}

function binaryResponse(buffer: ArrayBuffer, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  const headers = new Headers({
    'content-type': 'application/octet-stream',
    'x-tile-version': '2026.Q1.3',
    ...init.headers,
  });
  return new Response(buffer, { status: init.status ?? 200, headers });
}

const manifestEnvelope = {
  data: {
    version: '2026.Q1.3',
    generated_at: '2026-04-15T03:00:00Z',
    stars: {
      total_tiles: 1,
      total_stars: 1000,
      max_depth: 8,
      lod_levels: 4,
      bounds: { min: { x: -200, y: -200, z: -200 }, max: { x: 200, y: 200, z: 200 } },
      tiles: [
        {
          address: '3/12/5/2',
          bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 25, y: 25, z: 25 } },
          star_count: 847,
          size_bytes: 13568,
        },
      ],
    },
    galaxies: {
      total_tiles: 0,
      total_galaxies: 0,
      healpix_nside: 256,
      tiles: [],
    },
    cosmic_web: {
      total_sectors: 0,
      grid: [4, 4, 4],
      sectors: [],
    },
  },
  meta: { request_id: 'req-1', data_version: '2026.Q1.3', timestamp: '2026-04-15T03:00:00Z' },
};

describe('api/tiles', () => {
  beforeEach(() => {
    apiConfig.reset();
    apiConfig.setBaseUrl('https://api.test/v1');
    clearEtagCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    apiConfig.reset();
  });

  it('fetchManifest fetches + parses the Doc 26 §7.4 envelope (TS-TILE-001)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(manifestEnvelope));
    apiConfig.setFetchImpl(fetchMock);

    const manifest = await fetchManifest();
    expect(manifest.version).toBe('2026.Q1.3');
    expect(manifest.stars.totalTiles).toBe(1);
    expect(manifest.stars.tiles[0]!.address).toBe('3/12/5/2');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const url = (firstCall as unknown as [unknown])[0];
    expect(String(url)).toBe('https://api.test/v1/tiles/manifest');
  });

  it('fetchStarTile returns the raw ArrayBuffer + version header', async () => {
    const buffer = new ArrayBuffer(128);
    new DataView(buffer).setUint32(0, 0xdeadbeef, true);
    const fetchMock = vi.fn(async () => binaryResponse(buffer));
    apiConfig.setFetchImpl(fetchMock);

    const response = await fetchStarTile('3/12/5/2');
    expect(response.buffer.byteLength).toBe(128);
    expect(response.version).toBe('2026.Q1.3');
    expect(response.contentType).toContain('octet-stream');
  });

  it('fetchStarTile surfaces 404 as an ApiError (TS-TILE-005)', async () => {
    const errorBody = JSON.stringify({
      error: { code: 'TILE_NOT_FOUND', message: 'no such tile', status: 404, request_id: 'r' },
    });
    const fetchMock = vi.fn(async () =>
      new Response(errorBody, {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    );
    apiConfig.setFetchImpl(fetchMock);

    await expect(fetchStarTile('9/99/99/3')).rejects.toMatchObject({
      code: 'TILE_NOT_FOUND',
      status: 404,
    });
  });
});
