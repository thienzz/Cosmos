import * as THREE from 'three';

import {
  planetExtremeFragSource,
  planetGasFragSource,
  planetRockyFragSource,
  planetVertSource,
} from '@/shaders';
import {
  EXTREME_PALETTES,
  EXTREME_PARAMS,
  GAS_PALETTES,
  GAS_PARAMS,
  ROCKY_PALETTES,
  ROCKY_PARAMS,
  type ExtremeKind,
  type GasGiantKind,
  type PlanetKind,
  type RockyPlanetKind,
  isExtremePlanet,
  isGasGiant,
  isRockyPlanet,
} from '@/utils/planetPalette';

/**
 * Build the per-planet `ShaderMaterial` for Doc 18 §Rocky Planets, §Gas
 * Giants, §Exotic Planet Types. T42 expansion supports all 27 kinds.
 *
 * Each variant is selected by `#define ROCKY_* / GAS_* / EXTREME_*`. For
 * back-compat, the solar-system factories still set the legacy
 * `PLANET_MERCURY`/`PLANET_JUPITER`/... defines in parallel — the shaders
 * alias those to the new `ROCKY_*`/`GAS_*` names.
 */

export interface PlanetMaterialOptions {
  sunDirection?: THREE.Vector3;
  /** For circumbinary planets: direction to the secondary star. */
  secondarySunDirection?: THREE.Vector3;
  ambientOverride?: number;
  atmosphereOverride?: number;
}

