import * as THREE from 'three';

import { postFullscreenVertSource, postLensingFragSource } from '@/shaders';
import {
  BLACK_HOLE_LENSING_DEFAULT,
  type BlackHoleLensingParams,
} from '@/utils/postProcessingParams';

import type { GpuLifecycleHook } from './gpuLifecycle';

/**
 * T30 — Full-screen Schwarzschild gravitational-lensing pass.
 *
 * Doc 18 §Black Hole / §Gravitational Lensing Shader describes a warped
 * sampling of the background starfield around each black hole. T28 faked
 * the visible "photon ring" with an emissive gaussian band inside the
 * per-BH raymarch; T30 now actually bends the scene around the BH via a
 * fullscreen quad pass that runs BEFORE bloom (so the bent stars carry
 * their emissive tail into the bloom pyramid).
 *
 * Per-BH input: world-space position + horizon radius (in scene units)
 * + optional Einstein scale factor. Each frame we project those into
 * screen-space UVs via the currently-bound camera, compute the apparent
 * (angular) radius, and upload the packed array to the shader.
 *
 * Four BH slots by default — Doc 17 lists ENT-8020 through ENT-8022
 * black-hole variants; four concurrent lensers covers any realistic view
 * (even at Sgr A* + M87 co-visibility). Enlarge
 * `POST_LENSING_MAX_BLACKHOLES` if needed — it's a compile-time define.
 */

const DEFAULT_MAX_BLACK_HOLES = 4;

export interface BlackHoleLensingHandle {
  /** Opaque id used to remove the lenser again. */
  id: number;
  /**
   * World-space position. The host should update this each frame if the BH
   * moves (e.g. a binary system) before calling {@link render}.
   */
  position: THREE.Vector3;
  /** Schwarzschild radius in scene units. */
  schwarzschildRadius: number;
  /** Einstein-ring scale factor (1.5 = photon sphere, Doc 18 §Black Hole). */
  einsteinScale: number;
}

export interface BlackHoleLensingPassOptions {
  /** Initial viewport size. */
  width: number;
  height: number;
  /** Max concurrent BHs that the shader can lens per frame. Default 4. */
  maxBlackHoles?: number;
  /** Override default deflection / falloff params. */
  params?: Partial<BlackHoleLensingParams>;
}

export class BlackHoleLensingPass implements GpuLifecycleHook {
  private width: number;
  private height: number;
  private readonly maxBlackHoles: number;
  private readonly params: BlackHoleLensingParams;

  private readonly holes = new Map<number, BlackHoleLensingHandle>();
  private nextId = 1;

  private readonly fsScene: THREE.Scene;
  private readonly fsCamera: THREE.OrthographicCamera;
  private readonly fsTriangle: THREE.Mesh;
  private material!: THREE.ShaderMaterial;

  private readonly packedUniform: THREE.Vector4[]; // reused Vector4 array for ShaderMaterial

  private disposed = false;

  constructor(opts: BlackHoleLensingPassOptions) {
    this.width = Math.max(1, opts.width);
    this.height = Math.max(1, opts.height);
    this.maxBlackHoles = Math.max(1, opts.maxBlackHoles ?? DEFAULT_MAX_BLACK_HOLES);
    this.params = { ...BLACK_HOLE_LENSING_DEFAULT, ...(opts.params ?? {}) };

    this.packedUniform = Array.from({ length: this.maxBlackHoles }, () => new THREE.Vector4(0, 0, 0, 1.5));

    this.fsScene = new THREE.Scene();
    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    geom.setDrawRange(0, 3);
    this.fsTriangle = new THREE.Mesh(geom);
    this.fsTriangle.frustumCulled = false;
    this.fsScene.add(this.fsTriangle);

    this.buildMaterial();
  }

  // -- Public API ----------------------------------------------------------

  /** Register a black hole for lensing. Returns a mutable handle the host
   *  can use to reposition or unregister it. */
  addBlackHole(params: {
    position: THREE.Vector3;
    schwarzschildRadius: number;
    einsteinScale?: number;
  }): BlackHoleLensingHandle {
    const handle: BlackHoleLensingHandle = {
      id: this.nextId++,
      position: params.position.clone(),
      schwarzschildRadius: Math.max(1e-6, params.schwarzschildRadius),
      einsteinScale: params.einsteinScale ?? this.params.einsteinScale,
    };
    this.holes.set(handle.id, handle);
    return handle;
  }

  removeBlackHole(handle: BlackHoleLensingHandle | number): void {
    const id = typeof handle === 'number' ? handle : handle.id;
    this.holes.delete(id);
  }

  clear(): void {
    this.holes.clear();
  }

  /** True when there is at least one active lenser to render. */
  isActive(): boolean {
    return this.holes.size > 0;
  }

  getHandleCount(): number {
    return this.holes.size;
  }

  getHandles(): ReadonlyArray<BlackHoleLensingHandle> {
    return Array.from(this.holes.values());
  }

  getMaterial(): THREE.ShaderMaterial {
    return this.material;
  }

  setSize(width: number, height: number): void {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
  }

