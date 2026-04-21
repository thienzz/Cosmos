import { describe, expect, it } from 'vitest';

import {
  COMET_COUNT,
  KBO_COUNT,
  MAIN_BELT_COUNT,
  SMALL_BODY_SUBTYPES,
  SMALL_BODY_SUBTYPE_ENT_ID,
  SUBTYPE_COUNT,
  TOTAL_PROCEDURAL_BODIES,
  TROJAN_COUNT,
  _resetProceduralCachesForTests,
  getCometPopulation,
  getKboPopulation,
  getMainBeltPopulation,
  getTrojanPopulation,
  proceduralBodyByNaif,
} from '../proceduralMinorBodies';

describe('proceduralMinorBodies', () => {
  it('totals to ≥ 1.3M procedural bodies (T39 census target)', () => {
    expect(TOTAL_PROCEDURAL_BODIES).toBeGreaterThanOrEqual(1_300_000);
    expect(MAIN_BELT_COUNT + TROJAN_COUNT + KBO_COUNT + COMET_COUNT).toBe(
      TOTAL_PROCEDURAL_BODIES,
    );
  });

  it('main-belt population sits at 2.06–4.10 AU (Doc 23 §8.7)', () => {
    const store = getMainBeltPopulation();
    const AU = 149_597_870.7;
    // Materialized count is capped to the renderable budget (T39 perf —
    // building all 1.05M would cost ~400 ms on first mount).
    expect(store.count).toBeGreaterThan(0);
    expect(store.count).toBeLessThanOrEqual(MAIN_BELT_COUNT);
    let minA = Infinity, maxA = -Infinity;
    // Sample 1k bodies — a full sweep is overkill for the assertion.
    for (let i = 0; i < 1000; i++) {
      const idx = Math.floor((i / 1000) * store.count);
      const a_au = store.a_km[idx] / AU;
      if (a_au < minA) minA = a_au;
      if (a_au > maxA) maxA = a_au;
    }
    expect(minA).toBeGreaterThanOrEqual(2.06);
    expect(maxA).toBeLessThanOrEqual(4.10);
  });

  it('Jupiter Trojan population sits near 5.20 AU', () => {
    const store = getTrojanPopulation();
    const AU = 149_597_870.7;
    for (let i = 0; i < 100; i++) {
      const idx = Math.floor((i / 100) * store.count);
      const a_au = store.a_km[idx] / AU;
      expect(a_au).toBeGreaterThan(5.0);
      expect(a_au).toBeLessThan(5.4);
    }
  });

  it('proceduralBodyByNaif returns null outside any population range', () => {
    expect(proceduralBodyByNaif(1)).toBeNull();
    expect(proceduralBodyByNaif(2_500_000)).toBeNull();
  });

  it('proceduralBodyByNaif resolves a known main-belt id', () => {
    const body = proceduralBodyByNaif(3_000_000);
    expect(body).not.toBeNull();
    expect(body!.kind).toBe('main-belt');
  });

  it('build is deterministic — second call returns identical first sample', () => {
    const a1 = getMainBeltPopulation().a_km[0];
    _resetProceduralCachesForTests();
    const a2 = getMainBeltPopulation().a_km[0];
    expect(a1).toBe(a2);
  });

  it('mean motion is positive non-zero for every population sample', () => {
    for (const store of [getMainBeltPopulation(), getTrojanPopulation(), getKboPopulation(), getCometPopulation()]) {
      // Sample 50 bodies per population.
      for (let i = 0; i < 50; i++) {
        const idx = Math.floor((i / 50) * store.count);
        expect(store.n_rad_per_sec[idx]).toBeGreaterThan(0);
      }
    }
  });

  it('ships 20 Doc 17 subtypes with ENT-IDs in the ENT-401x..406x range (T44)', () => {
    expect(SUBTYPE_COUNT).toBe(20);
    expect(SMALL_BODY_SUBTYPES).toHaveLength(20);
    // Every subtype must map to a 4000-series Doc 17 ENT ID
    // (ENT-4010..ENT-4060 per Doc 17 §Small Bodies).
    for (const subtype of SMALL_BODY_SUBTYPES) {
      const entId = SMALL_BODY_SUBTYPE_ENT_ID[subtype];
      expect(entId).toMatch(/^ENT-4\d{3}$/);
      const code = Number(entId.slice(4));
      expect(code).toBeGreaterThanOrEqual(4010);
      expect(code).toBeLessThanOrEqual(4060);
    }
  });

  it('tags every procedural body with a valid subtype byte (T44)', () => {
    for (const store of [
      getMainBeltPopulation(),
      getTrojanPopulation(),
      getKboPopulation(),
      getCometPopulation(),
    ]) {
      expect(store.subtype).toBeDefined();
      expect(store.subtype.length).toBe(store.count);
      // Sample 100 bodies to assert the range.
      for (let i = 0; i < 100; i++) {
        const idx = Math.floor((i / 100) * store.count);
        const sub = store.subtype[idx];
        expect(sub).toBeGreaterThanOrEqual(0);
        expect(sub).toBeLessThan(SUBTYPE_COUNT);
      }
    }
  });

  it('every Jupiter Trojan lands on the trojan subtype (T44)', () => {
    const store = getTrojanPopulation();
    const trojanIdx = SMALL_BODY_SUBTYPES.indexOf('trojan');
    // Every Trojan sample must classify as ENT-4051.
    for (let i = 0; i < Math.min(200, store.count); i++) {
      expect(store.subtype[i]).toBe(trojanIdx);
    }
  });

  it('materializes ≥ 1M main-belt bodies (T44 verify checklist)', () => {
    const store = getMainBeltPopulation();
    // TS-DATA target — renderer must have at least 1 M asteroids available
    // for instanced rendering at Solar System scale.
    expect(store.count).toBeGreaterThanOrEqual(1_000_000);
  });
});
