import * as THREE from 'three';

import type { StarSeed } from '@/data/starSeed';

import { createStarPointMaterial, type StarPointMaterialOptions } from './StarPointMaterial';

/**
 * Streaming-ready star renderer (Doc 10 §3, Doc 12 §3.1, Doc 27 §15.2).
 *
 * Architecture notes:
 * - Uses `THREE.Points` + `THREE.BufferGeometry`. This is semantically one
 *   draw call with per-star attributes, satisfying TS-RENDER-009
 *   (`renderer.info.render.calls < 500`). `InstancedBufferGeometry` with a
 *   billboarded quad is the T26 upgrade path if point-size caps bite on
 *   large (500K+) fields — irrelevant at 5K.
 * - CPU-side seed retained so we can rebuild GPU buffers after a WebGL
 *   context-loss event (Doc 27 §15.2).
 * - A user-visible bounding sphere lets Three.js cull the whole field when
 *   it's off-camera — cheap and correct for a static starfield.
 */

export interface StarFieldRendererOptions extends StarPointMaterialOptions {
  /** Optional label written on the Points mesh for debugging. */
  name?: string;
}

export class StarFieldRenderer {
  readonly points: THREE.Points;
  readonly material: THREE.ShaderMaterial;

  private geometry: THREE.BufferGeometry;
  private seed: readonly StarSeed[] = [];

  constructor(options: StarFieldRendererOptions = {}) {
    this.material = createStarPointMaterial(options);
    this.geometry = new THREE.BufferGeometry();
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = options.name ?? 'star-field';
    this.points.frustumCulled = true;
  }

  /** Upload a new seed to the GPU. Replaces any previous data. */
  setSeed(seed: readonly StarSeed[]): void {
    this.seed = seed;
    this.rebuildGeometry();
  }

  /** CPU-side seed in use — callers use this to reason about state. */
  getSeed(): readonly StarSeed[] {
    return this.seed;
  }

  /** Update the time uniform; no-op when the renderer is empty. */
  update(elapsedSeconds: number): void {
    if (this.material.uniforms.u_time) this.material.uniforms.u_time.value = elapsedSeconds;
  }

  /**
   * Rebuild GPU resources from the retained seed. Called after
   * `webglcontextrestored` — Three.js handles shader recompilation
   * automatically, but BufferGeometry attributes need a fresh upload.
   */
  rebuildAfterContextRestore(): void {
    if (this.seed.length === 0) return;
    // Nudge every attribute so Three.js re-uploads it on next render.
    for (const key of ['position', 'a_color', 'a_magnitude', 'a_twinklePhase']) {
      const attr = this.geometry.getAttribute(key) as THREE.BufferAttribute | undefined;
      if (attr) attr.needsUpdate = true;
    }
    this.material.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }

  // -- private -------------------------------------------------------------

  private rebuildGeometry(): void {
    this.geometry.dispose();
    const geometry = new THREE.BufferGeometry();

    const count = this.seed.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const magnitudes = new Float32Array(count);
    const phases = new Float32Array(count);

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < count; i++) {
      const star = this.seed[i];
      if (!star) continue;
      positions[i * 3 + 0] = star.position.x;
      positions[i * 3 + 1] = star.position.y;
      positions[i * 3 + 2] = star.position.z;
      colors[i * 3 + 0] = star.color.r;
      colors[i * 3 + 1] = star.color.g;
      colors[i * 3 + 2] = star.color.b;
      magnitudes[i] = star.magnitude;
      phases[i] = star.twinklePhase;

      if (star.position.x < minX) minX = star.position.x;
      if (star.position.y < minY) minY = star.position.y;
      if (star.position.z < minZ) minZ = star.position.z;
      if (star.position.x > maxX) maxX = star.position.x;
      if (star.position.y > maxY) maxY = star.position.y;
      if (star.position.z > maxZ) maxZ = star.position.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('a_color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('a_magnitude', new THREE.BufferAttribute(magnitudes, 1));
    geometry.setAttribute('a_twinklePhase', new THREE.BufferAttribute(phases, 1));

    if (count === 0) {
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0);
    } else {
      const cx = (minX + maxX) * 0.5;
      const cy = (minY + maxY) * 0.5;
      const cz = (minZ + maxZ) * 0.5;
      // Radius = farthest actual point from the AABB centre. Using half of
      // max extent underestimates whenever the cloud is not axis-aligned
      // with its AABB — e.g., stars clustered along a diagonal.
      let maxRSq = 0;
      for (let i = 0; i < count; i++) {
        const dx = positions[i * 3 + 0]! - cx;
        const dy = positions[i * 3 + 1]! - cy;
        const dz = positions[i * 3 + 2]! - cz;
        const rSq = dx * dx + dy * dy + dz * dz;
        if (rSq > maxRSq) maxRSq = rSq;
      }
      geometry.boundingSphere = new THREE.Sphere(
        new THREE.Vector3(cx, cy, cz),
        Math.sqrt(maxRSq),
      );
      geometry.boundingBox = new THREE.Box3(
        new THREE.Vector3(minX, minY, minZ),
        new THREE.Vector3(maxX, maxY, maxZ),
      );
    }

    this.points.geometry = geometry;
    this.geometry = geometry;
  }
}
