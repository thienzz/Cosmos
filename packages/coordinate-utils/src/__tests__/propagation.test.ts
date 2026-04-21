import { describe, expect, it } from 'vitest';

import { worldToGpu, toCameraRelative, toFloat32 } from '../cameraRelative.js';
import {
  METERS_PER_PARSEC,
  METERS_PER_AU,
  PARSECS_PER_LIGHT_YEAR,
} from '../constants.js';
import {
  distanceFromModulus,
  distanceModulus,
  distanceToParallax,
  parallaxToDistance,
} from '../parallax.js';
import { propagateProperMotion } from '../properMotion.js';

describe('TS-COORD-008 — proper motion propagation', () => {
  it("Barnard's Star moves ~10.3 arcsec/yr; over 100yr ≈ 0.286°", () => {
    // Barnard's Star ICRS J2000: RA 269.45°, Dec +4.67°, PM (−798, +10328) mas/yr, d 1.83 pc
    const start = {
      ra: 269.45,
      dec: 4.67,
      distance: 1.83,
      pmRaCosDecMasPerYr: -798,
      pmDecMasPerYr: 10_328,
    };
    const then = propagateProperMotion(start, 100);
    // Dec shift over 100 yr = 10.328 arcsec/yr × 100 = 1032.8 arcsec = 0.2869°.
    expect(then.dec - start.dec).toBeCloseTo(0.2869, 3);
  });

  it('radial velocity shifts distance', () => {
    const start = {
      ra: 0,
      dec: 0,
      distance: 10,
      pmRaCosDecMasPerYr: 0,
      pmDecMasPerYr: 0,
      radialVelocityKmS: 10, // moving away at 10 km/s
    };
    const then = propagateProperMotion(start, 1_000_000);
    expect(then.distance).toBeGreaterThan(start.distance);
  });

  it('RA wraps through 360°', () => {
    const start = {
      ra: 359.9,
      dec: 0,
      distance: 1,
      pmRaCosDecMasPerYr: 720_000, // 720 arcsec/yr — artificial, for wrap test
      pmDecMasPerYr: 0,
    };
    const then = propagateProperMotion(start, 5);
    expect(then.ra).toBeGreaterThanOrEqual(0);
    expect(then.ra).toBeLessThan(360);
  });

  it('dec clamps at the pole', () => {
    const near = propagateProperMotion(
      {
        ra: 0,
        dec: 89.9,
        distance: 1,
        pmRaCosDecMasPerYr: 0,
        pmDecMasPerYr: 720_000, // massively overshoot
      },
      1,
    );
    expect(near.dec).toBeLessThanOrEqual(90);
    expect(near.dec).toBeGreaterThanOrEqual(-90);
  });
});

describe('TS-COORD-009 — parallax ↔ distance', () => {
  it('parallax=1000 mas (1 arcsec) → 1 pc', () => {
    expect(parallaxToDistance(1000)).toBeCloseTo(1, 12);
    expect(distanceToParallax(1)).toBeCloseTo(1000, 12);
  });

  it('Sirius parallax 379.21 mas → 2.637 pc', () => {
    expect(parallaxToDistance(379.21)).toBeCloseTo(2.637, 3);
    expect(distanceToParallax(2.637)).toBeCloseTo(379.2, 0);
  });

  it('clamps negative or zero parallax to a large cap', () => {
    expect(parallaxToDistance(-5)).toBeLessThan(Number.POSITIVE_INFINITY);
    expect(parallaxToDistance(-5)).toBeGreaterThan(1e5);
    expect(parallaxToDistance(0)).toBeGreaterThan(1e5);
  });

  it('NaN parallax → Infinity (unknown distance sentinel)', () => {
    expect(parallaxToDistance(NaN)).toBe(Number.POSITIVE_INFINITY);
  });

  it('distance modulus round-trips', () => {
    for (const d of [1, 10, 100, 1000, 10_000]) {
      const mu = distanceModulus(d);
      expect(distanceFromModulus(mu)).toBeCloseTo(d, 10);
    }
  });
});

describe('Constants sanity', () => {
  it('1 pc = 206265 AU (within rounding)', () => {
    const ratio = METERS_PER_PARSEC / METERS_PER_AU;
    expect(ratio).toBeCloseTo(206_264.8, 0);
  });
  it('1 pc ≈ 3.2616 ly', () => {
    expect(PARSECS_PER_LIGHT_YEAR).toBeCloseTo(0.306_601, 5);
  });
});

describe('Camera-relative transform (Doc 23 §4.2)', () => {
  it('preserves metre precision at AU-scale camera positions', () => {
    // Camera at 1 AU (1.496e11 m) — well within float64 precision (ε ≈ 2e-5)
    // but outside float32's (step ~8 km). Subtracting in float64 then
    // casting to float32 recovers the 1 m offset.
    const cameraPos = { x: 1.496e11, y: 0, z: 0 };
    const objectPos = { x: 1.496e11 + 1, y: 0, z: 0 };
    const rel = toCameraRelative(objectPos, cameraPos);
    const gpu = toFloat32(rel);
    expect(gpu.x).toBeCloseTo(1, 6);
  });

  it('documents the float64 ceiling at parsec-scale camera positions', () => {
    // At 1 pc (3.09e16 m) float64 can no longer resolve a 1 m offset —
    // motivation for the hierarchical reference frames in Doc 23 §3.4/§4.6.
    const cameraPos = { x: 3.0857e16, y: 0, z: 0 };
    const objectPos = { x: 3.0857e16 + 1, y: 0, z: 0 };
    expect(objectPos.x - cameraPos.x).toBe(0); // 1 m lost at float64 already
  });

  it('worldToGpu one-shot matches separate calls', () => {
    const objectPos = { x: 1e10, y: -1e10, z: 0.5 };
    const cameraPos = { x: 1e10 - 100, y: -1e10, z: 0 };
    const a = worldToGpu(objectPos, cameraPos);
    const b = toFloat32(toCameraRelative(objectPos, cameraPos));
    expect(a).toEqual(b);
  });
});

describe('TS-COORD-010 — batch conversion performance', () => {
  it('converts 100K ICRS spherical to Cartesian in under 100 ms', async () => {
    const { icrsToCartesian } = await import('../icrs.js');
    const t0 = performance.now();
    for (let i = 0; i < 100_000; i++) {
      const ra = (i * 13) % 360;
      const dec = (i * 7) % 180 - 90;
      const d = 10 + (i % 100);
      icrsToCartesian(ra, dec, d);
    }
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(100);
  });
});
