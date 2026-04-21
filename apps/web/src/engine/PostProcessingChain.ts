import * as THREE from 'three';

import {
  postBloomBlurFragSource,
  postBloomThresholdFragSource,
  postCompositeFragSource,
  postFullscreenVertSource,
} from '@/shaders';
import {
  BLOOM_DEFAULT,
  BLOOM_ITERATIONS_BY_TIER,
  CHROMATIC_ABERRATION_DEFAULT,
  FILM_GRAIN_DEFAULT,
  SCANLINE_DEFAULT,
  TONE_MAPPING_DEFAULT,
  VIGNETTE_DEFAULT,
  type BloomParams,
  type ChromaticAberrationParams,
  type FilmGrainParams,
  type ScanlineParams,
  type ToneMappingParams,
  type VignetteParams,
} from '@/utils/postProcessingParams';

import type { BlackHoleLensingPass } from './BlackHoleLensingPass';
import type { GpuTier } from './gpuDetection';
import type { GpuLifecycleHook } from './gpuLifecycle';

/**
 * T30 post-processing chain (Doc 18 §3.5, §14; Doc 24 §3.5).
 *
 * Renders in this order:
 *   1. Scene      → HDR target (done by SceneManager before calling render())
 *   2. Lensing    → lensedTarget  (optional, via {@link BlackHoleLensingPass})
 *   3. Bloom
 *        3a. Threshold → bloomTargets[0]
 *        3b. N × (horizontal blur → vertical blur → downsample) pyramid
 *   4. Composite  → output framebuffer (or a provided render target)
 *
 * Owns all intermediate render targets and disposes them in
 * {@link dispose}. Supports {@link rebuildAfterContextRestore} so the
 * SceneManager's WEBGL_lose_context hook can reset GPU resources.
 *
 * CLAUDE.md Rule #3: no imports from `three/examples/jsm/postprocessing`.
 * Everything runs through our own ShaderMaterials + fullscreen triangles.
 */
export interface PostProcessingFeatureFlags {
  bloom: boolean;
  fxaa: boolean;
  chromaticAberration: boolean;
  filmGrain: boolean;
  vignette: boolean;
  scanlines: boolean;
  gravitationalLensing: boolean;
}

export const DEFAULT_FEATURES: PostProcessingFeatureFlags = {
  bloom: true,
  fxaa: true,
  chromaticAberration: true,
  filmGrain: true,
  vignette: true,
  scanlines: true,
  gravitationalLensing: true,
};

export interface PostProcessingChainOptions {
  /** Initial viewport size. Update via {@link setSize}. */
  width: number;
  height: number;
  /** Device pixel ratio — recorded so resize math stays consistent. */
  pixelRatio?: number;
  /** Which passes to enable. Individual flags can be flipped at runtime. */
  features?: Partial<PostProcessingFeatureFlags>;
  /** Initial quality tier — drives bloom iteration count. */
  qualityTier?: GpuTier;
  /** Reduced-motion / a11y flag — pins film-grain seed instead of animating. */
  reducedMotion?: boolean;
  /** Bloom intensity 0..1 multiplier (applied on top of `strength`). */
  bloomIntensity?: number;
  /** Optional black-hole lensing pass — owned externally; we only call
   *  {@link BlackHoleLensingPass.render} when gravitationalLensing is on. */
  lensingPass?: BlackHoleLensingPass | null;
  /** Params overrides (mostly for tests / visual tuning). */
  bloomParams?: Partial<BloomParams>;
  chromaticAberrationParams?: Partial<ChromaticAberrationParams>;
  filmGrainParams?: Partial<FilmGrainParams>;
  scanlineParams?: Partial<ScanlineParams>;
  vignetteParams?: Partial<VignetteParams>;
  toneMappingParams?: Partial<ToneMappingParams>;
}

function makeHdrTarget(width: number, height: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.LinearSRGBColorSpace,
    depthBuffer: false,
    stencilBuffer: false,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
}

