/**
 * Canonical Doc 18 + Doc 17 planet colour palette, feature magnitudes, and
 * ring geometry. Single source of truth for "what colour is Mars?" — the
 * PlanetMaterial factory pipes these values into the shader as uniforms,
 * and TS-VQA-002 asserts that each hex here stays within ΔE76 < 5.0 of the
 * Doc 18 reference.
 *
 * T42 expansion: covers all 27 planet subtypes per Doc 17:
 *   - 4 solar rocky  (mercury / venus / earth / mars)
 *   - 4 solar gas    (jupiter / saturn / uranus / neptune)
 *   - 10 exotic rocky (super-earth, magma, ocean, carbon, iron, desert,
 *                      rogue, protoplanet, water, chthonian)
 *   - 5 exotic gas   (hot-jupiter, mini-neptune, puffy, helium, circumbinary)
 *   - 4 extreme      (hycean, eyeball, tidally-heated, synestia)
 */

import { hexToRgb, type RGB } from './spectralColor';

// ---------------------------------------------------------------------------
// Kind unions
// ---------------------------------------------------------------------------

export type SolarRockyKind = 'mercury' | 'venus' | 'earth' | 'mars';
export type SolarGasKind = 'jupiter' | 'saturn' | 'uranus' | 'neptune';
export type ExoticRockyKind =
  | 'super-earth'
  | 'magma'
  | 'ocean'
  | 'carbon'
  | 'iron'
  | 'desert'
  | 'rogue'
  | 'protoplanet'
  | 'water'
  | 'chthonian';
export type ExoticGasKind =
  | 'hot-jupiter'
  | 'mini-neptune'
  | 'puffy'
  | 'helium'
  | 'circumbinary';
export type ExtremeKind = 'hycean' | 'eyeball' | 'tidally-heated' | 'synestia';

export type RockyPlanetKind = SolarRockyKind | ExoticRockyKind;
export type GasGiantKind = SolarGasKind | ExoticGasKind;
export type PlanetKind = RockyPlanetKind | GasGiantKind | ExtremeKind;

/** Doc 17 ENT-ID for each kind — maps planet catalog to entity taxonomy. */
export const PLANET_ENT_ID: Record<PlanetKind, number> = {
  mercury: 2010,
  venus: 2011,
  earth: 2012,
  mars: 2013,
  jupiter: 2020,
  saturn: 2021,
  uranus: 2025,
  neptune: 2026,
  'hot-jupiter': 2030,
  'super-earth': 2031,
  'mini-neptune': 2032,
  hycean: 2033,
  eyeball: 2034,
  magma: 2035,
  ocean: 2036,
  carbon: 2037,
  iron: 2038,
  desert: 2039,
  rogue: 2040,
  puffy: 2041,
  protoplanet: 2042,
  'tidally-heated': 2043,
  water: 2044,
  helium: 2045,
  circumbinary: 2046,
  synestia: 2047,
  chthonian: 2050,
};

// ---------------------------------------------------------------------------
// Rocky palette + params
// ---------------------------------------------------------------------------

export interface RockyPalette {
  baseColor: string;
  highlightColor: string;
  shadowColor: string;
  poleColor: string;
  atmosphereTint: string;
  cloudColor: string;
  /** Thermal IR / magma / rogue-heat / hydrothermal glow tint. */
  emissiveColor: string;
}

export interface RockyParams {
  /** Radius relative to Earth (Doc 17). */
  radius: number;
  cloudCoverage: number;
  cloudOpacity: number;
  atmosphereStrength: number;
  craterIntensity: number;
  polarCapExtentDeg: number;
  nightEmission: number;
  limbDarkening: number;
  ambientFloor: number;
  /** Magma/rogue/proto/water/chthonian self-emission strength (0–2). */
  emissiveStrength: number;
  /** Iron/carbon/ocean specular highlight (0–1). */
  specularStrength: number;
  /** 0 = no water, 1 = global ocean. Used by downstream LODs. */
  oceanLevel: number;
  /** Terrain crater-domain roughness modulator. */
  terrainRoughness: number;
  /** Rotation speed, radians / second. Negative = retrograde. */
  rotationRadPerSec: number;
}

// Convenience — many exotic bodies slow-rotate; one Earth day fallback.
const EARTH_DAY = 86400;
const hour = (h: number) => (2 * Math.PI) / (h * 3600);

