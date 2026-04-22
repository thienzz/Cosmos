import type { EntityRenderBlock } from '@cosmos/shared-types';
import * as THREE from 'three';

import {
  clusterCollisionFragSource,
  clusterCollisionVertSource,
  clusterGlobularFragSource,
  clusterGlobularVertSource,
  clusterObFragSource,
  clusterObVertSource,
  clusterOpenFragSource,
  clusterOpenVertSource,
  exoplanetHostMarkerFragSource,
  exoplanetHostMarkerVertSource,
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
  galaxyAgnFragSource,
  galaxyEllipticalFragSource,
  galaxyIrregularFragSource,
  galaxyLenticularFragSource,
  galaxyMorphologySpecialFragSource,
  galaxySpiralFragSource,
  galaxyStarburstFragSource,
  galaxyVertSource,
  lssFilamentFragSource,
  lssFilamentVertSource,
  lssGreatWallFragSource,
  lssGreatWallVertSource,
  lssSuperclusterFragSource,
  lssSuperclusterVertSource,
  lssVoidFragSource,
  lssVoidVertSource,
  lymanAlphaBlobFragSource,
  lymanAlphaBlobVertSource,
  meteoroidStreamFragSource,
  meteoroidStreamVertSource,
  moonAtmosphericFragSource,
  moonExtremeFragSource,
  moonIcyFragSource,
  moonMinorFragSource,
  moonRockyFragSource,
  moonVertSource,
  moonVolcanicFragSource,
  nebulaDarkFragSource,
  nebulaEmissionFragSource,
  nebulaPlanetaryFragSource,
  nebulaProtoplanetaryFragSource,
  nebulaReflectionFragSource,
  nebulaSuperbubbleFragSource,
  nebulaSupernovaFragSource,
  nebulaVertSource,
  nebulaWolfRayetFragSource,
  planetExtremeFragSource,
  planetGasFragSource,
  planetRockyFragSource,
  planetVertSource,
  smallbodyAsteroidBinaryFragSource,
  smallbodyAsteroidBinaryVertSource,
  smallbodyAsteroidFragSource,
  smallbodyAsteroidVertSource,
  smallbodyCentaurFragSource,
  smallbodyCentaurVertSource,
  smallbodyCometFragSource,
  smallbodyCometVertSource,
  smallbodyKboFragSource,
  smallbodyKboVertSource,
  smallbodyRubbleFragSource,
  smallbodyRubbleVertSource,
  smallbodyTrojanFragSource,
  smallbodyTrojanVertSource,
  starBinaryFragSource,
  starBrownDwarfFragSource,
  starBrownDwarfVertSource,
  starCarbonFragSource,
  starCarbonVertSource,
  starPmsFragSource,
  starPmsVertSource,
  starSubdwarfFragSource,
  starSubdwarfVertSource,
  starEvolvedFragSource,
  starMainseqFragSource,
  starRemnantFragSource,
  starVariableFragSource,
  starVertSource,
} from '@/shaders';

/**
 * MaterialFactory — T-V-00. Single entry point for building per-entity
 * `THREE.ShaderMaterial` instances from the 262-shader visual-coverage
 * rollout (viz-visuals.md).
 *
 * Responsibilities:
 *   1. Resolve the shader registry key from either an explicit `render` block
 *      (API-driven path) or a `kind` hint (legacy fallback).
 *   2. Build a `ShaderMaterial` with GLSL3 + bundled vert/frag sources.
 *   3. Apply compile-time `#define`s and runtime uniform overrides.
 *   4. Attach standard uniforms every shader relies on (`u_time`,
 *      `u_logDepthCoef`, `u_cameraRelativeOrigin`).
 *
 * Non-responsibilities (yet): eliminating inline `new ShaderMaterial` usages
 * scattered across engine/* — that's T-V-58 (integration sweep). The factory
 * coexists with existing `*Material.ts` builders during rollout.
 */

/** Minimal input shape — kept permissive so arbitrary entity objects fit. */
export interface MaterialFactoryInput {
  /** Canonical entity ID (e.g. `'ENT-4010'`) — used when render/kind absent. */
  id?: string;
  /** Legacy alias for `id`; some call sites pass ENT_ID via this name. */
  ent_id?: string;
  /** Explicit shader-family hint (e.g. `'rocky_planet'`, `'moon'`). */
  kind?: string;
  /** Discriminated-union tag from `CelestialObject` (`'planet'`, `'star'`, …). */
  object_type?: string;
  /** Optional per-entity render override. When present, drives shader choice. */
  render?: EntityRenderBlock;
}

