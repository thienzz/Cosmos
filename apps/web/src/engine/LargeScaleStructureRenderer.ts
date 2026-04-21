import * as THREE from 'three';

import {
  COLLIDING_CLUSTERS,
  COSMIC_VOIDS,
  GALAXY_CLUSTERS,
  GREAT_WALLS,
  HARRIS_DIAS_OPEN_CLUSTERS,
  HARRIS_GLOBULAR_CLUSTERS,
  LYMAN_ALPHA_BLOBS,
  OB_ASSOCIATIONS,
  type ColliderPairEntry,
  type GalaxyClusterEntry,
  type GlobularClusterEntry,
  type GreatWallEntry,
  type LymanAlphaBlobEntry,
  type ObAssociationEntry,
  type OpenClusterEntry,
  type VoidEntry,
} from '@/data/largeScaleStructureCatalog';

import { applyEntityToggles } from './applyEntityToggles';
import type { GpuLifecycleHook } from './gpuLifecycle';

/**
 * Map this renderer's internal entity codes to Doc 22 ENT-IDs.
 * The internal codes come from Doc 17 / early drafts of the taxonomy;
 * Doc 22's ENTITY_TOGGLES uses its own assignments for the 7xxx band
 * (see `shared-types/src/entityToggles.ts`):
 *   ENT-7010: Galaxy Cluster
 *   ENT-7020: Cosmic Web Filament
 *   ENT-7030: Cosmic Void
 *   ENT-7040: Globular Cluster
 *   ENT-7050: Open Star Cluster
 *   ENT-7060: Galaxy Supercluster
 *   ENT-7080: Lyman-Alpha Blob
 */
const LSS_ENT_ID_FALLBACK: Record<string, string> = {
  // Internal 'ENT-7010' = open star clusters → Doc 22 ENT-7050
  'ENT-7010': 'ENT-7050',
  // Internal 'ENT-7011' = globular clusters → Doc 22 ENT-7040
  'ENT-7011': 'ENT-7040',
  // Internal 'ENT-7012' = OB associations → closest: open cluster
  'ENT-7012': 'ENT-7050',
  // Internal 'ENT-7020_7021' = galaxy clusters → Doc 22 ENT-7010
  'ENT-7020_7021': 'ENT-7010',
  // Internal 'ENT-7022' = supercluster → Doc 22 ENT-7060
  'ENT-7022': 'ENT-7060',
  // Internal 'ENT-7023' = colliding clusters → Doc 22 ENT-7010
  'ENT-7023': 'ENT-7010',
  // Internal 'ENT-7031' = voids → Doc 22 ENT-7030
  'ENT-7031': 'ENT-7030',
  // Internal 'ENT-7032' = great walls → Doc 22 ENT-7020 (cosmic web)
  'ENT-7032': 'ENT-7020',
  // Internal 'ENT-7033' = Lyman-alpha blob → Doc 22 ENT-7080
  'ENT-7033': 'ENT-7080',
};

/**
 * T47 — Large-Scale Structure gallery renderer.
 *
 * Doc 17 §7010..7033 / Doc 18 §Large-Scale Structures. Mounts one
 * representative visualization per ENT-70xx category in a 3-row grid so
 * `?demo=lss` can eyeball every family in a single viewport.
 *
 * Each sub-renderer is fully procedural (CLAUDE.md Rule #1); the only
 * whole-project texture exception — Planck 2018 CMB — is not used here
 * (it lives in {@link CmbBoundarySphere}). All shaders are inline (matching
 * the CmbBoundarySphere approach) so adding the feature does not touch the
 * `vite-plugin-glsl` import manifest.
 *
 * Out of scope for this renderer and deferred to Phase-2 backend work:
 *   - IllustrisTNG ≥500k-node cosmic web mesh (T23 tile decoder path) —
 *     the demo still uses T29's {@link DEFAULT_COSMIC_WEB} for filaments.
 *   - Ingestion of the full 4 073-row Abell / 1 653-row Planck SZ /
 *     ~2 700-row Dias catalogs. The gallery subset here is ~10 entries
 *     per category; the full ingest ships via `apps/etl` + Postgres
 *     (Doc 23 §6.1.4).
 *   - Search + fly-to integration in the T50 unified scene — gallery mode
 *     leaves the camera seated for an overview.
 */

