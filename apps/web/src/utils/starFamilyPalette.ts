/**
 * Canonical Doc 17 / Doc 18 star family colour palettes + per-kind parameters.
 *
 * T41 consolidates 31 Doc 17 star subtypes (ENT-1010..1040, minus ENT-1032
 * already shipped by T28 exotic-blackhole) into 4 surface-sphere shader
 * families:
 *   - Main sequence    (ENT-1010..1019, 1021)  → `star-mainseq.frag`
 *   - Evolved          (ENT-1020, 1022..1029, 1040) → `star-evolved.frag`
 *   - Remnant          (ENT-1030, 1031)        → `star-remnant.frag`
 *   - Variable         (ENT-1033..1039)        → `star-variable.frag`
 *
 * Doc references cited per-entry. All palette hex values come from
 * Doc 17 §ENT-NNNN "Shader & Animation Specifications" → "Color palette"
 * or Doc 18 §"Star Rendering" / §"Stellar Evolution Classes".
 *
 * Feature parameters (granulation octaves, limb darkening, flare rate,
 * pulsation period) come from Doc 18 numeric specs; where Doc 17 gives a
 * range we pick the mid-point for the template.
 */

import { hexToRgb, type RGB } from './spectralColor';

// ---------------------------------------------------------------------------
// Kind unions
// ---------------------------------------------------------------------------

/**
 * O/B/A/F/G/K/M classical MK classes + brown-dwarf extensions (L/T/Y) +
 * `MS` = "main sequence, class unknown" (ENT-1021 general bucket).
 */
export type MainSeqKind =
  | 'O'
  | 'B'
  | 'A'
  | 'F'
  | 'G'
  | 'K'
  | 'M'
  | 'L'
  | 'T'
  | 'Y'
  | 'MS';

export type EvolvedKind =
  | 'protostar'
  | 'subgiant'
  | 'redgiant'
  | 'bluesupergiant'
  | 'agb'
  | 'horizontalbranch'
  | 'wolfrayet'
  | 'lbv'
  | 'carbon'
  | 'hypergiant';

export type RemnantKind = 'whitedwarf' | 'neutronstar';

export type VariableKind =
  | 'cepheid'
  | 'rrlyrae'
  | 'mira'
  | 'eclipsing'
  | 'cataclysmic'
  | 'symbiotic'
  | 'bluestraggler';

export type StarFamilyKind = MainSeqKind | EvolvedKind | RemnantKind | VariableKind;

export const MAINSEQ_KINDS: MainSeqKind[] = [
  'O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y', 'MS',
];
export const EVOLVED_KINDS: EvolvedKind[] = [
  'protostar',
  'subgiant',
  'redgiant',
  'bluesupergiant',
  'agb',
  'horizontalbranch',
  'wolfrayet',
  'lbv',
  'carbon',
  'hypergiant',
];
export const REMNANT_KINDS: RemnantKind[] = ['whitedwarf', 'neutronstar'];
export const VARIABLE_KINDS: VariableKind[] = [
  'cepheid',
  'rrlyrae',
  'mira',
  'eclipsing',
  'cataclysmic',
  'symbiotic',
  'bluestraggler',
];

export const STAR_FAMILY_KINDS: StarFamilyKind[] = [
  ...MAINSEQ_KINDS,
  ...EVOLVED_KINDS,
  ...REMNANT_KINDS,
  ...VARIABLE_KINDS,
];

export function isStarFamilyKind(value: string): value is StarFamilyKind {
  return (STAR_FAMILY_KINDS as string[]).includes(value);
}

export function starFamilyOfKind(
  kind: StarFamilyKind,
): 'mainseq' | 'evolved' | 'remnant' | 'variable' {
  if ((MAINSEQ_KINDS as string[]).includes(kind)) return 'mainseq';
  if ((EVOLVED_KINDS as string[]).includes(kind)) return 'evolved';
  if ((REMNANT_KINDS as string[]).includes(kind)) return 'remnant';
  return 'variable';
}

// ===========================================================================
// Main sequence (ENT-1010..1019, 1021)
// ===========================================================================

export interface MainSeqPalette {
  /** Deep core hue — dominant visible colour. */
  coreColor: string;
  /** Outer corona / halo hue. */
  haloColor: string;
  /** Sunspot / darkened-region tint. */
  spotColor: string;
  /** Chromospheric / flare / bright rim tint. */
  chromosphereColor: string;
  /** Limb (cooler edge) tint. */
  limbColor: string;
}

/**
 * MAINSEQ palettes — Doc 18 §Star Rendering canonical hex for coreColor
 * (TS-VQA-001 spectral→color target). Other palette slots pulled from
 * Doc 17 ENT-1010..ENT-1019 "Color palette" spec.
 */
