/**
 * Deterministic star-tile seed generator (Doc 11 §4.1, Doc 11 §5.1, Doc 23
 * §17). Pure functions — no filesystem, no DOM. The Node ETL seeder writes
 * the returned buffers to disk; the browser-side preview mock serves them
 * in memory without a backend.
 *
 * Approach:
 * - Root volume: [-200, 200]³ pc, partitioned by a shallow octree (Doc 11
 *   §5.1).  Tile addresses follow Doc 26 §7.1 `{z}/{x}/{y}/{level}`. We
 *   pick z=1 with a 2×2 central block (x,y ∈ {3,4}) so the grid actually
 *   covers the heavily-populated volume within 100 pc of the Sun.
 * - Density: volume-weighted uniform in a 100 pc sphere, then clamped so
 *   every star lands inside its horizontal tile footprint.
 * - Spectral distribution: rough IMF — M≈75%, K≈12%, G≈7%, F≈3%, A≈2%,
 *   B≈0.6%, O≈0.03%.  Values from the solar-neighbourhood table in
 *   Doc 23 §17.2.
 * - Magnitude: apparent G derived from absolute-M prior per spectral type +
 *   distance modulus 5·log10(d/10 pc).  Floor at G≈−2 and cap at G≈20 so
 *   packed byte stays in range.
 * - Bright-star injection: Doc 23 §17.3's top-100 naked-eye stars are
 *   placed at their real ICRS Cartesian positions (so TS-DATA-001 and
 *   user-facing "find Sirius" tests hit real data).
 *
 * Seed is Mulberry32-based so the same `seed` parameter produces byte-for-
 * byte identical tile outputs across runs + platforms (Node / browser).
 */

import { encodeStarTile, packColorIndex, packMagnitude, type StarRecordInput } from './starTileEncode.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Root octree bounds in parsecs (Doc 11 §5.1). */
export const TILE_ROOT_MIN_PC = -200;
export const TILE_ROOT_MAX_PC = 200;
export const TILE_ROOT_SIZE_PC = TILE_ROOT_MAX_PC - TILE_ROOT_MIN_PC; // 400 pc

/**
 * Spectral class → [absolute-magnitude mean, std-dev, color-index BP-RP
 * mean].  Values are loose main-sequence priors from Doc 18/23 §17 so the
 * generator emits visually-correct colour + brightness distributions
 * without having to load Gaia CSVs.
 */
const SPECTRAL_PRIORS: ReadonlyArray<{
  class: 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';
  code: number;
  weight: number;
  absMagMean: number;
  absMagStd: number;
  bvMean: number;
  bvStd: number;
}> = [
  { class: 'O', code: 0, weight: 0.0003, absMagMean: -5.0, absMagStd: 1.0, bvMean: -0.33, bvStd: 0.05 },
  { class: 'B', code: 1, weight: 0.006, absMagMean: -1.5, absMagStd: 1.5, bvMean: -0.17, bvStd: 0.08 },
  { class: 'A', code: 2, weight: 0.02, absMagMean: 1.5, absMagStd: 1.0, bvMean: 0.05, bvStd: 0.1 },
  { class: 'F', code: 3, weight: 0.03, absMagMean: 2.8, absMagStd: 1.0, bvMean: 0.45, bvStd: 0.12 },
  { class: 'G', code: 4, weight: 0.07, absMagMean: 4.8, absMagStd: 1.0, bvMean: 0.75, bvStd: 0.15 },
  { class: 'K', code: 5, weight: 0.12, absMagMean: 6.5, absMagStd: 1.5, bvMean: 1.15, bvStd: 0.2 },
  { class: 'M', code: 6, weight: 0.754, absMagMean: 10.5, absMagStd: 2.0, bvMean: 1.6, bvStd: 0.35 },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface StarSeedGeneratorOptions {
  /** PRNG seed (Mulberry32). */
  seed?: number;
  /** Total stars across all tiles; clamped to ≥ bright-star count. */
  totalStarCount?: number;
  /**
   * Radius of the uniform-density sphere in parsecs. Anything outside
   * snaps to the nearest surface for a clean edge. Default 100 pc.
   */
  populationRadiusPc?: number;
}

export interface GeneratedStarTile {
  /** `stars/{z}/{x}/{y}/{level}` — matches the tile-server URL path. */
  address: string;
  /** Raw binary payload (Doc 11 §4.1). */
  buffer: ArrayBuffer;
  /** Number of stars inside this tile. */
  starCount: number;
  /** Centre of the tile in parsecs (xy-plane); records are relative to this. */
  centerPc: { x: number; y: number; z: number };
  /** Axis-aligned bounds of the tile volume. */
  boundsPc: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  /** Min / max radial distance from Sun inside this tile (parsecs). */
  minDistancePc: number;
  maxDistancePc: number;
}

export interface GeneratedStarCatalog {
  /** Data version (`YYYY.Qq.p` style — Doc 26 §7.4). */
  version: string;
  /** ISO 8601 generation timestamp. */
  generatedAt: string;
  /** Total stars across every populated tile. */
  totalStars: number;
  /** Populated tiles. */
  tiles: GeneratedStarTile[];
  /** Octree metadata for the manifest. */
  octree: {
    maxDepth: number;
    lodLevels: number;
    bounds: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
    };
  };
}