// Gallery layout — 3 rows × 3 wide grid, each cell ~28 world units wide.
const CELL = 28;
const ROW_Y = [+CELL, 0, -CELL];
const ROW_Z = -20;

export interface LargeScaleStructureRendererOptions {
  /** Gallery cell half-extent (default 12 → 24u box). */
  cellRadius?: number;
  /** Gallery anchor Z depth (default -20). */
  anchorZ?: number;
}

type SubrendererId =
  | 'open-cluster'
  | 'globular-cluster'
  | 'ob-association'
  | 'galaxy-cluster'
  | 'supercluster'
  | 'colliding-cluster'
  | 'great-wall'
  | 'cosmic-void'
  | 'lyman-alpha-blob';

interface Subrenderer {
  id: SubrendererId;
  entityCode: string;
  displayName: string;
  group: THREE.Group;
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
  update?: (deltaSec: number, elapsedSec: number) => void;
  uniforms?: { u_time?: THREE.IUniform<number> };
}

export class LargeScaleStructureRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly subrenderers: Subrenderer[] = [];

  constructor(options: LargeScaleStructureRendererOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'LargeScaleStructure';

    const cellRadius = options.cellRadius ?? 12;
    const anchorZ = options.anchorZ ?? ROW_Z;

    // Gallery grid — 3×3 layout. Row 0 (top): stellar-scale clusters.
    // Row 1 (mid): galaxy clusters + colliders. Row 2 (bot): cosmic web
    // exotica (walls, voids, Lyα blobs).
    const layout: ReadonlyArray<{
      sub: Subrenderer;
      col: number;
      row: number;
    }> = [
      { sub: buildOpenCluster(HARRIS_DIAS_OPEN_CLUSTERS, cellRadius),
        col: -1, row: 0 },
      { sub: buildGlobularCluster(HARRIS_GLOBULAR_CLUSTERS, cellRadius),
        col: 0, row: 0 },
      { sub: buildObAssociation(OB_ASSOCIATIONS, cellRadius),
        col: +1, row: 0 },
      { sub: buildGalaxyCluster(GALAXY_CLUSTERS, cellRadius),
        col: -1, row: 1 },
      { sub: buildSupercluster(GALAXY_CLUSTERS, cellRadius),
        col: 0, row: 1 },
      { sub: buildCollidingCluster(COLLIDING_CLUSTERS, cellRadius),
        col: +1, row: 1 },
      { sub: buildGreatWall(GREAT_WALLS, cellRadius),
        col: -1, row: 2 },
      { sub: buildCosmicVoid(COSMIC_VOIDS, cellRadius),
        col: 0, row: 2 },
      { sub: buildLymanAlphaBlob(LYMAN_ALPHA_BLOBS, cellRadius),
        col: +1, row: 2 },
    ];

    for (const { sub, col, row } of layout) {
      sub.group.position.set(col * CELL, ROW_Y[row]!, anchorZ);
      this.group.add(sub.group);
      this.subrenderers.push(sub);
    }
  }

  /** Per-frame update — ticks time uniforms on animating sub-materials. */
  update(deltaSec: number, elapsedSec: number): void {
    for (const sub of this.subrenderers) {
      sub.update?.(deltaSec, elapsedSec);
      // T52 — route Doc 22 LSS toggles (ENT-7010..7080) into every
      // sub-material. Composite codes (e.g. 'ENT-7020_7021') resolve to
      // their primary Doc 22 ID via `LSS_ENT_ID_FALLBACK`.
      const entId = LSS_ENT_ID_FALLBACK[sub.entityCode] ?? sub.entityCode;
      for (const m of sub.materials) {
        if ((m as THREE.ShaderMaterial).isShaderMaterial) {
          applyEntityToggles(m as THREE.ShaderMaterial, entId);
        }
      }
    }
  }

  /** Test helper — list of sub-renderer ids in declaration order. */
  getSubrendererIds(): ReadonlyArray<SubrendererId> {
    return this.subrenderers.map((s) => s.id);
  }

  /** Test helper — ENT-7xxx code per sub-renderer. */
  getEntityCodes(): ReadonlyArray<string> {
    return this.subrenderers.map((s) => s.entityCode);
  }

  rebuildAfterContextRestore(): void {
    for (const sub of this.subrenderers) {
      for (const m of sub.materials) {
        m.needsUpdate = true;
      }
    }
  }

  dispose(): void {
    for (const sub of this.subrenderers) {
      this.group.remove(sub.group);
      for (const m of sub.materials) m.dispose();
      for (const g of sub.geometries) g.dispose();
    }
    this.subrenderers.length = 0;
  }
}

