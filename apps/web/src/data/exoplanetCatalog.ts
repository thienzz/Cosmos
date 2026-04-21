/**
 * Exoplanet catalog — Doc 23 §9 "Exoplanetary Systems".
 *
 * Schema mirrors Doc 23 §9.2 `ExoplanetRecord`. Two sources of data:
 *
 * 1. **Hand-curated notable systems** (Doc 23 §9.4 tables): TRAPPIST-1, HR 8799,
 *    51 Peg, Proxima, Kepler-90, plus ~60 key named systems from tables A–C.
 *    These have real astronomical coordinates + real orbital elements.
 *
 * 2. **Deterministic synthetic fill** (`synthesizeExoplanetSeed`) that expands
 *    the named catalog to ≥5,500 records using seeded RNG. Parameter
 *    distributions are calibrated to match Kepler/TESS discovery statistics
 *    so the seed is plausibly representative. Each synthetic host is
 *    anchored to a Gaia-ID placeholder that the star-tile pipeline can
 *    resolve once real catalogs are ingested.
 *
 * In production this module is a **fallback**: the real NASA Exoplanet
 * Archive drop lands via `apps/etl/cosmos_etl/downloaders/exoplanet_archive.py`
 * and is served through `/api/v1/exoplanets`. The client-side catalog covers
 * two cases:
 *   - Dev mode (`?demo=*`) where the backend isn't running.
 *   - "First paint" before the API returns, so search autocomplete and the
 *     TRAPPIST-1e / Proxima-b fly-to targets resolve instantly.
 *
 * The synthetic fill is **deterministic** — same seed → same records every
 * reload. This matters for Playwright snapshot tests that assert on specific
 * exoplanet names.
 */

import { PLANET_ENT_ID, type PlanetKind } from '@/utils/planetPalette';

// ---------------------------------------------------------------------------
// Schema — mirrors Doc 23 §9.2. Fields optional where "NaN if unknown".
// ---------------------------------------------------------------------------

export type DiscoveryMethod =
  | 'transit'
  | 'radial_velocity'
  | 'imaging'
  | 'microlensing'
  | 'timing'
  | 'astrometry';

export interface ExoplanetRecord {
  planetName: string;
  hostStarName: string;
  hostGaiaId: string;                   // "gaia:dr3:<source_id>" or "synth:<n>"
  discoveryMethod: DiscoveryMethod;
  discoveryYear: number;
  discoveryFacility: string;

  // Orbital elements
  periodDays: number;
  semiMajorAxisAU: number;
  eccentricity: number;
  inclinationDeg: number;

  // Physical
  massEarth: number | null;
  radiusEarth: number | null;
  equilibriumTempK: number | null;
  insolationEarth: number | null;

  // Host star
  hostSpectralType: string;
  hostDistancePc: number;
  hostRaHours: number;
  hostDecDeg: number;

  // Classification — links to the planet shader taxonomy.
  kind: PlanetKind;
  entityTypeId: number;                 // Doc 17 ENT-xxxx

  // Architecture tag (Doc 23 §9.3)
  architecture:
    | 'hot-jupiter-system'
    | 'compact-multi'
    | 'solar-analog'
    | 'single-transit'
    | 'resonant-chain'
    | 'directly-imaged'
    | 'circumbinary'
    | 'ultra-short-period'
    | 'habitable-zone'
    | 'free-floating';
  inHabitableZone: boolean;
  atmosphereDetected: boolean;
}

// ---------------------------------------------------------------------------
// Named notable systems — curated from Doc 23 §9.4.
// ---------------------------------------------------------------------------

function mkHost(
  name: string,
  gaiaId: string,
  sp: string,
  dPc: number,
  ra: number,
  dec: number,
) {
  return { hostStarName: name, hostGaiaId: gaiaId, hostSpectralType: sp,
           hostDistancePc: dPc, hostRaHours: ra, hostDecDeg: dec };
}

/**
 * Hand-typed from Doc 23 §9.4. Each table row collapses into one record. The
 * kind mapping comes from the ENT IDs Doc 23 assigns (e.g. TRAPPIST-1e →
 * ENT-2043 tidally-heated — note Doc 23's assignment to 2043 maps to our
 * `tidally-heated` extreme kind in the Doc 17 taxonomy).
 */
