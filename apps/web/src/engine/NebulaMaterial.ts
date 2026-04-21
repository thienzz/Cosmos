import * as THREE from 'three';

import {
  nebulaDarkFragSource,
  nebulaEmissionFragSource,
  nebulaPlanetaryFragSource,
  nebulaProtoplanetaryFragSource,
  nebulaReflectionFragSource,
  nebulaSuperbubbleFragSource,
  nebulaSupernovaFragSource,
  nebulaVertSource,
  nebulaWolfRayetFragSource,
} from '@/shaders';
import {
  DARK_PALETTE,
  DARK_PARAMS,
  EMISSION_PALETTE,
  EMISSION_PARAMS,
  NEBULA_SUBTYPE_OVERRIDES,
  PLANETARY_PALETTE,
  PLANETARY_PARAMS,
  PROTOPLANETARY_PALETTE,
  PROTOPLANETARY_PARAMS,
  REFLECTION_PALETTE,
  REFLECTION_PARAMS,
  SUPERBUBBLE_PALETTE,
  SUPERBUBBLE_PARAMS,
  SUPERNOVA_PALETTE,
  SUPERNOVA_PARAMS,
  WOLF_RAYET_PALETTE,
  WOLF_RAYET_PARAMS,
  subtypeToKind,
  type DarkParams,
  type EmissionParams,
  type NebulaKind,
  type NebulaSubtype,
  type PlanetaryParams,
  type ProtoplanetaryParams,
  type SuperbubbleParams,
  type SupernovaParams,
  type WolfRayetParams,
} from '@/utils/nebulaPalette';

/**
 * Factory for the Doc 17/18 §Nebula Rendering shaders.
 *
 * T27 shipped five families (emission / reflection / dark / planetary /
 * supernova). T45 extends this to eight families + 14 subtypes: three new
 * shaders (wolfrayet / protoplanetary / superbubble) plus subtype overrides
 * that bend the existing shaders toward the rest of Doc 17 §5010–§5080.
 *
 * The API takes either a **family** (`NebulaKind`) directly, which uses the
 * canonical param defaults, OR a **subtype** (`NebulaSubtype`) via
 * {@link createNebulaMaterialForSubtype}, which looks up the canonical
 * family + applies the subtype's parameter-override patch.
 *
 * Each nebula is rendered as a unit cube (`THREE.BoxGeometry(2, 2, 2)`)
 * scaled to the nebula's visible size; the fragment shader raymarches in
 * model space. The factory expects the caller to manage the geometry +
 * mesh lifecycle and to call `update(deltaSec, elapsedSec, cameraWorld,
 * meshMatrixWorld)` every frame so `u_cameraLocal` stays accurate.
 */

export interface NebulaMaterialOptions {
  /** Optional override for the step count. */
  stepsOverride?: number;
  /**
   * Local-space direction to the illuminating star (reflection nebula
   * only — ignored for other kinds). Default `(1, 0.3, 0.5)` normalised.
   */
  starDirLocal?: THREE.Vector3;
  /**
   * Pulsar intensity for supernova remnants. 0 disables the central
   * point glow (shell-only ENT-5050), >0 enables it (plerion ENT-5051).
   * Default 0.9 for the gallery.
   */
  pulsarIntensity?: number;
  /** Bipolar-lobe strength for planetary nebulae. 0 = spherical. */
  bipolarOverride?: number;
  /**
   * Irregular-planetary warping strength. 0 = clean concentric shells
   * (ENT-5020 Ring), 0.7+ = cometary-knot asymmetry (ENT-5022 Skull).
   */
  irregularityOverride?: number;
  /**
   * Per-family parameter patches. Each key is merged on top of the
   * canonical params; undefined keys keep their defaults.
   */
  emissionParams?: Partial<EmissionParams>;
  darkParams?: Partial<DarkParams>;
  planetaryParams?: Partial<PlanetaryParams>;
  supernovaParams?: Partial<SupernovaParams>;
  wolfRayetParams?: Partial<WolfRayetParams>;
  protoplanetaryParams?: Partial<ProtoplanetaryParams>;
  superbubbleParams?: Partial<SuperbubbleParams>;
}

