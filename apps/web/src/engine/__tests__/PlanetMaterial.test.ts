/**
 * PlanetMaterial factory tests.
 *
 * Verifies that every planet kind produces a valid THREE.ShaderMaterial with
 * the correct `#define` and uniforms wired from planetPalette. We can't run
 * GLSL in jsdom, so the test focuses on:
 *   - The material instance is a ShaderMaterial with the expected name.
 *   - The correct PLANET_<KIND> define is present, and no other body's
 *     define leaks in.
 *   - Palette uniforms round-trip to the exact Color values from the palette.
 *   - `update()` advances u_rotation / u_time, mutates u_sunDir.
 *   - Dispose releases the material.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  GAS_PALETTES,
  GAS_PARAMS,
  ROCKY_PALETTES,
  ROCKY_PARAMS,
  type GasGiantKind,
  type PlanetKind,
  type RockyPlanetKind,
} from '@/utils/planetPalette';

import { createPlanetMaterial } from '../PlanetMaterial';

const ROCKY_KINDS: RockyPlanetKind[] = ['mercury', 'venus', 'earth', 'mars'];
const GAS_KINDS: GasGiantKind[] = ['jupiter', 'saturn', 'uranus', 'neptune'];
const ALL_KINDS: PlanetKind[] = [...ROCKY_KINDS, ...GAS_KINDS];

function colorEqual(a: THREE.Color, hex: string): boolean {
  const b = new THREE.Color(hex);
  return (
    Math.abs(a.r - b.r) < 1e-5 &&
    Math.abs(a.g - b.g) < 1e-5 &&
    Math.abs(a.b - b.b) < 1e-5
  );
}

describe('createPlanetMaterial', () => {
  it.each(ALL_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createPlanetMaterial(kind);
    try {
      expect(handle.kind).toBe(kind);
      expect(handle.material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      expect(handle.material.name).toMatch(kind);
    } finally {
      handle.dispose();
    }
  });

  it.each(ALL_KINDS)('%s: sets the correct PLANET_<KIND> define only', (kind) => {
    const handle = createPlanetMaterial(kind);
    try {
      const defines = handle.material.defines as Record<string, string>;
      const expected = `PLANET_${kind.toUpperCase()}`;
      expect(defines).toHaveProperty(expected);
      for (const otherKind of ALL_KINDS) {
        if (otherKind === kind) continue;
        const unexpected = `PLANET_${otherKind.toUpperCase()}`;
        expect(defines).not.toHaveProperty(unexpected);
      }
    } finally {
      handle.dispose();
    }
  });

  it.each(ROCKY_KINDS)('%s: palette uniforms match planetPalette', (kind) => {
    const handle = createPlanetMaterial(kind);
    try {
      const palette = ROCKY_PALETTES[kind];
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_baseColor.value, palette.baseColor)).toBe(true);
      expect(colorEqual(u.u_highlightColor.value, palette.highlightColor)).toBe(true);
      expect(colorEqual(u.u_shadowColor.value, palette.shadowColor)).toBe(true);
      expect(colorEqual(u.u_poleColor.value, palette.poleColor)).toBe(true);
      expect(colorEqual(u.u_atmosphereTint.value, palette.atmosphereTint)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it.each(GAS_KINDS)('%s: palette uniforms match planetPalette', (kind) => {
    const handle = createPlanetMaterial(kind);
    try {
      const palette = GAS_PALETTES[kind];
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_zoneColor.value, palette.zoneColor)).toBe(true);
      expect(colorEqual(u.u_beltColor.value, palette.beltColor)).toBe(true);
      expect(colorEqual(u.u_poleColor.value, palette.poleColor)).toBe(true);
      expect(colorEqual(u.u_spotColor.value, palette.spotColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it.each(ROCKY_KINDS)('%s: feature uniforms reflect ROCKY_PARAMS', (kind) => {
    const handle = createPlanetMaterial(kind);
    try {
      const params = ROCKY_PARAMS[kind];
      const u = handle.material.uniforms;
      expect(u.u_cloudCoverage.value).toBe(params.cloudCoverage);
      expect(u.u_cloudOpacity.value).toBe(params.cloudOpacity);
      expect(u.u_atmosphereStrength.value).toBe(params.atmosphereStrength);
      expect(u.u_craterIntensity.value).toBe(params.craterIntensity);
      expect(u.u_polarCapExtent.value).toBe(params.polarCapExtentDeg);
      expect(u.u_nightEmission.value).toBe(params.nightEmission);
    } finally {
      handle.dispose();
    }
  });

  it.each(GAS_KINDS)('%s: feature uniforms reflect GAS_PARAMS', (kind) => {
    const handle = createPlanetMaterial(kind);
    try {
      const params = GAS_PARAMS[kind];
      const u = handle.material.uniforms;
      expect(u.u_bandCount.value).toBe(params.bandCount);
      expect(u.u_bandIntensity.value).toBe(params.bandIntensity);
      expect(u.u_spotIntensity.value).toBe(params.spotIntensity);
      expect(u.u_hexagonStrength.value).toBe(params.hexagonStrength);
    } finally {
      handle.dispose();
    }
  });

  it('update() advances u_rotation by deltaSec * rotationRadPerSec', () => {
    const handle = createPlanetMaterial('earth');
    try {
      const initial = handle.material.uniforms.u_rotation.value;
      handle.update(10, 10, new THREE.Vector3(1, 0, 0));
      const after = handle.material.uniforms.u_rotation.value;
      // Earth rotates 2π per 86,400 s → 10 s = ~0.000727 rad.
      expect(after - initial).toBeGreaterThan(0);
      expect(after - initial).toBeCloseTo(
        10 * ROCKY_PARAMS.earth.rotationRadPerSec,
        8,
      );
    } finally {
      handle.dispose();
    }
  });

  it('update() copies sun direction into the uniform', () => {
    const handle = createPlanetMaterial('jupiter');
    try {
      const sun = new THREE.Vector3(0.5, 0.2, -0.8);
      handle.update(1, 1, sun);
      const stored = handle.material.uniforms.u_sunDir.value as THREE.Vector3;
      expect(stored.x).toBeCloseTo(sun.x);
      expect(stored.y).toBeCloseTo(sun.y);
      expect(stored.z).toBeCloseTo(sun.z);
    } finally {
      handle.dispose();
    }
  });

  it('ambientOverride overrides ROCKY_PARAMS.ambientFloor', () => {
    const handle = createPlanetMaterial('earth', { ambientOverride: 0.42 });
    try {
      expect(handle.material.uniforms.u_ambientFloor.value).toBe(0.42);
    } finally {
      handle.dispose();
    }
  });

  it('atmosphereOverride overrides GAS_PARAMS.atmosphereStrength', () => {
    const handle = createPlanetMaterial('uranus', { atmosphereOverride: 1.5 });
    try {
      expect(handle.material.uniforms.u_atmosphereStrength.value).toBe(1.5);
    } finally {
      handle.dispose();
    }
  });

  it('dispose() releases the material', () => {
    const handle = createPlanetMaterial('mars');
    const disposeSpy = {
      called: false,
    };
    const original = handle.material.dispose.bind(handle.material);
    handle.material.dispose = () => {
      disposeSpy.called = true;
      original();
    };
    handle.dispose();
    expect(disposeSpy.called).toBe(true);
  });
});
