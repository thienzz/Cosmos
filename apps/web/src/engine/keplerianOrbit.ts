import {
  J2000_JULIAN_DATE,
  solveKepler,
  trueAnomalyFromEccentric,
} from '@cosmos/coordinate-utils';

import type { KeplerianElements } from '@/data/solarSystemCatalog';

/**
 * Keplerian-orbit propagator for Doc 23 §8.3/§8.5 elements.
 *
 * The real ephemeris service (T12) uses JPL DE441 Chebyshev coefficients for
 * sub-kilometre accuracy. Until the HTTP-fetch wrapper lands in T18, the
 * browser drives planet/moon positions from two-body Keplerian math seeded
 * from the J2000.0 osculating elements in `solarSystemCatalog.ts`. That's
 * accurate to ~10⁻³ AU over a decade for the major planets — good enough for
 * educational playback.
 *
 * Output frame: the parent's equatorial plane, in km. The SolarSystemRenderer
 * converts to the world-scene frame via its chosen unit scale.
 */

export interface Vec3Km {
  x: number;
  y: number;
  z: number;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Compute the parent-centric Cartesian position of a body at an arbitrary JD.
 *
 * The formula follows the classical six-element → Cartesian pipeline:
 *
 *   1. M(t) = M0 + n · (t − t0)         — mean anomaly (wraps internally)
 *   2. E = solveKepler(M, e)            — eccentric anomaly via Danby
 *   3. ν = 2 · atan(√((1+e)/(1−e)) · tan(E/2))  — true anomaly
 *   4. r = a · (1 − e · cos E)          — radius
 *   5. Rotate (r·cosν, r·sinν, 0) by ω → Ω → i to the parent's reference
 *      plane (standard 3-1-3 Euler sequence).
 *
 * Retrograde orbits (negative `periodDays`) are handled by running the mean
 * motion in reverse — Triton's 156° inclination is represented in the `i`
 * angle, so the retrograde-direction stays consistent.
 */
export function keplerPosition(
  el: KeplerianElements,
  jd: number,
  out?: Vec3Km,
): Vec3Km {
  const result: Vec3Km = out ?? { x: 0, y: 0, z: 0 };
  if (el.a_km === 0 || el.periodDays === 0) {
    result.x = 0;
    result.y = 0;
    result.z = 0;
    return result;
  }

  const n = (2 * Math.PI) / el.periodDays;                   // rad / day
  const dt = jd - J2000_JULIAN_DATE;
  const M = el.M0_deg * DEG_TO_RAD + n * dt;                 // wraps inside solveKepler

  const e = Math.max(0, Math.min(0.999_5, el.e));            // Danby stays stable < 1
  const { E } = solveKepler(M, e);
  const nu = trueAnomalyFromEccentric(E, e);
  const r = el.a_km * (1 - e * Math.cos(E));

  // Orbital-plane Cartesian (periapsis along +X).
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Rotate into parent-equatorial frame: rotate ω around Z, then i around X,
  // then Ω around Z. This is the standard Murray-Dermott §2.8 sequence.
  const cosw = Math.cos(el.omega_deg * DEG_TO_RAD);
  const sinw = Math.sin(el.omega_deg * DEG_TO_RAD);
  const cosi = Math.cos(el.i_deg * DEG_TO_RAD);
  const sini = Math.sin(el.i_deg * DEG_TO_RAD);
  const cosO = Math.cos(el.Omega_deg * DEG_TO_RAD);
  const sinO = Math.sin(el.Omega_deg * DEG_TO_RAD);

  // After ω rotation (in-plane).
  const x1 = xOrb * cosw - yOrb * sinw;
  const y1 = xOrb * sinw + yOrb * cosw;

  // Lift out of plane via i.
  const y2 = y1 * cosi;
  const z2 = y1 * sini;

  // Rotate by Ω around Z.
  result.x = x1 * cosO - y2 * sinO;
  result.y = x1 * sinO + y2 * cosO;
  result.z = z2;
  return result;
}

/** Convenience — distance from parent at a given epoch (km). */
export function keplerRadius(el: KeplerianElements, jd: number): number {
  const p = keplerPosition(el, jd);
  return Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
}

/**
 * Sample an orbit uniformly in eccentric-anomaly space for path rendering.
 * `segments` controls the polyline density; 128 is enough for visually
 * smooth circles-to-mild-ellipses.
 */
export function sampleOrbitPath(el: KeplerianElements, segments = 128): Vec3Km[] {
  if (el.a_km === 0) return [];
  const out: Vec3Km[] = [];
  const e = Math.max(0, Math.min(0.999_5, el.e));

  const cosw = Math.cos(el.omega_deg * DEG_TO_RAD);
  const sinw = Math.sin(el.omega_deg * DEG_TO_RAD);
  const cosi = Math.cos(el.i_deg * DEG_TO_RAD);
  const sini = Math.sin(el.i_deg * DEG_TO_RAD);
  const cosO = Math.cos(el.Omega_deg * DEG_TO_RAD);
  const sinO = Math.sin(el.Omega_deg * DEG_TO_RAD);

  for (let k = 0; k <= segments; k++) {
    const E = (k / segments) * Math.PI * 2;
    const nu = trueAnomalyFromEccentric(E, e);
    const r = el.a_km * (1 - e * Math.cos(E));
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);

    const x1 = xOrb * cosw - yOrb * sinw;
    const y1 = xOrb * sinw + yOrb * cosw;
    const x2 = x1;
    const y2 = y1 * cosi;
    const z2 = y1 * sini;
    out.push({
      x: x2 * cosO - y2 * sinO,
      y: x2 * sinO + y2 * cosO,
      z: z2,
    });
  }
  return out;
}