export const MAINSEQ_PALETTES: Record<MainSeqKind, MainSeqPalette> = {
  // ENT-1010 O-type — Doc 18: #0080FF; Doc 17: core #2244FF..#5577FF,
  // limb #1122DD darkened, photosphere mix #6688FF.
  O: {
    coreColor: '#0080FF',
    haloColor: '#6688FF',
    spotColor: '#004488',
    chromosphereColor: '#00DDFF',
    limbColor: '#1122DD',
  },
  // ENT-1011 B-type — Doc 18: #0099FF; Doc 17: core #4477FF..#7799FF,
  // polar bleach #CCDDFF, equatorial tint #5588FF.
  B: {
    coreColor: '#0099FF',
    haloColor: '#5588FF',
    spotColor: '#003366',
    chromosphereColor: '#CCDDFF',
    limbColor: '#3366CC',
  },
  // ENT-1012 A-type — Doc 18: #00CCFF; Doc 17: core #7799FF..#AABBFF,
  // spot #5566DD (Ap), bright patch #CCDDFF.
  A: {
    coreColor: '#00CCFF',
    haloColor: '#AABBFF',
    spotColor: '#5566DD',
    chromosphereColor: '#CCDDFF',
    limbColor: '#6688DD',
  },
  // ENT-1013 F-type — Doc 18: #FFFFCC; Doc 17: core #AABBFF..#FFFF99,
  // cells #9999EE, limb bleach #EEEEFF.
  F: {
    coreColor: '#FFFFCC',
    haloColor: '#FFFF99',
    spotColor: '#9999EE',
    chromosphereColor: '#FFFFDD',
    limbColor: '#EEEEFF',
  },
  // ENT-1014 G-type — Doc 18: #FFFF99; Doc 17 ENT-1014: core #FFFF33,
  // spots #CC8800, plages #FFFFCC, CME #FF3300.
  G: {
    coreColor: '#FFFF99',
    haloColor: '#FFFFAA',
    spotColor: '#CC8800',
    chromosphereColor: '#FFFFCC',
    limbColor: '#EEEE66',
  },
  // ENT-1015 K-type — Doc 18: #FFCC99; Doc 17: core #FFFF66..#FFAA33,
  // spots #663300, flare #FF6600.
  K: {
    coreColor: '#FFCC99',
    haloColor: '#FFDD66',
    spotColor: '#663300',
    chromosphereColor: '#FFFF99',
    limbColor: '#BB6622',
  },
  // ENT-1016 M-type — Doc 18: #FF9966; Doc 17: core #FFAA33..#AA3333,
  // spots #441111, flare #FFFF00.
  M: {
    coreColor: '#FF9966',
    haloColor: '#FF8833',
    spotColor: '#441111',
    chromosphereColor: '#FFFF99',
    limbColor: '#AA3333',
  },
  // ENT-1017 L-type brown dwarf — Doc 17: core #DD4433..#8B4513,
  // cloud layers #AA3333/#664433, limb dark #663322.
  L: {
    coreColor: '#B85633',
    haloColor: '#AA3333',
    spotColor: '#664433',
    chromosphereColor: '#DD4433',
    limbColor: '#663322',
  },
  // ENT-1018 T-type brown dwarf — Doc 17: core #6B4423..#3D2817,
  // methane band #2B1810, limb #1A0F08.
  T: {
    coreColor: '#5A3D1F',
    haloColor: '#6B4423',
    spotColor: '#2B1810',
    chromosphereColor: '#3D2817',
    limbColor: '#1A0F08',
  },
  // ENT-1019 Y-type brown dwarf — Doc 17: core #1A0F08..#000000,
  // optional ammonia #0A0A1A.
  Y: {
    coreColor: '#0A0A1A',
    haloColor: '#1A0F08',
    spotColor: '#000000',
    chromosphereColor: '#1A0F08',
    limbColor: '#000000',
  },
  // ENT-1021 Main Sequence (General) — treat as G-analog until u_temperatureK
  // shader blends toward the right class. Doc 17 says "refer to individual
  // spectral type entries"; we pick the Sun (G2V) palette as a safe default.
  MS: {
    coreColor: '#FFFF99',
    haloColor: '#FFFFAA',
    spotColor: '#CC8800',
    chromosphereColor: '#FFFFCC',
    limbColor: '#EEEE66',
  },
};

export interface MainSeqParams {
  /** Effective surface temperature in Kelvin (Doc 17 per-class column). */
  temperatureK: number;
  /** Doc 18 "Corona width × starRadius" — 0.3 for O-type, 0.22 for K, etc. */
  coronaWidth: number;
  /** FBM octave count for surface granulation (Doc 17 shader spec). */
  granulationOctaves: number;
  /** FBM amplitude (Doc 17 "amplitude 0.1" etc.). */
  granulationAmp: number;
  /** 0..1 blend between FBM granules and Voronoi cells. */
  voronoiBlend: number;
  /** 0..1 starspot area fraction (Doc 17 "sunspot density"). */
  spotDensity: number;
  /** Rotation rate (radians / second, display-space). */
  rotationRate: number;
  /** Linear limb-darkening exponent (Doc 17 "(1 − cos(angle))^N" exponent). */
  limbDarkening: number;
  /** Bloom intensity target (Doc 18 per-class). */
  bloomIntensity: number;
  /** Surface twinkle / scintillation amplitude. */
  twinkleStrength: number;
  /** Flare spawn rate (Hz display time). Doc 17 M-type: up to 10/day young. */
  flareRate: number;
}

