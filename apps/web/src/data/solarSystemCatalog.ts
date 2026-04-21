/**
 * Solar System body catalog (Doc 23 §8).
 *
 * The catalog is the single source of truth for "what solar-system bodies
 * exist?". It's consumed by three different layers:
 *
 *   1. {@link SolarSystemRenderer} — meshes the bodies we can visually show
 *      (planets, dwarf planets, major moons) and drives them from their
 *      Keplerian elements each frame.
 *   2. {@link OrbitPathRenderer} — draws the paths of the same bodies.
 *   3. TS-DATA-003 — the test suite asserts `catalog.length ≥ 290` so we
 *      meet the "≥290 solar system bodies" acceptance target even when the
 *      tail of the distribution (asteroid-belt placeholders, minor KBOs)
 *      isn't individually rendered.
 *
 * Numerical values are lifted verbatim from Doc 23 §8.3 (planets), §8.4
 * (dwarf planets), and §8.5 (major moons). Mean-anomaly-at-epoch (`M0`)
 * values are taken from JPL Small-Body Database for J2000.0; they are
 * accurate enough for educational-scale playback but the real JPL DE441
 * ephemeris should replace them in T18 once the ephemeris-service HTTP
 * wrapper ships.
 */

import type { PlanetKind } from '@/utils/planetPalette';

import { ALL_MINOR_MOONS } from './minorMoons';
import { NAMED_ASTEROIDS } from './namedAsteroids';
import { NAMED_COMETS } from './namedComets';
import {
  TOTAL_PROCEDURAL_BODIES,
  proceduralBodyByNaif,
} from './proceduralMinorBodies';

// ---------------------------------------------------------------------------
// Shared vocabulary
// ---------------------------------------------------------------------------

export type BodyKind =
  | 'star'
  | 'planet'
  | 'dwarf_planet'
  | 'moon'
  | 'asteroid'
  | 'kbo'
  | 'comet'
  | 'trojan';

/**
 * Keplerian element set referenced to the body's *parent* (Sun for planets,
 * parent planet for moons). Angles are in degrees, distances in km. We keep
 * SI-unfriendly units here because Doc 23 §8.5 quotes them that way.
 */
export interface KeplerianElements {
  /** Semi-major axis (km). */
  a_km: number;
  /** Eccentricity. */
  e: number;
  /** Inclination to parent's equatorial plane (deg). */
  i_deg: number;
  /** Longitude of ascending node (deg). */
  Omega_deg: number;
  /** Argument of periapsis (deg). */
  omega_deg: number;
  /** Mean anomaly at J2000.0 (deg). */
  M0_deg: number;
  /** Sidereal orbital period (days). Negative = retrograde. */
  periodDays: number;
}

