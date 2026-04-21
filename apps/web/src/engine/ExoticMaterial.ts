import * as THREE from 'three';

import {
  exoticBlackholeFragSource,
  exoticCompactFragSource,
  exoticDarkFragSource,
  exoticGrExtremeFragSource,
  exoticMagnetarFragSource,
  exoticPlanckFragSource,
  exoticPrimordialFragSource,
  exoticPulsarFragSource,
  exoticQuasiStarFragSource,
  exoticTopologyFragSource,
  exoticTzoFragSource,
  exoticVertSource,
} from '@/shaders';
import {
  BLACK_HOLE_PALETTE,
  BLACK_HOLE_PARAMS,
  BOSON_PALETTE,
  BOSON_PARAMS,
  COSMIC_STRING_PALETTE,
  COSMIC_STRING_PARAMS,
  DARK_ENERGY_VOID_PALETTE,
  DARK_ENERGY_VOID_PARAMS,
  DARK_MATTER_HALO_PALETTE,
  DARK_MATTER_HALO_PARAMS,
  GRAVASTAR_PALETTE,
  GRAVASTAR_PARAMS,
  MAGNETAR_PALETTE,
  MAGNETAR_PARAMS,
  NAKED_SINGULARITY_PALETTE,
  NAKED_SINGULARITY_PARAMS,
  PLANCK_STAR_PALETTE,
  PLANCK_STAR_PARAMS,
  PREON_PALETTE,
  PREON_PARAMS,
  PRIMORDIAL_BH_PALETTE,
  PRIMORDIAL_BH_PARAMS,
  PULSAR_PALETTE,
  PULSAR_PARAMS,
  QUARK_PALETTE,
  QUARK_PARAMS,
  QUASI_STAR_PALETTE,
  QUASI_STAR_PARAMS,
  STRANGE_PALETTE,
  STRANGE_PARAMS,
  TZO_PALETTE,
  TZO_PARAMS,
  WHITE_HOLE_PALETTE,
  WHITE_HOLE_PARAMS,
  WORMHOLE_PALETTE,
  WORMHOLE_PARAMS,
  type CompactExoticParams,
  type CompactExoticPalette,
  type ExoticKind,
  type GrExtremeParams,
  type GrExtremePalette,
  type DarkExoticParams,
  type DarkExoticPalette,
} from '@/utils/exoticPalette';

/**
 * Factory for the Doc 18 §Exotic Objects shaders (T28).
 *
 * Parallels T27's NebulaMaterial: each kind is rendered as a unit-cube
 * volume (BoxGeometry(2, 2, 2)) scaled to the exotic's visible size; the
 * fragment shader raymarches in model space. One frag shader per kind
 * because the three diverge at the very first sample (horizon test for
 * black hole; beam cone + lighthouse sweep for pulsar; field-line
 * cylindrical tubes for magnetar) — `#ifdef` gymnastics would produce
 * ~70% dead code.
 *
 * `update(deltaSec, elapsedSec, cameraWorld, meshMatrixWorld)` refreshes
 * `u_time` + `u_cameraLocal` every frame. The caller owns the mesh
 * lifecycle; the handle only disposes the underlying ShaderMaterial.
 */

export interface ExoticMaterialOptions {
  /** Optional override for the per-kind raymarch step count. */
  stepsOverride?: number;
  /**
   * Black-hole only. Overrides `u_diskTilt` (radians). 0 = face-on
   * disk, π/2 = edge-on.
   */
  diskTiltOverride?: number;
  /** Black-hole only. Overrides the Keplerian disk rotation rate. */
  diskRotationOverride?: number;
  /** Pulsar only. Overrides the rotation frequency (Hz). */
  pulseFrequencyOverride?: number;
  /** Pulsar only. Overrides the magnetic-axis tilt (radians from +Y). */
  magneticTiltOverride?: number;
  /** Magnetar only. 0 = no flare (default); >0 triggers a uniform glow. */
  flareIntensity?: number;
  /** Magnetar only. Overrides the helical-twist count per cube unit. */
  fieldTwistOverride?: number;
}

