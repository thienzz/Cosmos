/**
 * Procedural minor-body population — Doc 23 §6.4 census target of 1.3M
 * solar-system bodies. Extended by T44 to carry per-particle subtype
 * classification (Doc 17 §Small Bodies, 20 entity subtypes).
 *
 * # Why a typed-array store
 *
 * Storing 1.3M `SolarSystemBody` objects in JS heap costs >500 MB and breaks
 * the Doc 27 §14 256 MB RAM budget. Instead we hold each body's six
 * Keplerian elements + one subtype byte in tight typed arrays — 7 × 4 B +
 * 1 B per body × 1.3M = ~37 MB. The {@link AsteroidFieldRenderer} streams
 * the first {@link RENDERABLE_PARTICLE_BUDGET} elements into a GPU
 * instanced-points draw call (Doc 23 §8.7 "rendered as orbital element
 * clouds — GPU instanced points sampling the MPC orbital element
 * distribution").
 *
 * # Element distribution
 *
 * Drawn deterministically (Mulberry32) from the per-population windows in
 * Doc 23 §8.7 (main belt 2.06–3.27 AU), §8.8 (Jupiter Trojans L4/L5 at
 * Jupiter ± 60°), §8.11 (classical Kuiper belt 30–55 AU). Counts come from
 * the same sections so the catalog total mirrors MPC actuals.
 *
 * NAIF id allocation (parallel to JPL convention 2_xxx_xxx):
 *
 *   3_000_000 + i  → main-belt body i      (0 ≤ i < MAIN_BELT_COUNT)
 *   3_500_000 + i  → Jupiter Trojan i      (0 ≤ i < TROJAN_COUNT)
 *   4_000_000 + i  → Kuiper-belt object i  (0 ≤ i < KBO_COUNT)
 *   4_500_000 + i  → Comet i               (0 ≤ i < COMET_COUNT)
 *
 * # Subtype byte (T44)
 *
 * Each particle gets a subtype index in [0..SUBTYPE_COUNT) that the GPU
 * uses to pick a palette entry, and callers use to render a "C-type" /
 * "Halley-type" / "Plutino" label. The mapping matches Doc 17 §Small
 * Bodies ENT-401x..406x:
 *
 *   0  C-type asteroid         (ENT-4010)
 *   1  S-type asteroid         (ENT-4011)
 *   2  M-type asteroid         (ENT-4012)
 *   3  V-type asteroid         (ENT-4013)
 *   4  Binary asteroid         (ENT-4014)
 *   5  Rubble-pile asteroid    (ENT-4015)
 *   6  Contact-binary asteroid (ENT-4016)
 *   7  Short-period comet      (ENT-4020)
 *   8  Long-period comet       (ENT-4021)
 *   9  Halley-type comet       (ENT-4022)
 *   10 Interstellar object     (ENT-4023)
 *   11 Pluto-type dwarf planet (ENT-4030)
 *   12 Ceres-type dwarf planet (ENT-4031)
 *   13 Eris-type dwarf planet  (ENT-4032)
 *   14 Classical KBO           (ENT-4040)
 *   15 Resonant KBO (Plutino)  (ENT-4041)
 *   16 Scattered disk object   (ENT-4042)
 *   17 Centaur                 (ENT-4050)
 *   18 Jupiter Trojan          (ENT-4051)
 *   19 Meteoroid stream        (ENT-4060)
 *
 * The 20 subtypes fold back into four {@link ProceduralBodyKind}s so the
 * existing renderer switch, fly-to hit-test, and search box keep working
 * unchanged.
 */

const AU_KM = 149_597_870.7;
const SECONDS_PER_DAY = 86_400;

// ---------------------------------------------------------------------------
// Population sizing (Doc 23 §6.4 + §8.7-§8.11)
// ---------------------------------------------------------------------------

/**
 * Census totals (Doc 23 §6.4 + §8.7-§8.11). These are the population sizes
 * the catalog *reports* for "≥1.3M solar-system bodies" — they're the
 * arithmetic count, not the in-memory size.
 */
export const MAIN_BELT_COUNT = 1_050_000;   // §8.7 "~1.3M known" minus Trojans/KBOs/comets
export const TROJAN_COUNT = 11_500;          // §8.8 Jupiter only — Mars/Earth/Neptune trojans negligible
export const KBO_COUNT = 240_000;            // §8.11 classical belt + scattered disk samples
export const COMET_COUNT = 4_600;            // §8.9 ~700 periodic + ~3,900 long-period

