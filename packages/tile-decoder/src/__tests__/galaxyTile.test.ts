import { GALAXY_TILE_HEADER_BYTES, GALAXY_TILE_RECORD_BYTES } from '@cosmos/shared-types';
import { describe, expect, it } from 'vitest';


import { decodeGalaxyTile, decodeGalaxyTileHeader } from '../galaxyTile';
import { TileDecodeError } from '../starTile';

function encodeFloat16(value: number): number {
  if (value === 0) return 0;
  const sign = value < 0 ? 1 : 0;
  const abs = Math.abs(value);
  if (!Number.isFinite(abs)) return (sign << 15) | 0x7c00;
  const log = Math.floor(Math.log2(abs));
  const exponent = log + 15;
  if (exponent >= 0x1f) return (sign << 15) | 0x7c00;
  if (exponent <= 0) {
    const m = Math.round(abs / Math.pow(2, -24));
    return (sign << 15) | (m & 0x3ff);
  }
  const mantissa = Math.round((abs / Math.pow(2, log) - 1) * 1024);
  return (sign << 15) | (exponent << 10) | (mantissa & 0x3ff);
}

function buildGalaxyTile(records: Array<{ ra: number; dec: number; z: number; mag: number; angular: number; morph: number; metaIdx: number }>): ArrayBuffer {
  const buf = new ArrayBuffer(GALAXY_TILE_HEADER_BYTES + records.length * GALAXY_TILE_RECORD_BYTES);
  const v = new DataView(buf);
  v.setUint32(0, records.length, true);
  v.setFloat32(4, 10, true);
  v.setFloat32(8, 500, true);
  v.setUint32(12, 0, true);
  for (let i = 0; i < records.length; i++) {
    const r = records[i]!;
    const o = GALAXY_TILE_HEADER_BYTES + i * GALAXY_TILE_RECORD_BYTES;
    v.setFloat32(o + 0, r.ra, true);
    v.setFloat32(o + 4, r.dec, true);
    v.setFloat32(o + 8, r.z, true);
    v.setUint16(o + 12, encodeFloat16(r.mag), true);
    v.setUint16(o + 14, encodeFloat16(r.angular), true);
    v.setUint8(o + 16, r.morph);
    v.setUint8(o + 17, 0);
    v.setUint16(o + 18, r.metaIdx, true);
  }
  return buf;
}

describe('decodeGalaxyTile (TS-TILE-006)', () => {
  it('decodes header + records', () => {
    const buf = buildGalaxyTile([
      { ra: 180.25, dec: -45.5, z: 0.012, mag: 18.5, angular: 2.5, morph: 3, metaIdx: 99 },
      { ra: 10, dec: 30, z: 0.5, mag: 19.0, angular: 0.5, morph: 10, metaIdx: 100 },
    ]);
    const { header, records } = decodeGalaxyTile(buf);
    expect(header.galaxy_count).toBe(2);
    expect(header.distance_min).toBeCloseTo(10);
    expect(header.distance_max).toBeCloseTo(500);
    expect(records).toHaveLength(2);
    expect(records[0]!.ra).toBeCloseTo(180.25, 3);
    expect(records[0]!.dec).toBeCloseTo(-45.5, 3);
    expect(records[0]!.redshift).toBeCloseTo(0.012, 4);
    expect(records[0]!.magnitude).toBeCloseTo(18.5, 1);
    expect(records[0]!.angular_size).toBeCloseTo(2.5, 1);
    expect(records[0]!.morphology_type).toBe(3);
    expect(records[0]!.metadata_index).toBe(99);
  });

  it('throws on short header buffer', () => {
    expect(() => decodeGalaxyTileHeader(new ArrayBuffer(4))).toThrow(TileDecodeError);
  });
});