export const ROCKY_PALETTES: Record<RockyPlanetKind, RockyPalette> = {
  mercury: {
    baseColor: '#8C8078',
    highlightColor: '#BFB2AD',
    shadowColor: '#73665E',
    poleColor: '#8C8078',
    atmosphereTint: '#998877',
    cloudColor: '#000000',
    emissiveColor: '#000000',
  },
  venus: {
    baseColor: '#775533',
    highlightColor: '#F2EBBF',
    shadowColor: '#553322',
    poleColor: '#E5DAB2',
    atmosphereTint: '#FF6633',
    cloudColor: '#F2EBBF',
    emissiveColor: '#000000',
  },
  earth: {
    baseColor: '#337340',
    highlightColor: '#D9BF80',
    shadowColor: '#006994',
    poleColor: '#F2F2FA',
    atmosphereTint: '#6699FF',
    cloudColor: '#F2F2F2',
    emissiveColor: '#000000',
  },
  mars: {
    baseColor: '#C1440E',
    highlightColor: '#D4874F',
    shadowColor: '#663311',
    poleColor: '#FFFACD',
    atmosphereTint: '#6666FF',
    cloudColor: '#C1440E',
    emissiveColor: '#000000',
  },
  // Super-Earth (ENT-2031): Earth-like biomes under thicker haze.
  'super-earth': {
    baseColor: '#4a8c3a',
    highlightColor: '#c8b894',
    shadowColor: '#1a5a7a',
    poleColor: '#e8f0ff',
    atmosphereTint: '#7aa8ff',
    cloudColor: '#e6ecef',
    emissiveColor: '#000000',
  },
  // Magma / Lava (ENT-2035) — Doc 18 § Lava/Magma. Crust #1A0D00, lava orange/yellow.
  magma: {
    baseColor: '#ff5a00', // bright lava
    highlightColor: '#ffea4c', // yellow-orange fresh lava
    shadowColor: '#1a0d00', // dark cooled crust
    poleColor: '#3a1a00',
    atmosphereTint: '#ff8a33',
    cloudColor: '#ff9933',
    emissiveColor: '#ffb366',
  },
  // Ocean World (ENT-2036) — Doc 18 § Ocean World. Deep blue, water vapor clouds.
  ocean: {
    baseColor: '#2a8fbf', // mid ocean
    highlightColor: '#5ac8d9', // wave crest
    shadowColor: '#0a3a5a', // deep ocean
    poleColor: '#f0f8ff', // ice caps (if far from star)
    atmosphereTint: '#a6e0ff',
    cloudColor: '#ffffff',
    emissiveColor: '#000000',
  },
  // Carbon / Diamond (ENT-2037) — Doc 18 § Carbon. Graphite #2F2F2F, diamond sparkles.
  carbon: {
    baseColor: '#2f2f2f',
    highlightColor: '#6a6a72',
    shadowColor: '#0c0c0c', // tar lakes
    poleColor: '#4a4a4a',
    atmosphereTint: '#ffaa00', // hydrocarbon haze
    cloudColor: '#7a5522',
    emissiveColor: '#000000',
  },
  // Iron (ENT-2038). Polished metal + rust.
  iron: {
    baseColor: '#808080', // polished iron
    highlightColor: '#a05a3a', // oxidized rust
    shadowColor: '#4a3020',
    poleColor: '#6b6b6b',
    atmosphereTint: '#a05a3a',
    cloudColor: '#000000',
    emissiveColor: '#000000',
  },
  // Desert (ENT-2039). Sahara-like dunes.
  desert: {
    baseColor: '#c8a06b',
    highlightColor: '#e5c68f',
    shadowColor: '#6b4a2a',
    poleColor: '#f0e6d2',
    atmosphereTint: '#d9a574',
    cloudColor: '#d9a574', // dust tint
    emissiveColor: '#000000',
  },
  // Rogue (ENT-2040). Nearly black; faint IR glow.
  rogue: {
    baseColor: '#1a1a22',
    highlightColor: '#2a2a35',
    shadowColor: '#050508',
    poleColor: '#3a4050', // frozen-volatile frost
    atmosphereTint: '#1a1a2a',
    cloudColor: '#000000',
    emissiveColor: '#4a0a00', // IR glow tint
  },
  // Protoplanet (ENT-2042). Crater-bombarded + molten impact zones.
  protoplanet: {
    baseColor: '#5a4a3a',
    highlightColor: '#ff5a00', // molten impact glow
    shadowColor: '#2a1a0a',
    poleColor: '#5a4a3a',
    atmosphereTint: '#8a5522', // dust envelope
    cloudColor: '#6b4a2a',
    emissiveColor: '#ff7a33',
  },
  // Water (ENT-2044). Deep-ocean high-pressure world.
  water: {
    baseColor: '#1a6a9a',
    highlightColor: '#3a9abf',
    shadowColor: '#0a2a5a',
    poleColor: '#f0f8ff',
    atmosphereTint: '#7aa8ff',
    cloudColor: '#ffffff',
    emissiveColor: '#1a3a5a', // hydrothermal vent tint
  },
  // Chthonian (ENT-2050). Silicate variant: dark rock + volcanic veins.
  chthonian: {
    baseColor: '#8b4513',
    highlightColor: '#ff6600',
    shadowColor: '#2a1a0a',
    poleColor: '#4a3a2a',
    atmosphereTint: '#ff9955',
    cloudColor: '#000000',
    emissiveColor: '#ff7a22',
  },
};