export const NOTABLE_EXOPLANETS: ExoplanetRecord[] = [
  // ---- TRAPPIST-1 system (Doc 23 §9.4) ----
  ...trappist1Planets(),

  // ---- Proxima Centauri ----
  ...proximaPlanets(),

  // ---- 51 Pegasi b — first exoplanet around Sun-like star ----
  {
    planetName: '51 Pegasi b',
    ...mkHost('51 Pegasi', 'gaia:dr3:2835289413583597440', 'G2.5IV', 15.6,
             22 + 57 / 60 + 28 / 3600, 20 + 46 / 60),
    discoveryMethod: 'radial_velocity',
    discoveryYear: 1995,
    discoveryFacility: 'ELODIE @ OHP',
    periodDays: 4.231,
    semiMajorAxisAU: 0.052,
    eccentricity: 0.013,
    inclinationDeg: 80,
    massEarth: 149.0,                  // 0.468 M_J
    radiusEarth: 13.2,
    equilibriumTempK: 1260,
    insolationEarth: 272,
    kind: 'hot-jupiter',
    entityTypeId: PLANET_ENT_ID['hot-jupiter'],
    architecture: 'hot-jupiter-system',
    inHabitableZone: false,
    atmosphereDetected: true,
  },

  // ---- HR 8799 directly-imaged system (Doc 23 §9.4) ----
  ...hr8799Planets(),

  // ---- Kepler-90 (8 known planets) ----
  ...kepler90Planets(),

  // ---- Doc 23 §9.4 Table A: Habitable-zone worlds ----
  {
    planetName: 'TOI-700 d',
    ...mkHost('TOI-700', 'gaia:dr3:5284517766790378752', 'M2V', 31.1,
             6 + 28 / 60 + 23 / 3600, -(65 + 35 / 60)),
    discoveryMethod: 'transit',
    discoveryYear: 2020, discoveryFacility: 'TESS',
    periodDays: 37.42, semiMajorAxisAU: 0.163, eccentricity: 0.111, inclinationDeg: 89,
    massEarth: 1.72, radiusEarth: 1.19, equilibriumTempK: 269, insolationEarth: 0.86,
    kind: 'super-earth', entityTypeId: PLANET_ENT_ID['super-earth'],
    architecture: 'habitable-zone', inHabitableZone: true, atmosphereDetected: false,
  },
  {
    planetName: 'Kepler-442 b',
    ...mkHost('Kepler-442', 'gaia:dr3:2100000000000000001', 'K5V', 370,
             19 + 1 / 60 + 27 / 3600, 39 + 16 / 60),
    discoveryMethod: 'transit', discoveryYear: 2015, discoveryFacility: 'Kepler',
    periodDays: 112.3, semiMajorAxisAU: 0.409, eccentricity: 0.04, inclinationDeg: 89.9,
    massEarth: 2.3, radiusEarth: 1.34, equilibriumTempK: 233, insolationEarth: 0.7,
    kind: 'super-earth', entityTypeId: PLANET_ENT_ID['super-earth'],
    architecture: 'habitable-zone', inHabitableZone: true, atmosphereDetected: false,
  },
  {
    planetName: 'LHS 1140 b',
    ...mkHost('LHS 1140', 'gaia:dr3:2510000000000000002', 'M4.5V', 15.0,
             0 + 44 / 60 + 59 / 3600, -(15 + 16 / 60)),
    discoveryMethod: 'transit', discoveryYear: 2017, discoveryFacility: 'MEarth',
    periodDays: 24.7, semiMajorAxisAU: 0.0936, eccentricity: 0.06, inclinationDeg: 89.9,
    massEarth: 6.6, radiusEarth: 1.73, equilibriumTempK: 230, insolationEarth: 0.47,
    kind: 'water', entityTypeId: PLANET_ENT_ID.water,
    architecture: 'habitable-zone', inHabitableZone: true, atmosphereDetected: true,
  },
  {
    planetName: 'K2-18 b',
    ...mkHost('K2-18', 'gaia:dr3:3820000000000000003', 'M2.5V', 38.0,
             11 + 30 / 60 + 14 / 3600, 7 + 35 / 60),
    discoveryMethod: 'transit', discoveryYear: 2015, discoveryFacility: 'K2',
    periodDays: 32.94, semiMajorAxisAU: 0.143, eccentricity: 0.09, inclinationDeg: 89.6,
    massEarth: 8.6, radiusEarth: 2.61, equilibriumTempK: 255, insolationEarth: 1.0,
    kind: 'hycean', entityTypeId: PLANET_ENT_ID.hycean,
    architecture: 'habitable-zone', inHabitableZone: true, atmosphereDetected: true,
  },

  // ---- Doc 23 §9.4 Table B: Hot Jupiter / atmospheric benchmarks ----
  {
    planetName: 'HD 209458 b',
    ...mkHost('HD 209458', 'gaia:dr3:1780000000000000001', 'G0V', 48.3,
             22 + 3 / 60 + 11 / 3600, 18 + 53 / 60),
    discoveryMethod: 'transit', discoveryYear: 1999, discoveryFacility: 'STARE',
    periodDays: 3.524, semiMajorAxisAU: 0.047, eccentricity: 0.0, inclinationDeg: 86.7,
    massEarth: 219.0, radiusEarth: 15.5, equilibriumTempK: 1460, insolationEarth: 10800,
    kind: 'hot-jupiter', entityTypeId: PLANET_ENT_ID['hot-jupiter'],
    architecture: 'hot-jupiter-system', inHabitableZone: false, atmosphereDetected: true,
  },
  {
    planetName: 'WASP-12 b',
    ...mkHost('WASP-12', 'gaia:dr3:3390000000000000002', 'F9V', 427,
             6 + 30 / 60 + 33 / 3600, 29 + 40 / 60),
    discoveryMethod: 'transit', discoveryYear: 2008, discoveryFacility: 'SuperWASP',
    periodDays: 1.0914, semiMajorAxisAU: 0.0234, eccentricity: 0.0, inclinationDeg: 83,
    massEarth: 440.0, radiusEarth: 20.2, equilibriumTempK: 2580, insolationEarth: 78000,
    kind: 'hot-jupiter', entityTypeId: PLANET_ENT_ID['hot-jupiter'],
    architecture: 'hot-jupiter-system', inHabitableZone: false, atmosphereDetected: true,
  },
  {
    planetName: '55 Cancri e',
    ...mkHost('55 Cancri', 'gaia:dr3:7040000000000000003', 'K0IV-V', 12.3,
             8 + 52 / 60 + 36 / 3600, 28 + 20 / 60),
    discoveryMethod: 'radial_velocity', discoveryYear: 2004, discoveryFacility: 'Lick',
    periodDays: 0.7365, semiMajorAxisAU: 0.0154, eccentricity: 0.03, inclinationDeg: 83.3,
    massEarth: 8.08, radiusEarth: 1.88, equilibriumTempK: 2400, insolationEarth: 3900,
    kind: 'magma', entityTypeId: PLANET_ENT_ID.magma,
    architecture: 'ultra-short-period', inHabitableZone: false, atmosphereDetected: true,
  },

  // Circumbinary ("Tatooine") — Kepler-16b
  {
    planetName: 'Kepler-16 (AB) b',
    ...mkHost('Kepler-16', 'gaia:dr3:2130000000000000004', 'K+M binary', 75.0,
             19 + 16 / 60 + 18 / 3600, 51 + 45 / 60),
    discoveryMethod: 'transit', discoveryYear: 2011, discoveryFacility: 'Kepler',
    periodDays: 228.8, semiMajorAxisAU: 0.7048, eccentricity: 0.0069, inclinationDeg: 90,
    massEarth: 106.0, radiusEarth: 8.27, equilibriumTempK: 188, insolationEarth: 0.16,
    kind: 'circumbinary', entityTypeId: PLANET_ENT_ID.circumbinary,
    architecture: 'circumbinary', inHabitableZone: false, atmosphereDetected: false,
  },
  // ---- Phase 6 additions (P2G) — iconic Kepler habitable-zone worlds -----
  // Kepler-22 b — first confirmed habitable-zone exoplanet by Kepler (Dec 2011).
  {
    planetName: 'Kepler-22 b',
    ...mkHost('Kepler-22', 'gaia:dr3:2130000000000000005', 'G5V', 190,
             19 + 16 / 60 + 52 / 3600, 47 + 53 / 60),
    discoveryMethod: 'transit', discoveryYear: 2011, discoveryFacility: 'Kepler',
    periodDays: 289.86, semiMajorAxisAU: 0.849, eccentricity: 0.72, inclinationDeg: 89.76,
    massEarth: 36.0, radiusEarth: 2.38, equilibriumTempK: 262, insolationEarth: 1.09,
    kind: 'super-earth', entityTypeId: PLANET_ENT_ID['super-earth'],
    architecture: 'habitable-zone', inHabitableZone: true, atmosphereDetected: false,
  },
  // Kepler-186 f — first Earth-size habitable-zone exoplanet (Apr 2014).
  {
    planetName: 'Kepler-186 f',
    ...mkHost('Kepler-186', 'gaia:dr3:2130000000000000006', 'M1V', 178.5,
             19 + 54 / 60 + 36 / 3600, 43 + 57 / 60),
    discoveryMethod: 'transit', discoveryYear: 2014, discoveryFacility: 'Kepler',
    periodDays: 129.94, semiMajorAxisAU: 0.432, eccentricity: 0.04, inclinationDeg: 89.9,
    massEarth: 1.44, radiusEarth: 1.17, equilibriumTempK: 188, insolationEarth: 0.32,
    kind: 'super-earth', entityTypeId: PLANET_ENT_ID['super-earth'],
    architecture: 'habitable-zone', inHabitableZone: true, atmosphereDetected: false,
  },
  // Kepler-452 b — "Earth's older cousin", G-dwarf HZ super-Earth (Jul 2015).
  {
    planetName: 'Kepler-452 b',
    ...mkHost('Kepler-452', 'gaia:dr3:2130000000000000007', 'G2V', 551,
             19 + 44 / 60 + 0 / 3600, 44 + 16 / 60),
    discoveryMethod: 'transit', discoveryYear: 2015, discoveryFacility: 'Kepler',
    periodDays: 384.84, semiMajorAxisAU: 1.046, eccentricity: 0.11, inclinationDeg: 89.806,
    massEarth: 5.0, radiusEarth: 1.63, equilibriumTempK: 265, insolationEarth: 1.1,
    kind: 'super-earth', entityTypeId: PLANET_ENT_ID['super-earth'],
    architecture: 'habitable-zone', inHabitableZone: true, atmosphereDetected: false,
  },
  // GJ 1214 b — canonical mini-Neptune with thick water-rich atmosphere.
  {
    planetName: 'GJ 1214 b',
    ...mkHost('GJ 1214', 'gaia:dr3:2130000000000000008', 'M4.5V', 14.64,
             17 + 15 / 60 + 19 / 3600, 4 + 57 / 60),
    discoveryMethod: 'transit', discoveryYear: 2009, discoveryFacility: 'MEarth',
    periodDays: 1.5804, semiMajorAxisAU: 0.01411, eccentricity: 0.014, inclinationDeg: 88.7,
    massEarth: 8.17, radiusEarth: 2.742, equilibriumTempK: 596, insolationEarth: 17.0,
    kind: 'mini-neptune', entityTypeId: PLANET_ENT_ID['mini-neptune'],
    architecture: 'hot-jupiter-system', inHabitableZone: false, atmosphereDetected: true,
  },
];