export const MAINSEQ_PARAMS: Record<MainSeqKind, MainSeqParams> = {
  // ENT-1010 O-type — T~30k-50k K; 0.8 bloom; corona tight 0.3; sparse spots.
  O: {
    temperatureK: 40000,
    coronaWidth: 0.30,
    granulationOctaves: 5,
    granulationAmp: 0.15,
    voronoiBlend: 0.1,
    spotDensity: 0.0,
    rotationRate: 0.35,
    limbDarkening: 3.5,
    bloomIntensity: 2.5,
    twinkleStrength: 0.05,
    flareRate: 0.0,
  },
  // ENT-1011 B-type — T~10k-30k K; rotation faster; corona 0.4.
  B: {
    temperatureK: 20000,
    coronaWidth: 0.40,
    granulationOctaves: 4,
    granulationAmp: 0.10,
    voronoiBlend: 0.15,
    spotDensity: 0.01,
    rotationRate: 0.7,
    limbDarkening: 2.2,
    bloomIntensity: 2.2,
    twinkleStrength: 0.05,
    flareRate: 0.0,
  },
  // ENT-1012 A-type — T~7.5k-10k K; calm surface.
  A: {
    temperatureK: 8500,
    coronaWidth: 0.35,
    granulationOctaves: 3,
    granulationAmp: 0.06,
    voronoiBlend: 0.15,
    spotDensity: 0.02,
    rotationRate: 0.4,
    limbDarkening: 1.8,
    bloomIntensity: 1.9,
    twinkleStrength: 0.03,
    flareRate: 0.0,
  },
  // ENT-1013 F-type — T~6k-7.5k K; emerging convection.
  F: {
    temperatureK: 6700,
    coronaWidth: 0.30,
    granulationOctaves: 3,
    granulationAmp: 0.08,
    voronoiBlend: 0.20,
    spotDensity: 0.05,
    rotationRate: 0.3,
    limbDarkening: 1.6,
    bloomIntensity: 1.6,
    twinkleStrength: 0.04,
    flareRate: 0.02,
  },
  // ENT-1014 G-type — T~5.8k K Sun. Tuned so the Sun reads as a smooth,
  // self-luminous bright disk out of the box. Voronoi blend low (0.08) for
  // fine granulation; spotDensity=0 so the plage/facular rings don't speckle
  // the photosphere — user can turn sunspots on via Doc 22 toggle when
  // desired. Limb darkening kept subtle (0.9 → linear u≈0.32) so the disc
  // doesn't look shadowed at the edges.
  G: {
    temperatureK: 5778,
    coronaWidth: 0.25,
    granulationOctaves: 5,
    granulationAmp: 0.06,
    voronoiBlend: 0.08,
    spotDensity: 0.0,
    rotationRate: 0.08,
    limbDarkening: 0.9,
    bloomIntensity: 1.4,
    twinkleStrength: 0.02,
    flareRate: 0.0,
  },
  // ENT-1015 K-type — T~3.7k-5.2k K; 30% Voronoi blend, large spots.
  K: {
    temperatureK: 4500,
    coronaWidth: 0.22,
    granulationOctaves: 6,
    granulationAmp: 0.12,
    voronoiBlend: 0.35,
    spotDensity: 0.22,
    rotationRate: 0.06,
    limbDarkening: 1.3,
    bloomIntensity: 1.2,
    twinkleStrength: 0.06,
    flareRate: 0.5,
  },
  // ENT-1016 M-type — T~2.4k-3.7k K; 45% Voronoi blend; frequent flares.
  M: {
    temperatureK: 3200,
    coronaWidth: 0.20,
    granulationOctaves: 6,
    granulationAmp: 0.15,
    voronoiBlend: 0.45,
    spotDensity: 0.40,
    rotationRate: 0.03,
    limbDarkening: 1.2,
    bloomIntensity: 1.0,
    twinkleStrength: 0.08,
    flareRate: 2.5,
  },
  // ENT-1017 L-type brown dwarf — T~1.3k-2.2k K; no corona, dampened cells.
  L: {
    temperatureK: 1700,
    coronaWidth: 0.0,
    granulationOctaves: 3,
    granulationAmp: 0.02,
    voronoiBlend: 0.0,
    spotDensity: 0.0,
    rotationRate: 0.9,
    limbDarkening: 2.0,
    bloomIntensity: 0.1,
    twinkleStrength: 0.02,
    flareRate: 0.0,
  },
  // ENT-1018 T-type brown dwarf — T~0.7k-1.3k K; methane featureless.
  T: {
    temperatureK: 900,
    coronaWidth: 0.0,
    granulationOctaves: 2,
    granulationAmp: 0.01,
    voronoiBlend: 0.0,
    spotDensity: 0.0,
    rotationRate: 1.2,
    limbDarkening: 2.5,
    bloomIntensity: 0.0,
    twinkleStrength: 0.01,
    flareRate: 0.0,
  },
  // ENT-1019 Y-type brown dwarf — T~300-1000 K; cold, featureless.
  Y: {
    temperatureK: 500,
    coronaWidth: 0.0,
    granulationOctaves: 2,
    granulationAmp: 0.005,
    voronoiBlend: 0.0,
    spotDensity: 0.0,
    rotationRate: 0.9,
    limbDarkening: 3.0,
    bloomIntensity: 0.0,
    twinkleStrength: 0.005,
    flareRate: 0.0,
  },
  // ENT-1021 Main Sequence (General) — defaults to solar parameters.
  MS: {
    temperatureK: 5778,
    coronaWidth: 0.25,
    granulationOctaves: 4,
    granulationAmp: 0.08,
    voronoiBlend: 0.20,
    spotDensity: 0.1,
    rotationRate: 0.08,
    limbDarkening: 1.4,
    bloomIntensity: 1.4,
    twinkleStrength: 0.04,
    flareRate: 0.05,
  },
};

