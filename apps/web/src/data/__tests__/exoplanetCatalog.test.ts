import { describe, expect, it } from 'vitest';

import {
  NOTABLE_EXOPLANETS,
  findExoplanet,
  getExoplanetCatalog,
  synthesizeExoplanetSeed,
} from '../exoplanetCatalog';
import { ALL_PLANET_KINDS, PLANET_ENT_ID } from '@/utils/planetPalette';

describe('exoplanetCatalog', () => {
  it('ships ≥ 5,500 confirmed exoplanets (T42 TS-DATA requirement)', () => {
    const catalog = getExoplanetCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(5500);
  });

  it('is deterministic — same seed → same first 10 names', () => {
    const a = synthesizeExoplanetSeed(50, 42042).map((r) => r.planetName);
    const b = synthesizeExoplanetSeed(50, 42042).map((r) => r.planetName);
    expect(a).toEqual(b);
  });

  it('includes TRAPPIST-1e with Laplace-chain architecture', () => {
    const hit = findExoplanet('TRAPPIST-1e');
    expect(hit).not.toBeNull();
    expect(hit!.architecture).toBe('resonant-chain');
    expect(hit!.inHabitableZone).toBe(true);
  });

  it('includes Proxima Centauri b in habitable zone', () => {
    const hit = findExoplanet('Proxima Centauri b');
    expect(hit).not.toBeNull();
    expect(hit!.inHabitableZone).toBe(true);
    expect(hit!.kind).toBe('tidally-heated');
  });

  it('every record has a valid kind + matching ENT-ID', () => {
    const sample = getExoplanetCatalog().slice(0, 200);
    for (const r of sample) {
      expect(ALL_PLANET_KINDS).toContain(r.kind);
      expect(r.entityTypeId).toBe(PLANET_ENT_ID[r.kind]);
    }
  });

  it('notable records carry real astronomical coordinates', () => {
    const trappist = findExoplanet('TRAPPIST-1b')!;
    expect(trappist.hostDistancePc).toBeCloseTo(12.43, 2);
    expect(trappist.hostRaHours).toBeGreaterThan(23);
    expect(trappist.hostDecDeg).toBeLessThan(0);
  });

  it('NOTABLE_EXOPLANETS covers every one of the 8 Kepler-90 planets', () => {
    const kepler90 = NOTABLE_EXOPLANETS.filter((r) => r.hostStarName === 'Kepler-90');
    expect(kepler90.length).toBe(8);
  });
});