export interface MaterialFactoryOptions {
  /** Seeds `u_cameraRelativeOrigin`. Defaults to the scene origin. */
  cameraRelativeOrigin?: THREE.Vector3;
  /** Seeds `u_logDepthCoef`. Defaults to `2.0 / log2(farPlane + 1)` for far=1e12. */
  logDepthCoef?: number;
  /** Friendly name stamped on the resulting material. */
  debugName?: string;
}

interface ShaderEntry {
  vert: string;
  frag: string;
}

/**
 * Bundled shader registry. Keys are the canonical shader names used in the
 * `render.shader` field (matches Doc 17 checklist column 3). Add a row here
 * each time a new `.frag` file lands in `apps/web/src/shaders/`.
 */
const SHADER_REGISTRY: Readonly<Record<string, ShaderEntry>> = Object.freeze({
  // Clusters (T-V-11..T-V-14) + Lyman-α (T-V-15)
  'cluster-open':      { vert: clusterOpenVertSource, frag: clusterOpenFragSource },
  'cluster-globular':  { vert: clusterGlobularVertSource, frag: clusterGlobularFragSource },
  'cluster-ob':        { vert: clusterObVertSource, frag: clusterObFragSource },
  'cluster-collision': { vert: clusterCollisionVertSource, frag: clusterCollisionFragSource },
  'lyman-alpha-blob':  { vert: lymanAlphaBlobVertSource, frag: lymanAlphaBlobFragSource },
  'lss-supercluster':  { vert: lssSuperclusterVertSource, frag: lssSuperclusterFragSource },
  'lss-filament':      { vert: lssFilamentVertSource, frag: lssFilamentFragSource },
  'lss-void':          { vert: lssVoidVertSource, frag: lssVoidFragSource },
  'lss-great-wall':    { vert: lssGreatWallVertSource, frag: lssGreatWallFragSource },

  // Planets
  'planet-rocky':   { vert: planetVertSource, frag: planetRockyFragSource },
  'planet-gas':     { vert: planetVertSource, frag: planetGasFragSource },
  'planet-extreme': { vert: planetVertSource, frag: planetExtremeFragSource },

  // Moons
  'moon-rocky':       { vert: moonVertSource, frag: moonRockyFragSource },
  'moon-icy':         { vert: moonVertSource, frag: moonIcyFragSource },
  'moon-volcanic':    { vert: moonVertSource, frag: moonVolcanicFragSource },
  'moon-atmospheric': { vert: moonVertSource, frag: moonAtmosphericFragSource },
  'moon-extreme':     { vert: moonVertSource, frag: moonExtremeFragSource },
  'moon-minor':       { vert: moonVertSource, frag: moonMinorFragSource },

  // Stars
  'star-mainseq':     { vert: starVertSource, frag: starMainseqFragSource },
  'star-evolved':     { vert: starVertSource, frag: starEvolvedFragSource },
  'star-remnant':     { vert: starVertSource, frag: starRemnantFragSource },
  'star-variable':    { vert: starVertSource, frag: starVariableFragSource },
  'star-binary':      { vert: starVertSource, frag: starBinaryFragSource },
  // Tier B stellar extensions (T-V-30..33).
  'star-brown-dwarf': { vert: starBrownDwarfVertSource, frag: starBrownDwarfFragSource },
  'star-subdwarf':    { vert: starSubdwarfVertSource, frag: starSubdwarfFragSource },
  'star-carbon':      { vert: starCarbonVertSource, frag: starCarbonFragSource },
  'star-pms':         { vert: starPmsVertSource, frag: starPmsFragSource },

  // Galaxies
  'galaxy-spiral':             { vert: galaxyVertSource, frag: galaxySpiralFragSource },
  'galaxy-elliptical':         { vert: galaxyVertSource, frag: galaxyEllipticalFragSource },
  'galaxy-lenticular':         { vert: galaxyVertSource, frag: galaxyLenticularFragSource },
  'galaxy-irregular':          { vert: galaxyVertSource, frag: galaxyIrregularFragSource },
  'galaxy-agn':                { vert: galaxyVertSource, frag: galaxyAgnFragSource },
  'galaxy-starburst':          { vert: galaxyVertSource, frag: galaxyStarburstFragSource },
  'galaxy-morphology-special': { vert: galaxyVertSource, frag: galaxyMorphologySpecialFragSource },

  // Nebulae
  'nebula-emission':       { vert: nebulaVertSource, frag: nebulaEmissionFragSource },
  'nebula-reflection':     { vert: nebulaVertSource, frag: nebulaReflectionFragSource },
  'nebula-dark':           { vert: nebulaVertSource, frag: nebulaDarkFragSource },
  'nebula-planetary':      { vert: nebulaVertSource, frag: nebulaPlanetaryFragSource },
  'nebula-supernova':      { vert: nebulaVertSource, frag: nebulaSupernovaFragSource },
  'nebula-protoplanetary': { vert: nebulaVertSource, frag: nebulaProtoplanetaryFragSource },
  'nebula-superbubble':    { vert: nebulaVertSource, frag: nebulaSuperbubbleFragSource },
  'nebula-wolfrayet':      { vert: nebulaVertSource, frag: nebulaWolfRayetFragSource },

  // Small bodies
  'meteoroid-stream': {
    vert: meteoroidStreamVertSource,
    frag: meteoroidStreamFragSource,
  },
  'smallbody-asteroid': {
    vert: smallbodyAsteroidVertSource,
    frag: smallbodyAsteroidFragSource,
  },
  'smallbody-asteroid-binary': {
    vert: smallbodyAsteroidBinaryVertSource,
    frag: smallbodyAsteroidBinaryFragSource,
  },
  'smallbody-centaur': {
    vert: smallbodyCentaurVertSource,
    frag: smallbodyCentaurFragSource,
  },
  'smallbody-comet': { vert: smallbodyCometVertSource, frag: smallbodyCometFragSource },
  'smallbody-kbo': {
    vert: smallbodyKboVertSource,
    frag: smallbodyKboFragSource,
  },
  'smallbody-rubble': {
    vert: smallbodyRubbleVertSource,
    frag: smallbodyRubbleFragSource,
  },
  'smallbody-trojan': {
    vert: smallbodyTrojanVertSource,
    frag: smallbodyTrojanFragSource,
  },

  // Exotic
  'exotic-blackhole':   { vert: exoticVertSource, frag: exoticBlackholeFragSource },
  'exotic-compact':     { vert: exoticVertSource, frag: exoticCompactFragSource },
  'exotic-dark':        { vert: exoticVertSource, frag: exoticDarkFragSource },
  'exotic-gr-extreme':  { vert: exoticVertSource, frag: exoticGrExtremeFragSource },
  'exotic-magnetar':    { vert: exoticVertSource, frag: exoticMagnetarFragSource },
  'exotic-planck':      { vert: exoticVertSource, frag: exoticPlanckFragSource },
  'exotic-primordial':  { vert: exoticVertSource, frag: exoticPrimordialFragSource },
  'exotic-pulsar':      { vert: exoticVertSource, frag: exoticPulsarFragSource },
  'exotic-quasi-star':  { vert: exoticVertSource, frag: exoticQuasiStarFragSource },
  'exotic-topology':    { vert: exoticVertSource, frag: exoticTopologyFragSource },
  'exotic-tzo':         { vert: exoticVertSource, frag: exoticTzoFragSource },

  // Markers / overlays
  'exoplanet-host-marker': {
    vert: exoplanetHostMarkerVertSource,
    frag: exoplanetHostMarkerFragSource,
  },
});

