/**
 * BlackHoleLensingPass tests (T30).
 *
 * Verifies uniform wiring, per-BH projection math, and lifecycle hooks.
 * Rendering itself requires a GL context so fires only in preview smoke.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { BLACK_HOLE_LENSING_DEFAULT } from '@/utils/postProcessingParams';

import { BlackHoleLensingPass } from '../BlackHoleLensingPass';

function make(maxBHs = 4): BlackHoleLensingPass {
  return new BlackHoleLensingPass({
    width: 1920,
    height: 1080,
    maxBlackHoles: maxBHs,
  });
}

describe('BlackHoleLensingPass', () => {
  it('constructs with a GLSL3 ShaderMaterial + POST_LENSING_MAX_BLACKHOLES define', () => {
    const pass = make(4);
    try {
      const mat = pass.getMaterial();
      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      expect(mat.glslVersion).toBe(THREE.GLSL3);
      expect(mat.name).toBe('post:lensing');
      expect(mat.defines?.POST_LENSING_MAX_BLACKHOLES).toBe('4');
      expect(mat.depthTest).toBe(false);
      expect(mat.depthWrite).toBe(false);
    } finally {
      pass.dispose();
    }
  });

  it('exposes the Doc 18 lensing defaults', () => {
    const pass = make();
    try {
      const u = pass.getMaterial().uniforms;
      expect(u.u_maxDeflectionRad.value).toBeCloseTo(
        BLACK_HOLE_LENSING_DEFAULT.maxDeflectionRad,
        6,
      );
      expect(u.u_falloffExponent.value).toBeCloseTo(
        BLACK_HOLE_LENSING_DEFAULT.falloffExponent,
        6,
      );
    } finally {
      pass.dispose();
    }
  });

  it('addBlackHole + removeBlackHole keep the active set in sync', () => {
    const pass = make();
    try {
      const h = pass.addBlackHole({
        position: new THREE.Vector3(0, 0, -10),
        schwarzschildRadius: 2,
      });
      expect(pass.isActive()).toBe(true);
      expect(pass.getHandleCount()).toBe(1);
      pass.removeBlackHole(h);
      expect(pass.isActive()).toBe(false);
    } finally {
      pass.dispose();
    }
  });

  it('clear drops every registered BH', () => {
    const pass = make();
    try {
      pass.addBlackHole({ position: new THREE.Vector3(0, 0, -5), schwarzschildRadius: 1 });
      pass.addBlackHole({ position: new THREE.Vector3(5, 0, -5), schwarzschildRadius: 1 });
      expect(pass.getHandleCount()).toBe(2);
      pass.clear();
      expect(pass.getHandleCount()).toBe(0);
    } finally {
      pass.dispose();
    }
  });

  it('caps the active BH set at the compile-time max', () => {
    const pass = make(2);
    try {
      pass.addBlackHole({ position: new THREE.Vector3(0, 0, -5), schwarzschildRadius: 1 });
      pass.addBlackHole({ position: new THREE.Vector3(1, 0, -5), schwarzschildRadius: 1 });
      pass.addBlackHole({ position: new THREE.Vector3(2, 0, -5), schwarzschildRadius: 1 });
      // 3 registered, shader slots still 2 — the loop short-circuits.
      expect(pass.getHandleCount()).toBe(3);
      const mat = pass.getMaterial();
      const packed = mat.uniforms.u_blackHoles.value as THREE.Vector4[];
      expect(packed.length).toBe(2);
    } finally {
      pass.dispose();
    }
  });

  it('updatePackedBuffer projects BH world pos into NDC UV [0..1]', () => {
    const pass = make();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    try {
      pass.addBlackHole({
        position: new THREE.Vector3(0, 0, 0),
        schwarzschildRadius: 0.5,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pass as any).updatePackedBuffer(camera);
      const packed = pass.getMaterial().uniforms.u_blackHoles.value as THREE.Vector4[];
      expect(packed[0]!.x).toBeCloseTo(0.5, 3); // centred on screen
      expect(packed[0]!.y).toBeCloseTo(0.5, 3);
      expect(packed[0]!.z).toBeGreaterThan(0); // apparent radius > 0
      expect(packed[0]!.w).toBeCloseTo(1.5, 3); // Einstein scale
    } finally {
      pass.dispose();
    }
  });

  it('BH behind the camera → apparent radius = 0 (deflection disabled)', () => {
    const pass = make();
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    try {
      pass.addBlackHole({
        position: new THREE.Vector3(0, 0, 20), // behind camera (+Z = behind when cam looks -Z)
        schwarzschildRadius: 0.5,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pass as any).updatePackedBuffer(camera);
      const packed = pass.getMaterial().uniforms.u_blackHoles.value as THREE.Vector4[];
      expect(packed[0]!.z).toBe(0);
    } finally {
      pass.dispose();
    }
  });

  it('setSize updates width/height used for aspect correction', () => {
    const pass = make();
    try {
      pass.setSize(800, 600);
      // No public getter — exercise through render aspect uniform.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((pass as any).width).toBe(800);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((pass as any).height).toBe(600);
    } finally {
      pass.dispose();
    }
  });

  it('rebuildAfterContextRestore swaps in a fresh material', () => {
    const pass = make();
    try {
      const before = pass.getMaterial();
      pass.rebuildAfterContextRestore();
      const after = pass.getMaterial();
      expect(after).not.toBe(before);
      expect(after.glslVersion).toBe(THREE.GLSL3);
    } finally {
      pass.dispose();
    }
  });

  it('dispose is idempotent + clears registered BHs', () => {
    const pass = make();
    pass.addBlackHole({ position: new THREE.Vector3(), schwarzschildRadius: 1 });
    pass.dispose();
    expect(pass.getHandleCount()).toBe(0);
    expect(() => pass.dispose()).not.toThrow();
  });
});
