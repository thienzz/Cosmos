import * as THREE from 'three';

import {
  starBinaryFragSource,
  starEvolvedFragSource,
  starMainseqFragSource,
  starRemnantFragSource,
  starVariableFragSource,
  starVertSource,
} from '@/shaders';
import {
  EVOLVED_PALETTES,
  EVOLVED_PARAMS,
  MAINSEQ_PALETTES,
  MAINSEQ_PARAMS,
  REMNANT_PALETTES,
  REMNANT_PARAMS,
  VARIABLE_PALETTES,
  VARIABLE_PARAMS,
  starFamilyOfKind,
  type EvolvedKind,
  type MainSeqKind,
  type RemnantKind,
  type StarFamilyKind,
  type VariableKind,
} from '@/utils/starFamilyPalette';

/**
 * T41 factory for the 4 Doc 18 star-family shaders + the binary overlay.
 *
 * Pattern mirrors PlanetMaterial (per-kind #define + uniform table pulled
 * from the palette module) and ExoticMaterial (per-family builder with a
 * discriminated-union handle). Every surface shader shares `star.vert`;
 * the fragment shader is selected by `starFamilyOfKind(kind)`.
 *
 * The caller owns the geometry; this factory only builds the ShaderMaterial
 * + update function. update(deltaSec, elapsedSec, sunDirWorld, cameraWorld,
 * meshMatrixWorld) refreshes u_time, u_rotation, u_pulsation (variables)
 * and u_sunDir each frame.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type StarMaterialFamily = 'mainseq' | 'evolved' | 'remnant' | 'variable' | 'binary';

export interface StarMaterialHandle {
  family: StarMaterialFamily;
  kind: StarFamilyKind | 'binary';
  material: THREE.ShaderMaterial;
  /** Per-frame refresh. */
  update(
    deltaSec: number,
    elapsedSec: number,
    sunDirWorld: THREE.Vector3,
    cameraWorld: THREE.Vector3,
    meshMatrixWorld: THREE.Matrix4,
  ): void;
  dispose(): void;
}

export interface StarMaterialOptions {
  /** Initial world-space sun direction. */
  sunDirection?: THREE.Vector3;
  /** 'high' adds QUALITY_HIGH define. */
  quality?: 'low' | 'mid' | 'high';
  /**
   * Override temperature (Kelvin). Used by MS-general (ENT-1021) bucket
   * + white-dwarf temperature interpolation.
   */
  temperatureOverride?: number;
  /** Override rotation frequency (Hz) for neutron stars / pulsars. */
  rotationHzOverride?: number;
  /** Override magnetic-axis tilt (radians). */
  magneticTiltOverride?: number;
  /** Override pulsation amplitude (e.g. enable ZZ Ceti on white dwarf). */
  pulsationAmpOverride?: number;
  /**
   * Cataclysmic-variable nova flare intensity (0..1). 0 = no active nova
   * event (default); toggling > 0 triggers stochastic bursts.
   */
  flareIntensity?: number;
}

export interface StarBinaryOverlayOptions {
  primaryCenter: THREE.Vector3;
  secondaryCenter: THREE.Vector3;
  primaryRadius: number;
  secondaryRadius: number;
  /** 0..1. 0 = none, 1 = full common envelope. */
  lobeStrength?: number;
  /** 0..1. Brightness of the donor→accretor stream. */
  massTransferRate?: number;
  /** Hex colour for the mass-transfer stream (default amber). */
  streamColor?: string;
  /** Hex colour for the common-envelope contour (default pale blue). */
  commonEnvelopeColor?: string;
}

// ---------------------------------------------------------------------------
// Define mapping — one macro per kind so Three.js emits the right branch.
// ---------------------------------------------------------------------------

