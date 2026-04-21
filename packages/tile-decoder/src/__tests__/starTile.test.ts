import { STAR_TILE_HEADER_BYTES, STAR_TILE_RECORD_BYTES } from '@cosmos/shared-types';
import { describe, expect, it } from 'vitest';


import {
  decodeStarTile,
  decodeStarTileHeader,
  decodeStarTileToBuffers,
  TileDecodeError,
  unpackColorIndex,
  unpackMagnitude,
} from '../starTile';

/**
 * Encode a float32 → float16 (little-endian) roundtrip helper for tests.
 * Uses the native `Float16Array` if available, otherwise a software path.
 */
function encodeFloat16(value: number): number {
  if (value === 0) return 0;
  const sign = value < 0 ? 1 : 0;
  const abs = Math.abs(value);
  if (!Number.isFinite(abs)) return (sign << 15) | 0x7c00;
  const log = Math.floor(Math.log2(abs));
  const exponent = log + 15;
  if (exponent >= 0x1f) return (sign << 15) | 0x7c00;
  if (exponent <= 0) {
    // Subnormal
    const m = Math.round(abs / Math.pow(2, -24));
    return (sign << 15) | (m & 0x3ff);
  }
  const mantissa = Math.round((abs / Math.pow(2, log) - 1) * 1024);
  return (sign << 15) | (exponent << 10) | (mantissa & 0x3ff);
}

function buildStarTile(records: Array<{ x: number; y: number; z: number; mag: number; color: number; spec: number; flags?: number; catalogIndex?: number }>): ArrayBuffer {
  const buf = new ArrayBuffer(STAR_TILE_HEADER_BYTES + records.length * STAR_TILE_RECORD_BYTES);
  const v = new DataView(buf);
  v.setUint32(0, 0xabcd1234, true);
  v.setUint32(4, records.length, true);
  v.setFloat32(8, 0, true);
  v.setFloat32(12, 100, true);
  for (let i = 0; i < records.length; i++) {
    const r = records[i]!;
    const o = STAR_TILE_HEADER_BYTES + i * STAR_TILE_RECORD_BYTES;
    v.setUint16(o + 0, encodeFloat16(r.x), true);
    v.setUint16(o + 2, encodeFloat16(r.y), true);
    v.setUint16(o + 4, encodeFloat16(r.z), true);
    v.setUint8(o + 6, r.mag);
    v.setUint8(o + 7, r.color);
    v.setUint8(o + 8, r.spec);
    v.setUint8(o + 9, r.flags ?? 0);
    v.setUint16(o + 10, r.catalogIndex ?? 0, true);
  }
  return buf;
}

describe('decodeStarTile', () => {
  it('decodes a well-formed star tile header + records (TS-TILE-002)', () => {
    const buf = buildStarTile([
      { x: 0.25, y: -0.5, z: 1, mag: 128, color: 100, spec: 4, flags: 0x01, catalogIndex: 42 },
      { x: 5, y: -5, z: 10, mag: 200, color: 150, spec: 6, catalogIndex: 43 },
    ]);
    const { header, records } = decodeStarTile(buf);
    expect(header.tile_id).toBe(0xabcd1234);
    expect(header.star_count).toBe(2);
    expect(header.min_distance).toBeCloseTo(0);
    expect(header.max_distance).toBeCloseTo(100);
    expect(records).toHaveLength(2);

    // float16 has ~3 decimal digits precision; loose tolerance.
    expect(records[0]!.x).toBeCloseTo(0.25, 2);
    expect(records[0]!.y).toBeCloseTo(-0.5, 2);
    expect(records[0]!.z).toBeCloseTo(1, 2);
    expect(records[0]!.magnitude).toBe(128);
    expect(records[0]!.color_index).toBe(100);
    expect(records[0]!.spectral_type).toBe(4);
    expect(records[0]!.flags).toBe(0x01);
    expect(records[0]!.catalog_index).toBe(42);

    expect(records[1]!.x).toBeCloseTo(5, 1);
    expect(records[1]!.catalog_index).toBe(43);
  });

  it('decodeStarTileToBuffers yields Float32Array of length 3·count and matching Uint8Arrays', () => {
    const buf = buildStarTile([
      { x: 1, y: 2, z: 3, mag: 50, color: 80, spec: 2 },
      { x: 4, y: 5, z: 6, mag: 60, color: 90, spec: 3 },
    ]);
    const { positions, magnitudes, colorIndices, spectralTypes, header } = decodeStarTileToBuffers(buf);
    expect(header.star_count).toBe(2);
    expect(positions.length).toBe(6);
    expect(magnitudes.length).toBe(2);
    expect(colorIndices.length).toBe(2);
    expect(spectralTypes.length).toBe(2);
    expect(positions[0]).toBeCloseTo(1, 1);
    expect(positions[3]).toBeCloseTo(4, 1);
    expect(magnitudes[0]).toBe(50);
    expect(spectralTypes[1]).toBe(3);
  });

  it('decodeStarTileHeader throws INVALID_TILE_FORMAT on short buffer', () => {
    const buf = new ArrayBuffer(8);
    expect(() => decodeStarTileHeader(buf)).toThrow(TileDecodeError);
  });

  it('decodeStarTile throws on truncation', () => {
    const good = buildStarTile([{ x: 0, y: 0, z: 0, mag: 0, color: 0, spec: 0 }]);
    const truncated = good.slice(0, good.byteLength - 4);
    expect(() => decodeStarTile(truncated)).toThrow(TileDecodeError);
  });

  it('decodeStarTile throws if star_count exceeds guard', () => {
    const buf = new ArrayBuffer(STAR_TILE_HEADER_BYTES);
    new DataView(buf).setUint32(4, 5_000_000, true);
    expect(() => decodeStarTile(buf)).toThrow(TileDecodeError);
  });

  it('unpackMagnitude / unpackColorIndex cover full range', () => {
    expect(unpackMagnitude(0)).toBeCloseTo(-5);
    expect(unpackMagnitude(255)).toBeCloseTo(21);
    expect(unpackColorIndex(0)).toBeCloseTo(-0.5);
    expect(unpackColorIndex(255)).toBeCloseTo(3.5);
  });
});