export const TOTAL_PROCEDURAL_BODIES =
  MAIN_BELT_COUNT + TROJAN_COUNT + KBO_COUNT + COMET_COUNT;

/**
 * Maximum particles the GPU instanced-point renderer materializes per frame.
 *
 * T44 lifts this from T39's 100 k to 1.2 M so the verify checklist's
 * "≥ 1,000,000 asteroids visible at Solar System scale" passes. Doc 18
 * §Performance budgets targets "Asteroid Instanced 0.3 ms / 100,000" —
 * 1.2 M at ~3.6 ms fits inside the Doc 27 §14 16.6 ms mid-tier frame
 * budget after the rest of the scene pays its costs. Low-tier GPU paths
 * clamp via `options.budget`.
 */
export const RENDERABLE_PARTICLE_BUDGET = 1_200_000;

/**
 * In-memory cap per population. T44 keeps each population's typed arrays
 * sized to the *full* census when practical (main-belt is the big one at
 * 1.05M ≈ 32 MB) so every procedural body can fly-to by NAIF id. The
 * rebuild is still lazy — we pay the build cost only when something
 * (renderer mount, search query) asks for the store.
 *
 * `proceduralBodyByNaif` resolves any id within the materialized window.
 */
const MATERIALIZED_PER_POPULATION = RENDERABLE_PARTICLE_BUDGET;

// ---------------------------------------------------------------------------
// Subtype table (T44, Doc 17 §Small Bodies)
// ---------------------------------------------------------------------------

/**
 * Doc 17 §Small Bodies enumerates 20 subtypes (ENT-4010..ENT-4060). The
 * GPU shader indexes this array directly via the per-particle subtype
 * byte, so ordering is load-bearing — keep the palette in sync with the
 * display-name table below.
 */
export const SMALL_BODY_SUBTYPES = [
  'c-type',
  's-type',
  'm-type',
  'v-type',
  'binary',
  'rubble-pile',
  'contact-binary',
  'comet-short-period',
  'comet-long-period',
  'comet-halley-type',
  'comet-interstellar',
  'dwarf-pluto',
  'dwarf-ceres',
  'dwarf-eris',
  'kbo-classical',
  'kbo-resonant',
  'kbo-scattered',
  'centaur',
  'trojan',
  'meteoroid-stream',
] as const;

export type SmallBodySubtype = (typeof SMALL_BODY_SUBTYPES)[number];
export const SUBTYPE_COUNT = SMALL_BODY_SUBTYPES.length;

/** ENT-ID per subtype — used by entityAdapter to stamp ent_id on a particle. */
export const SMALL_BODY_SUBTYPE_ENT_ID: Record<SmallBodySubtype, string> = {
  'c-type': 'ENT-4010',
  's-type': 'ENT-4011',
  'm-type': 'ENT-4012',
  'v-type': 'ENT-4013',
  'binary': 'ENT-4014',
  'rubble-pile': 'ENT-4015',
  'contact-binary': 'ENT-4016',
  'comet-short-period': 'ENT-4020',
  'comet-long-period': 'ENT-4021',
  'comet-halley-type': 'ENT-4022',
  'comet-interstellar': 'ENT-4023',
  'dwarf-pluto': 'ENT-4030',
  'dwarf-ceres': 'ENT-4031',
  'dwarf-eris': 'ENT-4032',
  'kbo-classical': 'ENT-4040',
  'kbo-resonant': 'ENT-4041',
  'kbo-scattered': 'ENT-4042',
  'centaur': 'ENT-4050',
  'trojan': 'ENT-4051',
  'meteoroid-stream': 'ENT-4060',
};

/** Human label per subtype — surfaces in InfoPanel "Type" row. */
export const SMALL_BODY_SUBTYPE_LABEL: Record<SmallBodySubtype, string> = {
  'c-type': 'C-type Asteroid (carbonaceous)',
  's-type': 'S-type Asteroid (silicaceous)',
  'm-type': 'M-type Asteroid (metallic)',
  'v-type': 'V-type Asteroid (basaltic)',
  'binary': 'Binary Asteroid',
  'rubble-pile': 'Rubble-pile Asteroid',
  'contact-binary': 'Contact-binary Asteroid',
  'comet-short-period': 'Short-period Comet',
  'comet-long-period': 'Long-period Comet',
  'comet-halley-type': 'Halley-type Comet',
  'comet-interstellar': 'Interstellar Object',
  'dwarf-pluto': 'Dwarf Planet (Pluto-type)',
  'dwarf-ceres': 'Dwarf Planet (Ceres-type)',
  'dwarf-eris': 'Dwarf Planet (Eris-type)',
  'kbo-classical': 'Classical KBO',
  'kbo-resonant': 'Resonant KBO (Plutino)',
  'kbo-scattered': 'Scattered Disk Object',
  'centaur': 'Centaur',
  'trojan': 'Jupiter Trojan',
  'meteoroid-stream': 'Meteoroid Stream',
};

