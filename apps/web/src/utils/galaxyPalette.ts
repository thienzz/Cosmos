/**
 * T29 — Doc 18 §Galaxy Rendering + Doc 22 ENT-6010/6012/6020/6030 palette.
 *
 * Source of truth for "what colour is a spiral-arm dust lane?". The four
 * galaxy shaders each consume a subset of these hex codes as uniforms; the
 * GalaxyMaterial unit tests read the uniforms back to assert TS-VQA-004
 * (galaxy ΔE < 8.0) against the reference palette.
 *
 * Every hex below is cited against Doc 18 §Galaxy Rendering or Doc 22
 * ENT-6010–6040 inline. Where Doc 18's prose gave RGB triplets
 * (`vec3(0.6, 0.8, 1.0)`), we back-convert to the nearest hex.
 */

import { hexToRgb, type RGB } from './spectralColor';

export type GalaxyKind =
  | 'spiral'
  | 'elliptical'
  | 'irregular'
  | 'lenticular'
  | 'agn'
  | 'starburst'
  | 'morphology-special';

export const GALAXY_KINDS: GalaxyKind[] = [
  'spiral',
  'elliptical',
  'irregular',
  'lenticular',
  'agn',
  'starburst',
  'morphology-special',
];

/**
 * Full 19-subtype enumeration (Doc 17 ENT-6010..6055). Each `GalaxySubtype`
 * maps onto exactly one `GalaxyKind` shader family — see
 * {@link GALAXY_SUBTYPE_KIND} for the mapping and
 * {@link GALAXY_SUBTYPE_ENT_ID} for the Doc 17 entity ID.
 */
export type GalaxySubtype =
  | 'sa'         // ENT-6010  (unbarred spiral)
  | 'sb'         // ENT-6011  (barred spiral)
  | 's0'         // ENT-6012  (lenticular)
  | 'giant-e'    // ENT-6020  (giant elliptical)
  | 'de'         // ENT-6021  (dwarf elliptical)
  | 'dsph'       // ENT-6022  (dwarf spheroidal)
  | 'irr-i'      // ENT-6030  (Magellanic irregular)
  | 'irr-ii'     // ENT-6031  (tidal-disruption irregular)
  | 'seyfert'    // ENT-6040  (Seyfert 1/2 — picked via subtype option)
  | 'quasar'     // ENT-6041
  | 'radio'      // ENT-6042
  | 'blazar'     // ENT-6043
  | 'liner'      // ENT-6044
  | 'starburst'  // ENT-6050
  | 'ring'       // ENT-6051
  | 'jellyfish'  // ENT-6052
  | 'ulirg'      // ENT-6053
  | 'udg'        // ENT-6054
  | 'merging';   // ENT-6055

export const GALAXY_SUBTYPES: GalaxySubtype[] = [
  'sa', 'sb', 's0', 'giant-e', 'de', 'dsph', 'irr-i', 'irr-ii',
  'seyfert', 'quasar', 'radio', 'blazar', 'liner',
  'starburst', 'ring', 'jellyfish', 'ulirg', 'udg', 'merging',
];

/** Map subtype → shader family. */
export const GALAXY_SUBTYPE_KIND: Record<GalaxySubtype, GalaxyKind> = {
  sa: 'spiral',
  sb: 'spiral',
  s0: 'lenticular',
  'giant-e': 'elliptical',
  de: 'elliptical',
  dsph: 'elliptical',
  'irr-i': 'irregular',
  'irr-ii': 'irregular',
  seyfert: 'agn',
  quasar: 'agn',
  radio: 'agn',
  blazar: 'agn',
  liner: 'agn',
  starburst: 'starburst',
  ulirg: 'starburst',
  ring: 'morphology-special',
  jellyfish: 'morphology-special',
  udg: 'morphology-special',
  merging: 'morphology-special',
};

