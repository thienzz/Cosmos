/**
 * Named small bodies the T39 verify checklist requires fly-to support for.
 *
 * Doc 23 §6.1.1 and the T39 deliverables call out a small set of historically
 * and scientifically important asteroids/comets that must be individually
 * navigable: Ceres, Vesta, Pallas, Psyche, Eros, Itokawa, Bennu, Ryugu,
 * Apophis. They are *not* part of the procedurally-seeded MPC field rendered
 * by {@link AsteroidFieldRenderer} because the user must be able to type the
 * name into search and fly to the body's catalog entry. Their orbital
 * elements come from JPL Small-Body Database (epoch J2000.0) so the existing
 * Keplerian propagator drives them with the same accuracy as the dwarf
 * planets in {@link DWARF_PLANETS}.
 *
 * NAIF id allocation:
 *   2000xxx — numbered minor planets (e.g. 2000001 = (1) Ceres). Matches
 *   the JPL convention of (NAIF ≡ 2_000_000 + asteroid_number) for SPK
 *   spkez calls. (16) Psyche → 2_000_016. Apophis (asteroid 99942) →
 *   2_099_942. Itokawa = (25143) → 2_025_143, etc.
 */

import type { SolarSystemBody } from './solarSystemCatalog';

const AU_KM = 149_597_870.7;
const yr = (p: number): number => p * 365.25;
const au = (a: number): number => a * AU_KM;

/**
 * Real osculating elements at J2000.0 from JPL Small-Body Database (SBDB).
 * Periods derived via Kepler's third law from the semi-major axis. Ceres
 * already lives in {@link DWARF_PLANETS}; we redeclare it here with the
 * `asteroid` body kind so callers iterating `NAMED_ASTEROIDS` get the
 * "asteroid-belt big four" without a special case — the catalog dedupes
 * by NAIF id when assembling the public list.
 */
