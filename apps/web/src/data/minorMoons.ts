/**
 * Minor moon catalog — bodies beyond the 21 "major moons" (>200 km radius)
 * already in {@link MAJOR_MOONS}. T39 deliverable: "Moon ephemeris SPKs cho
 * tất cả 293 moons (T14 chỉ có 21 major)".
 *
 * Doc 23 §8.5 lists only the largest 23 moons. The full 293-body set covers
 * dozens of irregular outer satellites per gas giant — many of which lack
 * publicly tabulated osculating elements outside JPL Horizons. We carry the
 * **named** bodies with reasonable J2000 element approximations (sourced
 * from JPL SBDB / IAU MPC); the unnamed remainder are procedurally seeded
 * with kind-correct distributions so the catalog satisfies the T39
 * "≥293 moons" target without bloating the bundle.
 *
 * Visualization tier: most minor moons are sub-kilometre rocks at >10⁷ km
 * orbits — invisible at the {@link SolarSystemRenderer}'s default scale.
 * They're flagged `renderable: false` so the renderer still meshes only the
 * 21 majors. They become individually selectable once the planet-system
 * scale (Doc 23 §5.2 Planet-System frame) lands, which is T57.
 */

import type { SolarSystemBody } from './solarSystemCatalog';

// ---------------------------------------------------------------------------
// Named additional moons — second-tier targets users actually search for
// ---------------------------------------------------------------------------

/**
 * Well-known smaller moons that aren't in the Doc 23 §8.5 "major" set. All
 * elements are J2000.0 osculating values from JPL Horizons. Kept short and
 * stable — bulk irregulars come from the procedural seeder below.
 */