export const ROCKY_PARAMS: Record<RockyPlanetKind, RockyParams> = {
  mercury: {
    radius: 0.38,
    cloudCoverage: 0,
    cloudOpacity: 0,
    atmosphereStrength: 0,
    craterIntensity: 1.0,
    polarCapExtentDeg: 0,
    nightEmission: 0,
    limbDarkening: 0.4,
    ambientFloor: 0.02,
    emissiveStrength: 0,
    specularStrength: 0,
    oceanLevel: 0,
    terrainRoughness: 1,
    rotationRadPerSec: (2 * Math.PI) / (58.6 * EARTH_DAY),
  },
  venus: {
    radius: 0.95,
    cloudCoverage: 1.0,
    cloudOpacity: 0.98,
    atmosphereStrength: 1.3,
    craterIntensity: 0,
    polarCapExtentDeg: 0,
    nightEmission: 0,
    limbDarkening: 0.3,
    ambientFloor: 0.12,
    emissiveStrength: 0,
    specularStrength: 0,
    oceanLevel: 0,
    terrainRoughness: 1,
    rotationRadPerSec: -(2 * Math.PI) / (243 * EARTH_DAY),
  },
  earth: {
    radius: 1.0,
    cloudCoverage: 0.6,
    cloudOpacity: 0.55,
    atmosphereStrength: 0.9,
    craterIntensity: 0,
    polarCapExtentDeg: 70,
    nightEmission: 1.0,
    limbDarkening: 0.35,
    ambientFloor: 0.08,
    emissiveStrength: 0,
    specularStrength: 0.15,
    oceanLevel: 0.7,
    terrainRoughness: 1,
    rotationRadPerSec: hour(24),
  },
  mars: {
    radius: 0.53,
    cloudCoverage: 0.12,
    cloudOpacity: 0.2,
    atmosphereStrength: 0.3,
    craterIntensity: 0.35,
    polarCapExtentDeg: 60,
    nightEmission: 0,
    limbDarkening: 0.35,
    ambientFloor: 0.05,
    emissiveStrength: 0,
    specularStrength: 0,
    oceanLevel: 0,
    terrainRoughness: 1,
    rotationRadPerSec: hour(24.6),
  },
  'super-earth': {
    radius: 1.75,
    cloudCoverage: 0.85,
    cloudOpacity: 0.7,
    atmosphereStrength: 1.2,
    craterIntensity: 0,
    polarCapExtentDeg: 72,
    nightEmission: 0,
    limbDarkening: 0.4,
    ambientFloor: 0.12,
    emissiveStrength: 0,
    specularStrength: 0.12,
    oceanLevel: 0.6,
    terrainRoughness: 0.7,
    rotationRadPerSec: hour(28),
  },
  magma: {
    radius: 0.9,
    cloudCoverage: 0.1,
    cloudOpacity: 0.3,
    atmosphereStrength: 0.6,
    craterIntensity: 0,
    polarCapExtentDeg: 0,
    nightEmission: 0,
    limbDarkening: 0.2,
    ambientFloor: 0.08,
    emissiveStrength: 1.8,
    specularStrength: 0,
    oceanLevel: 0,
    terrainRoughness: 1.2,
    rotationRadPerSec: hour(18), // tidally locked — we still spin the gallery body
  },
  ocean: {
    radius: 1.05,
    cloudCoverage: 0.9,
    cloudOpacity: 0.75,
    atmosphereStrength: 1.0,
    craterIntensity: 0,
    polarCapExtentDeg: 75,
    nightEmission: 0,
    limbDarkening: 0.35,
    ambientFloor: 0.1,
    emissiveStrength: 0,
    specularStrength: 0.45,
    oceanLevel: 1.0,
    terrainRoughness: 1,
    rotationRadPerSec: hour(24),
  },
  carbon: {
    radius: 1.2,
    cloudCoverage: 0.4,
    cloudOpacity: 0.45,
    atmosphereStrength: 0.55,
    craterIntensity: 0,
    polarCapExtentDeg: 0,
    nightEmission: 0,
    limbDarkening: 0.3,
    ambientFloor: 0.06,
    emissiveStrength: 0,
    specularStrength: 0.55,
    oceanLevel: 0,
    terrainRoughness: 1,
    rotationRadPerSec: hour(30),
  },
  iron: {
    radius: 0.85,
    cloudCoverage: 0,
    cloudOpacity: 0,
    atmosphereStrength: 0.15,
    craterIntensity: 0.55,
    polarCapExtentDeg: 0,
    nightEmission: 0,
    limbDarkening: 0.3,
    ambientFloor: 0.04,
    emissiveStrength: 0,
    specularStrength: 0.6,
    oceanLevel: 0,
    terrainRoughness: 1,
    rotationRadPerSec: hour(26),
  },
  desert: {
    radius: 0.8,
    cloudCoverage: 0.12,
    cloudOpacity: 0.35, // dust-storm tint
    atmosphereStrength: 0.4,
    craterIntensity: 0.2,
    polarCapExtentDeg: 65,
    nightEmission: 0,
    limbDarkening: 0.35,
    ambientFloor: 0.08,
    emissiveStrength: 0,
    specularStrength: 0,
    oceanLevel: 0,
    terrainRoughness: 0.9,
    rotationRadPerSec: hour(22),
  },
  rogue: {
    radius: 1.1,
    cloudCoverage: 0,
    cloudOpacity: 0,
    atmosphereStrength: 0.08,
    craterIntensity: 0,
    polarCapExtentDeg: 55,
    nightEmission: 0,
    limbDarkening: 0.45,
    ambientFloor: 0.02,
    emissiveStrength: 0.25,
    specularStrength: 0,
    oceanLevel: 0,
    terrainRoughness: 1,
    rotationRadPerSec: hour(40),
  },
  protoplanet: {
    radius: 0.65,
    cloudCoverage: 0.3,
    cloudOpacity: 0.4,
    atmosphereStrength: 0.6,
    craterIntensity: 1.3,
    polarCapExtentDeg: 0,
    nightEmission: 0,
    limbDarkening: 0.25,
    ambientFloor: 0.1,
    emissiveStrength: 1.4,
    specularStrength: 0,
    oceanLevel: 0,
    terrainRoughness: 1.1,
    rotationRadPerSec: hour(12),
  },
  water: {
    radius: 1.6,
    cloudCoverage: 0.75,
    cloudOpacity: 0.65,
    atmosphereStrength: 0.8,
    craterIntensity: 0,
    polarCapExtentDeg: 80,
    nightEmission: 0,
    limbDarkening: 0.35,
    ambientFloor: 0.09,
    emissiveStrength: 0.8,
    specularStrength: 0.45,
    oceanLevel: 1.0,
    terrainRoughness: 1,
    rotationRadPerSec: hour(30),
  },
  chthonian: {
    radius: 0.75,
    cloudCoverage: 0.15,
    cloudOpacity: 0.25,
    atmosphereStrength: 0.6,
    craterIntensity: 0.4,
    polarCapExtentDeg: 0,
    nightEmission: 0,
    limbDarkening: 0.25,
    ambientFloor: 0.1,
    emissiveStrength: 1.5,
    specularStrength: 0.2,
    oceanLevel: 0,
    terrainRoughness: 1.1,
    rotationRadPerSec: hour(8), // stripped hot Jupiter → tidally locked, fast rotation
  },
};

