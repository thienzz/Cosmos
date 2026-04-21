/**
 * TS-VQA-002 guard — every palette colour must stay within ΔE76 < 5 of the
 * Doc 18 reference. The test compares each entry in planetPalette.ts against
 * the literal hex strings quoted in Doc 18. Tolerances are intentionally
 * loose (5.0 = "barely perceptible"), so drift beyond `< 5` implies someone
 * edited a palette without updating the spec cross-reference.
 */

import { describe, expect, it } from 'vitest';

import {
  GAS_PALETTES,
  GAS_PARAMS,
  ROCKY_PALETTES,
  ROCKY_PARAMS,
  SATURN_RING_GEOMETRY,
  SATURN_RING_PALETTE,
  gasPaletteRgb,
  isGasGiant,
  isRockyPlanet,
  rockyPaletteRgb,
} from '../planetPalette';
import { deltaE76, hexToRgb } from '../spectralColor';

// ---------------------------------------------------------------------------
// Doc 18 authoritative colour references — quoted from the "##" sections of
// apps/docs/18-visual-rendering-specification.md. Any future change must
// update this table along with the palette.
// ---------------------------------------------------------------------------
const DOC18_ROCKY_ANCHORS = {
  mercury: { baseColor: '#8C8078', shadowColor: '#73665E', highlightColor: '#BFB2AD' },
  venus: { cloudColor: '#F2EBBF', atmosphereTint: '#FF6633' },
  earth: { shadowColor: '#006994', poleColor: '#F2F2FA' },
  mars: { baseColor: '#C1440E', poleColor: '#FFFACD', atmosphereTint: '#6666FF' },
} as const;

const DOC18_GAS_ANCHORS = {
  jupiter: { spotColor: '#B22222' },
  saturn: { zoneColor: '#EFEDBF' },
  uranus: { zoneColor: '#AFEEEE' },
  neptune: { beltColor: '#0000CD', poleColor: '#000080' },
} as const;

// ---------------------------------------------------------------------------
// Palette — hex → ΔE distance from Doc 18 reference.
// ---------------------------------------------------------------------------

