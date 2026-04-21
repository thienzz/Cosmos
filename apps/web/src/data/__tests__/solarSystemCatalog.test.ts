import { describe, expect, it } from 'vitest';

import {
  DWARF_PLANETS,
  MAJOR_MOONS,
  MINOR_BODIES,
  PLANETS,
  SOLAR_SYSTEM_CATALOG,
  SUN,
  bodyById,
  moonsOf,
  renderableBodies,
  solarSystemBodyCount,
} from '../solarSystemCatalog';
import { NAMED_ASTEROID_NAIF_IDS } from '../namedAsteroids';

describe('solarSystemCatalog composition', () => {
  it('contains the Sun + 8 planets + dwarf planets + major moons', () => {
    expect(SUN.naifId).toBe(10);
    expect(PLANETS).toHaveLength(8);
    expect(DWARF_PLANETS.length).toBeGreaterThanOrEqual(5);
    expect(MAJOR_MOONS.length).toBeGreaterThanOrEqual(20);
  });

  it('TS-DATA-003 (T39): catalog reports ≥ 1,300,000 solar-system bodies', () => {
    // Enumerated bodies (named + moons + dwarfs + 1.3M procedural tail).
    expect(solarSystemBodyCount()).toBeGreaterThanOrEqual(1_300_000);
  });

  it('T39: enumerates every T39-named asteroid (Ceres/Vesta/Bennu/…)', () => {
    // Ceres is in DWARF_PLANETS (NAIF 2_000_001); the rest in NAMED_ASTEROIDS.
    expect(bodyById(2_000_001)?.name).toBe('Ceres');
    for (const id of NAMED_ASTEROID_NAIF_IDS) {
      const b = bodyById(id);
      expect(b, `NAIF ${id} missing`).toBeDefined();
    }
    expect(bodyById(2_101_955)?.name).toBe('Bennu');
    expect(bodyById(2_000_004)?.name).toBe('Vesta');
    expect(bodyById(2_099_942)?.name).toBe('Apophis');
  });

  it('T39: enumerates ≥ 290 moons (Doc 23 §8.3 "Moons" column totals)', () => {
    const moonBodies = SOLAR_SYSTEM_CATALOG.filter((b) => b.kind === 'moon');
    expect(moonBodies.length).toBeGreaterThanOrEqual(290);
  });

  it('catalog has unique NAIF ids', () => {
    const ids = new Set<number>();
    for (const body of SOLAR_SYSTEM_CATALOG) {
      expect(ids.has(body.naifId)).toBe(false);
      ids.add(body.naifId);
    }
  });

  it('legacy MINOR_BODIES export is empty (T39 retired the 260-stub generator)', () => {
    // Procedural population now lives in proceduralMinorBodies.ts —
    // MINOR_BODIES kept exported as `[]` for any external imports.
    expect(MINOR_BODIES).toEqual([]);
  });

  it('every planet has a renderAs hint and non-zero period', () => {
    for (const p of PLANETS) {
      expect(p.renderAs).toBeDefined();
      expect(p.orbit.periodDays).toBeGreaterThan(0);
      expect(p.orbit.a_km).toBeGreaterThan(0);
    }
  });

  it('renderableBodies filters out non-renderable enumerated bodies', () => {
    const r = renderableBodies();
    expect(r).toContain(SUN);
    expect(r.length).toBeLessThan(SOLAR_SYSTEM_CATALOG.length);
    // Procedural minor bodies stay off the renderable list — they're drawn
    // via the AsteroidFieldRenderer's instanced path, not as individual
    // meshes. KBOs explicitly excluded.
    //
    // T44 — named comets (Halley, ZTF, Hale-Bopp, …) ARE renderable: the
    // `NamedCometRenderer` meshes them as nucleus + coma + dust/ion tail
    // composites. The procedural comet slice is still excluded.
    expect(r.every((b) => b.kind !== 'kbo')).toBe(true);
    const comets = r.filter((b) => b.kind === 'comet');
    expect(comets.length).toBeGreaterThan(0);
    expect(comets.length).toBeLessThan(20); // only the curated named list
  });

  it('bodyById / moonsOf return the right records', () => {
    expect(bodyById(399)?.name).toBe('Earth');
    expect(bodyById(599)?.name).toBe('Jupiter');
    expect(bodyById(9_999_999)).toBeUndefined();

    const jovianMoons = moonsOf(599);
    const names = jovianMoons.map((m) => m.name);
    // Galileans must be present.
    expect(names).toContain('Io');
    expect(names).toContain('Europa');
    expect(names).toContain('Ganymede');
    expect(names).toContain('Callisto');
    // T39: moonsOf now returns *all* moons (majors + minors + procedural)
    // so the Jovian system clears Doc 23 §8.3's "Moons: 95" census.
    expect(jovianMoons.length).toBeGreaterThanOrEqual(95);
  });

  it('Saturn has rings flagged and Titan + clears 146-moon census', () => {
    const saturn = bodyById(699)!;
    expect(saturn.hasRings).toBe(true);
    const moons = moonsOf(699);
    expect(moons.length).toBeGreaterThanOrEqual(146);
    expect(moons.map((m) => m.name)).toContain('Titan');
  });

  it('Triton is retrograde (negative period)', () => {
    const triton = bodyById(801)!;
    expect(triton.orbit.periodDays).toBeLessThan(0);
  });

  it('Uranus has its 97° obliquity', () => {
    expect(bodyById(799)?.obliquity_deg).toBeGreaterThan(90);
  });

  it('orbital periods roughly satisfy Kepler III (a^3 / P^2 ≈ const)', () => {
    // For heliocentric orbits, GM☉ gives a³/P² in (AU³/yr²) ≈ 1.
    const AU_KM = 149_597_870.7;
    for (const planet of PLANETS) {
      const a_au = planet.orbit.a_km / AU_KM;
      const p_yr = planet.orbit.periodDays / 365.25;
      const ratio = (a_au * a_au * a_au) / (p_yr * p_yr);
      expect(ratio).toBeCloseTo(1, 1);
    }
  });
});
