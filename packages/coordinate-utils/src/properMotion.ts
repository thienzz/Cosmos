/**
 * Proper-motion propagation (Doc 23 §2.5).
 *
 * Linear-in-time first-order approximation:
 *   α(t) = α₀ + (μα* / cos δ₀) · Δt
 *   δ(t) = δ₀ + μδ · Δt
 *   r(t) = r₀ + v_r · Δt
 *
 * Accurate for Δt up to ~10⁴ years for typical stars. For longer epochs
 * (or very high-PM stars like Barnard's), a full 3D Cartesian propagation
 * with radial velocity is safer — scoped into T26 with full Gaia ingest.
 */
import { PC_PER_KMS_PER_YEAR } from './constants.js';
import type { SphericalIcrs } from './icrs.js';
import { wrapDeg360, DEG_TO_RAD } from './primitives.js';

export interface ProperMotionInputs {
  /** Right ascension at epoch (degrees). */
  ra: number;
  /** Declination at epoch (degrees). */
  dec: number;
  /** Distance at epoch (parsecs). */
  distance: number;
  /** μα* = μα · cos(δ) in mas/yr. */
  pmRaCosDecMasPerYr: number;
  /** μδ in mas/yr. */
  pmDecMasPerYr: number;
  /** Radial velocity (km/s). Optional — omit for zero. */
  radialVelocityKmS?: number;
}

/** Milliarcseconds → degrees. */
const MAS_TO_DEG = 1 / 3_600_000;

/**
 * Propagate ICRS (RA, Dec, distance) by `deltaYears` Julian years.
 */
export function propagateProperMotion(
  inputs: ProperMotionInputs,
  deltaYears: number,
): SphericalIcrs {
  const cosDec = Math.cos(inputs.dec * DEG_TO_RAD);
  const pmRaDegPerYr = (inputs.pmRaCosDecMasPerYr * MAS_TO_DEG) / Math.max(cosDec, 1e-8);
  const pmDecDegPerYr = inputs.pmDecMasPerYr * MAS_TO_DEG;

  const ra = wrapDeg360(inputs.ra + pmRaDegPerYr * deltaYears);
  const dec = clampDec(inputs.dec + pmDecDegPerYr * deltaYears);

  const distance =
    inputs.distance +
    (inputs.radialVelocityKmS ?? 0) * deltaYears * PC_PER_KMS_PER_YEAR;

  return { ra, dec, distance };
}

function clampDec(deg: number): number {
  if (deg > 90) return 90;
  if (deg < -90) return -90;
  return deg;
}