export const GALAXY_SUBTYPE_ENT_ID: Record<GalaxySubtype, string> = {
  sa: 'ENT-6010', sb: 'ENT-6011', s0: 'ENT-6012',
  'giant-e': 'ENT-6020', de: 'ENT-6021', dsph: 'ENT-6022',
  'irr-i': 'ENT-6030', 'irr-ii': 'ENT-6031',
  seyfert: 'ENT-6040', quasar: 'ENT-6041', radio: 'ENT-6042',
  blazar: 'ENT-6043', liner: 'ENT-6044',
  starburst: 'ENT-6050', ring: 'ENT-6051', jellyfish: 'ENT-6052',
  ulirg: 'ENT-6053', udg: 'ENT-6054', merging: 'ENT-6055',
};

/** Discrete AGN sub-variant sent via the `u_agnSubtype` uniform. */
export type AgnSubvariant = 'seyfert1' | 'seyfert2' | 'quasar' | 'radio' | 'blazar' | 'liner';
export const AGN_SUBVARIANT_CODE: Record<AgnSubvariant, number> = {
  seyfert1: 0,
  seyfert2: 1,
  quasar: 2,
  radio: 3,
  blazar: 4,
  liner: 5,
};

export type SpecialSubvariant = 'ring' | 'jellyfish' | 'udg' | 'merging';
export const SPECIAL_SUBVARIANT_CODE: Record<SpecialSubvariant, number> = {
  ring: 0,
  jellyfish: 1,
  udg: 2,
  merging: 3,
};

// ---------------------------------------------------------------------------
// Palettes — one per kind. Matches Doc 18 + Doc 22 verbatim.
// ---------------------------------------------------------------------------

export interface SpiralPalette {
  /** Spiral-arm young-star blue. Doc 18 §Spiral Galaxy: `vec3(0.6, 0.8, 1.0)`
   *  → `#99CCFF`. Doc 22 ENT-6010 #7 "bright blue-white": `#B0D8FF`. We
   *  pick the Doc 22 hex since it's the more specific source. */
  armColor: string;
  /** Inter-arm older-star yellow-white. Doc 18 §Spiral Galaxy:
   *  `vec3(0.8, 0.6, 0.4)` → `#CC9966`. Doc 22 ENT-6010 #19 age gradient
   *  describes "warmer yellow" inter-arm → `#FFD8A0`. */
  interArmColor: string;
  /** Central bulge warm yellow-gold. Doc 22 ENT-6010 #1: `#FFD8A0`. */
  bulgeColor: string;
  /** Dust lane dark brown-black. Doc 22 ENT-6010 #14: `#3A2F28`. */
  dustColor: string;
  /** HII-region bright pink (Hα). Doc 22 ENT-6010 #17: `#FF5540`. */
  hiiColor: string;
  /** Bar structure warm yellow. Doc 22 ENT-6010 #2: `#E8C070`. */
  barColor: string;
  /** Halo pale blue-gray diffuse. Doc 22 ENT-6012: `#AABBCC`. */
  haloColor: string;
}

export interface EllipticalPalette {
  /** Core yellow-gold (hot, high-Z). Doc 22 ENT-6020 #6: `#FFDA80`. */
  coreColor: string;
  /** Halo cooler red (lower-Z). Doc 22 ENT-6020 #6: `#8A5040`. */
  haloColor: string;
  /** Outer envelope warm reddish-brown. Doc 22 ENT-6020 #4: `#8A7060`. */
  envelopeColor: string;
  /** Globular-cluster warm yellow. Doc 22 ENT-6020 #9: `#FFD8A0`. */
  globularColor: string;
}

export interface IrregularPalette {
  /** Young-star blue-white. Doc 22 ENT-6030 description: `#A0C8FF`. */
  youngStarColor: string;
  /** Older-star yellow background. Doc 22 ENT-6030 #1: `#FFD8A0`. */
  oldStarColor: string;
  /** Starburst warm orange. Doc 22 ENT-6030 #8: `#FFB850`. */
  starburstColor: string;
  /** HII region bright pink. Doc 22 ENT-6030 #12: `#FF4080`. */
  hiiColor: string;
  /** Dust tint dark brown. Doc 22 ENT-6030 description: `#3A2F28`. */
  dustColor: string;
}

