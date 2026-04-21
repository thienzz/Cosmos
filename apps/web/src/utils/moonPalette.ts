/**
 * Cosmos Explorer — moon colour palette + params (T43).
 *
 * Doc 17 §3010..3024 defines 15 moon subtypes. Doc 18 §Moon Types supplies
 * the canonical shader hex codes + atmosphere/emission strengths. These
 * values drive the `MoonMaterial` factory.
 *
 * 15 subtypes are consolidated into 6 shader *families* — each family has
 * one fragment shader that branches on `#define MOON_*` defines, same
 * pattern as PlanetMaterial (planet-rocky / planet-gas / planet-extreme).
 *
 * Families:
 *   - rocky        (3): luna, callisto-ancient, irregular
 *   - volcanic     (2): io, tidal-heated-generic
 *   - icy          (4): europa, enceladus, ganymede-grooved, subsurface-ocean
 *   - atmospheric  (1): titan
 *   - extreme      (3): triton, miranda, hyperion
 *   - minor        (3): shepherd, trojan-moon, binary
 */

// ---------------------------------------------------------------------------
// Family + kind unions
// ---------------------------------------------------------------------------

export type MoonRockyKind = 'luna' | 'callisto' | 'irregular';
export type MoonVolcanicKind = 'io' | 'tidal-heated';
export type MoonIcyKind = 'europa' | 'enceladus' | 'ganymede' | 'subsurface-ocean';
export type MoonAtmosphericKind = 'titan';
export type MoonExtremeKind = 'triton' | 'miranda' | 'hyperion';
export type MoonMinorKind = 'shepherd' | 'trojan-moon' | 'binary';

export type MoonKind =
  | MoonRockyKind
  | MoonVolcanicKind
  | MoonIcyKind
  | MoonAtmosphericKind
  | MoonExtremeKind
  | MoonMinorKind;

export type MoonFamily =
  | 'rocky'
  | 'volcanic'
  | 'icy'
  | 'atmospheric'
  | 'extreme'
  | 'minor';

export const MOON_FAMILY: Record<MoonKind, MoonFamily> = {
  luna: 'rocky',
  callisto: 'rocky',
  irregular: 'rocky',
  io: 'volcanic',
  'tidal-heated': 'volcanic',
  europa: 'icy',
  enceladus: 'icy',
  ganymede: 'icy',
  'subsurface-ocean': 'icy',
  titan: 'atmospheric',
  triton: 'extreme',
  miranda: 'extreme',
  hyperion: 'extreme',
  shepherd: 'minor',
  'trojan-moon': 'minor',
  binary: 'minor',
};

/** Doc 17 ENT-ID for each kind — maps moon catalog to entity taxonomy. */
export const MOON_ENT_ID: Record<MoonKind, number> = {
  io: 3010,
  europa: 3011,
  titan: 3012,
  luna: 3013,
  irregular: 3014,
  enceladus: 3015,
  callisto: 3016,
  ganymede: 3017,
  triton: 3018,
  miranda: 3019,
  hyperion: 3020,
  shepherd: 3021,
  'trojan-moon': 3022,
  binary: 3023,
  'subsurface-ocean': 3024,
  'tidal-heated': 3010,
};

export const ALL_MOON_KINDS: readonly MoonKind[] = [
  'luna',
  'callisto',
  'irregular',
  'io',
  'tidal-heated',
  'europa',
  'enceladus',
  'ganymede',
  'subsurface-ocean',
  'titan',
  'triton',
  'miranda',
  'hyperion',
  'shepherd',
  'trojan-moon',
  'binary',
];

// ---------------------------------------------------------------------------
// Palette shape — superset; unused roles hold black.
// ---------------------------------------------------------------------------

export interface MoonPalette {
  /** Dominant equatorial surface colour. */
  baseColor: string;
  /** Bright highlight: highlands / dune crest / ray ejecta / cliff face. */
  highlightColor: string;
  /** Dark tint: mare / shadow / crack trough / cavity floor. */
  shadowColor: string;
  /** Pole / frost / ice-cap tint. */
  poleColor: string;
  /** Atmosphere / haze / exosphere rim-glow tint. */
  atmosphereTint: string;
  /** Lava / plume / geyser emissive / tholin / thermal tint. */
  emissiveColor: string;
}

