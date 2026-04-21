/**
 * Reference-frame transformations (Doc 23 §2.2).
 *
 * All matrices act on Cartesian vectors. Angular spherical conversions are
 * expressed as `icrsToXxx()` convenience functions that chain through
 * Cartesian — matching the recipe in Doc 23 §2.1.
 */
import { ICRS_TO_GALACTIC, OBLIQUITY_J2000_RAD } from './constants.js';
import { cartesianToIcrs, icrsToCartesian, type SphericalIcrs } from './icrs.js';
import type { Vec3D } from './primitives.js';

// ---------------------------------------------------------------------------
// Matrix ops (row-major 3×3)
// ---------------------------------------------------------------------------

type Mat3 = readonly (readonly [number, number, number])[];

function applyMatrix(m: Mat3, v: Vec3D): Vec3D {
  const r0 = m[0]!;
  const r1 = m[1]!;
  const r2 = m[2]!;
  return {
    x: r0[0] * v.x + r0[1] * v.y + r0[2] * v.z,
    y: r1[0] * v.x + r1[1] * v.y + r1[2] * v.z,
    z: r2[0] * v.x + r2[1] * v.y + r2[2] * v.z,
  };
}

function transpose3(m: Mat3): Mat3 {
  return [
    [m[0]![0], m[1]![0], m[2]![0]],
    [m[0]![1], m[1]![1], m[2]![1]],
    [m[0]![2], m[1]![2], m[2]![2]],
  ];
}

// Cached inverse (rotation matrix ⇒ inverse = transpose).
const GALACTIC_TO_ICRS: Mat3 = transpose3(ICRS_TO_GALACTIC);

// ---------------------------------------------------------------------------
// Galactic ↔ ICRS
// ---------------------------------------------------------------------------

export function icrsCartesianToGalactic(v: Vec3D): Vec3D {
  return applyMatrix(ICRS_TO_GALACTIC, v);
}

export function galacticCartesianToIcrs(v: Vec3D): Vec3D {
  return applyMatrix(GALACTIC_TO_ICRS, v);
}

/**
 * Convert ICRS spherical (RA, Dec, distance) to galactic longitude/latitude
 * (l, b) in degrees, plus the same radial distance.
 */
export interface SphericalGalactic {
  /** Galactic longitude ℓ (degrees, 0–360). */
  l: number;
  /** Galactic latitude b (degrees, −90..+90). */
  b: number;
  distance: number;
}

export function icrsToGalactic(icrs: SphericalIcrs): SphericalGalactic {
  const cart = icrsToCartesian(icrs.ra, icrs.dec, icrs.distance);
  const gal = icrsCartesianToGalactic(cart);
  const sph = cartesianToIcrs(gal);
  return { l: sph.ra, b: sph.dec, distance: sph.distance };
}

export function galacticToIcrs(gal: SphericalGalactic): SphericalIcrs {
  const cart = icrsToCartesian(gal.l, gal.b, gal.distance);
  const icrsCart = galacticCartesianToIcrs(cart);
  return cartesianToIcrs(icrsCart);
}

// ---------------------------------------------------------------------------
// Ecliptic ↔ ICRS (J2000)
// ---------------------------------------------------------------------------
//
// Rotation about the X axis by the obliquity ε. The matrix in Doc 23 §2.2 is
// written for the transform ICRS → ecliptic, applying a negative rotation
// around +X so that ICRS +Z maps to ecliptic +Z rotated by +ε.

const COS_OBLIQUITY = Math.cos(OBLIQUITY_J2000_RAD);
const SIN_OBLIQUITY = Math.sin(OBLIQUITY_J2000_RAD);

const ICRS_TO_ECLIPTIC: Mat3 = [
  [1, 0, 0],
  [0, COS_OBLIQUITY, SIN_OBLIQUITY],
  [0, -SIN_OBLIQUITY, COS_OBLIQUITY],
];

const ECLIPTIC_TO_ICRS: Mat3 = transpose3(ICRS_TO_ECLIPTIC);

export function icrsCartesianToEcliptic(v: Vec3D): Vec3D {
  return applyMatrix(ICRS_TO_ECLIPTIC, v);
}

export function eclipticCartesianToIcrs(v: Vec3D): Vec3D {
  return applyMatrix(ECLIPTIC_TO_ICRS, v);
}

export interface SphericalEcliptic {
  /** Ecliptic longitude λ (degrees, 0–360). */
  lambda: number;
  /** Ecliptic latitude β (degrees, −90..+90). */
  beta: number;
  distance: number;
}

export function icrsToEcliptic(icrs: SphericalIcrs): SphericalEcliptic {
  const cart = icrsToCartesian(icrs.ra, icrs.dec, icrs.distance);
  const ecl = icrsCartesianToEcliptic(cart);
  const sph = cartesianToIcrs(ecl);
  return { lambda: sph.ra, beta: sph.dec, distance: sph.distance };
}

export function eclipticToIcrs(ecl: SphericalEcliptic): SphericalIcrs {
  const cart = icrsToCartesian(ecl.lambda, ecl.beta, ecl.distance);
  const icrsCart = eclipticCartesianToIcrs(cart);
  return cartesianToIcrs(icrsCart);
}