export interface ExoticMaterialHandle {
  kind: ExoticKind;
  material: THREE.ShaderMaterial;
  /** Per-frame refresh of `u_time` + `u_cameraLocal`. */
  update(
    deltaSec: number,
    elapsedSec: number,
    cameraWorld: THREE.Vector3,
    meshMatrixWorld: THREE.Matrix4,
  ): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Shared setup — every shader uses the same GL states.
// ---------------------------------------------------------------------------

function baseMaterialProps(): Pick<
  THREE.ShaderMaterial,
  'glslVersion' | 'transparent' | 'depthWrite' | 'side' | 'blending'
> {
  return {
    glslVersion: THREE.GLSL3,
    transparent: true,
    // Volumetric accumulation writes a non-binary alpha; honouring depth
    // would cause ordering artefacts between multiple exotics or between
    // an exotic and a nearby nebula. Depth *testing* still on.
    depthWrite: false,
    // Render both sides so the volume stays visible when the camera is
    // inside the bounding cube (fly-through).
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  };
}

function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

// Convert `cameraPositionWorld` into mesh-local space. Same pattern as
// NebulaMaterial.syncCameraLocal — CPU inverse per frame is cheaper than
// per-vertex shader inverse.
const _tmpCameraLocal = new THREE.Vector3();
const _tmpMat = new THREE.Matrix4();
function syncCameraLocal(
  uniform: THREE.IUniform<THREE.Vector3>,
  cameraWorld: THREE.Vector3,
  meshMatrixWorld: THREE.Matrix4,
): void {
  _tmpCameraLocal.copy(cameraWorld);
  const inv = _tmpMat.copy(meshMatrixWorld).invert();
  _tmpCameraLocal.applyMatrix4(inv);
  uniform.value.copy(_tmpCameraLocal);
}

// ---------------------------------------------------------------------------
// Black hole
// ---------------------------------------------------------------------------

function buildBlackHole(opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const palette = BLACK_HOLE_PALETTE;
  const params = BLACK_HOLE_PARAMS;
  const uniforms = {
    u_cameraLocal:         { value: new THREE.Vector3() },
    u_horizonColor:        { value: color(palette.horizonColor) },
    u_photonRingColor:     { value: color(palette.photonRingColor) },
    u_diskInnerColor:      { value: color(palette.diskInnerColor) },
    u_diskMidColor:        { value: color(palette.diskMidColor) },
    u_diskOuterColor:      { value: color(palette.diskOuterColor) },
    u_jetColor:            { value: color(palette.jetColor) },
    u_horizonRadius:       { value: params.horizonRadius },
    u_photonRingRadius:    { value: params.photonRingRadius },
    u_photonRingThickness: { value: params.photonRingThickness },
    u_diskInnerRadius:     { value: params.diskInnerRadius },
    u_diskOuterRadius:     { value: params.diskOuterRadius },
    u_diskThickness:       { value: params.diskThickness },
    u_diskTilt:            { value: opts.diskTiltOverride ?? params.diskTilt },
    u_diskRotationRate:    { value: opts.diskRotationOverride ?? params.diskRotationRate },
    u_dopplerStrength:     { value: params.dopplerStrength },
    u_turbulenceScale:     { value: params.turbulenceScale },
    u_jetHalfAngle:        { value: params.jetHalfAngle },
    u_jetLength:           { value: params.jetLength },
    u_jetIntensity:        { value: params.jetIntensity },
    u_time:                { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'exotic:blackhole',
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticBlackholeFragSource,
    defines: { EXOTIC_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'blackhole',
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Pulsar
// ---------------------------------------------------------------------------

function buildPulsar(opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const palette = PULSAR_PALETTE;
  const params = PULSAR_PARAMS;
  const uniforms = {
    u_cameraLocal:       { value: new THREE.Vector3() },
    u_coreColor:         { value: color(palette.coreColor) },
    u_beamColor:         { value: color(palette.beamColor) },
    u_polarCapColor:     { value: color(palette.polarCapColor) },
    u_windNebulaColor:   { value: color(palette.windNebulaColor) },
    u_fieldColor:        { value: color(palette.fieldColor) },
    u_coreRadius:        { value: params.coreRadius },
    u_coreIntensity:     { value: params.coreIntensity },
    u_beamHalfAngle:     { value: params.beamHalfAngle },
    u_beamLength:        { value: params.beamLength },
    u_beamIntensity:     { value: params.beamIntensity },
    u_pulseFrequency:    { value: opts.pulseFrequencyOverride ?? params.pulseFrequency },
    u_magneticTiltRad:   { value: opts.magneticTiltOverride ?? params.magneticTiltRad },
    u_windRadius:        { value: params.windRadius },
    u_windFbmScale:      { value: params.windFbmScale },
    u_windDensity:       { value: params.windDensity },
    u_polarCapIntensity: { value: params.polarCapIntensity },
    u_time:              { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'exotic:pulsar',
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticPulsarFragSource,
    defines: { EXOTIC_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'pulsar',
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Magnetar
// ---------------------------------------------------------------------------

function buildMagnetar(opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const palette = MAGNETAR_PALETTE;
  const params = MAGNETAR_PARAMS;
  const uniforms = {
    u_cameraLocal:          { value: new THREE.Vector3() },
    u_surfaceColor:         { value: color(palette.surfaceColor) },
    u_fieldHotColor:        { value: color(palette.fieldHotColor) },
    u_fieldCoolColor:       { value: color(palette.fieldCoolColor) },
    u_polarCapColor:        { value: color(palette.polarCapColor) },
    u_reconnectionColor:    { value: color(palette.reconnectionColor) },
    u_surfaceRadius:        { value: params.surfaceRadius },
    u_surfaceFbmScale:      { value: params.surfaceFbmScale },
    u_surfaceAmplitude:     { value: params.surfaceAmplitude },
    u_polarCapSize:         { value: params.polarCapSize },
    u_polarCapIntensity:    { value: params.polarCapIntensity },
    u_fieldDensity:         { value: params.fieldDensity },
    u_fieldTwist:           { value: opts.fieldTwistOverride ?? params.fieldTwist },
    u_fieldIntensity:       { value: params.fieldIntensity },
    u_reconnectionDensity:  { value: params.reconnectionDensity },
    u_reconnectionRate:     { value: params.reconnectionRate },
    u_flareIntensity:       { value: opts.flareIntensity ?? params.flareIntensity },
    u_rotationRate:         { value: params.rotationRate },
    u_time:                 { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'exotic:magnetar',
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticMagnetarFragSource,
    defines: { EXOTIC_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'magnetar',
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// T48.1 — Compact family (Quark / Strange / Preon / Boson / Gravastar).
// One shader source with `#define` variant switching.
// ---------------------------------------------------------------------------

interface CompactVariantSpec {
  kind: ExoticKind;
  palette: CompactExoticPalette;
  params: CompactExoticParams;
  define: string;
}

const COMPACT_VARIANTS: Record<string, CompactVariantSpec> = {
  quark:     { kind: 'quark',     palette: QUARK_PALETTE,     params: QUARK_PARAMS,     define: 'EXOTIC_COMPACT_QUARK' },
  strange:   { kind: 'strange',   palette: STRANGE_PALETTE,   params: STRANGE_PARAMS,   define: 'EXOTIC_COMPACT_STRANGE' },
  preon:     { kind: 'preon',     palette: PREON_PALETTE,     params: PREON_PARAMS,     define: 'EXOTIC_COMPACT_PREON' },
  boson:     { kind: 'boson',     palette: BOSON_PALETTE,     params: BOSON_PARAMS,     define: 'EXOTIC_COMPACT_BOSON' },
  gravastar: { kind: 'gravastar', palette: GRAVASTAR_PALETTE, params: GRAVASTAR_PARAMS, define: 'EXOTIC_COMPACT_GRAVASTAR' },
};

function buildCompact(kind: ExoticKind, opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const spec = COMPACT_VARIANTS[kind];
  if (!spec) throw new Error(`buildCompact: unsupported kind ${kind}`);
  const uniforms = {
    u_cameraLocal:       { value: new THREE.Vector3() },
    u_surfaceColor:      { value: color(spec.palette.surfaceColor) },
    u_interiorColor:     { value: color(spec.palette.interiorColor) },
    u_accentColor:       { value: color(spec.palette.accentColor) },
    u_surfaceRadius:     { value: spec.params.surfaceRadius },
    u_surfaceFbmScale:   { value: spec.params.surfaceFbmScale },
    u_surfaceAmplitude:  { value: spec.params.surfaceAmplitude },
    u_interiorIntensity: { value: spec.params.interiorIntensity },
    u_accentIntensity:   { value: spec.params.accentIntensity },
    u_shimmerRate:       { value: spec.params.shimmerRate },
    u_time:              { value: 0 },
  };
  const steps = opts.stepsOverride ?? spec.params.steps;
  const material = new THREE.ShaderMaterial({
    name: `exotic:${kind}`,
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticCompactFragSource,
    defines: { EXOTIC_STEPS: String(steps), [spec.define]: '1' },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind,
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() { material.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// T48.1 — GR-extreme family (White Hole / Wormhole / Naked Singularity).
// ---------------------------------------------------------------------------

interface GrExtremeVariantSpec {
  kind: ExoticKind;
  palette: GrExtremePalette;
  params: GrExtremeParams;
  define: string;
}

const GR_EXTREME_VARIANTS: Record<string, GrExtremeVariantSpec> = {
  whitehole:        { kind: 'whitehole',        palette: WHITE_HOLE_PALETTE,        params: WHITE_HOLE_PARAMS,        define: 'EXOTIC_GR_WHITEHOLE' },
  wormhole:         { kind: 'wormhole',         palette: WORMHOLE_PALETTE,          params: WORMHOLE_PARAMS,          define: 'EXOTIC_GR_WORMHOLE' },
  nakedsingularity: { kind: 'nakedsingularity', palette: NAKED_SINGULARITY_PALETTE, params: NAKED_SINGULARITY_PARAMS, define: 'EXOTIC_GR_NAKEDSINGULARITY' },
};

function buildGrExtreme(kind: ExoticKind, opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const spec = GR_EXTREME_VARIANTS[kind];
  if (!spec) throw new Error(`buildGrExtreme: unsupported kind ${kind}`);
  const uniforms = {
    u_cameraLocal:      { value: new THREE.Vector3() },
    u_coreColor:        { value: color(spec.palette.coreColor) },
    u_accentColor:      { value: color(spec.palette.accentColor) },
    u_haloColor:        { value: color(spec.palette.haloColor) },
    u_coreRadius:       { value: spec.params.coreRadius },
    u_coreIntensity:    { value: spec.params.coreIntensity },
    u_jetHalfAngle:     { value: spec.params.jetHalfAngle },
    u_jetLength:        { value: spec.params.jetLength },
    u_jetIntensity:     { value: spec.params.jetIntensity },
    u_ringRadius:       { value: spec.params.ringRadius },
    u_ringThickness:    { value: spec.params.ringThickness },
    u_ringIntensity:    { value: spec.params.ringIntensity },
    u_flowRate:         { value: spec.params.flowRate },
    u_time:             { value: 0 },
  };
  const steps = opts.stepsOverride ?? spec.params.steps;
  const material = new THREE.ShaderMaterial({
    name: `exotic:${kind}`,
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticGrExtremeFragSource,
    defines: { EXOTIC_STEPS: String(steps), [spec.define]: '1' },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind,
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() { material.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// T48.1 — Cosmic String (ENT-8017).
// ---------------------------------------------------------------------------

function buildCosmicString(opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const palette = COSMIC_STRING_PALETTE;
  const params  = COSMIC_STRING_PARAMS;
  const uniforms = {
    u_cameraLocal:    { value: new THREE.Vector3() },
    u_stringColor:    { value: color(palette.stringColor) },
    u_ghostColor:     { value: color(palette.ghostColor) },
    u_stringRadius:   { value: params.stringRadius },
    u_stringIntensity:{ value: params.stringIntensity },
    u_waveAmp:        { value: params.waveAmp },
    u_waveFreq:       { value: params.waveFreq },
    u_waveSpeed:      { value: params.waveSpeed },
    u_lensingOffset:  { value: params.lensingOffset },
    u_ghostIntensity: { value: params.ghostIntensity },
    u_time:           { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'exotic:cosmicstring',
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticTopologyFragSource,
    defines: { EXOTIC_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'cosmicstring',
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() { material.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// T48.1 — Dark family (Halo / Void).
// ---------------------------------------------------------------------------

interface DarkVariantSpec {
  kind: ExoticKind;
  palette: DarkExoticPalette;
  params: DarkExoticParams;
  define?: string;
}

const DARK_VARIANTS: Record<string, DarkVariantSpec> = {
  darkmatterhalo: { kind: 'darkmatterhalo', palette: DARK_MATTER_HALO_PALETTE, params: DARK_MATTER_HALO_PARAMS },
  darkenergyvoid: { kind: 'darkenergyvoid', palette: DARK_ENERGY_VOID_PALETTE, params: DARK_ENERGY_VOID_PARAMS, define: 'EXOTIC_DARK_VOID' },
};

function buildDark(kind: ExoticKind, opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const spec = DARK_VARIANTS[kind];
  if (!spec) throw new Error(`buildDark: unsupported kind ${kind}`);
  const uniforms = {
    u_cameraLocal:  { value: new THREE.Vector3() },
    u_highColor:    { value: color(spec.palette.highColor) },
    u_midColor:     { value: color(spec.palette.midColor) },
    u_lowColor:     { value: color(spec.palette.lowColor) },
    u_contourColor: { value: color(spec.palette.contourColor) },
    u_scaleRadius:  { value: spec.params.scaleRadius },
    u_extentRadius: { value: spec.params.extentRadius },
    u_densityScale: { value: spec.params.densityScale },
    u_isoLevel:     { value: spec.params.isoLevel },
    u_isoIntensity: { value: spec.params.isoIntensity },
    u_flowRate:     { value: spec.params.flowRate },
    u_alphaScale:   { value: spec.params.alphaScale },
    u_time:         { value: 0 },
  };
  const steps = opts.stepsOverride ?? spec.params.steps;
  const defines: Record<string, string> = { EXOTIC_STEPS: String(steps) };
  if (spec.define) defines[spec.define] = '1';
  const material = new THREE.ShaderMaterial({
    name: `exotic:${kind}`,
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticDarkFragSource,
    defines,
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind,
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() { material.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// T48.1 — Thorne-Żytkow Object (ENT-8021).
// ---------------------------------------------------------------------------

function buildTzo(opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const palette = TZO_PALETTE;
  const params  = TZO_PARAMS;
  const uniforms = {
    u_cameraLocal:        { value: new THREE.Vector3() },
    u_envelopeColor:      { value: color(palette.envelopeColor) },
    u_hotShellColor:      { value: color(palette.hotShellColor) },
    u_coreColor:          { value: color(palette.coreColor) },
    u_envelopeRadius:     { value: params.envelopeRadius },
    u_envelopeFbmScale:   { value: params.envelopeFbmScale },
    u_envelopeOpacity:    { value: params.envelopeOpacity },
    u_hotShellRadius:     { value: params.hotShellRadius },
    u_hotShellIntensity:  { value: params.hotShellIntensity },
    u_coreRadius:         { value: params.coreRadius },
    u_coreIntensity:      { value: params.coreIntensity },
    u_rotationRate:       { value: params.rotationRate },
    u_time:               { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'exotic:tzo',
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticTzoFragSource,
    defines: { EXOTIC_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'tzo',
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() { material.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// T48.1 — Primordial Black Hole (ENT-8022).
// ---------------------------------------------------------------------------

function buildPrimordialBh(opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const palette = PRIMORDIAL_BH_PALETTE;
  const params  = PRIMORDIAL_BH_PARAMS;
  const uniforms = {
    u_cameraLocal:          { value: new THREE.Vector3() },
    u_horizonColor:         { value: color(palette.horizonColor) },
    u_hawkingColor:         { value: color(palette.hawkingColor) },
    u_photonRingColor:      { value: color(palette.photonRingColor) },
    u_horizonRadius:        { value: params.horizonRadius },
    u_hawkingGlowRadius:    { value: params.hawkingGlowRadius },
    u_hawkingIntensity:     { value: params.hawkingIntensity },
    u_photonRingRadius:     { value: params.photonRingRadius },
    u_photonRingThickness:  { value: params.photonRingThickness },
    u_temperatureIndex:     { value: params.temperatureIndex },
    u_evaporationRate:      { value: params.evaporationRate },
    u_time:                 { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'exotic:primordialbh',
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticPrimordialFragSource,
    defines: { EXOTIC_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'primordialbh',
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() { material.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// T48.1 — Quasi-Star (ENT-8023).
// ---------------------------------------------------------------------------

function buildQuasiStar(opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const palette = QUASI_STAR_PALETTE;
  const params  = QUASI_STAR_PARAMS;
  const uniforms = {
    u_cameraLocal:       { value: new THREE.Vector3() },
    u_envelopeColor:     { value: color(palette.envelopeColor) },
    u_interiorColor:     { value: color(palette.interiorColor) },
    u_windColor:         { value: color(palette.windColor) },
    u_envelopeRadius:    { value: params.envelopeRadius },
    u_envelopeFbmScale:  { value: params.envelopeFbmScale },
    u_envelopeOpacity:   { value: params.envelopeOpacity },
    u_interiorIntensity: { value: params.interiorIntensity },
    u_interiorFalloff:   { value: params.interiorFalloff },
    u_windRadius:        { value: params.windRadius },
    u_windIntensity:     { value: params.windIntensity },
    u_windSpeed:         { value: params.windSpeed },
    u_polarBoost:        { value: params.polarBoost },
    u_time:              { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'exotic:quasistar',
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticQuasiStarFragSource,
    defines: { EXOTIC_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'quasistar',
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() { material.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// T48.1 — Planck Star (ENT-8024).
// ---------------------------------------------------------------------------

function buildPlanckStar(opts: ExoticMaterialOptions): ExoticMaterialHandle {
  const palette = PLANCK_STAR_PALETTE;
  const params  = PLANCK_STAR_PARAMS;
  const uniforms = {
    u_cameraLocal:      { value: new THREE.Vector3() },
    u_coreColorA:       { value: color(palette.coreColorA) },
    u_coreColorB:       { value: color(palette.coreColorB) },
    u_coreColorC:       { value: color(palette.coreColorC) },
    u_shimmerColor:     { value: color(palette.shimmerColor) },
    u_coreRadius:       { value: params.coreRadius },
    u_coreIntensity:    { value: params.coreIntensity },
    u_hueSpeed:         { value: params.hueSpeed },
    u_shimmerScale:     { value: params.shimmerScale },
    u_shimmerIntensity: { value: params.shimmerIntensity },
    u_bouncePhase:      { value: params.bouncePhase },
    u_time:             { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'exotic:planckstar',
    ...baseMaterialProps(),
    vertexShader: exoticVertSource,
    fragmentShader: exoticPlanckFragSource,
    defines: { EXOTIC_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'planckstar',
    material,
    update(_, elapsedSec, cameraWorld, meshMatrixWorld) {
      uniforms.u_time.value = elapsedSec;
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() { material.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

export function createExoticMaterial(
  kind: ExoticKind,
  options: ExoticMaterialOptions = {},
): ExoticMaterialHandle {
  switch (kind) {
    case 'blackhole':        return buildBlackHole(options);
    case 'pulsar':           return buildPulsar(options);
    case 'magnetar':         return buildMagnetar(options);
    case 'quark':
    case 'strange':
    case 'preon':
    case 'boson':
    case 'gravastar':        return buildCompact(kind, options);
    case 'whitehole':
    case 'wormhole':
    case 'nakedsingularity': return buildGrExtreme(kind, options);
    case 'cosmicstring':     return buildCosmicString(options);
    case 'darkmatterhalo':
    case 'darkenergyvoid':   return buildDark(kind, options);
    case 'tzo':              return buildTzo(options);
    case 'primordialbh':     return buildPrimordialBh(options);
    case 'quasistar':        return buildQuasiStar(options);
    case 'planckstar':       return buildPlanckStar(options);
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown exotic kind: ${_exhaustive as string}`);
    }
  }
}