export const STAR_FAMILY_DEFINES: Record<StarFamilyKind, string> = {
  // Main-sequence classes + brown dwarfs.
  O: 'SPECTRAL_O',
  B: 'SPECTRAL_B',
  A: 'SPECTRAL_A',
  F: 'SPECTRAL_F',
  G: 'SPECTRAL_G',
  K: 'SPECTRAL_K',
  M: 'SPECTRAL_M',
  L: 'SPECTRAL_L',
  T: 'SPECTRAL_T',
  Y: 'SPECTRAL_Y',
  MS: 'SPECTRAL_MS',
  // Evolved subtypes.
  protostar: 'EVOLVED_PROTOSTAR',
  subgiant: 'EVOLVED_SUBGIANT',
  redgiant: 'EVOLVED_RGB',
  bluesupergiant: 'EVOLVED_BSG',
  agb: 'EVOLVED_AGB',
  horizontalbranch: 'EVOLVED_HB',
  wolfrayet: 'EVOLVED_WR',
  lbv: 'EVOLVED_LBV',
  carbon: 'EVOLVED_CARBON',
  hypergiant: 'EVOLVED_HYPERGIANT',
  // Remnant.
  whitedwarf: 'REMNANT_WHITEDWARF',
  neutronstar: 'REMNANT_NEUTRONSTAR',
  // Variable.
  cepheid: 'VAR_CEPHEID',
  rrlyrae: 'VAR_RRLYRAE',
  mira: 'VAR_MIRA',
  eclipsing: 'VAR_ECLIPSING',
  cataclysmic: 'VAR_CATACLYSMIC',
  symbiotic: 'VAR_SYMBIOTIC',
  bluestraggler: 'VAR_BLUESTRAGGLER',
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function buildDefines(
  kind: StarFamilyKind,
  opts: StarMaterialOptions,
): Record<string, string> {
  const defines: Record<string, string> = {
    [STAR_FAMILY_DEFINES[kind]]: '',
  };
  if (opts.quality === 'high') defines.QUALITY_HIGH = '';
  return defines;
}

// ---------------------------------------------------------------------------
// Main-sequence builder
// ---------------------------------------------------------------------------

function buildMainSeq(
  kind: MainSeqKind,
  opts: StarMaterialOptions,
): StarMaterialHandle {
  const palette = MAINSEQ_PALETTES[kind];
  const params = MAINSEQ_PARAMS[kind];
  const temperatureK = opts.temperatureOverride ?? params.temperatureK;

  const uniforms = {
    u_coreColor:          { value: color(palette.coreColor) },
    u_haloColor:          { value: color(palette.haloColor) },
    u_spotColor:          { value: color(palette.spotColor) },
    u_chromosphereColor:  { value: color(palette.chromosphereColor) },
    u_limbColor:          { value: color(palette.limbColor) },
    u_temperatureK:       { value: temperatureK },
    u_coronaWidth:        { value: params.coronaWidth },
    u_granulationOctaves: { value: params.granulationOctaves },
    u_granulationAmp:     { value: params.granulationAmp },
    u_voronoiBlend:       { value: params.voronoiBlend },
    u_spotDensity:        { value: params.spotDensity },
    u_limbDarkening:      { value: params.limbDarkening },
    u_bloomIntensity:     { value: params.bloomIntensity },
    u_twinkleStrength:    { value: params.twinkleStrength },
    u_flareRate:          { value: params.flareRate },
    u_rotation:           { value: 0 },
    u_pulsation:          { value: 0 },
    u_time:               { value: 0 },
    u_sunDir:             { value: opts.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0) },
    // T52 Doc 22 ENT-1007 Sun-specific feature toggles. Defaults per Doc 22
    // (ON=1.0, OFF=0.0). Only read inside SPECTRAL_G branch so other MS
    // classes inherit them as inert no-ops.
    u_radiativeZone:              { value: 0.0 },
    u_convectionZone:             { value: 1.0 },
    u_helioseismicModes:          { value: 0.0 },
    u_granulation:                { value: 1.0 },
    u_supergranulation:           { value: 0.5 },
    // Plage / facular / prominence toggles default OFF so the Sun reads as
    // a smooth bright disc; user opts in via Doc 22 sidebar for an
    // "active Sun" view (ENT-1007).
    u_facularBrightening:         { value: 0.0 },
    u_spiculeTexture:             { value: 0.0 },
    u_photosphericInflation:      { value: 0.0 },
    u_chromosphereLayer:          { value: 0.6 },
    u_spiculeForest:              { value: 0.0 },
    u_mottledTexture:             { value: 0.5 },
    u_limbProminences:            { value: 0.0 },
    u_coronaHaze:                 { value: 0.8 },
    u_coronalLoops:               { value: 0.0 },
    u_helmetStreamers:            { value: 0.0 },
    u_coronalMassEjections:       { value: 0.0 },
    u_coronalDimming:             { value: 0.0 },
    u_sunspots:                   { value: 1.0 },
    u_spotMagneticField:          { value: 0.0 },
    u_solarFlares:                { value: 0.0 },
    u_eruptiveProminences:        { value: 0.0 },
    u_plageRegions:               { value: 0.0 },
    u_magneticFieldLines:         { value: 0.0 },
    u_polarityReversal:           { value: 0.0 },
    u_polarCoronalHoles:          { value: 0.0 },
    u_heliosphereBoundary:        { value: 0.0 },
    u_solarWindStreaks:           { value: 0.0 },
    u_interplanetaryMagneticField:{ value: 0.0 },
    u_coronalRadiationZones:      { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    name: `star-mainseq:${kind}`,
    glslVersion: THREE.GLSL3,
    vertexShader: starVertSource,
    fragmentShader: starMainseqFragSource,
    defines: buildDefines(kind, opts),
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
    transparent: false,
    depthWrite: true,
  });

  return {
    family: 'mainseq',
    kind,
    material,
    update(deltaSec, elapsedSec, sunDirWorld) {
      uniforms.u_rotation.value += deltaSec * params.rotationRate;
      uniforms.u_time.value = elapsedSec;
      uniforms.u_sunDir.value.copy(sunDirWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Evolved builder
// ---------------------------------------------------------------------------

function buildEvolved(
  kind: EvolvedKind,
  opts: StarMaterialOptions,
): StarMaterialHandle {
  const palette = EVOLVED_PALETTES[kind];
  const params = EVOLVED_PARAMS[kind];

  const uniforms = {
    u_coreColor:              { value: color(palette.coreColor) },
    u_haloColor:              { value: color(palette.haloColor) },
    u_spotColor:              { value: color(palette.spotColor) },
    u_chromosphereColor:      { value: color(palette.chromosphereColor) },
    u_dustColor:              { value: color(palette.dustColor) },
    u_limbColor:              { value: color(palette.limbColor) },
    u_temperatureK:           { value: params.temperatureK },
    u_envelopeWidth:          { value: params.envelopeWidth },
    u_granulationOctaves:     { value: params.granulationOctaves },
    u_granulationAmp:         { value: params.granulationAmp },
    u_voronoiBlend:           { value: params.voronoiBlend },
    u_windRate:               { value: params.windRate },
    u_shellIntensity:         { value: params.shellIntensity },
    u_sdoradusAmp:            { value: params.sdoradusAmp },
    u_jetIntensity:           { value: params.jetIntensity },
    u_limbDarkening:          { value: params.limbDarkening },
    u_bloomIntensity:         { value: params.bloomIntensity },
    u_chromosphereIntensity:  { value: params.chromosphereIntensity },
    u_rotation:               { value: 0 },
    u_pulsation:              { value: 0 },
    u_time:                   { value: 0 },
    u_sunDir:                 { value: opts.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0) },
  };

  const material = new THREE.ShaderMaterial({
    name: `star-evolved:${kind}`,
    glslVersion: THREE.GLSL3,
    vertexShader: starVertSource,
    fragmentShader: starEvolvedFragSource,
    defines: buildDefines(kind, opts),
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
    transparent: false,
    depthWrite: true,
  });

  return {
    family: 'evolved',
    kind,
    material,
    update(deltaSec, elapsedSec, sunDirWorld) {
      uniforms.u_rotation.value += deltaSec * params.rotationRate;
      uniforms.u_time.value = elapsedSec;
      uniforms.u_sunDir.value.copy(sunDirWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Remnant builder
// ---------------------------------------------------------------------------

function buildRemnant(
  kind: RemnantKind,
  opts: StarMaterialOptions,
): StarMaterialHandle {
  const palette = REMNANT_PALETTES[kind];
  const params = REMNANT_PARAMS[kind];

  const uniforms = {
    u_hotColor:           { value: color(palette.hotColor) },
    u_coolColor:          { value: color(palette.coolColor) },
    u_polarColor:         { value: color(palette.polarColor) },
    u_beamColor:          { value: color(palette.beamColor) },
    u_limbColor:          { value: color(palette.limbColor) },
    u_wdTemperature:      { value: opts.temperatureOverride ?? params.wdTemperature },
    u_rotationHz:         { value: opts.rotationHzOverride ?? params.rotationHz },
    u_magneticTilt:       { value: opts.magneticTiltOverride ?? params.magneticTilt },
    u_beamHalfAngle:      { value: params.beamHalfAngle },
    u_beamIntensity:      { value: params.beamIntensity },
    u_polarCapIntensity:  { value: params.polarCapIntensity },
    u_limbDarkening:      { value: params.limbDarkening },
    u_bloomIntensity:     { value: params.bloomIntensity },
    u_pulsationAmp:       { value: opts.pulsationAmpOverride ?? params.pulsationAmp },
    u_rotation:           { value: 0 },
    u_pulsation:          { value: 0 },
    u_time:               { value: 0 },
    u_sunDir:             { value: opts.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0) },
  };

  const material = new THREE.ShaderMaterial({
    name: `star-remnant:${kind}`,
    glslVersion: THREE.GLSL3,
    vertexShader: starVertSource,
    fragmentShader: starRemnantFragSource,
    defines: buildDefines(kind, opts),
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
    transparent: false,
    depthWrite: true,
  });

  // Pulsation period for ZZ Ceti (seconds). Only meaningful when
  // u_pulsationAmp > 0 (defaults to 0 in params).
  const pulsationPeriodSec = params.pulsationPeriodSec;
  const pulsationAmp = uniforms.u_pulsationAmp.value;

  return {
    family: 'remnant',
    kind,
    material,
    update(deltaSec, elapsedSec, sunDirWorld) {
      uniforms.u_rotation.value += deltaSec * params.rotationHz * 2 * Math.PI;
      uniforms.u_time.value = elapsedSec;
      uniforms.u_sunDir.value.copy(sunDirWorld);
      if (pulsationAmp > 0 && pulsationPeriodSec > 0) {
        uniforms.u_pulsation.value =
          pulsationAmp * Math.sin((2 * Math.PI * elapsedSec) / pulsationPeriodSec);
      }
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Variable builder
// ---------------------------------------------------------------------------

function buildVariable(
  kind: VariableKind,
  opts: StarMaterialOptions,
): StarMaterialHandle {
  const palette = VARIABLE_PALETTES[kind];
  const params = VARIABLE_PARAMS[kind];

  const uniforms = {
    u_coolColor:           { value: color(palette.coolColor) },
    u_hotColor:            { value: color(palette.hotColor) },
    u_haloColor:           { value: color(palette.haloColor) },
    u_spotColor:           { value: color(palette.spotColor) },
    u_limbColor:           { value: color(palette.limbColor) },
    u_pulsationPeriodSec:  { value: params.pulsationPeriodSec },
    u_pulsationAmp:        { value: params.pulsationAmp },
    u_brightnessAmp:       { value: params.brightnessAmp },
    u_granulationOctaves:  { value: params.granulationOctaves },
    u_granulationAmp:      { value: params.granulationAmp },
    u_voronoiBlend:        { value: params.voronoiBlend },
    u_dipDepth:            { value: params.dipDepth },
    u_companionPhase:      { value: 0 },
    u_flareIntensity:      { value: opts.flareIntensity ?? 0 },
    u_blueExcess:          { value: params.blueExcess },
    u_limbDarkening:       { value: params.limbDarkening },
    u_bloomIntensity:      { value: params.bloomIntensity },
    u_rotation:            { value: 0 },
    u_pulsation:           { value: 0 },
    u_time:                { value: 0 },
    u_sunDir:              { value: opts.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0) },
  };

  const material = new THREE.ShaderMaterial({
    name: `star-variable:${kind}`,
    glslVersion: THREE.GLSL3,
    vertexShader: starVertSource,
    fragmentShader: starVariableFragSource,
    defines: buildDefines(kind, opts),
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
    transparent: false,
    depthWrite: true,
  });

  return {
    family: 'variable',
    kind,
    material,
    update(deltaSec, elapsedSec, sunDirWorld) {
      uniforms.u_rotation.value += deltaSec * params.rotationRate;
      uniforms.u_time.value = elapsedSec;
      uniforms.u_sunDir.value.copy(sunDirWorld);
      uniforms.u_companionPhase.value += deltaSec * params.companionPhaseRate;

      // Radial pulsation displacement driven from the vertex shader's
      // u_pulsation uniform.
      if (params.pulsationAmp > 0 && params.pulsationPeriodSec > 0) {
        uniforms.u_pulsation.value =
          params.pulsationAmp
            * Math.sin((2 * Math.PI * elapsedSec) / params.pulsationPeriodSec);
      }
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Public dispatch
// ---------------------------------------------------------------------------

export function createStarMaterial(
  kind: StarFamilyKind,
  options: StarMaterialOptions = {},
): StarMaterialHandle {
  const family = starFamilyOfKind(kind);
  switch (family) {
    case 'mainseq':
      return buildMainSeq(kind as MainSeqKind, options);
    case 'evolved':
      return buildEvolved(kind as EvolvedKind, options);
    case 'remnant':
      return buildRemnant(kind as RemnantKind, options);
    case 'variable':
      return buildVariable(kind as VariableKind, options);
    default: {
      const _exhaustive: never = family;
      throw new Error(`Unknown star family: ${_exhaustive as string}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Binary overlay
// ---------------------------------------------------------------------------

export function createStarBinaryOverlay(
  options: StarBinaryOverlayOptions,
): StarMaterialHandle {
  const streamHex = options.streamColor ?? '#FFAA33';
  const envelopeHex = options.commonEnvelopeColor ?? '#88BBFF';

  const uniforms = {
    u_primaryCenter:        { value: options.primaryCenter.clone() },
    u_secondaryCenter:      { value: options.secondaryCenter.clone() },
    u_primaryRadius:        { value: options.primaryRadius },
    u_secondaryRadius:      { value: options.secondaryRadius },
    u_lobeStrength:         { value: options.lobeStrength ?? 0 },
    u_massTransferRate:     { value: options.massTransferRate ?? 0 },
    u_streamColor:          { value: color(streamHex) },
    u_commonEnvelopeColor:  { value: color(envelopeHex) },
    // The binary overlay still uses star.vert, which exposes u_rotation +
    // u_pulsation even though the frag doesn't consume them. Declare the
    // uniforms so the ShaderMaterial validator is happy.
    u_rotation:             { value: 0 },
    u_pulsation:            { value: 0 },
    u_time:                 { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    name: 'star-binary',
    glslVersion: THREE.GLSL3,
    vertexShader: starVertSource,
    fragmentShader: starBinaryFragSource,
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return {
    family: 'binary',
    kind: 'binary',
    material,
    update(_deltaSec, elapsedSec) {
      uniforms.u_time.value = elapsedSec;
    },
    dispose() {
      material.dispose();
    },
  };
}