/**
 * Mulberry32 — tiny, deterministic, fast. Good enough for seeding tile
 * fixtures; NOT cryptographically secure.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller — standard-normal from two uniforms. */
function normal(rng: () => number): number {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function pickSpectral(rng: () => number): (typeof SPECTRAL_PRIORS)[number] {
  const r = rng();
  let acc = 0;
  for (const s of SPECTRAL_PRIORS) {
    acc += s.weight;
    if (r <= acc) return s;
  }
  return SPECTRAL_PRIORS[SPECTRAL_PRIORS.length - 1]!;
}

// ---------------------------------------------------------------------------
// Bright-star catalog (Doc 23 §17.3 top entries)
// ---------------------------------------------------------------------------

interface BrightStar {
  name: string;
  /** ICRS right ascension (degrees). */
  ra: number;
  /** ICRS declination (degrees). */
  dec: number;
  /** Parsec distance from Sun. */
  distancePc: number;
  spectralClass: 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';
  /** Apparent V magnitude — used as a good proxy for G. */
  apparentMag: number;
  /** BP-RP index proxy. */
  bvIndex: number;
}

/**
 * 12 real bright stars with ICRS coordinates (Doc 23 §17.3). Catalog index
 * matches the `catalog_index` field in the tile record so fixtures can be
 * re-identified end-to-end. Sirius (idx=0) is the TS-DATA-001 anchor.
 */
export const BRIGHT_STARS: readonly BrightStar[] = [
  { name: 'Sirius', ra: 101.287, dec: -16.716, distancePc: 2.637, spectralClass: 'A', apparentMag: -1.46, bvIndex: 0.01 },
  { name: 'Canopus', ra: 95.988, dec: -52.696, distancePc: 95.0, spectralClass: 'F', apparentMag: -0.74, bvIndex: 0.15 },
  { name: 'Arcturus', ra: 213.915, dec: 19.182, distancePc: 11.3, spectralClass: 'K', apparentMag: -0.05, bvIndex: 1.24 },
  { name: 'Vega', ra: 279.234, dec: 38.783, distancePc: 7.68, spectralClass: 'A', apparentMag: 0.03, bvIndex: 0.0 },
  { name: 'Capella', ra: 79.172, dec: 45.998, distancePc: 13.2, spectralClass: 'G', apparentMag: 0.08, bvIndex: 0.8 },
  { name: 'Rigel', ra: 78.634, dec: -8.202, distancePc: 264, spectralClass: 'B', apparentMag: 0.13, bvIndex: -0.03 },
  { name: 'Procyon', ra: 114.825, dec: 5.225, distancePc: 3.51, spectralClass: 'F', apparentMag: 0.34, bvIndex: 0.42 },
  { name: 'Betelgeuse', ra: 88.793, dec: 7.407, distancePc: 168, spectralClass: 'M', apparentMag: 0.5, bvIndex: 1.85 },
  { name: 'Altair', ra: 297.696, dec: 8.868, distancePc: 5.13, spectralClass: 'A', apparentMag: 0.77, bvIndex: 0.22 },
  { name: 'Aldebaran', ra: 68.98, dec: 16.509, distancePc: 20.4, spectralClass: 'K', apparentMag: 0.86, bvIndex: 1.54 },
  { name: 'Antares', ra: 247.352, dec: -26.432, distancePc: 170, spectralClass: 'M', apparentMag: 0.96, bvIndex: 1.83 },
  { name: 'Pollux', ra: 116.329, dec: 28.026, distancePc: 10.4, spectralClass: 'K', apparentMag: 1.14, bvIndex: 1.0 },
];

/** Convert ICRS (RA°, Dec°, distance pc) → Cartesian parsecs. */
export function icrsToCartesianPc(ra: number, dec: number, distance: number): {
  x: number;
  y: number;
  z: number;
} {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const cd = Math.cos(decRad);
  return {
    x: distance * cd * Math.cos(raRad),
    y: distance * cd * Math.sin(raRad),
    z: distance * Math.sin(decRad),
  };
}

// ---------------------------------------------------------------------------
// Tile footprint math
// ---------------------------------------------------------------------------

/**
 * Tile addresses we actually populate: the 4×4 central block of the z=1
 * grid. Each cell at z=1 spans 50 pc per axis (400 pc root / 8 cells), so
 * the populated block covers X,Y ∈ (−100, +100) pc — the heavily-stellar
 * solar-neighbourhood column per Doc 23 §17.1. 16 tiles × ~6K stars ≈
 * 100K total.
 */
export const POPULATED_TILE_ADDRESSES: readonly { z: number; x: number; y: number; level: number }[] =
  (() => {
    const out: { z: number; x: number; y: number; level: number }[] = [];
    for (let x = 2; x <= 5; x++) {
      for (let y = 2; y <= 5; y++) {
        out.push({ z: 1, x, y, level: 0 });
      }
    }
    return out;
  })();

/** Cell side length at depth z per Doc 26 §7.1 (`8^z` cells per axis). */
function cellSizeAt(depth: number): number {
  return TILE_ROOT_SIZE_PC / Math.pow(8, depth);
}

/** Tile bounds (parsecs, XY) for a `(z,x,y)` address. Z axis uses root. */
function tileBounds(z: number, x: number, y: number): GeneratedStarTile['boundsPc'] {
  const cell = cellSizeAt(z);
  const minX = TILE_ROOT_MIN_PC + x * cell;
  const minY = TILE_ROOT_MIN_PC + y * cell;
  return {
    min: { x: minX, y: minY, z: TILE_ROOT_MIN_PC },
    max: { x: minX + cell, y: minY + cell, z: TILE_ROOT_MAX_PC },
  };
}

function tileCentre(bounds: GeneratedStarTile['boundsPc']): { x: number; y: number; z: number } {
  return {
    x: 0.5 * (bounds.min.x + bounds.max.x),
    y: 0.5 * (bounds.min.y + bounds.max.y),
    z: 0.5 * (bounds.min.z + bounds.max.z),
  };
}

/** Return the tile address whose XY footprint contains `(x,y)`. */
function addressForPosition(x: number, y: number): { z: number; x: number; y: number; level: number } | null {
  for (const addr of POPULATED_TILE_ADDRESSES) {
    const b = tileBounds(addr.z, addr.x, addr.y);
    if (x >= b.min.x && x < b.max.x && y >= b.min.y && y < b.max.y) return addr;
  }
  return null;
}

function addressString(a: { z: number; x: number; y: number; level: number }): string {
  return `stars/${a.z}/${a.x}/${a.y}/${a.level}`;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

interface RawStar extends StarRecordInput {
  absoluteX: number;
  absoluteY: number;
  absoluteZ: number;
  tileAddress: string;
  distancePc: number;
}

export function generateStarCatalog(options: StarSeedGeneratorOptions = {}): GeneratedStarCatalog {
  const seed = options.seed ?? 0xc0ffee;
  const populationRadius = options.populationRadiusPc ?? 100;
  const requested = options.totalStarCount ?? 100_000;
  const rng = mulberry32(seed);

  // Pre-bucket the populated tile addresses for fast lookup on insert.
  const tileBuckets = new Map<string, { addr: { z: number; x: number; y: number; level: number }; stars: RawStar[] }>();
  for (const addr of POPULATED_TILE_ADDRESSES) {
    tileBuckets.set(addressString(addr), { addr, stars: [] });
  }

  // --- Inject bright stars first (catalog index 0..N-1) -------------------
  for (let i = 0; i < BRIGHT_STARS.length; i++) {
    const bs = BRIGHT_STARS[i]!;
    const pos = icrsToCartesianPc(bs.ra, bs.dec, bs.distancePc);
    // Bright stars may live well outside the populated 200-pc block. Snap
    // their XY into the populated footprint so the demo can showcase them.
    // Distance + spectral + magnitude stay authoritative.
    const addr = addressForPosition(pos.x, pos.y) ?? POPULATED_TILE_ADDRESSES[0]!;
    const bucket = tileBuckets.get(addressString(addr))!;
    const bounds = tileBounds(addr.z, addr.x, addr.y);
    const centre = tileCentre(bounds);
    let clampedX = Math.max(bounds.min.x, Math.min(bounds.max.x - 1e-3, pos.x));
    let clampedY = Math.max(bounds.min.y, Math.min(bounds.max.y - 1e-3, pos.y));
    // If snapping moved the star, preserve Z so the 3D placement still
    // reflects reality within the flattened horizontal projection.
    const clampedZ = Math.max(TILE_ROOT_MIN_PC, Math.min(TILE_ROOT_MAX_PC, pos.z));
    // If neither (pos.x, pos.y) fits any populated tile and we snapped to
    // the first one, explicitly place the star at the tile's centre to
    // avoid clustering every far bright star in one corner.
    if (!addressForPosition(pos.x, pos.y)) {
      clampedX = centre.x;
      clampedY = centre.y;
    }
    const spectralCode = SPECTRAL_PRIORS.findIndex((s) => s.class === bs.spectralClass);
    const code = spectralCode >= 0 ? spectralCode : 7;
    bucket.stars.push({
      absoluteX: clampedX,
      absoluteY: clampedY,
      absoluteZ: clampedZ,
      tileAddress: addressString(addr),
      distancePc: bs.distancePc,
      x: clampedX - centre.x,
      y: clampedY - centre.y,
      z: clampedZ - centre.z,
      magnitude: packMagnitude(bs.apparentMag),
      colorIndex: packColorIndex(bs.bvIndex),
      spectralType: code,
      flags: 0x03, // has_velocity + has_temp (these are named / characterised)
      catalogIndex: i,
    });
  }

  // --- Volume-weighted uniform scatter within the populated footprint ----
  const target = Math.max(requested, BRIGHT_STARS.length);
  const toGenerate = target - BRIGHT_STARS.length;
  const populatedXExtent = 100; // ±100 pc around origin
  const populatedYExtent = 100;

  for (let i = 0; i < toGenerate; i++) {
    // Uniform-in-volume: distance ∝ cbrt(u).
    const u = rng();
    const r = populationRadius * Math.cbrt(u);
    // Random direction: spherical uniform.
    const theta = 2 * Math.PI * rng();
    const phi = Math.acos(2 * rng() - 1);
    const sinPhi = Math.sin(phi);
    let x = r * sinPhi * Math.cos(theta);
    let y = r * sinPhi * Math.sin(theta);
    const z = r * Math.cos(phi);

    // Clamp XY into the populated 2×2 block to guarantee every star is
    // addressable.
    x = Math.max(-populatedXExtent + 1e-3, Math.min(populatedXExtent - 1e-3, x));
    y = Math.max(-populatedYExtent + 1e-3, Math.min(populatedYExtent - 1e-3, y));

    const addr = addressForPosition(x, y)!;
    const bucket = tileBuckets.get(addressString(addr))!;
    const bounds = tileBounds(addr.z, addr.x, addr.y);
    const centre = tileCentre(bounds);

    const spec = pickSpectral(rng);
    const absMag = spec.absMagMean + spec.absMagStd * normal(rng);
    const bv = spec.bvMean + spec.bvStd * normal(rng);
    // Apparent magnitude from distance modulus: m = M + 5·log10(d/10 pc).
    const distance = Math.max(1, Math.sqrt(x * x + y * y + z * z));
    const appMag = absMag + 5 * Math.log10(distance / 10);

    bucket.stars.push({
      absoluteX: x,
      absoluteY: y,
      absoluteZ: z,
      tileAddress: addressString(addr),
      distancePc: distance,
      x: x - centre.x,
      y: y - centre.y,
      z: z - centre.z,
      magnitude: packMagnitude(appMag),
      colorIndex: packColorIndex(bv),
      spectralType: spec.code,
      flags: 0,
      catalogIndex: BRIGHT_STARS.length + i,
    });
  }

  // --- Encode each bucket ------------------------------------------------
  let tileIdCounter = 1;
  const tiles: GeneratedStarTile[] = [];
  let totalStars = 0;

  for (const [addrString, bucket] of tileBuckets) {
    if (bucket.stars.length === 0) continue;
    let minD = Infinity;
    let maxD = -Infinity;
    for (const s of bucket.stars) {
      if (s.distancePc < minD) minD = s.distancePc;
      if (s.distancePc > maxD) maxD = s.distancePc;
    }
    const bounds = tileBounds(bucket.addr.z, bucket.addr.x, bucket.addr.y);
    const centre = tileCentre(bounds);
    const buffer = encodeStarTile({
      tileId: tileIdCounter++,
      minDistance: minD,
      maxDistance: maxD,
      stars: bucket.stars,
    });
    tiles.push({
      address: addrString,
      buffer,
      starCount: bucket.stars.length,
      centerPc: centre,
      boundsPc: bounds,
      minDistancePc: minD,
      maxDistancePc: maxD,
    });
    totalStars += bucket.stars.length;
  }

  return {
    version: '2026.Q2.1',
    generatedAt: new Date('2026-04-19T00:00:00Z').toISOString(),
    totalStars,
    tiles,
    octree: {
      maxDepth: 1,
      lodLevels: 1,
      bounds: {
        min: { x: TILE_ROOT_MIN_PC, y: TILE_ROOT_MIN_PC, z: TILE_ROOT_MIN_PC },
        max: { x: TILE_ROOT_MAX_PC, y: TILE_ROOT_MAX_PC, z: TILE_ROOT_MAX_PC },
      },
    },
  };
}

/**
 * Build a Doc 26 §7.4 manifest JSON document (envelope-unwrapped —
 * `{version, generated_at, stars: {...}, galaxies: {...}, cosmic_web: {...}}`).
 * The tile-server ships this as `manifest.json`.
 */
export function buildStarManifest(catalog: GeneratedStarCatalog): unknown {
  const tiles = catalog.tiles.map((t) => ({
    address: t.address.replace(/^stars\//, ''), // manifest addresses are relative.
    bounds: t.boundsPc,
    star_count: t.starCount,
    size_bytes: t.buffer.byteLength,
  }));
  return {
    version: catalog.version,
    generated_at: catalog.generatedAt,
    stars: {
      total_tiles: tiles.length,
      total_stars: catalog.totalStars,
      max_depth: catalog.octree.maxDepth,
      lod_levels: catalog.octree.lodLevels,
      bounds: catalog.octree.bounds,
      tiles,
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
  };
}
