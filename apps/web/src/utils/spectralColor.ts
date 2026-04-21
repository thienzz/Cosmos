/**
 * Spectral type → colour mapping for the Main-Sequence shader family.
 *
 * Two complementary paths:
 *   - Discrete lookup matching the Doc 18 §Star Rendering reference hex codes
 *     (authoritative for TS-VQA-001). Use when the star's Morgan–Keenan class
 *     is known directly.
 *   - Blackbody path using Ballesteros 2012 for B-V → T and a compact RGB
 *     approximation of the Planckian locus for T → RGB. Use when only
 *     photometric colours are available.
 *
 * CIE Lab helpers and a ΔE76 metric support unit tests that assert the
 * shader path produces colours within tolerance of the Doc 18 targets.
 */

export type SpectralClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Doc 18 canonical hex values for each main-sequence class. */
export const SPECTRAL_HEX: Record<SpectralClass, string> = {
  O: '#0080FF',
  B: '#0099FF',
  A: '#00CCFF',
  F: '#FFFFCC',
  G: '#FFFF99',
  K: '#FFCC99',
  M: '#FF9966',
};

/**
 * Integer code matching the binary-tile packing (Doc 11 §4.1):
 * 0=O, 1=B, 2=A, 3=F, 4=G, 5=K, 6=M, 7=Unknown.
 */
export const SPECTRAL_CLASSES: SpectralClass[] = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
export const UNKNOWN_SPECTRAL_CODE = 7;

export function spectralClassFromCode(code: number): SpectralClass | 'Unknown' {
  if (code < 0 || code >= SPECTRAL_CLASSES.length) return 'Unknown';
  return SPECTRAL_CLASSES[code] as SpectralClass;
}

export function spectralCodeFromClass(cls: SpectralClass): number {
  return SPECTRAL_CLASSES.indexOf(cls);
}

/** Parse "#RRGGBB" or "RRGGBB" into sRGB 0–1 floats. */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return { r, g, b };
}

/** Doc 18 reference colour for a spectral class, in sRGB 0–1. */
export function colorForSpectralClass(cls: SpectralClass): RGB {
  return hexToRgb(SPECTRAL_HEX[cls]);
}

/** Doc 18 reference colour from the binary-tile spectral code. */
export function colorForSpectralCode(code: number): RGB {
  const cls = spectralClassFromCode(code);
  return cls === 'Unknown' ? { r: 0.8, g: 0.8, b: 0.8 } : colorForSpectralClass(cls);
}

/**
 * Ballesteros 2012 — effective temperature from B-V colour index.
 *
 * T = 4600 · ( 1/(0.92·BV + 1.7) + 1/(0.92·BV + 0.62) )
 *
 * Valid for main-sequence stars with B-V ∈ [-0.4, 2.0].
 */
export function bvToTemperature(bv: number): number {
  const a = 0.92 * bv + 1.7;
  const b = 0.92 * bv + 0.62;
  return 4600 * (1 / a + 1 / b);
}

/**
 * Approximate blackbody colour for a given temperature (Kelvin).
 * Based on the widely-used piecewise fit by Tanner Helland (sRGB, gamma-encoded).
 * Accurate to within a few ΔE units for T ∈ [1000, 40000] K.
 */
export function temperatureToRgb(tempK: number): RGB {
  const t = Math.max(1000, Math.min(40000, tempK)) / 100;

  let r: number;
  let g: number;
  let b: number;

  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }

  const clamp255 = (x: number): number => Math.max(0, Math.min(255, x));
  return { r: clamp255(r) / 255, g: clamp255(g) / 255, b: clamp255(b) / 255 };
}

/** Convenience: go straight from B-V to RGB via the blackbody fit. */
export function bvToRgb(bv: number): RGB {
  return temperatureToRgb(bvToTemperature(bv));
}

// ---------------------------------------------------------------------------
// CIE Lab helpers (for tests only; not used on the render path).
// ---------------------------------------------------------------------------

interface Lab {
  L: number;
  a: number;
  b: number;
}

/** Undo sRGB companding (gamma) → linear RGB in 0–1. */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convert sRGB (0–1) to CIE Lab with D65 reference white.
 * Exported for tests asserting ΔE tolerance (TS-VQA-001).
 */
export function rgbToLab(rgb: RGB): Lab {
  const R = srgbToLinear(rgb.r);
  const G = srgbToLinear(rgb.g);
  const B = srgbToLinear(rgb.b);

  // sRGB → XYZ (D65)
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;

  // Normalise to the D65 white-point.
  const Xn = X / 0.95047;
  const Yn = Y / 1.0;
  const Zn = Z / 1.08883;

  const f = (t: number): number =>
    t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27) * t + 16 / 116;

  const fx = f(Xn);
  const fy = f(Yn);
  const fz = f(Zn);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/** CIE76 colour difference. Use for rough equality checks (tolerance ~3-5). */
export function deltaE76(a: RGB, b: RGB): number {
  const la = rgbToLab(a);
  const lb = rgbToLab(b);
  return Math.sqrt((la.L - lb.L) ** 2 + (la.a - lb.a) ** 2 + (la.b - lb.b) ** 2);
}
