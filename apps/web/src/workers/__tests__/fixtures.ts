import { encodeStarTile, type StarRecordInput } from '@cosmos/tile-decoder';

export interface TestStar {
  x: number;
  y: number;
  z: number;
  magnitude: number; // packed byte 0..255
  color: number; // packed byte 0..255
  spectralType: number; // 0..7
}

/** Encode a Doc 11 §4.1 star tile from an easy-to-read list of test stars. */
export function buildStarTileBuffer(stars: readonly TestStar[]): ArrayBuffer {
  const distances = stars.map((s) => Math.hypot(s.x, s.y, s.z));
  const records: StarRecordInput[] = stars.map((s, i) => ({
    x: s.x,
    y: s.y,
    z: s.z,
    magnitude: s.magnitude,
    colorIndex: s.color,
    spectralType: s.spectralType,
    flags: 0,
    catalogIndex: i,
  }));
  return encodeStarTile({
    tileId: 0xdeadbeef,
    minDistance: Math.min(...distances, 0),
    maxDistance: Math.max(...distances, 0),
    stars: records,
  });
}