// ---------------------------------------------------------------------------
// ENT-7010 — Open Star Clusters
// ---------------------------------------------------------------------------

function buildOpenCluster(
  entries: readonly OpenClusterEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:OpenCluster';

  // Sample ~200 stars on a Gaussian radial profile + Gaussian vertical.
  // Blue dominant colors for young stars per Doc 17 ENT-7010 palette.
  const STAR_COUNT = 200;
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);

  const rng = mulberry32(0xA110);
  for (let i = 0; i < STAR_COUNT; i++) {
    // Radial sample — Gaussian σ = 0.35 cellRadius.
    const sigma = cellRadius * 0.35;
    const r = Math.abs(gaussian(rng) * sigma);
    const theta = rng() * Math.PI * 2;
    const z = gaussian(rng) * sigma * 0.5;
    positions[i * 3 + 0] = r * Math.cos(theta);
    positions[i * 3 + 1] = z;
    positions[i * 3 + 2] = r * Math.sin(theta);

    // Color: 70% blue, 20% white, 10% yellow-red per Doc 17.
    const roll = rng();
    if (roll < 0.70) {
      colors[i * 3 + 0] = 0.29; colors[i * 3 + 1] = 0.56; colors[i * 3 + 2] = 1.0;
    } else if (roll < 0.90) {
      colors[i * 3 + 0] = 1.00; colors[i * 3 + 1] = 1.00; colors[i * 3 + 2] = 1.0;
    } else {
      colors[i * 3 + 0] = 1.00; colors[i * 3 + 1] = 0.64; colors[i * 3 + 2] = 0.3;
    }

    sizes[i] = (1.0 + rng() * 1.5) * (r < sigma ? 1.8 : 1.0);
  }

  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starsMaterial = new THREE.ShaderMaterial({
    name: 'lss-open-cluster-points',
    glslVersion: THREE.GLSL3,
    uniforms: {
      u_pixelRatio: {
        value:
          typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: OPEN_CLUSTER_VERT,
    fragmentShader: OPEN_CLUSTER_FRAG,
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  group.add(stars);

  // Reflection-nebula halo — Pleiades-style soft blue shell.
  const haloGeom = new THREE.SphereGeometry(cellRadius * 0.55, 24, 16);
  const haloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#B0D4FF'),
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(haloGeom, haloMat);
  group.add(halo);

  return {
    id: 'open-cluster',
    entityCode: 'ENT-7010',
    displayName: `Open Clusters (${entries.length})`,
    group,
    materials: [starsMaterial, haloMat],
    geometries: [starsGeometry, haloGeom],
  };
}

// ---------------------------------------------------------------------------
// ENT-7011 — Globular Star Clusters (King profile shader)
// ---------------------------------------------------------------------------

function buildGlobularCluster(
  entries: readonly GlobularClusterEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:GlobularCluster';

  const uniforms = {
    u_time: { value: 0 },
    // Harris-median core radius ≈ 1 pc; tidal radius ≈ 50 pc. In gallery
    // units we use r_c ≈ 0.12, r_t ≈ 0.9 (normalized to cellRadius).
    u_rCore: { value: 0.12 },
    u_rTidal: { value: 0.9 },
  };

  const geom = new THREE.SphereGeometry(cellRadius * 0.85, 48, 32);
  const mat = new THREE.ShaderMaterial({
    name: 'lss-globular-cluster',
    glslVersion: THREE.GLSL3,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: GLOBULAR_VERT,
    fragmentShader: GLOBULAR_FRAG,
  });
  const sphere = new THREE.Mesh(geom, mat);
  group.add(sphere);

  return {
    id: 'globular-cluster',
    entityCode: 'ENT-7011',
    displayName: `Globular Clusters (${entries.length})`,
    group,
    materials: [mat],
    geometries: [geom],
    uniforms: { u_time: uniforms.u_time },
    update: (_d, elapsed) => {
      uniforms.u_time.value = elapsed;
    },
  };
}

// ---------------------------------------------------------------------------
// ENT-7012 — OB Associations
// ---------------------------------------------------------------------------

function buildObAssociation(
  entries: readonly ObAssociationEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:OBAssociation';

  // Loose OB grouping — fewer stars (~60) spread wider than open cluster,
  // all blue-dominant.
  const STAR_COUNT = 60;
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);

  const rng = mulberry32(0x0B01);
  for (let i = 0; i < STAR_COUNT; i++) {
    // Cubic uniform spread within half-cell.
    positions[i * 3 + 0] = (rng() - 0.5) * 2 * cellRadius * 0.7;
    positions[i * 3 + 1] = (rng() - 0.5) * 2 * cellRadius * 0.35;
    positions[i * 3 + 2] = (rng() - 0.5) * 2 * cellRadius * 0.7;

    // Nearly all O/B blue.
    colors[i * 3 + 0] = 0.20; colors[i * 3 + 1] = 0.40; colors[i * 3 + 2] = 1.0;
    sizes[i] = 2.0 + rng() * 2.0;
  }

  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starsMaterial = new THREE.ShaderMaterial({
    name: 'lss-ob-association-points',
    glslVersion: THREE.GLSL3,
    uniforms: {
      u_pixelRatio: {
        value:
          typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: OPEN_CLUSTER_VERT,
    fragmentShader: OPEN_CLUSTER_FRAG,
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  group.add(stars);

  // Residual H-II region — crimson glow bubble.
  const haloGeom = new THREE.SphereGeometry(cellRadius * 0.75, 24, 16);
  const haloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FF4444'),
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(haloGeom, haloMat);
  group.add(halo);

  return {
    id: 'ob-association',
    entityCode: 'ENT-7012',
    displayName: `OB Associations (${entries.length})`,
    group,
    materials: [starsMaterial, haloMat],
    geometries: [starsGeometry, haloGeom],
  };
}

// ---------------------------------------------------------------------------
// ENT-7020 / 7021 — Galaxy Cluster (Virgo/Coma-style)
// ---------------------------------------------------------------------------

function buildGalaxyCluster(
  entries: readonly GalaxyClusterEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:GalaxyCluster';

  // 60 galaxy sprites on King profile, dominated by red ellipticals,
  // 10% blue spirals, plus a bright central BCG.
  const GAL_COUNT = 60;
  const rng = mulberry32(0x6A1A);
  const sharedMaterials: THREE.Material[] = [];
  const sharedGeometries: THREE.BufferGeometry[] = [];

  // BCG — bright central elliptical.
  const bcgGeom = new THREE.SphereGeometry(cellRadius * 0.18, 16, 12);
  const bcgMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FFAA66'),
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(bcgGeom, bcgMat));
  sharedMaterials.push(bcgMat);
  sharedGeometries.push(bcgGeom);

  // Member galaxies.
  const galGeom = new THREE.SphereGeometry(cellRadius * 0.05, 8, 6);
  const matRed = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#CC4444'),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const matBlue = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#4488CC'),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  sharedMaterials.push(matRed, matBlue);
  sharedGeometries.push(galGeom);

  for (let i = 0; i < GAL_COUNT; i++) {
    const u = rng();
    // Inverse King profile CDF approximation — heavy core, wide tail.
    const r = cellRadius * 0.9 * Math.pow(u, 1.5);
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const sinPhi = Math.sin(phi);
    const pos = new THREE.Vector3(
      r * sinPhi * Math.cos(theta),
      r * sinPhi * Math.sin(theta),
      r * Math.cos(phi) * 0.4,
    );
    const isBlue = rng() < 0.1;
    const gal = new THREE.Mesh(galGeom, isBlue ? matBlue : matRed);
    gal.position.copy(pos);
    group.add(gal);
  }

  // ICM — faint hot-gas sphere.
  const icmGeom = new THREE.SphereGeometry(cellRadius * 0.88, 24, 16);
  const icmMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#4488FF'),
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Mesh(icmGeom, icmMat));
  sharedMaterials.push(icmMat);
  sharedGeometries.push(icmGeom);

  return {
    id: 'galaxy-cluster',
    entityCode: 'ENT-7020_7021',
    displayName: `Galaxy Clusters (${entries.filter((e) => e.richness === 'cluster').length})`,
    group,
    materials: sharedMaterials,
    geometries: sharedGeometries,
  };
}

// ---------------------------------------------------------------------------
// ENT-7022 — Supercluster (filament network + component clusters)
// ---------------------------------------------------------------------------

function buildSupercluster(
  entries: readonly GalaxyClusterEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:Supercluster';

  const superclusters = entries.filter((e) => e.richness === 'supercluster');

  // Represent as 5 nodes along a Catmull-Rom spline + connecting tubes.
  const nodes: THREE.Vector3[] = [];
  const rng = mulberry32(0x5C22);
  const NODE_COUNT = 5;
  for (let i = 0; i < NODE_COUNT; i++) {
    const t = i / (NODE_COUNT - 1);
    const x = (t - 0.5) * 2 * cellRadius * 0.85;
    const y = Math.sin(t * Math.PI * 1.5) * cellRadius * 0.35;
    const z = (rng() - 0.5) * cellRadius * 0.3;
    nodes.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(nodes, false, 'centripetal', 0.5);
  const tubeGeom = new THREE.TubeGeometry(curve, 48, cellRadius * 0.08, 8, false);
  const tubeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#6633FF'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Mesh(tubeGeom, tubeMat));

  // Node clusters.
  const nodeGeom = new THREE.SphereGeometry(cellRadius * 0.13, 16, 12);
  const nodeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FFB066'),
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (const p of nodes) {
    const m = new THREE.Mesh(nodeGeom, nodeMat);
    m.position.copy(p);
    group.add(m);
  }

  return {
    id: 'supercluster',
    entityCode: 'ENT-7022',
    displayName: `Superclusters (${superclusters.length})`,
    group,
    materials: [tubeMat, nodeMat],
    geometries: [tubeGeom, nodeGeom],
  };
}

// ---------------------------------------------------------------------------
// ENT-7023 — Colliding Clusters (Bullet Cluster analogue)
// ---------------------------------------------------------------------------

function buildCollidingCluster(
  entries: readonly ColliderPairEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:CollidingCluster';

  const sharedMaterials: THREE.Material[] = [];
  const sharedGeometries: THREE.BufferGeometry[] = [];

  // Two sub-clusters at ±0.4 cellRadius along X.
  const offsets = [
    { pos: new THREE.Vector3(-cellRadius * 0.45, 0, 0), scale: 1.0 },
    { pos: new THREE.Vector3(+cellRadius * 0.40, 0, 0), scale: 0.7 },
  ];

  const gasGeom = new THREE.SphereGeometry(cellRadius * 0.28, 24, 16);
  const gasMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FFAA44'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dmGeom = new THREE.SphereGeometry(cellRadius * 0.30, 16, 12);
  const dmMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#8844FF'),
    transparent: true,
    wireframe: true,
    opacity: 0.35,
    depthWrite: false,
  });
  sharedMaterials.push(gasMat, dmMat);
  sharedGeometries.push(gasGeom, dmGeom);

  for (const { pos, scale } of offsets) {
    const gas = new THREE.Mesh(gasGeom, gasMat);
    gas.position.copy(pos);
    gas.scale.setScalar(scale);
    group.add(gas);

    // DM halo offset outward from collision centre — Bullet-Cluster
    // signature: DM has passed through, gas has decelerated.
    const dm = new THREE.Mesh(dmGeom, dmMat);
    dm.position.copy(pos).multiplyScalar(1.5);
    dm.scale.setScalar(scale);
    group.add(dm);
  }

  // Shock front — faint yellow arc between clusters.
  const shockGeom = new THREE.TorusGeometry(cellRadius * 0.25, cellRadius * 0.03, 8, 32, Math.PI);
  const shockMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FFFF44'),
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const shock = new THREE.Mesh(shockGeom, shockMat);
  shock.rotation.z = Math.PI / 2;
  group.add(shock);
  sharedMaterials.push(shockMat);
  sharedGeometries.push(shockGeom);

  return {
    id: 'colliding-cluster',
    entityCode: 'ENT-7023',
    displayName: `Colliding Clusters (${entries.length})`,
    group,
    materials: sharedMaterials,
    geometries: sharedGeometries,
  };
}

// ---------------------------------------------------------------------------
// ENT-7032 — Great Walls (planar LineSegments)
// ---------------------------------------------------------------------------

function buildGreatWall(
  entries: readonly GreatWallEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:GreatWall';

  // 2D grid of galaxy points on a thin planar sheet + line segments to
  // emphasize the wall geometry.
  const GRID = 16;
  const positions = new Float32Array(GRID * GRID * 3);
  const rng = mulberry32(0x67EA);
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const idx = (i * GRID + j) * 3;
      const u = (i / (GRID - 1) - 0.5) * 2;
      const v = (j / (GRID - 1) - 0.5) * 2;
      positions[idx + 0] = u * cellRadius * 0.85;
      positions[idx + 1] = v * cellRadius * 0.5;
      positions[idx + 2] = (rng() - 0.5) * cellRadius * 0.08; // slight undulation
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color('#FF8866'),
    size: 2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Points(geom, mat));

  // Grid lines — sparse wall scaffolding.
  const lineVerts: number[] = [];
  for (let i = 0; i < GRID; i += 4) {
    for (let j = 0; j < GRID - 1; j++) {
      const a = (i * GRID + j) * 3;
      const b = (i * GRID + j + 1) * 3;
      lineVerts.push(positions[a]!, positions[a + 1]!, positions[a + 2]!);
      lineVerts.push(positions[b]!, positions[b + 1]!, positions[b + 2]!);
    }
  }
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#CC4444'),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  group.add(new THREE.LineSegments(lineGeom, lineMat));

  return {
    id: 'great-wall',
    entityCode: 'ENT-7032',
    displayName: `Great Walls (${entries.length})`,
    group,
    materials: [mat, lineMat],
    geometries: [geom, lineGeom],
  };
}

// ---------------------------------------------------------------------------
// ENT-7031 — Cosmic Voids
// ---------------------------------------------------------------------------

function buildCosmicVoid(
  entries: readonly VoidEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:CosmicVoid';

  // Primary void — large wireframe icosahedron.
  const bigGeom = new THREE.IcosahedronGeometry(cellRadius * 0.75, 2);
  const bigEdges = new THREE.EdgesGeometry(bigGeom);
  bigGeom.dispose();
  const bigMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#334477'),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  group.add(new THREE.LineSegments(bigEdges, bigMat));

  // Dark fog interior — a thin inside-out sphere with low alpha.
  const foggeom = new THREE.SphereGeometry(cellRadius * 0.72, 32, 24);
  const fogMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#001133'),
    transparent: true,
    opacity: 0.35,
    side: THREE.BackSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(foggeom, fogMat));

  // Occasional dwarf galaxy inside — one red point.
  const dwarfGeom = new THREE.SphereGeometry(cellRadius * 0.035, 8, 6);
  const dwarfMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#884444'),
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dwarf = new THREE.Mesh(dwarfGeom, dwarfMat);
  dwarf.position.set(cellRadius * 0.15, -cellRadius * 0.05, cellRadius * 0.12);
  group.add(dwarf);

  return {
    id: 'cosmic-void',
    entityCode: 'ENT-7031',
    displayName: `Cosmic Voids (${entries.length})`,
    group,
    materials: [bigMat, fogMat, dwarfMat],
    geometries: [bigEdges, foggeom, dwarfGeom],
  };
}

// ---------------------------------------------------------------------------
// ENT-7033 — Lyman-α Blob (volumetric cyan emission)
// ---------------------------------------------------------------------------

function buildLymanAlphaBlob(
  entries: readonly LymanAlphaBlobEntry[],
  cellRadius: number,
): Subrenderer {
  const group = new THREE.Group();
  group.name = 'LSS:LymanAlphaBlob';

  const uniforms = {
    u_time: { value: 0 },
  };

  // 3 nested Gaussian shells — additive, emission-only.
  const sharedMaterials: THREE.Material[] = [];
  const sharedGeometries: THREE.BufferGeometry[] = [];

  const geom = new THREE.SphereGeometry(cellRadius * 0.85, 32, 24);
  const mat = new THREE.ShaderMaterial({
    name: 'lss-lyman-alpha-blob',
    glslVersion: THREE.GLSL3,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: BLOB_VERT,
    fragmentShader: BLOB_FRAG,
  });
  group.add(new THREE.Mesh(geom, mat));
  sharedMaterials.push(mat);
  sharedGeometries.push(geom);

  // Central source point — bright white quasar indicator.
  const coreGeom = new THREE.SphereGeometry(cellRadius * 0.08, 16, 12);
  const coreMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FFFFFF'),
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(coreGeom, coreMat));
  sharedMaterials.push(coreMat);
  sharedGeometries.push(coreGeom);

  return {
    id: 'lyman-alpha-blob',
    entityCode: 'ENT-7033',
    displayName: `Lyman-α Blobs (${entries.length})`,
    group,
    materials: sharedMaterials,
    geometries: sharedGeometries,
    uniforms: { u_time: uniforms.u_time },
    update: (_d, elapsed) => {
      uniforms.u_time.value = elapsed;
    },
  };
}

