import {
  DEFAULT_SCENE_SCALE,
  icrsToSceneUnitsPc,
  type SceneScaleConfig,
} from '@cosmos/coordinate-utils';
import * as THREE from 'three';

import { EXOTIC_CATALOG, type ExoticCatalogEntry } from '@/data/exoticCatalog';
import { EXOTIC_KINDS, type ExoticKind } from '@/utils/exoticPalette';

import {
  EXOTIC_KIND_TO_ENT_ID,
  applyEntityToggles,
} from './applyEntityToggles';
import {
  createExoticMaterial,
  type ExoticMaterialHandle,
  type ExoticMaterialOptions,
} from './ExoticMaterial';
import type { GpuLifecycleHook } from './SceneManager';

/**
 * Exotic-object gallery — the T28 visual verification fixture.
 *
 * Mirrors {@link NebulaGalleryRenderer}: each exotic kind (black hole,
 * pulsar, magnetar) is mounted as a BoxGeometry(2, 2, 2) scaled to `size`
 * and laid out along +X so a single screenshot covers the whole row.
 *
 * Not the production renderer — individual exotic entities will be
 * instantiated via the entity ingestion pipeline downstream. The gallery
 * is a static fixture whose only job is "does each shader render the
 * features Doc 18 calls out?".
 */

export type ExoticPositionMode = 'gallery' | 'catalog';

export interface ExoticGalleryOptions {
  /** Row Z offset (default -42 — slightly further than the nebula gallery
   *  because black hole jets extend near to the cube face). */
  rowZ?: number;
  /** Per-kind cube half-extent in world units. Default 6 (→ 12-unit box). */
  size?: number;
  /** Horizontal gap between exotic cubes. Default 4. */
  gap?: number;
  /** Steps override forwarded to every {@link ExoticMaterialHandle}. */
  stepsOverride?: number;
  /** Black-hole disk tilt (radians). */
  diskTilt?: number;
  /** Pulsar rotation frequency (Hz). */
  pulseFrequency?: number;
  /** Magnetar starquake flare intensity (0 = disabled). */
  flareIntensity?: number;
  /**
   * P2C — positioning strategy:
   *  - `'gallery'` (legacy): 3 cubes in a row for Doc 18 visual QA.
   *  - `'catalog'`: one cube per {@link EXOTIC_CATALOG} entry, at its real
   *    ICRS (RA, Dec, distance_pc) position.
   */
  positionMode?: ExoticPositionMode;
  /** Catalog override — defaults to {@link EXOTIC_CATALOG}. */
  catalog?: ReadonlyArray<ExoticCatalogEntry>;
  /** Scene-scale overrides applied in catalog mode. */
  sceneScale?: SceneScaleConfig;
}

interface Body {
  kind: ExoticKind;
  mesh: THREE.Mesh;
  handle: ExoticMaterialHandle;
  /** Present only in catalog mode. */
  catalogEntry?: ExoticCatalogEntry;
}

