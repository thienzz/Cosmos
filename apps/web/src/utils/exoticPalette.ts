/**
 * Canonical Doc 18 exotic-object colour palette + per-kind parameters.
 *
 * Doc references:
 *   - Doc 17 §ENT-1020 (Pulsar), §ENT-1030/1032 (Black Hole), §ENT-1031 (Magnetar).
 *   - Doc 18 §Neutron Star / Pulsar + §Black Hole.
 *   - Doc 22 §Exotic Objects — ENT-1020 (Pulsar) toggle table,
 *     ENT-1030 (Black Hole) toggle table, ENT-8010 (Magnetar) toggle table.
 *
 * ExoticMaterial pipes these values into the 3 fragment shaders as uniforms;
 * unit tests read them back to assert the hex round-trips lossless (TS-VQA-006
 * black-hole disk ΔE76 < 8.0).
 */

import { hexToRgb, type RGB } from './spectralColor';

export type ExoticKind =
  | 'blackhole'
  | 'pulsar'
  | 'magnetar'
  // T48.1 compact-family variants (share `exotic-compact.frag` via #define).
  | 'quark'
  | 'strange'
  | 'preon'
  | 'boson'
  | 'gravastar'
  // T48.1 GR-extreme variants (share `exotic-gr-extreme.frag`).
  | 'whitehole'
  | 'wormhole'
  | 'nakedsingularity'
  // T48.1 standalone families.
  | 'cosmicstring'
  | 'darkmatterhalo'
  | 'darkenergyvoid'
  | 'tzo'
  | 'primordialbh'
  | 'quasistar'
  | 'planckstar';

export const EXOTIC_KINDS: ExoticKind[] = [
  'blackhole',
  'pulsar',
  'magnetar',
  'quark',
  'strange',
  'preon',
  'boson',
  'gravastar',
  'whitehole',
  'wormhole',
  'nakedsingularity',
  'cosmicstring',
  'darkmatterhalo',
  'darkenergyvoid',
  'tzo',
  'primordialbh',
  'quasistar',
  'planckstar',
];

/**
 * Doc 22 §2.1 — speculative kinds (confidence ≥ 4) default OFF in the
 * InfoPanel and carry the `[SPECULATIVE]` label. Shaders always render;
 * this list is used by the UI to initialise toggle state.
 */
export const SPECULATIVE_EXOTIC_KINDS: ReadonlySet<ExoticKind> = new Set([
  'preon',
  'boson',
  'gravastar',
  'whitehole',
  'wormhole',
  'nakedsingularity',
  'planckstar',
]);

// ---------------------------------------------------------------------------
// Palettes — Doc 18 / Doc 22 verbatim.
// ---------------------------------------------------------------------------

export interface BlackHolePalette {
  /** Event horizon shadow (Doc 18: `vec4(0, 0, 0, 1)` — pure black). */
  horizonColor: string;
  /** Photon sphere / Einstein ring (Doc 18 §Photon Sphere Glow: `#DDEEFF`
   *  "bright white-blue"). */
  photonRingColor: string;
  /** Innermost disk (ISCO): ~10⁶ K → blue-white. Doc 17 ENT-1032: `#FFFFFF`
   *  inner; Doc 22 ENT-1030 gradient "#FFFFFF → #FF4A1A". */
  diskInnerColor: string;
  /** Mid disk (~10⁵ K): yellow-white. Doc 17 §accretion disk: `#FFDDAA`. */
  diskMidColor: string;
  /** Outer disk (~10⁴ K): orange. Doc 17 §accretion disk: `#FF9966` — the
   *  mid-point of the "#FF9966 to #FFAA33" orange band. */
  diskOuterColor: string;
  /** Relativistic jet — synchrotron blue (Doc 18 §Relativistic Jets:
   *  `vec3(0.4, 0.7, 1.0)` ≈ `#66B2FF`; Doc 17 ENT-1032: `#0099FF → #00CCFF`;
   *  we pick #4A8BFF which round-trips cleanly and sits in the overlap). */
  jetColor: string;
}

