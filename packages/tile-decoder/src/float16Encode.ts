/**
 * float32 → IEEE 754 half-precision (binary16) encode. Companion to
 * `float16ToFloat32` in float16.ts. Used by the tile encoder path (Node ETL
 * seeder, test fixtures). The browser render path only ever *decodes*.
 *
 * Algorithm follows the standard shift-and-round approach (round-to-nearest-
 * even for the 13-bit mantissa truncation). Values outside the finite
 * float16 range clamp to ±65504 (largest representable finite) rather than
 * ±Infinity, because Doc 11 §4.1 coordinates are physical distances and we
 * want a deterministic projection into the 16-bit space.
 */

const FLOAT16_MAX_FINITE = 65504;

export function float32ToFloat16(value: number): number {
  if (Number.isNaN(value)) return 0x7e00; // quiet NaN

  // Pack sign bit now; operate on magnitude for the rest.
  const sign = value < 0 || Object.is(value, -0) ? 0x8000 : 0;
  let magnitude = Math.abs(value);

  // Clamp infinites + overflow to the largest finite float16.
  if (!Number.isFinite(magnitude) || magnitude > FLOAT16_MAX_FINITE) {
    magnitude = FLOAT16_MAX_FINITE;
  }

  if (magnitude === 0) return sign;

  // Float32 bit pattern extracted via typed arrays.
  const fbuf = new Float32Array(1);
  const ibuf = new Uint32Array(fbuf.buffer);
  fbuf[0] = magnitude;
  const bits = ibuf[0]!;
  const exp32 = (bits >>> 23) & 0xff;
  const mant32 = bits & 0x7fffff;

  // Unbiased exponent: exp32 - 127. Float16 bias is 15.
  const e = exp32 - 127 + 15;

  if (e >= 0x1f) {
    // Overflow → clamp to finite max (we already clamped the magnitude above
    // so this branch should be unreachable, but keep the guard).
    return sign | 0x7bff;
  }

  if (e <= 0) {
    // Subnormal or underflow. Float16 subnormals have exponent=0 and a
    // leading implicit 0 bit; representable values are k/2^24 for k ∈ [0, 1023].
    // Mantissa bits to keep = 10 + e; the implicit leading 1 of the float32
    // normal must be restored before the shift.
    if (e < -10) return sign; // pure underflow → ±0
    const mantWithImplicit = mant32 | 0x800000;
    const shift = 14 - e; // e∈[-10,0] → shift∈[14,24]
    let mant16 = mantWithImplicit >>> shift;
    // Round-to-nearest-even on the discarded bits.
    const roundBit = (mantWithImplicit >>> (shift - 1)) & 0x1;
    const stickyMask = (1 << (shift - 1)) - 1;
    const sticky = (mantWithImplicit & stickyMask) !== 0 ? 1 : 0;
    if (roundBit && (sticky || (mant16 & 1))) mant16 += 1;
    return sign | mant16;
  }

  // Normal number. Truncate mantissa with round-to-nearest-even.
  let mant16 = mant32 >>> 13;
  const roundBit = (mant32 >>> 12) & 0x1;
  const sticky = (mant32 & 0xfff) !== 0 ? 1 : 0;
  if (roundBit && (sticky || (mant16 & 1))) mant16 += 1;
  if (mant16 === 0x400) {
    // Carry propagated into the exponent.
    mant16 = 0;
    const e2 = e + 1;
    if (e2 >= 0x1f) return sign | 0x7bff;
    return sign | (e2 << 10);
  }
  return sign | (e << 10) | mant16;
}

export function writeFloat16LE(view: DataView, offset: number, value: number): void {
  const native = (view as unknown as {
    setFloat16?: (offset: number, value: number, littleEndian?: boolean) => void;
  }).setFloat16;
  if (typeof native === 'function') {
    native.call(view, offset, value, true);
    return;
  }
  view.setUint16(offset, float32ToFloat16(value), true);
}
