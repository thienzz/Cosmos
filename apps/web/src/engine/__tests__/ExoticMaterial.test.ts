/**
 * ExoticMaterial factory tests (T28).
 *
 * Follows the NebulaMaterial test pattern: we can't run GLSL in jsdom so each
 * test inspects the material's uniforms + defines. TS-VQA-006 "black hole
 * accretion disk animation ≥ 30 FPS" is a runtime check — at the factory
 * level we assert: palette round-trip, steps define, time advance, and
 * `u_cameraLocal` worldToLocal inversion.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  BLACK_HOLE_PALETTE,
  BLACK_HOLE_PARAMS,
  BOSON_PARAMS,
  COSMIC_STRING_PARAMS,
  DARK_ENERGY_VOID_PARAMS,
  DARK_MATTER_HALO_PARAMS,
  EXOTIC_KINDS,
  GRAVASTAR_PARAMS,
  MAGNETAR_PALETTE,
  MAGNETAR_PARAMS,
  NAKED_SINGULARITY_PARAMS,
  PLANCK_STAR_PARAMS,
  PREON_PARAMS,
  PRIMORDIAL_BH_PARAMS,
  PULSAR_PALETTE,
  PULSAR_PARAMS,
  QUARK_PARAMS,
  QUASI_STAR_PARAMS,
  STRANGE_PARAMS,
  TZO_PARAMS,
  WHITE_HOLE_PARAMS,
  WORMHOLE_PARAMS,
  type ExoticKind,
} from '@/utils/exoticPalette';
import { deltaE76, hexToRgb } from '@/utils/spectralColor';

import { createExoticMaterial } from '../ExoticMaterial';

function colorEqual(a: THREE.Color, hex: string): boolean {
  const b = new THREE.Color(hex);
  return (
    Math.abs(a.r - b.r) < 1e-5 &&
    Math.abs(a.g - b.g) < 1e-5 &&
    Math.abs(a.b - b.b) < 1e-5
  );
}

function colorToSrgbRgb(c: THREE.Color): { r: number; g: number; b: number } {
  const srgb = c.clone().convertLinearToSRGB();
  return { r: srgb.r, g: srgb.g, b: srgb.b };
}

describe('createExoticMaterial', () => {
  it.each(EXOTIC_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createExoticMaterial(kind);
    try {
      expect(handle.kind).toBe(kind);
      expect(handle.material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      expect(handle.material.name).toBe(`exotic:${kind}`);
      expect(handle.material.transparent).toBe(true);
      expect(handle.material.depthWrite).toBe(false);
      expect(handle.material.side).toBe(THREE.DoubleSide);
    } finally {
      handle.dispose();
    }
  });

  it.each(EXOTIC_KINDS)('%s: EXOTIC_STEPS define defaults to kind-specific param', (kind) => {
    const expectedSteps: Record<ExoticKind, number> = {
      blackhole:        BLACK_HOLE_PARAMS.steps,
      pulsar:           PULSAR_PARAMS.steps,
      magnetar:         MAGNETAR_PARAMS.steps,
      quark:            QUARK_PARAMS.steps,
      strange:          STRANGE_PARAMS.steps,
      preon:            PREON_PARAMS.steps,
      boson:            BOSON_PARAMS.steps,
      gravastar:        GRAVASTAR_PARAMS.steps,
      whitehole:        WHITE_HOLE_PARAMS.steps,
      wormhole:         WORMHOLE_PARAMS.steps,
      nakedsingularity: NAKED_SINGULARITY_PARAMS.steps,
      cosmicstring:     COSMIC_STRING_PARAMS.steps,
      darkmatterhalo:   DARK_MATTER_HALO_PARAMS.steps,
      darkenergyvoid:   DARK_ENERGY_VOID_PARAMS.steps,
      tzo:              TZO_PARAMS.steps,
      primordialbh:     PRIMORDIAL_BH_PARAMS.steps,
      quasistar:        QUASI_STAR_PARAMS.steps,
      planckstar:       PLANCK_STAR_PARAMS.steps,
    };
    const handle = createExoticMaterial(kind);
    try {
      const defines = handle.material.defines as Record<string, string>;
      expect(defines.EXOTIC_STEPS).toBe(String(expectedSteps[kind]));
    } finally {
      handle.dispose();
    }
  });

  it('stepsOverride replaces the default EXOTIC_STEPS value', () => {
    const handle = createExoticMaterial('blackhole', { stepsOverride: 96 });
    try {
      const defines = handle.material.defines as Record<string, string>;
      expect(defines.EXOTIC_STEPS).toBe('96');
    } finally {
      handle.dispose();
    }
  });

  // -------------------------------------------------------------------------
  // Palette round-trips — every uniform colour matches the source hex exactly.
  // -------------------------------------------------------------------------

  it('blackhole: palette uniforms match BLACK_HOLE_PALETTE exactly', () => {
    const handle = createExoticMaterial('blackhole');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_horizonColor.value, BLACK_HOLE_PALETTE.horizonColor)).toBe(true);
      expect(colorEqual(u.u_photonRingColor.value, BLACK_HOLE_PALETTE.photonRingColor)).toBe(true);
      expect(colorEqual(u.u_diskInnerColor.value, BLACK_HOLE_PALETTE.diskInnerColor)).toBe(true);
      expect(colorEqual(u.u_diskMidColor.value, BLACK_HOLE_PALETTE.diskMidColor)).toBe(true);
      expect(colorEqual(u.u_diskOuterColor.value, BLACK_HOLE_PALETTE.diskOuterColor)).toBe(true);
      expect(colorEqual(u.u_jetColor.value, BLACK_HOLE_PALETTE.jetColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('blackhole: diskTiltOverride + diskRotationOverride propagate', () => {
    const handle = createExoticMaterial('blackhole', {
      diskTiltOverride: 1.1,
      diskRotationOverride: 0.75,
    });
    try {
      expect(handle.material.uniforms.u_diskTilt.value).toBe(1.1);
      expect(handle.material.uniforms.u_diskRotationRate.value).toBe(0.75);
    } finally {
      handle.dispose();
    }
  });

  it('blackhole: horizon is pure black (Doc 18 §Event Horizon)', () => {
    const handle = createExoticMaterial('blackhole');
    try {
      const c = handle.material.uniforms.u_horizonColor.value as THREE.Color;
      expect(c.r).toBe(0);
      expect(c.g).toBe(0);
      expect(c.b).toBe(0);
    } finally {
      handle.dispose();
    }
  });

  it('pulsar: palette uniforms match PULSAR_PALETTE exactly', () => {
    const handle = createExoticMaterial('pulsar');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_coreColor.value, PULSAR_PALETTE.coreColor)).toBe(true);
      expect(colorEqual(u.u_beamColor.value, PULSAR_PALETTE.beamColor)).toBe(true);
      expect(colorEqual(u.u_polarCapColor.value, PULSAR_PALETTE.polarCapColor)).toBe(true);
      expect(colorEqual(u.u_windNebulaColor.value, PULSAR_PALETTE.windNebulaColor)).toBe(true);
      expect(colorEqual(u.u_fieldColor.value, PULSAR_PALETTE.fieldColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('pulsar: pulseFrequencyOverride + magneticTiltOverride propagate', () => {
    const handle = createExoticMaterial('pulsar', {
      pulseFrequencyOverride: 29.9, // Crab Pulsar
      magneticTiltOverride: 0.9,
    });
    try {
      expect(handle.material.uniforms.u_pulseFrequency.value).toBe(29.9);
      expect(handle.material.uniforms.u_magneticTiltRad.value).toBe(0.9);
    } finally {
      handle.dispose();
    }
  });

  it('magnetar: palette uniforms match MAGNETAR_PALETTE exactly', () => {
    const handle = createExoticMaterial('magnetar');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_surfaceColor.value, MAGNETAR_PALETTE.surfaceColor)).toBe(true);
      expect(colorEqual(u.u_fieldHotColor.value, MAGNETAR_PALETTE.fieldHotColor)).toBe(true);
      expect(colorEqual(u.u_fieldCoolColor.value, MAGNETAR_PALETTE.fieldCoolColor)).toBe(true);
      expect(colorEqual(u.u_polarCapColor.value, MAGNETAR_PALETTE.polarCapColor)).toBe(true);
      expect(colorEqual(u.u_reconnectionColor.value, MAGNETAR_PALETTE.reconnectionColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('magnetar: flareIntensity + fieldTwistOverride propagate', () => {
    const handle = createExoticMaterial('magnetar', {
      flareIntensity: 0.4,
      fieldTwistOverride: 5.0,
    });
    try {
      expect(handle.material.uniforms.u_flareIntensity.value).toBe(0.4);
      expect(handle.material.uniforms.u_fieldTwist.value).toBe(5.0);
    } finally {
      handle.dispose();
    }
  });

  it('magnetar: flare defaults to 0 (no active starquake)', () => {
    const handle = createExoticMaterial('magnetar');
    try {
      expect(handle.material.uniforms.u_flareIntensity.value).toBe(
        MAGNETAR_PARAMS.flareIntensity,
      );
      expect(handle.material.uniforms.u_flareIntensity.value).toBe(0);
    } finally {
      handle.dispose();
    }
  });

  // -------------------------------------------------------------------------
  // update() — u_time advances, u_cameraLocal reflects worldToLocal inversion.
  // -------------------------------------------------------------------------

  it.each(EXOTIC_KINDS)('%s: update() advances u_time and writes u_cameraLocal', (kind) => {
    const handle = createExoticMaterial(kind);
    try {
      const initialTime = handle.material.uniforms.u_time.value as number;
      const cameraWorld = new THREE.Vector3(3, 0, 7);
      // Mesh translated (+5, 0, 0) → cameraLocal = (-2, 0, 7).
      const meshMatrix = new THREE.Matrix4().makeTranslation(5, 0, 0);
      handle.update(0.016, 1.2, cameraWorld, meshMatrix);
      expect(handle.material.uniforms.u_time.value).toBeGreaterThan(initialTime);
      const local = handle.material.uniforms.u_cameraLocal.value as THREE.Vector3;
      expect(local.x).toBeCloseTo(-2, 5);
      expect(local.y).toBeCloseTo(0, 5);
      expect(local.z).toBeCloseTo(7, 5);
    } finally {
      handle.dispose();
    }
  });

  it('update() handles a mesh with rotation + scale in the worldToLocal inversion', () => {
    const handle = createExoticMaterial('pulsar');
    try {
      // Scale 2× along each axis, then translate (0, 0, -10).
      const meshMatrix = new THREE.Matrix4()
        .makeScale(2, 2, 2)
        .setPosition(0, 0, -10);
      const cameraWorld = new THREE.Vector3(0, 0, 0);
      handle.update(0.016, 0.5, cameraWorld, meshMatrix);
      const local = handle.material.uniforms.u_cameraLocal.value as THREE.Vector3;
      const expected = cameraWorld.clone().applyMatrix4(meshMatrix.clone().invert());
      expect(local.x).toBeCloseTo(expected.x, 5);
      expect(local.y).toBeCloseTo(expected.y, 5);
      expect(local.z).toBeCloseTo(expected.z, 5);
    } finally {
      handle.dispose();
    }
  });

  it('dispose() disposes the underlying ShaderMaterial', () => {
    const handle = createExoticMaterial('blackhole');
    let disposed = false;
    const original = handle.material.dispose.bind(handle.material);
    handle.material.dispose = () => {
      disposed = true;
      original();
    };
    handle.dispose();
    expect(disposed).toBe(true);
  });

  // -------------------------------------------------------------------------
  // TS-VQA-006: black-hole palette stays close to Doc 18 reference hex.
  // Like TS-VQA-003, every colour is inserted and read back from the same
  // THREE.Color construction — ΔE should be ≈0. The threshold guards against
  // future refactors silently remapping a hex.
  // -------------------------------------------------------------------------
  it('blackhole: disk + jet palette stays within ΔE76 < 8.0 of Doc 18 hex', () => {
    const handle = createExoticMaterial('blackhole');
    try {
      const u = handle.material.uniforms;
      const pairs: Array<[THREE.Color, string]> = [
        [u.u_diskInnerColor.value, BLACK_HOLE_PALETTE.diskInnerColor],
        [u.u_diskMidColor.value, BLACK_HOLE_PALETTE.diskMidColor],
        [u.u_diskOuterColor.value, BLACK_HOLE_PALETTE.diskOuterColor],
        [u.u_jetColor.value, BLACK_HOLE_PALETTE.jetColor],
        [u.u_photonRingColor.value, BLACK_HOLE_PALETTE.photonRingColor],
      ];
      for (const [uniformColor, hex] of pairs) {
        const dE = deltaE76(colorToSrgbRgb(uniformColor), hexToRgb(hex));
        expect(dE).toBeLessThan(8.0);
      }
    } finally {
      handle.dispose();
    }
  });

  it('pulsar: core + beam stay within ΔE76 < 8.0 of Doc 22 ENT-1020 hex', () => {
    const handle = createExoticMaterial('pulsar');
    try {
      const u = handle.material.uniforms;
      const pairs: Array<[THREE.Color, string]> = [
        [u.u_coreColor.value, PULSAR_PALETTE.coreColor],
        [u.u_beamColor.value, PULSAR_PALETTE.beamColor],
        [u.u_windNebulaColor.value, PULSAR_PALETTE.windNebulaColor],
      ];
      for (const [uniformColor, hex] of pairs) {
        const dE = deltaE76(colorToSrgbRgb(uniformColor), hexToRgb(hex));
        expect(dE).toBeLessThan(8.0);
      }
    } finally {
      handle.dispose();
    }
  });

  it('magnetar: surface + field palette stays within ΔE76 < 8.0 of Doc 22 hex', () => {
    const handle = createExoticMaterial('magnetar');
    try {
      const u = handle.material.uniforms;
      const pairs: Array<[THREE.Color, string]> = [
        [u.u_surfaceColor.value, MAGNETAR_PALETTE.surfaceColor],
        [u.u_fieldHotColor.value, MAGNETAR_PALETTE.fieldHotColor],
        [u.u_polarCapColor.value, MAGNETAR_PALETTE.polarCapColor],
      ];
      for (const [uniformColor, hex] of pairs) {
        const dE = deltaE76(colorToSrgbRgb(uniformColor), hexToRgb(hex));
        expect(dE).toBeLessThan(8.0);
      }
    } finally {
      handle.dispose();
    }
  });
});
