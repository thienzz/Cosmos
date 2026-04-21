/**
 * HEALPix sky-pixel address encoder (T46 — Doc 23 §20 extragalactic tiles).
 *
 * HEALPix (Hierarchical Equal Area iso-Latitude Pixelization) tessellates the
 * celestial sphere into 12·Nside² equal-area pixels, where Nside is a power
 * of two. The NESTED scheme preserves locality: the tree of parent→child
 * pixels is a quad-tree, so adjacent sky regions share URL prefixes — ideal
 * for CDN cache locality.
 *
 * Doc 23 §20 fixes Nside=2048 (50.3M pixels) for the galaxy tile pyramid.
 * The T23 TileStreamingManager already handles generic tile addresses; this
 * module provides the `(ra, dec, Nside) → pixel` function the ETL pipeline
 * (T46) and the client (to request the pixel for a given viewport centre)
 * both need.
 *
 * Implementation notes
 * ====================
 *
 * 1. **NESTED scheme** (Gorski et al. 2005, §3). Child pixel index is formed
 *    by interleaving the (x, y) sub-coordinate bits inside each base-pixel
 *    face (f = 0..11). Parent pixel at order k–1 is `pix >> 2`.
 * 2. **ang2pix_nest** follows the reference-implementation structure: first
 *    project `(θ, φ)` to a face (`f`), then to face-local coordinates
 *    `(x_face, y_face)`, then interleave. Only integer/float math — no
 *    special functions beyond std sin/cos/tan.
 * 3. **Nside bound**: for JS safe-integer arithmetic (Number.MAX_SAFE_INTEGER
 *    = 2^53), order ≤ 25 is safe (pixel counts stay under 12·2^50). Doc 23's
 *    Nside=2048 is order=11 — plenty of headroom.
 *
 * All inputs in ICRS J2000 (Doc 23 §2.1). `ra ∈ [0, 360°)`, `dec ∈ [−90, 90°]`.
 * Conversion to HEALPix spherical polar: `θ = π/2 − dec`, `φ = ra`.
 */

/** Largest Nside we support (order 25 — keeps pixel count inside safe ints). */
export const HEALPIX_MAX_NSIDE = 1 << 25;