// ---------------------------------------------------------------------------
// Small stats utilities (private)
// ---------------------------------------------------------------------------

/** Deterministic xorshift-style RNG so the gallery is bit-for-bit reproducible. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard-normal via Box-Muller — samples one value, caches the conjugate. */
let gaussianCache: number | null = null;
function gaussian(rng: () => number): number {
  if (gaussianCache !== null) {
    const v = gaussianCache;
    gaussianCache = null;
    return v;
  }
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const mag = Math.sqrt(-2 * Math.log(u1));
  const z0 = mag * Math.cos(2 * Math.PI * u2);
  const z1 = mag * Math.sin(2 * Math.PI * u2);
  gaussianCache = z1;
  return z0;
}

// ---------------------------------------------------------------------------
// Inline shaders
// ---------------------------------------------------------------------------

const OPEN_CLUSTER_VERT = /* glsl */ `
in vec3 color;
in float size;
uniform float u_pixelRatio;
out vec3 v_color;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif
void main() {
  v_color = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(1.0, size * u_pixelRatio);
  gl_Position = projectionMatrix * mv;
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
`;

const OPEN_CLUSTER_FRAG = /* glsl */ `
precision highp float;
in vec3 v_color;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif
out vec4 fragColor;
void main() {
  // Radial gaussian sprite (tight core, soft halo).
  vec2 d = gl_PointCoord - vec2(0.5);
  float r2 = dot(d, d);
  float a = exp(-r2 * 18.0);
  fragColor = vec4(v_color * 1.4, a);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
`;