// ---------------------------------------------------------------------------
// Gas palette + params
// ---------------------------------------------------------------------------

export interface GasPalette {
  zoneColor: string;
  beltColor: string;
  poleColor: string;
  spotColor: string;
  atmosphereTint: string;
  /** Hot-Jupiter dayside thermal tint; unused elsewhere. */
  thermalColor: string;
}

export interface GasParams {
  radius: number;
  bandCount: number;
  bandIntensity: number;
  spotLatDeg: number;
  spotSize: number;
  spotIntensity: number;
  turbulence: number;
  hexagonStrength: number;
  atmosphereStrength: number;
  limbDarkening: number;
  ambientFloor: number;
  /** Thick-haze opacity for mini-Neptune/Puffy. 0 for clear Jovians. */
  hazeDensity: number;
  /** Puffy outer-glow expansion factor. 0 for normal gas giants. */
  puffyExpansion: number;
  /** Hot-Jupiter incandescence intensity. 0 for cold gas giants. */
  thermalIntensity: number;
  /** Circumbinary secondary-sun mix (0..1). */
  secondarySunMix: number;
  rotationRadPerSec: number;
}

export const GAS_PALETTES: Record<GasGiantKind, GasPalette> = {
  jupiter: {
    zoneColor: '#EDD9A6',
    beltColor: '#8C6633',
    poleColor: '#B8A37F',
    spotColor: '#B22222',
    atmosphereTint: '#E8D9A0',
    thermalColor: '#000000',
  },
  saturn: {
    zoneColor: '#EFEDBF',
    beltColor: '#D9CF99',
    poleColor: '#C9B982',
    spotColor: '#F0E68C',
    atmosphereTint: '#F5ECC0',
    thermalColor: '#000000',
  },
  uranus: {
    zoneColor: '#AFEEEE',
    beltColor: '#87CEEB',
    poleColor: '#7FBFFF',
    spotColor: '#87CEEB',
    atmosphereTint: '#B8F0F0',
    thermalColor: '#000000',
  },
  neptune: {
    zoneColor: '#4169E1',
    beltColor: '#0000CD',
    poleColor: '#000080',
    spotColor: '#1F3F5F',
    atmosphereTint: '#4F6FE5',
    thermalColor: '#000000',
  },
  // Hot Jupiter (ENT-2030) — tidally locked; day-side #FFFFCC incandescent.
  'hot-jupiter': {
    zoneColor: '#ffd88a',
    beltColor: '#ba6b22',
    poleColor: '#8a3a11',
    spotColor: '#2a0a00',
    atmosphereTint: '#ffcc55',
    thermalColor: '#ffffcc',
  },
  // Mini-Neptune (ENT-2032). Haze-dominated, muted banding.
  'mini-neptune': {
    zoneColor: '#7ab0c0',
    beltColor: '#5a8aa5',
    poleColor: '#3a6080',
    spotColor: '#2a4a60',
    atmosphereTint: '#aad0e0',
    thermalColor: '#000000',
  },
  // Puffy (ENT-2041). Ultra-low density, diffuse soft edges.
  puffy: {
    zoneColor: '#d8a87a',
    beltColor: '#a07040',
    poleColor: '#6b4a22',
    spotColor: '#8a5533',
    atmosphereTint: '#ffd0a0',
    thermalColor: '#000000',
  },
  // Helium (ENT-2045). Pale gray-blue, nearly featureless.
  helium: {
    zoneColor: '#c8d0d8',
    beltColor: '#a0a8b0',
    poleColor: '#808890',
    spotColor: '#b0b8c0',
    atmosphereTint: '#c8d8e8',
    thermalColor: '#000000',
  },
  // Circumbinary (ENT-2046). Jovian colors, double shadowing — palette is
  // shared with jupiter; the distinguishing feature is dual sunDir lighting.
  circumbinary: {
    zoneColor: '#EDD9A6',
    beltColor: '#8C6633',
    poleColor: '#B8A37F',
    spotColor: '#B22222',
    atmosphereTint: '#E8D9A0',
    thermalColor: '#000000',
  },
};

