/**
 * Double-precision 3D vector type + minimal arithmetic.
 * Uses plain JS `number` (IEEE-754 double) — no ArrayBuffer overhead for the
 * handful of vectors the coordinate pipeline touches per frame.
 */

import type { Vec3 } from '@cosmos/shared-types';

export type Vec3D = Vec3;

export const ZERO_VEC3: Vec3D = Object.freeze({ x: 0, y: 0, z: 0 });

export function vec3(x: number, y: number, z: number): Vec3D {
  return { x, y, z };
}

export function add(a: Vec3D, b: Vec3D): Vec3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vec3D, b: Vec3D): Vec3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(v: Vec3D, s: number): Vec3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function dot(a: Vec3D, b: Vec3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function length(v: Vec3D): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function normalize(v: Vec3D): Vec3D {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return scale(v, 1 / len);
}

/** Clamp a value to [−1, 1] — guards `asin`/`acos` against float drift. */
export function clampUnit(x: number): number {
  if (x > 1) return 1;
  if (x < -1) return -1;
  return x;
}

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

/** Wrap an angle (degrees) to `[0, 360)`. */
export function wrapDeg360(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

/** Wrap an angle (radians) to `(−π, π]`. */
export function wrapRadPi(rad: number): number {
  const m = ((rad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return m > Math.PI ? m - 2 * Math.PI : m;
}
