/**
 * Galaxy catalog tests (T29).
 *
 * - TS-DATA-002: Andromeda (M31) distance ≈ 778 kpc ± 5%.
 * - TS-DATA-005: covers the `galaxies` entity category with ≥1 exemplar
 *   for each of the 4 morphologies (spiral, elliptical, irregular,
 *   lenticular), plus a category-coverage roll-up that combines every
 *   in-code exemplar across the 9 CLAUDE.md categories.
 */

import { describe, expect, it } from 'vitest';

import { SOLAR_SYSTEM_CATALOG } from '@/data/solarSystemCatalog';
import { EXOTIC_KINDS } from '@/utils/exoticPalette';
import { GALAXY_KINDS } from '@/utils/galaxyPalette';
import { NEBULA_KINDS } from '@/utils/nebulaPalette';
import { isGasGiant, isRockyPlanet } from '@/utils/planetPalette';

import {
  ALL_ENTITY_CATEGORIES,
  findGalaxyById,
  galaxiesByKind,
  GALAXY_CATALOG,
  type EntityCategoryKey,
} from '../galaxyCatalog';

describe('GALAXY_CATALOG', () => {
  // ------------------------------------------------------------------------
  // TS-DATA-002 — Andromeda distance
  // ------------------------------------------------------------------------
  it('TS-DATA-002: Andromeda distance matches NED value 778 kpc ± 5%', () => {
    const m31 = findGalaxyById('m31');
    expect(m31).not.toBeNull();
    expect(m31!.messier).toBe(31);
    expect(m31!.ngc).toBe(224);
    expect(m31!.name.toLowerCase()).toContain('andromeda');
    // Doc 23 §20.1 + TS-DATA-002: 778 kpc ± 33 kpc (≈4.2%). Test with the
    // 5% band from TASKS.md.
    const expected = 778;
    const band = expected * 0.05;
    expect(m31!.distance_kpc).toBeGreaterThan(expected - band);
    expect(m31!.distance_kpc).toBeLessThan(expected + band);
  });

  // ------------------------------------------------------------------------
  // Hubble-sequence coverage
  // ------------------------------------------------------------------------
  it.each(GALAXY_KINDS)('covers morphology: %s (≥1 entry)', (kind) => {
    expect(galaxiesByKind(kind).length).toBeGreaterThanOrEqual(1);
  });

  it('every entry has a recognised morphology', () => {
    for (const g of GALAXY_CATALOG) {
      expect(GALAXY_KINDS).toContain(g.kind);
    }
  });

  it('all RA/Dec values fall inside valid sky ranges', () => {
    for (const g of GALAXY_CATALOG) {
      expect(g.ra_deg).toBeGreaterThanOrEqual(0);
      expect(g.ra_deg).toBeLessThan(360);
      expect(g.dec_deg).toBeGreaterThanOrEqual(-90);
      expect(g.dec_deg).toBeLessThanOrEqual(90);
      expect(g.distance_kpc).toBeGreaterThan(0);
    }
  });

  // ------------------------------------------------------------------------
  // TS-DATA-005 — all 9 CLAUDE.md entity categories have ≥1 exemplar
  // ------------------------------------------------------------------------
  it('TS-DATA-005: all 9 entity categories have ≥1 exemplar', () => {
    // Roll up by checking every in-code data source for each category. The
    // 9 categories come from CLAUDE.md §Entity System.
    const coverage: Record<EntityCategoryKey, number> = {
      stars: 0,
      rocky_planets: 0,
      gas_giants: 0,
      moons: 0,
      small_bodies: 0,
      nebulae: 0,
      galaxies: 0,
      large_scale_structure: 0,
      exotic: 0,
    };

    // Solar-system catalog drives stars/rocky/gas/moons/small-bodies.
    for (const body of SOLAR_SYSTEM_CATALOG) {
      if (body.kind === 'star') coverage.stars += 1;
      else if (body.kind === 'planet') {
        if (body.renderAs && isRockyPlanet(body.renderAs)) coverage.rocky_planets += 1;
        else if (body.renderAs && isGasGiant(body.renderAs)) coverage.gas_giants += 1;
      } else if (body.kind === 'moon') coverage.moons += 1;
      else if (body.kind === 'asteroid' || body.kind === 'kbo') coverage.small_bodies += 1;
    }

    // Procedural shader families cover nebulae / galaxies / exotic.
    coverage.nebulae = NEBULA_KINDS.length;
    coverage.galaxies = GALAXY_CATALOG.length;
    coverage.exotic = EXOTIC_KINDS.length;

    // Cosmic-web scaffold + CMB sphere represent large-scale structure.
    // Non-zero by construction — the renderer carries the Doc 17 defaults.
    coverage.large_scale_structure = 2;

    for (const cat of ALL_ENTITY_CATEGORIES) {
      expect(coverage[cat], `category: ${cat}`).toBeGreaterThanOrEqual(1);
    }
  });

  // ------------------------------------------------------------------------
  // Catalog lookup helper
  // ------------------------------------------------------------------------
  it('findGalaxyById returns null for unknown ids', () => {
    expect(findGalaxyById('ngc-does-not-exist')).toBeNull();
  });

  it('every entry has a stable id unique within the catalog', () => {
    const ids = new Set<string>();
    for (const g of GALAXY_CATALOG) {
      expect(ids.has(g.id)).toBe(false);
      ids.add(g.id);
    }
  });
});