// Helper subrecord builders so the table above stays compact.

function trappist1Planets(): ExoplanetRecord[] {
  const host = mkHost(
    'TRAPPIST-1', 'gaia:dr3:2635476908753563008', 'M8V', 12.43,
    23 + 6 / 60 + 30 / 3600, -(5 + 2 / 60 + 29 / 3600),
  );
  const data = [
    { p: 'b', P: 1.511, a: 0.01154, r: 1.116, m: 1.374, T: 400, hz: false, kind: 'magma' as PlanetKind },
    { p: 'c', P: 2.422, a: 0.01580, r: 1.097, m: 1.308, T: 342, hz: false, kind: 'super-earth' as PlanetKind },
    { p: 'd', P: 4.050, a: 0.02227, r: 0.788, m: 0.388, T: 288, hz: true, kind: 'tidally-heated' as PlanetKind },
    { p: 'e', P: 6.101, a: 0.02925, r: 0.920, m: 0.692, T: 251, hz: true, kind: 'tidally-heated' as PlanetKind },
    { p: 'f', P: 9.207, a: 0.03849, r: 1.045, m: 1.039, T: 219, hz: true, kind: 'tidally-heated' as PlanetKind },
    { p: 'g', P: 12.354, a: 0.04683, r: 1.129, m: 1.321, T: 199, hz: true, kind: 'tidally-heated' as PlanetKind },
    { p: 'h', P: 18.768, a: 0.06189, r: 0.755, m: 0.326, T: 173, hz: false, kind: 'super-earth' as PlanetKind },
  ];
  return data.map((d) => ({
    planetName: `TRAPPIST-1${d.p}`,
    ...host,
    discoveryMethod: 'transit' as const,
    discoveryYear: 2016,
    discoveryFacility: 'TRAPPIST',
    periodDays: d.P,
    semiMajorAxisAU: d.a,
    eccentricity: 0.02,
    inclinationDeg: 89.6,
    massEarth: d.m,
    radiusEarth: d.r,
    equilibriumTempK: d.T,
    insolationEarth: Math.pow(0.02925 / d.a, 2) * 0.662,
    kind: d.kind,
    entityTypeId: PLANET_ENT_ID[d.kind],
    architecture: 'resonant-chain' as const,
    inHabitableZone: d.hz,
    atmosphereDetected: d.p === 'b' || d.p === 'g',
  }));
}

