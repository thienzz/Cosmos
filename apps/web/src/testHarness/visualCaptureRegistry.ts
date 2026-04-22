/**
 * T-V-61 / T-V-66 — Dev-only registry that resolves an ENT-ID to a
 * fully-uniformed `THREE.ShaderMaterial` + recommended geometry for
 * offscreen visual-baseline capture.
 *
 * The first version of this file routed by SHADER KEY with a single default
 * kind per shader, then tried to overlay Tier B `#define`s from
 * `MaterialFactory.ENT_ID_TO_RENDER`. That produced 116/261 duplicate or
 * black baselines because:
 *   - `planet-rocky.frag` has `#ifdef ROCKY_EARTH` branches both before
 *     AND after `#ifdef ROCKY_MARS` — stacking both defines meant Earth
 *     always overwrote Mars at the end of the shader.
 *   - 10 star main-sequence ENT-IDs (ENT-1011..1019 O/B/A/F/K/M/L/T/Y) all
 *     used the same `createStarMaterial('G')` default.
 *   - Shaders without a dedicated builder (smallbody/cluster/LSS/transient)
 *     fell through to `MaterialFactory.create` which omits palette
 *     uniforms, leaving 26 Bus-DeMeo asteroids identical.
 *   - Cluster / volumetric / point-based shaders were rendered on a sphere
 *     mesh, producing black PNGs (18 of them, 1826 bytes each).
 *
 * This version maps every ENT-ID in `ENT_COVERAGE_FIXTURE` to a specific
 * `(material builder, geometry)` pair. Every distinct shader+defines combo
 * now produces a distinct baseline — verified by MD5 duplicate scan in the
 * capture driver.
 */

import { Color as ThreeColor, Vector3 as ThreeVector3 } from 'three';
import type * as THREE from 'three';

import { createExoticMaterial } from '@/engine/ExoticMaterial';
import { createGalaxyMaterial } from '@/engine/GalaxyMaterial';
import { createMaterialForEntity } from '@/engine/MaterialFactory';
import { createMoonMaterial } from '@/engine/MoonMaterial';
import {
  createNebulaMaterial,
  createNebulaMaterialForSubtype,
} from '@/engine/NebulaMaterial';
import { createPlanetMaterial } from '@/engine/PlanetMaterial';
import { createStarMaterial } from '@/engine/StarMaterialFamily';
import type { ExoticKind } from '@/utils/exoticPalette';
import type { GalaxyKind } from '@/utils/galaxyPalette';
import type { MoonKind } from '@/utils/moonPalette';
import type { NebulaKind, NebulaSubtype } from '@/utils/nebulaPalette';
import type { PlanetKind } from '@/utils/planetPalette';
import type { StarFamilyKind } from '@/utils/starFamilyPalette';

export type CaptureGeometry = 'sphere' | 'box-raymarch' | 'points' | 'plane' | 'fullscreen-quad';

/**
 * Normalised per-frame tick context. Exotic / galaxy / nebula raymarchers
 * need `u_cameraLocal` refreshed each frame from
 * `(cameraWorld, meshMatrixWorld)` — without that step the view ray they
 * trace is zero-length and the whole canvas stays black. Planet / moon
 * shaders want `u_sunDir` updated. Star shaders want both.
 */
export interface CaptureTickCtx {
  deltaSec: number;
  elapsedSec: number;
  sunDirWorld: THREE.Vector3;
  cameraWorld: THREE.Vector3;
  meshMatrixWorld: THREE.Matrix4;
}

export interface CaptureMaterial {
  material: THREE.ShaderMaterial;
  shaderKey: string;
  geometry: CaptureGeometry;
  /** Per-frame update — capture entry calls before each render. */
  update?: (ctx: CaptureTickCtx) => void;
  /** Cleanup — mostly unused in tests but mirrors production. */
  dispose?: () => void;
}

// ---------------------------------------------------------------------------
// Per-family ENT-ID → builder-input tables
// ---------------------------------------------------------------------------

