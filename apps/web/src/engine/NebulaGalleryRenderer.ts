import {
  DEFAULT_SCENE_SCALE,
  icrsToSceneUnitsPc,
  type SceneScaleConfig,
} from '@cosmos/coordinate-utils';
import * as THREE from 'three';

import { NEBULA_CATALOG, type NebulaCatalogEntry } from '@/data/nebulaCatalog';
import {
  NEBULA_KINDS,
  NEBULA_SUBTYPES,
  type NebulaKind,
  type NebulaSubtype,
} from '@/utils/nebulaPalette';

import {
  applyEntityToggles,
  NEBULA_KIND_TO_ENT_ID,
} from './applyEntityToggles';
import {
  createNebulaMaterial,
  createNebulaMaterialForSubtype,
  type NebulaMaterialHandle,
  type NebulaMaterialOptions,
} from './NebulaMaterial';
import type { GpuLifecycleHook } from './SceneManager';

/**
 * Nebula gallery — the T27 / T45 visual verification fixture.
 *
 * T27 shipped a 5-slot gallery keyed by {@link NebulaKind}. T45 expands to a
 * 14-slot gallery keyed by {@link NebulaSubtype} so every Doc 17 §5010–§5080
 * entity type has a dedicated preview cube. The legacy `NebulaKind` layout
 * is kept behind a constructor flag (`mode: 'families'`) so existing tests
 * and external screenshot baselines remain valid.
 *
 * Each nebula is a unit-ish cube (BoxGeometry sized per-kind) spaced along
 * the X axis so the preview smoke / TS-RENDER-005 / TS-VQA-003 can
 * screenshot all slots in one frame. `update()` feeds the volumetric
 * shaders their per-frame uniforms (elapsed time for animation +
 * `u_cameraLocal` recomputed from `worldToLocal(camera.position)`).
 *
 * This is NOT the production nebula renderer — individual nebula entities
 * will be mounted via the tile-streaming pipeline with the T45 catalog
 * ingest ETL. The gallery is a static fixture whose only purpose is
 * "does each shader look right?".
 */

export type NebulaGalleryMode = 'families' | 'subtypes' | 'catalog';

export interface NebulaGalleryOptions {
  /** 'families' (8) keeps the T27-style single-row layout; 'subtypes' (14)
   *  is the T45 2×7 grid layout; 'catalog' (P2C) mounts every
   *  {@link NEBULA_CATALOG} entry at its real ICRS position. Default
   *  'subtypes'. */
  mode?: NebulaGalleryMode;
  /** Row Z offset (default -40 — sits further back than the planet gallery
   *  because nebulae want more breathing room around the cube faces). */
  rowZ?: number;
  /** Per-kind cube half-extent in world units. Default 6 (→ 12-unit box). */
  size?: number;
  /** Horizontal gap between nebula cubes. Default 3. */
  gap?: number;
  /** Number of columns in subtypes mode (rows inferred from ceil(14/cols)).
   *  Default 7 (→ 2 rows × 7 cols). Ignored in families mode. */
  cols?: number;
  /** Vertical gap between rows in subtypes mode. Default `gap`. */
  rowGap?: number;
  /** Local-space illumination direction for the reflection nebula. */
  reflectionStarDir?: THREE.Vector3;
  /** Steps override forwarded to every {@link NebulaMaterialHandle}. */
  stepsOverride?: number;
  /** Pulsar intensity for the supernova remnant. Default 0.9. */
  pulsarIntensity?: number;
  /** Bipolar strength for the planetary nebula (0 = spherical). */
  bipolarOverride?: number;
  /** Catalog override — defaults to {@link NEBULA_CATALOG}. */
  catalog?: ReadonlyArray<NebulaCatalogEntry>;
  /** Scene-scale overrides applied in catalog mode. */
  sceneScale?: SceneScaleConfig;
}

interface Body {
  kind: NebulaKind;
  /** Present when mode === 'subtypes' or 'catalog'. */
  subtype?: NebulaSubtype;
  mesh: THREE.Mesh;
  handle: NebulaMaterialHandle;
  /** Present only in catalog mode. */
  catalogEntry?: NebulaCatalogEntry;
}