  /**
   * Project every registered BH into screen space using the currently-bound
   * camera, pack into the shader uniform array, and render the bent scene
   * from `input` into `output`. Callers (PostProcessingChain) are
   * responsible for ordering this before bloom.
   */
  render(
    renderer: THREE.WebGLRenderer,
    input: THREE.WebGLRenderTarget,
    output: THREE.WebGLRenderTarget,
    camera?: THREE.Camera,
  ): void {
    if (this.disposed) return;
    const cam = camera ?? this.findActiveCamera(renderer);
    if (!cam) return;
    if (this.holes.size === 0) {
      // No lensing active — copy input → output unchanged. Cheap no-op.
      this.copyThrough(renderer, input.texture, output);
      return;
    }

    this.updatePackedBuffer(cam);

    this.material.uniforms.u_scene.value = input.texture;
    this.material.uniforms.u_blackHoleCount.value = Math.min(this.holes.size, this.maxBlackHoles);
    this.material.uniforms.u_aspect.value.set(
      this.width / Math.max(1, this.height),
      1.0,
    );

    this.fsTriangle.material = this.material;
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(output);
    renderer.render(this.fsScene, this.fsCamera);
    renderer.setRenderTarget(prevTarget);
  }

  /** SceneManager context-loss recovery — rebuild the shader material. */
  rebuildAfterContextRestore(): void {
    this.material.dispose();
    this.buildMaterial();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.material.dispose();
    this.fsTriangle.geometry.dispose();
    this.holes.clear();
  }

  // -- Internals -----------------------------------------------------------

  private buildMaterial(): void {
    this.material = new THREE.ShaderMaterial({
      name: 'post:lensing',
      glslVersion: THREE.GLSL3,
      vertexShader: postFullscreenVertSource,
      fragmentShader: postLensingFragSource,
      defines: {
        POST_LENSING_MAX_BLACKHOLES: String(this.maxBlackHoles),
      },
      depthTest: false,
      depthWrite: false,
      uniforms: {
        u_scene: { value: null as THREE.Texture | null },
        u_blackHoleCount: { value: 0 },
        u_blackHoles: { value: this.packedUniform },
        u_maxDeflectionRad: { value: this.params.maxDeflectionRad },
        u_falloffExponent: { value: this.params.falloffExponent },
        u_aspect: { value: new THREE.Vector2(1, 1) },
      },
    });
  }

  private updatePackedBuffer(camera: THREE.Camera): void {
    const entries = Array.from(this.holes.values()).slice(0, this.maxBlackHoles);
    const tmpWorld = _tmpWorld;
    const tmpProj = _tmpProj;
    for (let i = 0; i < entries.length; i++) {
      const hole = entries[i]!;
      tmpWorld.copy(hole.position);
      tmpProj.copy(tmpWorld).project(camera);
      // Skip BHs behind the camera (project().z > 1 after clip space).
      // Leave their uniform in place but with angular radius 0, so the
      // shader deflection contribution is zero.
      const behindCamera = tmpProj.z > 1 || tmpProj.z < -1;
      const uvX = behindCamera ? -10 : 0.5 + 0.5 * tmpProj.x;
      const uvY = behindCamera ? -10 : 0.5 + 0.5 * tmpProj.y;

      // Apparent (screen-space) Schwarzschild radius. For a perspective
      // camera, apparent radius ≈ r_s / (distance × tan(fov/2)) in NDC-y,
      // then divided by 2 to get UV units. We compute per-BH so moving BHs
      // shrink / grow correctly with camera distance.
      const angularRadius = behindCamera
        ? 0
        : this.computeAngularRadius(camera, tmpWorld, hole.schwarzschildRadius);

      const v = this.packedUniform[i]!;
      v.set(uvX, uvY, angularRadius, hole.einsteinScale);
    }

    // Zero out any leftover slots so the shader's count-gated loop doesn't
    // accidentally sample a stale BH from a prior frame when the host
    // removed one.
    for (let i = entries.length; i < this.maxBlackHoles; i++) {
      this.packedUniform[i]!.set(-10, -10, 0, 1.5);
    }
  }

  private computeAngularRadius(
    camera: THREE.Camera,
    worldPos: THREE.Vector3,
    schwarzschildRadius: number,
  ): number {
    const persp = camera as THREE.PerspectiveCamera;
    const fovY = (persp.fov ?? 60) * (Math.PI / 180);
    const tanHalfFov = Math.tan(fovY * 0.5);
    const camWorldPos = _tmpCam;
    persp.getWorldPosition(camWorldPos);
    const distance = Math.max(schwarzschildRadius * 0.5, camWorldPos.distanceTo(worldPos));
    // NDC radius in y-direction → UV units by dividing by 2 (NDC is [-1,1]).
    const ndcRadius = schwarzschildRadius / (distance * tanHalfFov);
    return ndcRadius * 0.5;
  }

  private copyThrough(
    renderer: THREE.WebGLRenderer,
    source: THREE.Texture,
    output: THREE.WebGLRenderTarget,
  ): void {
    // Cheap pass-through using the same material with BH count=0. Avoids
    // allocating an extra material just for the "no lensers" case.
    this.material.uniforms.u_scene.value = source;
    this.material.uniforms.u_blackHoleCount.value = 0;
    this.material.uniforms.u_aspect.value.set(
      this.width / Math.max(1, this.height),
      1.0,
    );
    this.fsTriangle.material = this.material;
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(output);
    renderer.render(this.fsScene, this.fsCamera);
    renderer.setRenderTarget(prevTarget);
  }

  private findActiveCamera(_renderer: THREE.WebGLRenderer): THREE.Camera | null {
    // Three.js r184 doesn't expose the last-rendered camera publicly; the
    // caller is expected to pass one in from SceneManager. Fallback null.
    return null;
  }
}

const _tmpWorld = new THREE.Vector3();
const _tmpProj = new THREE.Vector3();
const _tmpCam = new THREE.Vector3();