export interface MoonParams {
  /** Doc 18 visual-radius baseline, in Earth radii (used by the gallery). */
  radius: number;
  /** Sidereal rotation speed (rad/sec) — synchronous orbit for most moons. */
  rotationRadPerSec: number;
  /** Doc 18 limb-darkening coefficient. */
  limbDarkening: number;
  /** Night-side floor. Rocky moons get near-zero; icy bodies a bit more. */
  ambientFloor: number;
  /** Atmospheric rim-glow intensity (0 for airless, high for Titan). */
  atmosphereStrength: number;
  /** Lava / plume / thermal self-emission strength (0..2). */
  emissiveStrength: number;
  /** Plume / geyser / volcanic-vent activity (0..1). Drives shader plume mask. */
  plumeIntensity: number;
  /** Crater density modulator. */
  craterIntensity: number;
  /** Polar cap half-extent in degrees of latitude. */
  polarCapExtentDeg: number;
  /** Cloud / haze coverage 0..1 (Titan only). */
  hazeCoverage: number;
  /** Specular highlight on ice / wet surface. */
  specularStrength: number;
  /** Cantaloupe / cliff / cavity terrain roughness amp. */
  terrainRoughness: number;
  /** Tholin / red-organic overlay strength (Triton). */
  tholinAmount: number;
}

// ---------------------------------------------------------------------------
// Palettes — Doc 18 §Moon Types + Doc 17 §3010..3024 scientific colours.
// ---------------------------------------------------------------------------