export class ExoticGalleryRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly bodies: Body[] = [];

  static readonly ORDER: ExoticKind[] = EXOTIC_KINDS;

  constructor(options: ExoticGalleryOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'ExoticGallery';

    const size = options.size ?? 6;
    const gap = options.gap ?? 4;
    const rowZ = options.rowZ ?? -42;
    const positionMode: ExoticPositionMode = options.positionMode ?? 'gallery';

    const matOptsBase: ExoticMaterialOptions = {};
    if (options.stepsOverride !== undefined) matOptsBase.stepsOverride = options.stepsOverride;
    if (options.diskTilt !== undefined) matOptsBase.diskTiltOverride = options.diskTilt;
    if (options.pulseFrequency !== undefined) matOptsBase.pulseFrequencyOverride = options.pulseFrequency;
    if (options.flareIntensity !== undefined) matOptsBase.flareIntensity = options.flareIntensity;

    if (positionMode === 'catalog') {
      // P2C — ICRS-positioned catalog layout. Each entry placed via the
      // stellar-scale pc factor so M87* at 16.8 Mpc ≈ 8.4e6 scene units
      // sits far outside the cluster of Milky-Way exotica (Sgr A* ~4e6,
      // Crab Pulsar ~1e6). The fragment shader still raymarches the unit
      // cube; `mesh.scale` keeps the billboard at a legible size.
      const catalog = options.catalog ?? EXOTIC_CATALOG;
      const scale = options.sceneScale ?? {};
      const unitsPerPc = scale.unitsPerPc ?? DEFAULT_SCENE_SCALE.unitsPerPc;
      const scaleCfg: SceneScaleConfig = { ...scale, unitsPerPc };
      for (const entry of catalog) {
        if (!Number.isFinite(entry.distance_pc) || entry.distance_pc <= 0) continue;
        const pos = icrsToSceneUnitsPc(entry.ra_deg, entry.dec_deg, entry.distance_pc, scaleCfg);
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const handle = createExoticMaterial(entry.kind, matOptsBase);
        const mesh = new THREE.Mesh(geometry, handle.material);
        mesh.name = `Exotic:${entry.id}`;
        mesh.scale.setScalar(size);
        mesh.position.set(pos.x, pos.y, pos.z);
        this.group.add(mesh);
        this.bodies.push({ kind: entry.kind, mesh, handle, catalogEntry: entry });
      }
      // Catalog positions ARE the ICRS truth — no recentre.
    } else {
      // Same convention as NebulaGalleryRenderer: raymarch is over the unit
      // cube ([-1, 1]³), so geometry is BoxGeometry(2, 2, 2) and world
      // size comes from `mesh.scale`.
      let cursor = 0;
      for (const kind of ExoticGalleryRenderer.ORDER) {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const handle = createExoticMaterial(kind, matOptsBase);
        const mesh = new THREE.Mesh(geometry, handle.material);
        mesh.name = `ExoticGallery:${kind}`;
        mesh.scale.setScalar(size);
        cursor += size;
        mesh.position.set(cursor, 0, rowZ);
        cursor += size + gap;
        this.group.add(mesh);
        this.bodies.push({ kind, mesh, handle });
      }

      // Centre the row on origin so the camera can aim at (0, 0, rowZ).
      const bounds = new THREE.Box3().setFromObject(this.group);
      const centre = bounds.getCenter(new THREE.Vector3());
      this.group.position.x -= centre.x;
    }
  }

  /**
   * Per-frame update — refresh `u_cameraLocal` + `u_time` for every handle.
   * Calls `updateWorldMatrix` before the inverse so the uniform ships the
   * same matrix the vertex shader will transform by.
   */
  update(deltaSec: number, elapsedSec: number, cameraWorld: THREE.Vector3): void {
    for (const { kind, mesh, handle } of this.bodies) {
      mesh.updateWorldMatrix(true, false);
      handle.update(deltaSec, elapsedSec, cameraWorld, mesh.matrixWorld);
      // T52 — route Doc 22 exotic toggles into the shader material so
      // flipping any feature in the InfoPanel produces a visible change.
      applyEntityToggles(handle.material, EXOTIC_KIND_TO_ENT_ID[kind]);
    }
  }

  rebuildAfterContextRestore(): void {
    for (const body of this.bodies) {
      body.handle.material.needsUpdate = true;
      (body.mesh.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const body of this.bodies) {
      body.mesh.geometry.dispose();
      body.handle.dispose();
      this.group.remove(body.mesh);
    }
    this.bodies.length = 0;
  }

  /** Test helper — returns the live handles in declaration order. */
  getHandles(): ReadonlyArray<ExoticMaterialHandle> {
    return this.bodies.map((b) => b.handle);
  }

  /** Test helper — returns the live meshes in declaration order. */
  getMeshes(): ReadonlyArray<THREE.Mesh> {
    return this.bodies.map((b) => b.mesh);
  }

  /** Test helper — catalog entries per body (undefined in gallery mode). */
  getCatalogEntries(): ReadonlyArray<ExoticCatalogEntry | undefined> {
    return this.bodies.map((b) => b.catalogEntry);
  }

  /**
   * T30 — world-space position + apparent horizon radius of the black-hole
   * mesh. Used by the post-processing chain to auto-register a lensing
   * handle against the gallery's BH. Returns `null` if the gallery has no
   * black hole (defensive — the ORDER constant guarantees one today).
   */
  getBlackHoleTransform(): { position: THREE.Vector3; radius: number } | null {
    const bh = this.bodies.find((b) => b.kind === 'blackhole');
    if (!bh) return null;
    const position = new THREE.Vector3();
    bh.mesh.getWorldPosition(position);
    const scale = new THREE.Vector3();
    bh.mesh.getWorldScale(scale);
    // Shader horizon radius is 0.3 of the unit-cube radius (see
    // exoticPalette.blackHole.params.horizonRadius). Fold the mesh scale
    // in so the lensing radius tracks the mesh size.
    const radius = 0.3 * Math.max(scale.x, scale.y, scale.z);
    return { position, radius };
  }
}