export const GAS_PARAMS: Record<GasGiantKind, GasParams> = {
  jupiter: {
    radius: 11.2,
    bandCount: 6,
    bandIntensity: 1.0,
    spotLatDeg: -22,
    spotSize: 0.25,
    spotIntensity: 0.85,
    turbulence: 0.35,
    hexagonStrength: 0,
    atmosphereStrength: 0.4,
    limbDarkening: 0.25,
    ambientFloor: 0.1,
    hazeDensity: 0,
    puffyExpansion: 0,
    thermalIntensity: 0,
    secondarySunMix: 0,
    rotationRadPerSec: hour(9.9),
  },
  saturn: {
    radius: 9.4,
    bandCount: 3,
    bandIntensity: 0.5,
    spotLatDeg: 0,
    spotSize: 0,
    spotIntensity: 0,
    turbulence: 0.2,
    hexagonStrength: 0.6,
    atmosphereStrength: 0.45,
    limbDarkening: 0.25,
    ambientFloor: 0.1,
    hazeDensity: 0,
    puffyExpansion: 0,
    thermalIntensity: 0,
    secondarySunMix: 0,
    rotationRadPerSec: hour(10.7),
  },
  uranus: {
    radius: 4.0,
    bandCount: 1,
    bandIntensity: 0.05,
    spotLatDeg: 0,
    spotSize: 0,
    spotIntensity: 0,
    turbulence: 0.05,
    hexagonStrength: 0,
    atmosphereStrength: 0.5,
    limbDarkening: 0.3,
    ambientFloor: 0.12,
    hazeDensity: 0,
    puffyExpansion: 0,
    thermalIntensity: 0,
    secondarySunMix: 0,
    rotationRadPerSec: hour(17),
  },
  neptune: {
    radius: 3.9,
    bandCount: 2,
    bandIntensity: 0.3,
    spotLatDeg: -20,
    spotSize: 0.2,
    spotIntensity: 0.6,
    turbulence: 0.3,
    hexagonStrength: 0,
    atmosphereStrength: 0.5,
    limbDarkening: 0.3,
    ambientFloor: 0.1,
    hazeDensity: 0,
    puffyExpansion: 0,
    thermalIntensity: 0,
    secondarySunMix: 0,
    rotationRadPerSec: hour(16),
  },
  'hot-jupiter': {
    radius: 14.0, // inflated 1-2 R_J (we pick upper end of typical radii)
    bandCount: 4,
    bandIntensity: 0.4,
    spotLatDeg: 0,
    spotSize: 0,
    spotIntensity: 0,
    turbulence: 0.5,
    hexagonStrength: 0,
    atmosphereStrength: 0.7,
    limbDarkening: 0.15,
    ambientFloor: 0.25, // hot night side has meaningful residual glow
    hazeDensity: 0,
    puffyExpansion: 0,
    thermalIntensity: 1.2,
    secondarySunMix: 0,
    rotationRadPerSec: hour(4), // very short period → fast gallery spin
  },
  'mini-neptune': {
    radius: 2.6, // ~2.5 R⊕
    bandCount: 2,
    bandIntensity: 0.25,
    spotLatDeg: 0,
    spotSize: 0,
    spotIntensity: 0,
    turbulence: 0.15,
    hexagonStrength: 0,
    atmosphereStrength: 0.55,
    limbDarkening: 0.3,
    ambientFloor: 0.12,
    hazeDensity: 0.45,
    puffyExpansion: 0,
    thermalIntensity: 0,
    secondarySunMix: 0,
    rotationRadPerSec: hour(20),
  },
  puffy: {
    radius: 12.0,
    bandCount: 3,
    bandIntensity: 0.25,
    spotLatDeg: 0,
    spotSize: 0,
    spotIntensity: 0,
    turbulence: 0.2,
    hexagonStrength: 0,
    atmosphereStrength: 0.7,
    limbDarkening: 0.2,
    ambientFloor: 0.15,
    hazeDensity: 0.35,
    puffyExpansion: 0.7,
    thermalIntensity: 0,
    secondarySunMix: 0,
    rotationRadPerSec: hour(14),
  },
  helium: {
    radius: 3.2,
    bandCount: 1,
    bandIntensity: 0.05,
    spotLatDeg: 0,
    spotSize: 0,
    spotIntensity: 0,
    turbulence: 0.03,
    hexagonStrength: 0,
    atmosphereStrength: 0.55,
    limbDarkening: 0.3,
    ambientFloor: 0.15,
    hazeDensity: 0.2,
    puffyExpansion: 0.2,
    thermalIntensity: 0,
    secondarySunMix: 0,
    rotationRadPerSec: hour(22),
  },
  circumbinary: {
    radius: 10.5,
    bandCount: 5,
    bandIntensity: 0.9,
    spotLatDeg: -15,
    spotSize: 0.2,
    spotIntensity: 0.6,
    turbulence: 0.32,
    hexagonStrength: 0,
    atmosphereStrength: 0.4,
    limbDarkening: 0.25,
    ambientFloor: 0.1,
    hazeDensity: 0,
    puffyExpansion: 0,
    thermalIntensity: 0,
    secondarySunMix: 1.0,
    rotationRadPerSec: hour(11),
  },
};

