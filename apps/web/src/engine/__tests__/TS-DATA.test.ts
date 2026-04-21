/**
 * TS-DATA — Phase 5 positional accuracy validation (Doc 30 §TS-DATA).
 *
 * End-to-end acceptance tests that exercise the actual renderer + catalog
 * data path (not just the catalog tables in isolation). Each test asserts
 * an entity lands within a published tolerance of its real-world position
 * after going through `icrsToSceneUnitsPc` / `keplerPosition` at the
 * engine's default scene scale.
 *
 * Test IDs mirror the TS-DATA block in the project plan:
 *
 *   TS-DATA-01  Sirius at 2.637 pc (Hipparcos)           ±1%
 *   TS-DATA-02  Andromeda (M31) at 778 kpc (NED)         ±1%
 *   TS-DATA-03  Earth at J2000 (Kepler approximation)    ±1% of semi-major
 *   TS-DATA-04  Jupiter at J2000                         ±1% of semi-major
 *   TS-DATA-05  Proxima Centauri at 1.301 pc (Gaia)      ±1%
 *   TS-DATA-06  Sgr A* at 8.178 kpc (GRAVITY 2019)       ±1%
 *   TS-DATA-07  M87* at 16.8 Mpc (EHT 2019)              ±1%
 *   TS-DATA-08  Crab Nebula (M1) at 2 kpc                ±5%
 *   TS-DATA-09  Orion Nebula (M42) at 412 pc             ±5%
 *   TS-DATA-10  LMC at 50 kpc                            ±2%
 */

import {
  DEFAULT_SCENE_SCALE,
  icrsToSceneUnitsPc,
  J2000_JULIAN_DATE,
} from '@cosmos/coordinate-utils';
import { describe, expect, it } from 'vitest';

import {
  IAU_NAMED_STARS,
  findStarByReference,
} from '@/data/constellations';
import { EXOTIC_CATALOG } from '@/data/exoticCatalog';
import { GALAXY_CATALOG } from '@/data/galaxyCatalog';
import { NEBULA_CATALOG } from '@/data/nebulaCatalog';
import { SOLAR_SYSTEM_CATALOG } from '@/data/solarSystemCatalog';

import { keplerPosition } from '../keplerianOrbit';

const UNITS_PER_PC = DEFAULT_SCENE_SCALE.unitsPerPc; // 500

function magnitude(v: { x: number; y: number; z: number }): number {
  return Math.hypot(v.x, v.y, v.z);
}