export class PostProcessingChain implements GpuLifecycleHook {
  private width: number;
  private height: number;
  private pixelRatio: number;
  private reducedMotion: boolean;
  private qualityTier: GpuTier;
  private features: PostProcessingFeatureFlags;
  private bloomIntensity: number;
  private lensingPass: BlackHoleLensingPass | null;

  private readonly bloomParams: BloomParams;
  private readonly chromaParams: ChromaticAberrationParams;
  private readonly grainParams: FilmGrainParams;
  private readonly scanlineParams: ScanlineParams;
  private readonly vignetteParams: VignetteParams;
  private readonly toneParams: ToneMappingParams;

  // Intermediate render targets.
  private lensedTarget: THREE.WebGLRenderTarget;
  private bloomTargetsA: THREE.WebGLRenderTarget[] = [];
  private bloomTargetsB: THREE.WebGLRenderTarget[] = [];

  // Full-screen pass scene (one triangle rendered with swapped materials).
  private readonly fsScene: THREE.Scene;
  private readonly fsCamera: THREE.OrthographicCamera;
  private readonly fsTriangle: THREE.Mesh;

  // Pass materials. Re-created on context restore.
  private thresholdMaterial!: THREE.ShaderMaterial;
  private blurMaterial!: THREE.ShaderMaterial;
  private compositeMaterial!: THREE.ShaderMaterial;

  // Accumulated grain seed (advanced per frame).
  private grainSeed = 0;
  private disposed = false;

  constructor(opts: PostProcessingChainOptions) {
    this.width = Math.max(1, opts.width);
    this.height = Math.max(1, opts.height);
    this.pixelRatio = opts.pixelRatio ?? 1;
    this.reducedMotion = opts.reducedMotion ?? false;
    this.qualityTier = opts.qualityTier ?? 'mid';
    this.features = { ...DEFAULT_FEATURES, ...(opts.features ?? {}) };
    this.bloomIntensity = opts.bloomIntensity ?? 1;
    this.lensingPass = opts.lensingPass ?? null;

    this.bloomParams = { ...BLOOM_DEFAULT, ...(opts.bloomParams ?? {}) };
    this.chromaParams = {
      ...CHROMATIC_ABERRATION_DEFAULT,
      ...(opts.chromaticAberrationParams ?? {}),
    };
    this.grainParams = { ...FILM_GRAIN_DEFAULT, ...(opts.filmGrainParams ?? {}) };
    this.scanlineParams = { ...SCANLINE_DEFAULT, ...(opts.scanlineParams ?? {}) };
    this.vignetteParams = { ...VIGNETTE_DEFAULT, ...(opts.vignetteParams ?? {}) };
    this.toneParams = { ...TONE_MAPPING_DEFAULT, ...(opts.toneMappingParams ?? {}) };

    this.lensedTarget = makeHdrTarget(this.width, this.height);
    this.rebuildBloomTargets();

    this.fsScene = new THREE.Scene();
    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // Minimal 3-vertex buffer — the vertex shader reconstructs clip-space
    // positions from gl_VertexID, so `position` is unused, but Three.js
    // requires at least one attribute + a draw range.
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    geom.setDrawRange(0, 3);
    this.fsTriangle = new THREE.Mesh(geom);
    this.fsTriangle.frustumCulled = false;
    this.fsScene.add(this.fsTriangle);

    this.buildMaterials();
  }

  // -- Public API ----------------------------------------------------------

  /** Update the render-target resolution after a canvas resize. */
  setSize(width: number, height: number, pixelRatio = this.pixelRatio): void {
    const nextW = Math.max(1, Math.floor(width));
    const nextH = Math.max(1, Math.floor(height));
    if (nextW === this.width && nextH === this.height && pixelRatio === this.pixelRatio) {
      return;
    }
    this.width = nextW;
    this.height = nextH;
    this.pixelRatio = pixelRatio;
    this.lensedTarget.setSize(nextW, nextH);
    this.rebuildBloomTargets();
    this.lensingPass?.setSize(nextW, nextH);
  }