describe('planetPalette (rocky)', () => {
  it.each(Object.keys(DOC18_ROCKY_ANCHORS) as Array<
    keyof typeof DOC18_ROCKY_ANCHORS
  >)('%s matches Doc 18 anchors within ΔE < 5', (kind) => {
    const anchors = DOC18_ROCKY_ANCHORS[kind];
    const palette = ROCKY_PALETTES[kind] as unknown as Record<string, string>;
    for (const [slot, hex] of Object.entries(anchors)) {
      const actual = hexToRgb(palette[slot]!);
      const reference = hexToRgb(hex as string);
      expect(deltaE76(actual, reference)).toBeLessThan(5);
    }
  });

  it('rockyPaletteRgb returns RGB in 0..1', () => {
    for (const kind of ['mercury', 'venus', 'earth', 'mars'] as const) {
      const rgb = rockyPaletteRgb(kind);
      for (const channel of Object.values(rgb)) {
        expect(channel.r).toBeGreaterThanOrEqual(0);
        expect(channel.r).toBeLessThanOrEqual(1);
        expect(channel.g).toBeGreaterThanOrEqual(0);
        expect(channel.g).toBeLessThanOrEqual(1);
        expect(channel.b).toBeGreaterThanOrEqual(0);
        expect(channel.b).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('planetPalette (gas)', () => {
  it.each(Object.keys(DOC18_GAS_ANCHORS) as Array<keyof typeof DOC18_GAS_ANCHORS>)(
    '%s matches Doc 18 anchors within ΔE < 5',
    (kind) => {
      const anchors = DOC18_GAS_ANCHORS[kind];
      const palette = GAS_PALETTES[kind] as unknown as Record<string, string>;
      for (const [slot, hex] of Object.entries(anchors)) {
        const actual = hexToRgb(palette[slot]!);
        const reference = hexToRgb(hex as string);
        expect(deltaE76(actual, reference)).toBeLessThan(5);
      }
    },
  );

  it('gasPaletteRgb returns valid RGB for every kind', () => {
    for (const kind of ['jupiter', 'saturn', 'uranus', 'neptune'] as const) {
      const rgb = gasPaletteRgb(kind);
      expect(rgb.zoneColor.r + rgb.zoneColor.g + rgb.zoneColor.b).toBeGreaterThan(0);
      expect(rgb.beltColor.r + rgb.beltColor.g + rgb.beltColor.b).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Spectral classification — dominant-channel heuristic matching user
// expectations (Mars looks red, Earth looks blue, etc.).
// ---------------------------------------------------------------------------

describe('planetPalette dominant channel', () => {
  it('Mars base colour is red-dominant', () => {
    const { baseColor } = rockyPaletteRgb('mars');
    expect(baseColor.r).toBeGreaterThan(baseColor.g);
    expect(baseColor.r).toBeGreaterThan(baseColor.b);
  });

  it('Earth shadow (ocean) is blue-dominant', () => {
    const { shadowColor } = rockyPaletteRgb('earth');
    expect(shadowColor.b).toBeGreaterThan(shadowColor.r);
  });

  it('Neptune belt is blue-dominant', () => {
    const { beltColor } = gasPaletteRgb('neptune');
    expect(beltColor.b).toBeGreaterThan(beltColor.r);
    expect(beltColor.b).toBeGreaterThan(beltColor.g);
  });

  it('Uranus zone is cyan (green+blue dominant over red)', () => {
    const { zoneColor } = gasPaletteRgb('uranus');
    expect(zoneColor.b).toBeGreaterThan(zoneColor.r);
    expect(zoneColor.g).toBeGreaterThan(zoneColor.r);
  });

  it('Jupiter zone is warm (red+green > blue)', () => {
    const { zoneColor } = gasPaletteRgb('jupiter');
    expect(zoneColor.r).toBeGreaterThan(zoneColor.b);
    expect(zoneColor.g).toBeGreaterThan(zoneColor.b);
  });
});

// ---------------------------------------------------------------------------
// Params — sanity-check the physical constants that drive the shader.
// ---------------------------------------------------------------------------

describe('planet params', () => {
  it('rocky radii match Doc 18 scaling anchors', () => {
    expect(ROCKY_PARAMS.mercury.radius).toBeCloseTo(0.38, 2);
    expect(ROCKY_PARAMS.venus.radius).toBeCloseTo(0.95, 2);
    expect(ROCKY_PARAMS.earth.radius).toBe(1.0);
    expect(ROCKY_PARAMS.mars.radius).toBeCloseTo(0.53, 2);
  });

  it('gas radii match Doc 18 scaling anchors', () => {
    expect(GAS_PARAMS.jupiter.radius).toBeCloseTo(11.2, 2);
    expect(GAS_PARAMS.saturn.radius).toBeCloseTo(9.4, 2);
    expect(GAS_PARAMS.uranus.radius).toBeCloseTo(4.0, 2);
    expect(GAS_PARAMS.neptune.radius).toBeCloseTo(3.9, 2);
  });

  it('Venus rotates retrograde (negative angular velocity)', () => {
    expect(ROCKY_PARAMS.venus.rotationRadPerSec).toBeLessThan(0);
  });

  it('airless bodies have zero cloud coverage', () => {
    expect(ROCKY_PARAMS.mercury.cloudCoverage).toBe(0);
  });

  it('Venus is almost fully cloaked in cloud', () => {
    expect(ROCKY_PARAMS.venus.cloudCoverage).toBeGreaterThan(0.95);
  });

  it('Earth has polar caps', () => {
    expect(ROCKY_PARAMS.earth.polarCapExtentDeg).toBeGreaterThan(60);
  });

  it('only Earth emits city lights', () => {
    expect(ROCKY_PARAMS.earth.nightEmission).toBeGreaterThan(0);
    expect(ROCKY_PARAMS.mars.nightEmission).toBe(0);
    expect(ROCKY_PARAMS.mercury.nightEmission).toBe(0);
    expect(ROCKY_PARAMS.venus.nightEmission).toBe(0);
  });

  it('only Saturn has a hexagonal polar vortex', () => {
    expect(GAS_PARAMS.saturn.hexagonStrength).toBeGreaterThan(0);
    expect(GAS_PARAMS.jupiter.hexagonStrength).toBe(0);
    expect(GAS_PARAMS.uranus.hexagonStrength).toBe(0);
    expect(GAS_PARAMS.neptune.hexagonStrength).toBe(0);
  });

  it('Jupiter and Neptune have persistent storms; Saturn and Uranus do not', () => {
    expect(GAS_PARAMS.jupiter.spotIntensity).toBeGreaterThan(0);
    expect(GAS_PARAMS.neptune.spotIntensity).toBeGreaterThan(0);
    expect(GAS_PARAMS.saturn.spotIntensity).toBe(0);
    expect(GAS_PARAMS.uranus.spotIntensity).toBe(0);
  });

  it('Uranus has near-zero band intensity (featureless)', () => {
    expect(GAS_PARAMS.uranus.bandIntensity).toBeLessThan(0.2);
  });
});

// ---------------------------------------------------------------------------
// Saturn ring geometry sanity — Cassini Division must be non-empty; A/B/C
// must be ordered and non-overlapping.
// ---------------------------------------------------------------------------

describe('Saturn ring geometry', () => {
  const g = SATURN_RING_GEOMETRY;

  it('C, B, A rings are ordered radially inside-out', () => {
    expect(g.innerC).toBeLessThan(g.outerC);
    expect(g.outerC).toBeLessThanOrEqual(g.innerB);
    expect(g.innerB).toBeLessThan(g.outerB);
    expect(g.outerB).toBeLessThan(g.innerA);          // ← Cassini Division
    expect(g.innerA).toBeLessThan(g.outerA);
  });

  it('Cassini Division is non-zero (B outer → A inner)', () => {
    const gapRatio = g.innerA - g.outerB;
    // 4,700 km / 60,268 km ≈ 0.078 parent-radii.
    expect(gapRatio).toBeGreaterThan(0.05);
    expect(gapRatio).toBeLessThan(0.12);
  });

  it('Encke Gap sits inside the A ring', () => {
    expect(g.enckeGapCenter).toBeGreaterThan(g.innerA);
    expect(g.enckeGapCenter).toBeLessThan(g.outerA);
    expect(g.enckeGapWidth).toBeGreaterThan(0);
  });

  it('ring palette matches Doc 18 anchors within ΔE < 5', () => {
    expect(deltaE76(
      hexToRgb(SATURN_RING_PALETTE.colorC),
      hexToRgb('#F0F0E0'),
    )).toBeLessThan(5);
    expect(deltaE76(
      hexToRgb(SATURN_RING_PALETTE.colorB),
      hexToRgb('#FFFFDD'),
    )).toBeLessThan(5);
    expect(deltaE76(
      hexToRgb(SATURN_RING_PALETTE.colorA),
      hexToRgb('#D4D4B8'),
    )).toBeLessThan(5);
  });
});

describe('kind guards', () => {
  it('classifies rocky vs gas', () => {
    expect(isRockyPlanet('earth')).toBe(true);
    expect(isRockyPlanet('jupiter')).toBe(false);
    expect(isGasGiant('saturn')).toBe(true);
    expect(isGasGiant('mercury')).toBe(false);
  });
});