export class NebulaGalleryRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  readonly mode: NebulaGalleryMode;
  private readonly bodies: Body[] = [];

  /** Legacy T27 ordering — unchanged so screenshot baselines still line up. */
  static readonly ORDER: NebulaKind[] = NEBULA_KINDS;

  /** T45 ordering — 14 subtypes in Doc 17 §5010..5080 order. */
  static readonly SUBTYPE_ORDER: NebulaSubtype[] = NEBULA_SUBTYPES;

  constructor(options: NebulaGalleryOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'NebulaGallery';
    this.mode = options.mode ?? 'subtypes';

    const size = options.size ?? 6;
    const gap = options.gap ?? 3;
    const rowGap = options.rowGap ?? gap;
    const rowZ = options.rowZ ?? -40;
    const cols = Math.max(1, options.cols ?? 7);

    const matOptsBase: NebulaMaterialOptions = {};
    if (options.stepsOverride !== undefined) matOptsBase.stepsOverride = options.stepsOverride;
    if (options.reflectionStarDir !== undefined) matOptsBase.starDirLocal = options.reflectionStarDir;
    if (options.pulsarIntensity !== undefined) matOptsBase.pulsarIntensity = options.pulsarIntensity;
    if (options.bipolarOverride !== undefined) matOptsBase.bipolarOverride = options.bipolarOverride;

    if (this.mode === 'catalog') {
      // P2C — Each entry placed at its ICRS (RA, Dec, distance_pc) using
      // the stellar-scale pc factor. Nebulae are physically large, but the
      // gallery cube size is decorative — we keep it at `size` so billboard
      // rendering stays reasonable. Downstream tile streamer will replace
      // this fixture with volumetric shells keyed on `diameter_pc`.
      const catalog = options.catalog ?? NEBULA_CATALOG;
      const scale = options.sceneScale ?? {};
      const unitsPerPc = scale.unitsPerPc ?? DEFAULT_SCENE_SCALE.unitsPerPc;
      const scaleCfg: SceneScaleConfig = { ...scale, unitsPerPc };
      for (const entry of catalog) {
        if (!Number.isFinite(entry.distance_pc) || entry.distance_pc <= 0) continue;
        const pos = icrsToSceneUnitsPc(
          entry.ra_deg,
          entry.dec_deg,
          entry.distance_pc,
          scaleCfg,
        );
        const { mesh, handle } = this.buildSlot(
          undefined,
          entry.subtype,
          size,
          pos.x,
          pos.y,
          pos.z,
          matOptsBase,
        );
        mesh.name = `Nebula:${entry.id}`;
        this.group.add(mesh);
        this.bodies.push({
          kind: handle.kind,
          subtype: entry.subtype,
          mesh,
          handle,
          catalogEntry: entry,
        });
      }
      // Catalog mode does NOT recentre — positions ARE the ICRS truth.
    } else if (this.mode === 'families') {
      // Single-row layout preserves the T27 screenshot baseline.
      let cursor = 0;
      for (const kind of NebulaGalleryRenderer.ORDER) {
        const x = cursor + size;
        const { mesh, handle } = this.buildSlot(kind, undefined, size, x, 0, rowZ, matOptsBase);
        cursor += size * 2 + gap;
        this.group.add(mesh);
        this.bodies.push({ kind, mesh, handle });
      }
      const bounds = new THREE.Box3().setFromObject(this.group);
      const centre = bounds.getCenter(new THREE.Vector3());
      this.group.position.x -= centre.x;
      this.group.position.y -= centre.y;
    } else {
      // 2×7 grid by default — lets all 14 fit in a normal landscape frame
      // without the row ballooning past the UI panels.
      const subtypes = NebulaGalleryRenderer.SUBTYPE_ORDER;
      const cellW = size * 2 + gap;
      const cellH = size * 2 + rowGap;
      subtypes.forEach((subtype, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = col * cellW + size;
        const y = -row * cellH + size; // top row centred above +Y
        const { mesh, handle } = this.buildSlot(undefined, subtype, size, x, y, rowZ, matOptsBase);
        this.group.add(mesh);
        this.bodies.push({ kind: handle.kind, subtype, mesh, handle });
      });
      const bounds = new THREE.Box3().setFromObject(this.group);
      const centre = bounds.getCenter(new THREE.Vector3());
      this.group.position.x -= centre.x;
      this.group.position.y -= centre.y;
    }
  }

  private buildSlot(
    kind: NebulaKind | undefined,
    subtype: NebulaSubtype | undefined,
    size: number,
    worldX: number,
    worldY: number,
    rowZ: number,
    matOptsBase: NebulaMaterialOptions,
  ): { mesh: THREE.Mesh; handle: NebulaMaterialHandle } {
    // The nebula fragment shaders raymarch the UNIT CUBE ([-1, 1]³ in local
    // space). We allocate a BoxGeometry(2, 2, 2) once (the `position`
    // attribute then matches the raymarch AABB) and scale each mesh to the
    // desired world size via `mesh.scale`. `worldToLocal` applied in
    // NebulaMaterial.update folds the scale into the local-space camera
    // position, so the shader never sees the world scale explicitly.
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const handle = subtype
      ? createNebulaMaterialForSubtype(subtype, matOptsBase)
      : createNebulaMaterial(kind as NebulaKind, matOptsBase);
    const mesh = new THREE.Mesh(geometry, handle.material);
    mesh.name = subtype ? `NebulaGallery:${subtype}` : `NebulaGallery:${handle.kind}`;
    mesh.scale.setScalar(size);
    mesh.position.set(worldX, worldY, rowZ);
    return { mesh, handle };
  }

  /**
   * Per-frame update — refresh `u_cameraLocal` + `u_time` for every
   * material. The caller passes the camera's world-space position; this
   * renderer transforms it into each mesh's local frame internally.
   */
  update(deltaSec: number, elapsedSec: number, cameraWorld: THREE.Vector3): void {
    for (const { kind, mesh, handle } of this.bodies) {
      mesh.updateWorldMatrix(true, false);
      handle.update(deltaSec, elapsedSec, cameraWorld, mesh.matrixWorld);
      // T52 — Doc 22 nebula toggles dim/desaturate via the universal patch.
      applyEntityToggles(handle.material, NEBULA_KIND_TO_ENT_ID[kind]);
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
  getHandles(): ReadonlyArray<NebulaMaterialHandle> {
    return this.bodies.map((b) => b.handle);
  }

  /** Test helper — returns the live meshes in declaration order. */
  getMeshes(): ReadonlyArray<THREE.Mesh> {
    return this.bodies.map((b) => b.mesh);
  }

  /** Test helper — catalog entries per body (undefined outside catalog mode). */
  getCatalogEntries(): ReadonlyArray<NebulaCatalogEntry | undefined> {
    return this.bodies.map((b) => b.catalogEntry);
  }

  /** Test helper — per-slot subtype (only when mode === 'subtypes'). */
  getSubtypes(): ReadonlyArray<NebulaSubtype | undefined> {
    return this.bodies.map((b) => b.subtype);
  }
}