export interface SolarSystemBody {
  /** NAIF / internal id, matching Doc 26 Appendix A where available. */
  naifId: number;
  /** Human-readable name. */
  name: string;
  kind: BodyKind;
  /** If rendered, the PlanetKind used to select the right shader. */
  renderAs?: PlanetKind;
  /** Mean radius (km). */
  radius_km: number;
  /** Parent NAIF id — 10 = Sun for planets, 399 = Earth for Moon, etc. */
  parentNaifId: number;
  orbit: KeplerianElements;
  /** True if the body should be visually meshed (vs count-only catalogue). */
  renderable: boolean;
  /** Ring system hint. Only Saturn uses this today. */
  hasRings?: boolean;
  /** Axial obliquity (deg) — used by the renderer to tilt the mesh. */
  obliquity_deg?: number;
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

const AU_KM = 149_597_870.7;

const au = (a: number): number => a * AU_KM;
const yr = (p: number): number => p * 365.25;

// ---------------------------------------------------------------------------
// Sun (10)
// ---------------------------------------------------------------------------

export const SUN: SolarSystemBody = {
  naifId: 10,
  name: 'Sun',
  kind: 'star',
  radius_km: 695_700,
  parentNaifId: -1,
  renderable: true,
  obliquity_deg: 7.25,
  orbit: {
    a_km: 0,
    e: 0,
    i_deg: 0,
    Omega_deg: 0,
    omega_deg: 0,
    M0_deg: 0,
    periodDays: 0,
  },
};

// ---------------------------------------------------------------------------
// Planets (Doc 23 §8.3)
// ---------------------------------------------------------------------------

export const PLANETS: readonly SolarSystemBody[] = [
  {
    naifId: 199, name: 'Mercury', kind: 'planet', renderAs: 'mercury',
    radius_km: 2_439.7, parentNaifId: 10, renderable: true, obliquity_deg: 0.034,
    orbit: {
      a_km: au(0.387_098), e: 0.205_630, i_deg: 7.005,
      Omega_deg: 48.331, omega_deg: 29.124, M0_deg: 174.796, periodDays: yr(0.240_84),
    },
  },
  {
    naifId: 299, name: 'Venus', kind: 'planet', renderAs: 'venus',
    radius_km: 6_051.8, parentNaifId: 10, renderable: true, obliquity_deg: 177.36,
    orbit: {
      a_km: au(0.723_332), e: 0.006_772, i_deg: 3.394_58,
      Omega_deg: 76.680, omega_deg: 54.884, M0_deg: 50.416, periodDays: yr(0.615_197),
    },
  },
  {
    naifId: 399, name: 'Earth', kind: 'planet', renderAs: 'earth',
    radius_km: 6_371.0, parentNaifId: 10, renderable: true, obliquity_deg: 23.44,
    orbit: {
      a_km: au(1.000_000), e: 0.016_710, i_deg: 0.000_05,
      Omega_deg: -11.260, omega_deg: 114.208, M0_deg: 358.617, periodDays: yr(1.000_017),
    },
  },
  {
    naifId: 499, name: 'Mars', kind: 'planet', renderAs: 'mars',
    radius_km: 3_389.5, parentNaifId: 10, renderable: true, obliquity_deg: 25.19,
    orbit: {
      a_km: au(1.523_679), e: 0.093_400, i_deg: 1.850,
      Omega_deg: 49.558, omega_deg: 286.502, M0_deg: 19.373, periodDays: yr(1.880_85),
    },
  },
  {
    naifId: 599, name: 'Jupiter', kind: 'planet', renderAs: 'jupiter',
    radius_km: 69_911, parentNaifId: 10, renderable: true, obliquity_deg: 3.13,
    orbit: {
      a_km: au(5.202_545), e: 0.048_498, i_deg: 1.303,
      Omega_deg: 100.464, omega_deg: 273.867, M0_deg: 20.020, periodDays: yr(11.862_615),
    },
  },
  {
    naifId: 699, name: 'Saturn', kind: 'planet', renderAs: 'saturn',
    radius_km: 58_232, parentNaifId: 10, renderable: true, hasRings: true, obliquity_deg: 26.73,
    orbit: {
      a_km: au(9.554_909), e: 0.055_508, i_deg: 2.489,
      Omega_deg: 113.665, omega_deg: 339.392, M0_deg: 317.020, periodDays: yr(29.447_498),
    },
  },
  {
    naifId: 799, name: 'Uranus', kind: 'planet', renderAs: 'uranus',
    radius_km: 25_362, parentNaifId: 10, renderable: true, obliquity_deg: 97.77,
    orbit: {
      a_km: au(19.218_446), e: 0.046_295, i_deg: 0.773,
      Omega_deg: 74.006, omega_deg: 98.999, M0_deg: 142.238, periodDays: yr(84.016_846),
    },
  },
  {
    naifId: 899, name: 'Neptune', kind: 'planet', renderAs: 'neptune',
    radius_km: 24_622, parentNaifId: 10, renderable: true, obliquity_deg: 28.32,
    orbit: {
      a_km: au(30.110_387), e: 0.008_988, i_deg: 1.770,
      Omega_deg: 131.784, omega_deg: 276.336, M0_deg: 256.228, periodDays: yr(164.791_32),
    },
  },
];

// ---------------------------------------------------------------------------
// Dwarf planets (Doc 23 §8.4) — rendered as small grey spheres; reuse the
// mercury shader as a stand-in since the exotic-type family (ENT-4030) isn't
// shipped until T28.
// ---------------------------------------------------------------------------

export const DWARF_PLANETS: readonly SolarSystemBody[] = [
  {
    naifId: 999, name: 'Pluto', kind: 'dwarf_planet', renderAs: 'mercury',
    radius_km: 1_188.3, parentNaifId: 10, renderable: true, obliquity_deg: 119.59,
    orbit: {
      a_km: au(39.482), e: 0.248_8, i_deg: 17.16,
      Omega_deg: 110.299, omega_deg: 113.834, M0_deg: 14.53, periodDays: yr(247.94),
    },
  },
  {
    naifId: 136_199, name: 'Eris', kind: 'dwarf_planet', renderAs: 'mercury',
    radius_km: 1_163, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(67.864), e: 0.440_7, i_deg: 44.04,
      Omega_deg: 35.951, omega_deg: 151.639, M0_deg: 205.989, periodDays: yr(559.07),
    },
  },
  {
    naifId: 136_108, name: 'Haumea', kind: 'dwarf_planet', renderAs: 'mercury',
    radius_km: 816, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(43.218), e: 0.191_2, i_deg: 28.19,
      Omega_deg: 122.167, omega_deg: 239.184, M0_deg: 218.504, periodDays: yr(284.12),
    },
  },
  {
    naifId: 136_472, name: 'Makemake', kind: 'dwarf_planet', renderAs: 'mercury',
    radius_km: 715, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(45.430), e: 0.161_3, i_deg: 28.98,
      Omega_deg: 79.572, omega_deg: 294.834, M0_deg: 152.958, periodDays: yr(306.17),
    },
  },
  {
    naifId: 2_000_001, name: 'Ceres', kind: 'dwarf_planet', renderAs: 'mercury',
    radius_km: 469.7, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(2.7675), e: 0.075_80, i_deg: 10.59,
      Omega_deg: 80.329, omega_deg: 73.597, M0_deg: 77.372, periodDays: yr(4.600),
    },
  },
  // ---- Phase 5 addition (P2G) — detached / sednoid TNOs -------------------
  // (90377) Sedna — detached object with 11,400-yr orbit; perihelion 76 AU.
  {
    naifId: 90_377, name: 'Sedna', kind: 'dwarf_planet', renderAs: 'mercury',
    radius_km: 498, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(506), e: 0.849_6, i_deg: 11.930,
      Omega_deg: 144.546, omega_deg: 311.352, M0_deg: 358.107, periodDays: yr(11_400),
    },
  },
  // (2012 VP113) "Biden" — second confirmed sednoid (discovered 2014).
  {
    naifId: 2_012_113, name: '2012 VP113', kind: 'dwarf_planet', renderAs: 'mercury',
    radius_km: 300, parentNaifId: 10, renderable: true,
    orbit: {
      a_km: au(271), e: 0.696, i_deg: 24.050,
      Omega_deg: 90.801, omega_deg: 293.783, M0_deg: 2.942, periodDays: yr(4_455),
    },
  },
];

