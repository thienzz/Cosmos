/**
 * Float32 precision helpers — useful for judging whether a given scene
 * coordinate is still renderable without visible jitter.
 *
 * IEEE-754 single-precision has a 23-bit mantissa. The representable gap
 * between consecutive values near magnitude `|x|` is
 *
 *   ulp32(x) ≈ 2^(floor(log2(|x|)) − 22)
 *
 * so at |x| ≈ 1e7 the gap is ≈ 1 unit, at 1e9 ≈ 128 units, and at 1e10
 * ≈ 1024 units — visible jitter once the ulp exceeds the visual radius of
 * the entity being rendered.
 *
 * The helpers below are `number`-precision approximations (JS's native
 * Number is float64), but because they wrap through `Math.fround` the
 * answers match what WebGL actually sees per-vertex.
 */

/**
 * Return the float32 "unit in the last place" at magnitude `value` — the
 * smallest delta that is still distinguishable from `value` when stored as
 * a 32-bit IEEE float. Used to judge visible jitter at large scene
 * coordinates.
 *
 * For `value = 0` we return the smallest float32 subnormal magnitude so
 * callers can divide safely.
 */
export function float32Ulp(value: number): number {
  const abs = Math.abs(value);
  if (abs === 0 || !Number.isFinite(abs)) {
    // Smallest positive float32 subnormal.
    return 1.401_298_464_324_817e-45;
  }
  const next = Math.fround(abs + abs * 2 ** -22);
  return next - Math.fround(abs);
}

/** Number of representable float32 digits at magnitude `value`. */
export function float32PrecisionDigits(value: number): number {
  const abs = Math.abs(value);
  if (abs === 0) return 7; // arbitrary — full precision at zero.
  const ulp = float32Ulp(abs);
  if (ulp <= 0) return 7;
  return Math.max(0, Math.log10(abs / ulp));
}

/**
 * Assess whether a scene coordinate of magnitude `value` will jitter when
 * rendered with float32 vertex attributes, compared to the entity's visual
 * footprint `featureSizeScene` (in the same scene units). A coordinate is
 * considered "safe" when the ulp is strictly smaller than the feature
 * size — i.e. you can distinguish the two ends of the entity.
 *
 * Returns `true` for safe, `false` for jitter-prone. The default feature
 * size is 1 unit, which matches the visual radius of a typical galaxy
 * billboard at the cosmic regime (a few pixels on screen).
 */
export function isFloat32Safe(value: number, featureSizeScene = 1): boolean {
  return float32Ulp(value) < featureSizeScene;
}

/**
 * Pick a representative float32-safe coordinate ceiling — the largest
 * magnitude where the ulp remains below `featureSizeScene`. Handy for
 * picking per-regime {@link REGIME_MAX_DISTANCE} values.
 */
export function float32SafeCeiling(featureSizeScene = 1): number {
  // Solve 2^(e-22) < featureSizeScene  →  e < log2(featureSizeScene) + 22
  // The ceiling coordinate is 2^(e+1) where `e` is the largest exponent
  // that still satisfies the inequality.
  const e = Math.floor(Math.log2(featureSizeScene)) + 22;
  return 2 ** (e + 1);
}