export interface PlanetMaterialHandle {
  kind: PlanetKind;
  material: THREE.ShaderMaterial;
  update(
    deltaSec: number,
    elapsedSec: number,
    sunDirectionWorld: THREE.Vector3,
    secondarySunDirectionWorld?: THREE.Vector3,
  ): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Defines
// ---------------------------------------------------------------------------

const ROCKY_DEFINE: Record<RockyPlanetKind, string> = {
  mercury: 'ROCKY_MERCURY',
  venus: 'ROCKY_VENUS',
  earth: 'ROCKY_EARTH',
  mars: 'ROCKY_MARS',
  'super-earth': 'ROCKY_SUPER_EARTH',
  magma: 'ROCKY_MAGMA',
  ocean: 'ROCKY_OCEAN',
  carbon: 'ROCKY_CARBON',
  iron: 'ROCKY_IRON',
  desert: 'ROCKY_DESERT',
  rogue: 'ROCKY_ROGUE',
  protoplanet: 'ROCKY_PROTOPLANET',
  water: 'ROCKY_WATER',
  chthonian: 'ROCKY_CHTHONIAN',
};

// Legacy back-compat aliases kept for the solar four (T13 paths referenced
// PLANET_*). New kinds use only ROCKY_*.
const ROCKY_LEGACY: Partial<Record<RockyPlanetKind, string>> = {
  mercury: 'PLANET_MERCURY',
  venus: 'PLANET_VENUS',
  earth: 'PLANET_EARTH',
  mars: 'PLANET_MARS',
};

const GAS_DEFINE: Record<GasGiantKind, string> = {
  jupiter: 'GAS_JUPITER',
  saturn: 'GAS_SATURN',
  uranus: 'GAS_URANUS',
  neptune: 'GAS_NEPTUNE',
  'hot-jupiter': 'GAS_HOT_JUPITER',
  'mini-neptune': 'GAS_MINI_NEPTUNE',
  puffy: 'GAS_PUFFY',
  helium: 'GAS_HELIUM',
  circumbinary: 'GAS_CIRCUMBINARY',
};

const GAS_LEGACY: Partial<Record<GasGiantKind, string>> = {
  jupiter: 'PLANET_JUPITER',
  saturn: 'PLANET_SATURN',
  uranus: 'PLANET_URANUS',
  neptune: 'PLANET_NEPTUNE',
};

const EXTREME_DEFINE: Record<ExtremeKind, string> = {
  hycean: 'EXTREME_HYCEAN',
  eyeball: 'EXTREME_EYEBALL',
  'tidally-heated': 'EXTREME_TIDALLY_HEATED',
  synestia: 'EXTREME_SYNESTIA',
};

function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function defines(kind: PlanetKind): Record<string, string> {
  const out: Record<string, string> = {};
  if (isRockyPlanet(kind)) {
    out[ROCKY_DEFINE[kind]] = '';
    const legacy = ROCKY_LEGACY[kind];
    if (legacy) out[legacy] = '';
  } else if (isGasGiant(kind)) {
    out[GAS_DEFINE[kind]] = '';
    const legacy = GAS_LEGACY[kind];
    if (legacy) out[legacy] = '';
  } else {
    out[EXTREME_DEFINE[kind]] = '';
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rocky factory
// ---------------------------------------------------------------------------

function buildRocky(
  kind: RockyPlanetKind,
  opts: PlanetMaterialOptions,
): PlanetMaterialHandle {
  const palette = ROCKY_PALETTES[kind];
  const params = ROCKY_PARAMS[kind];

  const uniforms = {
    u_baseColor: { value: color(palette.baseColor) },
    u_highlightColor: { value: color(palette.highlightColor) },
    u_shadowColor: { value: color(palette.shadowColor) },
    u_poleColor: { value: color(palette.poleColor) },
    u_atmosphereTint: { value: color(palette.atmosphereTint) },
    u_cloudColor: { value: color(palette.cloudColor) },
    u_emissiveColor: { value: color(palette.emissiveColor) },
    u_cloudCoverage: { value: params.cloudCoverage },
    u_cloudOpacity: { value: params.cloudOpacity },
    u_atmosphereStrength: {
      value: opts.atmosphereOverride ?? params.atmosphereStrength,
    },
    u_craterIntensity: { value: params.craterIntensity },
    u_polarCapExtent: { value: params.polarCapExtentDeg },
    u_nightEmission: { value: params.nightEmission },
    u_limbDarkening: { value: params.limbDarkening },
    u_ambientFloor: { value: opts.ambientOverride ?? params.ambientFloor },
    u_emissiveStrength: { value: params.emissiveStrength },
    u_specularStrength: { value: params.specularStrength },
    u_oceanLevel: { value: params.oceanLevel },
    u_terrainRoughness: { value: params.terrainRoughness },
    u_rotation: { value: 0 },
    u_time: { value: 0 },
    u_sunDir: {
      value: opts.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0),
    },
    // T52 Doc 22 Earth-specific feature toggles (ENT-2043). Only drive
    // ROCKY_EARTH branches; safe defaults (1.0 ON / 0.0 OFF per Doc 22) for
    // other rocky kinds that share this shader.
    u_continents:        { value: 1.0 },
    u_oceanCoverage:     { value: 1.0 },
    u_polarIce:          { value: 1.0 },
    u_volcanism:         { value: 1.0 },
    u_rayleighLimb:      { value: 1.0 },
    u_ozoneLayer:        { value: 0.0 },
    u_greenhouseEffect:  { value: 0.0 },
    u_cloudSystems:      { value: 1.0 },
    u_cyclones:          { value: 1.0 },
    u_seasonalChange:    { value: 0.0 },
    u_vegetationRedEdge: { value: 1.0 },
    u_oceanChlorophyll:  { value: 0.0 },
    u_o2Signature:       { value: 0.0 },
    u_cityLights:        { value: 0.0 },
    u_magneticShield:    { value: 1.0 },
    u_aurora:            { value: 0.0 },
    // T52 Doc 22 ENT-2010 Mercury toggles. Step/hash-based effects that
    // paint axis-aligned grid squares on the surface default OFF so the
    // base planet reads as a clean cratered sphere. User can opt into
    // them from the Doc 22 sidebar.
    u_raySystem:               { value: 0.0 },
    u_spaceWeathering:         { value: 1.0 },
    u_plainTerrain:            { value: 1.0 },
    u_peakRingBasins:          { value: 0.0 },
    u_secondaryCraters:        { value: 0.0 },
    u_craterShadows:           { value: 1.0 },
    u_ejectaBlankets:          { value: 0.0 },
    u_rupesScarp:              { value: 0.0 },
    u_ridgeOrientation:        { value: 0.0 },
    u_basinRings:              { value: 0.0 },
    u_calorisDepression:       { value: 0.0 },
    u_calorisRidges:           { value: 0.0 },
    u_antipodalHills:          { value: 0.0 },
    u_permanentShadow:         { value: 0.0 },
    u_waterIce:                { value: 0.0 },
    u_craterColdZones:         { value: 0.0 },
    u_sodiumTail:              { value: 0.0 },
    u_hydrogenCorona:          { value: 0.0 },
    u_dayglowEffect:           { value: 0.0 },
    u_subsolarGlow:            { value: 0.0 },
    u_nightSideCold:           { value: 0.0 },
    u_mercuryMagFieldLines:    { value: 0.0 },
    u_mercuryMagnetotail:      { value: 0.0 },
    // T52 Doc 22 ENT-2013 Mars toggles. Same policy as Mercury — turn off
    // the step/hash-based overlays that paint grid squares; keep the
    // smooth-noise ones (regolith base, polar caps) that define the planet.
    u_regolith:             { value: 1.0 },
    u_craters:              { value: 1.0 },
    u_vallesMarineris:      { value: 0.0 },
    u_olympusMons:          { value: 0.0 },
    u_dichotomy:            { value: 1.0 },
    u_tharsis:              { value: 0.0 },
    u_lavaPlains:           { value: 0.0 },
    u_fissureVents:         { value: 0.0 },
    u_wrinkleRidges:        { value: 0.0 },
    u_northPolarCap:        { value: 1.0 },
    u_southPolarCap:        { value: 1.0 },
    u_permanentFrost:       { value: 1.0 },
    u_seasonalSublimation:  { value: 0.0 },
    u_dustStorms:           { value: 0.0 },
    u_dustDevils:           { value: 0.0 },
    u_dustStreaks:          { value: 0.0 },
    u_diurnalDustOpacity:   { value: 0.0 },
    u_riverDeltas:          { value: 0.0 },
    u_subsurfaceWater:      { value: 0.0 },
    u_ancientLakes:         { value: 0.0 },
    u_atmosphereHaze:       { value: 1.0 },
    u_cO2Clouds:            { value: 0.0 },
    u_fossilAnomalies:      { value: 0.0 },
    u_magnetizationStripes: { value: 0.0 },
    u_settlements:          { value: 0.0 },
    u_solarPanels:          { value: 0.0 },
    // T52 Doc 22 ENT-2011 Venus toggles. Same cleanup: the many
    // step/hash/block overlays (pancakeDomes, tessera, basaltSurface,
    // lightningFlashes) default OFF so Venus reads as a smooth pale
    // yellow cloud-covered ball like the real planet from space.
    u_cloudDeck:            { value: 1.0 },
    u_equatorialStreaks:    { value: 0.0 },
    u_polarVortex:          { value: 0.0 },
    u_cloudAsymmetry:       { value: 1.0 },
    u_hadleyCell:           { value: 0.0 },
    u_superRotation:        { value: 0.0 },
    u_windShear:            { value: 0.0 },
    u_thermalTides:         { value: 0.0 },
    u_hazeLayer:            { value: 1.0 },
    u_radiativeOpacity:     { value: 0.0 },
    u_aerosolGradient:      { value: 0.0 },
    u_basaltSurface:        { value: 0.0 },
    u_pancakeDomes:         { value: 0.0 },
    u_tessera:              { value: 0.0 },
    u_lightningFlashes:     { value: 0.0 },
    u_lightningGlow:        { value: 0.0 },
    u_nightsideFlash:       { value: 0.0 },
    u_southDipole:          { value: 0.0 },
    u_dipoleOscillation:    { value: 0.0 },
    u_hydrogenTail:         { value: 0.0 },
    u_limbBrighten:         { value: 1.0 },
    u_subsolarBright:       { value: 1.0 },
    u_nightsideGlow:        { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    name: `planet-rocky:${kind}`,
    glslVersion: THREE.GLSL3,
    vertexShader: planetVertSource,
    fragmentShader: planetRockyFragSource,
    defines: defines(kind),
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });

  return {
    kind,
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

// ---------------------------------------------------------------------------
// Gas factory
// ---------------------------------------------------------------------------

function buildGas(
  kind: GasGiantKind,
  opts: PlanetMaterialOptions,
): PlanetMaterialHandle {
  const palette = GAS_PALETTES[kind];
  const params = GAS_PARAMS[kind];

  const uniforms = {
    u_zoneColor: { value: color(palette.zoneColor) },
    u_beltColor: { value: color(palette.beltColor) },
    u_poleColor: { value: color(palette.poleColor) },
    u_spotColor: { value: color(palette.spotColor) },
    u_atmosphereTint: { value: color(palette.atmosphereTint) },
    u_thermalColor: { value: color(palette.thermalColor) },
    u_bandCount: { value: params.bandCount },
    u_bandIntensity: { value: params.bandIntensity },
    u_spotLatDeg: { value: params.spotLatDeg },
    u_spotSize: { value: params.spotSize },
    u_spotIntensity: { value: params.spotIntensity },
    u_turbulence: { value: params.turbulence },
    u_hexagonStrength: { value: params.hexagonStrength },
    u_atmosphereStrength: {
      value: opts.atmosphereOverride ?? params.atmosphereStrength,
    },
    u_ambientFloor: { value: opts.ambientOverride ?? params.ambientFloor },
    u_limbDarkening: { value: params.limbDarkening },
    u_hazeDensity: { value: params.hazeDensity },
    u_puffyExpansion: { value: params.puffyExpansion },
    u_thermalIntensity: { value: params.thermalIntensity },
    u_secondarySunDir: {
      value: opts.secondarySunDirection?.clone() ?? new THREE.Vector3(-1, 0, 0),
    },
    u_secondarySunMix: { value: params.secondarySunMix },
    u_rotation: { value: 0 },
    u_time: { value: 0 },
    u_sunDir: {
      value: opts.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0),
    },
    // T52 Doc 22 ENT-2020 (Jupiter) + ENT-2021 (Saturn) feature toggles.
    // Defaults per Doc 22 (ON=1.0, OFF=0.0). Consumed only inside matching
    // GAS_JUPITER / GAS_SATURN branches.
    u_equatorialZone:      { value: 1.0 },
    u_equatorialBelts:     { value: 1.0 },
    u_northTempZone:       { value: 1.0 },
    u_southTempZone:       { value: 1.0 },
    u_polarRegions:        { value: 1.0 },
    u_gRSActive:           { value: 1.0 },
    u_ovalBA:              { value: 1.0 },
    u_whiteOvals:          { value: 1.0 },
    u_redPlumes:           { value: 1.0 },
    u_blueGreenJets:       { value: 0.0 },
    u_impactScars:         { value: 0.0 },
    u_ammoniaLayer:        { value: 1.0 },
    u_waterLayer:          { value: 1.0 },
    u_windShear:           { value: 1.0 },
    u_vorticity:           { value: 1.0 },
    u_hazeLayer:           { value: 1.0 },
    u_northPoleCyclones:   { value: 1.0 },
    u_southPoleCyclones:   { value: 1.0 },
    u_polarHaze:           { value: 1.0 },
    u_polarVortexWinds:    { value: 1.0 },
    u_lightningFlashes:    { value: 1.0 },
    u_auroralGlow:         { value: 1.0 },
    u_radioEmission:       { value: 0.0 },
    u_magneticRecFaint:    { value: 1.0 },
    u_mainRing:            { value: 1.0 },
    u_haloRing:            { value: 1.0 },
    u_ringClumps:          { value: 1.0 },
    u_magFieldLines:       { value: 1.0 },
    u_ioTorus:             { value: 1.0 },
    u_magnetotail:         { value: 1.0 },
    u_moonPositions:       { value: 1.0 },
    u_moonShadows:         { value: 1.0 },
    u_aRingMain:           { value: 1.0 },
    u_bRingMain:           { value: 1.0 },
    u_cRingMain:           { value: 1.0 },
    u_cassiniDiv:          { value: 1.0 },
    u_enckeKeekerGaps:     { value: 1.0 },
    u_dRingGossamer:       { value: 1.0 },
    u_eRingOuter:          { value: 0.0 },
    u_temperateBelts:      { value: 1.0 },
    u_hazeLimb:            { value: 1.0 },
    u_hexagonMain:         { value: 1.0 },
    u_hexagonEdges:        { value: 1.0 },
    u_hexagonInterior:     { value: 1.0 },
    u_greatWhiteSpot:      { value: 0.0 },
    u_stormClusters:       { value: 1.0 },
    u_redSpotSouth:        { value: 0.0 },
    u_ammoniumHS:          { value: 1.0 },
    u_enceladusTorus:      { value: 1.0 },
    u_titanHaze:           { value: 1.0 },
    u_axialTilt:           { value: 1.0 },
    u_seasonalIllum:       { value: 1.0 },
    // T52 Doc 22 ENT-2022 Uranus feature toggles.
    u_methaneLay:          { value: 1.0 },
    u_cloudDecks:          { value: 1.0 },
    u_faintZoning:         { value: 1.0 },
    u_limbHaze:            { value: 1.0 },
    u_equatorialBand:      { value: 1.0 },
    u_midLatBands:         { value: 1.0 },
    u_polarBrighten:       { value: 1.0 },
    u_poleWind:            { value: 1.0 },
    u_sunlitPole:          { value: 1.0 },
    u_nightPole:           { value: 1.0 },
    u_polarInversion:      { value: 0.0 },
    u_mainRings:           { value: 1.0 },
    u_epsilonRing:         { value: 1.0 },
    u_ringShepher:         { value: 1.0 },
    u_magDipole:           { value: 1.0 },
    u_magBulge:            { value: 1.0 },
    u_auroralMag:          { value: 1.0 },
    u_moonInclined:        { value: 1.0 },
    u_stratoHaze:          { value: 1.0 },
    u_thermalEmit:         { value: 0.0 },
    // T52 Doc 22 ENT-2023 Neptune feature toggles.
    u_baseBlue:            { value: 1.0 },
    u_equatorialDarker:    { value: 1.0 },
    u_cloudBreaks:         { value: 1.0 },
    u_greatDarkSpot:       { value: 1.0 },
    u_scooter:             { value: 1.0 },
    u_darkSpotSmall:       { value: 1.0 },
    u_brightOvals:         { value: 1.0 },
    u_equatorialJet:       { value: 1.0 },
    u_retrogradeBelts:     { value: 1.0 },
    u_midLatZones:         { value: 1.0 },
    u_polarCirc:           { value: 1.0 },
    u_methaneCirc:         { value: 1.0 },
    u_circusStreaks:       { value: 0.0 },
    u_convectivePlumes:    { value: 1.0 },
    u_thermalGlow:         { value: 1.0 },
    u_warmSpots:           { value: 1.0 },
    u_ringArcs:            { value: 1.0 },
    u_tritonPos:           { value: 1.0 },
    u_tritonGeysers:       { value: 1.0 },
    u_auroralAsym:         { value: 1.0 },
  };

  const material = new THREE.ShaderMaterial({
    name: `planet-gas:${kind}`,
    glslVersion: THREE.GLSL3,
    vertexShader: planetVertSource,
    fragmentShader: planetGasFragSource,
    defines: defines(kind),
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });

  return {
    kind,
    material,
    update(deltaSec, elapsedSec, sunDirWorld, secondarySunDirWorld) {
      uniforms.u_rotation.value += deltaSec * params.rotationRadPerSec;
      uniforms.u_time.value = elapsedSec;
      uniforms.u_sunDir.value.copy(sunDirWorld);
      if (secondarySunDirWorld) {
        uniforms.u_secondarySunDir.value.copy(secondarySunDirWorld);
      }
    },
    dispose() {
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Extreme factory
// ---------------------------------------------------------------------------

function buildExtreme(
  kind: ExtremeKind,
  opts: PlanetMaterialOptions,
): PlanetMaterialHandle {
  const palette = EXTREME_PALETTES[kind];
  const params = EXTREME_PARAMS[kind];

  const uniforms = {
    u_baseColor: { value: color(palette.baseColor) },
    u_highlightColor: { value: color(palette.highlightColor) },
    u_shadowColor: { value: color(palette.shadowColor) },
    u_poleColor: { value: color(palette.poleColor) },
    u_atmosphereTint: { value: color(palette.atmosphereTint) },
    u_hotspotColor: { value: color(palette.hotspotColor) },
    u_atmosphereStrength: {
      value: opts.atmosphereOverride ?? params.atmosphereStrength,
    },
    u_hazeDensity: { value: params.hazeDensity },
    u_emissiveStrength: { value: params.emissiveStrength },
    u_terminatorWidthDeg: { value: params.terminatorWidthDeg },
    u_plumeIntensity: { value: params.plumeIntensity },
    u_ringDustDensity: { value: params.ringDustDensity },
    u_limbDarkening: { value: params.limbDarkening },
    u_ambientFloor: { value: opts.ambientOverride ?? params.ambientFloor },
    u_rotation: { value: 0 },
    u_time: { value: 0 },
    u_sunDir: {
      value: opts.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0),
    },
  };

  const material = new THREE.ShaderMaterial({
    name: `planet-extreme:${kind}`,
    glslVersion: THREE.GLSL3,
    vertexShader: planetVertSource,
    fragmentShader: planetExtremeFragSource,
    defines: defines(kind),
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });

  return {
    kind,
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createPlanetMaterial(
  kind: PlanetKind,
  options: PlanetMaterialOptions = {},
): PlanetMaterialHandle {
  if (isRockyPlanet(kind)) return buildRocky(kind, options);
  if (isGasGiant(kind)) return buildGas(kind, options);
  if (isExtremePlanet(kind)) return buildExtreme(kind, options);
  throw new Error(`Unknown planet kind: ${kind as string}`);
}
