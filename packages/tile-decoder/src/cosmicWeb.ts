/**
 * Cosmic web mesh binary decoder (Doc 11 §4.3, Doc 26 §7.3).
 *
 * Layout (little-endian):
 *   Header (20 B):
 *     u32 vertex_count | u32 index_count | f32 density_scale |
 *     u32 version | u16 flags | u16 padding
 *   Vertex (16 B): f32 x | f32 y | f32 z | f32 density
 *   Indices: u32[] if flags&0x01 else u16[] (3 per triangle)
 */

import {
  COSMIC_WEB_FLAG_U32_INDICES,
  COSMIC_WEB_HEADER_BYTES,
  type CosmicWebMeshHeader,
} from '@cosmos/shared-types';

import { TileDecodeError } from './starTile';

export interface DecodedCosmicWebMesh {
  header: CosmicWebMeshHeader;
  /** Packed xyz triples in Mpc — length = 3 · vertex_count. */
  positions: Float32Array;
  /** Normalised density per vertex — length = vertex_count. */
  densities: Float32Array;
  /** Triangle indices (uint16 or uint32 per header.flags). */
  indices: Uint16Array | Uint32Array;
}

const COSMIC_WEB_VERTEX_BYTES = 16;
const COSMIC_WEB_MAX_VERTICES = 50_000_000;
const COSMIC_WEB_MAX_INDICES = 150_000_000;

export function decodeCosmicWebHeader(
  buffer: ArrayBuffer,
  byteOffset = 0,
): CosmicWebMeshHeader {
  if (buffer.byteLength - byteOffset < COSMIC_WEB_HEADER_BYTES) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Cosmic-web buffer too small: ${buffer.byteLength - byteOffset} < ${COSMIC_WEB_HEADER_BYTES}`,
    );
  }
  const view = new DataView(buffer, byteOffset, COSMIC_WEB_HEADER_BYTES);
  return {
    vertex_count: view.getUint32(0, true),
    index_count: view.getUint32(4, true),
    density_scale: view.getFloat32(8, true),
    version: view.getUint32(12, true),
    flags: view.getUint16(16, true),
  };
}

export function decodeCosmicWebMesh(
  buffer: ArrayBuffer,
  byteOffset = 0,
): DecodedCosmicWebMesh {
  const header = decodeCosmicWebHeader(buffer, byteOffset);
  if (header.vertex_count > COSMIC_WEB_MAX_VERTICES) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Cosmic-web vertex_count ${header.vertex_count} exceeds guard ${COSMIC_WEB_MAX_VERTICES}`,
    );
  }
  if (header.index_count > COSMIC_WEB_MAX_INDICES || header.index_count % 3 !== 0) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Cosmic-web index_count ${header.index_count} invalid`,
    );
  }

  const uint32Indices = (header.flags & COSMIC_WEB_FLAG_U32_INDICES) !== 0;
  const vertexBytes = header.vertex_count * COSMIC_WEB_VERTEX_BYTES;
  const indexBytes = header.index_count * (uint32Indices ? 4 : 2);
  const expected = COSMIC_WEB_HEADER_BYTES + vertexBytes + indexBytes;
  if (buffer.byteLength - byteOffset < expected) {
    throw new TileDecodeError(
      'INVALID_TILE_FORMAT',
      `Cosmic-web truncated: need ${expected} bytes, have ${buffer.byteLength - byteOffset}`,
    );
  }

  // Vertex data
  const vertexBase = byteOffset + COSMIC_WEB_HEADER_BYTES;
  const vView = new DataView(buffer, vertexBase, vertexBytes);
  const positions = new Float32Array(header.vertex_count * 3);
  const densities = new Float32Array(header.vertex_count);
  for (let i = 0; i < header.vertex_count; i++) {
    const o = i * COSMIC_WEB_VERTEX_BYTES;
    positions[i * 3 + 0] = vView.getFloat32(o + 0, true);
    positions[i * 3 + 1] = vView.getFloat32(o + 4, true);
    positions[i * 3 + 2] = vView.getFloat32(o + 8, true);
    densities[i] = vView.getFloat32(o + 12, true);
  }

  // Index data — slice the underlying buffer. Little-endian only: TypedArray
  // views inherit host endianness which is LE on every deployment target
  // (x86, ARM64 w/ LE, WASM). For BE hosts (none in the wild) we'd need
  // a DataView loop here.
  const indexBase = vertexBase + vertexBytes;
  let indices: Uint16Array | Uint32Array;
  if (uint32Indices) {
    indices = new Uint32Array(buffer.slice(indexBase, indexBase + indexBytes));
  } else {
    indices = new Uint16Array(buffer.slice(indexBase, indexBase + indexBytes));
  }

  return { header, positions, densities, indices };
}
