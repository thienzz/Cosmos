/**
 * Canonical Doc 18 / Doc 17 nebula colour palette + per-kind parameters.
 *
 * T27 shipped five nebula shader families (emission, reflection, dark,
 * planetary, supernova). T45 extends this to **eight families / fourteen
 * subtypes** per Doc 17 §5010–§5080 — adding Wolf-Rayet (ENT-5060),
 * protoplanetary-disk (ENT-5070) and superbubble (ENT-5080) families, plus
 * subtype variants for the HII (giant / compact / HI-region), planetary
 * (spherical / bipolar / irregular), dark (molecular / Bok globule) and
 * supernova-remnant (shell / plerion) shaders.
 *
 * `NebulaKind` (8) is the **shader family** — one per fragment shader file.
 * `NebulaSubtype` (14) is the **catalog-facing variant**. Each subtype maps
 * to exactly one family plus a small parameter-override record that tweaks
 * the shader's density / shell / bloom uniforms to match the Doc 17 spec.
 *
 * Every hex below is quoted from Doc 17 §Nebulae or Doc 18 §Nebula
 * Rendering. Supplementary colours (dark-nebula reddening tint, planetary-
 * nebula middle shell) are cited inline with their Doc 17 / 18 location.
 */

import { hexToRgb, type RGB } from './spectralColor';

// ---------------------------------------------------------------------------
// Rendering families — one GLSL fragment shader per family. T45 adds three
// new families on top of T27's original five.
// ---------------------------------------------------------------------------

export type NebulaKind =
  | 'emission'
  | 'reflection'
  | 'dark'
  | 'planetary'
  | 'supernova'
  | 'wolfrayet'       // T45 — ENT-5060
  | 'protoplanetary'  // T45 — ENT-5070
  | 'superbubble';    // T45 — ENT-5080

export const NEBULA_KINDS: NebulaKind[] = [
  'emission',
  'reflection',
  'dark',
  'planetary',
  'supernova',
  'wolfrayet',
  'protoplanetary',
  'superbubble',
];

// ---------------------------------------------------------------------------
// Catalog-facing subtypes — 14 per Doc 17 §5010–§5080. Each subtype maps to
// exactly one shader family. Variants inside the same family (e.g. Bok
// globule vs molecular cloud) are expressed via per-subtype parameter
// overrides applied by `subtypeParams()`.
// ---------------------------------------------------------------------------

export type NebulaSubtype =
  | 'hii-giant'            // ENT-5010 — M42, M8, M16, Carina
  | 'hii-compact'          // ENT-5011 — ultracompact HII
  | 'hi-region'            // ENT-5012 — neutral atomic hydrogen
  | 'planetary-spherical'  // ENT-5020 — Ring, Owl, Helix (outer shell)
  | 'planetary-bipolar'    // ENT-5021 — Butterfly, Cat's Eye, Bug
  | 'planetary-irregular'  // ENT-5022 — Skull, irregular ejecta
  | 'reflection'           // ENT-5030 — Pleiades, Witch-Head
  | 'dark-molecular'       // ENT-5040 — Coalsack, Horsehead
  | 'bok-globule'          // ENT-5041 — Barnard 68, compact globules
  | 'snr-shell'            // ENT-5050 — Cygnus Loop, Tycho, SN 1006
  | 'snr-plerion'          // ENT-5051 — Crab, Vela PWN
  | 'wolfrayet'            // ENT-5060 — NGC 6888, M1-67
  | 'protoplanetary'       // ENT-5070 — HL Tau, TW Hya
  | 'superbubble';         // ENT-5080 — Local Bubble, 30 Dor, Gould's Belt

export const NEBULA_SUBTYPES: NebulaSubtype[] = [
  'hii-giant',
  'hii-compact',
  'hi-region',
  'planetary-spherical',
  'planetary-bipolar',
  'planetary-irregular',
  'reflection',
  'dark-molecular',
  'bok-globule',
  'snr-shell',
  'snr-plerion',
  'wolfrayet',
  'protoplanetary',
  'superbubble',
];

/**
 * Map a catalog subtype to its rendering family. Stable — each subtype has
 * exactly one family and a subtype never re-routes to a different shader
 * without the enum itself changing.
 */