// ===========================================================================
// Evolved (ENT-1020, 1022..1029, 1040)
// ===========================================================================

export interface EvolvedPalette {
  /** Photosphere / inner surface colour. */
  coreColor: string;
  /** Extended-envelope / halo colour. */
  haloColor: string;
  /** Spot / storm darkening. */
  spotColor: string;
  /** Hot region / accretion / flare tint. */
  chromosphereColor: string;
  /** Dust-shell / wind tint (used for envelope modulation). */
  dustColor: string;
  /** Limb tint. */
  limbColor: string;
}

export const EVOLVED_PALETTES: Record<EvolvedKind, EvolvedPalette> = {
  // ENT-1020 Protostar — Doc 17: core #FFAA33..#FFFF99, spots #330000..#550000,
  // hot accretion #FFFF00..#FF6600, dust #AA6633.
  protostar: {
    coreColor: '#FFCC66',
    haloColor: '#FFFF99',
    spotColor: '#330000',
    chromosphereColor: '#FF6600',
    dustColor: '#AA6633',
    limbColor: '#CC6633',
  },
  // ENT-1022 Subgiant — transition shader between F-type and K-giant.
  subgiant: {
    coreColor: '#FFE07A',
    haloColor: '#FFD0A0',
    spotColor: '#774400',
    chromosphereColor: '#FFEFB0',
    dustColor: '#BB9966',
    limbColor: '#CC9966',
  },
  // ENT-1023 Red Giant / Supergiant — Doc 17: RGB #AA3333..#CC4433,
  // RSG #DD5533..#FF6633, convection #FF9933/#330000.
  redgiant: {
    coreColor: '#CC4433',
    haloColor: '#FF9933',
    spotColor: '#330000',
    chromosphereColor: '#FF6600',
    dustColor: '#884433',
    limbColor: '#AA3333',
  },
  // ENT-1024 Blue Supergiant — Doc 17: core #4477FF..#6699FF, wind #00DDFF.
  bluesupergiant: {
    coreColor: '#5588FF',
    haloColor: '#00DDFF',
    spotColor: '#223366',
    chromosphereColor: '#AACCFF',
    dustColor: '#334477',
    limbColor: '#3366CC',
  },
  // ENT-1025 AGB — Doc 17: oxygen-rich #663333..#884433; pulse #FFAA33.
  agb: {
    coreColor: '#773333',
    haloColor: '#AA6633',
    spotColor: '#441111',
    chromosphereColor: '#FFAA33',
    dustColor: '#664433',
    limbColor: '#552222',
  },
  // ENT-1026 Horizontal Branch — Doc 17: BHB #3366FF..#4477FF, RHB #FFFF66..#FFFF99.
  horizontalbranch: {
    coreColor: '#4477FF',
    haloColor: '#AABBFF',
    spotColor: '#334477',
    chromosphereColor: '#FFFF99',
    dustColor: '#556677',
    limbColor: '#3366CC',
  },
  // ENT-1027 Wolf-Rayet — Doc 17: WN core #5588FF..#7799FF, WC #4477FF..#6699FF,
  // emission nebula ring HeII #00FF00 / C #FF0000.
  wolfrayet: {
    coreColor: '#6688FF',
    haloColor: '#0099FF',
    spotColor: '#223344',
    chromosphereColor: '#00CCFF',
    dustColor: '#FF0000',
    limbColor: '#3366CC',
  },
  // ENT-1028 Luminous Blue Variable — Doc 17: quiet #5588FF, eruption #FF9933,
  // shells #FF6633.
  lbv: {
    coreColor: '#5588FF',
    haloColor: '#FF9933',
    spotColor: '#223355',
    chromosphereColor: '#FFFF99',
    dustColor: '#FF6633',
    limbColor: '#4466AA',
  },
  // ENT-1029 Carbon Star — Doc 17: core #441111..#663333, dust #111111.
  carbon: {
    coreColor: '#553322',
    haloColor: '#663333',
    spotColor: '#220000',
    chromosphereColor: '#AA6633',
    dustColor: '#660000',
    limbColor: '#331111',
  },
  // ENT-1040 Hypergiant — cool branch #AA3333; blue #4477FF; yellow #FFFF66.
  // Default = red hypergiant (Betelgeuse/VY Canis Majoris template).
  hypergiant: {
    coreColor: '#AA3333',
    haloColor: '#FF6633',
    spotColor: '#220000',
    chromosphereColor: '#FFAA33',
    dustColor: '#884433',
    limbColor: '#772222',
  },
};