/**
 * Per-ENT-ID render-block table. Gives callers a second fallback path —
 * if an entity passes only its canonical `ent_id` (no `render` block and
 * no `kind`/`object_type`), we can still recover the full render preset.
 * Populated as families are wired (T-V-10 small bodies, T-V-16 clusters,
 * T-V-21 planets, etc).
 */
const ENT_ID_TO_RENDER: Readonly<Record<string, EntityRenderBlock>> = Object.freeze({
  // Tier B stellar extensions (T-V-30..36). Reserved range ENT-1050..1069.
  'ENT-1050': { shader: 'star-brown-dwarf', defines: { BD_L: 1, HAS_CLOUDS: 1 } },
  'ENT-1051': { shader: 'star-brown-dwarf', defines: { BD_T: 1, HAS_CLOUDS: 1 } },
  'ENT-1052': { shader: 'star-brown-dwarf', defines: { BD_Y: 1 } },
  'ENT-1053': { shader: 'star-subdwarf',    defines: { SUBDWARF_O: 1 } },
  'ENT-1054': { shader: 'star-subdwarf',    defines: { SUBDWARF_B: 1 } },
  'ENT-1055': { shader: 'star-carbon',      defines: { CARBON_CR: 1 } },
  'ENT-1056': { shader: 'star-carbon',      defines: { CARBON_CN: 1 } },
  'ENT-1057': { shader: 'star-carbon',      defines: { CARBON_CJ: 1 } },
  'ENT-1058': { shader: 'star-pms',         defines: { PMS_HERBIG_AE: 1 } },
  'ENT-1059': { shader: 'star-pms',         defines: { PMS_HERBIG_BE: 1 } },
  'ENT-1060': { shader: 'star-pms',         defines: { PMS_T_TAURI: 1 } },
  'ENT-1061': { shader: 'star-pms',         defines: { PMS_T_TAURI_WL: 1 } },
  'ENT-1062': { shader: 'star-pms',         defines: { PMS_FU_ORI: 1 } },
  'ENT-1063': { shader: 'star-variable',    defines: { VAR_LBV: 1 } },
  'ENT-1064': { shader: 'star-variable',    defines: { VAR_BE_STAR: 1 } },
  'ENT-1065': { shader: 'star-variable',    defines: { VAR_AM_CVN: 1 } },
  'ENT-1066': { shader: 'star-evolved',     defines: { EVOLVED_POST_AGB: 1 } },
  'ENT-1067': { shader: 'star-evolved',     defines: { EVOLVED_HB_TIER_B: 1 } },
  'ENT-1068': { shader: 'star-evolved',     defines: { EVOLVED_RGB_TIP: 1 } },
  'ENT-1069': { shader: 'star-evolved',     defines: { EVOLVED_EXTREME_AGB: 1 } },
  // Rocky planets (T-V-17). Defines select the per-body branch in
  // planet-rocky.frag; PLANET_* aliases keep the legacy SolarSystemRenderer
  // / PlanetGalleryRenderer code paths working. Palette uniforms are not
  // set here — callers that want Doc-accurate colours go through
  // createPlanetMaterial(kind) in PlanetMaterial.ts which owns the full
  // ROCKY_PALETTES + ROCKY_PARAMS tables. This table is the minimal
  // compile-safe default for API-driven lookups.
  'ENT-2010': { shader: 'planet-rocky', defines: { ROCKY_MERCURY: 1, PLANET_MERCURY: 1 } },
  'ENT-2011': { shader: 'planet-rocky', defines: { ROCKY_VENUS: 1,   PLANET_VENUS: 1 } },
  'ENT-2012': { shader: 'planet-rocky', defines: { ROCKY_EARTH: 1,   PLANET_EARTH: 1 } },
  'ENT-2013': { shader: 'planet-rocky', defines: { ROCKY_MARS: 1,    PLANET_MARS: 1 } },

  // Gas giants (T-V-18) — planet-gas.frag handles GAS_* + Doc 22 toggles.
  'ENT-2020': { shader: 'planet-gas', defines: { GAS_JUPITER: 1, PLANET_JUPITER: 1 } },
  'ENT-2021': { shader: 'planet-gas', defines: { GAS_SATURN: 1,  PLANET_SATURN: 1 } },
  'ENT-2025': { shader: 'planet-gas', defines: { GAS_URANUS: 1,  PLANET_URANUS: 1 } },
  'ENT-2026': { shader: 'planet-gas', defines: { GAS_NEPTUNE: 1, PLANET_NEPTUNE: 1 } },

  // Exotic rocky + gas (T-V-19/20) — shared planet-rocky / planet-gas /
  // planet-extreme files already ship every branch; this wires ENT-IDs only.
  'ENT-2030': { shader: 'planet-gas',     defines: { GAS_HOT_JUPITER: 1 } },
  'ENT-2031': { shader: 'planet-rocky',   defines: { ROCKY_SUPER_EARTH: 1 } },
  'ENT-2032': { shader: 'planet-gas',     defines: { GAS_MINI_NEPTUNE: 1 } },
  'ENT-2033': { shader: 'planet-extreme', defines: { EXTREME_HYCEAN: 1 } },
  'ENT-2034': { shader: 'planet-extreme', defines: { EXTREME_EYEBALL: 1 } },
  'ENT-2035': { shader: 'planet-rocky',   defines: { ROCKY_MAGMA: 1 } },
  'ENT-2036': { shader: 'planet-rocky',   defines: { ROCKY_OCEAN: 1 } },
  'ENT-2037': { shader: 'planet-rocky',   defines: { ROCKY_CARBON: 1 } },
  'ENT-2038': { shader: 'planet-rocky',   defines: { ROCKY_IRON: 1 } },
  'ENT-2039': { shader: 'planet-rocky',   defines: { ROCKY_DESERT: 1 } },
  'ENT-2040': { shader: 'planet-rocky',   defines: { ROCKY_ROGUE: 1 } },
  'ENT-2041': { shader: 'planet-gas',     defines: { GAS_PUFFY: 1 } },
  'ENT-2042': { shader: 'planet-rocky',   defines: { ROCKY_PROTOPLANET: 1 } },
  'ENT-2043': { shader: 'planet-extreme', defines: { EXTREME_TIDALLY_HEATED: 1 } },
  'ENT-2044': { shader: 'planet-rocky',   defines: { ROCKY_WATER: 1 } },
  'ENT-2045': { shader: 'planet-gas',     defines: { GAS_HELIUM: 1 } },
  'ENT-2046': { shader: 'planet-gas',     defines: { GAS_CIRCUMBINARY: 1 } },
  'ENT-2047': { shader: 'planet-extreme', defines: { EXTREME_SYNESTIA: 1 } },
  'ENT-2050': { shader: 'planet-rocky',   defines: { ROCKY_CHTHONIAN: 1 } },

  // Moons (T-V-22..24) — all 15 variants live across 6 moon-*.frag files.
  'ENT-3010': { shader: 'moon-volcanic',    defines: { MOON_IO: 1 } },
  'ENT-3011': { shader: 'moon-icy',         defines: { MOON_EUROPA: 1 } },
  'ENT-3012': { shader: 'moon-atmospheric', defines: { MOON_TITAN: 1 } },
  'ENT-3013': { shader: 'moon-rocky',       defines: { MOON_LUNA: 1 } },
  'ENT-3014': { shader: 'moon-rocky',       defines: { MOON_IRREGULAR: 1 } },
  'ENT-3015': { shader: 'moon-icy',         defines: { MOON_ENCELADUS: 1 } },
  'ENT-3016': { shader: 'moon-rocky',       defines: { MOON_CALLISTO: 1 } },
  'ENT-3017': { shader: 'moon-icy',         defines: { MOON_GANYMEDE: 1 } },
  'ENT-3018': { shader: 'moon-extreme',     defines: { MOON_TRITON: 1 } },
  'ENT-3019': { shader: 'moon-extreme',     defines: { MOON_MIRANDA: 1 } },
  'ENT-3020': { shader: 'moon-extreme',     defines: { MOON_HYPERION: 1 } },
  'ENT-3021': { shader: 'moon-minor',       defines: { MOON_SHEPHERD: 1 } },
  'ENT-3022': { shader: 'moon-minor',       defines: { MOON_TROJAN_MOON: 1 } },
  'ENT-3023': { shader: 'moon-minor',       defines: { MOON_BINARY: 1 } },
  'ENT-3024': { shader: 'moon-icy',         defines: { MOON_SUBSURFACE_OCEAN: 1 } },

  // Nebulae (T-V-25..26) — uniform-driven, one shader per family/topology.
  'ENT-5010': { shader: 'nebula-emission' },
  'ENT-5011': { shader: 'nebula-emission' },
  'ENT-5012': { shader: 'nebula-emission' },
  'ENT-5020': { shader: 'nebula-planetary' },
  'ENT-5021': { shader: 'nebula-planetary', defines: { PN_BIPOLAR: 1 } },
  'ENT-5022': { shader: 'nebula-planetary', defines: { PN_IRREGULAR: 1 } },
  'ENT-5030': { shader: 'nebula-reflection' },
  'ENT-5040': { shader: 'nebula-dark' },
  'ENT-5041': { shader: 'nebula-dark',      defines: { DARK_BOK_GLOBULE: 1 } },
  'ENT-5050': { shader: 'nebula-supernova' },
  'ENT-5051': { shader: 'nebula-supernova', defines: { SNR_PLERION: 1 } },
  'ENT-5060': { shader: 'nebula-wolfrayet' },
  'ENT-5070': { shader: 'nebula-protoplanetary' },
  'ENT-5080': { shader: 'nebula-superbubble' },

  // Galaxies (T-V-27..28) — 19 Hubble-sequence subtypes across 7 shaders.
  'ENT-6010': { shader: 'galaxy-spiral' },
  'ENT-6011': { shader: 'galaxy-spiral',                defines: { HAS_BAR: 1 } },
  'ENT-6012': { shader: 'galaxy-lenticular' },
  'ENT-6020': { shader: 'galaxy-elliptical' },
  'ENT-6021': { shader: 'galaxy-elliptical',            defines: { DWARF_ELLIPTICAL: 1 } },
  'ENT-6022': { shader: 'galaxy-elliptical',            defines: { DWARF_SPHEROIDAL: 1 } },
  'ENT-6030': { shader: 'galaxy-irregular' },
  'ENT-6031': { shader: 'galaxy-irregular',             defines: { IRR_II: 1 } },
  'ENT-6040': { shader: 'galaxy-agn',                   defines: { AGN_SEYFERT: 1 } },
  'ENT-6041': { shader: 'galaxy-agn',                   defines: { AGN_QUASAR: 1 } },
  'ENT-6042': { shader: 'galaxy-agn',                   defines: { AGN_RADIO: 1 } },
  'ENT-6043': { shader: 'galaxy-agn',                   defines: { AGN_BLAZAR: 1 } },
  'ENT-6044': { shader: 'galaxy-agn',                   defines: { AGN_LINER: 1 } },
  'ENT-6050': { shader: 'galaxy-starburst' },
  'ENT-6051': { shader: 'galaxy-morphology-special',    defines: { MORPH_RING: 1 } },
  'ENT-6052': { shader: 'galaxy-morphology-special',    defines: { MORPH_JELLYFISH: 1 } },
  'ENT-6053': { shader: 'galaxy-starburst',             defines: { SB_ULIRG: 1 } },
  'ENT-6054': { shader: 'galaxy-morphology-special',    defines: { MORPH_ULTRA_DIFFUSE: 1 } },
  'ENT-6055': { shader: 'galaxy-morphology-special',    defines: { MORPH_MERGING: 1 } },

  // Small bodies (T-V-10).
  'ENT-4010': { shader: 'smallbody-asteroid',        defines: { TYPE_C: 1 } },
  'ENT-4011': { shader: 'smallbody-asteroid',        defines: { TYPE_S: 1 } },
  'ENT-4012': { shader: 'smallbody-asteroid',        defines: { TYPE_M: 1 } },
  'ENT-4013': { shader: 'smallbody-asteroid',        defines: { TYPE_V: 1 } },
  'ENT-4014': { shader: 'smallbody-asteroid-binary', defines: { BINARY_PAIR: 1 } },
  'ENT-4015': { shader: 'smallbody-rubble' },
  'ENT-4016': { shader: 'smallbody-asteroid-binary', defines: { BINARY_CONTACT: 1 } },
  'ENT-4020': { shader: 'smallbody-comet' },
  'ENT-4021': { shader: 'smallbody-comet' },
  'ENT-4022': { shader: 'smallbody-comet' },
  'ENT-4023': { shader: 'smallbody-comet' },
  'ENT-4030': { shader: 'smallbody-kbo',             defines: { KBO_PLUTO: 1 } },
  'ENT-4031': { shader: 'smallbody-kbo',             defines: { KBO_CERES: 1 } },
  'ENT-4032': { shader: 'smallbody-kbo',             defines: { KBO_ERIS: 1 } },
  'ENT-4040': { shader: 'smallbody-kbo' },
  'ENT-4041': { shader: 'smallbody-kbo' },
  'ENT-4042': { shader: 'smallbody-kbo' },
  'ENT-4050': { shader: 'smallbody-centaur' },
  'ENT-4051': { shader: 'smallbody-trojan' },
  'ENT-4060': { shader: 'meteoroid-stream' },

  // Clusters / LSS (T-V-16).
  'ENT-7010': { shader: 'cluster-open', defines: { NEBULOSITY_ON: 1 } },
  'ENT-7011': { shader: 'cluster-globular' },
  'ENT-7012': { shader: 'cluster-ob',  defines: { HAS_PARENT_NEBULA: 1 } },
  'ENT-7023': { shader: 'cluster-collision' },
  'ENT-7033': { shader: 'lyman-alpha-blob' },

  // LSS externalised (T-V-29) — renderer swap happens in T-V-58.
  'ENT-7020': { shader: 'lss-supercluster', defines: { LSS_GROUP: 1 } },
  'ENT-7021': { shader: 'lss-supercluster', defines: { LSS_CLUSTER: 1 } },
  'ENT-7022': { shader: 'lss-supercluster', defines: { LSS_SUPERCL: 1 } },
  'ENT-7030': { shader: 'lss-filament' },
  'ENT-7031': { shader: 'lss-void' },
  'ENT-7032': { shader: 'lss-great-wall' },
});

