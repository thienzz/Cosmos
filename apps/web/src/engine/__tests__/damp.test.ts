import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { damp, damp3 } from '../damp';

describe('damp', () => {
  it('returns current when dt is zero or negative', () => {
    expect(damp(5, 10, 1, 0)).toBe(5);
    expect(damp(5, 10, 1, -1)).toBe(5);
  });

  it('snaps to target when lambda is non-finite or non-positive', () => {
    expect(damp(5, 10, 0, 1)).toBe(10);
    expect(damp(5, 10, Number.NaN, 1)).toBe(10);
    expect(damp(5, 10, -1, 1)).toBe(10);
  });

  it('converges toward target monotonically over multiple steps', () => {
    let x = 0;
    for (let i = 0; i < 120; i++) x = damp(x, 1, 5, 1 / 60);
    expect(x).toBeGreaterThan(0.99);
    expect(x).toBeLessThan(1.0001);
  });

  it('reaches about 63% of target after one time-constant (λ=5, dt=0.2s)', () => {
    const x = damp(0, 1, 5, 0.2);
    expect(x).toBeCloseTo(1 - Math.exp(-1), 5);
  });

  it('is frame-rate independent: 2×30Hz ≈ 1×15Hz for small steps', () => {
    let a = 0;
    a = damp(a, 1, 5, 1 / 30);
    a = damp(a, 1, 5, 1 / 30);
    const b = damp(0, 1, 5, 2 / 30);
    // Not bit-identical but agrees to 3 decimals — good enough for rendering.
    expect(Math.abs(a - b)).toBeLessThan(0.01);
  });
});

describe('damp3', () => {
  it('damps each axis of a THREE.Vector3 independently', () => {
    const v = new Vector3(0, 0, 0);
    const target = new Vector3(10, -5, 3);
    damp3(v, target, 5, 1);
    expect(v.x).toBeCloseTo(10 * (1 - Math.exp(-5)), 4);
    expect(v.y).toBeCloseTo(-5 * (1 - Math.exp(-5)), 4);
    expect(v.z).toBeCloseTo(3 * (1 - Math.exp(-5)), 4);
  });

  it('returns the same instance (in-place mutation)', () => {
    const v = new Vector3(0, 0, 0);
    const result = damp3(v, new Vector3(1, 1, 1), 5, 0.5);
    expect(result).toBe(v);
  });
});