export interface PulsarPalette {
  /** Ultra-hot neutron-star surface (~10⁶ K). Doc 22 ENT-1020 §Surface:
   *  `#E0F0FF` blue-white. */
  coreColor: string;
  /** Rotating emission beam (Doc 22 ENT-1020 §Emission: `#C0D8FF` to
   *  `#FFFFFF`, matching the Crab pulsar optical colour). */
  beamColor: string;
  /** Magnetic polar-cap hotspot (Doc 22 ENT-1020 §Surface: `#FF8B7B`). */
  polarCapColor: string;
  /** Pulsar wind nebula (Doc 22 ENT-1020 §PWN: `#4A90E2` teal/blue; Doc 18
   *  §Pulsar Wind Nebula: `#AAAAFF` synchrotron — we use the Doc 22 value
   *  as the primary so PWN stays distinct from the beam palette). */
  windNebulaColor: string;
  /** Field-line visualisation tint (Doc 22 ENT-1020 §Magnetic: `#4169E1`
   *  royal blue). */
  fieldColor: string;
}

export interface MagnetarPalette {
  /** Iron-crust neutron-star surface. Doc 22 ENT-8010 §Compact Surface:
   *  `#FFFAF0` tan. */
  surfaceColor: string;
  /** Strongest field-intensity tint (Doc 22 ENT-8010 §MagField: `#FFD700`
   *  gold at field-strength maxima). */
  fieldHotColor: string;
  /** Lowest field-intensity tint (Doc 22 ENT-8010 §MagField: `#FF3030` red
   *  at the weaker equatorial field regions). */
  fieldCoolColor: string;
  /** Polar-cap thermal hotspot. Doc 22 ENT-8010 §Poles: `#FF6050` orange-red. */
  polarCapColor: string;
  /** Magnetic-reconnection flare highlight. Doc 22 ENT-8010 §Starquake:
   *  `#A8D8F0` blue-white energetic particles. */
  reconnectionColor: string;
}

export const BLACK_HOLE_PALETTE: BlackHolePalette = {
  horizonColor: '#000000',
  photonRingColor: '#DDEEFF',
  diskInnerColor: '#FFFFFF',
  diskMidColor: '#FFDDAA',
  diskOuterColor: '#FF9966',
  jetColor: '#4A8BFF',
};

export const PULSAR_PALETTE: PulsarPalette = {
  coreColor: '#E0F0FF',
  beamColor: '#C0D8FF',
  polarCapColor: '#FF8B7B',
  windNebulaColor: '#4A90E2',
  fieldColor: '#4169E1',
};

export const MAGNETAR_PALETTE: MagnetarPalette = {
  surfaceColor: '#FFFAF0',
  fieldHotColor: '#FFD700',
  fieldCoolColor: '#FF3030',
  polarCapColor: '#FF6050',
  reconnectionColor: '#A8D8F0',
};

// ---------------------------------------------------------------------------
// Per-kind volumetric parameters. All raymarches are over the unit cube
// [-1, 1]³ (same convention as T27 nebulae); radii / axes below are in that
// local frame.
// ---------------------------------------------------------------------------

export interface BlackHoleParams {
  /** Raymarch step count. Doc 18 §Black Hole calls out 3.0 ms budget at 1 draw
   *  call for the full lensing + disk + jets pipeline; 64 steps in a shared
   *  cube fits mid-tier. */
  steps: number;
  /** Schwarzschild horizon radius in local units. Doc 22 ENT-1030: "r_s ~
   *  30 km" — we pick 0.15 of the cube so the disk has room to extend. */
  horizonRadius: number;
  /** Photon-ring radius (1.5 × r_s per Doc 18 §Einstein Ring). */
  photonRingRadius: number;
  /** Photon-ring gaussian σ. Thin bright rim. */
  photonRingThickness: number;
  /** Inner disk radius (ISCO = 6M/c² ≈ 2× r_s). */
  diskInnerRadius: number;
  /** Outer disk truncation radius. */
  diskOuterRadius: number;
  /** Disk vertical thickness (half-height). Doc 22 ENT-1030: "thickness ~10%
   *  radius". */
  diskThickness: number;
  /** Disk tilt around the X axis (radians). 0 = face-on, π/2 = edge-on. */
  diskTilt: number;
  /** Disk Keplerian rotation rate (radians/simSec). Doc 17 ENT-1032: physical
   *  rate at ISCO is microseconds; slowed to ~1 rev / 20 s for visibility. */
  diskRotationRate: number;
  /** Doppler-beaming strength. Doc 18 §Accretion Disk: ±30% variation. */
  dopplerStrength: number;
  /** Turbulence fbm scale on disk. */
  turbulenceScale: number;
  /** Jet half-angle (radians). Doc 18 §Relativistic Jets: 0.1 rad ≈ 5.7°. */
  jetHalfAngle: number;
  /** Jet axial reach (local units). */
  jetLength: number;
  /** Jet emission intensity multiplier. */
  jetIntensity: number;
}

