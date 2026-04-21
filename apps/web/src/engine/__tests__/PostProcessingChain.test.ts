/**
 * PostProcessingChain tests (T30).
 *
 * GLSL + Three.js rendering can't run in jsdom, so like the other material
 * factory suites (NebulaMaterial, ExoticMaterial, GalaxyMaterial) we
 * introspect uniforms, defines, render-target configuration, and feature-
 * flag wiring. Rendering correctness is verified via preview-eval in the
 * live browser smoke.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  BLOOM_DEFAULT,
  BLOOM_ITERATIONS_BY_TIER,
  CHROMATIC_ABERRATION_DEFAULT,
  FILM_GRAIN_DEFAULT,
  SCANLINE_DEFAULT,
  VIGNETTE_DEFAULT,
} from '@/utils/postProcessingParams';

import { PostProcessingChain, DEFAULT_FEATURES } from '../PostProcessingChain';

interface MakeOptions {
  width?: number;
  height?: number;
  qualityTier?: 'low' | 'mid' | 'high';
  features?: Partial<typeof DEFAULT_FEATURES>;
  reducedMotion?: boolean;
  bloomIntensity?: number;
}

function make(opts: MakeOptions = {}): PostProcessingChain {
  return new PostProcessingChain({
    width: opts.width ?? 800,
    height: opts.height ?? 600,
    qualityTier: opts.qualityTier ?? 'high',
    features: opts.features ?? DEFAULT_FEATURES,
    reducedMotion: opts.reducedMotion ?? false,
    bloomIntensity: opts.bloomIntensity ?? 1,
  });
}

describe('PostProcessingChain', () => {
  it('constructs with Float16 HDR targets + GLSL3 composite material', () => {
    const chain = make();
    try {
      const composite = chain.getCompositeMaterial();
      expect(composite).toBeInstanceOf(THREE.ShaderMaterial);
      expect(composite.glslVersion).toBe(THREE.GLSL3);
      expect(composite.name).toBe('post:composite');
      expect(composite.depthTest).toBe(false);
      expect(composite.depthWrite).toBe(false);
      expect(chain.getLensedTarget().texture.type).toBe(THREE.HalfFloatType);
    } finally {
      chain.dispose();
    }
  });

  it('wires Doc 18 §3.5 bloom / CA / grain / scanline / vignette params to uniforms', () => {
    const chain = make();
    try {
      const u = chain.getCompositeMaterial().uniforms;
      expect(u.u_bloomStrength.value).toBeCloseTo(BLOOM_DEFAULT.strength, 5);
      expect(u.u_chromaIntensity.value).toBeCloseTo(CHROMATIC_ABERRATION_DEFAULT.intensity, 5);
      expect(u.u_chromaEdgeStart.value).toBeCloseTo(CHROMATIC_ABERRATION_DEFAULT.edgeStart, 5);
      expect(u.u_grainOpacity.value).toBeCloseTo(FILM_GRAIN_DEFAULT.opacity, 5);
      expect(u.u_grainScale.value).toBeCloseTo(FILM_GRAIN_DEFAULT.scale, 5);
      expect(u.u_scanlineOpacity.value).toBeCloseTo(SCANLINE_DEFAULT.opacity, 5);
      expect(u.u_scanlineFrequency.value).toBeCloseTo(SCANLINE_DEFAULT.frequency, 5);
      expect(u.u_vignetteDarkness.value).toBeCloseTo(VIGNETTE_DEFAULT.darkness, 5);
      expect(u.u_vignetteOffset.value).toBeCloseTo(VIGNETTE_DEFAULT.offset, 5);
      const resolution = u.u_resolution.value as THREE.Vector2;
      expect(resolution.x).toBe(800);
      expect(resolution.y).toBe(600);
    } finally {
      chain.dispose();
    }
  });

  it('encodes feature flags as compile-time GLSL defines', () => {
    const chain = make({
      features: {
        bloom: true,
        fxaa: true,
        chromaticAberration: true,
        filmGrain: true,
        vignette: true,
        scanlines: true,
        gravitationalLensing: true,
      },
    });
    try {
      const defs = chain.getCompositeMaterial().defines ?? {};
      expect(defs.POST_FXAA).toBe('1');
      expect(defs.POST_CHROMATIC_ABERRATION).toBe('1');
      expect(defs.POST_FILM_GRAIN).toBe('1');
      expect(defs.POST_VIGNETTE).toBe('1');
      expect(defs.POST_SCANLINES).toBe('1');
    } finally {
      chain.dispose();
    }
  });

  it('toggling a feature recomputes defines + marks the material for rebuild', () => {
    const chain = make();
    try {
      const composite = chain.getCompositeMaterial();
      const versionBefore = composite.version;
      chain.setFeature('scanlines', false);
      expect(composite.defines?.POST_SCANLINES).toBeUndefined();
      expect(composite.version).toBeGreaterThan(versionBefore);
    } finally {
      chain.dispose();
    }
  });

  it('quality tier drives bloom iteration count (Doc 12 §Tier 1/2/3)', () => {
    for (const tier of ['high', 'mid', 'low'] as const) {
      const chain = make({ qualityTier: tier });
      try {
        expect(chain.getBloomIterations()).toBe(BLOOM_ITERATIONS_BY_TIER[tier]);
      } finally {
        chain.dispose();
      }
    }
  });

  it('tier=low → isPassThrough-ish: bloom iterations 0 even when feature is on', () => {
    const chain = make({ qualityTier: 'low' });
    try {
      expect(chain.getFeatureFlags().bloom).toBe(true);
      expect(chain.getBloomIterations()).toBe(0);
    } finally {
      chain.dispose();
    }
  });

  it('setBloomIntensity multiplies the Doc 18 strength', () => {
    const chain = make({ bloomIntensity: 0.5 });
    try {
      const u = chain.getCompositeMaterial().uniforms;
      expect(u.u_bloomStrength.value).toBeCloseTo(BLOOM_DEFAULT.strength * 0.5, 5);
      chain.setBloomIntensity(2);
      expect(u.u_bloomStrength.value).toBeCloseTo(BLOOM_DEFAULT.strength * 2, 5);
    } finally {
      chain.dispose();
    }
  });

  it('setSize rebuilds bloom pyramid to match new dimensions', () => {
    const chain = make({ width: 800, height: 600, qualityTier: 'high' });
    try {
      chain.setSize(1920, 1080);
      const { pingpongA } = chain.getBloomTargets();
      expect(pingpongA[0]!.width).toBe(1920);
      expect(pingpongA[0]!.height).toBe(1080);
      // Level 1 is half resolution.
      expect(pingpongA[1]!.width).toBe(960);
      expect(pingpongA[1]!.height).toBe(540);
    } finally {
      chain.dispose();
    }
  });

  it('bloom pyramid has iteration-count levels at tier=high', () => {
    const chain = make({ qualityTier: 'high' });
    try {
      expect(chain.getBloomTargets().pingpongA.length).toBe(BLOOM_ITERATIONS_BY_TIER.high);
    } finally {
      chain.dispose();
    }
  });

  it('reduced-motion pins the grain seed to 0 (Doc 16 a11y)', () => {
    const chain = make({ reducedMotion: true });
    try {
      const renderer = null as unknown as THREE.WebGLRenderer; // not actually rendered here
      // Drive the seed advance directly.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chain as any).advanceGrainSeed(1.0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((chain as any).grainSeed).toBe(0);
      void renderer;
    } finally {
      chain.dispose();
    }
  });

  it('non-reduced-motion advances the grain seed every frame', () => {
    const chain = make({ reducedMotion: false });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const before = (chain as any).grainSeed;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chain as any).advanceGrainSeed(0.5);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const after = (chain as any).grainSeed;
      expect(after).toBeGreaterThan(before);
    } finally {
      chain.dispose();
    }
  });

  it('setQualityTier rebuilds the bloom pyramid to match the new tier', () => {
    const chain = make({ qualityTier: 'high' });
    try {
      expect(chain.getBloomTargets().pingpongA.length).toBe(BLOOM_ITERATIONS_BY_TIER.high);
      chain.setQualityTier('mid');
      expect(chain.getBloomTargets().pingpongA.length).toBe(BLOOM_ITERATIONS_BY_TIER.mid);
    } finally {
      chain.dispose();
    }
  });

  it('rebuildAfterContextRestore discards + re-creates materials', () => {
    const chain = make();
    try {
      const before = chain.getCompositeMaterial();
      chain.rebuildAfterContextRestore();
      const after = chain.getCompositeMaterial();
      expect(after).not.toBe(before); // new instance
      expect(after.glslVersion).toBe(THREE.GLSL3);
    } finally {
      chain.dispose();
    }
  });

  it('dispose is idempotent', () => {
    const chain = make();
    chain.dispose();
    expect(() => chain.dispose()).not.toThrow();
  });

  it('exposes feature flags as a read-only snapshot', () => {
    const chain = make();
    try {
      const flags = chain.getFeatureFlags();
      expect(flags.bloom).toBe(true);
      expect(flags.gravitationalLensing).toBe(true);
    } finally {
      chain.dispose();
    }
  });
});