  /** Turn a single feature on/off at runtime. Composite defines rebuild. */
  setFeature<K extends keyof PostProcessingFeatureFlags>(key: K, value: boolean): void {
    if (this.features[key] === value) return;
    this.features[key] = value;
    this.rebuildCompositeDefines();
  }

  /** Update whether film-grain animates (reduced-motion a11y). */
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  /** Flip the quality tier (rebuilds the bloom pyramid depth). */
  setQualityTier(tier: GpuTier): void {
    if (this.qualityTier === tier) return;
    this.qualityTier = tier;
    this.rebuildBloomTargets();
  }

  /** Adjust the final bloom add multiplier. */
  setBloomIntensity(intensity: number): void {
    this.bloomIntensity = Math.max(0, intensity);
    this.compositeMaterial.uniforms.u_bloomStrength.value =
      this.bloomParams.strength * this.bloomIntensity;
  }

  /** Attach / detach the external lensing pass. */
  setLensingPass(pass: BlackHoleLensingPass | null): void {
    this.lensingPass = pass;
    if (pass) pass.setSize(this.width, this.height);
  }

  /** True while the chain is in the "fully off" feature state. */
  isPassThrough(): boolean {
    return (
      !this.features.bloom &&
      !this.features.fxaa &&
      !this.features.chromaticAberration &&
      !this.features.filmGrain &&
      !this.features.vignette &&
      !this.features.scanlines &&
      !this.features.gravitationalLensing
    );
  }

  /**
   * Execute the chain. `sceneTarget` holds the rendered HDR scene; the
   * output is drawn to the default framebuffer (or `outputTarget` if
   * provided — mainly for tests that need to inspect pixels).
   */
  render(
    renderer: THREE.WebGLRenderer,
    sceneTarget: THREE.WebGLRenderTarget,
    dtSeconds: number,
    outputTarget: THREE.WebGLRenderTarget | null = null,
    camera: THREE.Camera | null = null,
  ): void {
    if (this.disposed) return;

    // 1. Optional lensing pass — writes into `lensedTarget`.
    let sceneSource = sceneTarget.texture;
    if (
      this.features.gravitationalLensing &&
      this.lensingPass &&
      this.lensingPass.isActive() &&
      camera
    ) {
      this.lensingPass.render(renderer, sceneTarget, this.lensedTarget, camera);
      sceneSource = this.lensedTarget.texture;
    }

    // 2. Bloom pyramid.
    this.runBloom(renderer, sceneSource);

    // 3. Composite → output.
    this.advanceGrainSeed(dtSeconds);
    this.compositeMaterial.uniforms.u_scene.value = sceneSource;
    // Always bind bloomTargetsA[0] so the shader has a valid sampler
    // regardless of the feature flag; the strength uniform gates the add.
    this.compositeMaterial.uniforms.u_bloom.value = this.bloomTargetsA[0]?.texture ?? null;
    const strength = this.features.bloom && this.getBloomIterations() > 0
      ? this.bloomParams.strength * this.bloomIntensity
      : 0;
    this.compositeMaterial.uniforms.u_bloomStrength.value = strength;
    this.compositeMaterial.uniforms.u_resolution.value.set(this.width, this.height);
    this.compositeMaterial.uniforms.u_grainSeed.value = this.grainSeed;

    this.fsTriangle.material = this.compositeMaterial;
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(outputTarget);
    renderer.render(this.fsScene, this.fsCamera);
    renderer.setRenderTarget(prevTarget);
  }

  /**
   * SceneManager.rebuildAfterContextRestore plugs the chain back in.
   * We dispose the existing GPU resources and rebuild them — same pattern
   * as StarFieldRenderer / NebulaGalleryRenderer etc.
   */
  rebuildAfterContextRestore(): void {
    this.thresholdMaterial.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();
    this.disposeBloomTargets();
    this.lensedTarget.dispose();

    this.lensedTarget = makeHdrTarget(this.width, this.height);
    this.rebuildBloomTargets();
    this.buildMaterials();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.thresholdMaterial.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();
    this.disposeBloomTargets();
    this.lensedTarget.dispose();
    this.fsTriangle.geometry.dispose();
  }

