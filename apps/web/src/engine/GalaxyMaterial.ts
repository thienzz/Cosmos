import * as THREE from 'three';

import {
  galaxyAgnFragSource,
  galaxyEllipticalFragSource,
  galaxyIrregularFragSource,
  galaxyLenticularFragSource,
  galaxyMorphologySpecialFragSource,
  galaxySpiralFragSource,
  galaxyStarburstFragSource,
  galaxyVertSource,
} from '@/shaders';
import {
  AGN_PALETTE,
  AGN_PARAMS,
  AGN_SUBVARIANT_CODE,
  AGN_SUBVARIANT_PARAMS,
  ELLIPTICAL_PALETTE,
  ELLIPTICAL_PARAMS,
  ELLIPTICAL_SUBVARIANT_PARAMS,
  IRREGULAR_PALETTE,
  IRREGULAR_PARAMS,
  IRREGULAR_SUBVARIANT_PARAMS,
  LENTICULAR_PALETTE,
  LENTICULAR_PARAMS,
  MORPHOLOGY_SPECIAL_PALETTE,
  MORPHOLOGY_SPECIAL_PARAMS,
  SPECIAL_SUBVARIANT_CODE,
  SPECIAL_SUBVARIANT_PARAMS,
  SPIRAL_PALETTE,
  SPIRAL_PARAMS,
  SPIRAL_SUBVARIANT_PARAMS,
  STARBURST_PALETTE,
  STARBURST_PARAMS,
  STARBURST_SUBVARIANT_PARAMS,
  type AgnParams,
  type AgnSubvariant,
  type EllipticalParams,
  type EllipticalSubvariant,
  type GalaxyKind,
  type IrregularParams,
  type IrregularSubvariant,
  type MorphologySpecialParams,
  type SpecialSubvariant,
  type SpiralParams,
  type SpiralSubvariant,
  type StarburstParams,
  type StarburstSubvariant,
} from '@/utils/galaxyPalette';

/**
 * T29 + T46 — factory for Doc 18 §Galaxy Rendering shaders.
 *
 * One fragment shader per morphology family (spiral, elliptical, irregular,
 * lenticular, agn, starburst, morphology-special). T46 extends T29 to cover
 * all 19 Doc 17 subtypes via per-subvariant uniform overrides.
 *
 * Pattern matches T27 NebulaMaterial / T28 ExoticMaterial:
 *   - each kind raymarches a unit cube in mesh-local space
 *   - `u_cameraLocal` is CPU-computed per frame from the mesh's inverse
 *     world matrix
 *   - compile-time `#define GALAXY_STEPS` drives the loop budget
 */

export interface GalaxyMaterialOptions {
  /** Override the default GALAXY_STEPS for this kind. */
  stepsOverride?: number;
  /** Spiral: SA vs SB Barred (Doc 17 ENT-6010/6011). */
  spiralSubvariant?: SpiralSubvariant;
  /** Elliptical scale: giant E / dE / dSph (Doc 17 ENT-6020/6021/6022). */
  ellipticalSubvariant?: EllipticalSubvariant;
  /** Irregular: Irr I / Irr II (Doc 17 ENT-6030/6031). */
  irregularSubvariant?: IrregularSubvariant;
  /** AGN sub-variant (Doc 17 ENT-6040..6044). */
  agnSubvariant?: AgnSubvariant;
  /** Starburst sub-variant (Doc 17 ENT-6050/6053). */
  starburstSubvariant?: StarburstSubvariant;
  /** Morphology-special sub-variant (Doc 17 ENT-6051/6052/6054/6055). */
  specialSubvariant?: SpecialSubvariant;

  // Legacy T29 low-level overrides (preserved for back-compat).
  armCountOverride?: number;
  pitchAngleOverride?: number;
  barLengthOverride?: number;
  ellipticityOverride?: number;
  globularVisibilityOverride?: number;
  tidalStretchOverride?: number;
  dustOpacityOverride?: number;
}