// ---------------------------------------------------------------------------
// Extreme palette + params
// ---------------------------------------------------------------------------

export interface ExtremePalette {
  baseColor: string;
  highlightColor: string;
  shadowColor: string;
  poleColor: string;
  atmosphereTint: string;
  /** Hotspot / substellar / plume / dust-ring tint. */
  hotspotColor: string;
}

export interface ExtremeParams {
  radius: number;
  atmosphereStrength: number;
  /** Hycean thick H₂ haze. */
  hazeDensity: number;
  emissiveStrength: number;
  /** Eyeball terminator-ring width in degrees. */
  terminatorWidthDeg: number;
  /** Io-type plume rim intensity. */
  plumeIntensity: number;
  /** Synestia outer dust density. */
  ringDustDensity: number;
  limbDarkening: number;
  ambientFloor: number;
  rotationRadPerSec: number;
}

export const EXTREME_PALETTES: Record<ExtremeKind, ExtremePalette> = {
  // Hycean (ENT-2033) — deep ocean beneath H₂ atmosphere.
  hycean: {
    baseColor: '#2a6a9a',
    highlightColor: '#5a9ac0',
    shadowColor: '#0a2a4a',
    poleColor: '#d8e8f8',
    atmosphereTint: '#88a8c8', // pale H₂ haze
    hotspotColor: '#000000',
  },
  // Eyeball (ENT-2034) — frozen night, red substellar pupil, habitable ring.
  eyeball: {
    baseColor: '#337340', // habitable ring (blue+green biomes)
    highlightColor: '#c14a1a', // substellar hot red
    shadowColor: '#1a3a5a',
    poleColor: '#add8e6', // frozen nightside
    atmosphereTint: '#ffc080',
    hotspotColor: '#ff5a00',
  },
  // Tidally-heated Io-type (ENT-2043) — sulfur palette.
  'tidally-heated': {
    baseColor: '#ffd400', // yellow sulfur
    highlightColor: '#ffa500', // orange sulfur
    shadowColor: '#8b2500', // red sulfur
    poleColor: '#fafafa',
    atmosphereTint: '#ff9933',
    hotspotColor: '#ff3300',
  },
  // Synestia (ENT-2047) — post-impact debris disk.
  synestia: {
    baseColor: '#ff7a33',
    highlightColor: '#ffd080',
    shadowColor: '#4a1a00',
    poleColor: '#2a0a00',
    atmosphereTint: '#ffaa55',
    hotspotColor: '#ffd080',
  },
};