/**
 * Legacy kind → shader table. Used only when no `render` block is present.
 * Covers the eight `ObjectType` discriminants plus a handful of sub-kinds
 * callers commonly pass in (`rocky_planet`, `gas_giant`, `brown_dwarf`, etc).
 */
const KIND_TO_SHADER: Readonly<Record<string, string>> = Object.freeze({
  // object_type fallbacks
  star:     'star-mainseq',
  planet:   'planet-rocky',
  moon:     'moon-rocky',
  galaxy:   'galaxy-spiral',
  nebula:   'nebula-emission',
  cluster:  'galaxy-spiral',
  asteroid: 'planet-rocky',
  comet:    'smallbody-comet',

  // common sub-kinds
  rocky_planet:     'planet-rocky',
  gas_giant:        'planet-gas',
  extreme_planet:   'planet-extreme',
  rocky_moon:       'moon-rocky',
  icy_moon:         'moon-icy',
  volcanic_moon:    'moon-volcanic',
  atmospheric_moon: 'moon-atmospheric',
  extreme_moon:     'moon-extreme',
  minor_moon:       'moon-minor',
  main_sequence:    'star-mainseq',
  evolved_star:     'star-evolved',
  stellar_remnant:  'star-remnant',
  variable_star:    'star-variable',
  binary_star:      'star-binary',
  spiral_galaxy:    'galaxy-spiral',
  elliptical_galaxy:'galaxy-elliptical',
  lenticular_galaxy:'galaxy-lenticular',
  irregular_galaxy: 'galaxy-irregular',
  agn_galaxy:       'galaxy-agn',
  starburst_galaxy: 'galaxy-starburst',
  emission_nebula:  'nebula-emission',
  reflection_nebula:'nebula-reflection',
  dark_nebula:      'nebula-dark',
  planetary_nebula: 'nebula-planetary',
  supernova_remnant:'nebula-supernova',
  black_hole:       'exotic-blackhole',
  neutron_star:     'star-remnant',
  pulsar:           'exotic-pulsar',
  magnetar:         'exotic-magnetar',
});

