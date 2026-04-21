import * as THREE from 'three';

import { ringFragSource, ringVertSource } from '@/shaders';
import {
  SATURN_RING_GEOMETRY,
  SATURN_RING_PALETTE,
  type RingGeometry,
  type RingPalette,
} from '@/utils/planetPalette';

/**
 * Saturn ring-system material (Doc 18 §Saturn — Ring System).
 *
 * Drives a flat `THREE.RingGeometry` sized `outerA * planetRadius`. The shader
 * itself discards fragments outside the known bands (including the Cassini
 * Division) so the mesh can be a simple thin annulus without per-band
 * geometry.
 *
 * The factory accepts overrides so non-Saturn gas giants with faint rings
 * (Jupiter, Uranus, Neptune) can reuse this shader by supplying their own
 * radii + palette in future tasks.
 */

export interface RingMaterialOptions {
  /** Parent planet's world-space position. Updated each frame. */
  planetPositionWorld: THREE.Vector3;
  /** Parent planet's world-space radius (same unit system as geometry). */
  planetRadiusWorld: number;
  /** Initial world-space sun direction. Updated each frame. */
  sunDirection?: THREE.Vector3;
  /** Override ring geometry — defaults to Saturn. */
  geometry?: RingGeometry;
  /** Override ring palette — defaults to Saturn. */
  palette?: RingPalette;
  /** Global opacity scale (accessibility / reduced-visual-clutter). */
  opacityScale?: number;
}

type RingUniforms = {
  u_time: { value: number };
  u_sunDir: { value: THREE.Vector3 };
  u_planetPosW: { value: THREE.Vector3 };
  u_planetRadiusW: { value: number };
  u_innerC: { value: number };
  u_outerC: { value: number };
  u_innerB: { value: number };
  u_outerB: { value: number };
  u_innerA: { value: number };
  u_outerA: { value: number };
  u_enckeGapCenter: { value: number };
  u_enckeGapWidth: { value: number };
  u_colorC: { value: THREE.Color };
  u_colorB: { value: THREE.Color };
  u_colorA: { value: THREE.Color };
  u_opacityScale: { value: number };
};

export interface RingMaterialHandle {
  material: THREE.ShaderMaterial;
  update(
    deltaSec: number,
    elapsedSec: number,
    planetPosWorld: THREE.Vector3,
    sunDirWorld: THREE.Vector3,
  ): void;
  dispose(): void;
}

export function createRingMaterial(
  options: RingMaterialOptions,
): RingMaterialHandle {
  const geometry = options.geometry ?? SATURN_RING_GEOMETRY;
  const palette = options.palette ?? SATURN_RING_PALETTE;

  const uniforms: RingUniforms = {
    u_time: { value: 0 },
    u_sunDir: {
      value: options.sunDirection?.clone() ?? new THREE.Vector3(1, 0, 0),
    },
    u_planetPosW: { value: options.planetPositionWorld.clone() },
    u_planetRadiusW: { value: options.planetRadiusWorld },
    u_innerC: { value: geometry.innerC },
    u_outerC: { value: geometry.outerC },
    u_innerB: { value: geometry.innerB },
    u_outerB: { value: geometry.outerB },
    u_innerA: { value: geometry.innerA },
    u_outerA: { value: geometry.outerA },
    u_enckeGapCenter: { value: geometry.enckeGapCenter },
    u_enckeGapWidth: { value: geometry.enckeGapWidth },
    u_colorC: { value: new THREE.Color(palette.colorC) },
    u_colorB: { value: new THREE.Color(palette.colorB) },
    u_colorA: { value: new THREE.Color(palette.colorA) },
    u_opacityScale: { value: options.opacityScale ?? 1.0 },
  };

  const material = new THREE.ShaderMaterial({
    name: 'planet-rings:saturn',
    glslVersion: THREE.GLSL3,
    vertexShader: ringVertSource,
    fragmentShader: ringFragSource,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: uniforms as unknown as THREE.ShaderMaterial['uniforms'],
  });

  return {
    material,
    update(_deltaSec, elapsedSec, planetPosWorld, sunDirWorld) {
      uniforms.u_time.value = elapsedSec;
      uniforms.u_planetPosW.value.copy(planetPosWorld);
      uniforms.u_sunDir.value.copy(sunDirWorld);
    },
    dispose() {
      material.dispose();
    },
  };
}