export interface PulsarParams {
  /** Raymarch step count. Pulsar has compact high-contrast features — 56
   *  steps covers it cheaply. */
  steps: number;
  /** Neutron-star surface radius. Tiny fraction of cube — point-light-ish. */
  coreRadius: number;
  /** Core emission intensity (bloom fuel). */
  coreIntensity: number;
  /** Beam cone half-angle (radians). Doc 18 §Rotating Beam Shader: 10–30°
   *  → we pick 20° ≈ 0.35 rad. */
  beamHalfAngle: number;
  /** Beam axial length (local units). */
  beamLength: number;
  /** Beam emission intensity. */
  beamIntensity: number;
  /** Pulse frequency (Hz). Doc 17 Crab 29.9 Hz is too fast for the eye —
   *  we slow to ~2 Hz so the beam sweep is visible at 60 fps without being
   *  confused with framerate stutter. */
  pulseFrequency: number;
  /** Misalignment between rotation axis (uY) and magnetic axis (beam). */
  magneticTiltRad: number;
  /** Pulsar wind nebula outer radius. */
  windRadius: number;
  /** PWN filament fbm scale. */
  windFbmScale: number;
  /** PWN density. Doc 22 ENT-1020 §PWN alpha 0.12. */
  windDensity: number;
  /** Polar-cap intensity at beam footprint. */
  polarCapIntensity: number;
}

export interface MagnetarParams {
  /** Raymarch step count. */
  steps: number;
  /** Neutron-star surface radius (local units). */
  surfaceRadius: number;
  /** Surface granulation fbm scale. Doc 22 ENT-8010: freq 30 for crust
   *  roughness. */
  surfaceFbmScale: number;
  /** Surface detail amplitude. */
  surfaceAmplitude: number;
  /** Polar-cap hotspot angular size (radians). */
  polarCapSize: number;
  /** Polar-cap hotspot intensity. */
  polarCapIntensity: number;
  /** Field-line density (radial tubes). */
  fieldDensity: number;
  /** Field-line twist per unit radius. Doc 22 ENT-8010 §Twisted: "pitch ~0.5
   *  Rn per rotation" → ~2.5 radians of twist across the cube. */
  fieldTwist: number;
  /** Field emission intensity. */
  fieldIntensity: number;
  /** Reconnection flare density (stochastic point count). */
  reconnectionDensity: number;
  /** Reconnection pulse period (seconds) for per-flare flicker. */
  reconnectionRate: number;
  /** Starquake flare intensity (0 = disabled — triggered via toggle). */
  flareIntensity: number;
  /** Rotation rate of the crust/field assembly (radians/simSec). */
  rotationRate: number;
}

export const BLACK_HOLE_PARAMS: BlackHoleParams = {
  steps: 64,
  horizonRadius: 0.15,
  photonRingRadius: 0.225, // 1.5 × horizon
  photonRingThickness: 0.012,
  diskInnerRadius: 0.30,   // ISCO ≈ 2 × horizon
  diskOuterRadius: 0.85,
  diskThickness: 0.06,
  diskTilt: 0.35,
  diskRotationRate: 0.3,   // slow for TS-VQA-006 smooth reveal
  dopplerStrength: 0.35,
  turbulenceScale: 6.0,
  jetHalfAngle: 0.14,
  jetLength: 0.95,
  jetIntensity: 2.2,
};

export const PULSAR_PARAMS: PulsarParams = {
  steps: 56,
  coreRadius: 0.06,
  coreIntensity: 7.0,
  beamHalfAngle: 0.35,
  beamLength: 0.9,
  beamIntensity: 4.0,
  pulseFrequency: 2.0,
  magneticTiltRad: 0.45,
  windRadius: 0.75,
  windFbmScale: 2.2,
  windDensity: 0.45,
  polarCapIntensity: 2.5,
};