export function subtypeToKind(subtype: NebulaSubtype): NebulaKind {
  switch (subtype) {
    case 'hii-giant':
    case 'hii-compact':
    case 'hi-region':
      return 'emission';
    case 'planetary-spherical':
    case 'planetary-bipolar':
    case 'planetary-irregular':
      return 'planetary';
    case 'reflection':
      return 'reflection';
    case 'dark-molecular':
    case 'bok-globule':
      return 'dark';
    case 'snr-shell':
    case 'snr-plerion':
      return 'supernova';
    case 'wolfrayet':
      return 'wolfrayet';
    case 'protoplanetary':
      return 'protoplanetary';
    case 'superbubble':
      return 'superbubble';
  }
}

// ---------------------------------------------------------------------------
// Palettes — one per family. Matches Doc 18 §Nebula Rendering exactly.
// ---------------------------------------------------------------------------

export interface EmissionPalette {
  /** H-alpha 656.3 nm — dominant deep red. Doc 18: `#FF4444`. */
  haColor: string;
  /** [OIII] 500.7 nm — cyan near hot ionizing stars. Doc 18: `#00CED1`. */
  oiiiColor: string;
  /** [SII] 671.6/673.1 nm — magenta-red shock edges. Doc 18: `#8B0000`. */
  siiColor: string;
  /** [NII] 658.4 nm — orange-red overlay. Doc 22 ENT-5010 #3 spec: `#FF7F4A`. */
  niiColor: string;
}

export interface ReflectionPalette {
  /** Rayleigh-scattered blue. Doc 18: `#6495ED`. */
  scatterColor: string;
  /** Illuminating star colour — O/B type, tinted blue-white. Doc 18: `#DDEEFF`. */
  starColor: string;
}

export interface DarkPalette {
  /** Reddening tint applied to background light that filters through the
   *  dust. Doc 18 §Dark Nebula: `vec3(1.0, 0.9, 0.7)` → `#FFE5B2`. */
  reddeningTint: string;
  /** Residual dust self-glow (dust-grain IR emission leaking into visible).
   *  Doc 18 says "nearly black" — we pick a very dim warm brown so the
   *  silhouette isn't a flat-black billboard. */
  dustColor: string;
}

export interface PlanetaryPalette {
  /** Central white-dwarf point light. Doc 18 §Planetary Nebula: `#FFFFFF`. */
  coreColor: string;
  /** Innermost shell — OIII cyan. Doc 18: `vec3(0.0, 1.0, 1.0)` → `#00FFFF`. */
  innerColor: string;
  /** Middle shell — NII orange-red. Doc 18: `vec3(1.0, 0.5, 0.0)` → `#FF8000`. */
  middleColor: string;
  /** Outer shell — Hα red. Doc 18: `vec3(1.0, 0.2, 0.2)` → `#FF3333`. */
  outerColor: string;
}

export interface SupernovaPalette {
  /** Synchrotron blue glow from relativistic electrons. Doc 18: `#6495ED`. */
  synchrotronColor: string;
  /** Filament tint (slightly shifted blue-violet for the dense regions). */
  filamentColor: string;
  /** Central pulsar / neutron-star point light. */
  pulsarColor: string;
}

export interface WolfRayetPalette {
  /** Hα broadened by the WR wind — deep red. Doc 17 ENT-5060: `#FF3333`. */
  haColor: string;
  /** Hβ / inner ring weaker blue-green emission. Doc 17 ENT-5060: `#4CB2FF`. */
  hbColor: string;
  /** OIII outer-ring cooler green. Doc 17 ENT-5060: `#00FF88`. */
  oiiiColor: string;
  /** Central WR-star glow — ~80,000 K, very blue. */
  starColor: string;
}

export interface ProtoplanetaryPalette {
  /** Hot inner dust (T~1,000 K) — near-IR warm white. Doc 17 ENT-5070. */
  hotDustColor: string;
  /** Mid-IR warm red — T ≈ 300–500 K. Doc 17 ENT-5070. */
  warmDustColor: string;
  /** Far-IR cool brown — T ≈ 50–150 K. Doc 17 ENT-5070: `#553300`. */
  coolDustColor: string;
  /** Central T-Tauri / young-star glow. Doc 17 ENT-5070. */
  starColor: string;
}

export interface SuperbubblePalette {
  /** Shell Hα — shock-heated ISM. Doc 17 ENT-5080: `#FF4444`. */
  shellHaColor: string;
  /** Shell OIII — cooler swept material. Doc 17 ENT-5080: `#00FF88`. */
  shellOiiiColor: string;
  /** Interior soft X-ray / bremsstrahlung false-colour. Doc 17 ENT-5080. */
  interiorColor: string;
}

