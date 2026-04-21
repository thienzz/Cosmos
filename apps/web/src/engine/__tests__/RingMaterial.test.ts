import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  SATURN_RING_GEOMETRY,
  SATURN_RING_PALETTE,
} from '@/utils/planetPalette';

import { createRingMaterial } from '../RingMaterial';

function newHandle(overrides?: Partial<Parameters<typeof createRingMaterial>[0]>) {
  return createRingMaterial({
    planetPositionWorld: new THREE.Vector3(0, 0, 0),
    planetRadiusWorld: 1,
    ...overrides,
  });
}

describe('createRingMaterial', () => {
  it('returns a transparent, double-sided GLSL3 ShaderMaterial', () => {
    const handle = newHandle();
    try {
      const m = handle.material;
      expect(m).toBeInstanceOf(THREE.ShaderMaterial);
      expect(m.glslVersion).toBe(THREE.GLSL3);
      expect(m.transparent).toBe(true);
      expect(m.depthWrite).toBe(false);
      expect(m.side).toBe(THREE.DoubleSide);
      expect(m.name).toMatch(/rings:saturn/);
    } finally {
      handle.dispose();
    }
  });

  it('populates ring geometry uniforms from SATURN_RING_GEOMETRY by default', () => {
    const handle = newHandle();
    try {
      const u = handle.material.uniforms;
      expect(u.u_innerC.value).toBe(SATURN_RING_GEOMETRY.innerC);
      expect(u.u_outerC.value).toBe(SATURN_RING_GEOMETRY.outerC);
      expect(u.u_innerB.value).toBe(SATURN_RING_GEOMETRY.innerB);
      expect(u.u_outerB.value).toBe(SATURN_RING_GEOMETRY.outerB);
      expect(u.u_innerA.value).toBe(SATURN_RING_GEOMETRY.innerA);
      expect(u.u_outerA.value).toBe(SATURN_RING_GEOMETRY.outerA);
      expect(u.u_enckeGapCenter.value).toBe(SATURN_RING_GEOMETRY.enckeGapCenter);
      expect(u.u_enckeGapWidth.value).toBe(SATURN_RING_GEOMETRY.enckeGapWidth);
    } finally {
      handle.dispose();
    }
  });

  it('Cassini Division is preserved between B-outer and A-inner', () => {
    const handle = newHandle();
    try {
      const u = handle.material.uniforms;
      const gap = u.u_innerA.value - u.u_outerB.value;
      expect(gap).toBeGreaterThan(0);
    } finally {
      handle.dispose();
    }
  });

  it('palette defaults to Saturn ring palette', () => {
    const handle = newHandle();
    try {
      const u = handle.material.uniforms;
      const cA = u.u_colorA.value as THREE.Color;
      const refA = new THREE.Color(SATURN_RING_PALETTE.colorA);
      expect(Math.abs(cA.r - refA.r)).toBeLessThan(1e-5);
    } finally {
      handle.dispose();
    }
  });

  it('update() mutates sun direction, planet position and time', () => {
    const handle = newHandle();
    try {
      const sun = new THREE.Vector3(0.3, 0.9, -0.1);
      const pos = new THREE.Vector3(10, 0, -4);
      handle.update(0.016, 42, pos, sun);
      const u = handle.material.uniforms;
      expect(u.u_time.value).toBe(42);
      expect((u.u_sunDir.value as THREE.Vector3).x).toBeCloseTo(sun.x);
      expect((u.u_planetPosW.value as THREE.Vector3).x).toBe(10);
    } finally {
      handle.dispose();
    }
  });

  it('accepts opacityScale override for accessibility', () => {
    const handle = newHandle({ opacityScale: 0.3 });
    try {
      expect(handle.material.uniforms.u_opacityScale.value).toBe(0.3);
    } finally {
      handle.dispose();
    }
  });
});
