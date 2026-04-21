import * as THREE from 'three';

import {
  ALL_PLANET_KINDS,
  EXTREME_PARAMS,
  GAS_PARAMS,
  ROCKY_PARAMS,
  SATURN_RING_GEOMETRY,
  isExtremePlanet,
  isGasGiant,
  isRockyPlanet,
  type PlanetKind,
} from '@/utils/planetPalette';

import { applyEntityToggles, PLANET_KIND_TO_ENT_ID } from './applyEntityToggles';
import {
  createPlanetMaterial,
  type PlanetMaterialHandle,
} from './PlanetMaterial';
import { createRingMaterial, type RingMaterialHandle } from './RingMaterial';
import type { GpuLifecycleHook } from './SceneManager';

/**
 * Planet gallery — the T13/T42 visual verification fixture.
 *
 * Two modes:
 *
 *   default (T13)   — 8 solar-system planets in a row with Saturn's rings.
 *   T42 "all 27"    — every Doc 17 planet subtype on a grid (5 cols × 6 rows)
 *                     so preview / TS-VQA-002 can eyeball-verify every shader.
 *                     Enable by passing `kinds: ALL_PLANET_KINDS` or
 *                     `mode: 'all27'`.
 *
 * This is NOT the production solar-system renderer — that lands in T14 with
 * live ephemeris positions. The gallery is a static, scale-exaggerated
 * arrangement whose only purpose is "does each shader look right?".
 */

export type PlanetGalleryMode = 'solar' | 'all27';

export interface PlanetGalleryOptions {
  /** Explicit body list. Overrides `mode`. */
  kinds?: readonly PlanetKind[];
  /** Preset layout: 'solar' = 8 solar planets (default); 'all27' = full taxonomy. */
  mode?: PlanetGalleryMode;
  /** Time-scale multiplier — 1 = real-time rotation, 20_000 = gallery default. */
  timeScale?: number;
  /** Equal radii for side-by-side comparison. Default `true`. */
  equalSize?: boolean;
  /** Z offset of the row / grid from the camera. Default -20. */
  rowZ?: number;
  /** World-space sun direction (normalised). Default +X. */
  sunDirection?: THREE.Vector3;
  /** Constant radius used when `equalSize` is true. Default 1.2. */
  equalRadius?: number;
  /** Grid column count for `all27` (default 6 → 5 rows of 6 = 30 slots). */
  gridColumns?: number;
}

interface Body {
  kind: PlanetKind;
  mesh: THREE.Mesh;
  handle: PlanetMaterialHandle;
}

const SOLAR_ORDER: PlanetKind[] = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
];

