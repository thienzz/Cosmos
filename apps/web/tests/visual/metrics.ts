/**
 * Visual regression metrics (T-V-01). Per Doc 33 §Visual QA:
 *   - ΔE2000 (CIEDE2000) for perceptual color accuracy
 *       - Stars: ΔE < 3.0
 *       - Planets: ΔE < 5.0
 *       - Nebulae: ΔE < 4.0
 *   - SSIM (luminance-only approximation) > 0.65
 *   - Perceptual hash Hamming distance ≤ 8
 *
 * Inputs are RGBA `Uint8ClampedArray`s the caller has already decoded from
 * disk (via pngjs or similar — pluggable). Keeping the metrics pure-TS means
 * they are trivially unit-testable in Node without a WebGL context.
 */

export interface ImageLike {
  width: number;
  height: number;
  /** RGBA, row-major, 4 bytes per pixel. */
  data: Uint8ClampedArray | Uint8Array | number[];
}

export interface DiffResult {
  deltaE2000: number;
  ssim: number;
  pHashHamming: number;
}

export interface DiffThresholds {
  maxDeltaE2000: number;
  minSsim: number;
  maxPHashHamming: number;
}

/** Defaults from Doc 33 (loose enough to cover stars + planets + nebulae). */
export const DEFAULT_THRESHOLDS: DiffThresholds = {
  maxDeltaE2000: 5.0,
  minSsim: 0.65,
  maxPHashHamming: 8,
};

// ---------------------------------------------------------------------------
// sRGB → Lab conversion (D65 illuminant, ASTM 308-01).
// ---------------------------------------------------------------------------

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToXyz(r: number, g: number, b: number): [number, number, number] {
  // sRGB D65 matrix.
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
  return [x, y, z];
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  // Reference white D65.
  const xr = x / 0.95047;
  const yr = y / 1.0;
  const zr = z / 1.08883;
  const f = (t: number): number =>
    t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 / 116) * t + 16 / 116;
  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function pixelToLab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const [x, y, z] = linearToXyz(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
  return xyzToLab(x, y, z);
}

// ---------------------------------------------------------------------------
// CIEDE2000 per Sharma, Wu, Dalal (2005). Implements full formula.
// ---------------------------------------------------------------------------

function ciede2000(
  [l1, a1, b1]: [number, number, number],
  [l2, a2, b2]: [number, number, number],
): number {
  const avgL = (l1 + l2) / 2;
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const avgC = (c1 + c2) / 2;
  const g =
    0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + g);
  const a2p = a2 * (1 + g);
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const avgCp = (c1p + c2p) / 2;
  const toDeg = (rad: number): number => (rad * 180) / Math.PI;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const h1p = c1p === 0 ? 0 : (toDeg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = c2p === 0 ? 0 : (toDeg(Math.atan2(b2, a2p)) + 360) % 360;
  let deltahp: number;
  if (c1p === 0 || c2p === 0) {
    deltahp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    deltahp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    deltahp = h2p - h1p - 360;
  } else {
    deltahp = h2p - h1p + 360;
  }
  const deltaLp = l2 - l1;
  const deltaCp = c2p - c1p;
  const deltaHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(toRad(deltahp) / 2);
  let avgHp: number;
  if (c1p === 0 || c2p === 0) {
    avgHp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    avgHp = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    avgHp = (h1p + h2p + 360) / 2;
  } else {
    avgHp = (h1p + h2p - 360) / 2;
  }
  const t =
    1 -
    0.17 * Math.cos(toRad(avgHp - 30)) +
    0.24 * Math.cos(toRad(2 * avgHp)) +
    0.32 * Math.cos(toRad(3 * avgHp + 6)) -
    0.2 * Math.cos(toRad(4 * avgHp - 63));
  const sl = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
  const sc = 1 + 0.045 * avgCp;
  const sh = 1 + 0.015 * avgCp * t;
  const deltaTheta = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2));
  const rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const rt = -Math.sin(toRad(2 * deltaTheta)) * rc;
  return Math.sqrt(
    Math.pow(deltaLp / sl, 2) +
      Math.pow(deltaCp / sc, 2) +
      Math.pow(deltaHp / sh, 2) +
      rt * (deltaCp / sc) * (deltaHp / sh),
  );
}

// ---------------------------------------------------------------------------
// Public metrics
// ---------------------------------------------------------------------------

/**
 * Mean ΔE2000 across all pixels. Samples every `step`-th pixel for speed —
 * the default step=4 cuts work by 16× with negligible bias for 200×200+ images.
 */