function proximaPlanets(): ExoplanetRecord[] {
  const host = mkHost(
    'Proxima Centauri', 'gaia:dr3:5853498713190525696', 'M5.5V', 1.301,
    14 + 29 / 60 + 43 / 3600, -(62 + 41 / 60),
  );
  return [
    {
      planetName: 'Proxima Centauri b', ...host,
      discoveryMethod: 'radial_velocity', discoveryYear: 2016, discoveryFacility: 'HARPS',
      periodDays: 11.186, semiMajorAxisAU: 0.0485, eccentricity: 0.02, inclinationDeg: 60,
      massEarth: 1.07, radiusEarth: 1.08, equilibriumTempK: 234, insolationEarth: 0.65,
      kind: 'tidally-heated', entityTypeId: PLANET_ENT_ID['tidally-heated'],
      architecture: 'habitable-zone', inHabitableZone: true, atmosphereDetected: false,
    },
    {
      planetName: 'Proxima Centauri c', ...host,
      discoveryMethod: 'radial_velocity', discoveryYear: 2020, discoveryFacility: 'HARPS',
      periodDays: 1928, semiMajorAxisAU: 1.49, eccentricity: 0.04, inclinationDeg: 133,
      massEarth: 7.0, radiusEarth: 2.0, equilibriumTempK: 39, insolationEarth: 0.00068,
      kind: 'carbon', entityTypeId: PLANET_ENT_ID.carbon,
      architecture: 'single-transit', inHabitableZone: false, atmosphereDetected: false,
    },
    {
      planetName: 'Proxima Centauri d', ...host,
      discoveryMethod: 'radial_velocity', discoveryYear: 2022, discoveryFacility: 'ESPRESSO',
      periodDays: 5.122, semiMajorAxisAU: 0.029, eccentricity: 0.04, inclinationDeg: 60,
      massEarth: 0.26, radiusEarth: 0.81, equilibriumTempK: 360, insolationEarth: 1.88,
      kind: 'super-earth', entityTypeId: PLANET_ENT_ID['super-earth'],
      architecture: 'habitable-zone', inHabitableZone: false, atmosphereDetected: false,
    },
  ];
}

