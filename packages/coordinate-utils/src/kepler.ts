/**
 * Kepler-equation solver using Danby's quartic-convergence method.
 * References: Danby, J. M. A. (1988) *Fundamentals of Celestial Mechanics*,
 * §6.6; widely redeveloped because it stays stable at e → 1.
 *
 * We solve Kepler's equation for elliptical orbits:
 *   `M = E − e · sin(E)`
 *
 * Hyperbolic (e > 1) orbits would need `M = e · sinh(F) − F` — not needed
 * at the scale levels that drive T10 (comets use high-e ellipses; genuine
 * hyperbolic encounters can be added in T12).
 */
import { wrapRadPi } from './primitives.js';

export interface KeplerSolution {
  /** Eccentric anomaly E (radians). */
  E: number;
  /** True anomaly ν (radians, `(−π, π]`). */
  nu: number;
  /** Iterations performed. */
  iterations: number;
  /** `f(E) = E − e sin(E) − M` at the returned E. */
  residual: number;
}

export interface KeplerOptions {
  /** Absolute tolerance on the residual. Default 1e-12. */
  tolerance?: number;
  /** Hard cap on Newton iterations. Default 50. */
  maxIter?: number;
}

const DEFAULT_OPTIONS: Required<KeplerOptions> = {
  tolerance: 1e-12,
  maxIter: 50,
};

/**
 * Solve Kepler's equation for an elliptic orbit.
 *
 * `M` is the mean anomaly in radians and may lie outside `[0, 2π)` — it's
 * wrapped internally. `e ∈ [0, 1)`. Throws on invalid eccentricity.
 */
export function solveKepler(M: number, e: number, options: KeplerOptions = {}): KeplerSolution {
  if (!Number.isFinite(M)) throw new Error(`Kepler: M must be finite (got ${M})`);
  if (!Number.isFinite(e) || e < 0 || e >= 1) {
    throw new Error(`Kepler: elliptic solver requires 0 ≤ e < 1 (got ${e})`);
  }
  const { tolerance, maxIter } = { ...DEFAULT_OPTIONS, ...options };

  const Mwrapped = wrapRadPi(M);

  // Trivial case: circle.
  if (e === 0) {
    return { E: Mwrapped, nu: Mwrapped, iterations: 0, residual: 0 };
  }

  // Danby's seed — O(e) for moderate e, stays within attraction basin even
  // near e = 1.
  let E = Mwrapped + Math.sign(Math.sin(Mwrapped)) * 0.85 * e;
  if (Math.sin(Mwrapped) === 0) E = Mwrapped; // avoid 0·sign → 0 seed at M=0

  for (let i = 0; i < maxIter; i++) {
    const sinE = Math.sin(E);
    const cosE = Math.cos(E);
    const f = E - e * sinE - Mwrapped;
    if (Math.abs(f) < tolerance) {
      return {
        E,
        nu: trueAnomalyFromEccentric(E, e),
        iterations: i,
        residual: f,
      };
    }
    const fp = 1 - e * cosE;
    const fpp = e * sinE;
    const fppp = e * cosE;

    const delta1 = -f / fp;
    const delta2 = -f / (fp + 0.5 * delta1 * fpp);
    const delta3 =
      -f / (fp + 0.5 * delta2 * fpp + ((delta2 * delta2) / 6) * fppp);
    E += delta3;
  }

  // Fall back to reporting the best E we have rather than throwing — the
  // caller can decide how to treat the miss.
  const residual = E - e * Math.sin(E) - Mwrapped;
  return {
    E,
    nu: trueAnomalyFromEccentric(E, e),
    iterations: maxIter,
    residual,
  };
}

/**
 * Convert eccentric anomaly E to true anomaly ν using the half-angle
 * formula — numerically stable over the full `[0, 2π)` range.
 *
 * `tan(ν/2) = sqrt((1+e)/(1−e)) · tan(E/2)`
 */
export function trueAnomalyFromEccentric(E: number, e: number): number {
  const halfE = E / 2;
  const s = Math.sqrt(1 + e) * Math.sin(halfE);
  const c = Math.sqrt(1 - e) * Math.cos(halfE);
  return 2 * Math.atan2(s, c);
}

/** Eccentric anomaly from true anomaly — exact inverse of the function above. */
export function eccentricAnomalyFromTrue(nu: number, e: number): number {
  const halfNu = nu / 2;
  const s = Math.sqrt(1 - e) * Math.sin(halfNu);
  const c = Math.sqrt(1 + e) * Math.cos(halfNu);
  return 2 * Math.atan2(s, c);
}

/**
 * Mean anomaly at epoch + elapsed time → mean anomaly now.
 *
 * @param meanAnomalyAtEpoch `M₀` in radians.
 * @param meanMotion `n` in radians per unit time (same units as `dt`).
 * @param dt elapsed time since the epoch.
 */
export function meanAnomalyAt(meanAnomalyAtEpoch: number, meanMotion: number, dt: number): number {
  return meanAnomalyAtEpoch + meanMotion * dt;
}
