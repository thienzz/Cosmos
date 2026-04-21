/**
 * Tile endpoints (Doc 26 §7). Binary tiles skip the Doc 26 §2.5 envelope —
 * we go through `apiGetBinary` which returns the raw ArrayBuffer. The
 * manifest JSON endpoint goes through the regular `apiGet` path.
 *
 * When `VITE_TILE_SERVER_URL` (or `apiConfig.tileServerBaseUrl`) is set,
 * binary tile reads go directly to the Rust tile server instead of the
 * API gateway's `/tiles/…` proxy. JSON reads (manifest) stay on the
 * gateway so clients benefit from its envelope + rate-limiting.
 */

import { parseTileManifest, type TileManifestDocument } from '@cosmos/tile-decoder';

import { apiGet, apiGetBinary, type BinaryRequestOptions, type BinaryResponse } from './client';
import { apiConfig } from './config';

export interface TileFetchOptions {
  signal?: AbortSignal;
  maxRetries?: number;
}

function binaryOpts(opts: TileFetchOptions): BinaryRequestOptions {
  return {
    signal: opts.signal,
    maxRetries: opts.maxRetries,
    // `null` → fall through to `apiConfig.baseUrl` in buildBinaryUrl.
    baseUrlOverride: apiConfig.tileServerBaseUrl,
  };
}

/**
 * Path builder. Always emits `/tiles/<suffix>` and relies on the base
 * URL (either `apiConfig.baseUrl` or `apiConfig.tileServerBaseUrl`)
 * to carry the API version prefix.
 *
 *   - Gateway mode: `apiConfig.baseUrl = https://api.../v1` → yields
 *     `https://api.../v1/tiles/stars/6/12345`.
 *   - Direct mode:  `VITE_TILE_SERVER_URL = http://localhost:3001/v1`
 *     → yields `http://localhost:3001/v1/tiles/stars/6/12345`.
 *
 * `.env.example` documents the `/v1` suffix so operators set the URL
 * correctly.
 */
function tilePath(suffix: string): string {
  return `/tiles/${suffix}`;
}

export async function fetchManifest(opts: TileFetchOptions = {}): Promise<TileManifestDocument> {
  // Doc 26 §7.4 — returns the envelope-wrapped manifest. `apiGet` unwraps.
  // Manifest stays on the API gateway (JSON path) regardless of
  // VITE_TILE_SERVER_URL, because the gateway owns the envelope schema.
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
  return apiGetBinary(tilePath(`stars/${address}`), binaryOpts(opts));
}

/** Fetch a galaxy HEALPix tile. */
export function fetchGalaxyTile(healpixIdx: number, opts: TileFetchOptions = {}): Promise<BinaryResponse> {
  return apiGetBinary(tilePath(`galaxies/${healpixIdx}`), binaryOpts(opts));
}

/** Fetch a cosmic-web mesh sector. */
export function fetchCosmicWebTile(sector: number, opts: TileFetchOptions = {}): Promise<BinaryResponse> {
  return apiGetBinary(tilePath(`cosmic-web/${sector}`), binaryOpts(opts));
}

/**
 * Generic tile fetcher keyed by the manifest address. Recognised prefixes:
 *   `stars/…`, `galaxies/…`, `cosmic-web/…`
 * Anything else is treated as a star-tile suffix for forward compatibility.
 *
 * URL shape:
 *   - with tileServerBaseUrl  → `<tileServerBaseUrl>/v1/tiles/<rest>`
 *   - without                 → `<apiBaseUrl>/tiles/<rest>` (gateway proxy;
 *                                the gateway strips `/v1/` itself)
 */
export function fetchTileByAddress(address: string, opts: TileFetchOptions = {}): Promise<BinaryResponse> {
  const normalised = address.replace(/^\/+/, '');
  const rest = normalised.startsWith('stars/') ||
               normalised.startsWith('galaxies/') ||
               normalised.startsWith('cosmic-web/')
    ? normalised
    : `stars/${normalised}`;
  return apiGetBinary(tilePath(rest), binaryOpts(opts));
}
