/**
 * Named comets the T44 verify checklist requires fly-to support for
 * (Doc 17 §ENT-4020..ENT-4023, Doc 23 §8.9).
 *
 * Unlike the procedural `comet` slice in {@link proceduralMinorBodies} —
 * which is a statistical distribution of orbital elements rendered as a
 * GPU point cloud — these are real comets with real osculating elements
 * from JPL Small-Body Database. They're rendered individually by
 * {@link NamedCometRenderer} so the user can fly to a body by name and
 * see a nucleus + dust-tail + ion-tail composite.
 *
 * NAIF id allocation (non-procedural, carved out above the MPC range
 * used by `proceduralMinorBodies.ts`):
 *
 *   1_000_001  1P/Halley
 *   1_000_002  2P/Encke
 *   1_000_003  67P/Churyumov–Gerasimenko
 *   1_000_004  C/1995 O1 (Hale-Bopp)
 *   1_000_005  C/2020 F3 (NEOWISE)
 *   1_000_006  C/2022 E3 (ZTF)        ← T44 verify target
 *   1_000_007  2I/Borisov (interstellar)
 */

import type { SmallBodySubtype } from './proceduralMinorBodies';
import type { SolarSystemBody } from './solarSystemCatalog';

const AU_KM = 149_597_870.7;
const yr = (p: number): number => p * 365.25;
const au = (a: number): number => a * AU_KM;

/**
 * Extended body record for named comets — inherits `SolarSystemBody` so
 * the existing fly-to and catalog lookups keep working, and adds a few
 * display-time parameters the comet renderer needs.
 */
export interface NamedComet extends SolarSystemBody {
  /**
   * Doc 17 sub-class (ENT-4020..ENT-4023). Drives the tail-length +
   * coma-opacity preset in the renderer.
   */
  subtype: Extract<
    SmallBodySubtype,
    'comet-short-period' | 'comet-long-period' | 'comet-halley-type' | 'comet-interstellar'
  >;
  /** Activity strength (0..1). Hale-Bopp ≈ 1, Encke ≈ 0.3. */
  activity: number;
  /** Dust tail length (km, peak) — visualised; not literal. */
  dustTailLength_km: number;
  /** Ion tail length (km, peak). */
  ionTailLength_km: number;
  /** Nucleus radius in km (Doc 17 nucleus sizes). */
  nucleus_km: number;
}

/**
 * Seven named comets covering every Doc 17 ENT-402x subtype. Orbital
 * elements from JPL Small-Body Database at J2000.0 epoch unless noted.
 * Periods computed via Kepler's third law from semi-major axis.
 */
