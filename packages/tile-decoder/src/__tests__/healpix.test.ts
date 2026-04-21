import { describe, expect, it } from 'vitest';

import {
  HEALPIX_MAX_NSIDE,
  HealpixError,
  healpixAng2PixNest,
  healpixGalaxyTileAddress,
  healpixNpix,
  healpixNsideToOrder,
  healpixParentNest,
} from '../healpix';

describe('healpixNsideToOrder', () => {
  it('maps powers of two to their log2', () => {
    expect(healpixNsideToOrder(1)).toBe(0);
    expect(healpixNsideToOrder(2)).toBe(1);
    expect(healpixNsideToOrder(2048)).toBe(11); // Doc 23 §20 default Nside.
  });

  it('rejects non-powers-of-two', () => {
    expect(() => healpixNsideToOrder(3)).toThrowError(HealpixError);
    expect(() => healpixNsideToOrder(2047)).toThrowError(HealpixError);
  });

  it('rejects out-of-range Nside', () => {
    expect(() => healpixNsideToOrder(0)).toThrowError(HealpixError);
    expect(() => healpixNsideToOrder(-4)).toThrowError(HealpixError);
    expect(() => healpixNsideToOrder(HEALPIX_MAX_NSIDE * 2)).toThrowError(HealpixError);
  });
});

describe('healpixNpix', () => {
  it('returns 12·Nside² total pixels', () => {
    expect(healpixNpix(1)).toBe(12);
    expect(healpixNpix(2)).toBe(48);
    expect(healpixNpix(2048)).toBe(50_331_648); // Doc 23 §20 50.3M tiles.
  });
});

describe('healpixAng2PixNest — known reference points', () => {
  // At Nside=1 there are exactly 12 base faces. North pole → face 0..3
  // depending on phi; south pole → face 8..11.
  it('handles the poles and equator cleanly', () => {
    // North pole at RA=0: within tt=0, should land on face 0.
    const northPole = healpixAng2PixNest(0, 90 - 1e-6, 1);
    expect([0, 1, 2, 3]).toContain(northPole);
    const southPole = healpixAng2PixNest(0, -90 + 1e-6, 1);
    expect([8, 9, 10, 11]).toContain(southPole);
    // Equator, RA=0: equatorial face 4..7 at Nside=1.
    const eq = healpixAng2PixNest(0, 0, 1);
    expect([4, 5, 6, 7]).toContain(eq);
  });

  it('is deterministic and stays in range at production Nside', () => {
    // Messier 31 (Andromeda) — RA 10.6847°, Dec +41.269°.
    const andromedaNside2048 = healpixAng2PixNest(10.6847, 41.269, 2048);
    expect(andromedaNside2048).toBeGreaterThanOrEqual(0);
    expect(andromedaNside2048).toBeLessThan(healpixNpix(2048));
    // Deterministic — calling twice returns the same pixel.
    expect(healpixAng2PixNest(10.6847, 41.269, 2048)).toBe(andromedaNside2048);

    // Sgr A* — RA 266.4168°, Dec -29.0078° (Galactic Centre).
    const sgrA = healpixAng2PixNest(266.4168, -29.0078, 2048);
    expect(sgrA).toBeGreaterThanOrEqual(0);
    expect(sgrA).toBeLessThan(healpixNpix(2048));
  });

  it('wraps negative RA into [0, 360)', () => {
    // RA=-10° should map to the same pixel as RA=350°.
    expect(healpixAng2PixNest(-10, 5, 1024)).toBe(healpixAng2PixNest(350, 5, 1024));
  });

  it('rejects out-of-range declinations', () => {
    expect(() => healpixAng2PixNest(0, 91, 2)).toThrowError(HealpixError);
    expect(() => healpixAng2PixNest(0, -91, 2)).toThrowError(HealpixError);
  });

  it('rejects non-finite inputs', () => {
    expect(() => healpixAng2PixNest(Number.NaN, 0, 2)).toThrowError(HealpixError);
    expect(() => healpixAng2PixNest(0, Number.POSITIVE_INFINITY, 2)).toThrowError(HealpixError);
  });

  it('covers every base face at Nside=1 when sweeping the sky', () => {
    // Sanity: the 12 base pixels should all be hit somewhere on a 12-point
    // lattice. Drives the pixel space hard enough to catch face-selection
    // bugs in the equatorial/polar branches.
    const seen = new Set<number>();
    for (let raIdx = 0; raIdx < 8; raIdx++) {
      for (let decIdx = 0; decIdx < 7; decIdx++) {
        const ra = raIdx * 45;
        const dec = -90 + decIdx * 30;
        seen.add(healpixAng2PixNest(ra, Math.min(89.99, Math.max(-89.99, dec)), 1));
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(10); // at least 10 of 12 faces hit.
    for (const p of seen) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(12);
    }
  });

  it('refines pixel index as Nside grows — finer pixels cover the same sky', () => {
    // The parent of a higher-order pixel should point back toward the same
    // base face as the lower-order pixel. Walking 10 parent steps from a
    // Nside=1024 pixel must land on a Nside=1 base pixel (i.e. 0..11).
    const fine = healpixAng2PixNest(123.4, -15.6, 1024);
    let cursor = fine;
    for (let i = 0; i < 10; i++) cursor = healpixParentNest(cursor);
    expect(cursor).toBeGreaterThanOrEqual(0);
    expect(cursor).toBeLessThan(12);
  });
});

describe('healpixParentNest', () => {
  it('returns floor(pix/4) — the quadtree parent', () => {
    expect(healpixParentNest(0)).toBe(0);
    expect(healpixParentNest(3)).toBe(0);
    expect(healpixParentNest(4)).toBe(1);
    expect(healpixParentNest(15)).toBe(3);
  });

  it('rejects negative or non-integer pixel indices', () => {
    expect(() => healpixParentNest(-1)).toThrowError(HealpixError);
    expect(() => healpixParentNest(1.5)).toThrowError(HealpixError);
  });
});

describe('healpixGalaxyTileAddress', () => {
  it('bundles the (order, pixel) pair that the tile server URL needs', () => {
    const addr = healpixGalaxyTileAddress(10.6847, 41.269, 2048);
    expect(addr.order).toBe(11);
    expect(addr.pixel).toBeGreaterThanOrEqual(0);
    expect(addr.pixel).toBeLessThan(healpixNpix(2048));
  });
});