  // -- Introspection (used by tests + dev HUD) -----------------------------

  getFeatureFlags(): Readonly<PostProcessingFeatureFlags> {
    return this.features;
  }

  getBloomIterations(): number {
    return this.features.bloom ? BLOOM_ITERATIONS_BY_TIER[this.qualityTier] : 0;
  }

  getCompositeMaterial(): THREE.ShaderMaterial {
    return this.compositeMaterial;
  }

  getThresholdMaterial(): THREE.ShaderMaterial {
    return this.thresholdMaterial;
  }

  getBlurMaterial(): THREE.ShaderMaterial {
    return this.blurMaterial;
  }

  getBloomTargets(): { pingpongA: ReadonlyArray<THREE.WebGLRenderTarget>; pingpongB: ReadonlyArray<THREE.WebGLRenderTarget> } {
    return { pingpongA: this.bloomTargetsA, pingpongB: this.bloomTargetsB };
  }

  getLensedTarget(): THREE.WebGLRenderTarget {
    return this.lensedTarget;
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  // -- Internal ------------------------------------------------------------

  private rebuildBloomTargets(): void {
    this.disposeBloomTargets();
    const iterations = BLOOM_ITERATIONS_BY_TIER[this.qualityTier];
    // Even at iterations=0 we keep a single target so the composite always
    // has a valid `u_bloom` texture to sample (zero-filled on clear).
    const stages = Math.max(1, iterations);
    for (let i = 0; i < stages; i++) {
      const divisor = 1 << i;
      const w = Math.max(1, Math.floor(this.width / divisor));
      const h = Math.max(1, Math.floor(this.height / divisor));
      this.bloomTargetsA.push(makeHdrTarget(w, h));
      this.bloomTargetsB.push(makeHdrTarget(w, h));
    }
  }

  private disposeBloomTargets(): void {
    for (const t of this.bloomTargetsA) t.dispose();
    for (const t of this.bloomTargetsB) t.dispose();
    this.bloomTargetsA = [];
    this.bloomTargetsB = [];
  }

  private buildMaterials(): void {
    this.thresholdMaterial = new THREE.ShaderMaterial({
      name: 'post:bloom-threshold',
      glslVersion: THREE.GLSL3,
      vertexShader: postFullscreenVertSource,
      fragmentShader: postBloomThresholdFragSource,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        u_scene: { value: null as THREE.Texture | null },
        u_threshold: { value: this.bloomParams.threshold },
        u_softKnee: { value: 0.1 },
      },
    });

    this.blurMaterial = new THREE.ShaderMaterial({
      name: 'post:bloom-blur',
      glslVersion: THREE.GLSL3,
      vertexShader: postFullscreenVertSource,
      fragmentShader: postBloomBlurFragSource,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        u_source: { value: null as THREE.Texture | null },
        u_direction: { value: new THREE.Vector2(1, 0) },
      },
    });