// ---------------------------------------------------------------------------
// Major moons (Doc 23 §8.5). `a_km` is *relative to parent*; `parentNaifId`
// points at that parent. Periods that Doc 23 quotes as negative (Triton)
// indicate retrograde orbits.
// ---------------------------------------------------------------------------

export const MAJOR_MOONS: readonly SolarSystemBody[] = [
  {
    naifId: 301, name: 'Moon', kind: 'moon', radius_km: 1_737.4,
    parentNaifId: 399, renderable: true,
    orbit: { a_km: 384_400, e: 0.054_9, i_deg: 5.145, Omega_deg: 125.08, omega_deg: 318.15, M0_deg: 135.27, periodDays: 27.322 },
  },
  // Mars moons
  { naifId: 401, name: 'Phobos', kind: 'moon', radius_km: 11.1, parentNaifId: 499, renderable: true,
    orbit: { a_km: 9_376, e: 0.015_1, i_deg: 1.093, Omega_deg: 49.237, omega_deg: 150.247, M0_deg: 91.59, periodDays: 0.319 } },
  { naifId: 402, name: 'Deimos', kind: 'moon', radius_km: 6.2, parentNaifId: 499, renderable: true,
    orbit: { a_km: 23_458, e: 0.000_2, i_deg: 0.93, Omega_deg: 79.4, omega_deg: 260.729, M0_deg: 325.329, periodDays: 1.263 } },
  // Galilean moons
  { naifId: 501, name: 'Io', kind: 'moon', radius_km: 1_821.6, parentNaifId: 599, renderable: true,
    orbit: { a_km: 421_700, e: 0.004_1, i_deg: 0.050, Omega_deg: 43.977, omega_deg: 84.129, M0_deg: 342.021, periodDays: 1.769 } },
  { naifId: 502, name: 'Europa', kind: 'moon', radius_km: 1_560.8, parentNaifId: 599, renderable: true,
    orbit: { a_km: 671_100, e: 0.009_4, i_deg: 0.470, Omega_deg: 219.106, omega_deg: 88.970, M0_deg: 171.016, periodDays: 3.551 } },
  { naifId: 503, name: 'Ganymede', kind: 'moon', radius_km: 2_634.1, parentNaifId: 599, renderable: true,
    orbit: { a_km: 1_070_400, e: 0.001_3, i_deg: 0.204, Omega_deg: 63.552, omega_deg: 192.417, M0_deg: 317.540, periodDays: 7.155 } },
  { naifId: 504, name: 'Callisto', kind: 'moon', radius_km: 2_410.3, parentNaifId: 599, renderable: true,
    orbit: { a_km: 1_882_700, e: 0.007_4, i_deg: 0.205, Omega_deg: 298.848, omega_deg: 52.643, M0_deg: 181.408, periodDays: 16.689 } },
  // Saturn major moons
  { naifId: 601, name: 'Mimas', kind: 'moon', radius_km: 198.2, parentNaifId: 699, renderable: true,
    orbit: { a_km: 185_520, e: 0.019_6, i_deg: 1.574, Omega_deg: 66.2, omega_deg: 160.4, M0_deg: 275.5, periodDays: 0.942 } },
  { naifId: 602, name: 'Enceladus', kind: 'moon', radius_km: 252.1, parentNaifId: 699, renderable: true,
    orbit: { a_km: 237_950, e: 0.004_7, i_deg: 0.009, Omega_deg: 0, omega_deg: 0, M0_deg: 197.0, periodDays: 1.370 } },
  { naifId: 603, name: 'Tethys', kind: 'moon', radius_km: 531.1, parentNaifId: 699, renderable: true,
    orbit: { a_km: 294_619, e: 0.000_1, i_deg: 1.091, Omega_deg: 273.998, omega_deg: 45.2, M0_deg: 285.267, periodDays: 1.888 } },
  { naifId: 604, name: 'Dione', kind: 'moon', radius_km: 561.4, parentNaifId: 699, renderable: true,
    orbit: { a_km: 377_396, e: 0.002_2, i_deg: 0.028, Omega_deg: 0, omega_deg: 284.3, M0_deg: 322.231, periodDays: 2.737 } },
  { naifId: 605, name: 'Rhea', kind: 'moon', radius_km: 763.8, parentNaifId: 699, renderable: true,
    orbit: { a_km: 527_108, e: 0.001_3, i_deg: 0.345, Omega_deg: 311.531, omega_deg: 241.619, M0_deg: 196.543, periodDays: 4.518 } },
  { naifId: 606, name: 'Titan', kind: 'moon', radius_km: 2_574.7, parentNaifId: 699, renderable: true,
    orbit: { a_km: 1_221_870, e: 0.028_8, i_deg: 0.348, Omega_deg: 28.06, omega_deg: 180.532, M0_deg: 15.154, periodDays: 15.945 } },
  { naifId: 607, name: 'Hyperion', kind: 'moon', radius_km: 135, parentNaifId: 699, renderable: true,
    orbit: { a_km: 1_481_009, e: 0.123_0, i_deg: 0.568, Omega_deg: 168.82, omega_deg: 324.0, M0_deg: 295.906, periodDays: 21.277 } },
  { naifId: 608, name: 'Iapetus', kind: 'moon', radius_km: 734.5, parentNaifId: 699, renderable: true,
    orbit: { a_km: 3_560_820, e: 0.028_3, i_deg: 15.47, Omega_deg: 81.105, omega_deg: 314.270, M0_deg: 356.029, periodDays: 79.322 } },
  // Uranus major moons
  { naifId: 701, name: 'Miranda', kind: 'moon', radius_km: 235.8, parentNaifId: 799, renderable: true,
    orbit: { a_km: 129_390, e: 0.001_3, i_deg: 4.338, Omega_deg: 326.438, omega_deg: 68.312, M0_deg: 311.330, periodDays: 1.413 } },
  { naifId: 702, name: 'Ariel', kind: 'moon', radius_km: 578.9, parentNaifId: 799, renderable: true,
    orbit: { a_km: 190_900, e: 0.001_2, i_deg: 0.041, Omega_deg: 22.394, omega_deg: 115.349, M0_deg: 39.481, periodDays: 2.520 } },
  { naifId: 703, name: 'Umbriel', kind: 'moon', radius_km: 584.7, parentNaifId: 799, renderable: true,
    orbit: { a_km: 266_300, e: 0.003_9, i_deg: 0.128, Omega_deg: 33.485, omega_deg: 84.709, M0_deg: 12.469, periodDays: 4.144 } },
  { naifId: 704, name: 'Titania', kind: 'moon', radius_km: 788.4, parentNaifId: 799, renderable: true,
    orbit: { a_km: 435_910, e: 0.001_1, i_deg: 0.079, Omega_deg: 99.771, omega_deg: 284.400, M0_deg: 24.614, periodDays: 8.706 } },
  { naifId: 705, name: 'Oberon', kind: 'moon', radius_km: 761.4, parentNaifId: 799, renderable: true,
    orbit: { a_km: 583_520, e: 0.001_4, i_deg: 0.068, Omega_deg: 279.771, omega_deg: 104.400, M0_deg: 283.088, periodDays: 13.463 } },
  // Neptune moon
  { naifId: 801, name: 'Triton', kind: 'moon', radius_km: 1_353.4, parentNaifId: 899, renderable: true,
    orbit: { a_km: 354_759, e: 0.000_0, i_deg: 156.865, Omega_deg: 178.078, omega_deg: 344.046, M0_deg: 264.775, periodDays: -5.877 } },
  // Pluto moon
  { naifId: 901, name: 'Charon', kind: 'moon', radius_km: 606, parentNaifId: 999, renderable: true,
    orbit: { a_km: 19_591, e: 0.000_2, i_deg: 0.001, Omega_deg: 85.187, omega_deg: 71.255, M0_deg: 147.848, periodDays: 6.387 } },
];