export interface EvolvedParams {
  temperatureK: number;
  /** Envelope outer radius multiplier (Doc 18: 0.8 core + 0.2 envelope). */
  envelopeWidth: number;
  granulationOctaves: number;
  granulationAmp: number;
  voronoiBlend: number;
  /** Mass-loss wind / dust wisp flow rate (display units / sec). */
  windRate: number;
  /** Ejected-envelope ring intensity (Wolf-Rayet), 0 for others. */
  shellIntensity: number;
  /** S-Doradus pulsation amplitude (LBV), 0 for others. */
  sdoradusAmp: number;
  /** Bipolar-jet mask intensity (protostar), 0 for others. */
  jetIntensity: number;
  rotationRate: number;
  limbDarkening: number;
  bloomIntensity: number;
  /** Chromospheric / accretion-hotspot brightness. */
  chromosphereIntensity: number;
}

export const EVOLVED_PARAMS: Record<EvolvedKind, EvolvedParams> = {
  protostar: {
    temperatureK: 4000,
    envelopeWidth: 0.25,
    granulationOctaves: 7,
    granulationAmp: 0.15,
    voronoiBlend: 0.5,
    windRate: 0.08,
    shellIntensity: 0.0,
    sdoradusAmp: 0.0,
    jetIntensity: 1.0,
    rotationRate: 1.2,
    limbDarkening: 1.2,
    bloomIntensity: 1.0,
    chromosphereIntensity: 0.6,
  },
  subgiant: {
    temperatureK: 5500,
    envelopeWidth: 0.15,
    granulationOctaves: 5,
    granulationAmp: 0.07,
    voronoiBlend: 0.20,
    windRate: 0.03,
    shellIntensity: 0.0,
    sdoradusAmp: 0.0,
    jetIntensity: 0.0,
    rotationRate: 0.25,
    limbDarkening: 1.5,
    bloomIntensity: 0.6,
    chromosphereIntensity: 0.2,
  },
  redgiant: {
    temperatureK: 3500,
    envelopeWidth: 0.20,
    granulationOctaves: 7,
    granulationAmp: 0.18,
    voronoiBlend: 0.6,
    windRate: 0.12,
    shellIntensity: 0.0,
    sdoradusAmp: 0.0,
    jetIntensity: 0.0,
    rotationRate: 0.01,
    limbDarkening: 1.1,
    bloomIntensity: 0.85,
    chromosphereIntensity: 0.35,
  },
  bluesupergiant: {
    temperatureK: 20000,
    envelopeWidth: 0.12,
    granulationOctaves: 5,
    granulationAmp: 0.07,
    voronoiBlend: 0.20,
    windRate: 0.25,
    shellIntensity: 0.0,
    sdoradusAmp: 0.0,
    jetIntensity: 0.0,
    rotationRate: 0.8,
    limbDarkening: 2.0,
    bloomIntensity: 1.1,
    chromosphereIntensity: 0.3,
  },
  agb: {
    temperatureK: 3200,
    envelopeWidth: 0.28,
    granulationOctaves: 8,
    granulationAmp: 0.20,
    voronoiBlend: 0.65,
    windRate: 0.18,
    shellIntensity: 0.0,
    sdoradusAmp: 0.0,
    jetIntensity: 0.0,
    rotationRate: 0.005,
    limbDarkening: 0.9,
    bloomIntensity: 0.75,
    chromosphereIntensity: 0.3,
  },
  horizontalbranch: {
    temperatureK: 7500,
    envelopeWidth: 0.08,
    granulationOctaves: 4,
    granulationAmp: 0.04,
    voronoiBlend: 0.15,
    windRate: 0.015,
    shellIntensity: 0.0,
    sdoradusAmp: 0.0,
    jetIntensity: 0.0,
    rotationRate: 0.2,
    limbDarkening: 2.0,
    bloomIntensity: 0.55,
    chromosphereIntensity: 0.1,
  },
  wolfrayet: {
    temperatureK: 80000,
    envelopeWidth: 0.10,
    granulationOctaves: 3,
    granulationAmp: 0.02,
    voronoiBlend: 0.05,
    windRate: 0.40,
    shellIntensity: 1.0,
    sdoradusAmp: 0.0,
    jetIntensity: 0.0,
    rotationRate: 0.15,
    limbDarkening: 2.5,
    bloomIntensity: 1.1,
    chromosphereIntensity: 0.4,
  },
  lbv: {
    temperatureK: 16000,
    envelopeWidth: 0.22,
    granulationOctaves: 4,
    granulationAmp: 0.08,
    voronoiBlend: 0.2,
    windRate: 0.35,
    shellIntensity: 0.0,
    sdoradusAmp: 0.4,
    jetIntensity: 0.0,
    rotationRate: 0.2,
    limbDarkening: 2.0,
    bloomIntensity: 1.0,
    chromosphereIntensity: 0.5,
  },
  carbon: {
    temperatureK: 2800,
    envelopeWidth: 0.28,
    granulationOctaves: 4,
    granulationAmp: 0.03,
    voronoiBlend: 0.1,
    windRate: 0.15,
    shellIntensity: 0.0,
    sdoradusAmp: 0.0,
    jetIntensity: 0.0,
    rotationRate: 0.005,
    limbDarkening: 0.8,
    bloomIntensity: 0.15,
    chromosphereIntensity: 0.2,
  },
  hypergiant: {
    temperatureK: 3400,
    envelopeWidth: 0.30,
    granulationOctaves: 7,
    granulationAmp: 0.18,
    voronoiBlend: 0.6,
    windRate: 0.35,
    shellIntensity: 0.0,
    sdoradusAmp: 0.0,
    jetIntensity: 0.0,
    rotationRate: 0.003,
    limbDarkening: 1.0,
    bloomIntensity: 1.2,
    chromosphereIntensity: 0.45,
  },
};