export const MAGNETAR_PARAMS: MagnetarParams = {
  steps: 48,
  surfaceRadius: 0.18,
  surfaceFbmScale: 4.0,
  surfaceAmplitude: 0.12,
  polarCapSize: 0.22,
  polarCapIntensity: 2.2,
  fieldDensity: 0.75,
  fieldTwist: 2.5,
  fieldIntensity: 1.8,
  reconnectionDensity: 8.0,
  reconnectionRate: 3.0,
  flareIntensity: 0.0,
  rotationRate: 0.45,
};

// ---------------------------------------------------------------------------
// T48.1 — Compact-family (ENT-8010..8014) palette + params.
// Doc 18 §Exotic Objects (T48.0 expansion). One shader file, five `#define`
// variants; palette constants carry one entry per variant.
// ---------------------------------------------------------------------------

export interface CompactExoticPalette {
  /** Primary surface tint. */
  surfaceColor: string;
  /** Interior radial glow (through the surface for semi-transparent kinds). */
  interiorColor: string;
  /** Accent tint — shimmer, foam, conversion front, iridescence. */
  accentColor: string;
}

export interface CompactExoticParams {
  steps: number;
  /** Visible radius of the surface sphere in the unit cube. */
  surfaceRadius: number;
  /** fbm scale for surface detail (ripple, granulation, crystal facets). */
  surfaceFbmScale: number;
  /** Amplitude of surface brightness modulation. */
  surfaceAmplitude: number;
  /** Interior emission strength. */
  interiorIntensity: number;
  /** Accent feature intensity (shimmer / virtual pairs / foam). */
  accentIntensity: number;
  /** Shimmer / pulsation rate (Hz). */
  shimmerRate: number;
}

export const QUARK_PALETTE: CompactExoticPalette = {
  surfaceColor: '#551199',
  interiorColor: '#FF6644',
  accentColor: '#CCDDFF',
};

export const QUARK_PARAMS: CompactExoticParams = {
  steps: 40,
  surfaceRadius: 0.22,
  surfaceFbmScale: 6.0,
  surfaceAmplitude: 0.20,
  interiorIntensity: 0.35,
  accentIntensity: 0.25,
  shimmerRate: 0.5,
};

export const STRANGE_PALETTE: CompactExoticPalette = {
  surfaceColor: '#00FFDD',
  interiorColor: '#0044FF',
  accentColor: '#FFFF99',
};

export const STRANGE_PARAMS: CompactExoticParams = {
  steps: 40,
  surfaceRadius: 0.24,
  surfaceFbmScale: 10.0,
  surfaceAmplitude: 0.18,
  interiorIntensity: 0.25,
  accentIntensity: 0.20,
  shimmerRate: 0.3,
};

export const PREON_PALETTE: CompactExoticPalette = {
  surfaceColor: '#0A0A0F',
  interiorColor: '#100010',
  accentColor: '#001100',
};

export const PREON_PARAMS: CompactExoticParams = {
  steps: 36,
  surfaceRadius: 0.08,
  surfaceFbmScale: 16.0,
  surfaceAmplitude: 0.40,
  interiorIntensity: 0.12,
  accentIntensity: 0.45,
  shimmerRate: 10.0,
};

export const BOSON_PALETTE: CompactExoticPalette = {
  surfaceColor: '#5533FF',
  interiorColor: '#8866FF',
  accentColor: '#AACCFF',
};

export const BOSON_PARAMS: CompactExoticParams = {
  steps: 32,
  surfaceRadius: 0.45,
  surfaceFbmScale: 1.2,
  surfaceAmplitude: 0.06,
  interiorIntensity: 0.05,
  accentIntensity: 0.15,
  shimmerRate: 0.1,
};

export const GRAVASTAR_PALETTE: CompactExoticPalette = {
  surfaceColor: '#AADDFF',
  interiorColor: '#FFFFCC',
  accentColor: '#FFAA00',
};

