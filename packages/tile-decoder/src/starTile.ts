/**
 * Star tile binary decoder (Doc 11 §4.1, Doc 26 §7.1).
 *
 * Layout (little-endian):
 *   Header (16 B):
 *     u32 tile_id | u32 star_count | f32 min_distance | f32 max_distance
 *   Record (16 B, repeats `star_count` times):
 *     f16 x | f16 y | f16 z | u8 magnitude | u8 color_index |
 *     u8 spectral_type | u8 flags | u16 catalog_index | 4 B pad
 *
 * Coordinates are relative to tile centre at 0.01 pc resolution; magnitude
 * and color_index are linearly quantised.
 */

import {
  STAR_TILE_HEADER_BYTES,
  STAR_TILE_RECORD_BYTES,
  type StarTileHeader,
  type StarTileRecord,
} from '@cosmos/shared-types';

import { readFloat16LE } from './float16';

export class TileDecodeError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'TileDecodeError';
    this.code = code;
  }
}

export interface DecodedStarTile {
  header: StarTileHeader;
  records: StarTileRecord[];
}

/** Maximum star records we will accept in a single tile. Guards against garbage data. */
const STAR_TILE_MAX_RECORDS = 1_000_000;

export function decodeStarTileHeader(buffer: ArrayBuffer, byteOffset = 0): StarTileHeader {
  if (buffer.byteLength - byteOffset < STAR_TILE_HEADER_BYTES) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Star tile buffer too small: ${buffer.byteLength - byteOffset} < ${STAR_TILE_HEADER_BYTES}`,
    );
  }
  const view = new DataView(buffer, byteOffset, STAR_TILE_HEADER_BYTES);
  return {
    tile_id: view.getUint32(0, true),
    star_count: view.getUint32(4, true),
    min_distance: view.getFloat32(8, true),
    max_distance: view.getFloat32(12, true),
  };
}

export function decodeStarTile(buffer: ArrayBuffer, byteOffset = 0): DecodedStarTile {
  const header = decodeStarTileHeader(buffer, byteOffset);

  if (header.star_count > STAR_TILE_MAX_RECORDS) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Star tile claims ${header.star_count} records; exceeds guard of ${STAR_TILE_MAX_RECORDS}`,
    );
  }

  const expectedBytes = STAR_TILE_HEADER_BYTES + header.star_count * STAR_TILE_RECORD_BYTES;
  if (buffer.byteLength - byteOffset < expectedBytes) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Star tile truncated: need ${expectedBytes} bytes, have ${buffer.byteLength - byteOffset}`,
    );
  }

  const recordBase = byteOffset + STAR_TILE_HEADER_BYTES;
  const view = new DataView(buffer, recordBase, header.star_count * STAR_TILE_RECORD_BYTES);
  const records: StarTileRecord[] = new Array(header.star_count);

  for (let i = 0; i < header.star_count; i++) {
    const o = i * STAR_TILE_RECORD_BYTES;
    records[i] = {
      x: readFloat16LE(view, o + 0),
      y: readFloat16LE(view, o + 2),
      z: readFloat16LE(view, o + 4),
      magnitude: view.getUint8(o + 6),
      color_index: view.getUint8(o + 7),
      spectral_type: view.getUint8(o + 8),
      flags: view.getUint8(o + 9),
      catalog_index: view.getUint16(o + 10, true),
    };
  }

  return { header, records };
}

/**
 * Decode a star tile straight into typed arrays ready for GPU upload.
 * The renderer consumes these as InstancedBufferAttributes (T26) so we
 * skip the intermediate `StarTileRecord[]` array.
 */
export interface StarTileBuffers {
  header: StarTileHeader;
  /** Packed xyz in world-space pc (tile-centre-relative, float32). length = 3·count */
  positions: Float32Array;
  /** Quantised magnitude byte, length = count */
  magnitudes: Uint8Array;
  /** Quantised colour-index byte, length = count */
  colorIndices: Uint8Array;
  /** Spectral type enum 0..7, length = count */
  spectralTypes: Uint8Array;
}

export function decodeStarTileToBuffers(
  buffer: ArrayBuffer,
  byteOffset = 0,
): StarTileBuffers {
  const header = decodeStarTileHeader(buffer, byteOffset);
  if (header.star_count > STAR_TILE_MAX_RECORDS) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Star tile claims ${header.star_count} records; exceeds guard of ${STAR_TILE_MAX_RECORDS}`,
    );
  }
  const expectedBytes = STAR_TILE_HEADER_BYTES + header.star_count * STAR_TILE_RECORD_BYTES;
  if (buffer.byteLength - byteOffset < expectedBytes) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Star tile truncated: need ${expectedBytes} bytes, have ${buffer.byteLength - byteOffset}`,
    );
  }

  const count = header.star_count;
  const positions = new Float32Array(count * 3);
  const magnitudes = new Uint8Array(count);
  const colorIndices = new Uint8Array(count);
  const spectralTypes = new Uint8Array(count);

  const recordBase = byteOffset + STAR_TILE_HEADER_BYTES;
  const view = new DataView(buffer, recordBase, count * STAR_TILE_RECORD_BYTES);

  for (let i = 0; i < count; i++) {
    const o = i * STAR_TILE_RECORD_BYTES;
    positions[i * 3 + 0] = readFloat16LE(view, o + 0);
    positions[i * 3 + 1] = readFloat16LE(view, o + 2);
    positions[i * 3 + 2] = readFloat16LE(view, o + 4);
    magnitudes[i] = view.getUint8(o + 6);
    colorIndices[i] = view.getUint8(o + 7);
    spectralTypes[i] = view.getUint8(o + 8);
  }

  return { header, positions, magnitudes, colorIndices, spectralTypes };
}

/** Decode packed magnitude byte → G magnitude in range [-5, 21]. */
export function unpackMagnitude(byte: number): number {
  return -5 + (byte / 255) * 26;
}

/** Decode packed color-index byte → BP-RP in range [-0.5, 3.5]. */
export function unpackColorIndex(byte: number): number {
  return -0.5 + (byte / 255) * 4;
}