// ===========================================================================
// Remnant (ENT-1030, 1031)
// ===========================================================================

export interface RemnantPalette {
  /** Hot-blue end of the temperature gradient. */
  hotColor: string;
  /** Warm-white end of the temperature gradient. */
  coolColor: string;
  /** Polar-cap / beam tint. */
  polarColor: string;
  /** Beam emission tint. */
  beamColor: string;
  /** Limb tint. */
  limbColor: string;
}

export const REMNANT_PALETTES: Record<RemnantKind, RemnantPalette> = {
  // ENT-1030 White Dwarf — Doc 17/18: hot >20k K → #3366FF..#5588FF,
  // warm #AABBFF..#FFFFFF, cool #FFFFFF..#FFDDAA, very cool #FFAA99.
  whitedwarf: {
    hotColor: '#5588FF',
    coolColor: '#FFFFFF',
    polarColor: '#FFFFFF',
    beamColor: '#FFFFFF',
    limbColor: '#AABBFF',
  },
  // ENT-1031 Neutron Star — Doc 17: core #AABBFF..#FFFFFF, pole hotspot
  // #FFFF99/#FFFFFF, PWN #0099FF.
  neutronstar: {
    hotColor: '#AABBFF',
    coolColor: '#FFFFFF',
    polarColor: '#FFFF99',
    beamColor: '#00DDFF',
    limbColor: '#DDE6FF',
  },
};

export interface RemnantParams {
  /** Initial surface temperature (Kelvin). Controls hot/cool blend. */
  wdTemperature: number;
  /** Display rotation frequency (Hz). Real Crab is 29.9 Hz — slowed for UX. */
  rotationHz: number;
  /** Magnetic-axis tilt from rotation axis (radians). */
  magneticTilt: number;
  /** Beam cone half-angle (radians). Doc 18 pulsar: 10–30°. */
  beamHalfAngle: number;
  /** Beam emission intensity (bloom fuel). */
  beamIntensity: number;
  /** Polar-cap hotspot intensity. */
  polarCapIntensity: number;
  limbDarkening: number;
  bloomIntensity: number;
  /** ZZ Ceti pulsation amplitude (white dwarf). Default 0 — toggle ON to engage. */
  pulsationAmp: number;
  /** ZZ Ceti pulsation period seconds (Doc 17: 100–1000 s real → compressed 15 s demo). */
  pulsationPeriodSec: number;
}

export const REMNANT_PARAMS: Record<RemnantKind, RemnantParams> = {
  whitedwarf: {
    wdTemperature: 15000,     // Doc 17 §ENT-1030 median (range 5k-160k K)
    rotationHz: 0.1,          // slow
    magneticTilt: 0.2,
    beamHalfAngle: 0.0,       // WD has no beam
    beamIntensity: 0.0,
    polarCapIntensity: 0.0,
    limbDarkening: 2.5,
    bloomIntensity: 0.8,
    pulsationAmp: 0.0,        // ZZ Ceti sub-variant default OFF
    pulsationPeriodSec: 15.0,
  },
  neutronstar: {
    wdTemperature: 1000000,   // 10^6 K — used only for blend bias
    rotationHz: 2.0,          // Doc 17: 29.9 Hz Crab → slow to 2 Hz for UX
    magneticTilt: 0.45,       // Doc 22 typical 25°
    beamHalfAngle: 0.35,      // ~20° Doc 18 mid-range
    beamIntensity: 4.0,
    polarCapIntensity: 2.5,
    limbDarkening: 2.5,
    bloomIntensity: 1.1,
    pulsationAmp: 0.0,
    pulsationPeriodSec: 0.0,
  },
};