    this.compositeMaterial = new THREE.ShaderMaterial({
      name: 'post:composite',
      glslVersion: THREE.GLSL3,
      vertexShader: postFullscreenVertSource,
      fragmentShader: postCompositeFragSource,
      depthTest: false,
      depthWrite: false,
      defines: this.buildCompositeDefines(),
      uniforms: {
        u_scene: { value: null as THREE.Texture | null },
        u_bloom: { value: null as THREE.Texture | null },
        u_bloomStrength: { value: this.bloomParams.strength * this.bloomIntensity },
        u_exposure: { value: this.toneParams.exposure },

        u_chromaIntensity: { value: this.chromaParams.intensity },
        u_chromaEdgeStart: { value: this.chromaParams.edgeStart },

        u_grainOpacity: { value: this.grainParams.opacity },
        u_grainScale: { value: this.grainParams.scale },
        u_grainSeed: { value: 0 },

        u_vignetteDarkness: { value: this.vignetteParams.darkness },
        u_vignetteOffset: { value: this.vignetteParams.offset },

        u_resolution: { value: new THREE.Vector2(this.width, this.height) },
        u_scanlineOpacity: { value: this.scanlineParams.opacity },
        u_scanlineFrequency: { value: this.scanlineParams.frequency },
        u_phosphorMask: { value: this.scanlineParams.phosphorDot },
      },
    });
  }

  private rebuildCompositeDefines(): void {
    this.compositeMaterial.defines = this.buildCompositeDefines();
    this.compositeMaterial.needsUpdate = true;
  }

  private buildCompositeDefines(): Record<string, string> {
    const defs: Record<string, string> = {};
    if (this.features.fxaa) defs.POST_FXAA = '1';
    if (this.features.chromaticAberration) defs.POST_CHROMATIC_ABERRATION = '1';
    if (this.features.filmGrain) defs.POST_FILM_GRAIN = '1';
    if (this.features.vignette) defs.POST_VIGNETTE = '1';
    if (this.features.scanlines) defs.POST_SCANLINES = '1';
    return defs;
  }

  private advanceGrainSeed(dtSeconds: number): void {
    if (this.reducedMotion) {
      this.grainSeed = 0;
      return;
    }
    this.grainSeed = (this.grainSeed + dtSeconds * this.grainParams.speed) % 4096;
  }

  private runBloom(renderer: THREE.WebGLRenderer, sceneTexture: THREE.Texture): void {
    const iterations = this.getBloomIterations();
    if (iterations <= 0 || this.bloomTargetsA.length === 0) return;

    const prevTarget = renderer.getRenderTarget();

    // 1. Threshold pass → bloomTargetsA[0].
    this.thresholdMaterial.uniforms.u_scene.value = sceneTexture;
    this.thresholdMaterial.uniforms.u_threshold.value = this.bloomParams.threshold;
    this.fsTriangle.material = this.thresholdMaterial;
    renderer.setRenderTarget(this.bloomTargetsA[0] ?? null);
    renderer.render(this.fsScene, this.fsCamera);

    // 2. Blur + downsample. For each stage we do a horizontal then vertical
    //    blur, leaving the result in `bloomTargetsA[i]`. On downsample, the
    //    source is the previous level's A target; on the first level we
    //    read from the threshold output (which is itself bloomTargetsA[0]).
    this.fsTriangle.material = this.blurMaterial;
    for (let i = 0; i < iterations && i < this.bloomTargetsA.length; i++) {
      const targetA = this.bloomTargetsA[i];
      const targetB = this.bloomTargetsB[i];
      if (!targetA || !targetB) break;

      const width = targetA.width;
      const height = targetA.height;

      // Horizontal blur: A[i] → B[i]
      this.blurMaterial.uniforms.u_source.value = targetA.texture;
      this.blurMaterial.uniforms.u_direction.value.set(1 / Math.max(1, width), 0);
      renderer.setRenderTarget(targetB);
      renderer.render(this.fsScene, this.fsCamera);

      // Vertical blur: B[i] → A[i]
      this.blurMaterial.uniforms.u_source.value = targetB.texture;
      this.blurMaterial.uniforms.u_direction.value.set(0, 1 / Math.max(1, height));
      renderer.setRenderTarget(targetA);
      renderer.render(this.fsScene, this.fsCamera);

      // Downsample: copy A[i] into A[i+1] (next iteration reads from it).
      // The blur material with direction=(0,0) becomes an identity resample
      // onto the smaller target.
      const next = this.bloomTargetsA[i + 1];
      if (next) {
        this.blurMaterial.uniforms.u_source.value = targetA.texture;
        this.blurMaterial.uniforms.u_direction.value.set(0, 0);
        renderer.setRenderTarget(next);
        renderer.render(this.fsScene, this.fsCamera);
      }
    }

    renderer.setRenderTarget(prevTarget);
  }
}
