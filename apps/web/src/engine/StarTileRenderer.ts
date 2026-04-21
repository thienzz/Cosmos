import {
  decodeStarTileToBuffers,
  unpackColorIndex,
  unpackMagnitude,
  type StarTileBuffers,
} from '@cosmos/tile-decoder';
import * as THREE from 'three';

import type { TileAddress } from '@/stores/types';
import {
  bvToRgb,
  colorForSpectralCode,
  UNKNOWN_SPECTRAL_CODE,
  type RGB,
} from '@/utils/spectralColor';

import { createStarPointMaterial, type StarPointMaterialOptions } from './StarPointMaterial';

/**
 * Streaming star-tile renderer (T26, Doc 11 §4.1, Doc 27 §8).
 *
 * Owns one `THREE.Points` mesh per loaded tile plus a shared
 * `StarPointMaterial` (T07). `TileStreamingManager.onTileLoaded` hands us
 * a raw `ArrayBuffer`; we decode it with `decodeStarTileToBuffers`, wrap
 * the typed arrays in `THREE.BufferAttribute`s, and add the Points mesh
 * to the scene under `group`.
 *
 * ## Coordinate conversion
 *
 * Binary-tile record positions are relative to the tile's centre in
 * parsecs. The centre's scene position is `tileCentrePc ·
 * sceneUnitsPerPc`. We bake the scene-space absolute position into the
 * `position` attribute at upload time (one mat-mul, zero per-frame cost).
 *
 * `sceneUnitsPerPc` is a display-scale fudge — real 1:1 pc→km rendering
 * requires a broader camera/depth refactor (tracked outside T26).
 * Default `500` puts Sirius at ~1,318 scene units, well beyond the
 * T14 solar-system footprint (Neptune ≈ 360 units at orbitScale=12) but
 * still inside the controller's `maxDistance=1e5` box.
 *
 * ## Colour policy
 *
 * When `spectral_type ∈ [0,6]` (O..M) we use the Doc 18 reference palette
 * (`colorForSpectralCode`). For stars with `UNKNOWN_SPECTRAL_CODE` we
 * fall back to a Ballesteros B-V→T→RGB blackbody path from the packed
 * `color_index`. This keeps the default render faithful to the Doc 18
 * reference colours (ΔE < 3 target) while still rendering unclassified
 * Gaia sources sensibly.
 *
 * ## Lifecycle / context loss
 *
 * Raw ArrayBuffers are retained per tile so `rebuildAfterContextRestore`
 * can re-upload the entire geometry without a round-trip to the disk
 * cache or the network (Doc 27 §15.2).
 */

export const DEFAULT_SCENE_UNITS_PER_PC = 500;

export interface StarTileRendererOptions extends StarPointMaterialOptions {
  /** Parsec-to-scene-units conversion. See class doc for rationale. */
  sceneUnitsPerPc?: number;
  /** Scene group name, useful when walking the tree in dev tools. */
  groupName?: string;
}

interface TileEntry {
  mesh: THREE.Points;
  geometry: THREE.BufferGeometry;
  starCount: number;
  sizeBytes: number;
  /** Retained raw ArrayBuffer for context-loss restore (Doc 27 §15.2). */
  rawBuffer: ArrayBuffer;
  tileCentrePc: { x: number; y: number; z: number };
}

export interface TileCentrePc {
  x: number;
  y: number;
  z: number;
}

export class StarTileRenderer {
  readonly group: THREE.Group;
  readonly material: THREE.ShaderMaterial;

  private readonly sceneUnitsPerPc: number;
  private readonly tiles = new Map<TileAddress, TileEntry>();
  private totalStarCount = 0;

  constructor(options: StarTileRendererOptions = {}) {
    this.sceneUnitsPerPc = options.sceneUnitsPerPc ?? DEFAULT_SCENE_UNITS_PER_PC;
    this.material = createStarPointMaterial(options);
    this.group = new THREE.Group();
    this.group.name = options.groupName ?? 'star-tile-field';
  }

