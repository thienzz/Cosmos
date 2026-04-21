import { describe, expect, it } from 'vitest';

import {
  SPECTRAL_CLASSES,
  SPECTRAL_HEX,
  UNKNOWN_SPECTRAL_CODE,
  bvToRgb,
  bvToTemperature,
  colorForSpectralClass,
  colorForSpectralCode,
  deltaE76,
  hexToRgb,
  rgbToLab,
  spectralClassFromCode,
  spectralCodeFromClass,
  temperatureToRgb,
  type SpectralClass,
} from '../spectralColor';

describe('hex lookup', () => {
  it('parses short and long hex strings to 0-1 sRGB floats', () => {
    const rgb = hexToRgb('#FFFF99');
    expect(rgb.r).toBeCloseTo(1, 4);
    expect(rgb.g).toBeCloseTo(1, 4);
    expect(rgb.b).toBeCloseTo(153 / 255, 4);
    expect(hexToRgb('FFFF99').b).toBeCloseTo(153 / 255, 4);
  });

  it('throws on malformed hex', () => {
    expect(() => hexToRgb('nope')).toThrow();
  });
});

describe('spectral-class discrete table', () => {
  it('has all 7 Morgan-Keenan classes (Doc 18)', () => {
    expect(Object.keys(SPECTRAL_HEX)).toEqual(['O', 'B', 'A', 'F', 'G', 'K', 'M']);
  });

  it('G-class (Sun) is warm yellow #FFFF99', () => {
    const rgb = colorForSpectralClass('G');
    expect(rgb.r).toBeCloseTo(1, 4);
    expect(rgb.g).toBeCloseTo(1, 4);
    expect(rgb.b).toBeCloseTo(0.6, 2); // 153/255 ≈ 0.6
  });

  it('O-class is blue-dominant, M-class is red-dominant', () => {
    const o = colorForSpectralClass('O');
    expect(o.b).toBeGreaterThan(o.r);
    const m = colorForSpectralClass('M');
    expect(m.r).toBeGreaterThan(m.b);
  });
});

describe('spectral code ↔ class mapping (Doc 11 §4.1 packing)', () => {
  it('round-trips all known classes', () => {
    for (const cls of SPECTRAL_CLASSES) {
      const code = spectralCodeFromClass(cls);
      expect(spectralClassFromCode(code)).toBe(cls);
    }
  });

  it('returns "Unknown" for code 7 or out-of-range values', () => {
    expect(spectralClassFromCode(UNKNOWN_SPECTRAL_CODE)).toBe('Unknown');
    expect(spectralClassFromCode(-1)).toBe('Unknown');
    expect(spectralClassFromCode(99)).toBe('Unknown');
  });

  it('colorForSpectralCode falls back to neutral grey for unknowns', () => {
    const grey = colorForSpectralCode(UNKNOWN_SPECTRAL_CODE);
    expect(grey.r).toBeCloseTo(grey.g, 2);
    expect(grey.g).toBeCloseTo(grey.b, 2);
  });
});

describe('Ballesteros 2012 B-V → T', () => {
  it('maps solar B-V = 0.65 to ≈ 5700 K', () => {
    const T = bvToTemperature(0.65);
    expect(T).toBeGreaterThan(5400);
    expect(T).toBeLessThan(6100);
  });

  it('is monotonic: redder (higher B-V) = cooler', () => {
    expect(bvToTemperature(-0.3)).toBeGreaterThan(bvToTemperature(0.0));
    expect(bvToTemperature(0.0)).toBeGreaterThan(bvToTemperature(0.65));
    expect(bvToTemperature(0.65)).toBeGreaterThan(bvToTemperature(1.5));
  });
});

describe('temperatureToRgb (blackbody fit)', () => {
  it('hot stars (30,000 K) are blue-dominant', () => {
    const rgb = temperatureToRgb(30_000);
    expect(rgb.b).toBeGreaterThan(rgb.r);
  });

  it('Sun temperature (5778 K) is pale yellow-white', () => {
    const rgb = temperatureToRgb(5778);
    expect(rgb.r).toBeGreaterThan(0.9);
    expect(rgb.g).toBeGreaterThan(0.85);
    expect(rgb.b).toBeGreaterThan(0.6);
  });

  it('cool stars (3000 K) are red-dominant', () => {
    const rgb = temperatureToRgb(3000);
    expect(rgb.r).toBeGreaterThan(rgb.b);
    expect(rgb.r).toBeGreaterThan(rgb.g);
  });

  it('bvToRgb chains B-V → T → RGB consistently', () => {
    const viaChain = bvToRgb(0.65);
    const direct = temperatureToRgb(bvToTemperature(0.65));
    expect(viaChain.r).toBeCloseTo(direct.r, 6);
    expect(viaChain.g).toBeCloseTo(direct.g, 6);
    expect(viaChain.b).toBeCloseTo(direct.b, 6);
  });
});

describe('CIE Lab + ΔE76', () => {
  it('ΔE to self is zero', () => {
    const rgb = colorForSpectralClass('G');
    expect(deltaE76(rgb, rgb)).toBeCloseTo(0, 6);
  });

  it('maps black → L=0 and white → L≈100', () => {
    expect(rgbToLab({ r: 0, g: 0, b: 0 }).L).toBeCloseTo(0, 4);
    expect(rgbToLab({ r: 1, g: 1, b: 1 }).L).toBeCloseTo(100, 2);
  });

  it('every spectral class is within ΔE 3.0 of its canonical Doc 18 hex (TS-VQA-001)', () => {
    const targets: [SpectralClass, string][] = [
      ['O', '#0080FF'],
      ['B', '#0099FF'],
      ['A', '#00CCFF'],
      ['F', '#FFFFCC'],
      ['G', '#FFFF99'],
      ['K', '#FFCC99'],
      ['M', '#FF9966'],
    ];
    for (const [cls, hex] of targets) {
      const delta = deltaE76(colorForSpectralClass(cls), hexToRgb(hex));
      expect(delta, `ΔE for ${cls}`).toBeLessThan(3.0);
    }
  });
});