export interface LenticularPalette {
  /** Bulge reddish-brown (very old population). Doc 17 ENT-6012: `#CC8844`. */
  bulgeColor: string;
  /** Inner disk orange. Doc 17 ENT-6012: `#FFAA44`. */
  innerDiskColor: string;
  /** Outer disk yellow-orange. Doc 17 ENT-6012: `#FFBB55`. */
  outerDiskColor: string;
  /** Halo pale blue-gray. Doc 17 ENT-6012: `#AABBCC`. */
  haloColor: string;
  /** Optional S0a dust lane. Doc 17 ENT-6012: `#2A2A3E`. */
  dustColor: string;
}

export const SPIRAL_PALETTE: SpiralPalette = {
  armColor:      '#B0D8FF',
  interArmColor: '#FFD8A0',
  bulgeColor:    '#FFD8A0',
  dustColor:     '#3A2F28',
  hiiColor:      '#FF5540',
  barColor:      '#E8C070',
  haloColor:     '#AABBCC',
};

export const ELLIPTICAL_PALETTE: EllipticalPalette = {
  coreColor:     '#FFDA80',
  haloColor:     '#8A5040',
  envelopeColor: '#8A7060',
  globularColor: '#FFD8A0',
};

export const IRREGULAR_PALETTE: IrregularPalette = {
  youngStarColor: '#A0C8FF',
  oldStarColor:   '#FFD8A0',
  starburstColor: '#FFB850',
  hiiColor:       '#FF4080',
  dustColor:      '#3A2F28',
};

export const LENTICULAR_PALETTE: LenticularPalette = {
  bulgeColor:     '#CC8844',
  innerDiskColor: '#FFAA44',
  outerDiskColor: '#FFBB55',
  haloColor:      '#AABBCC',
  dustColor:      '#2A2A3E',
};

// ---------------------------------------------------------------------------
// Per-kind raymarch / rendering parameters. Galaxies raymarch a unit cube
// like nebulae (Doc 18 §LOD System — LOD 0 = volumetric particle cloud; LOD
// 1+ = disk texture). This module ships the LOD 0/1 parameters; the
// GalaxyLOD helper picks between the volumetric cube and a camera-facing
// billboard based on distance.
// ---------------------------------------------------------------------------

export interface SpiralParams {
  /** Raymarch step count (quality tier "high"). 56 keeps 4 galaxies under
   *  the 500-draw-call frame budget on mid-tier GPUs. */
  steps: number;
  /** Logarithmic-spiral pitch angle, radians. Doc 22 ENT-6010 #6:
   *  12°–26°, default 18°. */
  pitchAngleRad: number;
  /** Arm count (2 = grand design, 4 = flocculent). Doc 22 ENT-6010 #10. */
  armCount: number;
  /** Arm width (gaussian σ in radians around the spiral curve). */
  armWidth: number;
  /** Disk scale radius (in local units; unit cube is [-1,1]). */
  diskScaleRadius: number;
  /** Disk thickness (gaussian σ in Y). */
  diskThickness: number;
  /** Bulge radius in local units. Doc 22 ENT-6010 #1 ~1 kpc / 10 kpc disk
   *  → 0.10 of the cube half-extent. */
  bulgeRadius: number;
  /** Bulge Sérsic index (~4 classical bulge). */
  bulgeSersic: number;
  /** Bar half-length (0 = unbarred, 0.35 = moderate Milky-Way-like). */
  barLength: number;
  /** T46 ENT-6011: 0 = SA (arms from bulge), 1 = SB (arms from bar ends). */
  barArmAnchor: number;
  /** T46 ENT-6011: nuclear HII ring brightness (0 off, 1 on). */
  nuclearRing: number;
  /** Dust-lane opacity contribution. */
  dustStrength: number;
  /** HII region density (regions per unit spiral arc length). */
  hiiDensity: number;
  /** Galaxy rotation period (sim-sec). Slow — purely cosmetic. */
  rotationPeriod: number;
}