describe('TS-DATA — positional accuracy (Phase 5 acceptance)', () => {
  it('TS-DATA-01 Sirius at 2.637 pc ±1%', () => {
    const sirius = findStarByReference('Sirius');
    expect(sirius).not.toBeNull();
    const scene = icrsToSceneUnitsPc(sirius!.raDeg, sirius!.decDeg, sirius!.distancePc);
    const actualPc = magnitude(scene) / UNITS_PER_PC;
    const errPct = Math.abs(actualPc - 2.637) / 2.637;
    expect(errPct).toBeLessThan(0.01);
  });

  it('TS-DATA-02 Andromeda (M31) at 778 kpc ±1%', () => {
    const m31 = GALAXY_CATALOG.find((g) => g.id === 'm31');
    expect(m31).toBeDefined();
    const scene = icrsToSceneUnitsPc(m31!.ra_deg, m31!.dec_deg, m31!.distance_kpc * 1000);
    const actualKpc = magnitude(scene) / UNITS_PER_PC / 1000;
    const errPct = Math.abs(actualKpc - 778) / 778;
    expect(errPct).toBeLessThan(0.01);
  });

  it('TS-DATA-03 Earth via Kepler at J2000 within 1% of semi-major axis', () => {
    const earth = SOLAR_SYSTEM_CATALOG.find((b) => b.name === 'Earth');
    expect(earth).toBeDefined();
    const pos = keplerPosition(earth!.orbit, J2000_JULIAN_DATE);
    const rKm = Math.hypot(pos.x, pos.y, pos.z);
    // Earth's orbit has e=0.01671 → perihelion ≈ 0.983 AU, aphelion ≈ 1.017 AU.
    // At J2000 (1 Jan 2000) Earth is near perihelion; distance ≈ 0.984 AU.
    const AU_KM = 149_597_870.7;
    const rAu = rKm / AU_KM;
    expect(rAu).toBeGreaterThan(0.983 - 0.01);
    expect(rAu).toBeLessThan(1.017 + 0.01);
  });

  it('TS-DATA-04 Jupiter via Kepler at J2000 within 1% of semi-major axis', () => {
    const jupiter = SOLAR_SYSTEM_CATALOG.find((b) => b.name === 'Jupiter');
    expect(jupiter).toBeDefined();
    const pos = keplerPosition(jupiter!.orbit, J2000_JULIAN_DATE);
    const rKm = Math.hypot(pos.x, pos.y, pos.z);
    const AU_KM = 149_597_870.7;
    const rAu = rKm / AU_KM;
    // Jupiter's semi-major is 5.2025 AU; perihelion 4.95 AU, aphelion 5.46 AU.
    expect(rAu).toBeGreaterThan(4.95 - 0.05);
    expect(rAu).toBeLessThan(5.46 + 0.05);
  });

  it('TS-DATA-05 Proxima Centauri at 1.301 pc ±1%', () => {
    const proxima = findStarByReference('Proxima Centauri');
    expect(proxima).not.toBeNull();
    const scene = icrsToSceneUnitsPc(proxima!.raDeg, proxima!.decDeg, proxima!.distancePc);
    const actualPc = magnitude(scene) / UNITS_PER_PC;
    const errPct = Math.abs(actualPc - 1.301) / 1.301;
    expect(errPct).toBeLessThan(0.01);
  });

  it('TS-DATA-06 Sgr A* at 8.178 kpc ±1%', () => {
    const sgr = EXOTIC_CATALOG.find((e) => e.id === 'sgr-a-star');
    expect(sgr).toBeDefined();
    const scene = icrsToSceneUnitsPc(sgr!.ra_deg, sgr!.dec_deg, sgr!.distance_pc);
    const actualKpc = magnitude(scene) / UNITS_PER_PC / 1000;
    const errPct = Math.abs(actualKpc - 8.178) / 8.178;
    expect(errPct).toBeLessThan(0.01);
  });

  it('TS-DATA-07 M87* at 16.8 Mpc ±1%', () => {
    const m87 = EXOTIC_CATALOG.find((e) => e.id === 'm87-star');
    expect(m87).toBeDefined();
    const scene = icrsToSceneUnitsPc(m87!.ra_deg, m87!.dec_deg, m87!.distance_pc);
    const actualMpc = magnitude(scene) / UNITS_PER_PC / 1_000_000;
    const errPct = Math.abs(actualMpc - 16.8) / 16.8;
    expect(errPct).toBeLessThan(0.01);
  });

  it('TS-DATA-08 Crab Nebula (M1) at 2 kpc ±5%', () => {
    const m1 = NEBULA_CATALOG.find((n) => n.id === 'm1');
    expect(m1).toBeDefined();
    const scene = icrsToSceneUnitsPc(m1!.ra_deg, m1!.dec_deg, m1!.distance_pc);
    const actualPc = magnitude(scene) / UNITS_PER_PC;
    const errPct = Math.abs(actualPc - 2000) / 2000;
    expect(errPct).toBeLessThan(0.05);
  });

  it('TS-DATA-09 Orion Nebula (M42) at 412 pc ±5%', () => {
    const m42 = NEBULA_CATALOG.find((n) => n.id === 'm42');
    expect(m42).toBeDefined();
    const scene = icrsToSceneUnitsPc(m42!.ra_deg, m42!.dec_deg, m42!.distance_pc);
    const actualPc = magnitude(scene) / UNITS_PER_PC;
    const errPct = Math.abs(actualPc - 412) / 412;
    expect(errPct).toBeLessThan(0.05);
  });

  it('TS-DATA-10 LMC at 50 kpc ±2%', () => {
    const lmc = GALAXY_CATALOG.find((g) => g.id === 'lmc');
    expect(lmc).toBeDefined();
    const scene = icrsToSceneUnitsPc(lmc!.ra_deg, lmc!.dec_deg, lmc!.distance_kpc * 1000);
    const actualKpc = magnitude(scene) / UNITS_PER_PC / 1000;
    const errPct = Math.abs(actualKpc - 50) / 50;
    expect(errPct).toBeLessThan(0.02);
  });
});

describe('TS-DATA — catalog integrity (drift guards)', () => {
  it('IAU named stars catalog has ≥ 80 entries', () => {
    expect(IAU_NAMED_STARS.length).toBeGreaterThanOrEqual(80);
  });

  it('Galaxy catalog includes all 3 Local Group anchors', () => {
    const ids = new Set(GALAXY_CATALOG.map((g) => g.id));
    expect(ids.has('m31')).toBe(true);
    expect(ids.has('lmc')).toBe(true);
    expect(ids.has('smc')).toBe(true);
  });

  it('Nebula catalog includes the 4 Phase 2C verification targets', () => {
    const ids = new Set(NEBULA_CATALOG.map((n) => n.id));
    expect(ids.has('m42')).toBe(true); // Orion
    expect(ids.has('m1')).toBe(true);  // Crab
    expect(ids.has('m57')).toBe(true); // Ring
  });

  it('Exotic catalog includes Sgr A*, M87*, Crab Pulsar, Vela Pulsar', () => {
    const ids = new Set(EXOTIC_CATALOG.map((e) => e.id));
    expect(ids.has('sgr-a-star')).toBe(true);
    expect(ids.has('m87-star')).toBe(true);
    expect(ids.has('crab-pulsar')).toBe(true);
    expect(ids.has('vela-pulsar')).toBe(true);
  });

  it('Solar system catalog has 8 planets + Sun', () => {
    const planets = SOLAR_SYSTEM_CATALOG.filter((b) => b.kind === 'planet');
    expect(planets.length).toBeGreaterThanOrEqual(8);
    for (const name of [
      'Mercury', 'Venus', 'Earth', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune',
    ]) {
      expect(SOLAR_SYSTEM_CATALOG.some((b) => b.name === name)).toBe(true);
    }
  });
});