const DEFAULT_LOG_DEPTH_COEF = 2.0 / Math.log2(1e12 + 1);

/** Resolve (shader, defines, uniforms) for an entity in precedence order:
 *  1. explicit `render` block,
 *  2. canonical ENT-ID table,
 *  3. kind/object_type fallback (no defines, no uniforms). */
function resolveRender(input: MaterialFactoryInput): EntityRenderBlock {
  if (input.render?.shader) return input.render;
  const entId = input.id ?? input.ent_id;
  if (entId && ENT_ID_TO_RENDER[entId]) return ENT_ID_TO_RENDER[entId]!;
  if (input.kind && KIND_TO_SHADER[input.kind]) {
    return { shader: KIND_TO_SHADER[input.kind]! };
  }
  if (input.object_type && KIND_TO_SHADER[input.object_type]) {
    return { shader: KIND_TO_SHADER[input.object_type]! };
  }
  throw new Error(
    `MaterialFactory: cannot resolve shader — entity has no render.shader, ` +
      `known ent_id, kind, or object_type (got id=${String(entId)}, ` +
      `kind=${String(input.kind)}, object_type=${String(input.object_type)})`,
  );
}

function normaliseDefineValue(v: boolean | number): string {
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (!Number.isFinite(v) || !Number.isInteger(v)) {
    throw new Error(
      `MaterialFactory: define values must be integer or boolean (got ${v})`,
    );
  }
  return String(v);
}