export const EXTREME_PARAMS: Record<ExtremeKind, ExtremeParams> = {
  hycean: {
    radius: 2.2,
    atmosphereStrength: 1.3,
    hazeDensity: 0.6,
    emissiveStrength: 0,
    terminatorWidthDeg: 0,
    plumeIntensity: 0,
    ringDustDensity: 0,
    limbDarkening: 0.35,
    ambientFloor: 0.12,
    rotationRadPerSec: hour(30),
  },
  eyeball: {
    radius: 1.1,
    atmosphereStrength: 0.7,
    hazeDensity: 0.25,
    emissiveStrength: 0.8,
    terminatorWidthDeg: 23,
    plumeIntensity: 0,
    ringDustDensity: 0,
    limbDarkening: 0.3,
    ambientFloor: 0.04, // near-zero lit floor — hemispheres are sharp
    rotationRadPerSec: hour(36), // tidally locked, slow "apparent" motion
  },
  'tidally-heated': {
    radius: 0.3, // Io-scale
    atmosphereStrength: 0.3,
    hazeDensity: 0,
    emissiveStrength: 1.2,
    terminatorWidthDeg: 0,
    plumeIntensity: 0.7,
    ringDustDensity: 0,
    limbDarkening: 0.3,
    ambientFloor: 0.06,
    rotationRadPerSec: hour(42),
  },
  synestia: {
    radius: 2.5,
    atmosphereStrength: 1.0,
    hazeDensity: 0.5,
    emissiveStrength: 1.6,
    terminatorWidthDeg: 0,
    plumeIntensity: 0,
    ringDustDensity: 0.9,
    limbDarkening: 0.15,
    ambientFloor: 0.2,
    rotationRadPerSec: hour(5), // rapidly spinning post-impact debris
  },
};

// ---------------------------------------------------------------------------
// Saturn rings — §Saturn Ring System (unchanged from T13)
// ---------------------------------------------------------------------------

const SATURN_RADIUS_KM = 60_268;
function auToRadii(km: number): number {
  return km / SATURN_RADIUS_KM;
}

export interface RingGeometry {
  innerC: number;
  outerC: number;
  innerB: number;
  outerB: number;
  innerA: number;
  outerA: number;
  enckeGapCenter: number;
  enckeGapWidth: number;
}

export const SATURN_RING_GEOMETRY: RingGeometry = {
  innerC: auToRadii(74_500),
  outerC: auToRadii(92_000),
  innerB: auToRadii(92_000),
  outerB: auToRadii(117_500),
  innerA: auToRadii(122_500),
  outerA: auToRadii(137_100),
  enckeGapCenter: auToRadii(133_700),
  enckeGapWidth: auToRadii(325),
};