// ===========================================================================
// Variable (ENT-1033..1039)
// ===========================================================================

export interface VariablePalette {
  /** Minimum-brightness phase tint. */
  coolColor: string;
  /** Maximum-brightness phase tint. */
  hotColor: string;
  /** Halo tint. */
  haloColor: string;
  /** Spot / companion dimming colour. */
  spotColor: string;
  /** Limb tint. */
  limbColor: string;
}

export const VARIABLE_PALETTES: Record<VariableKind, VariablePalette> = {
  // ENT-1033 Cepheid — Doc 17: min #FFFF66..#FFAA33 / max #FFFF00..#FFFFAA.
  cepheid: {
    coolColor: '#FFAA33',
    hotColor: '#FFFFAA',
    haloColor: '#FFFF99',
    spotColor: '#AA6622',
    limbColor: '#FFDD66',
  },
  // ENT-1034 RR Lyrae — Doc 17: similar but shorter period & tighter range.
  rrlyrae: {
    coolColor: '#FFFF66',
    hotColor: '#FFFFAA',
    haloColor: '#FFFFDD',
    spotColor: '#CCAA33',
    limbColor: '#FFEE99',
  },
  // ENT-1035 Mira — Doc 17: min #441111..#663333, max #DD5533..#FF6633.
  mira: {
    coolColor: '#552222',
    hotColor: '#DD5533',
    haloColor: '#FF6600',
    spotColor: '#220000',
    limbColor: '#442222',
  },
  // ENT-1036 Eclipsing Binary — generic F-type envelope; companion dark-disk mask.
  eclipsing: {
    coolColor: '#FFDD66',
    hotColor: '#FFFFAA',
    haloColor: '#FFEECC',
    spotColor: '#222233',                // companion silhouette
    limbColor: '#CCAA66',
  },
  // ENT-1037 Cataclysmic — white-dwarf primary hot disk + K-M donor red.
  cataclysmic: {
    coolColor: '#AA3333',
    hotColor: '#FFFFFF',                 // nova peak white-blue
    haloColor: '#FFAA00',                // accretion disk amber
    spotColor: '#663300',
    limbColor: '#CC4433',
  },
  // ENT-1038 Symbiotic — D-type dust + Z-type ionization; bichromatic halo.
  symbiotic: {
    coolColor: '#AA3333',                // red giant component
    hotColor: '#AABBFF',                 // hot subdwarf / WD
    haloColor: '#00CCFF',                // ionised nebula
    spotColor: '#663333',
    limbColor: '#AA6633',
  },
  // ENT-1039 Blue Straggler — Doc 17: #5588FF..#6699FF (blue-white).
  bluestraggler: {
    coolColor: '#5588FF',
    hotColor: '#AABBFF',
    haloColor: '#88AAFF',
    spotColor: '#334477',
    limbColor: '#4477EE',
  },
};

export interface VariableParams {
  /** Pulsation period (seconds, display time — Doc 17 real periods compressed). */
  pulsationPeriodSec: number;
  /** Pulsation amplitude as fraction of baseline (±). */
  pulsationAmp: number;
  /** Brightness amplitude (fraction ±). */
  brightnessAmp: number;
  /** Base FBM octaves for surface granulation. */
  granulationOctaves: number;
  granulationAmp: number;
  voronoiBlend: number;
  /** Eclipse-dip depth (0 = no eclipse, 0.7 = dim to 30%). */
  dipDepth: number;
  /** Companion orbital phase rate (rad/sec, for eclipsing). */
  companionPhaseRate: number;
  /** Flare burst rate (Hz) for cataclysmic novae. */
  flareRate: number;
  /** Rotation rate (rad/sec). */
  rotationRate: number;
  limbDarkening: number;
  bloomIntensity: number;
  /** Blue-channel boost for blue-straggler brightening, 0 otherwise. */
  blueExcess: number;
}

