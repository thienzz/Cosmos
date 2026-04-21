/**
 * Tile endpoints (Doc 26 §7). Binary tiles skip the Doc 26 §2.5 envelope —
 * we go through `apiGetBinary` which returns the raw ArrayBuffer. The
 * manifest JSON endpoint goes through the regular `apiGet` path.
 */

import { parseTileManifest, type TileManifestDocument } from '@cosmos/tile-decoder';

import { apiGet, apiGetBinary, type BinaryResponse } from './client';

export interface TileFetchOptions {
  signal?: AbortSignal;
  maxRetries?: number;
}

export async function fetchManifest(opts: TileFetchOptions = {}): Promise<TileManifestDocument> {
  // Doc 26 §7.4 — returns the envelope-wrapped manifest. `apiGet` unwraps.
  const raw = await apiGet<unknown>('/tiles/manifest', {
    signal: opts.signal,
    maxRetries: opts.maxRetries,
  });
  // `apiGet` returns `.data`, which is already the manifest body. But
  // `parseTileManifest` also tolerates the enveloped shape, so both paths
  // work if the server fronts with or without the envelope.
  return parseTileManifest(raw);
}

/** Fetch a star octree tile. `address` is e.g. `3/12/5/2`. */
export function fetchStarTile(address: string, opts: TileFetchOptions = {}): Promise<BinaryResponse> {
  return apiGetBinary(`/tiles/stars/${address}`, opts);
}

/** Fetch a galaxy HEALPix tile. */
export function fetchGalaxyTile(healpixIdx: number, opts: TileFetchOptions = {}): Promise<BinaryResponse> {
  return apiGetBinary(`/tiles/galaxies/${healpixIdx}`, opts);
}

/** Fetch a cosmic-web mesh sector. */
export function fetchCosmicWebTile(sector: number, opts: TileFetchOptions = {}): Promise<BinaryResponse> {
  return apiGetBinary(`/tiles/cosmic-web/${sector}`, opts);
}

/**
 * Generic tile fetcher keyed by the manifest address. Recognised prefixes:
 *   `stars/…`, `galaxies/…`, `cosmic-web/…`
 * Anything else is treated as a star-tile suffix for forward compatibility.
 */
export function fetchTileByAddress(address: string, opts: TileFetchOptions = {}): Promise<BinaryResponse> {
  const normalised = address.replace(/^\/+/, '');
  if (normalised.startsWith('stars/')) {
    return apiGetBinary(`/tiles/${normalised}`, opts);
  }
  if (normalised.startsWith('galaxies/')) {
    return apiGetBinary(`/tiles/${normalised}`, opts);
  }
  if (normalised.startsWith('cosmic-web/')) {
    return apiGetBinary(`/tiles/${normalised}`, opts);
  }
  return apiGetBinary(`/tiles/stars/${normalised}`, opts);
}