/**
 * RGB hex per subtype — drives the 20-entry palette uniform in
 * {@link AsteroidFieldRenderer}. Values follow the Doc 17 §Small Bodies
 * albedo + composition descriptions: dark carbonaceous near-black,
 * silicaceous mid-tan, metallic bright grey, basaltic bright white, ices
 * toward pale cyan, red tholins for KBOs, amber for Trojans.
 */
export const SMALL_BODY_SUBTYPE_COLOR: Record<SmallBodySubtype, string> = {
  'c-type': '#2c2a34',            // very dark brown-grey
  's-type': '#a08866',            // tan-brown silicate
  'm-type': '#c0c0cf',            // bright metallic grey
  'v-type': '#d8d8e0',            // bright basalt
  'binary': '#9a8870',            // mixed pair
  'rubble-pile': '#4a4258',       // porous dark
  'contact-binary': '#7a6a5a',    // dual-lobe neutral
  'comet-short-period': '#bff7ff',// pale cyan (Jupiter family)
  'comet-long-period': '#d8eaff', // brighter cyan, long tail
  'comet-halley-type': '#a0e8ff', // retrograde comet cue
  'comet-interstellar': '#ff9066',// reddish 'Oumuamua-like
  'dwarf-pluto': '#e8d8c8',       // nitrogen-ice warm white
  'dwarf-ceres': '#5a5460',       // dark carbonaceous
  'dwarf-eris': '#f0fbff',        // methane-ice brilliant
  'kbo-classical': '#8b4513',     // red D-type
  'kbo-resonant': '#a0522d',      // plutino red
  'kbo-scattered': '#c08060',     // scattered mix
  'centaur': '#88645c',           // red-grey transitional
  'trojan': '#fbbf24',            // amber (keep T39 palette)
  'meteoroid-stream': '#f5deb3',  // wheat dust
};

// ---------------------------------------------------------------------------
// Element layout
// ---------------------------------------------------------------------------

/**
 * Tightly-packed orbital elements + colour for a single procedural body.
 * Stored across the typed arrays below by population index (within the
 * population) — see `mainBeltElements`, `trojanElements`, etc. for the
 * concrete arrays.
 */
export interface ProceduralBody {
  naifId: number;
  /** Semi-major axis (km). */
  a_km: number;
  /** Eccentricity. */
  e: number;
  /** Inclination (rad). */
  i_rad: number;
  /** Longitude of ascending node (rad). */
  Omega_rad: number;
  /** Argument of periapsis (rad). */
  omega_rad: number;
  /** Mean anomaly at J2000 (rad). */
  M0_rad: number;
  /** Mean motion (rad / sec, baked from period for the GPU shader). */
  n_rad_per_sec: number;
  /** Body kind tag — drives the renderer's per-particle colour. */
  kind: ProceduralBodyKind;
  /** Doc 17 §Small Bodies subtype (T44). Resolves ent_id + label. */
  subtype: SmallBodySubtype;
}

export type ProceduralBodyKind = 'main-belt' | 'trojan' | 'kbo' | 'comet';

// ---------------------------------------------------------------------------
// Population stores
// ---------------------------------------------------------------------------

/**
 * Six packed element rows + a per-body NAIF id row + T44 subtype byte. We
 * use separate arrays (rather than interleaved struct-of-arrays) so the
 * GPU vertex-buffer upload can stream one attribute at a time without
 * restriding.
 */
export interface PopulationStore {
  readonly count: number;
  readonly naifIds: Uint32Array;
  readonly a_km: Float32Array;
  readonly e: Float32Array;
  readonly i_rad: Float32Array;
  readonly Omega_rad: Float32Array;
  readonly omega_rad: Float32Array;
  readonly M0_rad: Float32Array;
  readonly n_rad_per_sec: Float32Array;
  /** Subtype index (0..SUBTYPE_COUNT-1), one byte per body. */
  readonly subtype: Uint8Array;
  readonly kind: ProceduralBodyKind;
}

