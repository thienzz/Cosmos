/**
 * T-V-61 — Dev-only registry that resolves a shader key (and optional
 * ENT-ID) into a fully-uniformed `THREE.ShaderMaterial` suitable for
 * offscreen visual-baseline capture.
 *
 * `MaterialFactory.create(…)` alone is not enough for the capture harness:
 * its `ENT_ID_TO_RENDER` entries intentionally omit palette / parameter
 * uniforms — Doc-accurate colours live inside the per-family builders
 * (`createStarMaterial`, `createPlanetMaterial`, …). Materials built
 * without those uniforms compile but render black, which would collapse
 * every baseline PNG to the same byte sequence and defeat T-V-62.
 *
 * This registry routes each shader family through its dedicated builder
 * using a canonical kind (G-class star, Earth-like rocky, spiral galaxy,
 * emission nebula, …). For Tier B variants that only differ in #defines
 * (e.g. ENT-1055 `CARBON_CR`, ENT-2061 `CARBON_DIAMOND`), the ENT-ID's
 * `ENT_ID_TO_RENDER` defines are merged on top of the dedicated material
 * so the Tier B output is visually distinct from its Tier A sibling.
 *
 * Shaders that have no dedicated builder (smallbody/cluster/LSS/transient)
 * are built via `MaterialFactory.create` directly. These will often render
 * monochrome because their per-entity uniforms come from gameplay-side
 * renderers (e.g. `AsteroidFieldRenderer`) rather than the factory — the
 * baseline is still reproducible and still catches compile/define changes,
 * which is enough for the T-V-62 regression contract.
 */

import type * as THREE from 'three';

import { createExoticMaterial } from '@/engine/ExoticMaterial';
import { createGalaxyMaterial } from '@/engine/GalaxyMaterial';
import { createMaterialForEntity } from '@/engine/MaterialFactory';
import { createMoonMaterial } from '@/engine/MoonMaterial';
import { createNebulaMaterial } from '@/engine/NebulaMaterial';
import { createPlanetMaterial } from '@/engine/PlanetMaterial';
import {
  createStarMaterial,
  type StarMaterialHandle,
} from '@/engine/StarMaterialFamily';
import type { ExoticKind } from '@/utils/exoticPalette';
import type { GalaxyKind } from '@/utils/galaxyPalette';
import type { MoonKind } from '@/utils/moonPalette';
import type { NebulaKind } from '@/utils/nebulaPalette';
import type { PlanetKind } from '@/utils/planetPalette';
import type { StarFamilyKind } from '@/utils/starFamilyPalette';

export interface CaptureMaterial {
  material: THREE.ShaderMaterial;
  shaderKey: string;
  source: 'star' | 'planet' | 'moon' | 'galaxy' | 'nebula' | 'exotic' | 'factory';
}

/**
 * One representative kind per shader key. Picked to exercise each shader's
 * default branch — not to mirror any specific ENT-ID. Tier B defines are
 * overlaid afterwards for per-ENT-ID variation.
 */
const STAR_DEFAULT: Record<string, StarFamilyKind> = {
  'star-mainseq': 'G',
  'star-evolved': 'redgiant',
  'star-remnant': 'whitedwarf',
  'star-variable': 'cepheid',
};

const PLANET_DEFAULT: Record<string, PlanetKind> = {
  'planet-rocky': 'earth',
  'planet-gas': 'jupiter',
  'planet-extreme': 'hycean',
};

const MOON_DEFAULT: Record<string, MoonKind> = {
  'moon-rocky': 'luna',
  'moon-volcanic': 'io',
  'moon-icy': 'europa',
  'moon-atmospheric': 'titan',
  'moon-extreme': 'triton',
  'moon-minor': 'shepherd',
};

const GALAXY_DEFAULT: Record<string, GalaxyKind> = {
  'galaxy-spiral': 'spiral',
  'galaxy-elliptical': 'elliptical',
  'galaxy-lenticular': 'lenticular',
  'galaxy-irregular': 'irregular',
  'galaxy-agn': 'agn',
  'galaxy-starburst': 'starburst',
  'galaxy-morphology-special': 'morphology-special',
};

