/**
 * GalaxyMaterial factory tests (T29).
 *
 * Mirrors NebulaMaterial.test / ExoticMaterial.test — jsdom can't run GLSL
 * so we assert via uniforms + defines. TS-VQA-004 (galaxy ΔE < 8.0) is
 * asserted by comparing uniform-colour → Doc 22 reference hex through
 * `deltaE76`.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  AGN_PALETTE,
  AGN_PARAMS,
  AGN_SUBVARIANT_CODE,
  ELLIPTICAL_PALETTE,
  ELLIPTICAL_PARAMS,
  GALAXY_KINDS,
  IRREGULAR_PALETTE,
  IRREGULAR_PARAMS,
  LENTICULAR_PALETTE,
  LENTICULAR_PARAMS,
  MORPHOLOGY_SPECIAL_PALETTE,
  MORPHOLOGY_SPECIAL_PARAMS,
  SPECIAL_SUBVARIANT_CODE,
  SPIRAL_PALETTE,
  SPIRAL_PARAMS,
  STARBURST_PALETTE,
  STARBURST_PARAMS,
  type GalaxyKind,
} from '@/utils/galaxyPalette';
import { deltaE76, hexToRgb } from '@/utils/spectralColor';

import { createGalaxyMaterial } from '../GalaxyMaterial';

function colorEqual(a: THREE.Color, hex: string): boolean {
  const b = new THREE.Color(hex);
  return (
    Math.abs(a.r - b.r) < 1e-5 &&
    Math.abs(a.g - b.g) < 1e-5 &&
    Math.abs(a.b - b.b) < 1e-5
  );
}

// `THREE.Color` stores RGB in linear space; `deltaE76` / `rgbToLab` expect
// sRGB 0–1. Reverse the gamma encoding before comparing.
function colorToSrgbRgb(c: THREE.Color): { r: number; g: number; b: number } {
  const srgb = c.clone().convertLinearToSRGB();
  return { r: srgb.r, g: srgb.g, b: srgb.b };
}

describe('createGalaxyMaterial', () => {
  it.each(GALAXY_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createGalaxyMaterial(kind);
    try {
      expect(handle.kind).toBe(kind);
      expect(handle.material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      // New T46 kinds append `:subvariant` (e.g. galaxy:agn:seyfert1).
      expect(handle.material.name.startsWith(`galaxy:${kind}`)).toBe(true);
      expect(handle.material.transparent).toBe(true);
      expect(handle.material.depthWrite).toBe(false);
      expect(handle.material.side).toBe(THREE.DoubleSide);
    } finally {
      handle.dispose();
    }
  });

  it.each(GALAXY_KINDS)('%s: GALAXY_STEPS define defaults to kind-specific param', (kind) => {
    const expected: Record<GalaxyKind, number> = {
      spiral: SPIRAL_PARAMS.steps,
      elliptical: ELLIPTICAL_PARAMS.steps,
      irregular: IRREGULAR_PARAMS.steps,
      lenticular: LENTICULAR_PARAMS.steps,
      agn: AGN_PARAMS.steps,
      starburst: STARBURST_PARAMS.steps,
      'morphology-special': MORPHOLOGY_SPECIAL_PARAMS.steps,
    };
    const handle = createGalaxyMaterial(kind);
    try {
      const defines = handle.material.defines as Record<string, string>;
      expect(defines.GALAXY_STEPS).toBe(String(expected[kind]));
    } finally {
      handle.dispose();
    }
  });

  it('stepsOverride replaces the default GALAXY_STEPS value', () => {
    const handle = createGalaxyMaterial('spiral', { stepsOverride: 96 });
    try {
      const defines = handle.material.defines as Record<string, string>;
      expect(defines.GALAXY_STEPS).toBe('96');
    } finally {
      handle.dispose();
    }
  });

  it('spiral: palette uniforms match SPIRAL_PALETTE exactly', () => {
    const handle = createGalaxyMaterial('spiral');
    try {
      const u = handle.material.uniforms;
      expect(colorEqual(u.u_armColor.value, SPIRAL_PALETTE.armColor)).toBe(true);
      expect(colorEqual(u.u_interArmColor.value, SPIRAL_PALETTE.interArmColor)).toBe(true);
      expect(colorEqual(u.u_bulgeColor.value, SPIRAL_PALETTE.bulgeColor)).toBe(true);
      expect(colorEqual(u.u_dustColor.value, SPIRAL_PALETTE.dustColor)).toBe(true);
      expect(colorEqual(u.u_hiiColor.value, SPIRAL_PALETTE.hiiColor)).toBe(true);
      expect(colorEqual(u.u_barColor.value, SPIRAL_PALETTE.barColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('spiral: pitch/armCount/barLength overrides propagate', () => {
    const handle = createGalaxyMaterial('spiral', {
      pitchAngleOverride: 0.25,
      armCountOverride: 4,
      barLengthOverride: 0,
    });
    try {
      const u = handle.material.uniforms;
      expect(u.u_pitchAngle.value).toBe(0.25);
      expect(u.u_armCount.value).toBe(4);
      expect(u.u_barLength.value).toBe(0);
    } finally {
      handle.dispose();
    }
  });

  it('elliptical: ellipticity + globular overrides propagate', () => {
    const handle = createGalaxyMaterial('elliptical', {
      ellipticityOverride: 0.6,
      globularVisibilityOverride: 0,
    });
    try {
      const u = handle.material.uniforms;
      expect(u.u_ellipticity.value).toBe(0.6);
      expect(u.u_globularVisibility.value).toBe(0);
      expect(colorEqual(u.u_coreColor.value, ELLIPTICAL_PALETTE.coreColor)).toBe(true);
      expect(colorEqual(u.u_haloColor.value, ELLIPTICAL_PALETTE.haloColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('irregular: palette + tidal stretch propagate', () => {
    const handle = createGalaxyMaterial('irregular', { tidalStretchOverride: 0.8 });
    try {
      const u = handle.material.uniforms;
      expect(u.u_tidalStretch.value).toBe(0.8);
      expect(colorEqual(u.u_youngStarColor.value, IRREGULAR_PALETTE.youngStarColor)).toBe(true);
      expect(colorEqual(u.u_starburstColor.value, IRREGULAR_PALETTE.starburstColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('lenticular: palette + dust opacity propagate', () => {
    const handle = createGalaxyMaterial('lenticular', { dustOpacityOverride: 0.4 });
    try {
      const u = handle.material.uniforms;
      expect(u.u_dustOpacity.value).toBe(0.4);
      expect(colorEqual(u.u_bulgeColor.value, LENTICULAR_PALETTE.bulgeColor)).toBe(true);
      expect(colorEqual(u.u_innerDiskColor.value, LENTICULAR_PALETTE.innerDiskColor)).toBe(true);
      expect(colorEqual(u.u_outerDiskColor.value, LENTICULAR_PALETTE.outerDiskColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('update() advances u_time and copies camera into the local-space uniform', () => {
    const handle = createGalaxyMaterial('spiral');
    try {
      const cameraWorld = new THREE.Vector3(5, 0, 10);
      const meshMatrix = new THREE.Matrix4().makeTranslation(10, 0, 0);
      handle.update(0.016, 0.5, cameraWorld, meshMatrix);
      expect(handle.material.uniforms.u_time.value).toBeCloseTo(0.5, 5);
      const cameraLocal = handle.material.uniforms.u_cameraLocal.value as THREE.Vector3;
      expect(cameraLocal.x).toBeCloseTo(-5, 5);
      expect(cameraLocal.y).toBeCloseTo(0, 5);
      expect(cameraLocal.z).toBeCloseTo(10, 5);
    } finally {
      handle.dispose();
    }
  });

  it('update() handles rotation+translation in the worldToLocal inversion', () => {
    const handle = createGalaxyMaterial('elliptical');
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
    const handle = createGalaxyMaterial('irregular');
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
  // TS-VQA-004: galaxy ΔE76 < 8.0 vs Doc 22 reference hex.
  // Round-trip should produce ΔE ≈ 0; the 8.0 threshold guards against a
  // future palette refactor accidentally remapping a hex.
  // ---------------------------------------------------------------------
  it('spiral: palette uniforms stay within ΔE76 < 8.0 of Doc 22 hex', () => {
    const handle = createGalaxyMaterial('spiral');
    try {
      const u = handle.material.uniforms;
      const pairs: Array<[THREE.Color, string]> = [
        [u.u_armColor.value, SPIRAL_PALETTE.armColor],
        [u.u_interArmColor.value, SPIRAL_PALETTE.interArmColor],
        [u.u_bulgeColor.value, SPIRAL_PALETTE.bulgeColor],
        [u.u_hiiColor.value, SPIRAL_PALETTE.hiiColor],
        [u.u_barColor.value, SPIRAL_PALETTE.barColor],
        [u.u_haloColor.value, SPIRAL_PALETTE.haloColor],
      ];
      for (const [uniformColor, hex] of pairs) {
        const dE = deltaE76(colorToSrgbRgb(uniformColor), hexToRgb(hex));
        expect(dE).toBeLessThan(8.0);
      }
    } finally {
      handle.dispose();
    }
  });

  it('elliptical: palette uniforms stay within ΔE76 < 8.0 of Doc 22 hex', () => {
    const handle = createGalaxyMaterial('elliptical');
    try {
      const u = handle.material.uniforms;
      const pairs: Array<[THREE.Color, string]> = [
        [u.u_coreColor.value, ELLIPTICAL_PALETTE.coreColor],
        [u.u_haloColor.value, ELLIPTICAL_PALETTE.haloColor],
        [u.u_envelopeColor.value, ELLIPTICAL_PALETTE.envelopeColor],
        [u.u_globularColor.value, ELLIPTICAL_PALETTE.globularColor],
      ];
      for (const [uniformColor, hex] of pairs) {
        const dE = deltaE76(colorToSrgbRgb(uniformColor), hexToRgb(hex));
        expect(dE).toBeLessThan(8.0);
      }
    } finally {
      handle.dispose();
    }
  });

  // ---------------------------------------------------------------------
  // T46 — new shader families (AGN, Starburst/ULIRG, Morphology-special).
  // ---------------------------------------------------------------------

  it('spiral: SB subvariant enables the bar + nuclear ring uniforms', () => {
    const handle = createGalaxyMaterial('spiral', { spiralSubvariant: 'sb' });
    try {
      const u = handle.material.uniforms;
      expect(u.u_barLength.value).toBeGreaterThan(0.1);
      expect(u.u_barArmAnchor.value).toBeCloseTo(1.0, 5);
      expect(u.u_nuclearRing.value).toBeGreaterThan(0.5);
    } finally {
      handle.dispose();
    }
  });

  it('elliptical: dSph subvariant is ghostly (diffuseness > 0.5)', () => {
    const dsph = createGalaxyMaterial('elliptical', { ellipticalSubvariant: 'dsph' });
    const giant = createGalaxyMaterial('elliptical', { ellipticalSubvariant: 'giant' });
    try {
      expect(dsph.material.uniforms.u_diffuseness.value).toBeGreaterThan(0.5);
      expect(giant.material.uniforms.u_diffuseness.value).toBeLessThan(0.1);
      expect(dsph.material.uniforms.u_globularMetallicity.value).toBeLessThan(0.5);
    } finally {
      dsph.dispose();
      giant.dispose();
    }
  });

  it('elliptical: dE subvariant exposes a nucleated cluster', () => {
    const handle = createGalaxyMaterial('elliptical', { ellipticalSubvariant: 'de' });
    try {
      expect(handle.material.uniforms.u_nucleusStrength.value).toBeGreaterThan(0.5);
    } finally {
      handle.dispose();
    }
  });

  it('irregular: Irr II subvariant enables tidal tail + dust chaos', () => {
    const handle = createGalaxyMaterial('irregular', { irregularSubvariant: 'irr-ii' });
    try {
      const u = handle.material.uniforms;
      expect(u.u_tidalTailStrength.value).toBeGreaterThan(0.5);
      expect(u.u_dustChaos.value).toBeGreaterThan(0.5);
      expect(u.u_dualNucleus.value).toBeGreaterThan(0.3);
    } finally {
      handle.dispose();
    }
  });

  it('agn: every AGN subvariant returns a valid material + palette', () => {
    const subvariants = ['seyfert1', 'seyfert2', 'quasar', 'radio', 'blazar', 'liner'] as const;
    for (const sv of subvariants) {
      const handle = createGalaxyMaterial('agn', { agnSubvariant: sv });
      try {
        expect(handle.material).toBeInstanceOf(THREE.ShaderMaterial);
        expect(handle.material.glslVersion).toBe(THREE.GLSL3);
        expect(handle.material.name).toContain(sv);
        const u = handle.material.uniforms;
        expect(u.u_agnSubtype.value).toBe(AGN_SUBVARIANT_CODE[sv]);
        expect(colorEqual(u.u_coreColor.value, AGN_PALETTE.coreColor)).toBe(true);
      } finally {
        handle.dispose();
      }
    }
  });

  it('agn: Seyfert 2 obscures the core via torus; Seyfert 1 does not', () => {
    const sy1 = createGalaxyMaterial('agn', { agnSubvariant: 'seyfert1' });
    const sy2 = createGalaxyMaterial('agn', { agnSubvariant: 'seyfert2' });
    try {
      expect(sy1.material.uniforms.u_torusStrength.value).toBeLessThan(0.1);
      expect(sy2.material.uniforms.u_torusStrength.value).toBeGreaterThan(0.5);
      expect(sy2.material.uniforms.u_nlrStrength.value).toBeGreaterThan(0.5);
    } finally {
      sy1.dispose();
      sy2.dispose();
    }
  });

  it('agn: Blazar jet is single-sided (asymmetry ≈ 1)', () => {
    const handle = createGalaxyMaterial('agn', { agnSubvariant: 'blazar' });
    try {
      expect(handle.material.uniforms.u_jetAsymmetry.value).toBeCloseTo(1.0, 5);
      expect(handle.material.uniforms.u_jetStrength.value).toBeGreaterThan(1.0);
    } finally {
      handle.dispose();
    }
  });

  it('agn: Radio galaxy has prominent bipolar lobes', () => {
    const handle = createGalaxyMaterial('agn', { agnSubvariant: 'radio' });
    try {
      expect(handle.material.uniforms.u_lobeStrength.value).toBeGreaterThan(0.5);
      expect(handle.material.uniforms.u_jetStrength.value).toBeGreaterThan(0.5);
    } finally {
      handle.dispose();
    }
  });

  it('starburst: ULIRG subvariant shifts the ULIRG blend + enables dual-nucleus', () => {
    const sb = createGalaxyMaterial('starburst', { starburstSubvariant: 'starburst' });
    const ul = createGalaxyMaterial('starburst', { starburstSubvariant: 'ulirg' });
    try {
      expect(sb.material.uniforms.u_ulirgBlend.value).toBeLessThan(0.1);
      expect(ul.material.uniforms.u_ulirgBlend.value).toBeGreaterThan(0.5);
      expect(ul.material.uniforms.u_dualNucleus.value).toBeGreaterThan(0.5);
      expect(colorEqual(sb.material.uniforms.u_youngStarColor.value, STARBURST_PALETTE.youngStarColor)).toBe(true);
    } finally {
      sb.dispose();
      ul.dispose();
    }
  });

  it('morphology-special: every subvariant sets the correct u_specialSubtype code', () => {
    const subvariants = ['ring', 'jellyfish', 'udg', 'merging'] as const;
    for (const sv of subvariants) {
      const handle = createGalaxyMaterial('morphology-special', { specialSubvariant: sv });
      try {
        expect(handle.material.uniforms.u_specialSubtype.value).toBe(SPECIAL_SUBVARIANT_CODE[sv]);
        expect(handle.material.name).toContain(sv);
        expect(colorEqual(handle.material.uniforms.u_ringBulkColor.value, MORPHOLOGY_SPECIAL_PALETTE.ringBulkColor)).toBe(true);
      } finally {
        handle.dispose();
      }
    }
  });

  it('irregular + lenticular: all palette uniforms within ΔE76 < 8.0', () => {
    for (const kind of ['irregular', 'lenticular'] as const) {
      const handle = createGalaxyMaterial(kind);
      try {
        const u = handle.material.uniforms;
        const colorUniformNames = Object.keys(u).filter(
          (n) => n.endsWith('Color') && n !== 'u_cameraLocal',
        );
        // Palette source per kind.
        const palette: Record<string, string> =
          kind === 'irregular'
            ? {
                u_youngStarColor: IRREGULAR_PALETTE.youngStarColor,
                u_oldStarColor:   IRREGULAR_PALETTE.oldStarColor,
                u_starburstColor: IRREGULAR_PALETTE.starburstColor,
                u_hiiColor:       IRREGULAR_PALETTE.hiiColor,
                u_dustColor:      IRREGULAR_PALETTE.dustColor,
              }
            : {
                u_bulgeColor:      LENTICULAR_PALETTE.bulgeColor,
                u_innerDiskColor:  LENTICULAR_PALETTE.innerDiskColor,
                u_outerDiskColor:  LENTICULAR_PALETTE.outerDiskColor,
                u_haloColor:       LENTICULAR_PALETTE.haloColor,
                u_dustColor:       LENTICULAR_PALETTE.dustColor,
              };
        for (const name of colorUniformNames) {
          if (!(name in palette)) continue;
          const uniformColor = u[name]!.value as THREE.Color;
          const dE = deltaE76(colorToSrgbRgb(uniformColor), hexToRgb(palette[name]!));
          expect(dE, `${kind}.${name}`).toBeLessThan(8.0);
        }
      } finally {
        handle.dispose();
      }
    }
  });
});
