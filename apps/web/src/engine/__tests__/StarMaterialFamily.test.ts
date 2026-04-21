/**
 * StarMaterialFamily factory tests (T41).
 *
 * Mirrors the ExoticMaterial test pattern: we can't run GLSL in jsdom, so we
 * inspect the ShaderMaterial's uniforms + defines. Per-kind coverage for
 * 31 star subtypes plus a binary overlay, palette round-trip checks,
 * TS-VQA-001 colour accuracy for the 7 known MK classes, and update()
 * behaviour (u_time advance, u_pulsation sinusoid for variable stars).
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  SPECTRAL_HEX,
  deltaE76,
  hexToRgb,
  type SpectralClass,
} from '@/utils/spectralColor';
import {
  EVOLVED_KINDS,
  EVOLVED_PALETTES,
  EVOLVED_PARAMS,
  MAINSEQ_KINDS,
  MAINSEQ_PALETTES,
  REMNANT_KINDS,
  REMNANT_PALETTES,
  REMNANT_PARAMS,
  VARIABLE_KINDS,
  VARIABLE_PALETTES,
  VARIABLE_PARAMS,
  type MainSeqKind,
} from '@/utils/starFamilyPalette';

import {
  STAR_FAMILY_DEFINES,
  createStarBinaryOverlay,
  createStarMaterial,
} from '../StarMaterialFamily';

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

describe('createStarMaterial — main sequence', () => {
  it.each(MAINSEQ_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createStarMaterial(kind);
    try {
      expect(handle.family).toBe('mainseq');
      expect(handle.kind).toBe(kind);
      expect(handle.material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      expect(handle.material.name).toBe(`star-mainseq:${kind}`);
      const defines = handle.material.defines as Record<string, string>;
      expect(defines[STAR_FAMILY_DEFINES[kind]]).toBeDefined();
      expect(defines[`SPECTRAL_${kind}`]).toBeDefined();
    } finally {
      handle.dispose();
    }
  });

  it.each(MAINSEQ_KINDS)(
    '%s: palette uniforms round-trip exactly',
    (kind) => {
      const handle = createStarMaterial(kind);
      try {
        const u = handle.material.uniforms;
        const p = MAINSEQ_PALETTES[kind];
        expect(colorEqual(u.u_coreColor.value, p.coreColor)).toBe(true);
        expect(colorEqual(u.u_haloColor.value, p.haloColor)).toBe(true);
        expect(colorEqual(u.u_spotColor.value, p.spotColor)).toBe(true);
        expect(colorEqual(u.u_chromosphereColor.value, p.chromosphereColor)).toBe(true);
        expect(colorEqual(u.u_limbColor.value, p.limbColor)).toBe(true);
      } finally {
        handle.dispose();
      }
    },
  );

  // TS-VQA-001: the main-sequence core colour for each of the 7 known MK
  // classes must lie within ΔE76 < 3.0 of the Doc 18 reference hex (the
  // SPECTRAL_HEX table). Brown dwarfs (L/T/Y) and the MS-general bucket
  // are outside Doc 18's spectral→colour table, so skip them here.
  it.each(['O', 'B', 'A', 'F', 'G', 'K', 'M'] as SpectralClass[])(
    'TS-VQA-001 — %s coreColor within ΔE76 < 3.0 of Doc 18 reference',
    (spectralClass) => {
      const kind = spectralClass as unknown as MainSeqKind;
      const handle = createStarMaterial(kind);
      try {
        const u = handle.material.uniforms;
        const dE = deltaE76(
          colorToSrgbRgb(u.u_coreColor.value),
          hexToRgb(SPECTRAL_HEX[spectralClass]),
        );
        expect(dE).toBeLessThan(3.0);
      } finally {
        handle.dispose();
      }
    },
  );

  it('createStarMaterial("MS") defaults temperature to 5778 K', () => {
    const handle = createStarMaterial('MS');
    try {
      expect(handle.material.uniforms.u_temperatureK.value).toBe(5778);
    } finally {
      handle.dispose();
    }
  });

  it('temperatureOverride propagates to u_temperatureK', () => {
    const handle = createStarMaterial('G', { temperatureOverride: 6200 });
    try {
      expect(handle.material.uniforms.u_temperatureK.value).toBe(6200);
    } finally {
      handle.dispose();
    }
  });

  it('quality=high adds QUALITY_HIGH define', () => {
    const handle = createStarMaterial('G', { quality: 'high' });
    try {
      const defines = handle.material.defines as Record<string, string>;
      expect(defines.QUALITY_HIGH).toBeDefined();
    } finally {
      handle.dispose();
    }
  });
});

describe('createStarMaterial — evolved', () => {
  it.each(EVOLVED_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createStarMaterial(kind);
    try {
      expect(handle.family).toBe('evolved');
      expect(handle.kind).toBe(kind);
      expect(handle.material.name).toBe(`star-evolved:${kind}`);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      const defines = handle.material.defines as Record<string, string>;
      expect(defines[STAR_FAMILY_DEFINES[kind]]).toBeDefined();
    } finally {
      handle.dispose();
    }
  });

  it.each(EVOLVED_KINDS)(
    '%s: palette uniforms round-trip exactly',
    (kind) => {
      const handle = createStarMaterial(kind);
      try {
        const u = handle.material.uniforms;
        const p = EVOLVED_PALETTES[kind];
        expect(colorEqual(u.u_coreColor.value, p.coreColor)).toBe(true);
        expect(colorEqual(u.u_haloColor.value, p.haloColor)).toBe(true);
        expect(colorEqual(u.u_dustColor.value, p.dustColor)).toBe(true);
        expect(colorEqual(u.u_limbColor.value, p.limbColor)).toBe(true);
      } finally {
        handle.dispose();
      }
    },
  );

  it('wolfrayet: u_shellIntensity defaults from params', () => {
    const handle = createStarMaterial('wolfrayet');
    try {
      expect(handle.material.uniforms.u_shellIntensity.value).toBe(
        EVOLVED_PARAMS.wolfrayet.shellIntensity,
      );
    } finally {
      handle.dispose();
    }
  });

  it('lbv: u_sdoradusAmp propagates from params', () => {
    const handle = createStarMaterial('lbv');
    try {
      expect(handle.material.uniforms.u_sdoradusAmp.value).toBe(
        EVOLVED_PARAMS.lbv.sdoradusAmp,
      );
    } finally {
      handle.dispose();
    }
  });

  it('protostar: u_jetIntensity set to params', () => {
    const handle = createStarMaterial('protostar');
    try {
      expect(handle.material.uniforms.u_jetIntensity.value).toBe(
        EVOLVED_PARAMS.protostar.jetIntensity,
      );
    } finally {
      handle.dispose();
    }
  });
});

describe('createStarMaterial — remnant', () => {
  it.each(REMNANT_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createStarMaterial(kind);
    try {
      expect(handle.family).toBe('remnant');
      expect(handle.kind).toBe(kind);
      expect(handle.material.name).toBe(`star-remnant:${kind}`);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      const defines = handle.material.defines as Record<string, string>;
      expect(defines[STAR_FAMILY_DEFINES[kind]]).toBeDefined();
    } finally {
      handle.dispose();
    }
  });

  it.each(REMNANT_KINDS)('%s: palette uniforms round-trip exactly', (kind) => {
    const handle = createStarMaterial(kind);
    try {
      const u = handle.material.uniforms;
      const p = REMNANT_PALETTES[kind];
      expect(colorEqual(u.u_hotColor.value, p.hotColor)).toBe(true);
      expect(colorEqual(u.u_coolColor.value, p.coolColor)).toBe(true);
      expect(colorEqual(u.u_polarColor.value, p.polarColor)).toBe(true);
      expect(colorEqual(u.u_beamColor.value, p.beamColor)).toBe(true);
      expect(colorEqual(u.u_limbColor.value, p.limbColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('whitedwarf: u_wdTemperature default is set, pulsation default 0', () => {
    const handle = createStarMaterial('whitedwarf');
    try {
      const u = handle.material.uniforms;
      expect(u.u_wdTemperature.value).toBe(REMNANT_PARAMS.whitedwarf.wdTemperature);
      expect(u.u_wdTemperature.value).toBeGreaterThan(0);
      expect(u.u_pulsationAmp.value).toBe(0);
      expect(u.u_pulsation.value).toBe(0);
    } finally {
      handle.dispose();
    }
  });

  it('neutronstar: u_rotationHz + u_magneticTilt default to params', () => {
    const handle = createStarMaterial('neutronstar');
    try {
      const u = handle.material.uniforms;
      expect(u.u_rotationHz.value).toBe(REMNANT_PARAMS.neutronstar.rotationHz);
      expect(u.u_magneticTilt.value).toBe(REMNANT_PARAMS.neutronstar.magneticTilt);
      expect(u.u_beamHalfAngle.value).toBe(REMNANT_PARAMS.neutronstar.beamHalfAngle);
    } finally {
      handle.dispose();
    }
  });

  it('neutronstar overrides propagate', () => {
    const handle = createStarMaterial('neutronstar', {
      rotationHzOverride: 29.9,
      magneticTiltOverride: 0.9,
    });
    try {
      expect(handle.material.uniforms.u_rotationHz.value).toBe(29.9);
      expect(handle.material.uniforms.u_magneticTilt.value).toBeCloseTo(0.9, 5);
    } finally {
      handle.dispose();
    }
  });
});

describe('createStarMaterial — variable', () => {
  it.each(VARIABLE_KINDS)('%s: returns a GLSL3 ShaderMaterial', (kind) => {
    const handle = createStarMaterial(kind);
    try {
      expect(handle.family).toBe('variable');
      expect(handle.kind).toBe(kind);
      expect(handle.material.name).toBe(`star-variable:${kind}`);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      const defines = handle.material.defines as Record<string, string>;
      expect(defines[STAR_FAMILY_DEFINES[kind]]).toBeDefined();
    } finally {
      handle.dispose();
    }
  });

  it.each(VARIABLE_KINDS)('%s: palette uniforms round-trip exactly', (kind) => {
    const handle = createStarMaterial(kind);
    try {
      const u = handle.material.uniforms;
      const p = VARIABLE_PALETTES[kind];
      expect(colorEqual(u.u_coolColor.value, p.coolColor)).toBe(true);
      expect(colorEqual(u.u_hotColor.value, p.hotColor)).toBe(true);
      expect(colorEqual(u.u_haloColor.value, p.haloColor)).toBe(true);
      expect(colorEqual(u.u_spotColor.value, p.spotColor)).toBe(true);
      expect(colorEqual(u.u_limbColor.value, p.limbColor)).toBe(true);
    } finally {
      handle.dispose();
    }
  });

  it('cepheid: u_pulsation advances sinusoidally with elapsedSec', () => {
    const handle = createStarMaterial('cepheid');
    const period = VARIABLE_PARAMS.cepheid.pulsationPeriodSec;
    const amp = VARIABLE_PARAMS.cepheid.pulsationAmp;
    const sun = new THREE.Vector3(1, 0, 0);
    const cam = new THREE.Vector3();
    const m = new THREE.Matrix4();
    try {
      // At period/4 → sin(π/2) = +1 → u_pulsation = +amp.
      handle.update(0.016, period / 4, sun, cam, m);
      expect(handle.material.uniforms.u_pulsation.value).toBeCloseTo(amp, 4);

      // At period/2 → sin(π) = 0.
      handle.update(0.016, period / 2, sun, cam, m);
      expect(handle.material.uniforms.u_pulsation.value).toBeCloseTo(0, 4);

      // At 3·period/4 → sin(3π/2) = -1 → u_pulsation = -amp.
      handle.update(0.016, (3 * period) / 4, sun, cam, m);
      expect(handle.material.uniforms.u_pulsation.value).toBeCloseTo(-amp, 4);
    } finally {
      handle.dispose();
    }
  });

  it('cataclysmic: flareIntensity override propagates', () => {
    const handle = createStarMaterial('cataclysmic', { flareIntensity: 0.8 });
    try {
      expect(handle.material.uniforms.u_flareIntensity.value).toBe(0.8);
    } finally {
      handle.dispose();
    }
  });

  it('bluestraggler: u_blueExcess matches params', () => {
    const handle = createStarMaterial('bluestraggler');
    try {
      expect(handle.material.uniforms.u_blueExcess.value).toBe(
        VARIABLE_PARAMS.bluestraggler.blueExcess,
      );
    } finally {
      handle.dispose();
    }
  });
});

describe('createStarMaterial — update() drives u_time', () => {
  const allKinds = [
    ...MAINSEQ_KINDS,
    ...EVOLVED_KINDS,
    ...REMNANT_KINDS,
    ...VARIABLE_KINDS,
  ];

  it.each(allKinds)('%s: update() advances u_time', (kind) => {
    const handle = createStarMaterial(kind);
    try {
      const initial = handle.material.uniforms.u_time.value as number;
      const sun = new THREE.Vector3(1, 0, 0);
      const cam = new THREE.Vector3();
      const m = new THREE.Matrix4();
      handle.update(0.016, 1.5, sun, cam, m);
      expect(handle.material.uniforms.u_time.value).toBeGreaterThan(initial);
      expect(handle.material.uniforms.u_time.value).toBe(1.5);
    } finally {
      handle.dispose();
    }
  });
});

describe('createStarBinaryOverlay', () => {
  it('returns an additive-blending transparent ShaderMaterial', () => {
    const handle = createStarBinaryOverlay({
      primaryCenter: new THREE.Vector3(-1, 0, 0),
      secondaryCenter: new THREE.Vector3(1, 0, 0),
      primaryRadius: 0.4,
      secondaryRadius: 0.25,
      lobeStrength: 0.6,
      massTransferRate: 0.3,
    });
    try {
      expect(handle.family).toBe('binary');
      expect(handle.kind).toBe('binary');
      expect(handle.material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(handle.material.glslVersion).toBe(THREE.GLSL3);
      expect(handle.material.transparent).toBe(true);
      expect(handle.material.depthWrite).toBe(false);
      expect(handle.material.blending).toBe(THREE.AdditiveBlending);
      expect(handle.material.name).toBe('star-binary');

      const u = handle.material.uniforms;
      expect(u.u_primaryRadius.value).toBe(0.4);
      expect(u.u_secondaryRadius.value).toBe(0.25);
      expect(u.u_lobeStrength.value).toBe(0.6);
      expect(u.u_massTransferRate.value).toBe(0.3);
    } finally {
      handle.dispose();
    }
  });

  it('update() advances u_time', () => {
    const handle = createStarBinaryOverlay({
      primaryCenter: new THREE.Vector3(),
      secondaryCenter: new THREE.Vector3(2, 0, 0),
      primaryRadius: 0.5,
      secondaryRadius: 0.3,
    });
    try {
      const sun = new THREE.Vector3(1, 0, 0);
      const cam = new THREE.Vector3();
      const m = new THREE.Matrix4();
      handle.update(0.016, 2.4, sun, cam, m);
      expect(handle.material.uniforms.u_time.value).toBe(2.4);
    } finally {
      handle.dispose();
    }
  });
});

describe('dispose()', () => {
  it('actually disposes the underlying ShaderMaterial', () => {
    const handle = createStarMaterial('G');
    let disposed = false;
    const original = handle.material.dispose.bind(handle.material);
    handle.material.dispose = (): void => {
      disposed = true;
      original();
    };
    handle.dispose();
    expect(disposed).toBe(true);
  });
});