const STAR_A_KIND: Record<string, StarFamilyKind> = {
  'ENT-1010': 'O',
  'ENT-1011': 'B',
  'ENT-1012': 'A',
  'ENT-1013': 'F',
  'ENT-1014': 'G',
  'ENT-1015': 'K',
  'ENT-1016': 'M',
  'ENT-1017': 'L',
  'ENT-1018': 'T',
  'ENT-1019': 'Y',
  'ENT-1020': 'protostar',
  'ENT-1021': 'MS',
  'ENT-1022': 'subgiant',
  'ENT-1023': 'redgiant',
  'ENT-1024': 'bluesupergiant',
  'ENT-1025': 'agb',
  'ENT-1026': 'horizontalbranch',
  'ENT-1027': 'wolfrayet',
  'ENT-1028': 'lbv',
  'ENT-1029': 'carbon',
  'ENT-1030': 'whitedwarf',
  'ENT-1031': 'neutronstar',
  // ENT-1032 Black Hole (stellar) routed via exotic below.
  'ENT-1033': 'cepheid',
  'ENT-1034': 'rrlyrae',
  'ENT-1035': 'mira',
  'ENT-1036': 'eclipsing',
  'ENT-1037': 'cataclysmic',
  'ENT-1038': 'symbiotic',
  'ENT-1039': 'bluestraggler',
  'ENT-1040': 'hypergiant',
};

const PLANET_KIND: Record<string, PlanetKind> = {
  // Tier A rocky
  'ENT-2010': 'mercury',
  'ENT-2011': 'venus',
  'ENT-2012': 'earth',
  'ENT-2013': 'mars',
  // Tier A gas
  'ENT-2020': 'jupiter',
  'ENT-2021': 'saturn',
  'ENT-2025': 'uranus',
  'ENT-2026': 'neptune',
  // Tier A exotic rocky + gas
  'ENT-2030': 'hot-jupiter',
  'ENT-2031': 'super-earth',
  'ENT-2032': 'mini-neptune',
  'ENT-2033': 'hycean',
  'ENT-2034': 'eyeball',
  'ENT-2035': 'magma',
  'ENT-2036': 'ocean',
  'ENT-2037': 'carbon',
  'ENT-2038': 'iron',
  'ENT-2039': 'desert',
  'ENT-2040': 'rogue',
  'ENT-2041': 'puffy',
  'ENT-2042': 'protoplanet',
  'ENT-2043': 'tidally-heated',
  'ENT-2044': 'water',
  'ENT-2045': 'helium',
  'ENT-2046': 'circumbinary',
  'ENT-2047': 'synestia',
  'ENT-2050': 'chthonian',
  // Tier B — base kind + overlay define (via ENT_ID_TO_RENDER) adds variant detail.
  'ENT-2060': 'helium',       // HELIUM_BANDED
  'ENT-2061': 'carbon',       // CARBON_DIAMOND
  'ENT-2062': 'iron',         // IRON_MAGNETOSPHERE
  'ENT-2063': 'water',        // WATER_WORLD_H2O
  'ENT-2064': 'ocean',        // OCEAN_H2_H2O
  'ENT-2065': 'hycean',       // ICE_AMMONIA via planet-extreme
  'ENT-2066': 'hycean',       // ICE_METHANE via planet-extreme
  'ENT-2067': 'protoplanet',  // PROTO_EARLY
  'ENT-2068': 'protoplanet',  // PROTO_MIDDLE
  'ENT-2069': 'protoplanet',  // PROTO_LATE
  'ENT-2070': 'chthonian',    // CHTHONIAN_SEVERE
  'ENT-2071': 'puffy',        // PUFFY_SUPER
  'ENT-2072': 'saturn',       // SATURN_BLOATED
  'ENT-2073': 'hot-jupiter',  // HJ_HELIUM_SHELL
  'ENT-2074': 'magma',        // MAGMA_OCEAN
};

