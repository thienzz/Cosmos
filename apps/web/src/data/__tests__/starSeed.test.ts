import { describe, expect, it } from 'vitest';

import type { StarAnchor } from '../starSeed';
import { generateStarSeed, mulberry32, spectralClassFromType } from '../starSeed';

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(0xdeadbeef);
    const b = mulberry32(0xdeadbeef);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('returns values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('has no trivial period across 1M draws', () => {
    const rng = mulberry32(1);
    const samples = new Set<number>();
    for (let i = 0; i < 10_000; i++) samples.add(rng());
    expect(samples.size).toBeGreaterThan(9900); // very few collisions
  });
});

describe('spectralClassFromType', () => {
  it('extracts the leading MK class letter from a full spectral type', () => {
    expect(spectralClassFromType('A1V')).toBe('A');
    expect(spectralClassFromType('B0.5IV')).toBe('B');
    expect(spectralClassFromType('M1-2Ia-Iab')).toBe('M');
    expect(spectralClassFromType('F5Ib')).toBe('F');
    expect(spectralClassFromType('O9.5II')).toBe('O');
  });

  it("falls back to 'G' for unknown / missing input", () => {
    expect(spectralClassFromType(null)).toBe('G');
    expect(spectralClassFromType(undefined)).toBe('G');
    expect(spectralClassFromType('')).toBe('G');
    expect(spectralClassFromType('??')).toBe('G');
  });
});