  /** Total rendered stars across every mounted tile. */
  getStarCount(): number {
    return this.totalStarCount;
  }

  /** Number of currently-mounted tiles (one mesh each). */
  getTileCount(): number {
    return this.tiles.size;
  }

  /** Quick-look the set of mounted tile addresses. */
  getMountedAddresses(): TileAddress[] {
    return [...this.tiles.keys()];
  }

  /**
   * Decode + mount a tile. No-op if the address is already mounted. Silently
   * swallows decode errors via the returned boolean — the streaming manager
   * handles its own error reporting.
   */
  addTile(address: TileAddress, buffer: ArrayBuffer, centrePc: TileCentrePc): boolean {
    if (this.tiles.has(address)) return false;
    let decoded: StarTileBuffers;
    try {
      decoded = decodeStarTileToBuffers(buffer);
    } catch {
      return false;
    }
    const geometry = this.buildGeometry(decoded, centrePc);
    const mesh = new THREE.Points(geometry, this.material);
    mesh.name = `star-tile:${address}`;
    // Frustum-cull per-tile so tiles completely off-screen skip the draw
    // call. BufferGeometry.boundingSphere is already computed inside
    // buildGeometry.
    mesh.frustumCulled = true;
    this.group.add(mesh);
    this.tiles.set(address, {
      mesh,
      geometry,
      starCount: decoded.header.star_count,
      sizeBytes: buffer.byteLength,
      rawBuffer: buffer,
      tileCentrePc: centrePc,
    });
    this.totalStarCount += decoded.header.star_count;
    return true;
  }

  /** Remove + dispose a mounted tile. */
  removeTile(address: TileAddress): boolean {
    const entry = this.tiles.get(address);
    if (!entry) return false;
    this.group.remove(entry.mesh);
    entry.geometry.dispose();
    this.tiles.delete(address);
    this.totalStarCount -= entry.starCount;
    return true;
  }

  /** Drop all mounted tiles + their GPU resources. */
  clear(): void {
    for (const entry of this.tiles.values()) {
      this.group.remove(entry.mesh);
      entry.geometry.dispose();
    }
    this.tiles.clear();
    this.totalStarCount = 0;
  }

  /** Advance the material's time uniform (twinkle). */
  update(elapsedSeconds: number): void {
    const uniform = this.material.uniforms.u_time;
    if (uniform) uniform.value = elapsedSeconds;
  }

  /**
   * P3 — mark mounted-tile visibility based on a frustum. Tiles whose
   * bounding sphere is outside the frustum are hidden this frame; keeping
   * the mesh mounted in the group (not disposed) means the next frame can
   * flip visibility cheaply when the camera pans back.
   *
   * `radiusScene` is the tile's half-extent in scene units (tile bounds
   * typically span ~1 pc → 500 scene units at default scale). Pass a
   * generous bound so small-star clusters near the edge of a tile are not
   * culled by the centre-only check.
   */
  applyFrustumCulling(frustum: THREE.Frustum, radiusScene: number): {
    visible: number;
    hidden: number;
  } {
    // Note: the tile's absolute scene position is `tileCentrePc * unitsPerPc`
    // — the per-star positions are pre-offset to include that at upload
    // time, so `mesh.position` stays at origin. We recompute the centre
    // here so the frustum check targets the actual tile location.
    const sphere = new THREE.Sphere(new THREE.Vector3(), radiusScene);
    let visible = 0;
    let hidden = 0;
    for (const entry of this.tiles.values()) {
      sphere.center.set(
        entry.tileCentrePc.x * this.sceneUnitsPerPc,
        entry.tileCentrePc.y * this.sceneUnitsPerPc,
        entry.tileCentrePc.z * this.sceneUnitsPerPc,
      );
      if (frustum.intersectsSphere(sphere)) {
        entry.mesh.visible = true;
        visible++;
      } else {
        entry.mesh.visible = false;
        hidden++;
      }
    }
    return { visible, hidden };
  }