export interface RingPalette {
  colorC: string;
  colorB: string;
  colorA: string;
}

export const SATURN_RING_PALETTE: RingPalette = {
  colorC: '#F0F0E0',
  colorB: '#FFFFDD',
  colorA: '#D4D4B8',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SOLAR_ROCKY: ReadonlySet<RockyPlanetKind> = new Set([
  'mercury',
  'venus',
  'earth',
  'mars',
]);
const SOLAR_GAS: ReadonlySet<GasGiantKind> = new Set([
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
]);
const EXOTIC_ROCKY: ReadonlySet<RockyPlanetKind> = new Set([
  'super-earth',
  'magma',
  'ocean',
  'carbon',
  'iron',
  'desert',
  'rogue',
  'protoplanet',
  'water',
  'chthonian',
]);
const EXOTIC_GAS: ReadonlySet<GasGiantKind> = new Set([
  'hot-jupiter',
  'mini-neptune',
  'puffy',
  'helium',
  'circumbinary',
]);
const EXTREME: ReadonlySet<ExtremeKind> = new Set([
  'hycean',
  'eyeball',
  'tidally-heated',
  'synestia',
]);

export function isRockyPlanet(k: PlanetKind): k is RockyPlanetKind {
  return SOLAR_ROCKY.has(k as RockyPlanetKind) || EXOTIC_ROCKY.has(k as RockyPlanetKind);
}
export function isGasGiant(k: PlanetKind): k is GasGiantKind {
  return SOLAR_GAS.has(k as GasGiantKind) || EXOTIC_GAS.has(k as GasGiantKind);
}
export function isExtremePlanet(k: PlanetKind): k is ExtremeKind {
  return EXTREME.has(k as ExtremeKind);
}
export function isSolarPlanet(k: PlanetKind): boolean {
  return (
    SOLAR_ROCKY.has(k as RockyPlanetKind) || SOLAR_GAS.has(k as GasGiantKind)
  );
}

/** Every ENT-ID covered by a PlanetKind (used by coverage test). */
export const ALL_PLANET_KINDS: PlanetKind[] = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'super-earth',
  'magma',
  'ocean',
  'carbon',
  'iron',
  'desert',
  'rogue',
  'protoplanet',
  'water',
  'chthonian',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'hot-jupiter',
  'mini-neptune',
  'puffy',
  'helium',
  'circumbinary',
  'hycean',
  'eyeball',
  'tidally-heated',
  'synestia',
];

export function rockyPaletteRgb(kind: RockyPlanetKind): {
  baseColor: RGB;
  highlightColor: RGB;
  shadowColor: RGB;
  poleColor: RGB;
  atmosphereTint: RGB;
  cloudColor: RGB;
  emissiveColor: RGB;
} {
  const p = ROCKY_PALETTES[kind];
  return {
    baseColor: hexToRgb(p.baseColor),
    highlightColor: hexToRgb(p.highlightColor),
    shadowColor: hexToRgb(p.shadowColor),
    poleColor: hexToRgb(p.poleColor),
    atmosphereTint: hexToRgb(p.atmosphereTint),
    cloudColor: hexToRgb(p.cloudColor),
    emissiveColor: hexToRgb(p.emissiveColor),
  };
}

export function gasPaletteRgb(kind: GasGiantKind): {
  zoneColor: RGB;
  beltColor: RGB;
  poleColor: RGB;
  spotColor: RGB;
  atmosphereTint: RGB;
  thermalColor: RGB;
} {
  const p = GAS_PALETTES[kind];
  return {
    zoneColor: hexToRgb(p.zoneColor),
    beltColor: hexToRgb(p.beltColor),
    poleColor: hexToRgb(p.poleColor),
    spotColor: hexToRgb(p.spotColor),
    atmosphereTint: hexToRgb(p.atmosphereTint),
    thermalColor: hexToRgb(p.thermalColor),
  };
}

export function extremePaletteRgb(kind: ExtremeKind): {
  baseColor: RGB;
  highlightColor: RGB;
  shadowColor: RGB;
  poleColor: RGB;
  atmosphereTint: RGB;
  hotspotColor: RGB;
} {
  const p = EXTREME_PALETTES[kind];
  return {
    baseColor: hexToRgb(p.baseColor),
    highlightColor: hexToRgb(p.highlightColor),
    shadowColor: hexToRgb(p.shadowColor),
    poleColor: hexToRgb(p.poleColor),
    atmosphereTint: hexToRgb(p.atmosphereTint),
    hotspotColor: hexToRgb(p.hotspotColor),
  };
}