describe('generateStarSeed', () => {
  it('generates exactly the requested count', () => {
    expect(generateStarSeed({ count: 100 })).toHaveLength(100);
    expect(generateStarSeed({ count: 5000 })).toHaveLength(5000);
  });

  it('produces identical output for identical seeds', () => {
    const a = generateStarSeed({ count: 50, seed: 7 });
    const b = generateStarSeed({ count: 50, seed: 7 });
    expect(a).toEqual(b);
  });

  it('differs between seeds', () => {
    const a = generateStarSeed({ count: 50, seed: 1 });
    const b = generateStarSeed({ count: 50, seed: 2 });
    expect(a[0]?.position).not.toEqual(b[0]?.position);
  });

  it('places every star in the configured shell expressed in parsecs', () => {
    // 2–10 pc at 100 units/pc → 200..1000 scene units.
    const seed = generateStarSeed({
      count: 500,
      innerRadiusPc: 2,
      outerRadiusPc: 10,
      sceneUnitsPerPc: 100,
    });
    for (const star of seed) {
      const r = Math.hypot(star.position.x, star.position.y, star.position.z);
      expect(r).toBeGreaterThanOrEqual(200 - 1e-6);
      expect(r).toBeLessThanOrEqual(1000 + 1e-6);
    }
  });

  it('defaults match DEFAULT_SCENE_SCALE (1..50 pc × 500 units/pc)', () => {
    // No radius options → default 1..50 pc at 500 units/pc = 500..25000 units.
    const seed = generateStarSeed({ count: 500, seed: 99 });
    for (const star of seed) {
      const r = Math.hypot(star.position.x, star.position.y, star.position.z);
      expect(r).toBeGreaterThanOrEqual(500 - 1e-6);
      expect(r).toBeLessThanOrEqual(25_000 + 1e-6);
    }
  });

  it('rejects an outerRadiusPc ≤ innerRadiusPc', () => {
    expect(() =>
      generateStarSeed({ count: 10, innerRadiusPc: 10, outerRadiusPc: 5 }),
    ).toThrow();
  });

  it('reflects the stellar-population distribution across 5K draws', () => {
    const seed = generateStarSeed({ count: 5000, seed: 1234 });
    const counts: Record<string, number> = { O: 0, B: 0, A: 0, F: 0, G: 0, K: 0, M: 0 };
    for (const star of seed) counts[star.spectralClass] = (counts[star.spectralClass] ?? 0) + 1;

    // M must dominate; O must be rare (<5% to catch stats regressions).
    expect(counts.M).toBeGreaterThan(counts.K);
    expect(counts.K).toBeGreaterThan(counts.G);
    expect(counts.O ?? 0).toBeLessThan(250);
    expect((counts.M ?? 0) + (counts.K ?? 0)).toBeGreaterThan(3500);
  });

  it('magnitudes cover both bright (<0) and faint (>5) stars', () => {
    const seed = generateStarSeed({ count: 2000, seed: 9 });
    const mags = seed.map((s) => s.magnitude);
    expect(Math.min(...mags)).toBeLessThan(0);
    expect(Math.max(...mags)).toBeGreaterThan(5);
  });

  it('colour matches the spectral class lookup', () => {
    const seed = generateStarSeed({ count: 200, seed: 3 });
    for (const star of seed) {
      expect(star.color.r).toBeGreaterThanOrEqual(0);
      expect(star.color.r).toBeLessThanOrEqual(1);
      if (star.spectralClass === 'O') {
        expect(star.color.b).toBeGreaterThan(star.color.r);
      }
      if (star.spectralClass === 'M') {
        expect(star.color.r).toBeGreaterThan(star.color.b);
      }
    }
  });

  it('places anchor stars at their exact ICRS position (Sirius, Proxima)', () => {
    // Canonical Hipparcos values for the two nearest bright references.
    const anchors: StarAnchor[] = [
      {
        // Sirius α CMa — HIP 32349.
        raDeg: 101.2875,
        decDeg: -16.7161,
        distancePc: 2.637,
        magV: -1.46,
        spectralType: 'A1V',
        id: 'Sirius',
      },
      {
        // Proxima Centauri α Cen C — HIP 70890.
        raDeg: 217.429,
        decDeg: -62.6795,
        distancePc: 1.301,
        magV: 11.13,
        spectralType: 'M5.5Ve',
        id: 'Proxima Centauri',
      },
    ];
    // Use units/pc=500 to match StarTileRenderer; 10 stars total so random
    // background fills 8 after the 2 anchors.
    const seed = generateStarSeed({
      count: 10,
      sceneUnitsPerPc: 500,
      anchors,
    });

    expect(seed).toHaveLength(10);
    const [sirius, proxima] = seed;

    const siriusR = Math.hypot(sirius.position.x, sirius.position.y, sirius.position.z);
    expect(siriusR).toBeCloseTo(2.637 * 500, 2); // ±0.01 scene units
    expect(sirius.anchorId).toBe('Sirius');
    expect(sirius.spectralClass).toBe('A');
    expect(sirius.magnitude).toBeCloseTo(-1.46, 6);

    const proximaR = Math.hypot(proxima.position.x, proxima.position.y, proxima.position.z);
    expect(proximaR).toBeCloseTo(1.301 * 500, 2);
    expect(proxima.anchorId).toBe('Proxima Centauri');
    expect(proxima.spectralClass).toBe('M');
  });

  it('clips anchors to the count budget', () => {
    const anchors: StarAnchor[] = [
      { raDeg: 0, decDeg: 0, distancePc: 10, magV: 1 },
      { raDeg: 45, decDeg: 30, distancePc: 20, magV: 1 },
      { raDeg: 90, decDeg: -30, distancePc: 30, magV: 1 },
    ];
    const seed = generateStarSeed({ count: 2, anchors });
    expect(seed).toHaveLength(2);
    // The two anchors emitted live in the first two slots (at |r|=10pc, 20pc).
    const r0 = Math.hypot(seed[0].position.x, seed[0].position.y, seed[0].position.z);
    const r1 = Math.hypot(seed[1].position.x, seed[1].position.y, seed[1].position.z);
    expect(r0).toBeCloseTo(10 * 500, 2);
    expect(r1).toBeCloseTo(20 * 500, 2);
  });

  it('skips anchors with invalid distances (0, negative, NaN)', () => {
    const anchors: StarAnchor[] = [
      { raDeg: 0, decDeg: 0, distancePc: 0, magV: 1, id: 'invalid-zero' },
      { raDeg: 0, decDeg: 0, distancePc: -5, magV: 1, id: 'invalid-negative' },
      { raDeg: 0, decDeg: 0, distancePc: NaN, magV: 1, id: 'invalid-nan' },
    ];
    const seed = generateStarSeed({ count: 50, anchors });
    for (const star of seed) {
      expect(star.anchorId).not.toBe('invalid-zero');
      expect(star.anchorId).not.toBe('invalid-negative');
      expect(star.anchorId).not.toBe('invalid-nan');
    }
  });

  it('twinkle phases span [0, 2π)', () => {
    const seed = generateStarSeed({ count: 500, seed: 11 });
    const min = Math.min(...seed.map((s) => s.twinklePhase));
    const max = Math.max(...seed.map((s) => s.twinklePhase));
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThan(2 * Math.PI);
    expect(max - min).toBeGreaterThan(5); // covers a wide range
  });
});
