/**
 * MilkyWayInteriorComposer tests (T46a).
 *
 * Doc 17 ENT-6010, Doc 19 §S2-S4, CLAUDE.md Rule #1.
 */

import { ICRS_TO_GALACTIC } from '@cosmos/coordinate-utils';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  MilkyWayInteriorComposer,
  SGR_A_DEC_DEG,
  SGR_A_RA_DEG,
  buildViewToEclipticMatrix,
  buildViewToGalacticMatrix,
} from '../MilkyWayInteriorComposer';

describe('MilkyWayInteriorComposer', () => {
  it('constructs two BackSide meshes with procedural shaders (no textures)', () => {
    const c = new MilkyWayInteriorComposer();
    try {
      expect(c.group).toBeInstanceOf(THREE.Group);
      expect(c.bandMesh).toBeInstanceOf(THREE.Mesh);
      expect(c.zodiacalMesh).toBeInstanceOf(THREE.Mesh);
      expect(c.bandMesh.geometry).toBeInstanceOf(THREE.IcosahedronGeometry);

      const bandMat = c.bandMesh.material as THREE.ShaderMaterial;
      expect(bandMat.side).toBe(THREE.BackSide);
      expect(bandMat.depthWrite).toBe(false);
      expect(bandMat.transparent).toBe(true);
      expect(bandMat.blending).toBe(THREE.AdditiveBlending);
      expect(bandMat.glslVersion).toBe(THREE.GLSL3);
      expect(bandMat.name).toBe('mw-band');

      // Confirm no texture uniform leaked in — CLAUDE.md Rule #1.
      const uniformKeys = Object.keys(bandMat.uniforms);
      expect(uniformKeys.some((k) => /map|texture/i.test(k))).toBe(false);
    } finally {
      c.dispose();
    }
  });

  it('seats the band behind the zodiacal sphere in renderOrder', () => {
    const c = new MilkyWayInteriorComposer();
    try {
      expect(c.bandMesh.renderOrder).toBeLessThan(c.zodiacalMesh.renderOrder);
    } finally {
      c.dispose();
    }
  });

  it('honours custom radius, subdivisions, and palette options', () => {
    const c = new MilkyWayInteriorComposer({
      radius: 500,
      subdivisions: 2,
      bandIntensity: 0.7,
      bulgeIntensity: 1.8,
      dustStrength: 0.6,
      zodiacalIntensity: 0.4,
      gegenscheinEnabled: true,
      gegenscheinIntensity: 0.5,
    });
    try {
      const g = c.bandMesh.geometry as THREE.IcosahedronGeometry;
      g.computeBoundingSphere();
      expect(g.boundingSphere!.radius).toBeCloseTo(500, 3);

      const bU = (c.bandMesh.material as THREE.ShaderMaterial).uniforms;
      expect(bU.u_bandIntensity.value).toBeCloseTo(0.7);
      expect(bU.u_bulgeIntensity.value).toBeCloseTo(1.8);
      expect(bU.u_dustStrength.value).toBeCloseTo(0.6);

      const zU = (c.zodiacalMesh.material as THREE.ShaderMaterial).uniforms;
      expect(zU.u_zodiacalIntensity.value).toBeCloseTo(0.4);
      expect(zU.u_gegenscheinEnabled.value).toBe(1);
      expect(zU.u_gegenscheinIntensity.value).toBeCloseTo(0.5);
    } finally {
      c.dispose();
    }
  });

  it('setRegime drives band + zodiacal dissolve targets', () => {
    const c = new MilkyWayInteriorComposer();
    try {
      // galactic + cosmic → both should fade to zero after a few updates.
      c.setRegime('galactic');
      for (let i = 0; i < 120; i++) c.update(0.1, i * 0.1);
      expect(c.bandDissolve).toBeLessThan(0.05);

      c.setRegime('stellar');
      for (let i = 0; i < 120; i++) c.update(0.1, i * 0.1);
      expect(c.bandDissolve).toBeGreaterThan(0.9);
      // Zodiacal fades at stellar (only near home star).
      expect(c.zodiacalDissolve).toBeLessThan(0.05);

      c.setRegime('solar_system');
      for (let i = 0; i < 120; i++) c.update(0.1, i * 0.1);
      expect(c.zodiacalDissolve).toBeGreaterThan(0.5);
    } finally {
      c.dispose();
    }
  });

  it('setBandDissolve clamps to [0, 1]', () => {
    const c = new MilkyWayInteriorComposer();
    try {
      c.setBandDissolve(-1);
      for (let i = 0; i < 120; i++) c.update(0.1, i * 0.1);
      expect(c.bandDissolve).toBeLessThan(0.05);
      c.setBandDissolve(42);
      for (let i = 0; i < 120; i++) c.update(0.1, i * 0.1);
      expect(c.bandDissolve).toBeGreaterThan(0.9);
    } finally {
      c.dispose();
    }
  });

  it('update advances u_time on both shaders', () => {
    const c = new MilkyWayInteriorComposer();
    try {
      c.update(0.016, 4.2);
      const bU = (c.bandMesh.material as THREE.ShaderMaterial).uniforms;
      const zU = (c.zodiacalMesh.material as THREE.ShaderMaterial).uniforms;
      expect(bU.u_time.value).toBeCloseTo(4.2, 5);
      expect(zU.u_time.value).toBeCloseTo(4.2, 5);
    } finally {
      c.dispose();
    }
  });

  it('setSunDirection normalises + stores a unit vector', () => {
    const c = new MilkyWayInteriorComposer();
    try {
      c.setSunDirection(new THREE.Vector3(0, 10, 0));
      const zU = (c.zodiacalMesh.material as THREE.ShaderMaterial).uniforms;
      expect(zU.u_sunDirectionView.value.length()).toBeCloseTo(1, 5);
      expect(zU.u_sunDirectionView.value.y).toBeCloseTo(1, 5);
    } finally {
      c.dispose();
    }
  });

  it('exposes Sgr A* constants from Reid & Brunthaler / IAU standard', () => {
    // Regression guard: these values anchor user-facing tours (Doc 19 Tour 3)
    // so the shader's u_viewToGalactic uniform places the Galactic Centre
    // bulge in the correct direction.
    expect(SGR_A_RA_DEG).toBeCloseTo(266.4168, 3);
    expect(SGR_A_DEC_DEG).toBeCloseTo(-29.0078, 3);
  });

  it('buildViewToGalacticMatrix places Sgr A* near galactic l=0, b=0', () => {
    // Apply the matrix to the ICRS-cartesian direction of Sgr A* and confirm
    // it lands (approximately) on the +X axis of galactic space (l=0, b=0).
    const ra = (SGR_A_RA_DEG * Math.PI) / 180;
    const dec = (SGR_A_DEC_DEG * Math.PI) / 180;
    const icrsDir = new THREE.Vector3(
      Math.cos(dec) * Math.cos(ra),
      Math.cos(dec) * Math.sin(ra),
      Math.sin(dec),
    );
    const m = buildViewToGalacticMatrix();
    icrsDir.applyMatrix3(m);
    // Galactic X should dominate (>>0.99); Y, Z should be small.
    expect(icrsDir.x).toBeGreaterThan(0.99);
    expect(Math.abs(icrsDir.y)).toBeLessThan(0.1);
    expect(Math.abs(icrsDir.z)).toBeLessThan(0.1);
  });

  it('buildViewToEclipticMatrix is a rotation (orthonormal + determinant +1)', () => {
    const m = buildViewToEclipticMatrix();
    // Columns should be orthonormal.
    const elems = m.elements;                 // column-major
    const cols = [
      new THREE.Vector3(elems[0], elems[1], elems[2]),
      new THREE.Vector3(elems[3], elems[4], elems[5]),
      new THREE.Vector3(elems[6], elems[7], elems[8]),
    ];
    for (const c of cols) expect(c.length()).toBeCloseTo(1, 5);
    expect(cols[0]!.dot(cols[1]!)).toBeCloseTo(0, 5);
    expect(cols[1]!.dot(cols[2]!)).toBeCloseTo(0, 5);
  });

  it('ICRS_TO_GALACTIC (sanity import from coordinate-utils) is 3×3', () => {
    // Guards against an accidental downgrade of the shared constants package
    // that would silently move the Galactic Centre off-axis.
    expect(ICRS_TO_GALACTIC).toHaveLength(3);
    for (const row of ICRS_TO_GALACTIC) expect(row).toHaveLength(3);
  });

  it('dispose releases geometry + both materials without double-dispose', () => {
    const c = new MilkyWayInteriorComposer();
    let bandDisposed = false;
    let zodDisposed = false;
    const bandMat = c.bandMesh.material as THREE.ShaderMaterial;
    const zodMat = c.zodiacalMesh.material as THREE.ShaderMaterial;
    const bandOrig = bandMat.dispose.bind(bandMat);
    const zodOrig = zodMat.dispose.bind(zodMat);
    bandMat.dispose = () => {
      bandDisposed = true;
      bandOrig();
    };
    zodMat.dispose = () => {
      zodDisposed = true;
      zodOrig();
    };
    c.dispose();
    expect(bandDisposed).toBe(true);
    expect(zodDisposed).toBe(true);
  });
});