export const GRAVASTAR_PARAMS: CompactExoticParams = {
  steps: 40,
  surfaceRadius: 0.28,
  surfaceFbmScale: 2.0,
  surfaceAmplitude: 0.10,
  interiorIntensity: 0.20,
  accentIntensity: 0.90,
  shimmerRate: 0.5,
};

// ---------------------------------------------------------------------------
// T48.1 — GR-extreme (ENT-8015, 8016, 8025) palette + params.
// ---------------------------------------------------------------------------

export interface GrExtremePalette {
  coreColor: string;
  accentColor: string;
  haloColor: string;
}

export interface GrExtremeParams {
  steps: number;
  coreRadius: number;
  coreIntensity: number;
  jetHalfAngle: number;
  jetLength: number;
  jetIntensity: number;
  ringRadius: number;
  ringThickness: number;
  ringIntensity: number;
  flowRate: number;
}

export const WHITE_HOLE_PALETTE: GrExtremePalette = {
  coreColor: '#FFFFDD',
  accentColor: '#FF8844',
  haloColor: '#FFFF44',
};

export const WHITE_HOLE_PARAMS: GrExtremeParams = {
  steps: 48,
  coreRadius: 0.14,
  coreIntensity: 5.0,
  jetHalfAngle: 0.32,
  jetLength: 0.95,
  jetIntensity: 2.8,
  ringRadius: 0.22,
  ringThickness: 0.02,
  ringIntensity: 1.4,
  flowRate: 0.9,
};

export const WORMHOLE_PALETTE: GrExtremePalette = {
  coreColor: '#0A0A1F',
  accentColor: '#4455AA',
  haloColor: '#FFFF88',
};

export const WORMHOLE_PARAMS: GrExtremeParams = {
  steps: 48,
  coreRadius: 0.22,
  coreIntensity: 0.6,
  jetHalfAngle: 0.0,
  jetLength: 0.0,
  jetIntensity: 0.0,
  ringRadius: 0.30,
  ringThickness: 0.028,
  ringIntensity: 3.0,
  flowRate: 0.01,
};

export const NAKED_SINGULARITY_PALETTE: GrExtremePalette = {
  coreColor: '#FF44FF',
  accentColor: '#FFFFFF',
  haloColor: '#AACCFF',
};

export const NAKED_SINGULARITY_PARAMS: GrExtremeParams = {
  steps: 48,
  coreRadius: 0.03,
  coreIntensity: 8.0,
  jetHalfAngle: 0.0,
  jetLength: 0.0,
  jetIntensity: 0.0,
  ringRadius: 0.30,
  ringThickness: 0.012,
  ringIntensity: 1.2,
  flowRate: 1.0,
};

// ---------------------------------------------------------------------------
// T48.1 — Cosmic String (ENT-8017).
// ---------------------------------------------------------------------------

export interface CosmicStringPalette {
  stringColor: string;
  ghostColor: string;
}

export interface CosmicStringParams {
  steps: number;
  stringRadius: number;
  stringIntensity: number;
  waveAmp: number;
  waveFreq: number;
  waveSpeed: number;
  lensingOffset: number;
  ghostIntensity: number;
}

export const COSMIC_STRING_PALETTE: CosmicStringPalette = {
  stringColor: '#AAFFFF',
  ghostColor: '#66AABB',
};

export const COSMIC_STRING_PARAMS: CosmicStringParams = {
  steps: 32,
  stringRadius: 0.03,
  stringIntensity: 4.0,
  waveAmp: 0.04,
  waveFreq: 3.0,
  waveSpeed: 0.4,
  lensingOffset: 0.12,
  ghostIntensity: 0.9,
};

// ---------------------------------------------------------------------------
// T48.1 — Dark family (ENT-8018 Halo, ENT-8019 Void).
// ---------------------------------------------------------------------------

export interface DarkExoticPalette {
  /** High-density / boundary tint. */
  highColor: string;
  /** Mid-density tint. */
  midColor: string;
  /** Low-density / interior tint. */
  lowColor: string;
  /** Isocontour or horizon highlight. */
  contourColor: string;
}

