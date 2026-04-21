import * as THREE from 'three';

import type { GalaxyKind } from '@/utils/galaxyPalette';

import {
  createGalaxyMaterial,
  type GalaxyMaterialHandle,
  type GalaxyMaterialOptions,
} from './GalaxyMaterial';

/**
 * T29 — LOD orchestrator for a single galaxy entity.
 *
 * Doc 18 §LOD System for Galaxies:
 *   LOD0 (close):  resolved volumetric cube (raymarched GalaxyMaterial).
 *   LOD1-2 (mid):  disk billboard (camera-facing quad, same palette).
 *   LOD3-4 (far):  single bright point sprite (spectral-tinted blob).
 *
 * We collapse the 5-level Doc 18 schema into 3 render tiers because (a) the
 * difference between LOD3 and LOD4 is indistinguishable at the distances
 * involved, and (b) three tiers covers the TS-VQA-005 SSIM comparison
 * without inflating the per-galaxy draw-call budget.
 *
 * Each entity owns a THREE.Group containing all three tier meshes; only
 * one is ever `visible`. `setCameraDistance(d)` picks the active tier via
 * the configured breakpoints (hysteresis: ±10% so wheel-zoom doesn't
 * flicker at the boundary).
 */

export type GalaxyLodTier = 'volumetric' | 'billboard' | 'point';

export interface GalaxyLodBreakpoints {
  /** Distance (local units) below which we render the volumetric cube. */
  volumetricMax: number;
  /** Distance above which we collapse to a single point. */
  pointMin: number;
  /** Hysteresis fraction (0..1) applied to both boundaries. */
  hysteresis: number;
}

export const DEFAULT_GALAXY_LOD_BREAKPOINTS: GalaxyLodBreakpoints = {
  volumetricMax: 60,
  pointMin: 200,
  hysteresis: 0.1,
};

export interface GalaxyLodOptions {
  kind: GalaxyKind;
  /** World-space size (half-extent) of the galaxy. Drives cube + billboard. */
  size: number;
  /** Tint applied to billboard + point tiers. Defaults to the palette's
   *  bulge / core colour (set by the caller — this helper doesn't parse
   *  palette hex). Accepts a CSS colour string or THREE.Color. */
  tint: THREE.ColorRepresentation;
  /** Galaxy-material options forwarded to the volumetric tier. */
  materialOptions?: GalaxyMaterialOptions;
  /** Non-default LOD breakpoints. */
  breakpoints?: Partial<GalaxyLodBreakpoints>;
}

export class GalaxyLod {
  readonly group: THREE.Group;
  readonly kind: GalaxyKind;
  readonly size: number;

  readonly volumetricMesh: THREE.Mesh;
  readonly billboardMesh: THREE.Mesh;
  readonly pointMesh: THREE.Points;

  readonly materialHandle: GalaxyMaterialHandle;

  private readonly breakpoints: GalaxyLodBreakpoints;
  private currentTier: GalaxyLodTier = 'volumetric';

