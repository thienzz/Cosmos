import * as THREE from 'three';

import { starPointFragSource, starPointVertSource } from '@/shaders';

/**
 * Builds the `star-point` ShaderMaterial (Doc 10 §6.2 + Doc 18 §Star).
 *
 * Consumers supply per-star `a_color`, `a_magnitude`, `a_twinklePhase`
 * attributes on the geometry. This factory only owns the program and its
 * shared uniforms; geometry/instancing lives in T08's StarFieldRenderer.
 */

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface StarPointMaterialOptions {
  pixelRatio?: number;
  /** User setting 0.5–2.0 (settingsStore.starPointSize). */
  pointSizeScale?: number;
  /** 0 to disable twinkle (reduced-motion, test determinism). */
  twinkleStrength?: number;
  /** Brightness above which the corona bloom kicks in. */
  bloomThreshold?: number;
  /** Selects #ifdef QUALITY_HIGH path — 'high'/'ultra' enable the corona halo. */
  quality?: QualityTier;
}

const DEFAULTS: Required<StarPointMaterialOptions> = {
  pixelRatio: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio ?? 1, 2),
  pointSizeScale: 1,
  twinkleStrength: 1,
  bloomThreshold: 0.8,
  quality: 'high',
};

export function createStarPointMaterial(options: StarPointMaterialOptions = {}): THREE.ShaderMaterial {
  const opts = { ...DEFAULTS, ...options };
  const enableHighQuality = opts.quality === 'high' || opts.quality === 'ultra';

  const material = new THREE.ShaderMaterial({
    name: 'star-point',
    glslVersion: THREE.GLSL3,
    vertexShader: starPointVertSource,
    fragmentShader: starPointFragSource,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    defines: enableHighQuality ? { QUALITY_HIGH: '' } : {},
    uniforms: {
      u_time: { value: 0 },
      u_pixelRatio: { value: opts.pixelRatio },
      u_pointSizeScale: { value: opts.pointSizeScale },
      u_twinkleStrength: { value: opts.twinkleStrength },
      u_bloomThreshold: { value: opts.bloomThreshold },
    },
  });

  return material;
}

/**
 * Per-frame update of the time uniform. Factored out so engine code doesn't
 * need to know the uniform key layout.
 */
export function updateStarPointMaterial(
  material: THREE.ShaderMaterial,
  elapsedSeconds: number,
): void {
  const uniform = material.uniforms.u_time;
  if (uniform) uniform.value = elapsedSeconds;
}

/** Re-apply a new quality tier by swapping the #define without rebuilding. */
export function setStarPointQuality(
  material: THREE.ShaderMaterial,
  quality: QualityTier,
): void {
  const enableHighQuality = quality === 'high' || quality === 'ultra';
  const hasHigh = material.defines?.QUALITY_HIGH !== undefined;
  if (enableHighQuality === hasHigh) return;
  material.defines = enableHighQuality ? { QUALITY_HIGH: '' } : {};
  material.needsUpdate = true;
}
