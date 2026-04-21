import { describe, expect, it } from 'vitest';

import { ManifestParseError, parseTileManifest } from '../manifest';

describe('parseTileManifest (TS-TILE-001)', () => {
  it('parses the Doc 26 §7.4 sample envelope', () => {
    const payload = {
      data: {
        version: '2026.Q1.3',
        generated_at: '2026-04-15T03:00:00Z',
        stars: {
          total_tiles: 64893,
          total_stars: 1_811_709_771,
          max_depth: 8,
          lod_levels: 4,
          bounds: {
            min: { x: -200, y: -200, z: -200 },
            max: { x: 200, y: 200, z: 200 },
          },
          tiles: [
            {
              address: '3/12/5/2',
              bounds: { min: { x: -25, y: 25, z: 0 }, max: { x: 0, y: 50, z: 25 } },
              star_count: 847,
              size_bytes: 13568,
              checksum_xxh3: 'a1b2c3d4e5f6',
            },
          ],
        },
        galaxies: {
          total_tiles: 472108,
          total_galaxies: 2_000_000_000,
          healpix_nside: 256,
          tiles: [
            {
              healpix_idx: 1024,
              galaxy_count: 4231,
              size_bytes: 101560,
              checksum_xxh3: 'f6e5d4c3b2a1',
            },
          ],
        },
        cosmic_web: {
          total_sectors: 64,
          grid: [4, 4, 4],
          sectors: [
            {
              sector: 0,
              vertex_count: 125_000,
              size_bytes: 2_048_000,
              checksum_xxh3: '1a2b3c4d5e6f',
            },
          ],
        },
      },
      meta: {},
    };
    const manifest = parseTileManifest(payload);
    expect(manifest.version).toBe('2026.Q1.3');
    expect(manifest.stars.totalTiles).toBe(64893);
    expect(manifest.stars.tiles[0]!.address).toBe('3/12/5/2');
    expect(manifest.stars.tiles[0]!.sizeBytes).toBe(13568);
    expect(manifest.galaxies.tiles[0]!.healpixIndex).toBe(1024);
    expect(manifest.cosmicWeb.grid).toEqual([4, 4, 4]);
    expect(manifest.cosmicWeb.sectors[0]!.vertexCount).toBe(125_000);
  });

  it('parses a payload without envelope (already unwrapped)', () => {
    const payload = {
      version: 'v1',
      generated_at: '2026-01-01T00:00:00Z',
      stars: {
        total_tiles: 0,
        total_stars: 0,
        max_depth: 0,
        lod_levels: 0,
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } },
        tiles: [],
      },
      galaxies: { total_tiles: 0, total_galaxies: 0, healpix_nside: 256, tiles: [] },
    };
    const manifest = parseTileManifest(payload);
    expect(manifest.version).toBe('v1');
    expect(manifest.cosmicWeb.sectors).toHaveLength(0);
  });

  it('throws ManifestParseError on missing version', () => {
    expect(() => parseTileManifest({ data: {} })).toThrow(ManifestParseError);
  });

  it('throws ManifestParseError on non-object payload', () => {
    expect(() => parseTileManifest(null)).toThrow(ManifestParseError);
    expect(() => parseTileManifest('nope')).toThrow(ManifestParseError);
  });
});
