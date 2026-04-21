/**
 * MoonMaterial factory tests (T43).
 *
 * Mirrors the PlanetMaterial test suite — verifies every moon kind produces
 * a valid GLSL3 ShaderMaterial with the right `#define MOON_*` and palette
 * uniforms from `moonPalette`. GLSL execution is jsdom-incompatible; we
 * focus on the CPU-visible contract.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  ALL_MOON_KINDS,
  MOON_PALETTES,
  MOON_PARAMS,
  familyOf,
  type MoonKind,
} from '@/utils/moonPalette';

import { createMoonMaterial } from '../MoonMaterial';

function colorEqual(a: THREE.Color, hex: string): boolean {
  const b = new THREE.Color(hex);
  return (
    Math.abs(a.r - b.r) < 1e-5 &&
    Math.abs(a.g - b.g) < 1e-5 &&
    Math.abs(a.b - b.b) < 1e-5
  );
}

const DEFINE_FOR: Record<MoonKind, string> = {
  luna: 'MOON_LUNA',
  callisto: 'MOON_CALLISTO',
  irregular: 'MOON_IRREGULAR',
  io: 'MOON_IO',
  'tidal-heated': 'MOON_TIDAL_HEATED',
  europa: 'MOON_EUROPA',
  enceladus: 'MOON_ENCELADUS',
  ganymede: 'MOON_GANYMEDE',
  'subsurface-ocean': 'MOON_SUBSURFACE_OCEAN',
  titan: 'MOON_TITAN',
  triton: 'MOON_TRITON',
  miranda: 'MOON_MIRANDA',
  hyperion: 'MOON_HYPERION',
  shepherd: 'MOON_SHEPHERD',
  'trojan-moon': 'MOON_TROJAN_MOON',
  binary: 'MOON_BINARY',
};

describe('createMoonMaterial', () => {
  it.each(ALL_MOON_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createMoonMaterial(kind);
    try {
      expect(handle.kind).toBe(kind);
      expect(handle.family).toBe(familyOf(kind));
      expect(handle.material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      expect(handle.material.name).toContain(kind);
    } finally {
      handle.dispose();
    }
  });

  it.each(ALL_MOON_KINDS)('%s: sets only the expected MOON_* define', (kind) => {
    const handle = createMoonMaterial(kind);
    try {
      const defines = handle.material.defines as Record<string, string>;
      expect(defines).toHaveProperty(DEFINE_FOR[kind]);
      for (const other of ALL_MOON_KINDS) {
        if (other === kind) continue;
        expect(defines).not.toHaveProperty(DEFINE_FOR[other]);
      }
    } finally {
      handle.dispose();
    }
  });

  it.each(ALL_MOON_KINDS)('%s: palette uniforms match moonPalette', (kind) => {
    const handle = createMoonMaterial(kind);
    try {
      const palette = MOON_PALETTES[kind];
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_baseColor.value, palette.baseColor)).toBe(true);
      expect(colorEqual(u.u_highlightColor.value, palette.highlightColor)).toBe(true);
      expect(colorEqual(u.u_shadowColor.value, palette.shadowColor)).toBe(true);
      expect(colorEqual(u.u_poleColor.value, palette.poleColor)).toBe(true);
      expect(colorEqual(u.u_atmosphereTint.value, palette.atmosphereTint)).toBe(true);
      expect(colorEqual(u.u_emissiveColor.value, palette.emissiveColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it.each(ALL_MOON_KINDS)('%s: feature uniforms reflect MOON_PARAMS', (kind) => {
    const handle = createMoonMaterial(kind);
    try {
      const params = MOON_PARAMS[kind];
      const u = handle.material.uniforms;
      expect(u.u_atmosphereStrength.value).toBe(params.atmosphereStrength);
      expect(u.u_emissiveStrength.value).toBe(params.emissiveStrength);
      expect(u.u_plumeIntensity.value).toBe(params.plumeIntensity);
      expect(u.u_craterIntensity.value).toBe(params.craterIntensity);
      expect(u.u_polarCapExtent.value).toBe(params.polarCapExtentDeg);
      expect(u.u_limbDarkening.value).toBe(params.limbDarkening);
      expect(u.u_ambientFloor.value).toBe(params.ambientFloor);
    } finally {
      handle.dispose();
    }
  });

  it('update() advances u_rotation by deltaSec * rotationRadPerSec', () => {
    const handle = createMoonMaterial('luna');
    try {
      const initial = handle.material.uniforms.u_rotation.value;
      handle.update(10, 10, new THREE.Vector3(1, 0, 0));
      const after = handle.material.uniforms.u_rotation.value;
      expect(after - initial).toBeCloseTo(
        10 * MOON_PARAMS.luna.rotationRadPerSec,
        8,
      );
    } finally {
      handle.dispose();
    }
  });

  it('update() copies sun direction into the uniform', () => {
    const handle = createMoonMaterial('io');
    try {
      const sun = new THREE.Vector3(0.3, -0.1, 0.7);
      handle.update(1, 1, sun);
      const stored = handle.material.uniforms.u_sunDir.value as THREE.Vector3;
      expect(stored.x).toBeCloseTo(sun.x);
      expect(stored.y).toBeCloseTo(sun.y);
      expect(stored.z).toBeCloseTo(sun.z);
    } finally {
      handle.dispose();
    }
  });

  it('Triton rotates retrograde (negative rotationRadPerSec)', () => {
    const handle = createMoonMaterial('triton');
    try {
      handle.update(5, 5, new THREE.Vector3(1, 0, 0));
      expect(handle.material.uniforms.u_rotation.value).toBeLessThan(0);
    } finally {
      handle.dispose();
    }
  });

  it('ambientOverride overrides MOON_PARAMS.ambientFloor', () => {
    const handle = createMoonMaterial('luna', { ambientOverride: 0.42 });
    try {
      expect(handle.material.uniforms.u_ambientFloor.value).toBe(0.42);
    } finally {
      handle.dispose();
    }
  });

  it('emissiveOverride overrides MOON_PARAMS.emissiveStrength', () => {
    const handle = createMoonMaterial('io', { emissiveOverride: 3.0 });
    try {
      expect(handle.material.uniforms.u_emissiveStrength.value).toBe(3.0);
    } finally {
      handle.dispose();
    }
  });

  it('dispose() releases the material', () => {
    const handle = createMoonMaterial('titan');
    const disposeSpy = { called: false };
    const original = handle.material.dispose.bind(handle.material);
    handle.material.dispose = () => {
      disposeSpy.called = true;
      original();
    };
    handle.dispose();
    expect(disposeSpy.called).toBe(true);
  });

  it('families map each kind to exactly one of the 6 family shaders', () => {
    const families = new Set(ALL_MOON_KINDS.map((k) => familyOf(k)));
    expect(families.size).toBe(6);
    expect(families).toEqual(
      new Set(['rocky', 'volcanic', 'icy', 'atmospheric', 'extreme', 'minor']),
    );
  });
});
