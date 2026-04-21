import * as THREE from 'three';

import { mulberry32 } from '@/data/starSeed';

/**
 * Procedural deep-space skybox (CLAUDE.md Critical Rule #1 — cubemap is the
 * one sanctioned exception to procedural-only). Stars are sampled as unit
 * vectors on S² and rasterised onto exactly one of the six cube faces by
 * dominant-axis selection. Because each star lives on precisely one face at
 * its continuous UV, the resulting CubeTexture has no visible seams.
 *
 * Doc 18 §3.1 places the Skybox at the root of the scene graph; Three.js
 * renders `scene.background = cubeTexture` behind every other object and
 * samples it per-pixel based on the viewing direction.
 */

export type CubeFace = 0 | 1 | 2 | 3 | 4 | 5;

/** Three.js CubeTexture face order — matches WebGL GL_TEXTURE_CUBE_MAP_*. */
export const CUBE_FACE_POSITIVE_X = 0;
export const CUBE_FACE_NEGATIVE_X = 1;
export const CUBE_FACE_POSITIVE_Y = 2;
export const CUBE_FACE_NEGATIVE_Y = 3;
export const CUBE_FACE_POSITIVE_Z = 4;
export const CUBE_FACE_NEGATIVE_Z = 5;

/**
 * Canonical cubemap UV projection (matches WebGL / GLSL `textureCube`).
 *
 * Returns the face index plus the face-local UV in [0, 1]². A direction on
 * a cube edge resolves deterministically to the axis with largest absolute
 * component (ties broken by axis priority X > Y > Z); on the adjacent face
 * the star is simply omitted, which is the right behaviour for
 * seam-avoidance.
 */
export function projectDirectionToCubeFace(
  dir: { x: number; y: number; z: number },
): { face: CubeFace; u: number; v: number } {
  const ax = Math.abs(dir.x);
  const ay = Math.abs(dir.y);
  const az = Math.abs(dir.z);

  let face: CubeFace;
  let sc: number; // s-coordinate numerator
  let tc: number; // t-coordinate numerator
  let ma: number; // major axis magnitude (always positive)

  if (ax >= ay && ax >= az) {
    ma = ax;
    if (dir.x > 0) {
      face = CUBE_FACE_POSITIVE_X;
      sc = -dir.z;
      tc = -dir.y;
    } else {
      face = CUBE_FACE_NEGATIVE_X;
      sc = dir.z;
      tc = -dir.y;
    }
  } else if (ay >= az) {
    ma = ay;
    if (dir.y > 0) {
      face = CUBE_FACE_POSITIVE_Y;
      sc = dir.x;
      tc = dir.z;
    } else {
      face = CUBE_FACE_NEGATIVE_Y;
      sc = dir.x;
      tc = -dir.z;
    }
  } else {
    ma = az;
    if (dir.z > 0) {
      face = CUBE_FACE_POSITIVE_Z;
      sc = dir.x;
      tc = -dir.y;
    } else {
      face = CUBE_FACE_NEGATIVE_Z;
      sc = -dir.x;
      tc = -dir.y;
    }
  }

  const u = 0.5 * (sc / ma + 1);
  const v = 0.5 * (tc / ma + 1);
  return { face, u, v };
}

export interface SkyboxOptions {
  /** Pixel size of each face. Default 1024. */
  faceSize?: number;
  /** Total star count across all six faces. Default 3000. */
  starCount?: number;
  /** Deterministic seed. Default 9999. */
  seed?: number;
  /** Base colour of the sky; default is slightly-blue off-black. */
  backgroundColor?: string;
}

/**
 * Sample a uniform point on S² (Marsaglia method).
 * `random` should return uniform [0, 1) values.
 */
function sampleUniformDirection(random: () => number): { x: number; y: number; z: number } {
  const u = random() * 2 - 1;
  const theta = random() * 2 * Math.PI;
  const s = Math.sqrt(1 - u * u);
  return { x: s * Math.cos(theta), y: s * Math.sin(theta), z: u };
}

/**
 * Generate a 6-face procedural starfield cubemap. Each face is drawn to a
 * standalone canvas; Three.js uploads those canvases as the cube sides.
 *
 * Returns null when running outside a DOM context (e.g., Vitest SSR pass).
 * SceneManager callers handle the null case by falling back to a solid
 * colour background.
 */
export function createProceduralSkybox(options: SkyboxOptions = {}): THREE.CubeTexture | null {
  if (typeof document === 'undefined') return null;

  const faceSize = options.faceSize ?? 1024;
  const starCount = options.starCount ?? 3000;
  const seed = options.seed ?? 9999;
  const backgroundColor = options.backgroundColor ?? '#02030a';

  const random = mulberry32(seed);
  const faces: HTMLCanvasElement[] = [];
  const ctxs: CanvasRenderingContext2D[] = [];

  for (let i = 0; i < 6; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = faceSize;
    canvas.height = faceSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('[Skybox] failed to acquire 2D canvas context');
    }
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, faceSize, faceSize);
    faces.push(canvas);
    ctxs.push(ctx);
  }

  for (let i = 0; i < starCount; i++) {
    const dir = sampleUniformDirection(random);
    const { face, u, v } = projectDirectionToCubeFace(dir);
    const ctx = ctxs[face];
    if (!ctx) continue;

    // Biased toward faint — the background should suggest depth without
    // competing visually with the foreground star field (T08).
    const brightness = Math.pow(random(), 2.2);
    // Subtle colour temperature — keep most stars white, a few tinted.
    const temperatureBias = random();
    const tint =
      temperatureBias < 0.1
        ? { r: 0.8, g: 0.85, b: 1.0 } // cooler (blue) minority
        : temperatureBias > 0.9
          ? { r: 1.0, g: 0.85, b: 0.7 } // warmer (orange) minority
          : { r: 1.0, g: 1.0, b: 1.0 };
    const r = Math.min(255, Math.floor(brightness * 255 * tint.r));
    const g = Math.min(255, Math.floor(brightness * 255 * tint.g));
    const b = Math.min(255, Math.floor(brightness * 255 * tint.b));

    const x = u * (faceSize - 1);
    const y = v * (faceSize - 1);
    // 1-pixel dots for faint stars, 2x2 for the brightest handful —
    // keeps the sky "sparse" and avoids competing with the foreground field.
    const size = brightness > 0.85 ? 2 : 1;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
  }

  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.colorSpace = THREE.SRGBColorSpace;
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}
