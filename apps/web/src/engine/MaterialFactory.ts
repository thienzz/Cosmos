import type { EntityRenderBlock } from '@cosmos/shared-types';
import * as THREE from 'three';

import {
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
  smallbodyCometFragSource,
  smallbodyCometVertSource,
  starBinaryFragSource,
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
  'star-mainseq':  { vert: starVertSource, frag: starMainseqFragSource },
  'star-evolved':  { vert: starVertSource, frag: starEvolvedFragSource },
  'star-remnant':  { vert: starVertSource, frag: starRemnantFragSource },
  'star-variable': { vert: starVertSource, frag: starVariableFragSource },
  'star-binary':   { vert: starVertSource, frag: starBinaryFragSource },

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
  'smallbody-asteroid': {
    vert: smallbodyAsteroidVertSource,
    frag: smallbodyAsteroidFragSource,
  },
  'smallbody-asteroid-binary': {
    vert: smallbodyAsteroidBinaryVertSource,
    frag: smallbodyAsteroidBinaryFragSource,
  },
  'smallbody-comet': { vert: smallbodyCometVertSource, frag: smallbodyCometFragSource },

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

function resolveShaderKey(input: MaterialFactoryInput): string {
  if (input.render?.shader) return input.render.shader;
  if (input.kind && KIND_TO_SHADER[input.kind]) return KIND_TO_SHADER[input.kind]!;
  if (input.object_type && KIND_TO_SHADER[input.object_type]) {
    return KIND_TO_SHADER[input.object_type]!;
  }
  throw new Error(
    `MaterialFactory: cannot resolve shader — entity has no render.shader, ` +
      `kind, or recognised object_type (got kind=${String(input.kind)}, ` +
      `object_type=${String(input.object_type)})`,
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
  const shaderKey = resolveShaderKey(entity);
  const entry = SHADER_REGISTRY[shaderKey];
  if (!entry) {
    throw new Error(
      `MaterialFactory: unknown shader '${shaderKey}' — not in SHADER_REGISTRY`,
    );
  }

  const material = new THREE.ShaderMaterial({
    name: options.debugName ?? shaderKey,
    glslVersion: THREE.GLSL3,
    vertexShader: entry.vert,
    fragmentShader: entry.frag,
    defines: buildDefines(entity.render),
    uniforms: buildUniforms(
      entity.render,
      options,
    ) as unknown as THREE.ShaderMaterial['uniforms'],
  });

  return { material, shaderKey };
}

/** Registry introspection helper — used by coverage tests (T-V-02+). */
export function listRegisteredShaders(): readonly string[] {
  return Object.freeze(Object.keys(SHADER_REGISTRY));
}

/** Kind-table introspection helper — used by coverage tests. */
export function listKnownKinds(): readonly string[] {
  return Object.freeze(Object.keys(KIND_TO_SHADER));
}

export const MaterialFactory = {
  create: createMaterialForEntity,
  listRegisteredShaders,
  listKnownKinds,
} as const;