const GLOBULAR_VERT = /* glsl */ `
out vec3 v_modelPos;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif
void main() {
  v_modelPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
`;

// King profile density — Doc 17 ENT-7011 §Shader. Radial density
// ρ(r) = 1 / (1 + (r/r_c)²)^1.5, with a tidal exp cutoff. Color blended
// from core (warm yellow #FFD66A) to outer halo (dim red #884422).
const GLOBULAR_FRAG = /* glsl */ `
precision highp float;
in vec3 v_modelPos;
uniform float u_time;
uniform float u_rCore;
uniform float u_rTidal;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif
out vec4 fragColor;

float hash(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  float maxR = u_rTidal;
  float r = length(v_modelPos) / 12.0; // gallery cellRadius ≈ 12 → normalize
  if (r > maxR) discard;

  // King profile.
  float x = r / u_rCore;
  float density = 1.0 / pow(1.0 + x * x, 1.5);
  density *= exp(-(r * r) / (maxR * maxR));

  // Speckle — fake resolved stars near surface.
  float twinkle = hash(floor(v_modelPos * 40.0) + floor(u_time * 3.0));
  density += twinkle * 0.04 * smoothstep(0.2, 0.8, r / maxR);

  vec3 core  = vec3(1.0, 0.86, 0.45);
  vec3 outer = vec3(0.55, 0.18, 0.10);
  vec3 col = mix(outer, core, pow(density, 0.6));
  float alpha = clamp(density * 1.6, 0.0, 1.0);
  fragColor = vec4(col * (1.0 + density * 0.8), alpha);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
`;

