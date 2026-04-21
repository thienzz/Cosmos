import { ShaderMaterial } from 'three';
import { describe, expect, it } from 'vitest';

import {
  createStarPointMaterial,
  setStarPointQuality,
  updateStarPointMaterial,
} from '../StarPointMaterial';

describe('createStarPointMaterial', () => {
  it('produces a THREE.ShaderMaterial with GLSL3 + additive blending', () => {
    const material = createStarPointMaterial();
    expect(material).toBeInstanceOf(ShaderMaterial);
    expect(material.name).toBe('star-point');
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(material.glslVersion).toBe('300 es');
    material.dispose();
  });

  it('exposes all required uniforms by name (Doc 10 §6.2)', () => {
    const material = createStarPointMaterial({ pointSizeScale: 1.5, bloomThreshold: 0.7 });
    for (const key of ['u_time', 'u_pixelRatio', 'u_pointSizeScale', 'u_twinkleStrength', 'u_bloomThreshold']) {
      expect(material.uniforms[key]).toBeDefined();
    }
    expect(material.uniforms.u_pointSizeScale?.value).toBeCloseTo(1.5);
    expect(material.uniforms.u_bloomThreshold?.value).toBeCloseTo(0.7);
    material.dispose();
  });

  it('embeds both star-point.vert and star-point.frag sources', () => {
    const material = createStarPointMaterial();
    expect(material.vertexShader).toMatch(/a_color/);
    expect(material.vertexShader).toMatch(/a_magnitude/);
    expect(material.vertexShader).toMatch(/a_twinklePhase/);
    expect(material.vertexShader).toMatch(/gl_PointSize/);
    expect(material.fragmentShader).toMatch(/gl_PointCoord/);
    expect(material.fragmentShader).toMatch(/discard/);
    material.dispose();
  });

  it('turns on QUALITY_HIGH define for high/ultra tiers', () => {
    const high = createStarPointMaterial({ quality: 'high' });
    const low = createStarPointMaterial({ quality: 'low' });
    expect(high.defines?.QUALITY_HIGH).toBeDefined();
    expect(low.defines?.QUALITY_HIGH).toBeUndefined();
    high.dispose();
    low.dispose();
  });
});

describe('updateStarPointMaterial', () => {
  it('advances the u_time uniform', () => {
    const material = createStarPointMaterial({ twinkleStrength: 1 });
    updateStarPointMaterial(material, 0.5);
    expect(material.uniforms.u_time?.value).toBeCloseTo(0.5);
    updateStarPointMaterial(material, 1.25);
    expect(material.uniforms.u_time?.value).toBeCloseTo(1.25);
    material.dispose();
  });
});

describe('setStarPointQuality', () => {
  it('toggles the QUALITY_HIGH define and preserves it across same-tier calls', () => {
    const material = createStarPointMaterial({ quality: 'low' });
    expect(material.defines?.QUALITY_HIGH).toBeUndefined();

    setStarPointQuality(material, 'high');
    expect(material.defines?.QUALITY_HIGH).toBeDefined();
    const definesRef = material.defines;

    // 'ultra' is in the same class as 'high' — should not rebuild the defines object.
    setStarPointQuality(material, 'ultra');
    expect(material.defines).toBe(definesRef);

    // Going back to a low-tier clears QUALITY_HIGH.
    setStarPointQuality(material, 'medium');
    expect(material.defines?.QUALITY_HIGH).toBeUndefined();
    material.dispose();
  });
});