export interface EllipticalParams {
  steps: number;
  /** Ellipticity ε. Doc 22 ENT-6020: E0=0 round, E7=0.7 elongated. */
  ellipticity: number;
  /** Effective radius (half-light) in local units. */
  effectiveRadius: number;
  /** Sérsic index n. de Vaucouleurs = 4. */
  sersicIndex: number;
  /** Core brightening factor (power-law cusp). */
  coreExcess: number;
  /** Outer envelope decay exponent. */
  envelopeFalloff: number;
  /** Globular-cluster visibility (0 = hidden, 1 = visible). */
  globularVisibility: number;
  /** T46 ENT-6022: GC metallicity dial (0 = blue metal-poor, 1 = red). */
  globularMetallicity: number;
  /** T46 ENT-6022: 0 = giant opaque, 1 = dSph ghostly transparent. */
  diffuseness: number;
  /** T46 ENT-6021 dE,N: nucleated cluster strength (0 = smooth). */
  nucleusStrength: number;
}

export interface IrregularParams {
  steps: number;
  /** FBM scale for chaotic density. */
  fbmScale: number;
  /** FBM octave count. */
  fbmOctaves: number;
  /** Number of starburst clumps (visible as bright spots). */
  clumpCount: number;
  /** Clump intensity multiplier. */
  clumpIntensity: number;
  /** Tidal-axis stretch factor along +X. */
  tidalStretch: number;
  /** T46 ENT-6031: 0=Irr I, 1=Irr II extended tidal tail. */
  tidalTailStrength: number;
  /** T46 ENT-6031: fragmented dust patches (0 smooth, 1 chaotic). */
  dustChaos: number;
  /** T46 ENT-6031: dual-core mid-merger density (0 single). */
  dualNucleus: number;
  /** HII-halo opacity contribution. */
  hiiStrength: number;
}

export interface LenticularParams {
  steps: number;
  /** Disk scale radius. */
  diskScaleRadius: number;
  /** Disk thickness gaussian σ (thicker than spiral — kinematically hot). */
  diskThickness: number;
  /** Bulge radius. Doc 17 ENT-6012 (bulge dominance 20–80%). */
  bulgeRadius: number;
  /** Bulge Sérsic index (n=2–4). */
  bulgeSersic: number;
  /** Azimuthal ripple amplitude. Doc 17 `0.1 * sin(3 * θ)`. */
  azimuthalRipple: number;
  /** S0a dust opacity (0 = pure S0, 0.4 = S0a). */
  dustOpacity: number;
}

export const SPIRAL_PARAMS: SpiralParams = {
  steps: 56,
  pitchAngleRad: (18 * Math.PI) / 180,
  armCount: 2,
  armWidth: 0.35,
  diskScaleRadius: 0.75,
  diskThickness: 0.05,
  bulgeRadius: 0.18,
  bulgeSersic: 4,
  barLength: 0.3,
  barArmAnchor: 0.0,
  nuclearRing: 0.0,
  dustStrength: 0.6,
  hiiDensity: 6,
  rotationPeriod: 900,
};

/** Per-subvariant spiral tweaks: SA (unbarred) vs SB (barred). */
export type SpiralSubvariant = 'sa' | 'sb';
export const SPIRAL_SUBVARIANT_PARAMS: Record<SpiralSubvariant, Partial<SpiralParams>> = {
  sa: {
    barLength: 0.0,
    barArmAnchor: 0.0,
    nuclearRing: 0.0,
    pitchAngleRad: (18 * Math.PI) / 180,
  },
  sb: {
    barLength: 0.42,
    barArmAnchor: 1.0,
    nuclearRing: 0.85,
    pitchAngleRad: (22 * Math.PI) / 180,
  },
};

export const ELLIPTICAL_PARAMS: EllipticalParams = {
  steps: 48,
  ellipticity: 0.2,
  effectiveRadius: 0.45,
  sersicIndex: 4,
  coreExcess: 1.3,
  envelopeFalloff: 2.2,
  globularVisibility: 0.9,
  globularMetallicity: 1.0,
  diffuseness: 0.0,
  nucleusStrength: 0.0,
};