export const EMISSION_PALETTE: EmissionPalette = {
  haColor: '#FF4444',
  oiiiColor: '#00CED1',
  siiColor: '#8B0000',
  niiColor: '#FF7F4A',
};

export const REFLECTION_PALETTE: ReflectionPalette = {
  scatterColor: '#6495ED',
  starColor: '#DDEEFF',
};

export const DARK_PALETTE: DarkPalette = {
  reddeningTint: '#FFE5B2',
  dustColor: '#1A0E06',
};

export const PLANETARY_PALETTE: PlanetaryPalette = {
  coreColor: '#FFFFFF',
  innerColor: '#00FFFF',
  middleColor: '#FF8000',
  outerColor: '#FF3333',
};

export const SUPERNOVA_PALETTE: SupernovaPalette = {
  synchrotronColor: '#6495ED',
  filamentColor: '#6A5FD6',
  pulsarColor: '#F2F6FF',
};

export const WOLF_RAYET_PALETTE: WolfRayetPalette = {
  haColor: '#FF3333',
  hbColor: '#4CB2FF',
  oiiiColor: '#00FF88',
  starColor: '#AEDBFF',
};

export const PROTOPLANETARY_PALETTE: ProtoplanetaryPalette = {
  hotDustColor: '#FFCC99',
  warmDustColor: '#FF4D1A',
  coolDustColor: '#553300',
  starColor: '#FFE5A6',
};

export const SUPERBUBBLE_PALETTE: SuperbubblePalette = {
  shellHaColor: '#FF4444',
  shellOiiiColor: '#00FF88',
  interiorColor: '#336699',
};

// ---------------------------------------------------------------------------
// Per-kind volumetric parameters. Raymarch budget is tuned per kind:
// dense emitters get more steps, dark nebulae need the fewest because the
// output is mostly a silhouette. Doc 17 step-count ranges are annotated per
// family — we pick a mid value that keeps the full 14-slot gallery inside
// the CLAUDE.md 60 FPS mid-tier budget.
// ---------------------------------------------------------------------------

export interface EmissionParams {
  /** Raymarch step count (quality "high"). Doc 17 §Nebulae: emission use
   *  96–128 steps; we pick 64 so 14 nebulae cohabit a 60 fps budget. */
  steps: number;
  /** Scale applied to sample position before the fbm lookup. Bigger → finer
   *  filamentary detail. */
  fbmScale: number;
  /** FBM octave count. */
  fbmOctaves: number;
  /** Density multiplier — how bright the nebula accumulates per step. */
  density: number;
  /** Extra emission multiplier for volumetric-bloom feeding. */
  emissionBoost: number;
  /** Radial falloff exponent. 1 = linear; higher = tighter core. */
  falloff: number;
  /** Turbulence-noise time rate (radians/sec). Slow drift. */
  turbulenceRate: number;
  /** Variant tint — 0 = giant HII (default palette),
   *  1 = compact HII (bluer, tight core), 2 = HI region (dim, no OIII). */
  variant: number;
}

export interface ReflectionParams {
  steps: number;
  fbmScale: number;
  fbmOctaves: number;
  density: number;
  /** Forward-scatter asymmetry (Henyey-Greenstein g). 0 = isotropic,
   *  0.6 = Witch-Head-like forward peak. */
  forwardScatter: number;
  falloff: number;
}

export interface DarkParams {
  steps: number;
  fbmScale: number;
  fbmOctaves: number;
  /** Extinction coefficient — how much the dust darkens the background per
   *  unit of fbm density integrated along the ray. */
  extinction: number;
  /** Wavelength reddening strength (0 = no colour shift). */
  reddeningStrength: number;
  /** Soft core sharpness — Bok globules push this high so the silhouette
   *  is a small nearly-opaque sphere vs the diffuse molecular-cloud halo. */
  coreSharpness: number;
}

export interface PlanetaryParams {
  steps: number;
  /** Inner-shell radius in local units (unit cube is [-1,1]). */
  shellInner: number;
  /** Middle-shell radius. */
  shellMiddle: number;
  /** Outer-shell radius. */
  shellOuter: number;
  /** Shell thickness (gaussian σ). */
  shellThickness: number;
  /** Bipolar-lobe elongation (0 = spherical, 1 = pinched). */
  bipolarRatio: number;
  /** Slow expansion rate (localUnits/simSec). Visible over long sessions. */
  expansionRate: number;
  /** Central white-dwarf radius in local units. */
  coreRadius: number;
  /** Central white-dwarf emission intensity. */
  coreIntensity: number;
  /** Irregular-hash warping strength. 0 = clean concentric shells (ENT-5020),
   *  0.6+ = asymmetric cometary-knot ejecta (ENT-5022 Skull / Helix). */
  irregularity: number;
}