export interface DarkExoticParams {
  steps: number;
  /** Scale radius of density profile. */
  scaleRadius: number;
  /** Overall extent in the cube. */
  extentRadius: number;
  /** Density multiplier. */
  densityScale: number;
  /** Isocontour threshold (0..1). */
  isoLevel: number;
  /** Isocontour brightness. */
  isoIntensity: number;
  /** Hubble-flow advection rate (void only; halo = 0). */
  flowRate: number;
  /** Alpha for the volumetric accumulation. */
  alphaScale: number;
}

export const DARK_MATTER_HALO_PALETTE: DarkExoticPalette = {
  highColor: '#FF4444',
  midColor: '#FF9944',
  lowColor: '#4444FF',
  contourColor: '#FFDDAA',
};

export const DARK_MATTER_HALO_PARAMS: DarkExoticParams = {
  steps: 40,
  scaleRadius: 0.18,
  extentRadius: 0.95,
  densityScale: 1.0,
  isoLevel: 0.3,
  isoIntensity: 1.1,
  flowRate: 0.0,
  alphaScale: 0.35,
};

export const DARK_ENERGY_VOID_PALETTE: DarkExoticPalette = {
  highColor: '#2040AA',
  midColor: '#1030AA',
  lowColor: '#000010',
  contourColor: '#4488FF',
};

export const DARK_ENERGY_VOID_PARAMS: DarkExoticParams = {
  steps: 40,
  scaleRadius: 0.55,
  extentRadius: 0.95,
  densityScale: 1.0,
  isoLevel: 0.85,
  isoIntensity: 0.9,
  flowRate: 0.25,
  alphaScale: 0.30,
};

// ---------------------------------------------------------------------------
// T48.1 — Thorne-Żytkow Object (ENT-8021).
// ---------------------------------------------------------------------------

export interface TzoPalette {
  envelopeColor: string;
  hotShellColor: string;
  coreColor: string;
}

export interface TzoParams {
  steps: number;
  envelopeRadius: number;
  envelopeFbmScale: number;
  envelopeOpacity: number;
  hotShellRadius: number;
  hotShellIntensity: number;
  coreRadius: number;
  coreIntensity: number;
  rotationRate: number;
}

export const TZO_PALETTE: TzoPalette = {
  envelopeColor: '#DD4444',
  hotShellColor: '#FFFF88',
  coreColor: '#6699FF',
};

export const TZO_PARAMS: TzoParams = {
  steps: 48,
  envelopeRadius: 0.90,
  envelopeFbmScale: 1.5,
  envelopeOpacity: 0.55,
  hotShellRadius: 0.15,
  hotShellIntensity: 1.2,
  coreRadius: 0.04,
  coreIntensity: 8.0,
  rotationRate: 0.02,
};

// ---------------------------------------------------------------------------
// T48.1 — Primordial Black Hole (ENT-8022).
// ---------------------------------------------------------------------------

export interface PrimordialBhPalette {
  horizonColor: string;
  hawkingColor: string;
  photonRingColor: string;
}

export interface PrimordialBhParams {
  steps: number;
  horizonRadius: number;
  hawkingGlowRadius: number;
  hawkingIntensity: number;
  photonRingRadius: number;
  photonRingThickness: number;
  /** Effective temperature [0..1] mapped color cooler→hotter. */
  temperatureIndex: number;
  evaporationRate: number;
}

export const PRIMORDIAL_BH_PALETTE: PrimordialBhPalette = {
  horizonColor: '#000000',
  hawkingColor: '#CCFFFF',
  photonRingColor: '#FFAA44',
};

export const PRIMORDIAL_BH_PARAMS: PrimordialBhParams = {
  steps: 40,
  horizonRadius: 0.08,
  hawkingGlowRadius: 0.35,
  hawkingIntensity: 0.80,
  photonRingRadius: 0.12,
  photonRingThickness: 0.008,
  temperatureIndex: 0.6,
  evaporationRate: 1.2,
};

// ---------------------------------------------------------------------------
// T48.1 — Quasi-Star (ENT-8023).
// ---------------------------------------------------------------------------

export interface QuasiStarPalette {
  envelopeColor: string;
  interiorColor: string;
  windColor: string;
}

export interface QuasiStarParams {
  steps: number;
  envelopeRadius: number;
  envelopeFbmScale: number;
  envelopeOpacity: number;
  interiorIntensity: number;
  interiorFalloff: number;
  windRadius: number;
  windIntensity: number;
  windSpeed: number;
  polarBoost: number;
}