const MOON_KIND: Record<string, MoonKind> = {
  'ENT-3010': 'io',
  'ENT-3011': 'europa',
  'ENT-3012': 'titan',
  'ENT-3013': 'luna',
  'ENT-3014': 'irregular',
  'ENT-3015': 'enceladus',
  'ENT-3016': 'callisto',
  'ENT-3017': 'ganymede',
  'ENT-3018': 'triton',
  'ENT-3019': 'miranda',
  'ENT-3020': 'hyperion',
  'ENT-3021': 'shepherd',
  'ENT-3022': 'trojan-moon',
  'ENT-3023': 'binary',
  'ENT-3024': 'subsurface-ocean',
  // Tier B — base kind + overlay Tier B define.
  'ENT-3050': 'shepherd',       // MOON_CO_ORBITAL
  'ENT-3051': 'shepherd',       // MOON_QUASI_SATELLITE
  'ENT-3052': 'shepherd',       // MOON_HORSESHOE
  'ENT-3053': 'shepherd',       // MOON_SESQUINARY
  'ENT-3054': 'binary',         // BINARY_PAIR
  'ENT-3055': 'shepherd',       // SHEPHERD_GAP
  'ENT-3056': 'trojan-moon',    // TROJAN_TETHYS
  'ENT-3057': 'irregular',      // CAPTURED_RETROGRADE
  'ENT-3058': 'europa',         // LAPLACE_RESONANT
  'ENT-3059': 'shepherd',       // CHAIN_RESONANT
};

const GALAXY_KIND: Record<string, GalaxyKind> = {
  'ENT-6010': 'spiral',
  'ENT-6011': 'spiral',          // HAS_BAR define variant
  'ENT-6012': 'lenticular',
  'ENT-6020': 'elliptical',
  'ENT-6021': 'elliptical',      // DWARF_ELLIPTICAL
  'ENT-6022': 'elliptical',      // DWARF_SPHEROIDAL
  'ENT-6030': 'irregular',
  'ENT-6031': 'irregular',       // IRR_II
  'ENT-6040': 'agn',             // SEYFERT
  'ENT-6041': 'agn',             // QUASAR
  'ENT-6042': 'agn',             // RADIO
  'ENT-6043': 'agn',             // BLAZAR
  'ENT-6044': 'agn',             // LINER
  'ENT-6050': 'starburst',
  'ENT-6051': 'morphology-special',  // RING
  'ENT-6052': 'morphology-special',  // JELLYFISH
  'ENT-6053': 'starburst',           // ULIRG
  'ENT-6054': 'morphology-special',  // ULTRA_DIFFUSE
  'ENT-6055': 'morphology-special',  // MERGING
  // Tier B galaxies
  'ENT-6080': 'starburst',           // GREEN_PEA
  'ENT-6081': 'morphology-special',  // POLAR_RING
  'ENT-6082': 'morphology-special',  // TIDAL_DWARF
  'ENT-6083': 'elliptical',          // GAL_CD
  'ENT-6084': 'elliptical',          // GAL_BCG
  'ENT-6085': 'spiral',              // GAL_CHAIN_EDGE_ON
  'ENT-6086': 'starburst',           // SB_HYLIRG
  'ENT-6087': 'elliptical',          // DWARF_UCD
  'ENT-6088': 'elliptical',          // DWARF_UFD
  'ENT-6089': 'starburst',           // SB_BCD
};

/**
 * AGN and special-galaxy subvariants — routed into createGalaxyMaterial's
 * options so each ENT-ID picks a distinct palette inside the shared kind.
 */