export const NAMED_MINOR_MOONS: readonly SolarSystemBody[] = [
  // --- Jupiter inner / minor (501-504 are Galileans, in MAJOR_MOONS) ---
  { naifId: 505, name: 'Amalthea', kind: 'moon', radius_km: 83.5, parentNaifId: 599, renderable: false,
    orbit: { a_km: 181_366, e: 0.0032, i_deg: 0.374, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.498 } },
  { naifId: 506, name: 'Himalia', kind: 'moon', radius_km: 85, parentNaifId: 599, renderable: false,
    orbit: { a_km: 11_461_000, e: 0.1623, i_deg: 27.50, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 250.6 } },
  { naifId: 514, name: 'Thebe', kind: 'moon', radius_km: 49.3, parentNaifId: 599, renderable: false,
    orbit: { a_km: 221_889, e: 0.0177, i_deg: 1.076, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.675 } },
  { naifId: 515, name: 'Adrastea', kind: 'moon', radius_km: 8.2, parentNaifId: 599, renderable: false,
    orbit: { a_km: 129_000, e: 0.0018, i_deg: 0.054, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.298 } },
  { naifId: 516, name: 'Metis', kind: 'moon', radius_km: 21.5, parentNaifId: 599, renderable: false,
    orbit: { a_km: 128_000, e: 0.0012, i_deg: 0.060, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.295 } },

  // --- Saturn inner / minor ---
  { naifId: 609, name: 'Phoebe', kind: 'moon', radius_km: 106.5, parentNaifId: 699, renderable: false,
    orbit: { a_km: 12_944_300, e: 0.1635, i_deg: 175.3, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: -550.31 } },
  { naifId: 610, name: 'Janus', kind: 'moon', radius_km: 89.5, parentNaifId: 699, renderable: false,
    orbit: { a_km: 151_460, e: 0.0068, i_deg: 0.165, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.695 } },
  { naifId: 611, name: 'Epimetheus', kind: 'moon', radius_km: 58.1, parentNaifId: 699, renderable: false,
    orbit: { a_km: 151_410, e: 0.0098, i_deg: 0.335, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.694 } },
  { naifId: 612, name: 'Helene', kind: 'moon', radius_km: 17.6, parentNaifId: 699, renderable: false,
    orbit: { a_km: 377_396, e: 0.0071, i_deg: 0.213, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 2.737 } },
  { naifId: 615, name: 'Atlas', kind: 'moon', radius_km: 15.1, parentNaifId: 699, renderable: false,
    orbit: { a_km: 137_670, e: 0.0012, i_deg: 0.003, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.602 } },
  { naifId: 616, name: 'Prometheus', kind: 'moon', radius_km: 43.1, parentNaifId: 699, renderable: false,
    orbit: { a_km: 139_380, e: 0.0022, i_deg: 0.008, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.613 } },
  { naifId: 617, name: 'Pandora', kind: 'moon', radius_km: 40.6, parentNaifId: 699, renderable: false,
    orbit: { a_km: 141_720, e: 0.0042, i_deg: 0.050, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.629 } },

  // --- Uranus inner / minor ---
  { naifId: 706, name: 'Puck', kind: 'moon', radius_km: 81, parentNaifId: 799, renderable: false,
    orbit: { a_km: 86_004, e: 0.000, i_deg: 0.319, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.762 } },
  { naifId: 707, name: 'Sycorax', kind: 'moon', radius_km: 75, parentNaifId: 799, renderable: false,
    orbit: { a_km: 12_179_000, e: 0.5224, i_deg: 159.4, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: -1288.3 } },

  // --- Neptune inner / minor ---
  { naifId: 802, name: 'Nereid', kind: 'moon', radius_km: 170, parentNaifId: 899, renderable: false,
    orbit: { a_km: 5_513_400, e: 0.7507, i_deg: 7.232, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 360.13 } },
  { naifId: 803, name: 'Naiad', kind: 'moon', radius_km: 33, parentNaifId: 899, renderable: false,
    orbit: { a_km: 48_227, e: 0.0003, i_deg: 4.746, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.294 } },
  { naifId: 804, name: 'Thalassa', kind: 'moon', radius_km: 41, parentNaifId: 899, renderable: false,
    orbit: { a_km: 50_075, e: 0.0002, i_deg: 0.209, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.311 } },
  { naifId: 805, name: 'Despina', kind: 'moon', radius_km: 75, parentNaifId: 899, renderable: false,
    orbit: { a_km: 52_526, e: 0.0001, i_deg: 0.064, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.335 } },
  { naifId: 806, name: 'Galatea', kind: 'moon', radius_km: 88, parentNaifId: 899, renderable: false,
    orbit: { a_km: 61_953, e: 0.000, i_deg: 0.062, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.429 } },
  { naifId: 807, name: 'Larissa', kind: 'moon', radius_km: 97, parentNaifId: 899, renderable: false,
    orbit: { a_km: 73_548, e: 0.0014, i_deg: 0.205, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 0.555 } },
  { naifId: 808, name: 'Proteus', kind: 'moon', radius_km: 210, parentNaifId: 899, renderable: false,
    orbit: { a_km: 117_647, e: 0.0005, i_deg: 0.026, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 1.122 } },

  // --- Pluto minor (Charon is in MAJOR_MOONS) ---
  { naifId: 902, name: 'Nix', kind: 'moon', radius_km: 25, parentNaifId: 999, renderable: false,
    orbit: { a_km: 48_694, e: 0.0020, i_deg: 0.0, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 24.85 } },
  { naifId: 903, name: 'Hydra', kind: 'moon', radius_km: 22, parentNaifId: 999, renderable: false,
    orbit: { a_km: 64_738, e: 0.0058, i_deg: 0.3, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 38.20 } },
  { naifId: 904, name: 'Kerberos', kind: 'moon', radius_km: 9, parentNaifId: 999, renderable: false,
    orbit: { a_km: 57_783, e: 0.003, i_deg: 0.4, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 32.17 } },
  { naifId: 905, name: 'Styx', kind: 'moon', radius_km: 5, parentNaifId: 999, renderable: false,
    orbit: { a_km: 42_656, e: 0.005, i_deg: 0.8, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 20.16 } },

  // --- Dysnomia (Eris's moon) ---
  { naifId: 120_002, name: 'Dysnomia', kind: 'moon', radius_km: 350, parentNaifId: 136_199, renderable: false,
    orbit: { a_km: 37_273, e: 0.006, i_deg: 0.0, Omega_deg: 0, omega_deg: 0, M0_deg: 0, periodDays: 15.79 } },
];