/** Giant E / dE / dSph scale-grade presets (T46 ENT-6020/6021/6022). */
export type EllipticalSubvariant = 'giant' | 'de' | 'dsph';
export const ELLIPTICAL_SUBVARIANT_PARAMS: Record<EllipticalSubvariant, Partial<EllipticalParams>> = {
  giant: {
    effectiveRadius: 0.45,
    sersicIndex: 4,
    coreExcess: 1.3,
    envelopeFalloff: 2.2,
    globularVisibility: 0.9,
    globularMetallicity: 1.0,
    diffuseness: 0.0,
    nucleusStrength: 0.0,
  },
  de: {
    effectiveRadius: 0.32,
    sersicIndex: 1.5,          // exponential-to-Sérsic.
    coreExcess: 1.0,
    envelopeFalloff: 2.8,
    globularVisibility: 0.35,
    globularMetallicity: 0.4,  // bluer than giant.
    diffuseness: 0.35,
    nucleusStrength: 1.4,      // dE,N nucleated variant default.
  },
  dsph: {
    effectiveRadius: 0.55,     // very extended halo.
    sersicIndex: 1.0,          // pure exponential.
    coreExcess: 1.0,
    envelopeFalloff: 1.4,
    globularVisibility: 0.55,
    globularMetallicity: 0.0,  // all metal-poor blue.
    diffuseness: 0.8,          // ghost-like.
    nucleusStrength: 0.0,
  },
};

export const IRREGULAR_PARAMS: IrregularParams = {
  steps: 52,
  fbmScale: 2.4,
  fbmOctaves: 4,
  clumpCount: 6,
  clumpIntensity: 2.4,
  tidalStretch: 0.4,
  tidalTailStrength: 0.0,
  dustChaos: 0.0,
  dualNucleus: 0.0,
  hiiStrength: 0.75,
};

/** Irr I / Irr II presets (T46 ENT-6030/6031). */
export type IrregularSubvariant = 'irr-i' | 'irr-ii';
export const IRREGULAR_SUBVARIANT_PARAMS: Record<IrregularSubvariant, Partial<IrregularParams>> = {
  'irr-i': {
    tidalStretch: 0.4,
    tidalTailStrength: 0.0,
    dustChaos: 0.0,
    dualNucleus: 0.0,
  },
  'irr-ii': {
    tidalStretch: 0.8,
    tidalTailStrength: 0.9,
    dustChaos: 0.7,
    dualNucleus: 0.6,
    clumpCount: 5,
  },
};