  constructor(options: GalaxyLodOptions) {
    this.kind = options.kind;
    this.size = options.size;
    this.breakpoints = { ...DEFAULT_GALAXY_LOD_BREAKPOINTS, ...(options.breakpoints ?? {}) };
    this.group = new THREE.Group();
    this.group.name = `GalaxyLod:${this.kind}`;

    // --- Volumetric tier (LOD0) ---
    this.materialHandle = createGalaxyMaterial(options.kind, options.materialOptions ?? {});
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    this.volumetricMesh = new THREE.Mesh(cubeGeometry, this.materialHandle.material);
    this.volumetricMesh.name = `GalaxyLod:${this.kind}:volumetric`;
    this.volumetricMesh.scale.setScalar(this.size);
    this.group.add(this.volumetricMesh);

    // --- Billboard tier (LOD1-2) ---
    // Camera-facing quad. We use a circular alpha gradient on the palette
    // tint — cheap, reads as a disk at any angle, no overdraw spike.
    const billboardMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        u_tint: { value: new THREE.Color(options.tint) },
        u_logDepthBufFC: { value: 0 },
      },
      vertexShader: BILLBOARD_VERT,
      fragmentShader: BILLBOARD_FRAG,
    });
    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    this.billboardMesh = new THREE.Mesh(quadGeometry, billboardMat);
    this.billboardMesh.name = `GalaxyLod:${this.kind}:billboard`;
    this.billboardMesh.scale.setScalar(this.size);
    this.billboardMesh.visible = false;
    this.group.add(this.billboardMesh);

    // --- Point tier (LOD3-4) ---
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3),
    );
    const pointMat = new THREE.PointsMaterial({
      color: new THREE.Color(options.tint),
      size: Math.max(2, this.size * 0.05),
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.pointMesh = new THREE.Points(pointGeometry, pointMat);
    this.pointMesh.name = `GalaxyLod:${this.kind}:point`;
    this.pointMesh.visible = false;
    this.group.add(this.pointMesh);
  }

  /**
   * Update the active LOD tier based on the camera's distance from this
   * galaxy's centre. Uses hysteresis to avoid flicker near the boundary.
   */
  setCameraDistance(distance: number): GalaxyLodTier {
    const bp = this.breakpoints;
    const h = bp.hysteresis;
    let next: GalaxyLodTier = this.currentTier;
    // Hysteresis: widen the current tier's range by `h * thresh` in the
    // direction that would hold it; transitions only fire once the distance
    // crosses the opposite side.
    if (this.currentTier === 'volumetric') {
      if (distance > bp.volumetricMax * (1 + h)) next = 'billboard';
    } else if (this.currentTier === 'billboard') {
      if (distance < bp.volumetricMax * (1 - h)) next = 'volumetric';
      else if (distance > bp.pointMin * (1 + h)) next = 'point';
    } else {
      if (distance < bp.pointMin * (1 - h)) next = 'billboard';
    }
    if (next !== this.currentTier) {
      this.volumetricMesh.visible = next === 'volumetric';
      this.billboardMesh.visible = next === 'billboard';
      this.pointMesh.visible = next === 'point';
      this.currentTier = next;
    }
    return this.currentTier;
  }

  getCurrentTier(): GalaxyLodTier {
    return this.currentTier;
  }

  /** Forward to the GalaxyMaterial handle's per-frame update. */
  update(
    deltaSec: number,
    elapsedSec: number,
    cameraWorld: THREE.Vector3,
  ): void {
    if (this.currentTier !== 'volumetric') return;
    this.volumetricMesh.updateWorldMatrix(true, false);
    this.materialHandle.update(deltaSec, elapsedSec, cameraWorld, this.volumetricMesh.matrixWorld);
  }

  dispose(): void {
    this.volumetricMesh.geometry.dispose();
    this.materialHandle.dispose();
    this.billboardMesh.geometry.dispose();
    (this.billboardMesh.material as THREE.Material).dispose();
    this.pointMesh.geometry.dispose();
    (this.pointMesh.material as THREE.Material).dispose();
  }
}

// ---------------------------------------------------------------------------
// Billboard shaders — camera-facing quad with a radial gradient on the tint.
// ---------------------------------------------------------------------------

const BILLBOARD_VERT = /* glsl */ `
varying vec2 v_uv;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  varying float v_fragDepth;
#endif
void main() {
  v_uv = uv;
  // Camera-facing: extract the camera basis from the view matrix and
  // reconstruct the quad so it always faces the camera.
  vec3 right = vec3(viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x);
  vec3 up    = vec3(viewMatrix[0].y, viewMatrix[1].y, viewMatrix[2].y);
  vec3 localOffset = right * position.x + up * position.y;
  // modelMatrix position + camera-facing local offset scaled by the mesh's
  // scale.x (uniform scale is assumed for galaxy billboards).
  vec3 worldOffset = localOffset * length(vec3(modelMatrix[0].x, modelMatrix[0].y, modelMatrix[0].z));
  vec4 worldPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  worldPos.xyz += worldOffset;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    v_fragDepth = 1.0 + gl_Position.w;
  #endif
}
`;

const BILLBOARD_FRAG = /* glsl */ `
precision highp float;
varying vec2 v_uv;
uniform vec3 u_tint;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  varying float v_fragDepth;
#endif
void main() {
  vec2 uv = v_uv * 2.0 - 1.0;
  float r = length(uv);
  if (r > 1.0) discard;
  // Radial gradient: 1 at centre, 0 at rim.
  float falloff = exp(-r * r * 2.4);
  gl_FragColor = vec4(u_tint * falloff, falloff);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(v_fragDepth) * logDepthBufFC * 0.5;
  #endif
}
`;