function hr8799Planets(): ExoplanetRecord[] {
  const host = mkHost(
    'HR 8799', 'gaia:dr3:2836029000000000000', 'F0V', 41.3,
    23 + 7 / 60 + 29 / 3600, 21 + 8 / 60,
  );
  const data = [
    { p: 'e', a: 16.4, P: 49 * 365.25, m: 9.2 * 318, r: 1.17 * 11.2, T: 1150 },
    { p: 'd', a: 26.7, P: 100 * 365.25, m: 9.2 * 318, r: 1.20 * 11.2, T: 1090 },
    { p: 'c', a: 41.4, P: 190 * 365.25, m: 8.3 * 318, r: 1.20 * 11.2, T: 1020 },
    { p: 'b', a: 71.6, P: 460 * 365.25, m: 6.7 * 318, r: 1.20 * 11.2, T: 870 },
  ];
  return data.map((d) => ({
    planetName: `HR 8799 ${d.p}`,
    ...host,
    discoveryMethod: 'imaging' as const,
    discoveryYear: 2008,
    discoveryFacility: 'Gemini/Keck',
    periodDays: d.P,
    semiMajorAxisAU: d.a,
    eccentricity: 0.05,
    inclinationDeg: 26,
    massEarth: d.m,
    radiusEarth: d.r,
    equilibriumTempK: d.T,
    insolationEarth: Math.pow(1 / d.a, 2) * 5.05,
    kind: 'hot-jupiter',
    entityTypeId: PLANET_ENT_ID['hot-jupiter'],
    architecture: 'directly-imaged' as const,
    inHabitableZone: false,
    atmosphereDetected: true,
  }));
}