export interface NebulaMaterialHandle {
  kind: NebulaKind;
  material: THREE.ShaderMaterial;
  /** Advance u_time + refresh u_cameraLocal for this frame. */
  update(
    deltaSec: number,
    elapsedSec: number,
    cameraWorld: THREE.Vector3,
    meshMatrixWorld: THREE.Matrix4,
  ): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Shared setup — every shader uses these same GL states.
// ---------------------------------------------------------------------------

function baseMaterialProps(): Pick<
  THREE.ShaderMaterial,
  'glslVersion' | 'transparent' | 'depthWrite' | 'side' | 'blending'
> {
  return {
    glslVersion: THREE.GLSL3,
    transparent: true,
    // Volumetric accumulation writes a non-binary alpha; honouring depth
    // would cause ordering artefacts between multiple nebulae. Depth
    // *testing* is still on — we just don't *write* new depth values.
    depthWrite: false,
    // Render both sides so the volume stays visible when the camera is
    // inside the bounding cube (otherwise the back-face cull would hide
    // the marched region).
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  };
}

function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

const tmpCameraLocal = new THREE.Vector3();
function syncCameraLocal(
  uniform: THREE.IUniform<THREE.Vector3>,
  cameraWorld: THREE.Vector3,
  meshMatrixWorld: THREE.Matrix4,
): void {
  tmpCameraLocal.copy(cameraWorld);
  const inv = _tmpMat.copy(meshMatrixWorld).invert();
  tmpCameraLocal.applyMatrix4(inv);
  uniform.value.copy(tmpCameraLocal);
}
const _tmpMat = new THREE.Matrix4();

// ---------------------------------------------------------------------------
// Emission nebula (H II region)
// ---------------------------------------------------------------------------

function buildEmission(opts: NebulaMaterialOptions): NebulaMaterialHandle {
  const palette = EMISSION_PALETTE;
  const params: EmissionParams = { ...EMISSION_PARAMS, ...opts.emissionParams };
  const uniforms = {
    u_cameraLocal: { value: new THREE.Vector3() },
    u_haColor:   { value: color(palette.haColor)   },
    u_oiiiColor: { value: color(palette.oiiiColor) },
    u_siiColor:  { value: color(palette.siiColor)  },
    u_niiColor:  { value: color(palette.niiColor)  },
    u_fbmScale:       { value: params.fbmScale       },
    u_density:        { value: params.density        },
    u_emissionBoost:  { value: params.emissionBoost  },
    u_falloff:        { value: params.falloff        },
    u_turbulenceRate: { value: params.turbulenceRate },
    u_variant:        { value: params.variant        },
    u_time:           { value: 0 },
    // T52 Doc 22 ENT-5010 feature toggles. Defaults per Doc 22 defaultOn.
    u_hAlphaGlow:          { value: 1.0 },
    u_oIIIEmission:        { value: 1.0 },
    u_nIIEmission:         { value: 1.0 },
    u_sIIEmission:         { value: 1.0 },
    u_heIIEmission:        { value: 0.0 },
    u_stromgrenBoundary:   { value: 1.0 },
    u_densityWaves:        { value: 1.0 },
    u_filaments:           { value: 1.0 },
    u_gasFingers:          { value: 1.0 },
    u_bubbles:             { value: 0.0 },
    u_velocityShear:       { value: 0.0 },
    u_pillars:             { value: 1.0 },
    u_dustLanes:           { value: 1.0 },
    u_bokGlobules:         { value: 1.0 },
    u_dustHalo:            { value: 1.0 },
    u_pAHEmission:         { value: 0.0 },
    u_bowShocks:           { value: 1.0 },
    u_shockRims:           { value: 1.0 },
    u_hHObjects:           { value: 1.0 },
    u_turbulence:          { value: 0.0 },
    u_starCores:           { value: 1.0 },
    u_embeddedProtostars:  { value: 0.0 },
    u_stellarWinds:        { value: 0.0 },
    u_falseColor:          { value: 0.0 },
    u_dopplerTint:         { value: 0.0 },
    u_ionizationFront:     { value: 1.0 },
    u_neutralHalo:         { value: 1.0 },
    u_molecularEnvelope:   { value: 0.0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'nebula:emission',
    ...baseMaterialProps(),
    vertexShader: nebulaVertSource,
    fragmentShader: nebulaEmissionFragSource,
    defines: { NEBULA_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'emission',
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
// Reflection nebula
// ---------------------------------------------------------------------------

function buildReflection(opts: NebulaMaterialOptions): NebulaMaterialHandle {
  const palette = REFLECTION_PALETTE;
  const params = REFLECTION_PARAMS;
  const starDir = (opts.starDirLocal?.clone() ?? new THREE.Vector3(1, 0.3, 0.5)).normalize();
  const uniforms = {
    u_cameraLocal:    { value: new THREE.Vector3() },
    u_scatterColor:   { value: color(palette.scatterColor) },
    u_starColor:      { value: color(palette.starColor) },
    u_starDirLocal:   { value: starDir },
    u_fbmScale:       { value: params.fbmScale },
    u_density:        { value: params.density },
    u_forwardScatter: { value: params.forwardScatter },
    u_falloff:        { value: params.falloff },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'nebula:reflection',
    ...baseMaterialProps(),
    vertexShader: nebulaVertSource,
    fragmentShader: nebulaReflectionFragSource,
    defines: { NEBULA_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'reflection',
    material,
    update(_, _elapsedSec, cameraWorld, meshMatrixWorld) {
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Dark nebula
// ---------------------------------------------------------------------------

function buildDark(opts: NebulaMaterialOptions): NebulaMaterialHandle {
  const palette = DARK_PALETTE;
  const params: DarkParams = { ...DARK_PARAMS, ...opts.darkParams };
  const uniforms = {
    u_cameraLocal:        { value: new THREE.Vector3() },
    u_reddeningTint:      { value: color(palette.reddeningTint) },
    u_dustColor:          { value: color(palette.dustColor) },
    u_fbmScale:           { value: params.fbmScale },
    u_extinction:         { value: params.extinction },
    u_reddeningStrength:  { value: params.reddeningStrength },
    u_coreSharpness:      { value: params.coreSharpness },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'nebula:dark',
    ...baseMaterialProps(),
    vertexShader: nebulaVertSource,
    fragmentShader: nebulaDarkFragSource,
    defines: { NEBULA_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'dark',
    material,
    update(_, _elapsedSec, cameraWorld, meshMatrixWorld) {
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Planetary nebula
// ---------------------------------------------------------------------------

function buildPlanetary(opts: NebulaMaterialOptions): NebulaMaterialHandle {
  const palette = PLANETARY_PALETTE;
  const params: PlanetaryParams = { ...PLANETARY_PARAMS, ...opts.planetaryParams };
  const uniforms = {
    u_cameraLocal:    { value: new THREE.Vector3() },
    u_coreColor:      { value: color(palette.coreColor) },
    u_innerColor:     { value: color(palette.innerColor) },
    u_middleColor:    { value: color(palette.middleColor) },
    u_outerColor:     { value: color(palette.outerColor) },
    u_shellInner:     { value: params.shellInner },
    u_shellMiddle:    { value: params.shellMiddle },
    u_shellOuter:     { value: params.shellOuter },
    u_shellThickness: { value: params.shellThickness },
    u_bipolarRatio:   { value: opts.bipolarOverride ?? params.bipolarRatio },
    u_coreRadius:     { value: params.coreRadius },
    u_coreIntensity:  { value: params.coreIntensity },
    u_expansionRate:  { value: params.expansionRate },
    u_irregularity:   { value: opts.irregularityOverride ?? params.irregularity },
    u_time:           { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'nebula:planetary',
    ...baseMaterialProps(),
    vertexShader: nebulaVertSource,
    fragmentShader: nebulaPlanetaryFragSource,
    defines: { NEBULA_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'planetary',
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
// Supernova remnant
// ---------------------------------------------------------------------------

function buildSupernova(opts: NebulaMaterialOptions): NebulaMaterialHandle {
  const palette = SUPERNOVA_PALETTE;
  const params: SupernovaParams = { ...SUPERNOVA_PARAMS, ...opts.supernovaParams };
  const uniforms = {
    u_cameraLocal:         { value: new THREE.Vector3() },
    u_synchrotronColor:    { value: color(palette.synchrotronColor) },
    u_filamentColor:       { value: color(palette.filamentColor) },
    u_pulsarColor:         { value: color(palette.pulsarColor) },
    u_shellRadius:         { value: params.shellRadius },
    u_shellSharpness:      { value: params.shellSharpness },
    u_filamentDensity:     { value: params.filamentDensity },
    u_synchrotronIntensity:{ value: params.synchrotronIntensity },
    u_expansionVelocity:   { value: params.expansionVelocity },
    u_pulsarIntensity:     { value: opts.pulsarIntensity ?? 0.9 },
    u_time:                { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'nebula:supernova',
    ...baseMaterialProps(),
    vertexShader: nebulaVertSource,
    fragmentShader: nebulaSupernovaFragSource,
    defines: { NEBULA_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'supernova',
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
// Wolf-Rayet nebula (T45 — ENT-5060)
// ---------------------------------------------------------------------------

function buildWolfRayet(opts: NebulaMaterialOptions): NebulaMaterialHandle {
  const palette = WOLF_RAYET_PALETTE;
  const params: WolfRayetParams = { ...WOLF_RAYET_PARAMS, ...opts.wolfRayetParams };
  const uniforms = {
    u_cameraLocal:     { value: new THREE.Vector3() },
    u_haColor:         { value: color(palette.haColor) },
    u_hbColor:         { value: color(palette.hbColor) },
    u_oiiiColor:       { value: color(palette.oiiiColor) },
    u_starColor:       { value: color(palette.starColor) },
    u_shellRadius:     { value: params.shellRadius },
    u_shellThickness:  { value: params.shellThickness },
    u_clumpiness:      { value: params.clumpiness },
    u_interiorDensity: { value: params.interiorDensity },
    u_coreIntensity:   { value: params.coreIntensity },
    u_coreRadius:      { value: params.coreRadius },
    u_expansionRate:   { value: params.expansionRate },
    u_crescent:        { value: params.crescent },
    u_time:            { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'nebula:wolfrayet',
    ...baseMaterialProps(),
    vertexShader: nebulaVertSource,
    fragmentShader: nebulaWolfRayetFragSource,
    defines: { NEBULA_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'wolfrayet',
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
// Protoplanetary disk (T45 — ENT-5070)
// ---------------------------------------------------------------------------

function buildProtoplanetary(opts: NebulaMaterialOptions): NebulaMaterialHandle {
  const palette = PROTOPLANETARY_PALETTE;
  const params: ProtoplanetaryParams = {
    ...PROTOPLANETARY_PARAMS,
    ...opts.protoplanetaryParams,
  };
  const uniforms = {
    u_cameraLocal:    { value: new THREE.Vector3() },
    u_hotDustColor:   { value: color(palette.hotDustColor) },
    u_warmDustColor:  { value: color(palette.warmDustColor) },
    u_coolDustColor:  { value: color(palette.coolDustColor) },
    u_starColor:      { value: color(palette.starColor) },
    u_outerRadius:    { value: params.outerRadius },
    u_innerRadius:    { value: params.innerRadius },
    u_scaleHeight:    { value: params.scaleHeight },
    u_radialPower:    { value: params.radialPower },
    u_gap1Radius:     { value: params.gap1Radius },
    u_gap2Radius:     { value: params.gap2Radius },
    u_gapWidth:       { value: params.gapWidth },
    u_coreIntensity:  { value: params.coreIntensity },
    u_coreRadius:     { value: params.coreRadius },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'nebula:protoplanetary',
    ...baseMaterialProps(),
    vertexShader: nebulaVertSource,
    fragmentShader: nebulaProtoplanetaryFragSource,
    defines: { NEBULA_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'protoplanetary',
    material,
    update(_, _elapsedSec, cameraWorld, meshMatrixWorld) {
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Superbubble (T45 — ENT-5080)
// ---------------------------------------------------------------------------

function buildSuperbubble(opts: NebulaMaterialOptions): NebulaMaterialHandle {
  const palette = SUPERBUBBLE_PALETTE;
  const params: SuperbubbleParams = { ...SUPERBUBBLE_PARAMS, ...opts.superbubbleParams };
  const uniforms = {
    u_cameraLocal:        { value: new THREE.Vector3() },
    u_shellHaColor:       { value: color(palette.shellHaColor) },
    u_shellOiiiColor:     { value: color(palette.shellOiiiColor) },
    u_interiorColor:      { value: color(palette.interiorColor) },
    u_shellRadius:        { value: params.shellRadius },
    u_shellThickness:     { value: params.shellThickness },
    u_interiorDensity:    { value: params.interiorDensity },
    u_filamentStrength:   { value: params.filamentStrength },
    u_shellBrightness:    { value: params.shellBrightness },
    u_interiorBrightness: { value: params.interiorBrightness },
    u_blowout:            { value: params.blowout },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'nebula:superbubble',
    ...baseMaterialProps(),
    vertexShader: nebulaVertSource,
    fragmentShader: nebulaSuperbubbleFragSource,
    defines: { NEBULA_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'superbubble',
    material,
    update(_, _elapsedSec, cameraWorld, meshMatrixWorld) {
      syncCameraLocal(uniforms.u_cameraLocal, cameraWorld, meshMatrixWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Public factory — by family kind.
// ---------------------------------------------------------------------------

export function createNebulaMaterial(
  kind: NebulaKind,
  options: NebulaMaterialOptions = {},
): NebulaMaterialHandle {
  switch (kind) {
    case 'emission':       return buildEmission(options);
    case 'reflection':     return buildReflection(options);
    case 'dark':           return buildDark(options);
    case 'planetary':      return buildPlanetary(options);
    case 'supernova':      return buildSupernova(options);
    case 'wolfrayet':      return buildWolfRayet(options);
    case 'protoplanetary': return buildProtoplanetary(options);
    case 'superbubble':    return buildSuperbubble(options);
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown nebula kind: ${_exhaustive as string}`);
    }
  }
}

/**
 * T45 — create a material for one of the 14 Doc 17 subtypes by resolving
 * the subtype's rendering family and applying the canonical parameter
 * override patch from {@link NEBULA_SUBTYPE_OVERRIDES}. Caller-supplied
 * option fields still take precedence over the override (so a caller can
 * e.g. bump the plerion's `pulsarIntensity` beyond the default 1.2).
 */
export function createNebulaMaterialForSubtype(
  subtype: NebulaSubtype,
  options: NebulaMaterialOptions = {},
): NebulaMaterialHandle {
  const kind = subtypeToKind(subtype);
  const override = NEBULA_SUBTYPE_OVERRIDES[subtype];
  const merged: NebulaMaterialOptions = { ...options };
  if (override.emission) merged.emissionParams = { ...override.emission, ...options.emissionParams };
  if (override.dark) merged.darkParams = { ...override.dark, ...options.darkParams };
  if (override.planetary) merged.planetaryParams = { ...override.planetary, ...options.planetaryParams };
  if (override.supernova) merged.supernovaParams = { ...override.supernova, ...options.supernovaParams };
  if (override.wolfrayet) merged.wolfRayetParams = { ...override.wolfrayet, ...options.wolfRayetParams };
  if (override.supernovaPulsar !== undefined && options.pulsarIntensity === undefined) {
    merged.pulsarIntensity = override.supernovaPulsar;
  }
  // Planetary subtype also carries irregularity/bipolar defaults directly in
  // the param patch — surface them to explicit options so callers that read
  // handle.material.uniforms.u_bipolarRatio see the subtype-specific value.
  if (override.planetary?.bipolarRatio !== undefined && options.bipolarOverride === undefined) {
    merged.bipolarOverride = override.planetary.bipolarRatio;
  }
  if (override.planetary?.irregularity !== undefined && options.irregularityOverride === undefined) {
    merged.irregularityOverride = override.planetary.irregularity;
  }
  return createNebulaMaterial(kind, merged);
}