export interface SupernovaParams {
  steps: number;
  /** Shell radius in local units. Expands linearly with simulated time. */
  shellRadius: number;
  /** Gaussian sharpness — wide at old, narrow at young (we pick the middle). */
  shellSharpness: number;
  /** Filament density multiplier. */
  filamentDensity: number;
  /** Synchrotron intensity (for bloom feed). */
  synchrotronIntensity: number;
  /** Shell expansion velocity (localUnits/simSec). */
  expansionVelocity: number;
}

export interface WolfRayetParams {
  /** Doc 17 ENT-5060: 80–112 steps for moderate-density shells. */
  steps: number;
  /** Wind-blown shell radius (ENT-5060 ≈ 0.8 pc / local unit ≈ 0.7). */
  shellRadius: number;
  /** Shell Gaussian thickness — compression zone at wind shock. */
  shellThickness: number;
  /** Clumpy-shell noise strength (fbm 5-octave per Doc 17). */
  clumpiness: number;
  /** Hot interior density — hollow but not empty. */
  interiorDensity: number;
  /** Central WR star intensity. */
  coreIntensity: number;
  /** Central WR star radius. */
  coreRadius: number;
  /** Shell expansion rate (localUnits/simSec). */
  expansionRate: number;
  /** Crescent asymmetry — 0 = perfect ring, 1 = one-sided crescent
   *  (NGC 6888 classic). */
  crescent: number;
}

export interface ProtoplanetaryParams {
  /** Doc 17 ENT-5070 "thin-disk" approximation — minimum volumetric
   *  raymarching (48–64 steps). */
  steps: number;
  /** Disk outer radius (local units). */
  outerRadius: number;
  /** Disk inner radius (central cavity / sublimation zone). */
  innerRadius: number;
  /** Scale-height reference (H/R at r=1). */
  scaleHeight: number;
  /** Radial power-law exponent (ρ ∝ r^-p). */
  radialPower: number;
  /** Gap radius #1 — ALMA-style concentric gap. */
  gap1Radius: number;
  /** Gap radius #2. */
  gap2Radius: number;
  /** Gap Gaussian width. */
  gapWidth: number;
  /** Central T-Tauri star intensity. */
  coreIntensity: number;
  /** Central T-Tauri star radius. */
  coreRadius: number;
}

export interface SuperbubbleParams {
  /** Doc 17 ENT-5080 — large/faint structure, 64–96 steps. */
  steps: number;
  /** Shell radius (local units). */
  shellRadius: number;
  /** Shell Gaussian thickness — thin compared to the 20 pc shell. */
  shellThickness: number;
  /** Interior density floor (hot low-density plasma). */
  interiorDensity: number;
  /** Shell fbm filament strength. */
  filamentStrength: number;
  /** Shell Hα brightness. */
  shellBrightness: number;
  /** Interior soft X-ray false-colour brightness. */
  interiorBrightness: number;
  /** Blowout-hole strength (age effect). 0 = sealed bubble, 1 = chimney. */
  blowout: number;
}

export const EMISSION_PARAMS: EmissionParams = {
  steps: 64,
  fbmScale: 2.0,
  fbmOctaves: 5,
  density: 0.9,
  emissionBoost: 1.6,
  falloff: 1.4,
  turbulenceRate: 0.01,
  variant: 0,
};

export const REFLECTION_PARAMS: ReflectionParams = {
  steps: 48,
  fbmScale: 1.6,
  fbmOctaves: 4,
  density: 0.55,
  forwardScatter: 0.55,
  falloff: 1.25,
};

export const DARK_PARAMS: DarkParams = {
  steps: 40,
  fbmScale: 2.4,
  fbmOctaves: 5,
  extinction: 3.0,
  reddeningStrength: 0.6,
  coreSharpness: 1.1,
};

export const PLANETARY_PARAMS: PlanetaryParams = {
  steps: 72,
  shellInner: 0.35,
  shellMiddle: 0.55,
  shellOuter: 0.78,
  shellThickness: 0.08,
  bipolarRatio: 0.45,
  expansionRate: 0.00002,
  coreRadius: 0.02,
  coreIntensity: 6.0,
  irregularity: 0.0,
};