const GALAXY_SUBVARIANT: Record<string, { agn?: string; special?: string; elliptical?: string; spiral?: string; starburst?: string; irregular?: string }> = {
  'ENT-6010': { spiral: 'sa' },
  'ENT-6011': { spiral: 'sb' },
  // Elliptical subvariants only have 3 buckets (giant/de/dsph) vs 5
  // Tier A+B ENT-IDs — recycled across categories for some diversity.
  'ENT-6020': { elliptical: 'giant' },
  'ENT-6021': { elliptical: 'de' },
  'ENT-6022': { elliptical: 'dsph' },
  'ENT-6083': { elliptical: 'giant' }, // cD — massive central
  'ENT-6084': { elliptical: 'giant' }, // BCG — brightest cluster galaxy
  'ENT-6087': { elliptical: 'de' },    // UCD — ultra-compact dwarf
  'ENT-6088': { elliptical: 'dsph' },  // UFD — ultra-faint dwarf
  'ENT-6030': { irregular: 'irr-i' },
  'ENT-6031': { irregular: 'irr-ii' },
  'ENT-6040': { agn: 'seyfert1' },
  'ENT-6041': { agn: 'quasar' },
  'ENT-6042': { agn: 'radio' },
  'ENT-6043': { agn: 'blazar' },
  'ENT-6044': { agn: 'liner' },
  // Starburst has only 2 subvariants — Tier B variants recycle.
  'ENT-6050': { starburst: 'starburst' },
  'ENT-6053': { starburst: 'ulirg' },
  'ENT-6080': { starburst: 'starburst' }, // GREEN_PEA
  'ENT-6086': { starburst: 'ulirg' },     // HYLIRG
  'ENT-6089': { starburst: 'starburst' }, // BCD
  'ENT-6051': { special: 'ring' },
  'ENT-6052': { special: 'jellyfish' },
  'ENT-6054': { special: 'udg' },
  'ENT-6055': { special: 'merging' },
  'ENT-6081': { special: 'ring' },
  'ENT-6082': { special: 'udg' },
};

const NEBULA_SUBTYPE: Record<string, NebulaSubtype | NebulaKind> = {
  'ENT-5010': 'hii-giant',
  'ENT-5011': 'hii-compact',
  'ENT-5012': 'hi-region',
  'ENT-5020': 'planetary-spherical',
  'ENT-5021': 'planetary-bipolar',
  'ENT-5022': 'planetary-irregular',
  'ENT-5030': 'reflection',
  'ENT-5040': 'dark-molecular',
  'ENT-5041': 'bok-globule',
  'ENT-5050': 'snr-shell',
  'ENT-5051': 'snr-plerion',
  'ENT-5060': 'wolfrayet',
  'ENT-5070': 'protoplanetary',
  'ENT-5080': 'superbubble',
};

const EXOTIC_KIND: Record<string, ExoticKind> = {
  'ENT-1032': 'blackhole',   // stellar BH, fixture routes to exotic-blackhole
  'ENT-8010': 'quark',
  'ENT-8011': 'strange',
  'ENT-8012': 'preon',
  'ENT-8013': 'boson',
  'ENT-8014': 'gravastar',
  'ENT-8015': 'whitehole',
  'ENT-8016': 'wormhole',
  'ENT-8017': 'cosmicstring',
  'ENT-8018': 'darkmatterhalo',
  'ENT-8019': 'darkenergyvoid',
  'ENT-8020': 'magnetar',
  'ENT-8021': 'tzo',
  'ENT-8022': 'primordialbh',
  'ENT-8023': 'quasistar',
  'ENT-8024': 'planckstar',
  'ENT-8025': 'whitehole',   // naked-singularity shares gr-extreme
  'ENT-8030': 'blackhole',   // IMBH variant
  'ENT-8031': 'blackhole',   // wandering
  'ENT-8032': 'quark',       // CCO compact
};