// ---------------------------------------------------------------------------
// Minor body collections (T39).
//
// The legacy 260-stub generator (210 MBAs + 50 KBOs) has been retired —
// {@link proceduralMinorBodies.ts} now sources 1.3M asteroids + Trojans +
// KBOs + comets through tightly-packed Float32Arrays so the catalog hits
// Doc 23 §6.4's "≥1.3M" census without per-body JS objects. `MINOR_BODIES`
// is kept exported as the empty list for backward compatibility with
// existing call sites (e.g. tests) — new code should use
// {@link proceduralBodyCount} or {@link iterProceduralBodies} instead.
// ---------------------------------------------------------------------------

export const MINOR_BODIES: readonly SolarSystemBody[] = [];

// ---------------------------------------------------------------------------
// Public catalog — flat array of *enumerated* bodies (Sun → planets →
// dwarfs → moons → named asteroids). The procedural 1.3M tail lives in
// `proceduralMinorBodies.ts` and is queried lazily.
// ---------------------------------------------------------------------------

export const SOLAR_SYSTEM_CATALOG: readonly SolarSystemBody[] = Object.freeze([
  SUN,
  ...PLANETS,
  ...DWARF_PLANETS,
  ...MAJOR_MOONS,
  ...ALL_MINOR_MOONS,
  ...NAMED_ASTEROIDS,
  ...NAMED_COMETS,
]);

