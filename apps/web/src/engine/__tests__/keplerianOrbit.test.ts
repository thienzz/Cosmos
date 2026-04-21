import { describe, expect, it } from 'vitest';

import { PLANETS, bodyById } from '@/data/solarSystemCatalog';

import { keplerPosition, keplerRadius, sampleOrbitPath } from '../keplerianOrbit';

const AU_KM = 149_597_870.7;
const J2000 = 2_451_545.0;

describe('keplerPosition', () => {
  it('Earth distance from Sun at J2000 ≈ 1 AU', () => {
    const earth = bodyById(399)!;
    const r = keplerRadius(earth.orbit, J2000);
    expect(r / AU_KM).toBeCloseTo(0.983, 1); // perihelion-side at J2000
  });

  it('periapsis < a < apoapsis for every planet', () => {
    for (const p of PLANETS) {
      const e = p.orbit.e;
      const a = p.orbit.a_km;
      // Sample 64 points and bound the radius.
      let rMin = Infinity;
      let rMax = -Infinity;
      for (let k = 0; k < 64; k++) {
        const jd = J2000 + (k / 64) * p.orbit.periodDays;
        const r = keplerRadius(p.orbit, jd);
        rMin = Math.min(rMin, r);
        rMax = Math.max(rMax, r);
      }
      // Tolerances loosen with sampling density — ±1% is plenty at 64 samples.
      expect(rMin).toBeGreaterThan(a * (1 - e) * 0.99);
      expect(rMax).toBeLessThan(a * (1 + e) * 1.01);
    }
  });

  it('zero-semi-major-axis body returns origin', () => {
    const p = keplerPosition(
      {
        a_km: 0, e: 0, i_deg: 0, Omega_deg: 0, omega_deg: 0, M0_deg: 0,
        periodDays: 0,
      },
      J2000,
    );
    expect(p).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('orbit is periodic — position repeats after one period', () => {
    const mars = bodyById(499)!;
    const p0 = keplerPosition(mars.orbit, J2000);
    const p1 = keplerPosition(mars.orbit, J2000 + mars.orbit.periodDays);
    expect(p1.x).toBeCloseTo(p0.x, 0);
    expect(p1.y).toBeCloseTo(p0.y, 0);
    expect(p1.z).toBeCloseTo(p0.z, 0);
  });

  it('inclined orbit has non-zero z component', () => {
    const pluto = bodyById(999)!;
    // Pluto's 17° inclination → z must be nonzero at most epochs.
    let maxAbsZ = 0;
    for (let k = 0; k < 12; k++) {
      const p = keplerPosition(pluto.orbit, J2000 + (k / 12) * pluto.orbit.periodDays);
      maxAbsZ = Math.max(maxAbsZ, Math.abs(p.z));
    }
    expect(maxAbsZ).toBeGreaterThan(AU_KM * 5); // ~10 AU above ecliptic at node max
  });

  it('retrograde moon (Triton) still returns a finite position', () => {
    const triton = bodyById(801)!;
    const p = keplerPosition(triton.orbit, J2000 + 100);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
    expect(Number.isFinite(p.z)).toBe(true);
    const r = keplerRadius(triton.orbit, J2000 + 100);
    expect(r).toBeCloseTo(triton.orbit.a_km, 0);
  });
});

describe('sampleOrbitPath', () => {
  it('returns segments+1 points (closed loop)', () => {
    const earth = bodyById(399)!;
    const pts = sampleOrbitPath(earth.orbit, 64);
    expect(pts).toHaveLength(65);
    // First and last point should coincide (loop closure) within float
    // roundoff.
    expect(pts[0]!.x).toBeCloseTo(pts[64]!.x, 3);
    expect(pts[0]!.y).toBeCloseTo(pts[64]!.y, 3);
  });

  it('returns empty array for degenerate orbit', () => {
    expect(sampleOrbitPath({
      a_km: 0, e: 0, i_deg: 0, Omega_deg: 0, omega_deg: 0, M0_deg: 0,
      periodDays: 0,
    })).toEqual([]);
  });

  it('path radius matches semi-major axis on average', () => {
    const jupiter = bodyById(599)!;
    const pts = sampleOrbitPath(jupiter.orbit, 128);
    const avg =
      pts.reduce((acc, p) => acc + Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z), 0) /
      pts.length;
    // Average radius of an ellipse sampled uniformly in eccentric anomaly is
    // ≈ a (not quite — off by a factor ~1 − e²/4); tolerance ~5%.
    expect(avg / jupiter.orbit.a_km).toBeGreaterThan(0.9);
    expect(avg / jupiter.orbit.a_km).toBeLessThan(1.1);
  });
});