function buildDefines(
  render: EntityRenderBlock | undefined,
): Record<string, string> {
  if (!render?.defines) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(render.defines)) {
    out[k] = normaliseDefineValue(v);
  }
  return out;
}

function buildUniformValue(raw: number | readonly number[]): unknown {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      throw new Error(`MaterialFactory: uniform value must be finite (got ${raw})`);
    }
    return raw;
  }
  if (Array.isArray(raw)) {
    if (raw.length === 2) return new THREE.Vector2(raw[0]!, raw[1]!);
    if (raw.length === 3) return new THREE.Vector3(raw[0]!, raw[1]!, raw[2]!);
    if (raw.length === 4) return new THREE.Vector4(raw[0]!, raw[1]!, raw[2]!, raw[3]!);
    throw new Error(
      `MaterialFactory: uniform array length must be 2, 3, or 4 (got ${raw.length})`,
    );
  }
  throw new Error(
    `MaterialFactory: uniform value must be a number or numeric array (got ${typeof raw})`,
  );
}

function buildUniforms(
  render: EntityRenderBlock | undefined,
  opts: MaterialFactoryOptions,
): Record<string, { value: unknown }> {
  const uniforms: Record<string, { value: unknown }> = {
    u_time: { value: 0 },
    u_logDepthCoef: { value: opts.logDepthCoef ?? DEFAULT_LOG_DEPTH_COEF },
    u_cameraRelativeOrigin: {
      value: opts.cameraRelativeOrigin?.clone() ?? new THREE.Vector3(0, 0, 0),
    },
  };
  if (!render?.uniforms) return uniforms;
  for (const [k, v] of Object.entries(render.uniforms)) {
    uniforms[k] = { value: buildUniformValue(v) };
  }
  return uniforms;
}