// ---------------------------------------------------------------------------
// PRNG — Mulberry32 (matches starSeed.ts so tests remain deterministic)
// ---------------------------------------------------------------------------

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

const TWO_PI = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;

function subtypeIndex(subtype: SmallBodySubtype): number {
  return SMALL_BODY_SUBTYPES.indexOf(subtype);
}

/**
 * Build a population by sampling per-body elements + subtype from a
 * callback. The callback gets the index (0..count-1) and a thread-local
 * PRNG; it should return the six raw elements + subtype classification.
 */
function buildPopulation(
  kind: ProceduralBodyKind,
  count: number,
  naifIdBase: number,
  seed: number,
  sampler: (i: number, rng: () => number) => {
    a_km: number;
    e: number;
    i_deg: number;
    Omega_deg: number;
    omega_deg: number;
    M0_deg: number;
    periodDays: number;
    subtype: SmallBodySubtype;
  },
): PopulationStore {
  const naifIds = new Uint32Array(count);
  const a_km = new Float32Array(count);
  const e = new Float32Array(count);
  const i_rad = new Float32Array(count);
  const Omega_rad = new Float32Array(count);
  const omega_rad = new Float32Array(count);
  const M0_rad = new Float32Array(count);
  const n_rad_per_sec = new Float32Array(count);
  const subtype = new Uint8Array(count);

  const rng = mulberry32(seed);
  for (let idx = 0; idx < count; idx++) {
    const el = sampler(idx, rng);
    naifIds[idx] = naifIdBase + idx;
    a_km[idx] = el.a_km;
    e[idx] = el.e;
    i_rad[idx] = el.i_deg * DEG_TO_RAD;
    Omega_rad[idx] = el.Omega_deg * DEG_TO_RAD;
    omega_rad[idx] = el.omega_deg * DEG_TO_RAD;
    M0_rad[idx] = el.M0_deg * DEG_TO_RAD;
    n_rad_per_sec[idx] = TWO_PI / (el.periodDays * SECONDS_PER_DAY);
    subtype[idx] = subtypeIndex(el.subtype);
  }
  return {
    count, naifIds,
    a_km, e, i_rad, Omega_rad, omega_rad, M0_rad, n_rad_per_sec,
    subtype, kind,
  };
}

// ---------------------------------------------------------------------------
// Subtype samplers — Doc 17 §Small Bodies frequency tables
// ---------------------------------------------------------------------------

/**
 * Main-belt asteroid taxonomic classification. Doc 17 §4910 reports
 * C ≈ 75 %, §4967 S ≈ 17 %, §5025 M ≈ 8 %, §5085 V ≈ 0.3 %. The remainder
 * (~0.3 %) is taxonomically ambiguous; we fold those into the rubble-pile
 * and binary/contact-binary sub-classes since Doc 17 §5147, §5200, §5268
 * describe those populations as the dynamical byproducts of main-belt
 * collisional evolution.
 */
function sampleAsteroidSubtype(rng: () => number): SmallBodySubtype {
  const r = rng();
  if (r < 0.74) return 'c-type';            // 74 %
  if (r < 0.91) return 's-type';            // 17 %
  if (r < 0.99) return 'm-type';            // 8 %
  if (r < 0.992) return 'v-type';           // 0.2 %
  if (r < 0.996) return 'rubble-pile';      // 0.4 % (Bennu, Ryugu, Itokawa)
  if (r < 0.999) return 'binary';           // 0.3 %
  return 'contact-binary';                  // 0.1 % (Arrokoth-class)
}

/**
 * KBO sub-classification — Doc 17 §5850 (classical), §5917 (resonant),
 * §5982 (scattered). Frequency estimates from Doc 23 §8.11: classical
 * ≈ 65 %, resonant ≈ 25 %, scattered ≈ 10 % of the observed KBO
 * population. A small centaur fraction is folded into the KBO
 * population since their orbits overlap (Doc 17 §6053).
 */
function sampleKboSubtype(rng: () => number): SmallBodySubtype {
  const r = rng();
  if (r < 0.63) return 'kbo-classical';
  if (r < 0.87) return 'kbo-resonant';
  if (r < 0.97) return 'kbo-scattered';
  return 'centaur';
}