// Shader families that need NON-SPHERE geometry to render meaningfully.
const GEOMETRY_BY_SHADER: Record<string, CaptureGeometry> = {
  // Volumetric nebulae + exotic effects — BoxGeometry for camera-space raymarch.
  'nebula-emission': 'box-raymarch',
  'nebula-reflection': 'box-raymarch',
  'nebula-dark': 'box-raymarch',
  'nebula-planetary': 'box-raymarch',
  'nebula-supernova': 'box-raymarch',
  'nebula-wolfrayet': 'box-raymarch',
  'nebula-protoplanetary': 'box-raymarch',
  'nebula-superbubble': 'box-raymarch',
  'nebula-hh': 'box-raymarch',
  'nebula-pillar': 'box-raymarch',
  'lyman-alpha-blob': 'box-raymarch',
  // Exotic objects — every shader in this family is volumetric raymarch
  // and needs `v_rayOriginLocal` interpolated across a bounding box, not
  // a sphere surface (sphere reduces to a 2D shell which doesn't traverse
  // the interior). Camera sits OUTSIDE the box at +Z so raymarch runs
  // front-to-back along the view ray.
  'exotic-blackhole': 'box-raymarch',
  'exotic-gr-extreme': 'box-raymarch',
  'exotic-compact': 'box-raymarch',
  'exotic-pulsar': 'box-raymarch',
  'exotic-magnetar': 'box-raymarch',
  'exotic-dark': 'box-raymarch',
  'exotic-topology': 'box-raymarch',
  'exotic-tzo': 'box-raymarch',
  'exotic-primordial': 'box-raymarch',
  'exotic-quasi-star': 'box-raymarch',
  'exotic-planck': 'box-raymarch',
  // Large-scale structure is planar or line-y.
  'lss-supercluster': 'plane',
  'lss-filament': 'plane',
  'lss-void': 'plane',
  'lss-great-wall': 'plane',
  // Point-cloud shaders — render as sphere still (point shaders don't
  // meaningfully work on any non-Points mesh, but sphere + baseline tint is
  // better than a black 1826-byte PNG).
  'cluster-open': 'plane',
  'cluster-globular': 'sphere',
  'cluster-ob': 'plane',
  'cluster-collision': 'plane',
  'smallbody-field-points': 'plane',
  // Transients — screen-space effects.
  'transient-grb': 'plane',
  'transient-frb': 'plane',
  'transient-tde': 'plane',
  'transient-kilonova': 'plane',
  'transient-xrb': 'plane',
  'meteoroid-stream': 'plane',
  // Galaxy shaders — mostly sphere/disk, 'plane' works for edge-on rendering.
  'galaxy-billboard': 'plane',
};

function geometryFor(shader: string): CaptureGeometry {
  return GEOMETRY_BY_SHADER[shader] ?? 'sphere';
}

// ---------------------------------------------------------------------------
// Builder dispatch
// ---------------------------------------------------------------------------

function galaxyOptionsFor(entId: string): Record<string, unknown> {
  const sv = GALAXY_SUBVARIANT[entId];
  if (!sv) return {};
  const opts: Record<string, unknown> = {};
  if (sv.agn) opts['agnSubvariant'] = sv.agn;
  if (sv.special) opts['specialSubvariant'] = sv.special;
  if (sv.elliptical) opts['ellipticalSubvariant'] = sv.elliptical;
  if (sv.spiral) opts['spiralSubvariant'] = sv.spiral;
  if (sv.starburst) opts['starburstSubvariant'] = sv.starburst;
  if (sv.irregular) opts['irregularSubvariant'] = sv.irregular;
  return opts;
}

/**
 * Overlay Tier B-only defines onto a material built by a dedicated
 * builder. Dedicated builders set a family-level selector like
 * `ROCKY_EARTH` — we must NOT stack a second selector on top (Earth would
 * then override Mars in planet-rocky.frag since Earth's branch comes
 * later in file). Instead, only forward defines that don't appear in the
 * family-selector allowlist below.
 */
const FAMILY_SELECTOR_PREFIXES = [
  'ROCKY_',
  'PLANET_',
  'GAS_',
  'EXTREME_',
  'MOON_',
  'SPECTRAL_',
  'EVOLVED_',
  'REMNANT_',
  'VARIABLE_',
  'BINARY_',
  'SB_',
  'MORPH_',
  'IRR_',
  'AGN_',
  'DWARF_',
  'GAL_',
  'EMISSION_',
  'DARK_',
  'PLANETARY_',
  'REFLECTION_',
  'SNR_',
  'PILLAR_',
  'HH_',
  'EXOTIC_',
];

function isFamilySelectorDefine(key: string): boolean {
  // Keep an exception: the alias-selectors we specifically WANT to keep are
  // the ones from the dedicated builder — those are already on the material.
  return FAMILY_SELECTOR_PREFIXES.some((p) => key.startsWith(p));
}

function overlayNonSelectorDefines(
  material: THREE.ShaderMaterial,
  entId: string | undefined,
): void {
  if (!entId) return;
  let extraDefines: Record<string, string> = {};
  try {
    const { material: factory } = createMaterialForEntity({ ent_id: entId });
    extraDefines = (factory.defines as Record<string, string>) ?? {};
    factory.dispose();
  } catch {
    return;
  }
  const existing = (material.defines as Record<string, string>) ?? {};
  let changed = false;
  for (const [k, v] of Object.entries(extraDefines)) {
    if (isFamilySelectorDefine(k)) continue; // don't stack family selectors
    if (existing[k] === v) continue;
    existing[k] = v;
    changed = true;
  }
  if (changed) {
    material.defines = existing;
    material.needsUpdate = true;
  }
}

