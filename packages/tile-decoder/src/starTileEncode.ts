/**
 * Star tile binary encoder (Doc 11 §4.1).
 *
 * Companion to `starTile.ts`'s decoder. Used by:
 *   - the Node ETL seeder (`scripts/seed-star-tiles.mjs`) to write the
 *     fixtures that the Rust tile server serves;
 *   - unit tests that want an end-to-end encode→decode round-trip;
 *   - in-browser mock fetchers that synthesise tile bytes at runtime so a
 *     preview smoke can exercise the streaming pipeline without a live
 *     backend.
 *
 * Keep this module pure (no Node-only deps) so it compiles for browser +
 * Node + web-worker contexts identically.
 */

import {
  STAR_TILE_HEADER_BYTES,
  STAR_TILE_RECORD_BYTES,
} from '@cosmos/shared-types';

import { writeFloat16LE } from './float16Encode.js';

export interface StarTileEncodeInput {
  tileId: number;
  /** Min distance from Sun to any star in the tile (parsecs). */
  minDistance: number;
  /** Max distance from Sun to any star in the tile (parsecs). */
  maxDistance: number;
  /** Per-star records in the Doc 11 §4.1 packed form. */
  stars: readonly StarRecordInput[];
}

export interface StarRecordInput {
  /** parsecs, relative to tile centre (quantised to float16). */
  x: number;
  y: number;
  z: number;
  /** Pre-packed magnitude byte [0,255]. See {@link packMagnitude}. */
  magnitude: number;
  /** Pre-packed BP-RP byte [0,255]. See {@link packColorIndex}. */
  colorIndex: number;
  /** 0=O, 1=B, 2=A, 3=F, 4=G, 5=K, 6=M, 7=Unknown (Doc 11 §4.1). */
  spectralType: number;
  /** Bit 0: has_velocity, 1: has_temp, 2-7: reserved. */
  flags: number;
  /** u16 index into companion metadata JSON. */
  catalogIndex: number;
}

/**
 * Produce the Doc 11 §4.1 binary payload for a star tile. The returned
 * `ArrayBuffer` is exactly `16 + 16·star_count` bytes long.
 */
export function encodeStarTile(input: StarTileEncodeInput): ArrayBuffer {
  const count = input.stars.length;
  const total = STAR_TILE_HEADER_BYTES + count * STAR_TILE_RECORD_BYTES;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);

  // --- Header (16 B) ----------------------------------------------------
  view.setUint32(0, input.tileId >>> 0, true);
  view.setUint32(4, count >>> 0, true);
  view.setFloat32(8, input.minDistance, true);
  view.setFloat32(12, input.maxDistance, true);

  // --- Records (16 B each) ---------------------------------------------
  let off = STAR_TILE_HEADER_BYTES;
  for (const s of input.stars) {
    writeFloat16LE(view, off + 0, s.x);
    writeFloat16LE(view, off + 2, s.y);
    writeFloat16LE(view, off + 4, s.z);
    view.setUint8(off + 6, s.magnitude & 0xff);
    view.setUint8(off + 7, s.colorIndex & 0xff);
    view.setUint8(off + 8, s.spectralType & 0xff);
    view.setUint8(off + 9, s.flags & 0xff);
    view.setUint16(off + 10, s.catalogIndex & 0xffff, true);
    // Bytes 12..15 are padding per the spec — already zero-filled by
    // `new ArrayBuffer()`.
    off += STAR_TILE_RECORD_BYTES;
  }
  return buf;
}

/**
 * Pack a G-magnitude value into the Doc 11 §4.1 quantised byte.
 *
 * Range [-5, 21] → [0, 255] linearly. Values outside clamp. Inverse of
 * {@link unpackMagnitude}.
 */
export function packMagnitude(magnitude: number): number {
  if (!Number.isFinite(magnitude)) return 0;
  const clamped = Math.max(-5, Math.min(21, magnitude));
  return Math.round(((clamped + 5) / 26) * 255);
}

/**
 * Pack a BP-RP colour index into the Doc 11 §4.1 quantised byte.
 *
 * Range [-0.5, 3.5] → [0, 255] linearly. Inverse of {@link unpackColorIndex}.
 */
export function packColorIndex(bvIndex: number): number {
  if (!Number.isFinite(bvIndex)) return 0;
  const clamped = Math.max(-0.5, Math.min(3.5, bvIndex));
  return Math.round(((clamped + 0.5) / 4) * 255);
}