const BLOB_VERT = /* glsl */ `
out vec3 v_modelPos;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif
void main() {
  v_modelPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
`;

// Volumetric cyan emission with fbm-driven filamentary sub-structure
// per Doc 17 ENT-7033 §Shader — Gaussian radial + Perlin octaves.
const BLOB_FRAG = /* glsl */ `
precision highp float;
in vec3 v_modelPos;
uniform float u_time;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif
out vec4 fragColor;

float hash(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float valueNoise(vec3 p){
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1,0,0));
  float n010 = hash(i + vec3(0,1,0));
  float n110 = hash(i + vec3(1,1,0));
  float n001 = hash(i + vec3(0,0,1));
  float n101 = hash(i + vec3(1,0,1));
  float n011 = hash(i + vec3(0,1,1));
  float n111 = hash(i + vec3(1,1,1));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}
float fbm(vec3 p){
  float s = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * valueNoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

void main() {
  // Gaussian envelope.
  float sigma = 4.5; // gallery units
  float r = length(v_modelPos);
  float gaussian = exp(-(r*r) / (2.0 * sigma * sigma));

  // Filamentary structure.
  float n = fbm(v_modelPos * 0.6 + vec3(0.0, u_time * 0.05, 0.0));
  float density = gaussian * (0.6 + 0.8 * n);

  vec3 cyan = vec3(0.27, 0.86, 1.0);
  vec3 col = cyan * density * 1.6;
  fragColor = vec4(col, clamp(density, 0.0, 0.85));
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
`;