export class PlanetGalleryRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly bodies: Body[] = [];
  private ringHandle: RingMaterialHandle | null = null;
  private ringMesh: THREE.Mesh | null = null;
  private readonly timeScale: number;
  private readonly sunDirection: THREE.Vector3;
  private readonly equalSize: boolean;
  private readonly equalRadius: number;

  static readonly ORDER = SOLAR_ORDER;
  static readonly ALL27 = ALL_PLANET_KINDS;

  constructor(options: PlanetGalleryOptions = {}) {
    this.timeScale = options.timeScale ?? 20_000;
    this.equalSize = options.equalSize ?? true;
    this.equalRadius = options.equalRadius ?? 1.2;
    this.sunDirection =
      options.sunDirection?.clone().normalize() ??
      new THREE.Vector3(1, 0, 0);

    this.group = new THREE.Group();
    this.group.name = 'PlanetGallery';

    const kinds =
      options.kinds ??
      (options.mode === 'all27' ? ALL_PLANET_KINDS : SOLAR_ORDER);

    const rowZ = options.rowZ ?? -20;

    if (options.mode === 'all27' || (options.kinds && options.kinds.length > 10)) {
      this.buildGrid(kinds, options.gridColumns ?? 6, rowZ);
    } else {
      this.buildRow(kinds, rowZ);
    }

    // Saturn ring disc, centred on the Saturn mesh if present.
    const saturnBody = this.bodies.find((b) => b.kind === 'saturn');
    if (saturnBody) {
      this.attachSaturnRings(saturnBody);
    }

    // Centre the whole group in X.
    const bounds = new THREE.Box3().setFromObject(this.group);
    const centre = bounds.getCenter(new THREE.Vector3());
    this.group.position.x -= centre.x;
    if (options.mode === 'all27') {
      this.group.position.y -= centre.y;
    }
  }

  private buildRow(kinds: readonly PlanetKind[], rowZ: number): void {
    let cursor = 0;
    const gap = 0.5;
    for (const kind of kinds) {
      const radius = this.equalSize ? this.equalRadius : visualRadiusFor(kind);
      const geometry = new THREE.SphereGeometry(radius, 64, 48);
      const handle = createPlanetMaterial(kind, {
        sunDirection: this.sunDirection,
      });
      const mesh = new THREE.Mesh(geometry, handle.material);
      mesh.name = `PlanetGallery:${kind}`;
      cursor += radius;
      mesh.position.set(cursor, 0, rowZ);
      cursor += radius + gap;
      this.group.add(mesh);
      this.bodies.push({ kind, mesh, handle });
    }
  }

  private buildGrid(
    kinds: readonly PlanetKind[],
    columns: number,
    rowZ: number,
  ): void {
    const radius = this.equalRadius;
    const cell = radius * 2 + 0.8;
    kinds.forEach((kind, idx) => {
      const geometry = new THREE.SphereGeometry(radius, 64, 48);
      const handle = createPlanetMaterial(kind, {
        sunDirection: this.sunDirection,
      });
      const mesh = new THREE.Mesh(geometry, handle.material);
      mesh.name = `PlanetGallery:${kind}`;
      const col = idx % columns;
      const row = Math.floor(idx / columns);
      mesh.position.set(col * cell, -row * cell, rowZ);
      this.group.add(mesh);
      this.bodies.push({ kind, mesh, handle });
    });
  }

  private attachSaturnRings(saturnBody: Body): void {
    const saturnRadius = (saturnBody.mesh.geometry as THREE.SphereGeometry).parameters.radius;
    const inner = SATURN_RING_GEOMETRY.innerC * saturnRadius;
    const outer = SATURN_RING_GEOMETRY.outerA * saturnRadius * 1.02;
    const ringGeo = new THREE.RingGeometry(inner, outer, 192, 1);
    this.ringHandle = createRingMaterial({
      planetPositionWorld: saturnBody.mesh.getWorldPosition(new THREE.Vector3()),
      planetRadiusWorld: saturnRadius,
      sunDirection: this.sunDirection,
    });
    const ringMesh = new THREE.Mesh(ringGeo, this.ringHandle.material);
    ringMesh.name = 'PlanetGallery:saturn-rings';
    ringMesh.rotation.x = -Math.PI / 2;
    saturnBody.mesh.add(ringMesh);
    this.ringMesh = ringMesh;
  }

  /** Advance shader time + per-body rotation. Called once per rAF tick. */
  update(deltaSec: number, elapsedSec: number): void {
    const scaledDelta = deltaSec * this.timeScale;
    const scaledElapsed = elapsedSec * this.timeScale;
    for (const { kind, mesh, handle } of this.bodies) {
      handle.update(scaledDelta, scaledElapsed, this.sunDirection);
      // T52 hot-path: copy Doc 22 toggle values for this body's ENT-ID into
      // any matching u_<name> uniform on the material (Doc 27 §6.4).
      // Toggles without a matching shader uniform are no-ops.
      applyEntityToggles(handle.material, PLANET_KIND_TO_ENT_ID[kind]);
      mesh.rotation.y += deltaSec * 0.1;
    }
    if (this.ringHandle) {
      const saturn = this.bodies.find((b) => b.kind === 'saturn');
      const pos = saturn?.mesh.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3();
      this.ringHandle.update(scaledDelta, scaledElapsed, pos, this.sunDirection);
    }
  }

  rebuildAfterContextRestore(): void {
    for (const body of this.bodies) {
      body.handle.material.needsUpdate = true;
      (body.mesh.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
    }
    if (this.ringHandle) this.ringHandle.material.needsUpdate = true;
  }

  dispose(): void {
    for (const body of this.bodies) {
      body.mesh.geometry.dispose();
      body.handle.dispose();
      this.group.remove(body.mesh);
    }
    this.bodies.length = 0;
    if (this.ringMesh) {
      this.ringMesh.geometry.dispose();
      this.ringMesh.parent?.remove(this.ringMesh);
    }
    this.ringHandle?.dispose();
    this.ringHandle = null;
    this.ringMesh = null;
  }
}

function visualRadiusFor(kind: PlanetKind): number {
  if (isRockyPlanet(kind)) return ROCKY_PARAMS[kind].radius;
  if (isGasGiant(kind)) return GAS_PARAMS[kind].radius;
  if (isExtremePlanet(kind)) return EXTREME_PARAMS[kind].radius;
  return 1;
}
