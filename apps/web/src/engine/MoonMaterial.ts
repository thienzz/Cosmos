import * as THREE from 'three';

import {
  moonAtmosphericFragSource,
  moonExtremeFragSource,
  moonIcyFragSource,
  moonMinorFragSource,
  moonRockyFragSource,
  moonVertSource,
  moonVolcanicFragSource,
} from '@/shaders';
import {
  MOON_PALETTES,
  MOON_PARAMS,
  familyOf,
  type MoonFamily,
  type MoonKind,
} from '@/utils/moonPalette';

/**
 * Moon material factory — T43 complement to `PlanetMaterial`.
 *
 * Each of the 15 Doc 17 moon subtypes (§3010..3024) is driven by one of
 * 6 shader families (moon-rocky / moon-volcanic / moon-icy /
 * moon-atmospheric / moon-extreme / moon-minor). The specific subtype
 * is selected via a `#define MOON_*` on the fragment shader, same
 * pattern as the planet materials.
 */

export interface MoonMaterialOptions {
  sunDirection?: THREE.Vector3;
  ambientOverride?: number;
  /** Override the default emissive intensity (used by Io close-zoom etc.). */
  emissiveOverride?: number;
}

export interface MoonMaterialHandle {
  kind: MoonKind;
  family: MoonFamily;
  material: THREE.ShaderMaterial;
  update(
    deltaSec: number,
    elapsedSec: number,
    sunDirectionWorld: THREE.Vector3,
  ): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// `#define` map — maps the canonical kind string to the GLSL define symbol.
// ---------------------------------------------------------------------------

const MOON_DEFINE: Record<MoonKind, string> = {
  luna: 'MOON_LUNA',
  callisto: 'MOON_CALLISTO',
  irregular: 'MOON_IRREGULAR',
  io: 'MOON_IO',
  'tidal-heated': 'MOON_TIDAL_HEATED',
  europa: 'MOON_EUROPA',
  enceladus: 'MOON_ENCELADUS',
  ganymede: 'MOON_GANYMEDE',
  'subsurface-ocean': 'MOON_SUBSURFACE_OCEAN',
  titan: 'MOON_TITAN',
  triton: 'MOON_TRITON',
  miranda: 'MOON_MIRANDA',
  hyperion: 'MOON_HYPERION',
  shepherd: 'MOON_SHEPHERD',
  'trojan-moon': 'MOON_TROJAN_MOON',
  binary: 'MOON_BINARY',
};

const FAMILY_FRAG: Record<MoonFamily, string> = {
  rocky: moonRockyFragSource,
  volcanic: moonVolcanicFragSource,
  icy: moonIcyFragSource,
  atmospheric: moonAtmosphericFragSource,
  extreme: moonExtremeFragSource,
  minor: moonMinorFragSource,
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function createMoonMaterial(
  kind: MoonKind,
  options: MoonMaterialOptions = {},
): MoonMaterialHandle {
  const family = familyOf(kind);
  const palette = MOON_PALETTES[kind];
  const params = MOON_PARAMS[kind];

  const uniforms = {
    u_baseColor: { value: color(palette.baseColor) },
    u_highlightColor: { value: color(palette.highlightColor) },
    u_shadowColor: { value: color(palette.shadowColor) },
    u_poleColor: { value: color(palette.poleColor) },
    u_atmosphereTint: { value: color(palette.atmosphereTint) },
    u_emissiveColor: { value: color(palette.emissiveColor) },
    u_atmosphereStrength: { value: params.atmosphereStrength },
    u_emissiveStrength: {
      value: options.emissiveOverride ?? params.emissiveStrength,
    },
    u_plumeIntensity: { value: params.plumeIntensity },
    u_craterIntensity: { value: params.craterIntensity },
    u_polarCapExtent: { value: params.polarCapExtentDeg },
    u_hazeCoverage: { value: params.hazeCoverage },
    u_specularStrength: { value: params.specularStrength },
    u_terrainRoughness: { value: params.terrainRoughness },
    u_tholinAmount: { value: params.tholinAmount },
    u_limbDarkening: { value: params.limbDarkening },
    u_ambientFloor: { value: options.ambientOverride ?? params.ambientFloor },
    u_rotation: { value: 0 },
    u_time: { value: 0 },
    u_sunDir: {
      value: options.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0),
    },
    // T52 Doc 22 ENT-3001 Luna toggles (defaults per Doc 22).
    u_highlands:            { value: 1.0 },
    u_maria:                { value: 1.0 },
    u_mariaBoundary:        { value: 1.0 },
    u_swirls:               { value: 0.0 },
    u_craters:              { value: 1.0 },
    u_tychoCrater:          { value: 1.0 },
    u_centralPeaks:         { value: 1.0 },
    u_ejectaRays:           { value: 1.0 },
    u_secondaryChains:      { value: 1.0 },
    u_regolith:             { value: 1.0 },
    u_spaceWeathering:      { value: 1.0 },
    u_raySystems:           { value: 1.0 },
    u_rayDegradation:       { value: 0.0 },
    u_earthshine:           { value: 1.0 },
    u_earthshineTint:       { value: 0.0 },
    u_terminatorShadow:     { value: 1.0 },
    u_terminatorGradient:   { value: 1.0 },
    u_permanentShadow:      { value: 1.0 },
    u_waterIce:             { value: 1.0 },
    u_frostRings:           { value: 0.0 },
    u_exosphereEmission:    { value: 0.0 },
    u_exosphereDust:        { value: 0.0 },
    u_apolloSites:          { value: 0.0 },
    u_lunarBase:            { value: 0.0 },
    // T52 Doc 22 ENT-3010 Io canonical Doc 22 names.
    u_tidalHeating:         { value: 1.0 },
    u_volcanicActivity:     { value: 1.0 },
    u_magmaChannels:        { value: 1.0 },
    u_lokiPatera:           { value: 1.0 },
    u_pateraNetwork:        { value: 1.0 },
    u_volcanicCones:        { value: 1.0 },
    u_lavaFlowNetwork:      { value: 1.0 },
    u_yellowSulfur:         { value: 1.0 },
    u_darkSulfur:           { value: 1.0 },
    u_sulfurCracks:         { value: 1.0 },
    u_moltenLakes:          { value: 1.0 },
    u_lavaCrust:            { value: 1.0 },
    u_lavaFountains:        { value: 1.0 },
    u_umbrellaPlumes:       { value: 1.0 },
    u_plumeFallout:         { value: 1.0 },
    u_plumeAnimation:       { value: 1.0 },
    u_sO2Emission:          { value: 1.0 },
    u_sO2Frost:             { value: 1.0 },
    u_frostSublimation:     { value: 1.0 },
    u_frostContamination:   { value: 0.0 },
    u_plasmaGlow:           { value: 1.0 },
    u_sodiumCloud:          { value: 1.0 },
    u_magneticFootprint:    { value: 1.0 },
    // T52 Doc 22 ENT-3011 Europa canonical names.
    u_iceCrust:             { value: 1.0 },
    u_iceThickness:         { value: 1.0 },
    u_radiationDarkening:   { value: 1.0 },
    u_craterRemnants:       { value: 1.0 },
    u_linearLineae:         { value: 1.0 },
    u_doubleRidges:         { value: 1.0 },
    u_tripleRidges:         { value: 1.0 },
    u_linaeAge:             { value: 0.0 },
    u_conamaraIceChaos:     { value: 1.0 },
    u_chaosBlocks:          { value: 1.0 },
    u_chaosUpwelling:       { value: 1.0 },
    u_oceanGlow:            { value: 0.0 },
    u_thermalSignature:     { value: 0.0 },
    u_cryoPlumes:           { value: 1.0 },
    u_iceEruptionDeposits:  { value: 1.0 },
    u_tidalFractures:       { value: 1.0 },
    u_riftZones:            { value: 1.0 },
    u_stressDirection:      { value: 0.0 },
    u_inducedDipole:        { value: 1.0 },
    u_saltDeposits:         { value: 1.0 },
    u_saltVariation:        { value: 1.0 },
    // T52 Doc 22 ENT-3012 Ganymede canonical names.
    u_darkTerrain:          { value: 1.0 },
    u_darkRays:             { value: 1.0 },
    u_terrainRoughnessMoon: { value: 1.0 },
    u_magneticAnomaly:      { value: 0.0 },
    u_groovedTerrain:       { value: 1.0 },
    u_grooveRidges:         { value: 1.0 },
    u_grooveOrientation:    { value: 0.0 },
    u_crosscuttingGrooves:  { value: 1.0 },
    u_gilgameshBasin:       { value: 1.0 },
    u_rayEjecta:            { value: 1.0 },
    u_rayFading:            { value: 0.0 },
    u_oceanConvection:      { value: 0.0 },
    u_oceanConductivity:    { value: 0.0 },
    u_dipoleField:          { value: 1.0 },
    u_magneticPoles:        { value: 1.0 },
    u_magnetosphereSize:    { value: 1.0 },
    u_aurorae:              { value: 1.0 },
    u_auroraVariability:    { value: 1.0 },
    u_magnetotail:          { value: 1.0 },
    // T52 Doc 22 ENT-3020 Titan canonical names.
    u_atmosphereHaze:       { value: 1.0 },
    u_upperHaze:            { value: 1.0 },
    u_stratosphere:         { value: 1.0 },
    u_atmosBands:           { value: 1.0 },
    u_tholinHaze:           { value: 1.0 },
    u_methaneClouds:        { value: 1.0 },
    u_hazeVariation:        { value: 1.0 },
    u_bedrockElevation:     { value: 0.0 },
    u_xanaduRegion:         { value: 1.0 },
    u_krakenMare:           { value: 1.0 },
    u_ligeiaMare:           { value: 1.0 },
    u_smallLakes:           { value: 1.0 },
    u_coastlineDetail:      { value: 1.0 },
    u_methaneRain:          { value: 0.0 },
    u_cumulonimbusUpper:    { value: 1.0 },
    u_windStreaks:          { value: 1.0 },
    u_cryoDomes:            { value: 0.0 },
    u_cryoLavaFlows:        { value: 0.0 },
    u_sandDunes:            { value: 1.0 },
    u_duneMigration:        { value: 0.0 },
    u_jetStreamWind:        { value: 1.0 },
    u_seasonalWindReversal: { value: 1.0 },
    // T52 Doc 22 ENT-3021 Enceladus canonical names.
    u_whiteIce:             { value: 1.0 },
    u_oldTerrain:           { value: 1.0 },
    u_iceGrainSize:         { value: 1.0 },
    u_tigerStripes:         { value: 1.0 },
    u_fractureWallHeight:   { value: 1.0 },
    u_fractureGlow:         { value: 1.0 },
    u_waterPlumes:          { value: 1.0 },
    u_plumeSpreading:       { value: 1.0 },
    u_plumeFallback:        { value: 1.0 },
    u_eruptionFrequency:    { value: 1.0 },
    u_southPolarHeat:       { value: 1.0 },
    u_hotspotShifting:      { value: 1.0 },
    u_oceanGlowEnc:         { value: 1.0 },
    u_oceanThermal:         { value: 1.0 },
    u_eringParticles:       { value: 1.0 },
    u_ejectionCone:         { value: 1.0 },
    u_blueTerrain:          { value: 1.0 },
  };

  const material = new THREE.ShaderMaterial({
    name: `moon:${family}:${kind}`,
    glslVersion: THREE.GLSL3,
    vertexShader: moonVertSource,
    fragmentShader: FAMILY_FRAG[family],
    defines: { [MOON_DEFINE[kind]]: '' },
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });

  return {
    kind,
    family,
    material,
    update(deltaSec, elapsedSec, sunDirWorld) {
      uniforms.u_rotation.value += deltaSec * params.rotationRadPerSec;
      uniforms.u_time.value = elapsedSec;
      uniforms.u_sunDir.value.copy(sunDirWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}
