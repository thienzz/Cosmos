/**
 * IEEE 754 half-precision (binary16) → float32 decode. Doc 11 §4.1 packs star
 * tile coordinates as float16 at 0.01 pc resolution; galaxy records also use it
 * for magnitude + angular size. Most browsers ship `DataView.prototype.getFloat16`
 * (TC39 Float16Array stage 4) but we can't rely on it yet, so we carry a pure
 * software path.
 */

const POW2_NEG14 = Math.pow(2, -14);

export function float16ToFloat32(u16: number): number {
  const sign = (u16 & 0x8000) >> 15;
  const exponent = (u16 & 0x7c00) >> 10;
  const mantissa = u16 & 0x03ff;

  if (exponent === 0) {
    if (mantissa === 0) return sign === 0 ? 0 : -0;
    const value = POW2_NEG14 * (mantissa / 1024);
    return sign === 0 ? value : -value;
  }
  if (exponent === 0x1f) {
    if (mantissa === 0) return sign === 0 ? Infinity : -Infinity;
    return NaN;
  }
  const value = Math.pow(2, exponent - 15) * (1 + mantissa / 1024);
  return sign === 0 ? value : -value;
}

/**
 * Read a little-endian float16 from a DataView. Uses the native
 * `getFloat16` if the runtime exposes it; otherwise falls back to the
 * software decoder.
 */
export function readFloat16LE(view: DataView, offset: number): number {
  const native = (view as unknown as {
    getFloat16?: (offset: number, littleEndian?: boolean) => number;
  }).getFloat16;
  if (typeof native === 'function') {
    return native.call(view, offset, true);
  }
  return float16ToFloat32(view.getUint16(offset, true));
}
