import { describe, expect, it } from 'vitest';

import { decodeStarTile, decodeStarTileToBuffers } from '../starTile';
import { encodeStarTile, packColorIndex, packMagnitude } from '../starTileEncode';
import { float32ToFloat16 } from '../float16Encode';
import { float16ToFloat32 } from '../float16';

describe('encodeStarTile', () => {
  it('round-trips header + records through the decoder', () => {
    const buffer = encodeStarTile({
      tileId: 0xdeadbeef,
      minDistance: 1.25,
      maxDistance: 17.5,
      stars: [
        {
          x: 0.25,
          y: -0.5,
          z: 1,
          magnitude: packMagnitude(5),
          colorIndex: packColorIndex(0.6),
          spectralType: 4,
          flags: 0x03,
          catalogIndex: 42,
        },
        {
          x: 12.5,
          y: 7,
          z: -3.75,
          magnitude: packMagnitude(-1),
          colorIndex: packColorIndex(1.5),
          spectralType: 5,
          flags: 0,
          catalogIndex: 1000,
        },
      ],
    });
    const { header, records } = decodeStarTile(buffer);
    expect(header.tile_id >>> 0).toBe(0xdeadbeef);
    expect(header.star_count).toBe(2);
    expect(header.min_distance).toBeCloseTo(1.25, 5);
    expect(header.max_distance).toBeCloseTo(17.5, 5);

    // float16 precision ~3 decimal digits for values with |x|<2; looser as |x| grows.
    expect(records[0]!.x).toBeCloseTo(0.25, 2);
    expect(records[0]!.y).toBeCloseTo(-0.5, 2);
    expect(records[0]!.z).toBeCloseTo(1, 2);
    expect(records[0]!.magnitude).toBe(packMagnitude(5));
    expect(records[0]!.color_index).toBe(packColorIndex(0.6));
    expect(records[0]!.spectral_type).toBe(4);
    expect(records[0]!.flags).toBe(0x03);
    expect(records[0]!.catalog_index).toBe(42);

    // Larger magnitudes: float16 keeps ~1 decimal digit at |x|=12.
    expect(records[1]!.x).toBeCloseTo(12.5, 1);
    expect(records[1]!.y).toBeCloseTo(7, 1);
    expect(records[1]!.z).toBeCloseTo(-3.75, 1);
    expect(records[1]!.catalog_index).toBe(1000);
  });

  it('decodeStarTileToBuffers matches the encoded positions', () => {
    const buffer = encodeStarTile({
      tileId: 1,
      minDistance: 0,
      maxDistance: 50,
      stars: Array.from({ length: 50 }, (_, i) => ({
        x: i,
        y: -i,
        z: i * 0.1,
        magnitude: packMagnitude(i / 10),
        colorIndex: packColorIndex(1),
        spectralType: 4,
        flags: 0,
        catalogIndex: i,
      })),
    });
    const { positions, magnitudes, spectralTypes } = decodeStarTileToBuffers(buffer);
    expect(positions.length).toBe(150);
    expect(magnitudes.length).toBe(50);
    expect(spectralTypes[0]).toBe(4);
    // Precision is reasonable for small integers.
    expect(positions[0]).toBeCloseTo(0, 5);
    expect(positions[3]).toBeCloseTo(1, 2);
    expect(positions[30]).toBeCloseTo(10, 1);
  });

  it('produces an empty tile with 0 records', () => {
    const buffer = encodeStarTile({
      tileId: 99,
      minDistance: 0,
      maxDistance: 0,
      stars: [],
    });
    expect(buffer.byteLength).toBe(16);
    const { header, records } = decodeStarTile(buffer);
    expect(header.star_count).toBe(0);
    expect(records).toEqual([]);
  });

  it('packMagnitude / packColorIndex are inverses of the decoder helpers', () => {
    for (const mag of [-5, -2, 0, 5, 10, 15, 21]) {
      const packed = packMagnitude(mag);
      expect(packed).toBeGreaterThanOrEqual(0);
      expect(packed).toBeLessThanOrEqual(255);
      const round = -5 + (packed / 255) * 26;
      expect(round).toBeCloseTo(mag, 0);
    }
    for (const bv of [-0.5, 0, 0.5, 1, 2, 3.5]) {
      const packed = packColorIndex(bv);
      const round = -0.5 + (packed / 255) * 4;
      expect(round).toBeCloseTo(bv, 1);
    }
  });

  it('clamps values outside the valid range', () => {
    expect(packMagnitude(-100)).toBe(0);
    expect(packMagnitude(100)).toBe(255);
    expect(packColorIndex(-5)).toBe(0);
    expect(packColorIndex(10)).toBe(255);
  });
});

describe('float32ToFloat16', () => {
  it('round-trips finite values within float16 precision', () => {
    // Float16 has ~10 mantissa bits ⇒ relative error ~ 2^-11 ≈ 0.0005 of the
    // value's magnitude. Assert relative error, not absolute — `toBeCloseTo`
    // with a fixed digit count bites when the magnitude exceeds 1.
    for (const v of [0, -0, 1, -1, 0.5, 3.1415, -100, 1000, -42.25]) {
      const u16 = float32ToFloat16(v);
      const back = float16ToFloat32(u16);
      if (v === 0 || Object.is(v, -0)) {
        expect(back === 0 || Object.is(back, -0)).toBe(true);
        continue;
      }
      const relError = Math.abs(back - v) / Math.abs(v);
      expect(relError).toBeLessThan(1e-3);
    }
  });

  it('clamps out-of-range values to max finite', () => {
    const u16 = float32ToFloat16(1e6);
    const back = float16ToFloat32(u16);
    expect(back).toBeGreaterThan(65000);
    expect(back).toBeLessThan(66000);
  });
});