export const NAMED_ASTEROIDS: readonly SolarSystemBody[] = [
  // (1) Ceres — already in DWARF_PLANETS as 2_000_001 dwarf-planet form;
  // skipped here to avoid NAIF collision.

  // (2) Pallas — second-largest main-belt asteroid (~512 km).
  {
    naifId: 2_000_002, name: 'Pallas', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 256, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(2.7723), e: 0.2299, i_deg: 34.84,
      Omega_deg: 173.024, omega_deg: 309.93, M0_deg: 78.228, periodDays: yr(4.6116),
    },
  },
  // (4) Vesta — Dawn mission target, V-type basaltic.
  {
    naifId: 2_000_004, name: 'Vesta', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 262.7, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(2.3617), e: 0.0892, i_deg: 7.14,
      Omega_deg: 103.851, omega_deg: 151.198, M0_deg: 169.453, periodDays: yr(3.6298),
    },
  },
  // (16) Psyche — M-type metallic, target of the NASA Psyche mission.
  {
    naifId: 2_000_016, name: 'Psyche', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 113, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(2.9226), e: 0.1335, i_deg: 3.10,
      Omega_deg: 150.044, omega_deg: 229.65, M0_deg: 220.92, periodDays: yr(4.9986),
    },
  },
  // (433) Eros — first NEAR Shoemaker landing target (S-type).
  {
    naifId: 2_000_433, name: 'Eros', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 8.42, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(1.4583), e: 0.2227, i_deg: 10.83,
      Omega_deg: 304.30, omega_deg: 178.87, M0_deg: 320.20, periodDays: yr(1.7613),
    },
  },
  // (25143) Itokawa — Hayabusa-1 sample-return target (S-type rubble pile).
  {
    naifId: 2_025_143, name: 'Itokawa', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 0.165, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(1.3241), e: 0.2801, i_deg: 1.621,
      Omega_deg: 69.082, omega_deg: 162.82, M0_deg: 296.71, periodDays: yr(1.5234),
    },
  },
  // (101955) Bennu — OSIRIS-REx sample-return target (B-type carbonaceous).
  {
    naifId: 2_101_955, name: 'Bennu', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 0.245, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(1.1264), e: 0.2037, i_deg: 6.035,
      Omega_deg: 2.061, omega_deg: 66.223, M0_deg: 101.70, periodDays: yr(1.1955),
    },
  },
  // (162173) Ryugu — Hayabusa-2 sample-return target (C-type carbonaceous).
  {
    naifId: 2_162_173, name: 'Ryugu', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 0.435, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(1.1896), e: 0.1903, i_deg: 5.884,
      Omega_deg: 251.62, omega_deg: 211.43, M0_deg: 22.06, periodDays: yr(1.2989),
    },
  },
  // (99942) Apophis — 2029-04-13 Earth flyby; OSIRIS-APEX target.
  {
    naifId: 2_099_942, name: 'Apophis', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 0.185, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(0.9224), e: 0.1914, i_deg: 3.339,
      Omega_deg: 203.96, omega_deg: 126.80, M0_deg: 60.135, periodDays: yr(0.886),
    },
  },
  // ---- Phase 5 additions (P2G) — remaining famous small bodies ------------
  // (3) Juno — third asteroid discovered (1804).
  {
    naifId: 2_000_003, name: 'Juno', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 116.8, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(2.668), e: 0.257, i_deg: 12.990,
      Omega_deg: 169.852, omega_deg: 248.300, M0_deg: 33.942, periodDays: yr(4.357),
    },
  },
  // (10) Hygiea — fourth-largest asteroid, newly classified dwarf-planet candidate.
  {
    naifId: 2_000_010, name: 'Hygiea', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 216.5, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(3.1381), e: 0.1140, i_deg: 3.8423,
      Omega_deg: 283.202, omega_deg: 313.310, M0_deg: 166.510, periodDays: yr(5.557),
    },
  },
  // (951) Gaspra — first asteroid imaged close-up (Galileo 1991).
  {
    naifId: 2_000_951, name: 'Gaspra', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 6.1, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(2.2098), e: 0.1729, i_deg: 4.113,
      Omega_deg: 253.233, omega_deg: 129.473, M0_deg: 126.670, periodDays: yr(3.286),
    },
  },
  // (243) Ida — second asteroid imaged close-up; discovered moon Dactyl (Galileo 1993).
  {
    naifId: 2_000_243, name: 'Ida', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 15.7, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(2.862), e: 0.0447, i_deg: 1.132,
      Omega_deg: 324.400, omega_deg: 110.960, M0_deg: 50.000, periodDays: yr(4.843),
    },
  },
  // (253) Mathilde — NEAR Shoemaker flyby target (1997), C-type.
  {
    naifId: 2_000_253, name: 'Mathilde', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 26.4, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(2.648), e: 0.266, i_deg: 6.745,
      Omega_deg: 179.610, omega_deg: 157.390, M0_deg: 180.750, periodDays: yr(4.309),
    },
  },
  // (10199) Chariklo — largest centaur, first minor body with discovered rings (2014).
  {
    naifId: 2_010_199, name: 'Chariklo', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 129, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(15.816), e: 0.174, i_deg: 23.387,
      Omega_deg: 300.401, omega_deg: 241.923, M0_deg: 173.000, periodDays: yr(62.90),
    },
  },
  // (486958) Arrokoth — New Horizons flyby target (2019), farthest object explored.
  {
    naifId: 2_486_958, name: 'Arrokoth', kind: 'asteroid', renderAs: 'mercury',
    radius_km: 11, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(44.581), e: 0.0407, i_deg: 2.451,
      Omega_deg: 159.000, omega_deg: 176.790, M0_deg: 316.550, periodDays: yr(297.7),
    },
  },
];

/**
 * NAIF ids of the named asteroids T39 verify pass requires fly-to for. Used
 * by the test suite (and the search auto-suggest list) so adding a new named
 * body is a one-line change.
 */
export const NAMED_ASTEROID_NAIF_IDS: readonly number[] =
  NAMED_ASTEROIDS.map((b) => b.naifId);
