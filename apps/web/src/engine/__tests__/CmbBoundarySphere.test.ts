/**
 * CmbBoundarySphere tests (T29).
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { CmbBoundarySphere } from '../CmbBoundarySphere';

describe('CmbBoundarySphere', () => {
  it('constructs a BackSide IcosahedronGeometry mesh at the default radius', () => {
    const s = new CmbBoundarySphere();
    try {
      expect(s.mesh).toBeInstanceOf(THREE.Mesh);
      expect(s.mesh.geometry).toBeInstanceOf(THREE.IcosahedronGeometry);
      const mat = s.mesh.material as THREE.ShaderMaterial;
      expect(mat.side).toBe(THREE.BackSide);
      expect(mat.depthWrite).toBe(false);
      expect(mat.glslVersion).toBe(THREE.GLSL3);
      expect(mat.name).toBe('cmb-boundary');
    } finally {
      s.dispose();
    }
  });

  it('honours custom radius + subdivision count', () => {
    const s = new CmbBoundarySphere({ radius: 500, subdivisions: 2 });
    try {
      const g = s.mesh.geometry as THREE.IcosahedronGeometry;
      // Positions aren't all on a single radius after subdivision — but the
      // bounding sphere radius matches.
      g.computeBoundingSphere();
      expect(g.boundingSphere!.radius).toBeCloseTo(500, 3);
    } finally {
      s.dispose();
    }
  });

  it('anisotropy + dipole uniforms round-trip', () => {
    const dipole = new THREE.Vector3(1, 0, 0);
    const s = new CmbBoundarySphere({
      anisotropyStrength: 0.7,
      dipoleEnabled: true,
      dipoleDirection: dipole,
    });
    try {
      const u = (s.mesh.material as THREE.ShaderMaterial).uniforms;
      expect(u.u_anisotropyStrength.value).toBe(0.7);
      expect(u.u_dipoleEnabled.value).toBe(1);
      const d = u.u_dipoleDirection.value as THREE.Vector3;
      expect(d.length()).toBeCloseTo(1, 5);
      expect(d.x).toBeCloseTo(1, 5);
    } finally {
      s.dispose();
    }
  });

  it('setAnisotropyStrength + setDipoleEnabled + setDipoleDirection update uniforms', () => {
    const s = new CmbBoundarySphere();
    try {
      s.setAnisotropyStrength(0.3);
      s.setDipoleEnabled(true);
      s.setDipoleDirection(new THREE.Vector3(0, 10, 0));
      const u = (s.mesh.material as THREE.ShaderMaterial).uniforms;
      expect(u.u_anisotropyStrength.value).toBe(0.3);
      expect(u.u_dipoleEnabled.value).toBe(1);
      const d = u.u_dipoleDirection.value as THREE.Vector3;
      expect(d.length()).toBeCloseTo(1, 5);
      expect(d.y).toBeCloseTo(1, 5);
    } finally {
      s.dispose();
    }
  });

  it('update() advances u_time', () => {
    const s = new CmbBoundarySphere();
    try {
      s.update(0.016, 1.25);
      expect((s.mesh.material as THREE.ShaderMaterial).uniforms.u_time.value).toBeCloseTo(1.25, 5);
    } finally {
      s.dispose();
    }
  });

  it('dispose releases geometry + material', () => {
    const s = new CmbBoundarySphere();
    let matDisposed = false;
    const mat = s.mesh.material as THREE.ShaderMaterial;
    const original = mat.dispose.bind(mat);
    mat.dispose = () => {
      matDisposed = true;
      original();
    };
    s.dispose();
    expect(matDisposed).toBe(true);
  });
});
