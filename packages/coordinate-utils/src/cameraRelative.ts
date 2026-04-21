/**
 * Camera-relative (floating-origin) transform.
 * Doc 23 §4.2 — storing positions in float64 and subtracting the camera
 * position keeps float32 GPU precision meaningful at galactic scales.
 */
import type { Vec3D } from './primitives.js';

/**
 * Compute `worldPos − cameraPos` in float64. Returned vector is suitable
 * for subsequent cast to float32 before GPU upload.
 */
export function toCameraRelative(worldPos: Vec3D, cameraPos: Vec3D): Vec3D {
  return {
    x: worldPos.x - cameraPos.x,
    y: worldPos.y - cameraPos.y,
    z: worldPos.z - cameraPos.z,
  };
}

/**
 * Cast a float64 vector to float32 precision (matching GPU single-precision
 * behaviour). Useful for unit tests asserting that a camera-relative
 * transform survives the round trip.
 */
export function toFloat32(v: Vec3D): Vec3D {
  return {
    x: Math.fround(v.x),
    y: Math.fround(v.y),
    z: Math.fround(v.z),
  };
}

/** One-shot: camera-relative + float32 in a single call. */
export function worldToGpu(worldPos: Vec3D, cameraPos: Vec3D): Vec3D {
  return toFloat32(toCameraRelative(worldPos, cameraPos));
}
