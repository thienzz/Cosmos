import { describe, expect, it } from 'vitest';

import {
  float32PrecisionDigits,
  float32SafeCeiling,
  float32Ulp,
  isFloat32Safe,
} from '../precision.js';

describe('float32Ulp', () => {
  it('returns ≈1 at magnitude 1e7 (~7 decimal digits)', () => {
    const ulp = float32Ulp(1e7);
    expect(ulp).toBeGreaterThan(0.1);
    expect(ulp).toBeLessThan(10);
  });

  it('grows with magnitude (doubles per binary exponent bump)', () => {
    const smallUlp = float32Ulp(1e6);
    const largeUlp = float32Ulp(1e9);
    // ~3 orders of magnitude = ~10 binary exponents = ~1024× ulp.
    expect(largeUlp / smallUlp).toBeGreaterThan(100);
  });

  it('returns a non-zero minimum for value = 0', () => {
    const ulp = float32Ulp(0);
    expect(ulp).toBeGreaterThan(0);
  });

  it('symmetric under sign change (|x|)', () => {
    expect(float32Ulp(-1e8)).toBeCloseTo(float32Ulp(1e8), 6);
  });
});

describe('float32PrecisionDigits', () => {
  it('reports ~7 digits near 1', () => {
    expect(float32PrecisionDigits(1)).toBeGreaterThan(6);
  });

  it('degrades with magnitude', () => {
    // At magnitude 1e12 we have far fewer usable digits than at 1e3.
    expect(float32PrecisionDigits(1e3)).toBeGreaterThan(
      float32PrecisionDigits(1e12),
    );
  });
});

describe('isFloat32Safe', () => {
  it('accepts coordinates at stellar-regime scale for 1-unit features', () => {
    // Hipparcos bright max ~400k u — ulp ≈ 0.03 unit, well below 1.
    expect(isFloat32Safe(400_000)).toBe(true);
  });

  it('rejects magnitude 1e11 for sub-unit features', () => {
    expect(isFloat32Safe(1e11, 0.5)).toBe(false);
  });

  it('accepts magnitude 1e11 when the feature is big (1e5 units)', () => {
    // At 1e11, ulp ≈ 16k units — bigger than 100 but smaller than 1e5.
    // CMB-boundary-sized features remain renderable.
    expect(isFloat32Safe(1e11, 1e5)).toBe(true);
  });
});

describe('float32SafeCeiling', () => {
  it('produces a value where the ulp stays within the feature size', () => {
    const size = 1;
    const ceiling = float32SafeCeiling(size);
    // ulp at half the ceiling should be strictly below the feature size.
    expect(float32Ulp(ceiling / 4)).toBeLessThan(size);
    // Ceiling itself is the break-even point, so ≤.
    expect(float32Ulp(ceiling / 2)).toBeLessThanOrEqual(size);
  });

  it('scales with feature size', () => {
    expect(float32SafeCeiling(10)).toBeGreaterThan(float32SafeCeiling(1));
  });
});