export const MOON_PALETTES: Record<MoonKind, MoonPalette> = {
  // ---- Rocky family ------------------------------------------------------
  // Luna (ENT-3013). Maria #2F4F4F dark basalt, highlands #D3D3D3 anorthosite,
  // ray material #FFFACD, earthshine tint #7AC4E8.
  luna: {
    baseColor: '#8a8a8a',      // regolith grey
    highlightColor: '#d3d3d3', // feldspathic highlands
    shadowColor: '#3c3c3c',    // maria basalt
    poleColor: '#e8eef2',      // permanent-shadow ice glint
    atmosphereTint: '#7ac4e8', // earthshine (faint blue scatter)
    emissiveColor: '#000000',
  },
  // Callisto-type (ENT-3016). Dark grey-brown with subtle ice speckles.
  callisto: {
    baseColor: '#4a4a52',
    highlightColor: '#b0b0c0', // Valhalla ejecta bright ice
    shadowColor: '#2a2a34',
    poleColor: '#5a5a66',
    atmosphereTint: '#000000',
    emissiveColor: '#000000',
  },
  // Phobos/Deimos captured (ENT-3014). Nearly black, Stickney-rim hint brighter.
  irregular: {
    baseColor: '#2e2e38',
    highlightColor: '#4a4a5a',
    shadowColor: '#141420',
    poleColor: '#2e2e38',
    atmosphereTint: '#000000',
    emissiveColor: '#000000',
  },
  // ---- Volcanic family ---------------------------------------------------
  // Io (ENT-3010). Sulfur allotropes: yellow #FFD700, orange #FFA500,
  // red #DC143C, black basalt #0a0a0a, white SO₂ frost #F5F5F5, lava #FF6347.
  io: {
    baseColor: '#e6c030',      // dominant sulfur yellow (dulled for ambient)
    highlightColor: '#ffd700', // fresh SO₂ yellow
    shadowColor: '#4a1a10',    // sulfur red / basalt blend
    poleColor: '#f5f5f5',      // SO₂ frost
    atmosphereTint: '#ff9933', // thermal haze
    emissiveColor: '#ff6347',  // molten lava tomato
  },
  // Tidal-heated generic (Io-analog for exomoons of other Jovians).
  'tidal-heated': {
    baseColor: '#d4a040',
    highlightColor: '#ffc25a',
    shadowColor: '#4a1f08',
    poleColor: '#e8d0b0',
    atmosphereTint: '#ff8a33',
    emissiveColor: '#ff5020',
  },
  // ---- Icy family --------------------------------------------------------
  // Europa (ENT-3011). Base ice #E8F5F7, lineae #8B4513 (rusty salts), chaos
  // edge slightly warmer white #F5FFFA.
  europa: {
    baseColor: '#e8f0f2',
    highlightColor: '#f5fffa', // cryovolcanic plain
    shadowColor: '#8b6b50',    // lineae salt/tholin (doc 22 crossref correction)
    poleColor: '#f8fcff',
    atmosphereTint: '#add8e6',
    emissiveColor: '#a5ddff',
  },
  // Enceladus (ENT-3015). Near-pure white ice, tiger-stripe tint #C0E0FF,
  // geyser plumes #ADD8E6 glow.
  enceladus: {
    baseColor: '#fafdff',
    highlightColor: '#ffffff',
    shadowColor: '#9ac8ee',    // tiger stripe blue
    poleColor: '#fffef0',      // south-pole fresh deposits
    atmosphereTint: '#cfe8ff',
    emissiveColor: '#b4dcff',  // plume glow
  },
  // Ganymede (ENT-3017). Grooved light grey #d0d0d0, dark terrain #5a5a6a,
  // polar ice #f0f8ff. Magnetic aurora tint violet.
  ganymede: {
    baseColor: '#aaaec0',
    highlightColor: '#d0d0d8',
    shadowColor: '#5a5a68',
    poleColor: '#eaf0ff',
    atmosphereTint: '#b890ff', // magnetic aurora glow
    emissiveColor: '#5a4aff',
  },
  // Subsurface-ocean generic (ENT-3024). Bluish-white ice, faint thermal vents.
  'subsurface-ocean': {
    baseColor: '#c0d8ee',
    highlightColor: '#e6eeff',
    shadowColor: '#5a6a88',
    poleColor: '#f0f6ff',
    atmosphereTint: '#a8c8ee',
    emissiveColor: '#4a78b0',
  },
  // ---- Atmospheric family ------------------------------------------------
  // Titan (ENT-3012). Haze orange #FF8C00 outer, mid #FF6347, limb #654321.
  // Surface base #8B7355; lakes #0a0a2e; dunes #4a3a2a; bright ice #FFFACD.
  titan: {
    baseColor: '#a87a3a',      // surface viewed through haze
    highlightColor: '#fff2b8', // ice highlands barely visible
    shadowColor: '#0a0a2e',    // methane lake dark
    poleColor: '#4a2a10',      // organic-settled polar band
    atmosphereTint: '#ff8c3a', // classic Titan orange
    emissiveColor: '#2a1a00',  // rare cryovolcanic glow hint
  },
  // ---- Extreme family ----------------------------------------------------
  // Triton (ENT-3018). Nitrogen ice #FFFEF0; cantaloupe ridge #E8E8D0;
  // tholins #CD853F; geyser dark fallout #f0e8d0.
  triton: {
    baseColor: '#f4efde',
    highlightColor: '#fffef0',
    shadowColor: '#cd853f',    // tholin red-brown
    poleColor: '#ffffff',
    atmosphereTint: '#e8d8b4', // thin N₂ haze
    emissiveColor: '#b8a268',  // geyser plume tint
  },
  // Miranda (ENT-3019). Icy-rocky #8a8a9a; cliff face #a0a0b0; trough shadow
  // #4a4a6a; crater ejecta #b0b0c0.
  miranda: {
    baseColor: '#8a8a9a',
    highlightColor: '#b0b0c0',
    shadowColor: '#38384a',
    poleColor: '#9a9aaa',
    atmosphereTint: '#000000',
    emissiveColor: '#000000',
  },
  // Hyperion (ENT-3020). Icy-rocky composite #6a6a7a; deep cavity near-black
  // #2a2a4a; boulder highlight #8a8a9a.
  hyperion: {
    baseColor: '#6a6a7a',
    highlightColor: '#8a8a9a',
    shadowColor: '#1a1a26',    // deep sponge cavity
    poleColor: '#6a6a7a',
    atmosphereTint: '#000000',
    emissiveColor: '#000000',
  },
  // ---- Minor family ------------------------------------------------------
  // Shepherd (ENT-3021). Dark #4a4a5a ring-polluted dust, crater rims #6a6a7a,
  // ejecta #7a7a8a.
  shepherd: {
    baseColor: '#4a4a5a',
    highlightColor: '#7a7a8a',
    shadowColor: '#2a2a38',
    poleColor: '#4a4a5a',
    atmosphereTint: '#000000',
    emissiveColor: '#000000',
  },
  // Trojan moon (ENT-3022). D-type dark #3a3a4a, same as main-belt trojans.
  'trojan-moon': {
    baseColor: '#3a3a4a',
    highlightColor: '#5a5a6a',
    shadowColor: '#1a1a26',
    poleColor: '#3a3a4a',
    atmosphereTint: '#000000',
    emissiveColor: '#000000',
  },
  // Binary (ENT-3023). Standard moon-type or ice-type per body; we use a
  // generic grey-brown with slight tidal-heating tint on facing hemisphere.
  binary: {
    baseColor: '#807a70',
    highlightColor: '#b0a898',
    shadowColor: '#3a3530',
    poleColor: '#6a6258',
    atmosphereTint: '#a87040',
    emissiveColor: '#a04810', // tidal heating emissive on facing hemisphere
  },
};

