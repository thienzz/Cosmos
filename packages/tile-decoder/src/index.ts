/**
 * Binary tile decoder — Doc 11 §4, Doc 26 §7.
 *
 * Provides pure functions that turn ArrayBuffers from the tile server into
 * either structured records (`decodeStarTile`) or typed arrays ready for
 * GPU upload (`decodeStarTileToBuffers`). No DOM, no Three.js — safe to
 * run inside a Web Worker.
 */

export { float16ToFloat32, readFloat16LE } from './float16';
export { float32ToFloat16, writeFloat16LE } from './float16Encode';
export {
  decodeStarTile,
  decodeStarTileHeader,
  decodeStarTileToBuffers,
  TileDecodeError,
  unpackColorIndex,
  unpackMagnitude,
  type DecodedStarTile,
  type StarTileBuffers,
} from './starTile';
export {
  encodeStarTile,
  packColorIndex,
  packMagnitude,
  type StarRecordInput,
  type StarTileEncodeInput,
} from './starTileEncode';
export {
  decodeGalaxyTile,
  decodeGalaxyTileHeader,
  type DecodedGalaxyTile,
} from './galaxyTile';
export {
  HEALPIX_MAX_NSIDE,
  HealpixError,
  healpixAng2PixNest,
  healpixGalaxyTileAddress,
  healpixNpix,
  healpixNsideToOrder,
  healpixParentNest,
} from './healpix';
export {
  decodeCosmicWebHeader,
  decodeCosmicWebMesh,
  type DecodedCosmicWebMesh,
} from './cosmicWeb';
export {
  cosmicWebTileUrl,
  galaxyTileUrl,
  ManifestParseError,
  parseTileManifest,
  starTileUrl,
  type TileManifestCosmicWebEntry,
  type TileManifestDocument,
  type TileManifestGalaxyEntry,
  type TileManifestStarEntry,
} from './manifest';
