import { describe, expect, it } from 'vitest';

import {
  eccentricAnomalyFromTrue,
  meanAnomalyAt,
  solveKepler,
  trueAnomalyFromEccentric,
} from '../kepler.js';

const TOLERANCE = 1e-10;

describe('TS-COORD-004 — Kepler solver e = 0 (circular orbit)', () => {
  it('returns E = M exactly', () => {
    for (const M of [0, 0.5, 1.7, -2.3, Math.PI / 2]) {
      const { E, nu, iterations, residual } = solveKepler(M, 0);
      expect(E).toBeCloseTo(M, 12);
      expect(nu).toBeCloseTo(M, 12); // ν = E when e=0
      expect(iterations).toBe(0);
      expect(residual).toBe(0);
    }
  });
});

describe('TS-COORD-005 — Kepler solver e = 0.9 (highly elliptical)', () => {
  const e = 0.9;
  it('converges to residual < 1e-10 across the whole period', () => {
    for (let k = 0; k < 32; k++) {
      const M = (k / 32) * 2 * Math.PI - Math.PI;
      const { residual, iterations } = solveKepler(M, e);
      expect(Math.abs(residual)).toBeLessThan(TOLERANCE);
      expect(iterations).toBeLessThan(20);
    }
  });
});

describe('TS-COORD-006 — Kepler solver e = 0.999 (near-parabolic)', () => {
  const e = 0.999;
  it('converges to residual < 1e-10 for every sampled M', () => {
    for (let k = 0; k < 32; k++) {
      const M = (k / 32) * 2 * Math.PI - Math.PI;
      const { residual, iterations } = solveKepler(M, e);
      expect(Math.abs(residual)).toBeLessThan(TOLERANCE);
      expect(iterations).toBeLessThan(30);
    }
  });

  it('sanity-checks Halley-like comet: e=0.967, M=0', () => {
    const { E, residual } = solveKepler(0, 0.967);
    expect(E).toBeCloseTo(0, 12);
    expect(Math.abs(residual)).toBeLessThan(TOLERANCE);
  });
});

describe('Kepler — true ↔ eccentric anomaly inverse', () => {
  it('round-trips across eccentricities and anomalies', () => {
    for (const e of [0, 0.1, 0.5, 0.9, 0.99]) {
      for (let k = 0; k < 16; k++) {
        const E = (k / 16) * 2 * Math.PI - Math.PI;
        const nu = trueAnomalyFromEccentric(E, e);
        const Eback = eccentricAnomalyFromTrue(nu, e);
        // Compare modulo 2π.
        const diff = Math.abs(((Eback - E) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        expect(Math.abs(diff)).toBeLessThan(1e-10);
      }
    }
  });
});

describe('Kepler — meanAnomalyAt', () => {
  it('advances mean anomaly linearly', () => {
    const M0 = 0.5;
    const n = 0.1;
    expect(meanAnomalyAt(M0, n, 0)).toBe(M0);
    expect(meanAnomalyAt(M0, n, 10)).toBeCloseTo(1.5, 12);
  });
});

describe('Kepler — argument validation', () => {
  it('rejects e ≥ 1', () => {
    expect(() => solveKepler(0, 1)).toThrow();
    expect(() => solveKepler(0, 1.5)).toThrow();
  });
  it('rejects e < 0', () => {
    expect(() => solveKepler(0, -0.1)).toThrow();
  });
  it('rejects non-finite M', () => {
    expect(() => solveKepler(NaN, 0.5)).toThrow();
    expect(() => solveKepler(Infinity, 0.5)).toThrow();
  });
});