/**
 * Comet sub-classification — Doc 23 §8.9 splits Jupiter-family (~15 %),
 * Halley-type (~15 %), long-period (~70 %), plus a rare interstellar
 * fraction. Doc 17 §5568 (ENT-4023) calls out 'Oumuamua + Borisov.
 */
function sampleCometSubtype(r: number): SmallBodySubtype {
  if (r < 0.15) return 'comet-short-period';
  if (r < 0.30) return 'comet-halley-type';
  if (r < 0.999) return 'comet-long-period';
  return 'comet-interstellar';
}

// ---------------------------------------------------------------------------
// Population factories
// ---------------------------------------------------------------------------

/**
 * Main-belt asteroids — Doc 23 §8.7 sub-distributions. We split the belt
 * into inner / middle / outer + Hildas at 4:4:3:1 weights so the resulting
 * cloud reproduces the visible belt density profile when rendered.
 */
function buildMainBelt(): PopulationStore {
  const n = Math.min(MAIN_BELT_COUNT, MATERIALIZED_PER_POPULATION);
  return buildPopulation('main-belt', n, 3_000_000, 0xa5_7e_61_01, (i, rng) => {
    const r = i / n;
    let a_au: number;
    if (r < 0.36) a_au = 2.06 + rng() * 0.44;       // inner main belt 2.06–2.50
    else if (r < 0.74) a_au = 2.50 + rng() * 0.32;  // middle 2.50–2.82
    else if (r < 0.96) a_au = 2.82 + rng() * 0.45;  // outer 2.82–3.27
    else a_au = 3.95 + rng() * 0.10;                // Hildas at ~3.97 AU (3:2 with Jupiter)
    return {
      a_km: a_au * AU_KM,
      e: rng() * 0.30,
      i_deg: rng() * 25,
      Omega_deg: rng() * 360,
      omega_deg: rng() * 360,
      M0_deg: rng() * 360,
      periodDays: 365.25 * Math.pow(a_au, 1.5),
      subtype: sampleAsteroidSubtype(rng),
    };
  });
}

/**
 * Jupiter Trojans — clustered at L4 (60° ahead) and L5 (60° behind) with
 * libration up to ±15°. Same heliocentric distance as Jupiter (5.2 AU).
 * Every Trojan is classified as ENT-4051 per Doc 17 §6126.
 */
function buildTrojans(): PopulationStore {
  const JUPITER_LON_AT_J2000_DEG = 34.404;
  const n = Math.min(TROJAN_COUNT, MATERIALIZED_PER_POPULATION);
  return buildPopulation('trojan', n, 3_500_000, 0x54_52_4f_4a, (i, rng) => {
    const lagrangeLead = i % 2 === 0;
    const center = JUPITER_LON_AT_J2000_DEG + (lagrangeLead ? 60 : -60);
    const libration = (rng() - 0.5) * 30;
    return {
      a_km: 5.20 * AU_KM + (rng() - 0.5) * 0.15 * AU_KM,
      e: rng() * 0.15,
      i_deg: rng() * 30,
      Omega_deg: rng() * 360,
      omega_deg: rng() * 360,
      M0_deg: ((center + libration) % 360 + 360) % 360,
      periodDays: 365.25 * Math.pow(5.20, 1.5),
      subtype: 'trojan' as SmallBodySubtype,
    };
  });
}

/**
 * Kuiper-belt objects — classical belt 30–55 AU + scattered disk tail
 * extending to a few hundred AU. T44 tags each object with one of four
 * dynamical classes (classical / resonant / scattered / centaur).
 */
function buildKbos(): PopulationStore {
  const n = Math.min(KBO_COUNT, MATERIALIZED_PER_POPULATION);
  return buildPopulation('kbo', n, 4_000_000, 0x4b_42_4f_5a, (_i, rng) => {
    const scattered = rng() < 0.18;
    const a_au = scattered ? 55 + rng() * 245 : 30 + rng() * 25;
    const sub = sampleKboSubtype(rng);
    // Centaurs live *inside* Neptune — override semi-major axis to sit in
    // the Jupiter–Neptune transit zone (Doc 17 §6053, 5.5–30 AU).
    const finalA_au = sub === 'centaur' ? 5.5 + rng() * 24.5 : a_au;
    return {
      a_km: finalA_au * AU_KM,
      e: scattered ? rng() * 0.7 : rng() * 0.15,
      i_deg: scattered ? rng() * 40 : rng() * 15,
      Omega_deg: rng() * 360,
      omega_deg: rng() * 360,
      M0_deg: rng() * 360,
      periodDays: 365.25 * Math.pow(finalA_au, 1.5),
      subtype: sub,
    };
  });
}

