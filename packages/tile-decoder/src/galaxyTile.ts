/**
 * Galaxy tile binary decoder (Doc 11 §4.2, Doc 26 §7.2).
 *
 * Layout (little-endian):
 *   Header (16 B):
 *     u32 galaxy_count | f32 distance_min | f32 distance_max | u32 flags
 *   Record (24 B, repeats `galaxy_count` times):
 *     f32 ra | f32 dec | f32 redshift | f16 magnitude | f16 angular_size |
 *     u8 morphology_type | u8 flags | u16 metadata_index | 4 B pad
 */

import {
  GALAXY_TILE_HEADER_BYTES,
  GALAXY_TILE_RECORD_BYTES,
  type GalaxyTileHeader,
  type GalaxyTileRecord,
} from '@cosmos/shared-types';

import { readFloat16LE } from './float16';
import { TileDecodeError } from './starTile';

export interface DecodedGalaxyTile {
  header: GalaxyTileHeader;
  records: GalaxyTileRecord[];
}

const GALAXY_TILE_MAX_RECORDS = 10_000_000;

export function decodeGalaxyTileHeader(buffer: ArrayBuffer, byteOffset = 0): GalaxyTileHeader {
  if (buffer.byteLength - byteOffset < GALAXY_TILE_HEADER_BYTES) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Galaxy tile buffer too small: ${buffer.byteLength - byteOffset} < ${GALAXY_TILE_HEADER_BYTES}`,
    );
  }
  const view = new DataView(buffer, byteOffset, GALAXY_TILE_HEADER_BYTES);
  return {
    galaxy_count: view.getUint32(0, true),
    distance_min: view.getFloat32(4, true),
    distance_max: view.getFloat32(8, true),
    flags: view.getUint32(12, true),
  };
}

export function decodeGalaxyTile(buffer: ArrayBuffer, byteOffset = 0): DecodedGalaxyTile {
  const header = decodeGalaxyTileHeader(buffer, byteOffset);
  if (header.galaxy_count > GALAXY_TILE_MAX_RECORDS) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Galaxy tile claims ${header.galaxy_count} records; exceeds guard of ${GALAXY_TILE_MAX_RECORDS}`,
    );
  }

  const expectedBytes = GALAXY_TILE_HEADER_BYTES + header.galaxy_count * GALAXY_TILE_RECORD_BYTES;
  if (buffer.byteLength - byteOffset < expectedBytes) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Galaxy tile truncated: need ${expectedBytes} bytes, have ${buffer.byteLength - byteOffset}`,
    );
  }

  const recordBase = byteOffset + GALAXY_TILE_HEADER_BYTES;
  const view = new DataView(buffer, recordBase, header.galaxy_count * GALAXY_TILE_RECORD_BYTES);
  const records: GalaxyTileRecord[] = new Array(header.galaxy_count);

  for (let i = 0; i < header.galaxy_count; i++) {
    const o = i * GALAXY_TILE_RECORD_BYTES;
    records[i] = {
      ra: view.getFloat32(o + 0, true),
      dec: view.getFloat32(o + 4, true),
      redshift: view.getFloat32(o + 8, true),
      magnitude: readFloat16LE(view, o + 12),
      angular_size: readFloat16LE(view, o + 14),
      morphology_type: view.getUint8(o + 16),
      flags: view.getUint8(o + 17),
      metadata_index: view.getUint16(o + 18, true),
    };
  }

  return { header, records };
}
