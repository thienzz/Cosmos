import * as THREE from 'three';

import { ALL_MOON_KINDS, type MoonKind } from '@/utils/moonPalette';

import { applyEntityToggles, MOON_KIND_TO_ENT_ID } from './applyEntityToggles';

import { createMoonMaterial, type MoonMaterialHandle } from './MoonMaterial';
import type { GpuLifecycleHook } from './SceneManager';

/**
 * T43 visual-verification gallery — renders all 15 Doc 17 moon subtypes on
 * a grid so TS-VQA can eyeball every shader family in one frame.
 *
 * Mirrors `PlanetGalleryRenderer`. Driven by `?demo=moons` through
 * {@link CosmosCanvas}.
 */

export interface MoonGalleryOptions {
  /** Explicit kind list (defaults to every subtype). */
  kinds?: readonly MoonKind[];
  /** Time-scale multiplier (default 20_000 so rotation reads in a second). */
  timeScale?: number;
  /** Equal radius used for every body (default 1.2). */
  equalRadius?: number;
  /** Grid column count (default 4 → 4 columns × 4 rows for 16 slots). */
  gridColumns?: number;
  /** Z offset of the grid from the camera. Default -20. */
  rowZ?: number;
  /** World-space sun direction. Default (0.6, 0.25, 0.75) normalised. */
  sunDirection?: THREE.Vector3;
}

interface Body {
  kind: MoonKind;
  mesh: THREE.Mesh;
  handle: MoonMaterialHandle;
}

export class MoonGalleryRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly bodies: Body[] = [];
  private readonly sunDirection: THREE.Vector3;
  private readonly timeScale: number;

  static readonly ALL_MOONS = ALL_MOON_KINDS;

  constructor(options: MoonGalleryOptions = {}) {
    this.timeScale = options.timeScale ?? 20_000;
    this.sunDirection =
      options.sunDirection?.clone().normalize() ??
      new THREE.Vector3(0.6, 0.25, 0.75).normalize();

    this.group = new THREE.Group();
    this.group.name = 'MoonGallery';

    const kinds = options.kinds ?? ALL_MOON_KINDS;
    const columns = options.gridColumns ?? 4;
    const radius = options.equalRadius ?? 1.2;
    const cell = radius * 2 + 0.8;
    const rowZ = options.rowZ ?? -20;

    kinds.forEach((kind, idx) => {
      const geometry = new THREE.SphereGeometry(radius, 64, 48);
      const handle = createMoonMaterial(kind, {
        sunDirection: this.sunDirection,
      });
      const mesh = new THREE.Mesh(geometry, handle.material);
      mesh.name = `MoonGallery:${kind}`;
      const col = idx % columns;
      const row = Math.floor(idx / columns);
      mesh.position.set(col * cell, -row * cell, rowZ);
      mesh.userData = { moonKind: kind, pickable: true };
      this.group.add(mesh);
      this.bodies.push({ kind, mesh, handle });
    });

    // Centre the whole grid so the camera can target (0,0,0).
    const bounds = new THREE.Box3().setFromObject(this.group);
    const centre = bounds.getCenter(new THREE.Vector3());
    this.group.position.x -= centre.x;
    this.group.position.y -= centre.y;
  }

  /** Advance shader time + per-body rotation. Called once per rAF tick. */
  update(deltaSec: number, elapsedSec: number): void {
    const scaledDelta = deltaSec * this.timeScale;
    const scaledElapsed = elapsedSec * this.timeScale;
    for (const { kind, mesh, handle } of this.bodies) {
      handle.update(scaledDelta, scaledElapsed, this.sunDirection);
      // T52 — route toggle state from Doc 22 into this moon's material.
      applyEntityToggles(handle.material, MOON_KIND_TO_ENT_ID[kind]);
      mesh.rotation.y += deltaSec * 0.15;
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

  /** Flat mesh list for tests / picking wiring. */
  getMeshes(): THREE.Mesh[] {
    return this.bodies.map((b) => b.mesh);
  }
}
