import { describe, expect, it } from 'vitest';

import {
  DEFAULT_THRESHOLDS,
  diffImages,
  luminanceSsim,
  meanDeltaE2000,
  pHashHamming,
  passesThresholds,
  perceptualHash,
  type ImageLike,
} from './metrics';

/** Make a solid-color 32×32 RGBA image. */
function solid(width: number, height: number, rgb: [number, number, number]): ImageLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

/** Make a noise pattern seeded for determinism. */
function noise(width: number, height: number, seed: number): ImageLike {
  const data = new Uint8ClampedArray(width * height * 4);
  let s = seed >>> 0;
  for (let i = 0; i < width * height; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    data[i * 4] = s & 0xff;
    data[i * 4 + 1] = (s >>> 8) & 0xff;
    data[i * 4 + 2] = (s >>> 16) & 0xff;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

describe('ΔE2000', () => {
  it('is zero for identical images', () => {
    const a = solid(32, 32, [128, 64, 200]);
    expect(meanDeltaE2000(a, a)).toBeCloseTo(0, 6);
  });

  it('is small for near-identical colors', () => {
    const a = solid(32, 32, [128, 128, 128]);
    const b = solid(32, 32, [130, 128, 128]); // +2 in red
    const diff = meanDeltaE2000(a, b);
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThan(DEFAULT_THRESHOLDS.maxDeltaE2000);
  });

  it('is large for visually distinct colors', () => {
    const a = solid(32, 32, [255, 0, 0]);
    const b = solid(32, 32, [0, 255, 0]);
    expect(meanDeltaE2000(a, b)).toBeGreaterThan(50);
  });
});

describe('SSIM', () => {
  it('is 1 for identical images', () => {
    const a = noise(32, 32, 42);
    expect(luminanceSsim(a, a)).toBeCloseTo(1, 6);
  });

  it('drops below 0.65 for visually different images', () => {
    const a = noise(32, 32, 1);
    const b = noise(32, 32, 999);
    expect(luminanceSsim(a, b)).toBeLessThan(0.65);
  });
});

describe('pHash', () => {
  it('has Hamming distance 0 for identical images', () => {
    const a = noise(64, 64, 7);
    expect(pHashHamming(perceptualHash(a), perceptualHash(a))).toBe(0);
  });

  it('has large Hamming distance for very different images', () => {
    const a = solid(64, 64, [0, 0, 0]);
    const b = noise(64, 64, 1234);
    const dist = pHashHamming(perceptualHash(a), perceptualHash(b));
    expect(dist).toBeGreaterThan(8);
  });
});

describe('passesThresholds', () => {
  it('passes for identical images', () => {
    const a = solid(32, 32, [200, 100, 50]);
    const diff = diffImages(a, a);
    expect(passesThresholds(diff)).toBe(true);
  });

  it('fails when ΔE exceeds threshold', () => {
    const a = solid(32, 32, [200, 100, 50]);
    const b = solid(32, 32, [50, 200, 100]);
    const diff = diffImages(a, b);
    expect(passesThresholds(diff)).toBe(false);
  });

  it('fails when SSIM drops below floor', () => {
    const a = noise(64, 64, 1);
    const b = noise(64, 64, 42);
    const diff = diffImages(a, b);
    expect(diff.ssim).toBeLessThan(DEFAULT_THRESHOLDS.minSsim);
    expect(passesThresholds(diff)).toBe(false);
  });
});

describe('shape guard', () => {
  it('throws on mismatched dimensions', () => {
    const a = solid(16, 16, [0, 0, 0]);
    const b = solid(32, 32, [0, 0, 0]);
    expect(() => meanDeltaE2000(a, b)).toThrow(/shape mismatch/);
  });
});