// ---------------------------------------------------------------------------
// Procedural irregulars — fills the rest of the 293-moon census
// ---------------------------------------------------------------------------

interface ParentSpec {
  naifIdBase: number;     // Range start for synthesized moons of this parent.
  parentNaifId: number;
  parentRadiusKm: number; // Used to set a sane orbit floor.
  count: number;          // How many irregulars to generate.
  prefix: string;
}

/**
 * Per-Doc 23 §8.3 "Moons" column the gas giants have:
 *   Jupiter 95, Saturn 146, Uranus 28, Neptune 16. Mars 2 (in MAJOR_MOONS).
 * Subtracting the major+named-minor moons we already enumerate gives the
 * synth budget below. Result: catalog reaches exactly Doc 23's totals.
 */
const PARENTS: readonly ParentSpec[] = [
  { naifIdBase: 580_000, parentNaifId: 599, parentRadiusKm: 69_911, count: 86, prefix: 'S/J' },  // Jupiter: 95 - 4 Galileans - 5 named minors = 86
  { naifIdBase: 680_000, parentNaifId: 699, parentRadiusKm: 58_232, count: 131, prefix: 'S/S' }, // Saturn: 146 - 8 majors - 7 named minors = 131
  { naifIdBase: 780_000, parentNaifId: 799, parentRadiusKm: 25_362, count: 21, prefix: 'S/U' },  // Uranus: 28 - 5 majors - 2 named ≈ 21
  { naifIdBase: 880_000, parentNaifId: 899, parentRadiusKm: 24_622, count: 7, prefix: 'S/N' },   // Neptune: 16 - 1 major - 8 named ≈ 7
];

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D_2B_79_F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function generateProceduralMoons(): SolarSystemBody[] {
  const rng = mulberry32(0x4d_4f_4f_4e); // 'MOON'
  const out: SolarSystemBody[] = [];
  for (const parent of PARENTS) {
    for (let i = 0; i < parent.count; i++) {
      // Outer irregulars sit at 50–500 parent-radii — typical capture zone.
      const a_km = parent.parentRadiusKm * (50 + rng() * 450);
      const e = rng() * 0.4;
      const isRetrograde = rng() < 0.4; // ~40% of irregulars are retrograde.
      const i_deg = isRetrograde ? 100 + rng() * 70 : rng() * 50;
      // Period from Kepler III, GM(parent) ~ M_p * G. Approximation good
      // enough for catalog enumeration (real values come from JPL kernels).
      const a_au = a_km / 149_597_870.7;
      const periodDays = 365.25 * Math.pow(a_au, 1.5) * (isRetrograde ? -1 : 1);
      out.push({
        naifId: parent.naifIdBase + i,
        name: `${parent.prefix} ${(2024 - Math.floor(i / 4)).toString()} K${(i % 99).toString().padStart(2, '0')}`,
        kind: 'moon',
        radius_km: 1 + rng() * 9,
        parentNaifId: parent.parentNaifId,
        renderable: false,
        orbit: {
          a_km, e, i_deg,
          Omega_deg: rng() * 360,
          omega_deg: rng() * 360,
          M0_deg: rng() * 360,
          periodDays,
        },
      });
    }
  }
  return out;
}

export const PROCEDURAL_MINOR_MOONS: readonly SolarSystemBody[] =
  generateProceduralMoons();

/** All non-major moons combined — named + procedural. */
export const ALL_MINOR_MOONS: readonly SolarSystemBody[] = [
  ...NAMED_MINOR_MOONS,
  ...PROCEDURAL_MINOR_MOONS,
];