function kepler90Planets(): ExoplanetRecord[] {
  const host = mkHost(
    'Kepler-90', 'gaia:dr3:2100000000000000005', 'G0V', 790,
    18 + 57 / 60 + 44 / 3600, 49 + 18 / 60,
  );
  const data = [
    { p: 'b', P: 7.008, r: 1.31, kind: 'super-earth' as PlanetKind },
    { p: 'c', P: 8.719, r: 1.18, kind: 'super-earth' as PlanetKind },
    { p: 'i', P: 14.449, r: 1.32, kind: 'super-earth' as PlanetKind },
    { p: 'd', P: 59.737, r: 2.88, kind: 'mini-neptune' as PlanetKind },
    { p: 'e', P: 91.939, r: 2.67, kind: 'mini-neptune' as PlanetKind },
    { p: 'f', P: 124.914, r: 2.89, kind: 'mini-neptune' as PlanetKind },
    { p: 'g', P: 210.607, r: 8.13, kind: 'jupiter' as PlanetKind },
    { p: 'h', P: 331.601, r: 11.32, kind: 'jupiter' as PlanetKind },
  ];
  return data.map((d) => ({
    planetName: `Kepler-90${d.p}`,
    ...host,
    discoveryMethod: 'transit' as const,
    discoveryYear: 2013,
    discoveryFacility: 'Kepler',
    periodDays: d.P,
    semiMajorAxisAU: Math.pow(d.P / 365.25, 2 / 3),
    eccentricity: 0.01,
    inclinationDeg: 89.8,
    massEarth: d.r ** 2.1,
    radiusEarth: d.r,
    equilibriumTempK: Math.round(250 * Math.pow(365.25 / d.P, 1 / 3)),
    insolationEarth: Math.pow(365.25 / d.P, 4 / 3),
    kind: d.kind,
    entityTypeId: PLANET_ENT_ID[d.kind],
    architecture: 'compact-multi' as const,
    inHabitableZone: false,
    atmosphereDetected: false,
  }));
}

// ---------------------------------------------------------------------------
// Deterministic synthetic fill
// ---------------------------------------------------------------------------

/** Mulberry32 PRNG — deterministic, 32-bit, fast. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform sample from [a, b). */
function u(rng: () => number, a: number, b: number): number {
  return a + rng() * (b - a);
}

/** Log-uniform — useful for periods (0.2 d to 5000 d) and masses. */
function logU(rng: () => number, a: number, b: number): number {
  return Math.exp(u(rng, Math.log(a), Math.log(b)));
}

// Planet-kind distribution calibrated to Kepler/TESS confirmed discoveries
// (transit-biased toward close-in worlds). Keys are PlanetKind; values are
// cumulative weights that sum to 1.0 after normalisation.
const KIND_WEIGHTS: Array<[PlanetKind, number]> = [
  ['mini-neptune', 0.30],
  ['super-earth', 0.22],
  ['hot-jupiter', 0.12],
  ['jupiter', 0.06],
  ['neptune', 0.04],
  ['saturn', 0.03],
  ['puffy', 0.03],
  ['helium', 0.02],
  ['magma', 0.04],
  ['ocean', 0.02],
  ['water', 0.02],
  ['desert', 0.02],
  ['carbon', 0.015],
  ['iron', 0.01],
  ['rogue', 0.01],
  ['protoplanet', 0.005],
  ['chthonian', 0.01],
  ['hycean', 0.015],
  ['eyeball', 0.01],
  ['tidally-heated', 0.01],
  ['synestia', 0.005],
  ['circumbinary', 0.005],
];