export const VARIABLE_PARAMS: Record<VariableKind, VariableParams> = {
  // Cepheid — real 5 days → compress to 8 s so one pulse fits a demo tab.
  cepheid: {
    pulsationPeriodSec: 8.0,
    pulsationAmp: 0.25,
    brightnessAmp: 0.35,
    granulationOctaves: 4,
    granulationAmp: 0.06,
    voronoiBlend: 0.2,
    dipDepth: 0.0,
    companionPhaseRate: 0.0,
    flareRate: 0.0,
    rotationRate: 0.05,
    limbDarkening: 1.4,
    bloomIntensity: 0.9,
    blueExcess: 0.0,
  },
  // RR Lyrae — real 0.5 days → 2 s.
  rrlyrae: {
    pulsationPeriodSec: 2.0,
    pulsationAmp: 0.10,
    brightnessAmp: 0.20,
    granulationOctaves: 3,
    granulationAmp: 0.04,
    voronoiBlend: 0.15,
    dipDepth: 0.0,
    companionPhaseRate: 0.0,
    flareRate: 0.0,
    rotationRate: 0.1,
    limbDarkening: 2.0,
    bloomIntensity: 0.55,
    blueExcess: 0.0,
  },
  // Mira — real 300 days → 15 s.
  mira: {
    pulsationPeriodSec: 15.0,
    pulsationAmp: 0.40,
    brightnessAmp: 0.60,
    granulationOctaves: 7,
    granulationAmp: 0.18,
    voronoiBlend: 0.5,
    dipDepth: 0.0,
    companionPhaseRate: 0.0,
    flareRate: 0.0,
    rotationRate: 0.004,
    limbDarkening: 0.9,
    bloomIntensity: 0.8,
    blueExcess: 0.0,
  },
  // Eclipsing — period = orbital 6 s, small pulsation (body rotation only).
  eclipsing: {
    pulsationPeriodSec: 6.0,
    pulsationAmp: 0.0,
    brightnessAmp: 0.0,
    granulationOctaves: 4,
    granulationAmp: 0.06,
    voronoiBlend: 0.2,
    dipDepth: 0.55,
    companionPhaseRate: 2 * Math.PI / 6.0,
    flareRate: 0.0,
    rotationRate: 0.4,
    limbDarkening: 1.4,
    bloomIntensity: 0.9,
    blueExcess: 0.0,
  },
  // Cataclysmic — stochastic nova flares; no steady pulsation.
  cataclysmic: {
    pulsationPeriodSec: 4.0,
    pulsationAmp: 0.05,
    brightnessAmp: 0.3,
    granulationOctaves: 5,
    granulationAmp: 0.10,
    voronoiBlend: 0.3,
    dipDepth: 0.0,
    companionPhaseRate: 0.0,
    flareRate: 0.15,                     // ~one flare per 7 s average
    rotationRate: 0.6,
    limbDarkening: 1.5,
    bloomIntensity: 1.3,
    blueExcess: 0.0,
  },
  // Symbiotic — slow bichromatic ebb/flow.
  symbiotic: {
    pulsationPeriodSec: 30.0,
    pulsationAmp: 0.08,
    brightnessAmp: 0.12,
    granulationOctaves: 6,
    granulationAmp: 0.14,
    voronoiBlend: 0.45,
    dipDepth: 0.0,
    companionPhaseRate: 2 * Math.PI / 30.0,
    flareRate: 0.0,
    rotationRate: 0.02,
    limbDarkening: 1.1,
    bloomIntensity: 0.75,
    blueExcess: 0.0,
  },
  // Blue Straggler — steady, with a slight blue excess overlay.
  bluestraggler: {
    pulsationPeriodSec: 24.0,
    pulsationAmp: 0.02,
    brightnessAmp: 0.03,
    granulationOctaves: 3,
    granulationAmp: 0.04,
    voronoiBlend: 0.1,
    dipDepth: 0.0,
    companionPhaseRate: 0.0,
    flareRate: 0.0,
    rotationRate: 0.6,
    limbDarkening: 1.9,
    bloomIntensity: 0.95,
    blueExcess: 0.25,
  },
};

// ===========================================================================
// RGB helpers — parallel exoticPalette / planetPalette style.
// ===========================================================================

export function mainSeqPaletteRgb(kind: MainSeqKind): Record<keyof MainSeqPalette, RGB> {
  const p = MAINSEQ_PALETTES[kind];
  return {
    coreColor: hexToRgb(p.coreColor),
    haloColor: hexToRgb(p.haloColor),
    spotColor: hexToRgb(p.spotColor),
    chromosphereColor: hexToRgb(p.chromosphereColor),
    limbColor: hexToRgb(p.limbColor),
  };
}

export function evolvedPaletteRgb(kind: EvolvedKind): Record<keyof EvolvedPalette, RGB> {
  const p = EVOLVED_PALETTES[kind];
  return {
    coreColor: hexToRgb(p.coreColor),
    haloColor: hexToRgb(p.haloColor),
    spotColor: hexToRgb(p.spotColor),
    chromosphereColor: hexToRgb(p.chromosphereColor),
    dustColor: hexToRgb(p.dustColor),
    limbColor: hexToRgb(p.limbColor),
  };
}

export function remnantPaletteRgb(kind: RemnantKind): Record<keyof RemnantPalette, RGB> {
  const p = REMNANT_PALETTES[kind];
  return {
    hotColor: hexToRgb(p.hotColor),
    coolColor: hexToRgb(p.coolColor),
    polarColor: hexToRgb(p.polarColor),
    beamColor: hexToRgb(p.beamColor),
    limbColor: hexToRgb(p.limbColor),
  };
}

export function variablePaletteRgb(kind: VariableKind): Record<keyof VariablePalette, RGB> {
  const p = VARIABLE_PALETTES[kind];
  return {
    coolColor: hexToRgb(p.coolColor),
    hotColor: hexToRgb(p.hotColor),
    haloColor: hexToRgb(p.haloColor),
    spotColor: hexToRgb(p.spotColor),
    limbColor: hexToRgb(p.limbColor),
  };
}