// ---------------------------------------------------------------------------
// Params — rotation + activity levels from Doc 17 orbital period tables.
// Earth-radii baseline, radians/sec, Doc 22 per-toggle magnitudes.
// ---------------------------------------------------------------------------

const hoursToRadPerSec = (h: number): number => (2 * Math.PI) / (h * 3600);
const daysToRadPerSec = (d: number): number => hoursToRadPerSec(d * 24);

export const MOON_PARAMS: Record<MoonKind, MoonParams> = {
  // ---- Rocky family ------------------------------------------------------
  luna: {
    radius: 0.27,
    rotationRadPerSec: daysToRadPerSec(27.322),
    limbDarkening: 0.35,
    ambientFloor: 0.05,
    atmosphereStrength: 0.02, // earthshine glow
    emissiveStrength: 0,
    plumeIntensity: 0,
    craterIntensity: 1.0,
    polarCapExtentDeg: 85,    // permanent-shadow ice only at extreme pole
    hazeCoverage: 0,
    specularStrength: 0.05,   // very slight basalt sheen
    terrainRoughness: 1.0,
    tholinAmount: 0,
  },
  callisto: {
    radius: 0.38,
    rotationRadPerSec: daysToRadPerSec(16.689),
    limbDarkening: 0.35,
    ambientFloor: 0.05,
    atmosphereStrength: 0,
    emissiveStrength: 0,
    plumeIntensity: 0,
    craterIntensity: 1.3,      // saturated surface
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0.08,
    terrainRoughness: 1.0,
    tholinAmount: 0,
  },
  irregular: {
    radius: 0.02,
    rotationRadPerSec: hoursToRadPerSec(7.66),
    limbDarkening: 0.5,
    ambientFloor: 0.04,
    atmosphereStrength: 0,
    emissiveStrength: 0,
    plumeIntensity: 0,
    craterIntensity: 1.5,      // Stickney-dominated
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0,
    terrainRoughness: 1.5,
    tholinAmount: 0,
  },
  // ---- Volcanic family ---------------------------------------------------
  io: {
    radius: 0.28,
    rotationRadPerSec: daysToRadPerSec(1.769),
    limbDarkening: 0.3,
    ambientFloor: 0.08,
    atmosphereStrength: 0.15,  // tenuous SO₂ exosphere
    emissiveStrength: 1.5,     // glowing lava lakes
    plumeIntensity: 1.0,       // 15-20 active plumes
    craterIntensity: 0,        // rapid resurfacing
    polarCapExtentDeg: 70,     // SO₂ frost near poles
    hazeCoverage: 0,
    specularStrength: 0.1,
    terrainRoughness: 0.8,
    tholinAmount: 0,
  },
  'tidal-heated': {
    radius: 0.3,
    rotationRadPerSec: daysToRadPerSec(2.5),
    limbDarkening: 0.3,
    ambientFloor: 0.07,
    atmosphereStrength: 0.1,
    emissiveStrength: 1.2,
    plumeIntensity: 0.75,
    craterIntensity: 0.1,
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0.1,
    terrainRoughness: 0.8,
    tholinAmount: 0,
  },
  // ---- Icy family --------------------------------------------------------
  europa: {
    radius: 0.25,
    rotationRadPerSec: daysToRadPerSec(3.551),
    limbDarkening: 0.25,
    ambientFloor: 0.1,
    atmosphereStrength: 0.05,
    emissiveStrength: 0.08,    // faint plume glow
    plumeIntensity: 0.3,
    craterIntensity: 0.05,     // very young surface
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0.6,     // high specularity on smooth ice
    terrainRoughness: 0.6,
    tholinAmount: 0,
  },
  enceladus: {
    radius: 0.04,
    rotationRadPerSec: daysToRadPerSec(1.370),
    limbDarkening: 0.2,
    ambientFloor: 0.14,        // albedo 0.99 → very bright even in shadow
    atmosphereStrength: 0.1,
    emissiveStrength: 0.25,
    plumeIntensity: 1.0,       // 100+ south-pole vents
    craterIntensity: 0.1,
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0.7,
    terrainRoughness: 0.5,
    tholinAmount: 0,
  },
  ganymede: {
    radius: 0.41,
    rotationRadPerSec: daysToRadPerSec(7.155),
    limbDarkening: 0.3,
    ambientFloor: 0.08,
    atmosphereStrength: 0.2,   // thin O₂ + magnetic aurora
    emissiveStrength: 0.4,     // polar aurora glow
    plumeIntensity: 0,
    craterIntensity: 0.4,
    polarCapExtentDeg: 65,
    hazeCoverage: 0,
    specularStrength: 0.25,
    terrainRoughness: 1.0,     // heavy groove normal variance
    tholinAmount: 0,
  },
  'subsurface-ocean': {
    radius: 0.3,
    rotationRadPerSec: daysToRadPerSec(5),
    limbDarkening: 0.28,
    ambientFloor: 0.1,
    atmosphereStrength: 0.04,
    emissiveStrength: 0.15,
    plumeIntensity: 0.4,
    craterIntensity: 0.2,
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0.45,
    terrainRoughness: 0.7,
    tholinAmount: 0,
  },
  // ---- Atmospheric family ------------------------------------------------
  titan: {
    radius: 0.4,
    rotationRadPerSec: daysToRadPerSec(15.945),
    limbDarkening: 0.4,
    ambientFloor: 0.08,
    atmosphereStrength: 1.4,   // thick N₂/CH₄ haze
    emissiveStrength: 0,
    plumeIntensity: 0.1,       // rare cryovolcanic
    craterIntensity: 0.05,
    polarCapExtentDeg: 60,     // methane lakes polar band
    hazeCoverage: 1.0,         // obscures surface
    specularStrength: 0.05,
    terrainRoughness: 0.7,
    tholinAmount: 0.1,
  },
  // ---- Extreme family ----------------------------------------------------
  triton: {
    radius: 0.21,
    rotationRadPerSec: -daysToRadPerSec(5.877), // retrograde
    limbDarkening: 0.3,
    ambientFloor: 0.12,        // albedo 0.76
    atmosphereStrength: 0.25,
    emissiveStrength: 0.1,
    plumeIntensity: 0.5,       // 8 confirmed N₂ geysers
    craterIntensity: 0.2,
    polarCapExtentDeg: 55,
    hazeCoverage: 0.15,
    specularStrength: 0.5,
    terrainRoughness: 1.2,     // cantaloupe hex ridges
    tholinAmount: 0.35,        // UV-processed organics
  },
  miranda: {
    radius: 0.037,
    rotationRadPerSec: daysToRadPerSec(1.413),
    limbDarkening: 0.3,
    ambientFloor: 0.05,
    atmosphereStrength: 0,
    emissiveStrength: 0,
    plumeIntensity: 0,
    craterIntensity: 0.6,
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0.15,
    terrainRoughness: 1.8,     // extreme cliff relief
    tholinAmount: 0,
  },
  hyperion: {
    radius: 0.028,
    rotationRadPerSec: hoursToRadPerSec(13.7),
    limbDarkening: 0.4,
    ambientFloor: 0.04,
    atmosphereStrength: 0,
    emissiveStrength: 0,
    plumeIntensity: 0,
    craterIntensity: 0.7,
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0.05,
    terrainRoughness: 2.2,     // sponge porosity
    tholinAmount: 0,
  },
  // ---- Minor family ------------------------------------------------------
  shepherd: {
    radius: 0.005,
    rotationRadPerSec: hoursToRadPerSec(10),
    limbDarkening: 0.4,
    ambientFloor: 0.04,
    atmosphereStrength: 0,
    emissiveStrength: 0,
    plumeIntensity: 0,
    craterIntensity: 1.3,
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0,
    terrainRoughness: 1.3,
    tholinAmount: 0,
  },
  'trojan-moon': {
    radius: 0.02,
    rotationRadPerSec: hoursToRadPerSec(14),
    limbDarkening: 0.45,
    ambientFloor: 0.03,
    atmosphereStrength: 0,
    emissiveStrength: 0,
    plumeIntensity: 0,
    craterIntensity: 1.1,
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0,
    terrainRoughness: 1.4,
    tholinAmount: 0.05,
  },
  binary: {
    radius: 0.15,
    rotationRadPerSec: daysToRadPerSec(6.387),
    limbDarkening: 0.35,
    ambientFloor: 0.06,
    atmosphereStrength: 0,
    emissiveStrength: 0.25,    // tidal heating glow on facing hemisphere
    plumeIntensity: 0,
    craterIntensity: 0.9,
    polarCapExtentDeg: 0,
    hazeCoverage: 0,
    specularStrength: 0.1,
    terrainRoughness: 1.0,
    tholinAmount: 0,
  },
};

