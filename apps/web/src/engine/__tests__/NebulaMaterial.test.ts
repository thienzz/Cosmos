/**
 * NebulaMaterial factory tests (T27 + T45).
 *
 * As with PlanetMaterial.test.ts, we can't run GLSL in jsdom so each test
 * reads back the material's uniforms and defines. TS-VQA-003 (nebula ΔE <
 * 4.0) is asserted via Doc 18 reference hex → uniform colour ΔE76. The
 * raymarch step count and shader name are both inspected to confirm the
 * compile-time `#define NEBULA_STEPS` + the kind-specific material name.
 *
 * T45 extends coverage to the 8 families + 14 subtypes.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  DARK_PALETTE,
  DARK_PARAMS,
  EMISSION_PALETTE,
  EMISSION_PARAMS,
  NEBULA_KINDS,
  NEBULA_SUBTYPES,
  PLANETARY_PALETTE,
  PLANETARY_PARAMS,
  PROTOPLANETARY_PALETTE,
  PROTOPLANETARY_PARAMS,
  REFLECTION_PALETTE,
  REFLECTION_PARAMS,
  SUPERBUBBLE_PALETTE,
  SUPERBUBBLE_PARAMS,
  SUPERNOVA_PALETTE,
  SUPERNOVA_PARAMS,
  WOLF_RAYET_PALETTE,
  WOLF_RAYET_PARAMS,
  subtypeToKind,
  type NebulaKind,
} from '@/utils/nebulaPalette';
import { deltaE76, hexToRgb } from '@/utils/spectralColor';

import { createNebulaMaterial, createNebulaMaterialForSubtype } from '../NebulaMaterial';

function colorEqual(a: THREE.Color, hex: string): boolean {
  const b = new THREE.Color(hex);
  return (
    Math.abs(a.r - b.r) < 1e-5 &&
    Math.abs(a.g - b.g) < 1e-5 &&
    Math.abs(a.b - b.b) < 1e-5
  );
}

// `THREE.Color` stores RGB in linear space when Three's color management is
// enabled (default in r184). `deltaE76` / `rgbToLab` expect sRGB 0–1, so we
// reverse the gamma encoding before comparing.
function colorToSrgbRgb(c: THREE.Color): { r: number; g: number; b: number } {
  const srgb = c.clone().convertLinearToSRGB();
  return { r: srgb.r, g: srgb.g, b: srgb.b };
}

describe('createNebulaMaterial', () => {
  it('NEBULA_KINDS lists 8 shader families (T45)', () => {
    expect(NEBULA_KINDS).toHaveLength(8);
  });

  it('NEBULA_SUBTYPES lists 14 catalog subtypes (T45)', () => {
    expect(NEBULA_SUBTYPES).toHaveLength(14);
  });

  it.each(NEBULA_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createNebulaMaterial(kind);
    try {
      expect(handle.kind).toBe(kind);
      expect(handle.material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      expect(handle.material.name).toBe(`nebula:${kind}`);
      expect(handle.material.transparent).toBe(true);
      expect(handle.material.depthWrite).toBe(false);
      expect(handle.material.side).toBe(THREE.DoubleSide);
    } finally {
      handle.dispose();
    }
  });

  it.each(NEBULA_KINDS)('%s: NEBULA_STEPS define defaults to kind-specific param', (kind) => {
    const expectedSteps: Record<NebulaKind, number> = {
      emission: EMISSION_PARAMS.steps,
      reflection: REFLECTION_PARAMS.steps,
      dark: DARK_PARAMS.steps,
      planetary: PLANETARY_PARAMS.steps,
      supernova: SUPERNOVA_PARAMS.steps,
      wolfrayet: WOLF_RAYET_PARAMS.steps,
      protoplanetary: PROTOPLANETARY_PARAMS.steps,
      superbubble: SUPERBUBBLE_PARAMS.steps,
    };
    const handle = createNebulaMaterial(kind);
    try {
      const defines = handle.material.defines as Record<string, string>;
      expect(defines.NEBULA_STEPS).toBe(String(expectedSteps[kind]));
    } finally {
      handle.dispose();
    }
  });

  it('stepsOverride replaces the default NEBULA_STEPS value', () => {
    const handle = createNebulaMaterial('emission', { stepsOverride: 96 });
    try {
      const defines = handle.material.defines as Record<string, string>;
      expect(defines.NEBULA_STEPS).toBe('96');
    } finally {
      handle.dispose();
    }
  });

  it('emission: palette uniforms match EMISSION_PALETTE exactly', () => {
    const handle = createNebulaMaterial('emission');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_haColor.value, EMISSION_PALETTE.haColor)).toBe(true);
      expect(colorEqual(u.u_oiiiColor.value, EMISSION_PALETTE.oiiiColor)).toBe(true);
      expect(colorEqual(u.u_siiColor.value, EMISSION_PALETTE.siiColor)).toBe(true);
      expect(colorEqual(u.u_niiColor.value, EMISSION_PALETTE.niiColor)).toBe(true);
      expect(u.u_variant.value).toBe(0);
    } finally {
      handle.dispose();
    }
  });

  it('reflection: palette + star direction are normalised', () => {
    const handle = createNebulaMaterial('reflection', {
      starDirLocal: new THREE.Vector3(10, 0, 0),
    });
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_scatterColor.value, REFLECTION_PALETTE.scatterColor)).toBe(true);
      expect(colorEqual(u.u_starColor.value, REFLECTION_PALETTE.starColor)).toBe(true);
      const dir = u.u_starDirLocal.value as THREE.Vector3;
      expect(dir.length()).toBeCloseTo(1, 5);
      expect(dir.x).toBeCloseTo(1, 5);
    } finally {
      handle.dispose();
    }
  });

  it('dark: palette + extinction param round-trip', () => {
    const handle = createNebulaMaterial('dark');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_reddeningTint.value, DARK_PALETTE.reddeningTint)).toBe(true);
      expect(colorEqual(u.u_dustColor.value, DARK_PALETTE.dustColor)).toBe(true);
      expect(u.u_extinction.value).toBe(DARK_PARAMS.extinction);
      expect(u.u_coreSharpness.value).toBe(DARK_PARAMS.coreSharpness);
    } finally {
      handle.dispose();
    }
  });

  it('planetary: 4 shell colours + geometry params round-trip', () => {
    const handle = createNebulaMaterial('planetary');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_coreColor.value, PLANETARY_PALETTE.coreColor)).toBe(true);
      expect(colorEqual(u.u_innerColor.value, PLANETARY_PALETTE.innerColor)).toBe(true);
      expect(colorEqual(u.u_middleColor.value, PLANETARY_PALETTE.middleColor)).toBe(true);
      expect(colorEqual(u.u_outerColor.value, PLANETARY_PALETTE.outerColor)).toBe(true);
      expect(u.u_shellInner.value).toBe(PLANETARY_PARAMS.shellInner);
      expect(u.u_shellMiddle.value).toBe(PLANETARY_PARAMS.shellMiddle);
      expect(u.u_shellOuter.value).toBe(PLANETARY_PARAMS.shellOuter);
      expect(u.u_irregularity.value).toBe(PLANETARY_PARAMS.irregularity);
    } finally {
      handle.dispose();
    }
  });

  it('planetary: bipolarOverride replaces the default ratio', () => {
    const handle = createNebulaMaterial('planetary', { bipolarOverride: 0.85 });
    try {
      expect(handle.material.uniforms.u_bipolarRatio.value).toBe(0.85);
    } finally {
      handle.dispose();
    }
  });

  it('supernova: palette + expansion velocity round-trip', () => {
    const handle = createNebulaMaterial('supernova');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_synchrotronColor.value, SUPERNOVA_PALETTE.synchrotronColor)).toBe(true);
      expect(colorEqual(u.u_filamentColor.value, SUPERNOVA_PALETTE.filamentColor)).toBe(true);
      expect(colorEqual(u.u_pulsarColor.value, SUPERNOVA_PALETTE.pulsarColor)).toBe(true);
      expect(u.u_expansionVelocity.value).toBe(SUPERNOVA_PARAMS.expansionVelocity);
      expect(u.u_pulsarIntensity.value).toBe(0.9);
    } finally {
      handle.dispose();
    }
  });

  it('supernova: pulsarIntensity=0 disables the core glow', () => {
    const handle = createNebulaMaterial('supernova', { pulsarIntensity: 0 });
    try {
      expect(handle.material.uniforms.u_pulsarIntensity.value).toBe(0);
    } finally {
      handle.dispose();
    }
  });

  it('wolfrayet: palette + shell geometry round-trip', () => {
    const handle = createNebulaMaterial('wolfrayet');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_haColor.value, WOLF_RAYET_PALETTE.haColor)).toBe(true);
      expect(colorEqual(u.u_oiiiColor.value, WOLF_RAYET_PALETTE.oiiiColor)).toBe(true);
      expect(u.u_shellRadius.value).toBe(WOLF_RAYET_PARAMS.shellRadius);
      expect(u.u_clumpiness.value).toBe(WOLF_RAYET_PARAMS.clumpiness);
      expect(u.u_crescent.value).toBe(WOLF_RAYET_PARAMS.crescent);
    } finally {
      handle.dispose();
    }
  });

  it('protoplanetary: disk + gap geometry round-trip', () => {
    const handle = createNebulaMaterial('protoplanetary');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_hotDustColor.value, PROTOPLANETARY_PALETTE.hotDustColor)).toBe(true);
      expect(colorEqual(u.u_coolDustColor.value, PROTOPLANETARY_PALETTE.coolDustColor)).toBe(true);
      expect(u.u_outerRadius.value).toBe(PROTOPLANETARY_PARAMS.outerRadius);
      expect(u.u_innerRadius.value).toBe(PROTOPLANETARY_PARAMS.innerRadius);
      expect(u.u_gap1Radius.value).toBe(PROTOPLANETARY_PARAMS.gap1Radius);
      expect(u.u_gap2Radius.value).toBe(PROTOPLANETARY_PARAMS.gap2Radius);
    } finally {
      handle.dispose();
    }
  });

  it('superbubble: shell + interior uniforms round-trip', () => {
    const handle = createNebulaMaterial('superbubble');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_shellHaColor.value, SUPERBUBBLE_PALETTE.shellHaColor)).toBe(true);
      expect(colorEqual(u.u_interiorColor.value, SUPERBUBBLE_PALETTE.interiorColor)).toBe(true);
      expect(u.u_shellRadius.value).toBe(SUPERBUBBLE_PARAMS.shellRadius);
      expect(u.u_blowout.value).toBe(SUPERBUBBLE_PARAMS.blowout);
      expect(u.u_interiorDensity.value).toBe(SUPERBUBBLE_PARAMS.interiorDensity);
    } finally {
      handle.dispose();
    }
  });

  it('update() advances u_time and copies camera into the local-space uniform', () => {
    const handle = createNebulaMaterial('emission');
    try {
      const initialTime = handle.material.uniforms.u_time.value as number;
      const cameraWorld = new THREE.Vector3(5, 0, 10);
      // Mesh matrixWorld = translate(10, 0, 0) → cameraLocal = (-5, 0, 10).
      const meshMatrix = new THREE.Matrix4().makeTranslation(10, 0, 0);
      handle.update(0.016, 0.5, cameraWorld, meshMatrix);
      expect(handle.material.uniforms.u_time.value).toBeGreaterThan(initialTime);
      const cameraLocal = handle.material.uniforms.u_cameraLocal.value as THREE.Vector3;
      expect(cameraLocal.x).toBeCloseTo(-5, 5);
      expect(cameraLocal.y).toBeCloseTo(0, 5);
      expect(cameraLocal.z).toBeCloseTo(10, 5);
    } finally {
      handle.dispose();
    }
  });

  it('update() handles a mesh with rotation+translation in the worldToLocal inversion', () => {
    const handle = createNebulaMaterial('planetary');
    try {
      const meshMatrix = new THREE.Matrix4()
        .makeRotationY(Math.PI / 2)
        .setPosition(0, 0, -20);
      const cameraWorld = new THREE.Vector3(0, 0, 0);
      handle.update(0.016, 1, cameraWorld, meshMatrix);
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
    const handle = createNebulaMaterial('dark');
    let disposed = false;
    const original = handle.material.dispose.bind(handle.material);
    handle.material.dispose = () => {
      disposed = true;
      original();
    };
    handle.dispose();
    expect(disposed).toBe(true);
  });

  // ---------------------------------------------------------------------
  // TS-VQA-003: nebula ΔE76 < 4.0 vs Doc 18 / Doc 17 reference hex.
  // ---------------------------------------------------------------------
  it('emission: palette uniforms stay within ΔE76 < 4.0 of Doc 18 hex', () => {
    const handle = createNebulaMaterial('emission');
    try {
      const u = handle.material.uniforms;
      const pairs: Array<[THREE.Color, string]> = [
        [u.u_haColor.value, EMISSION_PALETTE.haColor],
        [u.u_oiiiColor.value, EMISSION_PALETTE.oiiiColor],
        [u.u_siiColor.value, EMISSION_PALETTE.siiColor],
        [u.u_niiColor.value, EMISSION_PALETTE.niiColor],
      ];
      for (const [uniformColor, hex] of pairs) {
        const dE = deltaE76(colorToSrgbRgb(uniformColor), hexToRgb(hex));
        expect(dE).toBeLessThan(4.0);
      }
    } finally {
      handle.dispose();
    }
  });

  it('planetary: shell colours stay within ΔE76 < 4.0 of Doc 18 hex', () => {
    const handle = createNebulaMaterial('planetary');
    try {
      const u = handle.material.uniforms;
      const pairs: Array<[THREE.Color, string]> = [
        [u.u_innerColor.value, PLANETARY_PALETTE.innerColor],
        [u.u_middleColor.value, PLANETARY_PALETTE.middleColor],
        [u.u_outerColor.value, PLANETARY_PALETTE.outerColor],
      ];
      for (const [uniformColor, hex] of pairs) {
        const dE = deltaE76(colorToSrgbRgb(uniformColor), hexToRgb(hex));
        expect(dE).toBeLessThan(4.0);
      }
    } finally {
      handle.dispose();
    }
  });

  it('supernova: synchrotron colour stays within ΔE76 < 4.0 of Doc 18 hex', () => {
    const handle = createNebulaMaterial('supernova');
    try {
      const u = handle.material.uniforms;
      const dE = deltaE76(
        colorToSrgbRgb(u.u_synchrotronColor.value),
        hexToRgb(SUPERNOVA_PALETTE.synchrotronColor),
      );
      expect(dE).toBeLessThan(4.0);
    } finally {
      handle.dispose();
    }
  });

  it('wolfrayet: Hα colour stays within ΔE76 < 4.0 of Doc 17 hex', () => {
    const handle = createNebulaMaterial('wolfrayet');
    try {
      const u = handle.material.uniforms;
      const dE = deltaE76(
        colorToSrgbRgb(u.u_haColor.value),
        hexToRgb(WOLF_RAYET_PALETTE.haColor),
      );
      expect(dE).toBeLessThan(4.0);
    } finally {
      handle.dispose();
    }
  });

  it('superbubble: shell Hα colour stays within ΔE76 < 4.0 of Doc 17 hex', () => {
    const handle = createNebulaMaterial('superbubble');
    try {
      const u = handle.material.uniforms;
      const dE = deltaE76(
        colorToSrgbRgb(u.u_shellHaColor.value),
        hexToRgb(SUPERBUBBLE_PALETTE.shellHaColor),
      );
      expect(dE).toBeLessThan(4.0);
    } finally {
      handle.dispose();
    }
  });
});

// ---------------------------------------------------------------------------
// T45 — subtype factory tests.
// ---------------------------------------------------------------------------

describe('createNebulaMaterialForSubtype', () => {
  it.each(NEBULA_SUBTYPES)('%s: resolves to the expected shader family', (subtype) => {
    const handle = createNebulaMaterialForSubtype(subtype);
    try {
      expect(handle.kind).toBe(subtypeToKind(subtype));
    } finally {
      handle.dispose();
    }
  });

  it('hii-compact: bumps emission density + variant=1', () => {
    const handle = createNebulaMaterialForSubtype('hii-compact');
    try {
      const u = handle.material.uniforms;
      expect(u.u_variant.value).toBe(1);
      expect(u.u_density.value).toBeGreaterThan(EMISSION_PARAMS.density);
    } finally {
      handle.dispose();
    }
  });

  it('hi-region: dims emission and disables variant-2 OIII weighting', () => {
    const handle = createNebulaMaterialForSubtype('hi-region');
    try {
      const u = handle.material.uniforms;
      expect(u.u_variant.value).toBe(2);
      expect(u.u_density.value).toBeLessThan(EMISSION_PARAMS.density);
    } finally {
      handle.dispose();
    }
  });

  it('planetary-spherical: bipolarRatio=0 + low irregularity', () => {
    const handle = createNebulaMaterialForSubtype('planetary-spherical');
    try {
      const u = handle.material.uniforms;
      expect(u.u_bipolarRatio.value).toBe(0);
      expect(u.u_irregularity.value).toBeLessThan(0.2);
    } finally {
      handle.dispose();
    }
  });

  it('planetary-bipolar: bipolarRatio ≥ 0.8', () => {
    const handle = createNebulaMaterialForSubtype('planetary-bipolar');
    try {
      expect(handle.material.uniforms.u_bipolarRatio.value).toBeGreaterThanOrEqual(0.8);
    } finally {
      handle.dispose();
    }
  });

  it('planetary-irregular: irregularity ≥ 0.5', () => {
    const handle = createNebulaMaterialForSubtype('planetary-irregular');
    try {
      expect(handle.material.uniforms.u_irregularity.value).toBeGreaterThanOrEqual(0.5);
    } finally {
      handle.dispose();
    }
  });

  it('bok-globule: higher extinction + core sharpness than molecular', () => {
    const bok = createNebulaMaterialForSubtype('bok-globule');
    const molecular = createNebulaMaterialForSubtype('dark-molecular');
    try {
      expect(bok.material.uniforms.u_extinction.value).toBeGreaterThan(
        molecular.material.uniforms.u_extinction.value,
      );
      expect(bok.material.uniforms.u_coreSharpness.value).toBeGreaterThan(
        molecular.material.uniforms.u_coreSharpness.value,
      );
    } finally {
      bok.dispose();
      molecular.dispose();
    }
  });

  it('snr-shell: pulsarIntensity=0 (Cygnus Loop type)', () => {
    const handle = createNebulaMaterialForSubtype('snr-shell');
    try {
      expect(handle.material.uniforms.u_pulsarIntensity.value).toBe(0);
    } finally {
      handle.dispose();
    }
  });

  it('snr-plerion: pulsarIntensity > 0 (Crab-type)', () => {
    const handle = createNebulaMaterialForSubtype('snr-plerion');
    try {
      expect(handle.material.uniforms.u_pulsarIntensity.value).toBeGreaterThan(0);
    } finally {
      handle.dispose();
    }
  });

  it('wolfrayet / protoplanetary / superbubble: land on their own shader', () => {
    for (const sub of ['wolfrayet', 'protoplanetary', 'superbubble'] as const) {
      const handle = createNebulaMaterialForSubtype(sub);
      try {
        expect(handle.kind).toBe(sub);
      } finally {
        handle.dispose();
      }
    }
  });
});