export interface MaterialFactoryResult {
  material: THREE.ShaderMaterial;
  shaderKey: string;
}

/**
 * Build a `ShaderMaterial` for the given entity. Throws on unknown shader
 * keys or malformed define/uniform values — every thrown error is
 * deterministic and callers should treat them as programming mistakes.
 */
export function createMaterialForEntity(
  entity: MaterialFactoryInput,
  options: MaterialFactoryOptions = {},
): MaterialFactoryResult {
  const render = resolveRender(entity);
  const entry = SHADER_REGISTRY[render.shader];
  if (!entry) {
    throw new Error(
      `MaterialFactory: unknown shader '${render.shader}' — not in SHADER_REGISTRY`,
    );
  }

  const material = new THREE.ShaderMaterial({
    name: options.debugName ?? render.shader,
    glslVersion: THREE.GLSL3,
    vertexShader: entry.vert,
    fragmentShader: entry.frag,
    defines: buildDefines(render),
    uniforms: buildUniforms(
      render,
      options,
    ) as unknown as THREE.ShaderMaterial['uniforms'],
  });

  return { material, shaderKey: render.shader };
}

/** Registry introspection helper — used by coverage tests (T-V-02+). */
export function listRegisteredShaders(): readonly string[] {
  return Object.freeze(Object.keys(SHADER_REGISTRY));
}

/** Kind-table introspection helper — used by coverage tests. */
export function listKnownKinds(): readonly string[] {
  return Object.freeze(Object.keys(KIND_TO_SHADER));
}

/** ENT-ID-table introspection helper — used by coverage tests. */
export function listKnownEntIds(): readonly string[] {
  return Object.freeze(Object.keys(ENT_ID_TO_RENDER));
}

export const MaterialFactory = {
  create: createMaterialForEntity,
  listRegisteredShaders,
  listKnownKinds,
  listKnownEntIds,
} as const;