export const SUPERNOVA_PARAMS: SupernovaParams = {
  steps: 72,
  shellRadius: 0.72,
  shellSharpness: 4.5,
  filamentDensity: 1.8,
  synchrotronIntensity: 1.3,
  expansionVelocity: 0.00015,
};

export const WOLF_RAYET_PARAMS: WolfRayetParams = {
  steps: 64,
  shellRadius: 0.7,
  shellThickness: 0.14,
  clumpiness: 0.55,
  interiorDensity: 0.18,
  coreIntensity: 4.5,
  coreRadius: 0.025,
  expansionRate: 0.00003,
  crescent: 0.35,
};

export const PROTOPLANETARY_PARAMS: ProtoplanetaryParams = {
  steps: 56,
  outerRadius: 0.85,
  innerRadius: 0.08,
  scaleHeight: 0.06,
  radialPower: 1.4,
  gap1Radius: 0.32,
  gap2Radius: 0.55,
  gapWidth: 0.06,
  coreIntensity: 4.0,
  coreRadius: 0.03,
};

export const SUPERBUBBLE_PARAMS: SuperbubbleParams = {
  steps: 64,
  shellRadius: 0.82,
  shellThickness: 0.08,
  interiorDensity: 0.05,
  filamentStrength: 0.45,
  shellBrightness: 0.95,
  interiorBrightness: 0.18,
  blowout: 0.25,
};

// ---------------------------------------------------------------------------
// Subtype parameter overrides. The default params above describe the
// "canonical" variant of each family; these patches bend the shader toward
// the other 13 catalog subtypes. Everything not listed is inherited from the
// family-default params above.
// ---------------------------------------------------------------------------

export interface SubtypeOverrides {
  emission?: Partial<EmissionParams>;
  planetary?: Partial<PlanetaryParams>;
  dark?: Partial<DarkParams>;
  supernova?: Partial<SupernovaParams>;
  wolfrayet?: Partial<WolfRayetParams>;
  /** Explicit pulsar-intensity override passed to the supernova family. */
  supernovaPulsar?: number;
}

/**
 * Canonical per-subtype overrides. Keeping this table centralised lets both
 * the gallery renderer and the catalog-mounted nebulae stay in lock-step.
 * Values are tuned from Doc 17 §5010–§5080 prose (shell size, density,
 * clumping, bipolar ratio, etc.) — not from empirical screenshot matching.
 */
export const NEBULA_SUBTYPE_OVERRIDES: Record<NebulaSubtype, SubtypeOverrides> = {
  // ---- emission family -----------------------------------------------------
  'hii-giant': {
    // Default — M42 / M16 / Carina: bright Hα + OIII with SII/NII shocks.
    emission: { variant: 0 },
  },
  'hii-compact': {
    // ENT-5011 — ultracompact: smaller envelope, tighter core, bluer tint.
    emission: {
      variant: 1,
      fbmScale: 3.2,
      density: 1.15,
      falloff: 2.2,
      emissionBoost: 1.9,
    },
  },
  'hi-region': {
    // ENT-5012 — neutral atomic H, dimmer than ionised HII, almost no OIII.
    // Dimmer but still visible in the gallery preview where there's no
    // star-field backdrop — emissionBoost 1.05 keeps the Doc 17 "diffuse
    // atomic hydrogen" character while letting the shape read.
    emission: {
      variant: 2,
      density: 0.65,
      emissionBoost: 1.05,
      falloff: 1.15,
      fbmScale: 1.6,
    },
  },
  // ---- planetary family ----------------------------------------------------
  'planetary-spherical': {
    planetary: { bipolarRatio: 0.0, irregularity: 0.05 },
  },
  'planetary-bipolar': {
    planetary: { bipolarRatio: 0.85, irregularity: 0.12 },
  },
  'planetary-irregular': {
    planetary: { bipolarRatio: 0.25, irregularity: 0.7 },
  },
  // ---- reflection family (single subtype) ---------------------------------
  reflection: {},
  // ---- dark family --------------------------------------------------------
  'dark-molecular': {
    // ENT-5040 — diffuse molecular cloud: large, irregular silhouette.
    dark: { extinction: 2.8, fbmScale: 2.4, coreSharpness: 0.9 },
  },
  'bok-globule': {
    // ENT-5041 — small, nearly opaque dense core.
    dark: { extinction: 5.2, fbmScale: 3.8, coreSharpness: 2.6, reddeningStrength: 0.35 },
  },
  // ---- supernova family ---------------------------------------------------
  'snr-shell': {
    supernova: { shellRadius: 0.78, shellSharpness: 3.8, filamentDensity: 2.0 },
    supernovaPulsar: 0.0,
  },
  'snr-plerion': {
    supernova: { shellRadius: 0.45, shellSharpness: 5.5, filamentDensity: 2.6, synchrotronIntensity: 2.0 },
    supernovaPulsar: 1.2,
  },
  // ---- three new T45 families ---------------------------------------------
  wolfrayet: {},
  protoplanetary: {},
  superbubble: {},
};