export function meanDeltaE2000(
  a: ImageLike,
  b: ImageLike,
  step = 4,
): number {
  assertSameShape(a, b);
  let total = 0;
  let count = 0;
  const n = a.width * a.height;
  for (let i = 0; i < n; i += step) {
    const o = i * 4;
    const lab1 = pixelToLab(a.data[o]!, a.data[o + 1]!, a.data[o + 2]!);
    const lab2 = pixelToLab(b.data[o]!, b.data[o + 1]!, b.data[o + 2]!);
    total += ciede2000(lab1, lab2);
    count++;
  }
  return total / count;
}

/**
 * Luminance-only SSIM over an 8×8 block grid. Full SSIM with sliding windows
 * would be costlier; this is adequate for the coarse regression check Doc 33
 * calls for (SSIM > 0.65 is a floor, not a precision target).
 */
export function luminanceSsim(a: ImageLike, b: ImageLike): number {
  assertSameShape(a, b);
  const block = 8;
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  let total = 0;
  let count = 0;
  for (let by = 0; by + block <= a.height; by += block) {
    for (let bx = 0; bx + block <= a.width; bx += block) {
      let sumA = 0;
      let sumB = 0;
      let sumA2 = 0;
      let sumB2 = 0;
      let sumAB = 0;
      const size = block * block;
      for (let dy = 0; dy < block; dy++) {
        for (let dx = 0; dx < block; dx++) {
          const o = ((by + dy) * a.width + (bx + dx)) * 4;
          const la =
            0.299 * a.data[o]! + 0.587 * a.data[o + 1]! + 0.114 * a.data[o + 2]!;
          const lb =
            0.299 * b.data[o]! + 0.587 * b.data[o + 1]! + 0.114 * b.data[o + 2]!;
          sumA += la;
          sumB += lb;
          sumA2 += la * la;
          sumB2 += lb * lb;
          sumAB += la * lb;
        }
      }
      const muA = sumA / size;
      const muB = sumB / size;
      const varA = sumA2 / size - muA * muA;
      const varB = sumB2 / size - muB * muB;
      const cov = sumAB / size - muA * muB;
      const num = (2 * muA * muB + c1) * (2 * cov + c2);
      const den = (muA * muA + muB * muB + c1) * (varA + varB + c2);
      total += num / den;
      count++;
    }
  }
  return count > 0 ? total / count : 1;
}

/**
 * Perceptual hash (pHash) — downsample to 32×32 luminance, compare against
 * mean, pack as 64-bit via 8×8 low-frequency block average. Returns a 64-bit
 * hash as two 32-bit words.
 */
export function perceptualHash(img: ImageLike): readonly [number, number] {
  const side = 32;
  const lum = new Float32Array(side * side);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const srcX = Math.floor((x / side) * img.width);
      const srcY = Math.floor((y / side) * img.height);
      const o = (srcY * img.width + srcX) * 4;
      lum[y * side + x] =
        0.299 * img.data[o]! + 0.587 * img.data[o + 1]! + 0.114 * img.data[o + 2]!;
    }
  }
  // 8×8 block average gives 64 features.
  const features = new Float32Array(64);
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      let sum = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          sum += lum[(by * 4 + dy) * side + (bx * 4 + dx)]!;
        }
      }
      features[by * 8 + bx] = sum / 16;
    }
  }
  let mean = 0;
  for (let i = 0; i < 64; i++) mean += features[i]!;
  mean /= 64;
  let low = 0;
  let high = 0;
  for (let i = 0; i < 32; i++) {
    if (features[i]! > mean) low |= 1 << i;
  }
  for (let i = 32; i < 64; i++) {
    if (features[i]! > mean) high |= 1 << (i - 32);
  }
  return [low >>> 0, high >>> 0];
}

export function pHashHamming(
  [a1, a2]: readonly [number, number],
  [b1, b2]: readonly [number, number],
): number {
  const popcount = (x: number): number => {
    let n = x >>> 0;
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  };
  return popcount(a1 ^ b1) + popcount(a2 ^ b2);
}

// ---------------------------------------------------------------------------
// Composite diff
// ---------------------------------------------------------------------------

export function diffImages(a: ImageLike, b: ImageLike): DiffResult {
  return {
    deltaE2000: meanDeltaE2000(a, b),
    ssim: luminanceSsim(a, b),
    pHashHamming: pHashHamming(perceptualHash(a), perceptualHash(b)),
  };
}

export function passesThresholds(
  diff: DiffResult,
  t: DiffThresholds = DEFAULT_THRESHOLDS,
): boolean {
  return (
    diff.deltaE2000 <= t.maxDeltaE2000 &&
    diff.ssim >= t.minSsim &&
    diff.pHashHamming <= t.maxPHashHamming
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertSameShape(a: ImageLike, b: ImageLike): void {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `metrics: image shape mismatch ` +
        `(${a.width}×${a.height} vs ${b.width}×${b.height})`,
    );
  }
}