export const QUASI_STAR_PALETTE: QuasiStarPalette = {
  envelopeColor: '#FFFFDD',
  interiorColor: '#FF9944',
  windColor: '#FFFF99',
};

export const QUASI_STAR_PARAMS: QuasiStarParams = {
  steps: 48,
  envelopeRadius: 0.95,
  envelopeFbmScale: 0.8,
  envelopeOpacity: 0.45,
  interiorIntensity: 1.4,
  interiorFalloff: 3.0,
  windRadius: 1.0,
  windIntensity: 0.35,
  windSpeed: 0.15,
  polarBoost: 0.25,
};

// ---------------------------------------------------------------------------
// T48.1 — Planck Star (ENT-8024).
// ---------------------------------------------------------------------------

export interface PlanckStarPalette {
  coreColorA: string;
  coreColorB: string;
  coreColorC: string;
  shimmerColor: string;
}

export interface PlanckStarParams {
  steps: number;
  coreRadius: number;
  coreIntensity: number;
  hueSpeed: number;
  shimmerScale: number;
  shimmerIntensity: number;
  /** Animation phase for optional bounce event (0..1). */
  bouncePhase: number;
}

export const PLANCK_STAR_PALETTE: PlanckStarPalette = {
  coreColorA: '#FF88FF',
  coreColorB: '#88FFFF',
  coreColorC: '#FFFF88',
  shimmerColor: '#AAAAFF',
};

export const PLANCK_STAR_PARAMS: PlanckStarParams = {
  steps: 36,
  coreRadius: 0.02,
  coreIntensity: 8.0,
  hueSpeed: 1.6,
  shimmerScale: 22.0,
  shimmerIntensity: 0.35,
  bouncePhase: 0.0,
};

// ---------------------------------------------------------------------------
// Type guard — mirrors nebulaPalette.isNebulaKind.
// ---------------------------------------------------------------------------

export function isExoticKind(value: string): value is ExoticKind {
  return (EXOTIC_KINDS as string[]).includes(value);
}

export function isSpeculativeExoticKind(kind: ExoticKind): boolean {
  return SPECULATIVE_EXOTIC_KINDS.has(kind);
}

// ---------------------------------------------------------------------------
// Palette RGB helpers — parallels nebulaPalette. Keeps tests from reparsing
// hex on every assertion.
// ---------------------------------------------------------------------------

export function blackHolePaletteRgb(): Record<keyof BlackHolePalette, RGB> {
  return {
    horizonColor: hexToRgb(BLACK_HOLE_PALETTE.horizonColor),
    photonRingColor: hexToRgb(BLACK_HOLE_PALETTE.photonRingColor),
    diskInnerColor: hexToRgb(BLACK_HOLE_PALETTE.diskInnerColor),
    diskMidColor: hexToRgb(BLACK_HOLE_PALETTE.diskMidColor),
    diskOuterColor: hexToRgb(BLACK_HOLE_PALETTE.diskOuterColor),
    jetColor: hexToRgb(BLACK_HOLE_PALETTE.jetColor),
  };
}

export function pulsarPaletteRgb(): Record<keyof PulsarPalette, RGB> {
  return {
    coreColor: hexToRgb(PULSAR_PALETTE.coreColor),
    beamColor: hexToRgb(PULSAR_PALETTE.beamColor),
    polarCapColor: hexToRgb(PULSAR_PALETTE.polarCapColor),
    windNebulaColor: hexToRgb(PULSAR_PALETTE.windNebulaColor),
    fieldColor: hexToRgb(PULSAR_PALETTE.fieldColor),
  };
}

export function magnetarPaletteRgb(): Record<keyof MagnetarPalette, RGB> {
  return {
    surfaceColor: hexToRgb(MAGNETAR_PALETTE.surfaceColor),
    fieldHotColor: hexToRgb(MAGNETAR_PALETTE.fieldHotColor),
    fieldCoolColor: hexToRgb(MAGNETAR_PALETTE.fieldCoolColor),
    polarCapColor: hexToRgb(MAGNETAR_PALETTE.polarCapColor),
    reconnectionColor: hexToRgb(MAGNETAR_PALETTE.reconnectionColor),
  };
}
