/**
 * ICRS spherical ↔ Cartesian conversions (Doc 23 §2.1).
 * Angles in degrees, distance in parsecs; callers wanting radians should
 * multiply by `DEG_TO_RAD` before calling.
 */
import {
  DEG_TO_RAD,
  RAD_TO_DEG,
  clampUnit,
  wrapDeg360,
  type Vec3D,
} from './primitives.js';

export interface SphericalIcrs {
  /** Right ascension (degrees, 0–360). */
  ra: number;
  /** Declination (degrees, −90..+90). */
  dec: number;
  /** Radial distance (parsecs). */
  distance: number;
}

/**
 * Convert ICRS spherical (RA, Dec, r) to Cartesian in the same units as `r`.
 *
 * ```
 * x = r · cos(δ) · cos(α)
 * y = r · cos(δ) · sin(α)
 * z = r · sin(δ)
 * ```
 */
export function icrsToCartesian(
  raDeg: number,
  decDeg: number,
  distance: number,
): Vec3D {
  const ra = raDeg * DEG_TO_RAD;
  const dec = decDeg * DEG_TO_RAD;
  const cosDec = Math.cos(dec);
  return {
    x: distance * cosDec * Math.cos(ra),
    y: distance * cosDec * Math.sin(ra),
    z: distance * Math.sin(dec),
  };
}

/**
 * Inverse of `icrsToCartesian`. Guards against:
 *   - Polar singularities (x=y=0) — RA is undefined; we pin RA=0 and return
 *     dec=±90°.
 *   - Float drift in `asin` — input ratio clamped to `[-1, 1]`.
 *
 * Returned RA is wrapped to `[0, 360)`.
 */
export function cartesianToIcrs(v: Vec3D): SphericalIcrs {
  const distance = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (distance === 0) {
    return { ra: 0, dec: 0, distance: 0 };
  }

  const decRad = Math.asin(clampUnit(v.z / distance));
  // atan2(0, 0) returns 0 in JS — matches the "undefined RA" pole convention.
  const raRad = Math.atan2(v.y, v.x);
  return {
    ra: wrapDeg360(raRad * RAD_TO_DEG),
    dec: decRad * RAD_TO_DEG,
    distance,
  };
}

/** Direction-only (unit vector) conversion — skips distance scaling. */
export function icrsUnitVector(raDeg: number, decDeg: number): Vec3D {
  return icrsToCartesian(raDeg, decDeg, 1);
}