const NEBULA_DEFAULT: Record<string, NebulaKind> = {
  'nebula-emission': 'emission',
  'nebula-reflection': 'reflection',
  'nebula-dark': 'dark',
  'nebula-planetary': 'planetary',
  'nebula-supernova': 'supernova',
  'nebula-wolfrayet': 'wolfrayet',
  'nebula-protoplanetary': 'protoplanetary',
  'nebula-superbubble': 'superbubble',
};

const EXOTIC_DEFAULT: Record<string, ExoticKind> = {
  'exotic-blackhole': 'blackhole',
  'exotic-pulsar': 'pulsar',
  'exotic-magnetar': 'magnetar',
  'exotic-compact': 'quark',
  'exotic-gr-extreme': 'whitehole',
  'exotic-topology': 'cosmicstring',
  'exotic-dark': 'darkmatterhalo',
  'exotic-tzo': 'tzo',
  'exotic-primordial': 'primordialbh',
  'exotic-quasi-star': 'quasistar',
  'exotic-planck': 'planckstar',
};

/**
 * Tier B `#define` overlays from `MaterialFactory.ENT_ID_TO_RENDER`. We
 * pull the map through `createMaterialForEntity` to avoid duplicating its
 * 200-row lookup table here; the resulting factory material is discarded.
 */
function factoryDefinesFor(entId: string | undefined): Record<string, string> {
  if (!entId) return {};
  try {
    const { material } = createMaterialForEntity({ ent_id: entId });
    const defs = material.defines as Record<string, string> | undefined;
    material.dispose();
    return defs ?? {};
  } catch {
    return {};
  }
}

function overlayEntDefines(
  material: THREE.ShaderMaterial,
  entId: string | undefined,
): void {
  const extra = factoryDefinesFor(entId);
  if (Object.keys(extra).length === 0) return;
  const existing =
    (material.defines as Record<string, string> | undefined) ?? {};
  material.defines = { ...existing, ...extra };
  material.needsUpdate = true;
}

function starHandleToMaterial(handle: StarMaterialHandle): THREE.ShaderMaterial {
  return handle.material;
}

export function buildCaptureMaterial(
  shaderKey: string,
  entId: string | undefined,
): CaptureMaterial {
  if (shaderKey in STAR_DEFAULT) {
    const kind = STAR_DEFAULT[shaderKey]!;
    const mat = starHandleToMaterial(createStarMaterial(kind));
    overlayEntDefines(mat, entId);
    return { material: mat, shaderKey, source: 'star' };
  }
  if (shaderKey in PLANET_DEFAULT) {
    const kind = PLANET_DEFAULT[shaderKey]!;
    const mat = createPlanetMaterial(kind).material;
    overlayEntDefines(mat, entId);
    return { material: mat, shaderKey, source: 'planet' };
  }
  if (shaderKey in MOON_DEFAULT) {
    const kind = MOON_DEFAULT[shaderKey]!;
    const mat = createMoonMaterial(kind).material;
    overlayEntDefines(mat, entId);
    return { material: mat, shaderKey, source: 'moon' };
  }
  if (shaderKey in GALAXY_DEFAULT) {
    const kind = GALAXY_DEFAULT[shaderKey]!;
    const mat = createGalaxyMaterial(kind).material;
    overlayEntDefines(mat, entId);
    return { material: mat, shaderKey, source: 'galaxy' };
  }
  if (shaderKey in NEBULA_DEFAULT) {
    const kind = NEBULA_DEFAULT[shaderKey]!;
    const mat = createNebulaMaterial(kind).material;
    overlayEntDefines(mat, entId);
    return { material: mat, shaderKey, source: 'nebula' };
  }
  if (shaderKey in EXOTIC_DEFAULT) {
    const kind = EXOTIC_DEFAULT[shaderKey]!;
    const mat = createExoticMaterial(kind).material;
    overlayEntDefines(mat, entId);
    return { material: mat, shaderKey, source: 'exotic' };
  }

  // Shader has no dedicated builder — route through MaterialFactory.
  const result = createMaterialForEntity({
    ent_id: entId,
    render: { shader: shaderKey },
  });
  return { material: result.material, shaderKey: result.shaderKey, source: 'factory' };
}
