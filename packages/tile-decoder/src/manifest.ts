/**
 * Tile manifest JSON parser (Doc 26 §7.4).
 *
 * The manifest describes every available tile so the client can decide what
 * to fetch before touching the tile server. We parse the remote envelope
 * into a flat shape (`TileManifestDocument`) that the tile streaming
 * manager can index by address.
 */

export interface TileManifestStarEntry {
  /** Octree address "z/x/y/level" — used as URL suffix and map key. */
  address: string;
  bounds: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
  starCount: number;
  sizeBytes: number;
  checksum?: string;
}

export interface TileManifestGalaxyEntry {
  /** HEALPix pixel index (Nside=256). */
  healpixIndex: number;
  galaxyCount: number;
  sizeBytes: number;
  checksum?: string;
}

export interface TileManifestCosmicWebEntry {
  sector: number;
  vertexCount: number;
  sizeBytes: number;
  checksum?: string;
}

export interface TileManifestDocument {
  version: string;
  generatedAt: string;
  stars: {
    totalTiles: number;
    totalStars: number;
    maxDepth: number;
    lodLevels: number;
    bounds: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
    tiles: TileManifestStarEntry[];
  };
  galaxies: {
    totalTiles: number;
    totalGalaxies: number;
    healpixNside: number;
    tiles: TileManifestGalaxyEntry[];
  };
  cosmicWeb: {
    totalSectors: number;
    grid: [number, number, number];
    sectors: TileManifestCosmicWebEntry[];
  };
}

export class ManifestParseError extends Error {
  public readonly code = 'INVALID_MANIFEST';
  constructor(message: string) {
    super(message);
    this.name = 'ManifestParseError';
  }
}

interface Vec3JSON { x: number; y: number; z: number }
interface BoundsJSON { min: Vec3JSON; max: Vec3JSON }

function parseVec3(raw: unknown, context: string): Vec3JSON {
  if (
    !raw ||
    typeof raw !== 'object' ||
    typeof (raw as Vec3JSON).x !== 'number' ||
    typeof (raw as Vec3JSON).y !== 'number' ||
    typeof (raw as Vec3JSON).z !== 'number'
  ) {
    throw new ManifestParseError(`Invalid vec3 at ${context}`);
  }
  const v = raw as Vec3JSON;
  return { x: v.x, y: v.y, z: v.z };
}

function parseBounds(raw: unknown, context: string): BoundsJSON {
  if (!raw || typeof raw !== 'object') {
    throw new ManifestParseError(`Invalid bounds at ${context}`);
  }
  const b = raw as { min?: unknown; max?: unknown };
  return { min: parseVec3(b.min, `${context}.min`), max: parseVec3(b.max, `${context}.max`) };
}

/**
 * Parse the Doc 26 §7.4 manifest payload. Accepts either the raw body
 * (what the fetch layer returns after envelope unwrap) or the enveloped
 * `{ data, meta }` form (what `JSON.parse(rawBody)` yields in tests).
 */