export class HealpixError extends Error {
  readonly code: 'INVALID_NSIDE' | 'INVALID_COORDINATE';
  constructor(code: 'INVALID_NSIDE' | 'INVALID_COORDINATE', message: string) {
    super(message);
    this.name = 'HealpixError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Nside/order helpers
// ---------------------------------------------------------------------------

/** Order k such that Nside = 2^k, or throw if Nside is not a power of two. */
export function healpixNsideToOrder(nside: number): number {
  if (!Number.isInteger(nside) || nside <= 0 || nside > HEALPIX_MAX_NSIDE) {
    throw new HealpixError('INVALID_NSIDE', `Nside ${nside} out of range`);
  }
  if ((nside & (nside - 1)) !== 0) {
    throw new HealpixError('INVALID_NSIDE', `Nside ${nside} is not a power of two`);
  }
  return Math.log2(nside);
}

/** Total pixel count at a given Nside: 12·Nside². */
export function healpixNpix(nside: number): number {
  healpixNsideToOrder(nside); // validation
  return 12 * nside * nside;
}

// ---------------------------------------------------------------------------
// Bit interleaving (Morton order) — converts face-local (x, y) → subpixel id.
// Only the low-order `bits` bits of x, y are used.
// ---------------------------------------------------------------------------

/**
 * Spread the low bits of an integer so `b0 b1 b2 …` becomes `b0 0 b1 0 b2 0 …`.
 * Limit: ≤ 26 bits input (output fits in 52 bits — safe integer range).
 */
function bitInterleavePart(v: number): number {
  // Standard bit-twiddle, but JavaScript's bitwise ops are 32-bit so split
  // the input into two 16-bit halves and process independently then merge.
  let x = v & 0xffff;
  x = (x | (x << 8))  & 0x00ff00ff;
  x = (x | (x << 4))  & 0x0f0f0f0f;
  x = (x | (x << 2))  & 0x33333333;
  x = (x | (x << 1))  & 0x55555555;
  const lo = x >>> 0;

  let y = (v >>> 16) & 0xffff;
  y = (y | (y << 8))  & 0x00ff00ff;
  y = (y | (y << 4))  & 0x0f0f0f0f;
  y = (y | (y << 2))  & 0x33333333;
  y = (y | (y << 1))  & 0x55555555;
  const hi = y >>> 0;

  // Combine lo and hi into a ≤ 64-bit integer using JS Number for values
  // inside the safe range (≤ 2^52).
  return hi * 0x100000000 + lo;
}

/**
 * Interleave the bits of (x, y) to form `y0 x0 y1 x1 y2 x2 …`. Input values
 * must fit in 26 bits so the result fits in a safe integer.
 */
function bitInterleave(x: number, y: number): number {
  return bitInterleavePart(x) + bitInterleavePart(y) * 2;
}

// ---------------------------------------------------------------------------
// ang2pix_nest — celestial-sphere coord → HEALPix pixel (NESTED scheme)
// ---------------------------------------------------------------------------

/**
 * Convert ICRS equatorial (RA, Dec) in degrees → HEALPix pixel index at the
 * given Nside using the NESTED scheme.
 *
 * Implements Gorski et al. 2005 §4.1 ang2pix_nest, translated from the
 * healpy `pix_tools.f` reference. The algorithm splits the sphere into
 * equatorial (|z| ≤ 2/3) and polar caps, maps each to face-local square
 * coordinates (x_face, y_face ∈ [0, Nside)), then interleaves the bits to
 * form the NESTED pixel index `(f << 2·k) | Morton(x_face, y_face)`.
 */
export function healpixAng2PixNest(
  raDeg: number,
  decDeg: number,
  nside: number,
): number {
  const order = healpixNsideToOrder(nside);

  if (!Number.isFinite(raDeg) || !Number.isFinite(decDeg)) {
    throw new HealpixError('INVALID_COORDINATE', 'ra/dec must be finite numbers');
  }
  if (decDeg < -90 || decDeg > 90) {
    throw new HealpixError('INVALID_COORDINATE', `dec ${decDeg} out of [-90, 90]`);
  }

  // Normalise RA to [0, 360) — catalogues frequently deliver (-180, 180].
  const raNorm = ((raDeg % 360) + 360) % 360;

  const phi = (raNorm * Math.PI) / 180;        // longitude [0, 2π)
  const theta = (Math.PI / 2) - (decDeg * Math.PI) / 180; // colatitude [0, π]

  const z = Math.cos(theta);
  const za = Math.abs(z);
  const tt = (phi * 2) / Math.PI; // normalised longitude in [0, 4).

  let face = 0;
  let ix = 0;
  let iy = 0;

  if (za <= 2 / 3) {
    // Equatorial region.
    const temp1 = nside * (0.5 + tt);
    const temp2 = nside * (z * 0.75);
    const jp = Math.floor(temp1 - temp2);  // index of ascending edge line.
    const jm = Math.floor(temp1 + temp2);  // index of descending edge line.
    const ifp = Math.floor(jp / nside);
    const ifm = Math.floor(jm / nside);
    if (ifp === ifm) {
      face = (ifp % 4) + 4;
    } else if (ifp < ifm) {
      face = ifp % 4;                // north
    } else {
      face = (ifm % 4) + 8;           // south
    }
    ix = jm % nside;
    iy = nside - 1 - (jp % nside);
  } else {
    // Polar cap.
    const tp = tt - Math.floor(tt);
    const tmp = nside * Math.sqrt(3 * (1 - za));
    const jp = Math.floor(tp * tmp);
    const jm = Math.floor((1 - tp) * tmp);
    ix = jp;
    iy = jm;
    if (z >= 0) {
      face = Math.floor(tt) % 4;     // faces 0..3
      ix = nside - 1 - jm;
      iy = nside - 1 - jp;
    } else {
      face = (Math.floor(tt) % 4) + 8; // faces 8..11
    }
  }

  // Clamp (guards against floating-point spill past the face edge).
  if (ix < 0) ix = 0;
  if (ix > nside - 1) ix = nside - 1;
  if (iy < 0) iy = 0;
  if (iy > nside - 1) iy = nside - 1;

  const sub = bitInterleave(ix, iy);
  // Nested pixel index: shift face by 2·order bits, add sub-pixel.
  // For order > 26 we would overflow safe integers — guarded at the top.
  const facePower = Math.pow(2, 2 * order);
  return face * facePower + sub;
}

// ---------------------------------------------------------------------------
// Parent helper — walking up the quadtree.
// ---------------------------------------------------------------------------

/**
 * Return the parent pixel (order−1) of a NESTED pixel. Useful for LOD
 * streaming — a coarser tile covers 4× finer child pixels.
 */
export function healpixParentNest(pix: number): number {
  if (!Number.isInteger(pix) || pix < 0) {
    throw new HealpixError('INVALID_COORDINATE', `pixel ${pix} not a non-negative integer`);
  }
  return Math.floor(pix / 4);
}

/**
 * Tile URL address encoder — produces the `order/pixel` portion used by the
 * tile server (Doc 26 §7.2 `/tiles/galaxies/{order}/{pixel}`). Kept here so
 * callers have one canonical spot for "resolve a sky coordinate to a tile".
 */
export function healpixGalaxyTileAddress(
  raDeg: number,
  decDeg: number,
  nside: number,
): { order: number; pixel: number } {
  const order = healpixNsideToOrder(nside);
  const pixel = healpixAng2PixNest(raDeg, decDeg, nside);
  return { order, pixel };
}