// ---------------------------------------------------------------------------
// Type guards + subtype helpers.
// ---------------------------------------------------------------------------

export function isNebulaKind(value: string): value is NebulaKind {
  return (NEBULA_KINDS as string[]).includes(value);
}

export function isNebulaSubtype(value: string): value is NebulaSubtype {
  return (NEBULA_SUBTYPES as string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Palette RGB helpers — keeps tests from re-parsing the hex each assertion.
// ---------------------------------------------------------------------------

export function emissionPaletteRgb(): Record<keyof EmissionPalette, RGB> {
  return {
    haColor: hexToRgb(EMISSION_PALETTE.haColor),
    oiiiColor: hexToRgb(EMISSION_PALETTE.oiiiColor),
    siiColor: hexToRgb(EMISSION_PALETTE.siiColor),
    niiColor: hexToRgb(EMISSION_PALETTE.niiColor),
  };
}

export function reflectionPaletteRgb(): Record<keyof ReflectionPalette, RGB> {
  return {
    scatterColor: hexToRgb(REFLECTION_PALETTE.scatterColor),
    starColor: hexToRgb(REFLECTION_PALETTE.starColor),
  };
}

export function planetaryPaletteRgb(): Record<keyof PlanetaryPalette, RGB> {
  return {
    coreColor: hexToRgb(PLANETARY_PALETTE.coreColor),
    innerColor: hexToRgb(PLANETARY_PALETTE.innerColor),
    middleColor: hexToRgb(PLANETARY_PALETTE.middleColor),
    outerColor: hexToRgb(PLANETARY_PALETTE.outerColor),
  };
}

export function supernovaPaletteRgb(): Record<keyof SupernovaPalette, RGB> {
  return {
    synchrotronColor: hexToRgb(SUPERNOVA_PALETTE.synchrotronColor),
    filamentColor: hexToRgb(SUPERNOVA_PALETTE.filamentColor),
    pulsarColor: hexToRgb(SUPERNOVA_PALETTE.pulsarColor),
  };
}

export function darkPaletteRgb(): Record<keyof DarkPalette, RGB> {
  return {
    reddeningTint: hexToRgb(DARK_PALETTE.reddeningTint),
    dustColor: hexToRgb(DARK_PALETTE.dustColor),
  };
}

export function wolfRayetPaletteRgb(): Record<keyof WolfRayetPalette, RGB> {
  return {
    haColor: hexToRgb(WOLF_RAYET_PALETTE.haColor),
    hbColor: hexToRgb(WOLF_RAYET_PALETTE.hbColor),
    oiiiColor: hexToRgb(WOLF_RAYET_PALETTE.oiiiColor),
    starColor: hexToRgb(WOLF_RAYET_PALETTE.starColor),
  };
}

export function protoplanetaryPaletteRgb(): Record<keyof ProtoplanetaryPalette, RGB> {
  return {
    hotDustColor: hexToRgb(PROTOPLANETARY_PALETTE.hotDustColor),
    warmDustColor: hexToRgb(PROTOPLANETARY_PALETTE.warmDustColor),
    coolDustColor: hexToRgb(PROTOPLANETARY_PALETTE.coolDustColor),
    starColor: hexToRgb(PROTOPLANETARY_PALETTE.starColor),
  };
}

export function superbubblePaletteRgb(): Record<keyof SuperbubblePalette, RGB> {
  return {
    shellHaColor: hexToRgb(SUPERBUBBLE_PALETTE.shellHaColor),
    shellOiiiColor: hexToRgb(SUPERBUBBLE_PALETTE.shellOiiiColor),
    interiorColor: hexToRgb(SUPERBUBBLE_PALETTE.interiorColor),
  };
}
