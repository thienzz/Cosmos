import { describe, expect, it } from 'vitest';

import { SIRIUS_ICRS } from '../constants.js';
import {
  DEFAULT_SCENE_SCALE,
  auToPc,
  auToSceneUnits,
  icrsToSceneUnitsPc,
  kpcToSceneUnits,
  mpcToSceneUnits,
  parallaxMasToPc,
  pcToAu,
  pcToSceneUnits,
  resolveSceneScale,
  sceneUnitsToAu,
  sceneUnitsToPc,
} from '../sceneScale.js';

describe('DEFAULT_SCENE_SCALE', () => {
  it('matches the existing engine conventions', () => {
    expect(DEFAULT_SCENE_SCALE.unitsPerAU).toBe(12);
    expect(DEFAULT_SCENE_SCALE.unitsPerPc).toBe(500);
    expect(DEFAULT_SCENE_SCALE.unitsPerKpc).toBe(100);
    expect(DEFAULT_SCENE_SCALE.unitsPerMpc).toBe(10);
  });

  it('is frozen so callers can rely on stable factors', () => {
    expect(Object.isFrozen(DEFAULT_SCENE_SCALE)).toBe(true);
  });
});

describe('resolveSceneScale', () => {
  it('returns defaults when no override is given', () => {
    expect(resolveSceneScale()).toEqual(DEFAULT_SCENE_SCALE);
  });

  it('fills missing keys from defaults', () => {
    const resolved = resolveSceneScale({ unitsPerPc: 1000 });
    expect(resolved.unitsPerPc).toBe(1000);
    expect(resolved.unitsPerAU).toBe(DEFAULT_SCENE_SCALE.unitsPerAU);
  });
});

describe('scalar conversions', () => {
  it('auToSceneUnits — Earth at 1 AU → 12 units', () => {
    expect(auToSceneUnits(1)).toBe(12);
    expect(auToSceneUnits(5.2, { unitsPerAU: 12 })).toBeCloseTo(62.4, 6);
  });

  it('pcToSceneUnits — Proxima at 1.3 pc → 650 units', () => {
    expect(pcToSceneUnits(1.3)).toBeCloseTo(650, 6);
  });

  it('kpcToSceneUnits — Sgr A* at 8.178 kpc → 817.8 units', () => {
    expect(kpcToSceneUnits(8.178)).toBeCloseTo(817.8, 6);
  });

  it('mpcToSceneUnits — Virgo at 16.5 Mpc → 165 units', () => {
    expect(mpcToSceneUnits(16.5)).toBeCloseTo(165, 6);
  });

  it('honours overrides', () => {
    expect(pcToSceneUnits(1, { unitsPerPc: 1000 })).toBe(1000);
    expect(auToSceneUnits(1, { unitsPerAU: 1 })).toBe(1);
  });
});

describe('inverse conversions', () => {
  it('sceneUnitsToPc is an inverse of pcToSceneUnits', () => {
    for (const pc of [0.1, 1, 10, 1000]) {
      expect(sceneUnitsToPc(pcToSceneUnits(pc))).toBeCloseTo(pc, 9);
    }
  });

  it('sceneUnitsToAu is an inverse of auToSceneUnits', () => {
    for (const au of [0.3, 1, 30, 50_000]) {
      expect(sceneUnitsToAu(auToSceneUnits(au))).toBeCloseTo(au, 9);
    }
  });

  it('returns 0 when the scale factor is 0 (defensive)', () => {
    expect(sceneUnitsToPc(100, { unitsPerPc: 0 })).toBe(0);
    expect(sceneUnitsToAu(100, { unitsPerAU: 0 })).toBe(0);
  });
});

describe('icrsToSceneUnitsPc', () => {
  it('places Sirius at |r| = 2.637 pc × unitsPerPc', () => {
    const v = icrsToSceneUnitsPc(
      SIRIUS_ICRS.ra,
      SIRIUS_ICRS.dec,
      SIRIUS_ICRS.distance,
    );
    const r = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    expect(r).toBeCloseTo(2.637 * DEFAULT_SCENE_SCALE.unitsPerPc, 3);
  });

  it('at RA=0, Dec=0 the vector lands along +X', () => {
    const v = icrsToSceneUnitsPc(0, 0, 1);
    expect(v.x).toBeCloseTo(500, 6);
    expect(v.y).toBeCloseTo(0, 6);
    expect(v.z).toBeCloseTo(0, 6);
  });

  it('respects a custom unitsPerPc override', () => {
    const v = icrsToSceneUnitsPc(0, 0, 1, { unitsPerPc: 1 });
    expect(v.x).toBeCloseTo(1, 6);
  });
});

describe('parallax helpers', () => {
  it('converts parallax (mas) to parsecs', () => {
    // Proxima parallax ≈ 768.5 mas → 1/0.7685 ≈ 1.301 pc.
    expect(parallaxMasToPc(768.5)).toBeCloseTo(1.301, 2);
  });

  it('guards against non-positive parallax with fallback', () => {
    expect(parallaxMasToPc(0)).toBe(Number.POSITIVE_INFINITY);
    expect(parallaxMasToPc(-1)).toBe(Number.POSITIVE_INFINITY);
    expect(parallaxMasToPc(NaN, 1000)).toBe(1000);
  });
});

describe('au ↔ pc helpers', () => {
  it('round-trip preserves the value', () => {
    for (const pc of [0.5, 1, 10, 1000]) {
      expect(auToPc(pcToAu(pc))).toBeCloseTo(pc, 9);
    }
  });

  it('1 pc = 206,264.806 AU (IAU 2012)', () => {
    expect(pcToAu(1)).toBeCloseTo(206_264.806, 2);
  });
});