export const NAMED_COMETS: readonly NamedComet[] = [
  // 1P/Halley — Halley-type, retrograde. Perihelion 1986, next 2061.
  {
    naifId: 1_000_001,
    name: '1P/Halley',
    kind: 'comet',
    radius_km: 5.5,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-halley-type',
    activity: 0.85,
    dustTailLength_km: 100_000_000,
    ionTailLength_km: 300_000_000,
    nucleus_km: 5.5,
    orbit: {
      a_km: au(17.737), e: 0.96714, i_deg: 162.26,
      Omega_deg: 58.42, omega_deg: 111.33, M0_deg: 38.38,
      periodDays: yr(75.32),
    },
  },
  // 2P/Encke — shortest-period periodic comet (3.3 yr), fading activity.
  {
    naifId: 1_000_002,
    name: '2P/Encke',
    kind: 'comet',
    radius_km: 2.4,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-short-period',
    activity: 0.30,
    dustTailLength_km: 20_000_000,
    ionTailLength_km: 60_000_000,
    nucleus_km: 2.4,
    orbit: {
      a_km: au(2.2154), e: 0.84821, i_deg: 11.78,
      Omega_deg: 334.56, omega_deg: 186.54, M0_deg: 63.78,
      periodDays: yr(3.30),
    },
  },
  // 67P/Churyumov–Gerasimenko — Rosetta target, dual-lobe nucleus.
  {
    naifId: 1_000_003,
    name: '67P/Churyumov–Gerasimenko',
    kind: 'comet',
    radius_km: 2.0,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-short-period',
    activity: 0.55,
    dustTailLength_km: 30_000_000,
    ionTailLength_km: 80_000_000,
    nucleus_km: 2.0,
    orbit: {
      a_km: au(3.4628), e: 0.64102, i_deg: 7.04,
      Omega_deg: 50.15, omega_deg: 12.78, M0_deg: 91.26,
      periodDays: yr(6.44),
    },
  },
  // C/1995 O1 (Hale-Bopp) — iconic 1997 naked-eye, long-period.
  {
    naifId: 1_000_004,
    name: 'C/1995 O1 (Hale-Bopp)',
    kind: 'comet',
    radius_km: 30,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-long-period',
    activity: 1.0,
    dustTailLength_km: 1_000_000_000,
    ionTailLength_km: 2_000_000_000,
    nucleus_km: 30,
    orbit: {
      a_km: au(186.0), e: 0.99493, i_deg: 89.43,
      Omega_deg: 282.47, omega_deg: 130.59, M0_deg: 0.01,
      periodDays: yr(2533),
    },
  },
  // C/2020 F3 (NEOWISE) — 2020 summer naked-eye comet.
  {
    naifId: 1_000_005,
    name: 'C/2020 F3 (NEOWISE)',
    kind: 'comet',
    radius_km: 5,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-long-period',
    activity: 0.80,
    dustTailLength_km: 300_000_000,
    ionTailLength_km: 500_000_000,
    nucleus_km: 5,
    orbit: {
      a_km: au(358), e: 0.99921, i_deg: 128.94,
      Omega_deg: 61.01, omega_deg: 37.28, M0_deg: 0.0,
      periodDays: yr(6766),
    },
  },
  // C/2022 E3 (ZTF) — January 2023 green comet ("comet of the cave bears").
  // T44 verify checklist requires this specific fly-to target.
  {
    naifId: 1_000_006,
    name: 'C/2022 E3 (ZTF)',
    kind: 'comet',
    radius_km: 1.0,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-long-period',
    activity: 0.65,
    dustTailLength_km: 120_000_000,
    ionTailLength_km: 250_000_000,
    nucleus_km: 1.0,
    // JPL elements at epoch 2023-Jan-21 (close to perihelion 2023-Jan-12).
    // Semi-major axis is slightly hyperbolic in reality; we clamp to a
    // very long ellipse so the Keplerian propagator remains stable.
    orbit: {
      a_km: au(1250), e: 0.99938, i_deg: 109.17,
      Omega_deg: 302.55, omega_deg: 145.85, M0_deg: 0.0,
      periodDays: yr(44200),
    },
  },
  // 2I/Borisov — interstellar, hyperbolic trajectory. Clamped to
  // near-parabolic for stable Keplerian display.
  {
    naifId: 1_000_007,
    name: '2I/Borisov',
    kind: 'comet',
    radius_km: 0.5,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-interstellar',
    activity: 0.50,
    dustTailLength_km: 150_000_000,
    ionTailLength_km: 400_000_000,
    nucleus_km: 0.5,
    orbit: {
      a_km: au(5000), e: 0.999, i_deg: 44.05,
      Omega_deg: 308.15, omega_deg: 209.12, M0_deg: 0.0,
      periodDays: yr(500_000),
    },
  },
  // ---- Phase 5 additions (P2G) — remaining famous comets ------------------
  // C/1996 B2 (Hyakutake) — Great Comet of 1996, passed 0.10 AU from Earth.
  // Near-parabolic; long-period bin. Epoch 1996 perihelion.
  {
    naifId: 1_000_008,
    name: 'C/1996 B2 (Hyakutake)',
    kind: 'comet',
    radius_km: 2.2,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-long-period',
    activity: 0.90,
    dustTailLength_km: 800_000_000,
    ionTailLength_km: 1_200_000_000,
    nucleus_km: 2.2,
    orbit: {
      a_km: au(1700), e: 0.99971, i_deg: 124.92,
      Omega_deg: 188.04, omega_deg: 130.17, M0_deg: 0.0,
      periodDays: yr(70_000),
    },
  },
  // 9P/Tempel 1 — Deep Impact target (2005-07-04) and Stardust-NExT flyby (2011).
  {
    naifId: 1_000_009,
    name: '9P/Tempel 1',
    kind: 'comet',
    radius_km: 3.0,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-short-period',
    activity: 0.45,
    dustTailLength_km: 15_000_000,
    ionTailLength_km: 40_000_000,
    nucleus_km: 3.0,
    orbit: {
      a_km: au(3.148), e: 0.5096, i_deg: 10.47,
      Omega_deg: 68.75, omega_deg: 179.24, M0_deg: 157.75,
      periodDays: yr(5.583),
    },
  },
  // D/1993 F2 (Shoemaker-Levy 9) — destroyed 1994-07 when fragments impacted
  // Jupiter. We render it at epoch 1993 (pre-impact) so the search entry
  // lands on the comet's last observable orbit around Jupiter. The orbit is
  // Jovicentric but we approximate with a barycentric/heliocentric keplerian
  // for the Keplerian propagator — the position is historical context only.
  {
    naifId: 1_000_010,
    name: 'D/1993 F2 (Shoemaker-Levy 9)',
    kind: 'comet',
    radius_km: 1.0,
    parentNaifId: 10,
    renderable: true,
    subtype: 'comet-short-period',
    activity: 0.40,
    dustTailLength_km: 5_000_000,
    ionTailLength_km: 10_000_000,
    nucleus_km: 1.0,
    orbit: {
      a_km: au(5.4), e: 0.2158, i_deg: 6.003,
      Omega_deg: 220.54, omega_deg: 354.89, M0_deg: 0.0,
      periodDays: yr(12.0),
    },
  },
];

export const NAMED_COMET_NAIF_IDS: readonly number[] =
  NAMED_COMETS.map((c) => c.naifId);

/** Resolve a named comet by NAIF id (O(n), but n = 7). */
export function namedCometById(naifId: number): NamedComet | undefined {
  return NAMED_COMETS.find((c) => c.naifId === naifId);
}