export interface GalaxyMaterialHandle {
  kind: GalaxyKind;
  material: THREE.ShaderMaterial;
  update(
    deltaSec: number,
    elapsedSec: number,
    cameraWorld: THREE.Vector3,
    meshMatrixWorld: THREE.Matrix4,
  ): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Shared GL state
// ---------------------------------------------------------------------------

function baseMaterialProps(): Pick<
  THREE.ShaderMaterial,
  'glslVersion' | 'transparent' | 'depthWrite' | 'side' | 'blending'
> {
  return {
    glslVersion: THREE.GLSL3,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  };
}

function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

const _tmpCameraLocal = new THREE.Vector3();
const _tmpInvMatrix = new THREE.Matrix4();
function syncCameraLocal(
  uniform: THREE.IUniform<THREE.Vector3>,
  cameraWorld: THREE.Vector3,
  meshMatrixWorld: THREE.Matrix4,
): void {
  _tmpCameraLocal.copy(cameraWorld);
  _tmpInvMatrix.copy(meshMatrixWorld).invert();
  _tmpCameraLocal.applyMatrix4(_tmpInvMatrix);
  uniform.value.copy(_tmpCameraLocal);
}

// ---------------------------------------------------------------------------
// Spiral
// ---------------------------------------------------------------------------

function resolveSpiralParams(opts: GalaxyMaterialOptions): SpiralParams {
  const base: SpiralParams = { ...SPIRAL_PARAMS };
  if (opts.spiralSubvariant) Object.assign(base, SPIRAL_SUBVARIANT_PARAMS[opts.spiralSubvariant]);
  return base;
}

function buildSpiral(opts: GalaxyMaterialOptions): GalaxyMaterialHandle {
  const palette = SPIRAL_PALETTE;
  const params = resolveSpiralParams(opts);
  const uniforms = {
    u_cameraLocal:     { value: new THREE.Vector3() },
    u_armColor:        { value: color(palette.armColor) },
    u_interArmColor:   { value: color(palette.interArmColor) },
    u_bulgeColor:      { value: color(palette.bulgeColor) },
    u_dustColor:       { value: color(palette.dustColor) },
    u_hiiColor:        { value: color(palette.hiiColor) },
    u_barColor:        { value: color(palette.barColor) },
    u_haloColor:       { value: color(palette.haloColor) },
    u_pitchAngle:      { value: opts.pitchAngleOverride ?? params.pitchAngleRad },
    u_armCount:        { value: opts.armCountOverride ?? params.armCount },
    u_armWidth:        { value: params.armWidth },
    u_diskScaleRadius: { value: params.diskScaleRadius },
    u_diskThickness:   { value: params.diskThickness },
    u_bulgeRadius:     { value: params.bulgeRadius },
    u_bulgeSersic:     { value: params.bulgeSersic },
    u_barLength:       { value: opts.barLengthOverride ?? params.barLength },
    u_barArmAnchor:    { value: params.barArmAnchor },
    u_nuclearRing:     { value: params.nuclearRing },
    u_dustStrength:    { value: params.dustStrength },
    u_hiiDensity:      { value: params.hiiDensity },
    u_rotationPeriod:  { value: params.rotationPeriod },
    u_time:            { value: 0 },
    // T52 Doc 22 ENT-6010 feature toggles. Defaults per Doc 22 defaultOn.
    u_bulge:                     { value: 1.0 },
    u_bar:                       { value: 1.0 },
    u_bulgeDispersion:           { value: 0.0 },
    u_coreConcentration:         { value: 1.0 },
    u_metallicityGradient:       { value: 0.0 },
    u_spiralArms:                { value: 1.0 },
    u_armStarFormation:          { value: 1.0 },
    u_spiralShock:               { value: 1.0 },
    u_multipleArms:              { value: 1.0 },
    u_pitchVariation:            { value: 0.0 },
    u_armOrientation:            { value: 1.0 },
    u_thinDisk:                  { value: 1.0 },
    u_thickDisk:                 { value: 1.0 },
    u_dustLanes:                 { value: 1.0 },
    u_hILayer:                   { value: 1.0 },
    u_warp:                      { value: 0.0 },
    u_hIIRegions:                { value: 1.0 },
    u_nebulosity:                { value: 1.0 },
    u_ageGradient:               { value: 1.0 },
    u_oBAssociations:            { value: 0.0 },
    u_halo:                      { value: 1.0 },
    u_globularClusters:          { value: 1.0 },
    u_clusterBulgeConcentration: { value: 1.0 },
    u_stellarStreams:            { value: 0.0 },
    u_sMBH:                      { value: 1.0 },
    u_nuclearCluster:            { value: 1.0 },
    u_circumnuclearDisk:         { value: 0.0 },
    u_orbitalPerturbation:       { value: 0.0 },
    u_satellites:                { value: 0.0 },
    u_tidalStreams:              { value: 0.0 },
    u_dopplerTintGal:            { value: 0.0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'galaxy:spiral',
    ...baseMaterialProps(),
    vertexShader: galaxyVertSource,
    fragmentShader: galaxySpiralFragSource,
    defines: { GALAXY_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'spiral',
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
// Elliptical
// ---------------------------------------------------------------------------

function resolveEllipticalParams(opts: GalaxyMaterialOptions): EllipticalParams {
  const base: EllipticalParams = { ...ELLIPTICAL_PARAMS };
  if (opts.ellipticalSubvariant) Object.assign(base, ELLIPTICAL_SUBVARIANT_PARAMS[opts.ellipticalSubvariant]);
  return base;
}

function buildElliptical(opts: GalaxyMaterialOptions): GalaxyMaterialHandle {
  const palette = ELLIPTICAL_PALETTE;
  const params = resolveEllipticalParams(opts);
  const uniforms = {
    u_cameraLocal:         { value: new THREE.Vector3() },
    u_coreColor:           { value: color(palette.coreColor) },
    u_haloColor:           { value: color(palette.haloColor) },
    u_envelopeColor:       { value: color(palette.envelopeColor) },
    u_globularColor:       { value: color(palette.globularColor) },
    u_ellipticity:         { value: opts.ellipticityOverride ?? params.ellipticity },
    u_effectiveRadius:     { value: params.effectiveRadius },
    u_sersicIndex:         { value: params.sersicIndex },
    u_coreExcess:          { value: params.coreExcess },
    u_envelopeFalloff:     { value: params.envelopeFalloff },
    u_globularVisibility:  { value: opts.globularVisibilityOverride ?? params.globularVisibility },
    u_globularMetallicity: { value: params.globularMetallicity },
    u_diffuseness:         { value: params.diffuseness },
    u_nucleusStrength:     { value: params.nucleusStrength },
    u_time:                { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'galaxy:elliptical',
    ...baseMaterialProps(),
    vertexShader: galaxyVertSource,
    fragmentShader: galaxyEllipticalFragSource,
    defines: { GALAXY_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'elliptical',
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
// Irregular
// ---------------------------------------------------------------------------

function resolveIrregularParams(opts: GalaxyMaterialOptions): IrregularParams {
  const base: IrregularParams = { ...IRREGULAR_PARAMS };
  if (opts.irregularSubvariant) Object.assign(base, IRREGULAR_SUBVARIANT_PARAMS[opts.irregularSubvariant]);
  return base;
}

function buildIrregular(opts: GalaxyMaterialOptions): GalaxyMaterialHandle {
  const palette = IRREGULAR_PALETTE;
  const params = resolveIrregularParams(opts);
  const uniforms = {
    u_cameraLocal:       { value: new THREE.Vector3() },
    u_youngStarColor:    { value: color(palette.youngStarColor) },
    u_oldStarColor:      { value: color(palette.oldStarColor) },
    u_starburstColor:    { value: color(palette.starburstColor) },
    u_hiiColor:          { value: color(palette.hiiColor) },
    u_dustColor:         { value: color(palette.dustColor) },
    u_fbmScale:          { value: params.fbmScale },
    u_clumpCount:        { value: params.clumpCount },
    u_clumpIntensity:    { value: params.clumpIntensity },
    u_tidalStretch:      { value: opts.tidalStretchOverride ?? params.tidalStretch },
    u_tidalTailStrength: { value: params.tidalTailStrength },
    u_dustChaos:         { value: params.dustChaos },
    u_dualNucleus:       { value: params.dualNucleus },
    u_hiiStrength:       { value: params.hiiStrength },
    u_time:              { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'galaxy:irregular',
    ...baseMaterialProps(),
    vertexShader: galaxyVertSource,
    fragmentShader: galaxyIrregularFragSource,
    defines: { GALAXY_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'irregular',
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
// Lenticular
// ---------------------------------------------------------------------------

function buildLenticular(opts: GalaxyMaterialOptions): GalaxyMaterialHandle {
  const palette = LENTICULAR_PALETTE;
  const params = LENTICULAR_PARAMS;
  const uniforms = {
    u_cameraLocal:     { value: new THREE.Vector3() },
    u_bulgeColor:      { value: color(palette.bulgeColor) },
    u_innerDiskColor:  { value: color(palette.innerDiskColor) },
    u_outerDiskColor:  { value: color(palette.outerDiskColor) },
    u_haloColor:       { value: color(palette.haloColor) },
    u_dustColor:       { value: color(palette.dustColor) },
    u_diskScaleRadius: { value: params.diskScaleRadius },
    u_diskThickness:   { value: params.diskThickness },
    u_bulgeRadius:     { value: params.bulgeRadius },
    u_bulgeSersic:     { value: params.bulgeSersic },
    u_azimuthalRipple: { value: params.azimuthalRipple },
    u_dustOpacity:     { value: opts.dustOpacityOverride ?? params.dustOpacity },
    u_time:            { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: 'galaxy:lenticular',
    ...baseMaterialProps(),
    vertexShader: galaxyVertSource,
    fragmentShader: galaxyLenticularFragSource,
    defines: { GALAXY_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'lenticular',
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
// AGN (T46)
// ---------------------------------------------------------------------------

function resolveAgnParams(opts: GalaxyMaterialOptions): {
  params: AgnParams;
  subvariant: AgnSubvariant;
} {
  const subvariant = opts.agnSubvariant ?? 'seyfert1';
  const params: AgnParams = { ...AGN_PARAMS, ...AGN_SUBVARIANT_PARAMS[subvariant] };
  return { params, subvariant };
}

function buildAgn(opts: GalaxyMaterialOptions): GalaxyMaterialHandle {
  const palette = AGN_PALETTE;
  const { params, subvariant } = resolveAgnParams(opts);
  const uniforms = {
    u_cameraLocal:       { value: new THREE.Vector3() },
    u_hostColor:         { value: color(palette.hostColor) },
    u_bulgeColor:        { value: color(palette.bulgeColor) },
    u_coreColor:         { value: color(palette.coreColor) },
    u_accretionColor:    { value: color(palette.accretionColor) },
    u_torusColor:        { value: color(palette.torusColor) },
    u_nlrColor:          { value: color(palette.nlrColor) },
    u_jetColor:          { value: color(palette.jetColor) },
    u_lobeColor:         { value: color(palette.lobeColor) },
    u_hiiColor:          { value: color(palette.hiiColor) },
    u_agnSubtype:        { value: AGN_SUBVARIANT_CODE[subvariant] },
    u_hostMorphology:    { value: params.hostMorphology },
    u_hostDiskRadius:    { value: params.hostDiskRadius },
    u_hostBulgeRadius:   { value: params.hostBulgeRadius },
    u_coreRadius:        { value: params.coreRadius },
    u_coreIntensity:     { value: params.coreIntensity },
    u_accretionIntensity:{ value: params.accretionIntensity },
    u_torusRadius:       { value: params.torusRadius },
    u_torusThickness:    { value: params.torusThickness },
    u_torusStrength:     { value: params.torusStrength },
    u_nlrConeAngle:      { value: params.nlrConeAngle },
    u_nlrStrength:       { value: params.nlrStrength },
    u_jetStrength:       { value: params.jetStrength },
    u_jetLength:         { value: params.jetLength },
    u_jetRadius:         { value: params.jetRadius },
    u_jetAsymmetry:      { value: params.jetAsymmetry },
    u_lobeStrength:      { value: params.lobeStrength },
    u_lobeRadius:        { value: params.lobeRadius },
    u_variability:       { value: params.variability },
    u_time:              { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: `galaxy:agn:${subvariant}`,
    ...baseMaterialProps(),
    vertexShader: galaxyVertSource,
    fragmentShader: galaxyAgnFragSource,
    defines: { GALAXY_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'agn',
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
// Starburst / ULIRG (T46)
// ---------------------------------------------------------------------------

function resolveStarburstParams(opts: GalaxyMaterialOptions): {
  params: StarburstParams;
  subvariant: StarburstSubvariant;
} {
  const subvariant = opts.starburstSubvariant ?? 'starburst';
  const params: StarburstParams = { ...STARBURST_PARAMS, ...STARBURST_SUBVARIANT_PARAMS[subvariant] };
  return { params, subvariant };
}

function buildStarburst(opts: GalaxyMaterialOptions): GalaxyMaterialHandle {
  const palette = STARBURST_PALETTE;
  const { params, subvariant } = resolveStarburstParams(opts);
  const uniforms = {
    u_cameraLocal:        { value: new THREE.Vector3() },
    u_youngStarColor:     { value: color(palette.youngStarColor) },
    u_oldStarColor:       { value: color(palette.oldStarColor) },
    u_hiiColor:           { value: color(palette.hiiColor) },
    u_dustCoolColor:      { value: color(palette.dustCoolColor) },
    u_dustWarmColor:      { value: color(palette.dustWarmColor) },
    u_superwindColor:     { value: color(palette.superwindColor) },
    u_nucleusColor:       { value: color(palette.nucleusColor) },
    u_diskRadius:         { value: params.diskRadius },
    u_diskThickness:      { value: params.diskThickness },
    u_nucleusStrength:    { value: params.nucleusStrength },
    u_hiiClumpCount:      { value: params.hiiClumpCount },
    u_hiiClumpIntensity:  { value: params.hiiClumpIntensity },
    u_superwindStrength:  { value: params.superwindStrength },
    u_superwindAxisReach: { value: params.superwindAxisReach },
    u_dustStrength:       { value: params.dustStrength },
    u_ulirgBlend:         { value: params.ulirgBlend },
    u_dualNucleus:        { value: params.dualNucleus },
    u_time:               { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: `galaxy:starburst:${subvariant}`,
    ...baseMaterialProps(),
    vertexShader: galaxyVertSource,
    fragmentShader: galaxyStarburstFragSource,
    defines: { GALAXY_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'starburst',
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
// Morphology-special (Ring / Jellyfish / UDG / Merging) — T46
// ---------------------------------------------------------------------------

function resolveMorphSpecialParams(opts: GalaxyMaterialOptions): {
  params: MorphologySpecialParams;
  subvariant: SpecialSubvariant;
} {
  const subvariant = opts.specialSubvariant ?? 'ring';
  const params: MorphologySpecialParams = {
    ...MORPHOLOGY_SPECIAL_PARAMS,
    ...SPECIAL_SUBVARIANT_PARAMS[subvariant],
  };
  return { params, subvariant };
}

function buildMorphologySpecial(opts: GalaxyMaterialOptions): GalaxyMaterialHandle {
  const palette = MORPHOLOGY_SPECIAL_PALETTE;
  const { params, subvariant } = resolveMorphSpecialParams(opts);
  const uniforms = {
    u_cameraLocal:     { value: new THREE.Vector3() },
    u_shockFrontColor: { value: color(palette.shockFrontColor) },
    u_ringBulkColor:   { value: color(palette.ringBulkColor) },
    u_trailColor:      { value: color(palette.trailColor) },
    u_nucleusColor:    { value: color(palette.nucleusColor) },
    u_dustColor:       { value: color(palette.dustColor) },
    u_gasColor:        { value: color(palette.gasColor) },
    u_udgColor:        { value: color(palette.udgColor) },
    u_gcColor:         { value: color(palette.gcColor) },
    u_tidalTailColor:  { value: color(palette.tidalTailColor) },
    u_brightCoreColor: { value: color(palette.brightCoreColor) },
    u_specialSubtype:  { value: SPECIAL_SUBVARIANT_CODE[subvariant] },
    u_ringRadius:      { value: params.ringRadius },
    u_ringWidth:       { value: params.ringWidth },
    u_ringSpokes:      { value: params.ringSpokes },
    u_ringNucleus:     { value: params.ringNucleus },
    u_ringExpansion:   { value: params.ringExpansion },
    u_jellyTailLength: { value: params.jellyTailLength },
    u_jellyCompression:{ value: params.jellyCompression },
    u_jellyTailClumps: { value: params.jellyTailClumps },
    u_udgHaloRadius:   { value: params.udgHaloRadius },
    u_udgGcCount:      { value: params.udgGcCount },
    u_udgNucleated:    { value: params.udgNucleated },
    u_mergerSeparation:{ value: params.mergerSeparation },
    u_mergerStage:     { value: params.mergerStage },
    u_mergerTailLength:{ value: params.mergerTailLength },
    u_time:            { value: 0 },
  };
  const steps = opts.stepsOverride ?? params.steps;
  const material = new THREE.ShaderMaterial({
    name: `galaxy:morphology-special:${subvariant}`,
    ...baseMaterialProps(),
    vertexShader: galaxyVertSource,
    fragmentShader: galaxyMorphologySpecialFragSource,
    defines: { GALAXY_STEPS: String(steps) },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });
  return {
    kind: 'morphology-special',
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
// Public factory
// ---------------------------------------------------------------------------

export function createGalaxyMaterial(
  kind: GalaxyKind,
  options: GalaxyMaterialOptions = {},
): GalaxyMaterialHandle {
  switch (kind) {
    case 'spiral':             return buildSpiral(options);
    case 'elliptical':         return buildElliptical(options);
    case 'irregular':          return buildIrregular(options);
    case 'lenticular':         return buildLenticular(options);
    case 'agn':                return buildAgn(options);
    case 'starburst':          return buildStarburst(options);
    case 'morphology-special': return buildMorphologySpecial(options);
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown galaxy kind: ${_exhaustive as string}`);
    }
  }
}
