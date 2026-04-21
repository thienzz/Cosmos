import { describe, expect, it } from 'vitest';

import { celestialDistanceToSceneUnits } from '../SceneManager';

/**
 * Phase B — fly-to-celestial-coord unit tests.
 *
 * `flyToCelestialCoord` itself requires a full SceneManager harness (camera,
 * controls, store wiring) that is covered elsewhere; these tests pin the
 * pure {@link celestialDistanceToSceneUnits} mapping so the visible distance
 * of Sirius, Andromeda, Sgr A*, etc. can be regression-checked without
 * standing up the whole scene.
 */
describe('celestialDistanceToSceneUnits — piecewise parsec → scene units', () => {
  it('null distance falls back to the near/far boundary (60 000 u)', () => {
    expect(celestialDistanceToSceneUnits(null)).toBe(60_000);
  });

  it('invalid / negative distances fall back to the boundary', () => {
    expect(celestialDistanceToSceneUnits(NaN)).toBe(60_000);
    expect(celestialDistanceToSceneUnits(0)).toBe(60_000);
    expect(celestialDistanceToSceneUnits(-10)).toBe(60_000);
  });

  it('near stars use the true stellar scale (500 u/pc)', () => {
    // Sirius 2.637 pc
    expect(celestialDistanceToSceneUnits(2.637)).toBeCloseTo(1318.5, 1);
    // Proxima Centauri 1.301 pc
    expect(celestialDistanceToSceneUnits(1.301)).toBeCloseTo(650.5, 1);
    // Vega 7.68 pc
    expect(celestialDistanceToSceneUnits(7.68)).toBeCloseTo(3840, 1);
    // Betelgeuse 100 pc stays inside the near range (100 × 500 = 50 000)
    expect(celestialDistanceToSceneUnits(100)).toBeCloseTo(50_000, 1);
  });

  it('120 pc lands exactly at the near/far boundary (60 000 u)', () => {
    expect(celestialDistanceToSceneUnits(120)).toBeCloseTo(60_000, 1);
  });

  it('beyond the near cap the mapping is monotonic and ≤ 90 000 u', () => {
    const sirius = celestialDistanceToSceneUnits(2.637);
    const orion = celestialDistanceToSceneUnits(412);       // M42
    const crab = celestialDistanceToSceneUnits(2_000);       // M1 / Crab
    const sgrA = celestialDistanceToSceneUnits(8_178);       // Galactic Center
    const lmc = celestialDistanceToSceneUnits(50_000);        // LMC 50 kpc
    const m31 = celestialDistanceToSceneUnits(778_000);       // Andromeda 778 kpc
    const virgo = celestialDistanceToSceneUnits(16_500_000);  // Virgo 16.5 Mpc
    const coma = celestialDistanceToSceneUnits(100_000_000);  // Coma 100 Mpc

    // Monotonically non-decreasing.
    expect(sirius).toBeLessThan(orion);
    expect(orion).toBeLessThan(crab);
    expect(crab).toBeLessThan(sgrA);
    expect(sgrA).toBeLessThan(lmc);
    expect(lmc).toBeLessThan(m31);
    expect(m31).toBeLessThan(virgo);
    expect(virgo).toBeLessThan(coma);

    // Every value stays inside the solar_system regime's 1e5 camera clamp.
    for (const v of [sirius, orion, crab, sgrA, lmc, m31, virgo, coma]) {
      expect(v).toBeLessThan(100_000);
    }
    // Extragalactic hits land in the upper [60k, 90k] compressed band.
    expect(m31).toBeGreaterThan(60_000);
    expect(m31).toBeLessThanOrEqual(90_000);
    expect(virgo).toBeGreaterThan(60_000);
    expect(virgo).toBeLessThanOrEqual(90_000);
    expect(coma).toBeLessThanOrEqual(90_000);
  });

  it('Andromeda (778 kpc) lands visibly farther than Sgr A* (8.2 kpc)', () => {
    const sgrA = celestialDistanceToSceneUnits(8_178);
    const m31 = celestialDistanceToSceneUnits(778_000);
    // Both extragalactic → log-compressed; M31 > Sgr A*.
    expect(m31 - sgrA).toBeGreaterThan(5_000);
  });

  it('extreme far distances saturate at the ceiling (≤ 90 000)', () => {
    // 14 Gly observable horizon.
    expect(celestialDistanceToSceneUnits(14.26e9)).toBeLessThanOrEqual(90_000);
    // Even pathological values don't blow past the ceiling.
    expect(celestialDistanceToSceneUnits(1e15)).toBeLessThanOrEqual(90_000);
  });
});