  /** GpuLifecycleHook — re-upload every tile's geometry after context loss. */
  rebuildAfterContextRestore(): void {
    const snapshot = [...this.tiles.entries()];
    for (const [address, entry] of snapshot) {
      this.removeTile(address);
      this.addTile(address, entry.rawBuffer, entry.tileCentrePc);
    }
    this.material.needsUpdate = true;
  }

  dispose(): void {
    this.clear();
    this.material.dispose();
  }

  // -- private -------------------------------------------------------------

  private buildGeometry(
    buffers: StarTileBuffers,
    centrePc: TileCentrePc,
  ): THREE.BufferGeometry {
    const { positions, magnitudes, colorIndices, spectralTypes, header } = buffers;
    const count = header.star_count;
    const scale = this.sceneUnitsPerPc;

    const absolute = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const magAttr = new Float32Array(count);
    const phases = new Float32Array(count);

    // Track bounding sphere centre + extent for culling.
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    // ICRS-ecliptic +Z is up; Three.js +Y is up. Apply the `(X,Y,Z) →
    // (X, Z, −Y)` permutation documented in SESSION_NOTES so star
    // positions match the solar-system renderer's frame.
    for (let i = 0; i < count; i++) {
      const xPc = positions[i * 3 + 0]! + centrePc.x;
      const yPc = positions[i * 3 + 1]! + centrePc.y;
      const zPc = positions[i * 3 + 2]! + centrePc.z;

      const sceneX = xPc * scale;
      const sceneY = zPc * scale; // ICRS Z → scene Y
      const sceneZ = -yPc * scale; // ICRS Y → scene −Z

      absolute[i * 3 + 0] = sceneX;
      absolute[i * 3 + 1] = sceneY;
      absolute[i * 3 + 2] = sceneZ;

      if (sceneX < minX) minX = sceneX;
      if (sceneY < minY) minY = sceneY;
      if (sceneZ < minZ) minZ = sceneZ;
      if (sceneX > maxX) maxX = sceneX;
      if (sceneY > maxY) maxY = sceneY;
      if (sceneZ > maxZ) maxZ = sceneZ;

      const specCode = spectralTypes[i]!;
      const rgb = this.colourFor(specCode, colorIndices[i]!);
      colors[i * 3 + 0] = rgb.r;
      colors[i * 3 + 1] = rgb.g;
      colors[i * 3 + 2] = rgb.b;

      magAttr[i] = unpackMagnitude(magnitudes[i]!);
      // Deterministic phase: fract(i * φ) keeps twinkles visually
      // decorrelated between neighbours without needing a PRNG on the
      // render path. φ = (√5 − 1)/2 ≈ 0.618.
      phases[i] = (i * 0.6180339887) % 1 * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(absolute, 3));
    geometry.setAttribute('a_color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('a_magnitude', new THREE.BufferAttribute(magAttr, 1));
    geometry.setAttribute('a_twinklePhase', new THREE.BufferAttribute(phases, 1));

    if (count === 0) {
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0);
    } else {
      const cx = (minX + maxX) * 0.5;
      const cy = (minY + maxY) * 0.5;
      const cz = (minZ + maxZ) * 0.5;
      let maxRSq = 0;
      for (let i = 0; i < count; i++) {
        const dx = absolute[i * 3 + 0]! - cx;
        const dy = absolute[i * 3 + 1]! - cy;
        const dz = absolute[i * 3 + 2]! - cz;
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

    return geometry;
  }

  private colourFor(spectralCode: number, colorIndexByte: number): RGB {
    if (spectralCode === UNKNOWN_SPECTRAL_CODE) {
      // Fall back to a blackbody colour from the packed BP-RP.
      return bvToRgb(unpackColorIndex(colorIndexByte));
    }
    return colorForSpectralCode(spectralCode);
  }
}