/**
 * Total catalog size including the procedural minor-body population. This
 * is the figure the TS-DATA-003 acceptance check assertion measures
 * against the Doc 23 §6.4 census target (≥1.3M).
 */
export function solarSystemBodyCount(): number {
  return SOLAR_SYSTEM_CATALOG.length + TOTAL_PROCEDURAL_BODIES;
}

export function renderableBodies(): readonly SolarSystemBody[] {
  return SOLAR_SYSTEM_CATALOG.filter((b) => b.renderable);
}

export function bodyById(naifId: number): SolarSystemBody | undefined {
  const enumerated = SOLAR_SYSTEM_CATALOG.find((b) => b.naifId === naifId);
  if (enumerated) return enumerated;
  // Fall through to the procedural store (~O(1) range check).
  const proc = proceduralBodyByNaif(naifId);
  if (!proc) return undefined;
  // Materialize a SolarSystemBody view on demand.
  const kind: BodyKind =
    proc.kind === 'kbo' ? 'kbo'
    : proc.kind === 'comet' ? 'comet'
    : proc.kind === 'trojan' ? 'trojan'
    : 'asteroid';
  return {
    naifId: proc.naifId,
    name: nameForProcedural(proc.naifId, kind),
    kind,
    radius_km: 0.5,
    parentNaifId: 10,
    renderable: false,
    orbit: {
      a_km: proc.a_km,
      e: proc.e,
      i_deg: proc.i_rad * (180 / Math.PI),
      Omega_deg: proc.Omega_rad * (180 / Math.PI),
      omega_deg: proc.omega_rad * (180 / Math.PI),
      M0_deg: proc.M0_rad * (180 / Math.PI),
      // Mean motion → period: P = 2π / n (in seconds, then to days).
      periodDays: proc.n_rad_per_sec === 0
        ? 0
        : (2 * Math.PI) / proc.n_rad_per_sec / 86_400,
    },
  };
}

function nameForProcedural(naifId: number, kind: BodyKind): string {
  if (kind === 'comet') return `C/${naifId - 4_500_000}`;
  if (kind === 'kbo') return `KBO ${naifId - 4_000_000}`;
  if (kind === 'trojan') return `J-Trojan ${naifId - 3_500_000}`;
  return `MPC ${naifId - 3_000_000}`;
}

export function moonsOf(parentNaifId: number): readonly SolarSystemBody[] {
  // Combine majors + minor-moon catalog; procedural irregulars live in
  // ALL_MINOR_MOONS and are folded into the SOLAR_SYSTEM_CATALOG above.
  const majors = MAJOR_MOONS.filter((b) => b.parentNaifId === parentNaifId);
  const minors = ALL_MINOR_MOONS.filter((b) => b.parentNaifId === parentNaifId);
  return [...majors, ...minors];
}