export function parseTileManifest(payload: unknown): TileManifestDocument {
  if (!payload || typeof payload !== 'object') {
    throw new ManifestParseError('Manifest payload must be a JSON object');
  }
  const root =
    (payload as { data?: unknown }).data && typeof (payload as { data?: unknown }).data === 'object'
      ? ((payload as { data: unknown }).data as Record<string, unknown>)
      : (payload as Record<string, unknown>);

  const version = root.version;
  const generatedAt = root.generated_at ?? root.generatedAt;
  if (typeof version !== 'string') throw new ManifestParseError('manifest.version must be a string');
  if (typeof generatedAt !== 'string') {
    throw new ManifestParseError('manifest.generated_at must be a string');
  }

  const starsRaw = root.stars;
  if (!starsRaw || typeof starsRaw !== 'object') {
    throw new ManifestParseError('manifest.stars missing');
  }
  const stars = starsRaw as Record<string, unknown>;
  const starTiles = Array.isArray(stars.tiles) ? stars.tiles : [];

  const starsOut = {
    totalTiles: num(stars.total_tiles, 'stars.total_tiles'),
    totalStars: num(stars.total_stars, 'stars.total_stars'),
    maxDepth: num(stars.max_depth, 'stars.max_depth'),
    lodLevels: num(stars.lod_levels, 'stars.lod_levels'),
    bounds: parseBounds(stars.bounds, 'stars.bounds'),
    tiles: starTiles.map((raw, i) => parseStarTileEntry(raw, i)),
  };

  const galaxiesRaw = root.galaxies;
  if (!galaxiesRaw || typeof galaxiesRaw !== 'object') {
    throw new ManifestParseError('manifest.galaxies missing');
  }
  const galaxies = galaxiesRaw as Record<string, unknown>;
  const galaxyTiles = Array.isArray(galaxies.tiles) ? galaxies.tiles : [];
  const galaxiesOut = {
    totalTiles: num(galaxies.total_tiles, 'galaxies.total_tiles'),
    totalGalaxies: num(galaxies.total_galaxies, 'galaxies.total_galaxies'),
    healpixNside: num(galaxies.healpix_nside, 'galaxies.healpix_nside'),
    tiles: galaxyTiles.map((raw, i) => parseGalaxyTileEntry(raw, i)),
  };

  const cosmicWebRaw = (root.cosmic_web ?? root.cosmicWeb) as unknown;
  let cosmicWebOut: TileManifestDocument['cosmicWeb'];
  if (cosmicWebRaw && typeof cosmicWebRaw === 'object') {
    const cw = cosmicWebRaw as Record<string, unknown>;
    const grid = cw.grid;
    const sectorsRaw = Array.isArray(cw.sectors) ? cw.sectors : [];
    cosmicWebOut = {
      totalSectors: num(cw.total_sectors ?? sectorsRaw.length, 'cosmic_web.total_sectors'),
      grid:
        Array.isArray(grid) && grid.length === 3 && grid.every((n) => typeof n === 'number')
          ? (grid as [number, number, number])
          : [4, 4, 4],
      sectors: sectorsRaw.map((raw, i) => parseCosmicWebEntry(raw, i)),
    };
  } else {
    cosmicWebOut = { totalSectors: 0, grid: [4, 4, 4], sectors: [] };
  }

  return {
    version,
    generatedAt,
    stars: starsOut,
    galaxies: galaxiesOut,
    cosmicWeb: cosmicWebOut,
  };
}

function num(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ManifestParseError(`${context} must be a finite number`);
  }
  return value;
}

function parseStarTileEntry(raw: unknown, idx: number): TileManifestStarEntry {
  if (!raw || typeof raw !== 'object') {
    throw new ManifestParseError(`stars.tiles[${idx}] must be an object`);
  }
  const t = raw as Record<string, unknown>;
  if (typeof t.address !== 'string') {
    throw new ManifestParseError(`stars.tiles[${idx}].address missing`);
  }
  return {
    address: t.address,
    bounds: parseBounds(t.bounds, `stars.tiles[${idx}].bounds`),
    starCount: num(t.star_count, `stars.tiles[${idx}].star_count`),
    sizeBytes: num(t.size_bytes, `stars.tiles[${idx}].size_bytes`),
    checksum: typeof t.checksum_xxh3 === 'string' ? t.checksum_xxh3 : undefined,
  };
}

function parseGalaxyTileEntry(raw: unknown, idx: number): TileManifestGalaxyEntry {
  if (!raw || typeof raw !== 'object') {
    throw new ManifestParseError(`galaxies.tiles[${idx}] must be an object`);
  }
  const t = raw as Record<string, unknown>;
  return {
    healpixIndex: num(t.healpix_idx, `galaxies.tiles[${idx}].healpix_idx`),
    galaxyCount: num(t.galaxy_count, `galaxies.tiles[${idx}].galaxy_count`),
    sizeBytes: num(t.size_bytes, `galaxies.tiles[${idx}].size_bytes`),
    checksum: typeof t.checksum_xxh3 === 'string' ? t.checksum_xxh3 : undefined,
  };
}

function parseCosmicWebEntry(raw: unknown, idx: number): TileManifestCosmicWebEntry {
  if (!raw || typeof raw !== 'object') {
    throw new ManifestParseError(`cosmic_web.sectors[${idx}] must be an object`);
  }
  const t = raw as Record<string, unknown>;
  return {
    sector: num(t.sector, `cosmic_web.sectors[${idx}].sector`),
    vertexCount: num(t.vertex_count, `cosmic_web.sectors[${idx}].vertex_count`),
    sizeBytes: num(t.size_bytes, `cosmic_web.sectors[${idx}].size_bytes`),
    checksum: typeof t.checksum_xxh3 === 'string' ? t.checksum_xxh3 : undefined,
  };
}

/** Convert an octree address to the tile URL path (Doc 26 §7.1). */
export function starTileUrl(address: string): string {
  return `/tiles/stars/${address}`;
}

export function galaxyTileUrl(healpixIdx: number): string {
  return `/tiles/galaxies/${healpixIdx}`;
}

export function cosmicWebTileUrl(sector: number): string {
  return `/tiles/cosmic-web/${sector}`;
}
