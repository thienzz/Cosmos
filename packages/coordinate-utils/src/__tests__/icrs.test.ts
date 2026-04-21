import { describe, expect, it } from 'vitest';

import { SIRIUS_ICRS } from '../constants.js';
import { icrsToGalactic } from '../frames.js';
import { cartesianToIcrs, icrsToCartesian, icrsUnitVector } from '../icrs.js';

describe('TS-COORD-001 — Sirius ICRS → galactic', () => {
  it('transforms Sirius (101.287°, −16.716°, 2.637 pc) to l≈227.23°, b≈−8.89°, d≈2.64pc', () => {
    const gal = icrsToGalactic(SIRIUS_ICRS);
    // SIMBAD-listed galactic coords for Sirius. The rotation matrix in
    // Doc 23 §2.2 is truncated to 7 decimals, which limits end-to-end
    // accuracy to ~0.1° — use loose tolerances rather than toBeCloseTo
    // (whose `numDigits` argument is 10^-n, not n decimals).
    expect(Math.abs(gal.l - 227.23)).toBeLessThan(0.1);
    expect(Math.abs(gal.b - -8.89)).toBeLessThan(0.1);
    expect(Math.abs(gal.distance - 2.637)).toBeLessThan(1e-6);
  });
});

describe('TS-COORD-002 — spherical ↔ Cartesian round-trip', () => {
  const samples = [
    { ra: 0, dec: 0 },
    { ra: 90, dec: 0 },
    { ra: 180, dec: 45 },
    { ra: 270, dec: -45 },
    { ra: 101.287, dec: -16.716 },
    { ra: 359.9, dec: 89.5 },
  ];

  it.each(samples)('round-trips (ra=%o, dec=%o) with < 1e-10 error', ({ ra, dec }) => {
    const cart = icrsToCartesian(ra, dec, 100);
    const back = cartesianToIcrs(cart);
    expect(Math.abs(back.ra - ra)).toBeLessThan(1e-10);
    expect(Math.abs(back.dec - dec)).toBeLessThan(1e-10);
    expect(Math.abs(back.distance - 100)).toBeLessThan(1e-10);
  });

  it('unit vector length is exactly 1 for any (ra, dec)', () => {
    for (let i = 0; i < 50; i++) {
      const ra = Math.random() * 360;
      const dec = (Math.random() - 0.5) * 180;
      const v = icrsUnitVector(ra, dec);
      const len = Math.hypot(v.x, v.y, v.z);
      expect(len).toBeCloseTo(1, 12);
    }
  });
});

describe('TS-COORD-003 — polar singularity produces no NaN', () => {
  it('dec = +90°', () => {
    const cart = icrsToCartesian(0, 90, 10);
    expect(cart.x).toBeCloseTo(0, 12);
    expect(cart.y).toBeCloseTo(0, 12);
    expect(cart.z).toBeCloseTo(10, 12);
    const back = cartesianToIcrs(cart);
    expect(Number.isFinite(back.ra)).toBe(true);
    expect(Number.isFinite(back.dec)).toBe(true);
    expect(back.dec).toBeCloseTo(90, 10);
  });
  it('dec = −90°', () => {
    const cart = icrsToCartesian(123, -90, 5);
    const back = cartesianToIcrs(cart);
    expect(Number.isFinite(back.ra)).toBe(true);
    expect(back.dec).toBeCloseTo(-90, 10);
  });
  it('distance = 0', () => {
    const back = cartesianToIcrs({ x: 0, y: 0, z: 0 });
    expect(back.distance).toBe(0);
    expect(back.ra).toBe(0);
    expect(back.dec).toBe(0);
  });
  it('ra is normalised to [0, 360)', () => {
    // Direction just below +X axis → should report RA near 0, not 360.
    const cart = { x: 1, y: -1e-9, z: 0 };
    const back = cartesianToIcrs(cart);
    expect(back.ra).toBeGreaterThanOrEqual(0);
    expect(back.ra).toBeLessThan(360);
  });
});