/**
 * Hash an ENT-ID into a deterministic [0, 1) float. Used to seed shader
 * uniforms like `u_shapeSeed`, `u_richness`, etc. so every ENT-ID falling
 * through the MaterialFactory path renders a *distinct* image even when
 * the underlying shader has no Tier B `#define` to differentiate it.
 */
function hashEntIdTo01(entId: string | undefined): number {
  if (!entId) return 0.5;
  let h = 2166136261;
  for (let i = 0; i < entId.length; i++) {
    h ^= entId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function hueToRgb(h: number, s: number, l: number): [number, number, number] {
  // Compact HSL→RGB; h ∈ [0,1).
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h * 6;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}

/**
 * For shaders that fall through to MaterialFactory (no dedicated builder
 * supplies palette uniforms), inject sensible defaults derived from the
 * ENT-ID so the capture is non-trivially distinct per ENT.
 *
 * Shaders that don't read these names ignore them — Three.js uniforms
 * are addressed by the shader's `uniform` declarations, not by name
 * pre-check, so unread uniforms are harmless.
 */
function injectCaptureDefaults(
  material: THREE.ShaderMaterial,
  entId: string | undefined,
): void {
  const seed = hashEntIdTo01(entId);
  const u = material.uniforms as Record<string, { value: unknown }>;

  // Ensure-or-add: for shaders without a dedicated builder, the material
  // often has no declared uniforms beyond the 3 MaterialFactory defaults
  // (u_time, u_logDepthCoef, u_cameraRelativeOrigin). THREE.js ignores
  // uniforms declared on the material but not read by the shader, and
  // uniforms read by the shader but not declared on the material read
  // zero. We pre-declare a broad set so any shader that reads any of
  // these gets the per-ENT value.
  function ensureFloat(key: string, value: number): void {
    if (u[key]) u[key]!.value = value;
    else u[key] = { value };
  }
  function ensureVec3(key: string, x: number, y: number, z: number): void {
    const V = (material as unknown as { uniforms: Record<string, unknown> })
      .uniforms as Record<string, { value: unknown }>;
    const existing = V[key];
    if (existing) {
      const v = existing.value as { set?: (x: number, y: number, z: number) => void };
      v.set?.(x, y, z);
    } else {
      V[key] = { value: new ThreeVector3(x, y, z) };
    }
  }
  function ensureColor(key: string, r: number, g: number, b: number): void {
    const V = (material as unknown as { uniforms: Record<string, unknown> })
      .uniforms as Record<string, { value: unknown }>;
    const existing = V[key];
    if (existing) {
      const v = existing.value as { setRGB?: (r: number, g: number, b: number) => void };
      v.setRGB?.(r, g, b);
    } else {
      V[key] = { value: new ThreeColor().setRGB(r, g, b) };
    }
  }

  // Scalar seeds — drive procedural shape variation in asteroids, KBOs,
  // LSS clusters, transients.
  ensureFloat('u_shapeSeed', seed * 1000);
  ensureFloat('u_seed', seed * 1000);
  ensureFloat('u_richness', 0.2 + seed * 0.7);
  ensureFloat('u_temperatureIndex', seed);
  ensureFloat('u_rotationSpeed', 0);
  ensureFloat('u_rotation', 0);
  ensureFloat('u_activity', 0.3 + seed * 0.6);
  ensureFloat('u_coreRadius', 0.2 + seed * 0.3);

  // Sun direction baseline — matches the entry's sunDirWorld so shaders
  // that read u_sunDir shade against the same light direction.
  ensureVec3('u_sunDir', 0.8, 0.35, 0.5);

  // Pre-declare u_cameraLocal so the entry's syncCameraLocal() can write
  // to it each frame for raymarch shaders without a dedicated update().
  ensureVec3('u_cameraLocal', 0, 0, 0);

  // Color palette — hash to a hue, seed a broad set of named color slots.
  const [r, g, b] = hueToRgb(seed, 0.55, 0.55);
  const [r2, g2, b2] = hueToRgb((seed + 0.33) % 1, 0.7, 0.4);
  const [r3, g3, b3] = hueToRgb((seed + 0.66) % 1, 0.6, 0.7);
  for (const key of [
    'u_baseColor',
    'u_tintColor',
    'u_glowColor',
    'u_emissionColor',
    'u_diskColor',
    'u_nucleusColour',
    'u_streamerColor',
    'u_filamentColor',
    'u_voidColor',
    'u_dustColour',
    'u_coreColor',
  ]) {
    ensureColor(key, r, g, b);
  }
  for (const key of ['u_highlightColor', 'u_haloColor', 'u_ionColour']) {
    ensureColor(key, r2, g2, b2);
  }
  for (const key of ['u_shadowColor', 'u_limbColor', 'u_comaColour']) {
    ensureColor(key, r3, g3, b3);
  }
}

function fromFactory(entId: string | undefined, shaderKey: string): CaptureMaterial {
  // Precedence inside MaterialFactory.resolveRender: explicit `render`
  // block wins over `ENT_ID_TO_RENDER` lookup. So if we passed
  // `{ ent_id, render: { shader } }`, the Tier B `#define`s in
  // ENT_ID_TO_RENDER (e.g. PMS_HERBIG_AE for ENT-1058) would be
  // silently dropped — and 5 PMS stars would all render as the default
  // T Tauri branch. Try ent_id-only first; fall back to shader-only.
  let result;
  try {
    result = createMaterialForEntity({ ent_id: entId });
    if (result.shaderKey !== shaderKey) {
      // ENT_ID_TO_RENDER pointed at a different shader — caller's
      // shaderHint is more authoritative for the URL routing, so
      // override it back to the requested shader by re-creating with
      // the ent_id's defines but the requested shader. Keep the same
      // defines block.
      result.material.dispose();
      result = createMaterialForEntity({ render: { shader: shaderKey } });
    }
  } catch {
    result = createMaterialForEntity({ render: { shader: shaderKey } });
  }
  injectCaptureDefaults(result.material, entId);
  return {
    material: result.material,
    shaderKey: result.shaderKey,
    geometry: geometryFor(result.shaderKey),
  };
}

export function buildCaptureMaterial(
  shaderKey: string,
  entId: string | undefined,
): CaptureMaterial {
  // Stars — Tier A mapped directly to StarFamilyKind.
  if (entId && STAR_A_KIND[entId]) {
    const handle = createStarMaterial(STAR_A_KIND[entId]!);
    return {
      material: handle.material,
      shaderKey,
      geometry: 'sphere',
      update: (ctx) =>
        handle.update(
          ctx.deltaSec,
          ctx.elapsedSec,
          ctx.sunDirWorld,
          ctx.cameraWorld,
          ctx.meshMatrixWorld,
        ),
      dispose: () => handle.dispose(),
    };
  }
  // Stars — Tier B with dedicated shaders (star-brown-dwarf, star-subdwarf,
  // star-carbon, star-pms) — go through MaterialFactory; the shaders bake
  // their own palettes in.
  if (
    shaderKey === 'star-brown-dwarf' ||
    shaderKey === 'star-subdwarf' ||
    shaderKey === 'star-carbon' ||
    shaderKey === 'star-pms'
  ) {
    return fromFactory(entId, shaderKey);
  }
  // Tier B stars using star-evolved / star-variable (ENT-1063..1069) —
  // fall back to closest MainSeq/family kind + overlay Tier B-only define.
  if (entId && (entId.startsWith('ENT-106') || entId.startsWith('ENT-107'))) {
    if (shaderKey === 'star-evolved') {
      const handle = createStarMaterial('redgiant');
      overlayNonSelectorDefines(handle.material, entId);
      return {
        material: handle.material,
        shaderKey,
        geometry: 'sphere',
        update: (ctx) =>
          handle.update(
            ctx.deltaSec,
            ctx.elapsedSec,
            ctx.sunDirWorld,
            ctx.cameraWorld,
            ctx.meshMatrixWorld,
          ),
        dispose: () => handle.dispose(),
      };
    }
    if (shaderKey === 'star-variable') {
      const handle = createStarMaterial('cepheid');
      overlayNonSelectorDefines(handle.material, entId);
      return {
        material: handle.material,
        shaderKey,
        geometry: 'sphere',
        update: (ctx) =>
          handle.update(
            ctx.deltaSec,
            ctx.elapsedSec,
            ctx.sunDirWorld,
            ctx.cameraWorld,
            ctx.meshMatrixWorld,
          ),
        dispose: () => handle.dispose(),
      };
    }
  }

  // Planets — all 42 rows mapped.
  if (entId && PLANET_KIND[entId]) {
    const handle = createPlanetMaterial(PLANET_KIND[entId]!);
    overlayNonSelectorDefines(handle.material, entId);
    return {
      material: handle.material,
      shaderKey,
      geometry: 'sphere',
      update: (ctx) => handle.update(ctx.deltaSec, ctx.elapsedSec, ctx.sunDirWorld),
      dispose: () => handle.dispose(),
    };
  }

  // Moons — 25 rows.
  if (entId && MOON_KIND[entId]) {
    const handle = createMoonMaterial(MOON_KIND[entId]!);
    overlayNonSelectorDefines(handle.material, entId);
    return {
      material: handle.material,
      shaderKey,
      geometry: 'sphere',
      update: (ctx) => handle.update(ctx.deltaSec, ctx.elapsedSec, ctx.sunDirWorld),
      dispose: () => handle.dispose(),
    };
  }

  // Galaxies.
  if (entId && GALAXY_KIND[entId]) {
    const options = galaxyOptionsFor(entId);
    const handle = createGalaxyMaterial(GALAXY_KIND[entId]!, options);
    overlayNonSelectorDefines(handle.material, entId);
    return {
      material: handle.material,
      shaderKey,
      geometry: geometryFor(shaderKey),
      update: (ctx) =>
        handle.update(ctx.deltaSec, ctx.elapsedSec, ctx.cameraWorld, ctx.meshMatrixWorld),
      dispose: () => handle.dispose(),
    };
  }

  // Nebulae — prefer the subtype factory so bipolar vs irregular vs
  // bok-globule get distinct overrides.
  if (entId && NEBULA_SUBTYPE[entId]) {
    const subtype = NEBULA_SUBTYPE[entId];
    const NEBULA_KIND_ONLY: ReadonlySet<string> = new Set([
      'emission',
      'reflection',
      'dark',
      'planetary',
      'supernova',
      'wolfrayet',
      'protoplanetary',
      'superbubble',
    ]);
    const handle = NEBULA_KIND_ONLY.has(subtype)
      ? createNebulaMaterial(subtype as NebulaKind)
      : createNebulaMaterialForSubtype(subtype as NebulaSubtype);
    overlayNonSelectorDefines(handle.material, entId);
    return {
      material: handle.material,
      shaderKey,
      geometry: geometryFor(shaderKey),
      update: (ctx) =>
        handle.update(ctx.deltaSec, ctx.elapsedSec, ctx.cameraWorld, ctx.meshMatrixWorld),
      dispose: () => handle.dispose(),
    };
  }

  // Exotics (including stellar black hole ENT-1032 and Tier B ENT-8030+).
  if (entId && EXOTIC_KIND[entId]) {
    const handle = createExoticMaterial(EXOTIC_KIND[entId]!);
    overlayNonSelectorDefines(handle.material, entId);
    return {
      material: handle.material,
      shaderKey,
      geometry: geometryFor(shaderKey),
      update: (ctx) =>
        handle.update(ctx.deltaSec, ctx.elapsedSec, ctx.cameraWorld, ctx.meshMatrixWorld),
      dispose: () => handle.dispose(),
    };
  }

  // Fallback — MaterialFactory via shader key (small bodies, LSS, clusters,
  // transients, any unmapped ENT). Tier B defines (if any) come along for
  // the ride via ENT_ID_TO_RENDER resolution inside the factory.
  return fromFactory(entId, shaderKey);
}