export const LENTICULAR_PARAMS: LenticularParams = {
  steps: 48,
  diskScaleRadius: 0.65,
  diskThickness: 0.07,
  bulgeRadius: 0.22,
  bulgeSersic: 3,
  azimuthalRipple: 0.08,
  dustOpacity: 0.0,
};

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isGalaxyKind(value: string): value is GalaxyKind {
  return (GALAXY_KINDS as string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Palette RGB helpers — keep tests from re-parsing hex each assertion.
// ---------------------------------------------------------------------------

export function spiralPaletteRgb(): Record<keyof SpiralPalette, RGB> {
  return {
    armColor:      hexToRgb(SPIRAL_PALETTE.armColor),
    interArmColor: hexToRgb(SPIRAL_PALETTE.interArmColor),
    bulgeColor:    hexToRgb(SPIRAL_PALETTE.bulgeColor),
    dustColor:     hexToRgb(SPIRAL_PALETTE.dustColor),
    hiiColor:      hexToRgb(SPIRAL_PALETTE.hiiColor),
    barColor:      hexToRgb(SPIRAL_PALETTE.barColor),
    haloColor:     hexToRgb(SPIRAL_PALETTE.haloColor),
  };
}

export function ellipticalPaletteRgb(): Record<keyof EllipticalPalette, RGB> {
  return {
    coreColor:     hexToRgb(ELLIPTICAL_PALETTE.coreColor),
    haloColor:     hexToRgb(ELLIPTICAL_PALETTE.haloColor),
    envelopeColor: hexToRgb(ELLIPTICAL_PALETTE.envelopeColor),
    globularColor: hexToRgb(ELLIPTICAL_PALETTE.globularColor),
  };
}

export function irregularPaletteRgb(): Record<keyof IrregularPalette, RGB> {
  return {
    youngStarColor: hexToRgb(IRREGULAR_PALETTE.youngStarColor),
    oldStarColor:   hexToRgb(IRREGULAR_PALETTE.oldStarColor),
    starburstColor: hexToRgb(IRREGULAR_PALETTE.starburstColor),
    hiiColor:       hexToRgb(IRREGULAR_PALETTE.hiiColor),
    dustColor:      hexToRgb(IRREGULAR_PALETTE.dustColor),
  };
}

export function lenticularPaletteRgb(): Record<keyof LenticularPalette, RGB> {
  return {
    bulgeColor:     hexToRgb(LENTICULAR_PALETTE.bulgeColor),
    innerDiskColor: hexToRgb(LENTICULAR_PALETTE.innerDiskColor),
    outerDiskColor: hexToRgb(LENTICULAR_PALETTE.outerDiskColor),
    haloColor:      hexToRgb(LENTICULAR_PALETTE.haloColor),
    dustColor:      hexToRgb(LENTICULAR_PALETTE.dustColor),
  };
}

// ---------------------------------------------------------------------------
// T46 — AGN palette (Doc 17 ENT-6040..6044)
// ---------------------------------------------------------------------------

export interface AgnPalette {
  /** Host galaxy old-star yellow. Doc 17 host spiral/elliptical generic. */
  hostColor: string;
  /** Host bulge warm tint. */
  bulgeColor: string;
  /** AGN continuum medium blue (~10^5 K). Doc 17 ENT-6040 `#5588FF`. */
  coreColor: string;
  /** Hot inner accretion disk ~10^6 K. Doc 17 ENT-6040 `#AADDFF`. */
  accretionColor: string;
  /** Dust torus silhouette (Type 2 obscuration). Doc 17 `#1a1a2e`. */
  torusColor: string;
  /** NLR [O III] ionisation cone. Doc 17 ENT-6040 `#4488FF`. */
  nlrColor: string;
  /** Jet synchrotron (radio/optical). Doc 17 ENT-6043 core `#00FFFF`. */
  jetColor: string;
  /** Radio lobe lower-frequency purple. Doc 17 ENT-6042 `#9B59B6`. */
  lobeColor: string;
  /** Host HII region pink. Doc 17 ENT-6040 `#FF6688`. */
  hiiColor: string;
}

export const AGN_PALETTE: AgnPalette = {
  hostColor:      '#FFD8A0',
  bulgeColor:     '#E8C070',
  coreColor:      '#5588FF',
  accretionColor: '#AADDFF',
  torusColor:     '#1A1A2E',
  nlrColor:       '#4488FF',
  jetColor:       '#00DDFF',
  lobeColor:      '#9B59B6',
  hiiColor:       '#FF6688',
};

/** AGN-wide defaults. Per-subvariant overrides live in AGN_SUBVARIANT_PARAMS. */
export interface AgnParams {
  steps: number;
  hostMorphology: number;    // 0 = pure bulge (ellip host), 1 = disk+bulge.
  hostDiskRadius: number;
  hostBulgeRadius: number;
  coreRadius: number;
  coreIntensity: number;
  accretionIntensity: number;
  torusRadius: number;
  torusThickness: number;
  torusStrength: number;
  nlrConeAngle: number;
  nlrStrength: number;
  jetStrength: number;
  jetLength: number;
  jetRadius: number;
  jetAsymmetry: number;
  lobeStrength: number;
  lobeRadius: number;
  variability: number;
}

export const AGN_PARAMS: AgnParams = {
  steps: 56,
  hostMorphology: 1.0,
  hostDiskRadius: 0.55,
  hostBulgeRadius: 0.25,
  coreRadius: 0.045,
  coreIntensity: 2.5,
  accretionIntensity: 1.8,
  torusRadius: 0.18,
  torusThickness: 0.05,
  torusStrength: 0.0,
  nlrConeAngle: 0.52,  // ~30° half-angle.
  nlrStrength: 0.0,
  jetStrength: 0.0,
  jetLength: 0.65,
  jetRadius: 0.06,
  jetAsymmetry: 0.0,
  lobeStrength: 0.0,
  lobeRadius: 0.7,
  variability: 0.15,
};

/** Per-subvariant tweaks layered over {@link AGN_PARAMS}. */
export const AGN_SUBVARIANT_PARAMS: Record<AgnSubvariant, Partial<AgnParams>> = {
  seyfert1: {
    coreIntensity: 3.0,
    accretionIntensity: 2.2,
    torusStrength: 0.0,  // face-on: torus not seen.
    nlrStrength: 0.0,
  },
  seyfert2: {
    coreIntensity: 1.2,
    accretionIntensity: 0.7,
    torusStrength: 1.1,  // edge-on torus obscures inner AGN.
    nlrStrength: 1.0,    // ionisation cone visible.
    jetStrength: 0.0,
  },
  quasar: {
    coreIntensity: 5.0,
    accretionIntensity: 4.0,
    coreRadius: 0.035,
    hostMorphology: 0.3,   // mostly point-like; host dim.
    hostBulgeRadius: 0.15,
    hostDiskRadius: 0.25,
    jetStrength: 0.4,       // radio-loud quasars show a jet.
    jetAsymmetry: 0.4,
    variability: 0.25,
  },
  radio: {
    coreIntensity: 1.4,
    accretionIntensity: 0.9,
    hostMorphology: 0.0,   // elliptical host.
    hostBulgeRadius: 0.35,
    jetStrength: 1.1,
    jetLength: 0.85,
    jetRadius: 0.045,
    lobeStrength: 0.9,
    lobeRadius: 0.75,
    variability: 0.05,
  },
  blazar: {
    coreIntensity: 4.0,
    accretionIntensity: 2.5,
    jetStrength: 1.6,
    jetLength: 0.95,
    jetRadius: 0.05,
    jetAsymmetry: 1.0,     // single +Y beamed jet.
    hostMorphology: 0.2,
    variability: 0.35,
  },
  liner: {
    coreIntensity: 0.5,
    accretionIntensity: 0.2,
    hostMorphology: 0.3,
    hostBulgeRadius: 0.32,
    torusStrength: 0.25,
    nlrStrength: 0.15,
    jetStrength: 0.2,
    jetRadius: 0.035,
    variability: 0.02,
  },
};

// ---------------------------------------------------------------------------
// T46 — Starburst/ULIRG palette (Doc 17 ENT-6050 + ENT-6053)
// ---------------------------------------------------------------------------

export interface StarburstPalette {
  /** Young O/B star blue. Doc 17 ENT-6050 `#5085FF`. */
  youngStarColor: string;
  /** Aging A/F population white. */
  oldStarColor: string;
  /** HII Hα emission. Doc 17 ENT-6050 `#FF3333`. */
  hiiColor: string;
  /** 40 K cool dust. Doc 17 ENT-6050 `#663300`. */
  dustCoolColor: string;
  /** Warm 70–100 K dust. Doc 17 ENT-6050 `#FF8833`. */
  dustWarmColor: string;
  /** Superwind hot gas. Doc 17 ENT-6050 `#99CCFF`. */
  superwindColor: string;
  /** Nuclear starburst cluster. */
  nucleusColor: string;
}

export const STARBURST_PALETTE: StarburstPalette = {
  youngStarColor: '#5085FF',
  oldStarColor:   '#F0F0FF',
  hiiColor:       '#FF3333',
  dustCoolColor:  '#663300',
  dustWarmColor:  '#FF8833',
  superwindColor: '#99CCFF',
  nucleusColor:   '#FFE8B0',
};

export interface StarburstParams {
  steps: number;
  diskRadius: number;
  diskThickness: number;
  nucleusStrength: number;
  hiiClumpCount: number;
  hiiClumpIntensity: number;
  superwindStrength: number;
  superwindAxisReach: number;
  dustStrength: number;
  ulirgBlend: number;
  dualNucleus: number;
}

export const STARBURST_PARAMS: StarburstParams = {
  steps: 56,
  diskRadius: 0.55,
  diskThickness: 0.06,
  nucleusStrength: 1.5,
  hiiClumpCount: 10,
  hiiClumpIntensity: 2.5,
  superwindStrength: 0.7,
  superwindAxisReach: 0.45,
  dustStrength: 0.45,
  ulirgBlend: 0.0,
  dualNucleus: 0.0,
};

export type StarburstSubvariant = 'starburst' | 'ulirg';
export const STARBURST_SUBVARIANT_PARAMS: Record<StarburstSubvariant, Partial<StarburstParams>> = {
  starburst: {
    ulirgBlend: 0.0,
    dualNucleus: 0.0,
    superwindStrength: 0.85,
    nucleusStrength: 1.6,
  },
  ulirg: {
    ulirgBlend: 0.85,
    dualNucleus: 0.9,
    superwindStrength: 0.35,
    nucleusStrength: 2.1,
    dustStrength: 0.75,
  },
};

// ---------------------------------------------------------------------------
// T46 — Morphology-special palette (Doc 17 ENT-6051/6052/6054/6055)
// ---------------------------------------------------------------------------

export interface MorphologySpecialPalette {
  /** Ring/merger shock-front O-star deep blue. Doc 17 ENT-6051 `#0040FF`. */
  shockFrontColor: string;
  /** Ring main body bright blue. Doc 17 ENT-6051 `#4A90E2`. */
  ringBulkColor: string;
  /** Ring trailing / jellyfish middle-tail white. Doc 17 ENT-6051 `#FFFFFF`. */
  trailColor: string;
  /** Ring nucleus / UDG old core tan. Doc 17 ENT-6051 `#FFD9B3`. */
  nucleusColor: string;
  /** Ring dust lane dark brown. Doc 17 ENT-6051 `#4D3300`. */
  dustColor: string;
  /** Hα ionised gas. Doc 17 ENT-6051 `#FF6666`. */
  gasColor: string;
  /** UDG faint stellar halo. Doc 17 ENT-6054 `#C9976B`. */
  udgColor: string;
  /** UDG metal-poor globular cluster blue. Doc 17 ENT-6054 `#6688DD`. */
  gcColor: string;
  /** Merger tidal-tail aged stars. Doc 17 ENT-6055 `#FF8866`. */
  tidalTailColor: string;
  /** Merger starburst yellow core. Doc 17 ENT-6055 `#FFD700`. */
  brightCoreColor: string;
}

export const MORPHOLOGY_SPECIAL_PALETTE: MorphologySpecialPalette = {
  shockFrontColor: '#0040FF',
  ringBulkColor:   '#4A90E2',
  trailColor:      '#FFFFFF',
  nucleusColor:    '#FFD9B3',
  dustColor:       '#4D3300',
  gasColor:        '#FF6666',
  udgColor:        '#C9976B',
  gcColor:         '#6688DD',
  tidalTailColor:  '#FF8866',
  brightCoreColor: '#FFD700',
};

export interface MorphologySpecialParams {
  steps: number;
  // Ring
  ringRadius: number;
  ringWidth: number;
  ringSpokes: number;
  ringNucleus: number;
  ringExpansion: number;
  // Jellyfish
  jellyTailLength: number;
  jellyCompression: number;
  jellyTailClumps: number;
  // UDG
  udgHaloRadius: number;
  udgGcCount: number;
  udgNucleated: number;
  // Merging
  mergerSeparation: number;
  mergerStage: number;
  mergerTailLength: number;
}

export const MORPHOLOGY_SPECIAL_PARAMS: MorphologySpecialParams = {
  steps: 56,
  ringRadius: 0.55,
  ringWidth: 0.08,
  ringSpokes: 0.0,
  ringNucleus: 1.0,
  ringExpansion: 1.0,
  jellyTailLength: 0.55,
  jellyCompression: 1.8,
  jellyTailClumps: 0.6,
  udgHaloRadius: 0.55,
  udgGcCount: 14,
  udgNucleated: 0.7,
  mergerSeparation: 0.28,
  mergerStage: 1.0,
  mergerTailLength: 0.45,
};

export type SpecialSubvariantKey = SpecialSubvariant;

export const SPECIAL_SUBVARIANT_PARAMS: Record<SpecialSubvariant, Partial<MorphologySpecialParams>> = {
  ring: {
    ringSpokes: 0.4,        // Cartwheel-ish — mild spokes by default.
    ringNucleus: 1.0,
  },
  jellyfish: {},
  udg: {},
  merging: {
    mergerStage: 1.2,
  },
};