// ---------------------------------------------------------------------------
// Family / kind helpers
// ---------------------------------------------------------------------------

export function familyOf(kind: MoonKind): MoonFamily {
  return MOON_FAMILY[kind];
}

export function isMoonRocky(kind: MoonKind): kind is MoonRockyKind {
  return MOON_FAMILY[kind] === 'rocky';
}

export function isMoonVolcanic(kind: MoonKind): kind is MoonVolcanicKind {
  return MOON_FAMILY[kind] === 'volcanic';
}

export function isMoonIcy(kind: MoonKind): kind is MoonIcyKind {
  return MOON_FAMILY[kind] === 'icy';
}

export function isMoonAtmospheric(kind: MoonKind): kind is MoonAtmosphericKind {
  return MOON_FAMILY[kind] === 'atmospheric';
}

export function isMoonExtreme(kind: MoonKind): kind is MoonExtremeKind {
  return MOON_FAMILY[kind] === 'extreme';
}

export function isMoonMinor(kind: MoonKind): kind is MoonMinorKind {
  return MOON_FAMILY[kind] === 'minor';
}

// ---------------------------------------------------------------------------
// Name → kind map — lets SolarSystemRenderer derive shader kind from the
// catalog's `body.name` without needing to enumerate every moon in the
// renderer. Only major + dwarf moons listed; everything else falls back
// to the 'luna' rocky generic.
// ---------------------------------------------------------------------------

export const MOON_NAME_TO_KIND: Record<string, MoonKind> = {
  // Earth
  Moon: 'luna',
  // Mars — irregular captured
  Phobos: 'irregular',
  Deimos: 'irregular',
  // Jupiter — Galilean
  Io: 'io',
  Europa: 'europa',
  Ganymede: 'ganymede',
  Callisto: 'callisto',
  // Saturn — Titan + icy + Enceladus + Hyperion
  Mimas: 'callisto',       // heavily cratered, similar surface type
  Enceladus: 'enceladus',
  Tethys: 'callisto',
  Dione: 'callisto',
  Rhea: 'callisto',
  Titan: 'titan',
  Hyperion: 'hyperion',
  Iapetus: 'callisto',     // two-toned but same surface family
  // Uranus — Miranda + 4 standard icy
  Miranda: 'miranda',
  Ariel: 'subsurface-ocean',
  Umbriel: 'callisto',     // dark cratered
  Titania: 'subsurface-ocean',
  Oberon: 'callisto',
  // Neptune
  Triton: 'triton',
  // Pluto
  Charon: 'binary',
};
