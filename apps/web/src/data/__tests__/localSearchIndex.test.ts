import { beforeEach, describe, expect, it } from 'vitest';

import {
  getLocalSearchIndex,
  resetLocalSearchIndex,
  searchLocalAutocomplete,
  searchLocalText,
} from '../localSearchIndex';

describe('localSearchIndex — offline search fallback', () => {
  beforeEach(() => {
    resetLocalSearchIndex();
  });

  it('builds a non-empty index covering every catalog slice', () => {
    const index = getLocalSearchIndex();
    // Sun + planets + dwarfs + major + named minor moons + named
    // asteroids + comets + exoplanets + 91 IAU stars + 21 galaxies +
    // 30 nebulae + 11 exotic + ~47 LSS + 88 constellations ≥ 300.
    expect(index.length).toBeGreaterThan(300);
    // Memoized — second call returns the same array reference.
    expect(getLocalSearchIndex()).toBe(index);
  });

  it('autocomplete returns prefix matches before substring matches', () => {
    const hits = searchLocalAutocomplete('mar', { limit: 10 });
    expect(hits.length).toBeGreaterThan(0);
    // Mars should outrank bodies that merely contain "mar".
    expect(hits[0]?.text).toBe('Mars');
  });

  it('autocomplete finds the Sun (prefix match)', () => {
    const hits = searchLocalAutocomplete('sun');
    expect(hits[0]?.text).toBe('Sun');
    expect(hits[0]?.category).toBe(1); // Stars
  });

  it('autocomplete classifies Jupiter as a gas giant (category 3)', () => {
    const hits = searchLocalAutocomplete('jupi');
    expect(hits[0]?.text).toBe('Jupiter');
    expect(hits[0]?.category).toBe(3);
  });

  it('autocomplete classifies rocky planets as category 2', () => {
    const earth = searchLocalAutocomplete('earth')[0];
    const mercury = searchLocalAutocomplete('mercury')[0];
    expect(earth?.category).toBe(2);
    expect(mercury?.category).toBe(2);
  });

  it('autocomplete classifies moons as category 4', () => {
    const luna = searchLocalAutocomplete('moon').find((h) => h.text === 'Moon');
    expect(luna).toBeDefined();
    expect(luna?.category).toBe(4);
    const io = searchLocalAutocomplete('io').find((h) => h.text === 'Io');
    expect(io).toBeDefined();
    expect(io?.category).toBe(4);
  });

  it('autocomplete classifies named asteroids as small bodies (category 7)', () => {
    const vesta = searchLocalAutocomplete('vesta');
    expect(vesta[0]?.text).toBe('Vesta');
    expect(vesta[0]?.category).toBe(7);
  });

  it('autocomplete respects the category filter', () => {
    const starsOnly = searchLocalAutocomplete('', { category: 1 });
    expect(starsOnly).toEqual([]);
    const all = searchLocalAutocomplete('a', { category: 1, limit: 40 });
    // Every returned hit must be a star.
    for (const h of all) expect(h.category).toBe(1);
  });

  it('autocomplete wraps the matched substring in <em>…</em> for the UI', () => {
    const hits = searchLocalAutocomplete('sat');
    expect(hits[0]?.highlight).toContain('<em>Sat</em>urn');
  });

  it('empty query returns no autocomplete hits', () => {
    expect(searchLocalAutocomplete('')).toEqual([]);
    expect(searchLocalAutocomplete('   ')).toEqual([]);
  });

  it('full-text search returns TextSearchItem-shaped records with a total count', () => {
    const { items, total } = searchLocalText('mars');
    expect(total).toBeGreaterThanOrEqual(1);
    expect(items[0]?.name).toBe('Mars');
    expect(items[0]?._links.self).toContain('/entities/ent/');
    expect(items[0]?.ent_id).toMatch(/^NAIF-/);
  });

  it('full-text search paginates via offset + limit', () => {
    const first = searchLocalText('a', { limit: 3, offset: 0 });
    const next = searchLocalText('a', { limit: 3, offset: 3 });
    expect(first.items.length).toBeLessThanOrEqual(3);
    expect(next.items.length).toBeLessThanOrEqual(3);
    expect(first.total).toBe(next.total);
    const firstIds = new Set(first.items.map((i) => i.ent_id));
    for (const item of next.items) expect(firstIds.has(item.ent_id)).toBe(false);
  });

  it('full-text search filters by category', () => {
    // Use an unrelated query so we actually exercise the filter.
    const moonsEmpty = searchLocalText('zzzz', { category: 4 });
    expect(moonsEmpty.items).toEqual([]);
    const gasGiants = searchLocalText('e', { category: 3, limit: 20 });
    for (const it of gasGiants.items) expect(it.category).toBe(3);
  });

  it('exoplanet host-name aliases match ("proxima" finds Proxima Centauri b)', () => {
    const hits = searchLocalAutocomplete('proxima');
    expect(hits.some((h) => h.text.toLowerCase().includes('proxima'))).toBe(true);
  });

  // -------------------------------------------------------------------
  // Phase A coverage — deep-sky catalogs are indexed and carry ICRS data
  // -------------------------------------------------------------------

  it('finds the Andromeda Galaxy with distance and coordinates', () => {
    const hits = searchLocalAutocomplete('andromeda');
    const m31 = hits.find((h) => h.text.toLowerCase().includes('andromeda'));
    expect(m31).toBeDefined();
    expect(m31?.category).toBe(6);            // Galaxies
    expect(m31?.ent_id).toMatch(/^GAL-/);
    // Distance carried through as parsecs (778 kpc ≈ 778000 pc).
    expect(m31?.distance_pc).toBeGreaterThan(700_000);
    expect(m31?.distance_pc).toBeLessThan(1_000_000);
    expect(typeof m31?.ra).toBe('number');
    expect(typeof m31?.dec).toBe('number');
  });

  it('matches Andromeda via the "M31" Messier alias', () => {
    const hits = searchLocalAutocomplete('m31');
    const m31 = hits.find((h) => h.text.toLowerCase().includes('andromeda'));
    expect(m31).toBeDefined();
    expect(m31?.category).toBe(6);
  });

  it('matches Andromeda via "Messier 31" (space-tolerant alias)', () => {
    const hits = searchLocalAutocomplete('messier 31');
    const m31 = hits.find((h) => h.text.toLowerCase().includes('andromeda'));
    expect(m31).toBeDefined();
  });

  it('finds Sirius with ICRS position + magnitude', () => {
    const hits = searchLocalAutocomplete('sirius');
    const sirius = hits[0];
    expect(sirius?.text).toBe('Sirius');
    expect(sirius?.category).toBe(1);          // Stars
    expect(sirius?.magnitude).toBeLessThan(0); // −1.46
    // Hipparcos-based distance ~2.637 pc.
    expect(sirius?.distance_pc).toBeCloseTo(2.637, 1);
  });

  it('matches Sirius via its HIP alias', () => {
    const hits = searchLocalAutocomplete('HIP32349');
    const sirius = hits.find((h) => h.text === 'Sirius');
    expect(sirius).toBeDefined();
  });

  it('finds Sgr A* in the Exotic category via generic "black hole" alias', () => {
    const hits = searchLocalAutocomplete('black hole');
    const sgr = hits.find((h) => h.text.toLowerCase().includes('sagittarius a'));
    expect(sgr).toBeDefined();
    expect(sgr?.category).toBe(9);
    // ~8178 pc distance.
    expect(sgr?.distance_pc).toBeCloseTo(8178, -1);
  });

  it('finds Sgr A* by its "sgr a*" name', () => {
    const hits = searchLocalAutocomplete('sgr a');
    expect(hits.some((h) => h.text.toLowerCase().includes('sagittarius a'))).toBe(true);
  });

  it('finds Orion Nebula (M42) in the Nebulae category', () => {
    const hits = searchLocalAutocomplete('orion nebula');
    const m42 = hits.find((h) => h.text.toLowerCase().includes('orion nebula'));
    expect(m42).toBeDefined();
    expect(m42?.category).toBe(5);
    expect(m42?.distance_pc).toBeCloseTo(412, 0);
  });

  it('surfaces both Orion constellation and Orion Nebula when searching "orion"', () => {
    const hits = searchLocalAutocomplete('orion', { limit: 20 });
    const byCategory = new Set(hits.map((h) => h.category));
    expect(byCategory.has(5)).toBe(true);     // nebula
    expect(byCategory.has(10)).toBe(true);    // constellation
  });

  it('finds Europa moon (not the exoplanet host) in category 4', () => {
    const hits = searchLocalAutocomplete('europa');
    const europa = hits.find((h) => h.text === 'Europa');
    expect(europa).toBeDefined();
    expect(europa?.category).toBe(4);
  });

  it('finds Halley named comet in category 7', () => {
    const hits = searchLocalAutocomplete('halley');
    expect(hits.some((h) => h.text.includes('Halley'))).toBe(true);
    const halley = hits.find((h) => h.text.includes('Halley'));
    expect(halley?.category).toBe(7);
  });

  it('finds Virgo Cluster in Large-scale structure with Mpc distance', () => {
    const hits = searchLocalAutocomplete('virgo');
    const vc = hits.find((h) => h.text.toLowerCase().includes('virgo'));
    expect(vc).toBeDefined();
    expect(vc?.category).toBe(8);
    // 16.5 Mpc = 16.5 × 10⁶ pc.
    expect(vc?.distance_pc).toBeGreaterThan(1e7);
    expect(vc?.distance_pc).toBeLessThan(2e7);
  });

  it('finds Pleiades (open cluster) with distance ~136 pc', () => {
    const hits = searchLocalAutocomplete('pleiades');
    const p = hits.find((h) => h.text.toLowerCase().includes('pleiades'));
    expect(p).toBeDefined();
    expect(p?.category).toBe(8);
    expect(p?.distance_pc).toBeCloseTo(136, 0);
  });

  it('finds Amalthea (named minor moon) in category 4', () => {
    const hits = searchLocalAutocomplete('amalthea');
    expect(hits.some((h) => h.text === 'Amalthea')).toBe(true);
    expect(hits[0]?.category).toBe(4);
  });

  it('finds Proxima Centauri the star (not just the exoplanet alias)', () => {
    const hits = searchLocalAutocomplete('proxima centauri');
    // First hit should be the IAU star entry (has ra/dec), not only the
    // exoplanet b/c/d entries.
    const star = hits.find((h) => h.text === 'Proxima Centauri');
    expect(star).toBeDefined();
    expect(star?.category).toBe(1);
    expect(typeof star?.distance_pc).toBe('number');
  });

  it('finds the Crab Pulsar and its alias PSR B0531+21', () => {
    const byName = searchLocalAutocomplete('crab pulsar')
      .find((h) => h.text === 'Crab Pulsar');
    expect(byName).toBeDefined();
    expect(byName?.category).toBe(9);

    const byAlias = searchLocalAutocomplete('PSR B0531')
      .find((h) => h.text === 'Crab Pulsar');
    expect(byAlias).toBeDefined();
  });

  it('full-text search surfaces galaxies with distance', () => {
    const { items } = searchLocalText('galaxy', { category: 6, limit: 10 });
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(it.category).toBe(6);
      expect(typeof it.distance_pc).toBe('number');
    }
  });

  it('constellation entries have null distance (sky direction only)', () => {
    const hits = searchLocalAutocomplete('ursa major');
    const uma = hits.find((h) => h.category === 10);
    expect(uma).toBeDefined();
    // distance_pc explicitly null for constellations.
    expect(uma?.distance_pc).toBeNull();
    expect(typeof uma?.ra).toBe('number');
    expect(typeof uma?.dec).toBe('number');
  });
});