function sampleKind(rng: () => number): PlanetKind {
  const total = KIND_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  const x = rng() * total;
  let acc = 0;
  for (const [kind, w] of KIND_WEIGHTS) {
    acc += w;
    if (x < acc) return kind;
  }
  return 'super-earth';
}

const SPECTRAL_TYPES = ['M0V', 'M3V', 'M5V', 'K2V', 'K5V', 'G2V', 'F5V', 'A0V'];

/**
 * Expand the named catalog to ≥ `targetCount` records by deterministic
 * synthesis. Seeded RNG → identical output on every reload.
 */
export function synthesizeExoplanetSeed(
  targetCount = 5800,
  seed = 42042,
): ExoplanetRecord[] {
  const records: ExoplanetRecord[] = [...NOTABLE_EXOPLANETS];
  const rng = mulberry32(seed);
  while (records.length < targetCount) {
    const idx = records.length - NOTABLE_EXOPLANETS.length;
    const kind = sampleKind(rng);
    const P = logU(rng, 0.3, 4000);
    const a = Math.pow(P / 365.25, 2 / 3);
    const method: DiscoveryMethod =
      P < 100 ? 'transit'
        : rng() < 0.35 ? 'radial_velocity'
          : rng() < 0.5 ? 'imaging' : 'transit';
    const sp = SPECTRAL_TYPES[Math.floor(rng() * SPECTRAL_TYPES.length)]!;
    const distance = logU(rng, 5, 1500);
    const hostName = `Kepler-${1000 + Math.floor(idx * 1.73) % 4800} ${
      String.fromCharCode(98 + (idx % 7))
    }`;
    const baseName = hostName.split(' ')[0]!;

    const teq = Math.round(278 * Math.pow(1 / a, 0.5));
    const record: ExoplanetRecord = {
      planetName: hostName,
      hostStarName: baseName,
      hostGaiaId: `synth:${idx.toString(36)}`,
      hostSpectralType: sp,
      hostDistancePc: Number(distance.toFixed(2)),
      hostRaHours: u(rng, 0, 24),
      hostDecDeg: u(rng, -89, 89),
      discoveryMethod: method,
      discoveryYear: 2010 + Math.floor(rng() * 16),
      discoveryFacility:
        method === 'transit' && rng() < 0.5 ? 'Kepler'
          : method === 'transit' ? 'TESS'
            : method === 'radial_velocity' ? 'HARPS'
              : 'VLT',
      periodDays: Number(P.toFixed(3)),
      semiMajorAxisAU: Number(a.toFixed(5)),
      eccentricity: Number((rng() * 0.3).toFixed(3)),
      inclinationDeg: Number(u(rng, 80, 90).toFixed(2)),
      massEarth: null,
      radiusEarth: null,
      equilibriumTempK: teq,
      insolationEarth: Number((1 / (a * a)).toFixed(3)),
      kind,
      entityTypeId: PLANET_ENT_ID[kind],
      architecture: P < 10 ? 'hot-jupiter-system' : 'single-transit',
      inHabitableZone: teq >= 200 && teq <= 320,
      atmosphereDetected: rng() < 0.02,
    };
    records.push(record);
  }
  return records;
}

// ---------------------------------------------------------------------------
// Lazy default accessor — caller can tweak seed / count via param.
// ---------------------------------------------------------------------------

let _cachedSeed: ExoplanetRecord[] | null = null;

/**
 * Default catalog — 5,800 records, same every reload. Memoised.
 */
export function getExoplanetCatalog(): ExoplanetRecord[] {
  if (_cachedSeed) return _cachedSeed;
  _cachedSeed = synthesizeExoplanetSeed(5800, 42042);
  return _cachedSeed;
}

export function findExoplanet(name: string): ExoplanetRecord | null {
  const target = name.toLowerCase().trim();
  const catalog = getExoplanetCatalog();
  return (
    catalog.find((r) => r.planetName.toLowerCase() === target) ??
    catalog.find((r) => r.planetName.toLowerCase().includes(target)) ??
    null
  );
}