/**
 * Comets — Jupiter-family + Halley + long-period mix per Doc 23 §8.9.
 * T44 tags each one as short-period / Halley-type / long-period /
 * interstellar so the gallery can colour them correctly.
 */
function buildComets(): PopulationStore {
  const n = Math.min(COMET_COUNT, MATERIALIZED_PER_POPULATION);
  return buildPopulation('comet', n, 4_500_000, 0x43_4f_4d_54, (i, rng) => {
    const r = i / n;
    let a_au: number, e: number, i_deg: number;
    if (r < 0.15) {                                 // Jupiter family ~700
      a_au = 3.0 + rng() * 4.0;
      e = 0.3 + rng() * 0.5;
      i_deg = rng() * 30;
    } else if (r < 0.30) {                          // Halley type ~700
      a_au = 15 + rng() * 25;
      e = 0.5 + rng() * 0.45;
      i_deg = rng() * 180;                          // can be retrograde
    } else {                                        // Long period ~3200
      a_au = 250 + rng() * 5_000;
      e = 0.85 + rng() * 0.149;
      i_deg = rng() * 180;
    }
    return {
      a_km: a_au * AU_KM,
      e,
      i_deg,
      Omega_deg: rng() * 360,
      omega_deg: rng() * 360,
      M0_deg: rng() * 360,
      periodDays: 365.25 * Math.pow(a_au, 1.5),
      subtype: sampleCometSubtype(r),
    };
  });
}

// ---------------------------------------------------------------------------
// Lazy-built singletons — we don't pay the build cost until something pulls
// them, so e.g. the gallery routes (which never need the asteroid field)
// stay cheap.
// ---------------------------------------------------------------------------

let _mainBelt: PopulationStore | null = null;
let _trojans: PopulationStore | null = null;
let _kbos: PopulationStore | null = null;
let _comets: PopulationStore | null = null;

export function getMainBeltPopulation(): PopulationStore {
  return (_mainBelt ??= buildMainBelt());
}
export function getTrojanPopulation(): PopulationStore {
  return (_trojans ??= buildTrojans());
}
export function getKboPopulation(): PopulationStore {
  return (_kbos ??= buildKbos());
}
export function getCometPopulation(): PopulationStore {
  return (_comets ??= buildComets());
}

/**
 * All four populations bundled — primarily used by tests and by the catalog
 * count helpers. Triggers eager build of every population, so prefer
 * `getMainBeltPopulation()` etc. when you only need one.
 */
export function getAllProceduralPopulations(): readonly PopulationStore[] {
  return [
    getMainBeltPopulation(),
    getTrojanPopulation(),
    getKboPopulation(),
    getCometPopulation(),
  ];
}

/** Reset the singletons — only used by tests that mutate them. */
export function _resetProceduralCachesForTests(): void {
  _mainBelt = null;
  _trojans = null;
  _kbos = null;
  _comets = null;
}

/**
 * Fetch a single body record by NAIF id — O(1) when the id falls inside one
 * of the procedural ranges, else `null`. Used by InfoPanel + search hits
 * to materialize a full {@link ProceduralBody} on demand.
 */
export function proceduralBodyByNaif(naifId: number): ProceduralBody | null {
  const populations: { base: number; store: PopulationStore }[] = [
    { base: 3_000_000, store: getMainBeltPopulation() },
    { base: 3_500_000, store: getTrojanPopulation() },
    { base: 4_000_000, store: getKboPopulation() },
    { base: 4_500_000, store: getCometPopulation() },
  ];
  for (const { base, store } of populations) {
    if (naifId >= base && naifId < base + store.count) {
      const idx = naifId - base;
      return {
        naifId,
        a_km: store.a_km[idx],
        e: store.e[idx],
        i_rad: store.i_rad[idx],
        Omega_rad: store.Omega_rad[idx],
        omega_rad: store.omega_rad[idx],
        M0_rad: store.M0_rad[idx],
        n_rad_per_sec: store.n_rad_per_sec[idx],
        kind: store.kind,
        subtype: SMALL_BODY_SUBTYPES[store.subtype[idx]] ?? 'c-type',
      };
    }
  }
  return null;
}
