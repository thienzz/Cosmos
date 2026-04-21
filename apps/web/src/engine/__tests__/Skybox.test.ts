import { CubeTexture } from 'three';
import { describe, expect, it } from 'vitest';

import {
  CUBE_FACE_NEGATIVE_X,
  CUBE_FACE_NEGATIVE_Y,
  CUBE_FACE_NEGATIVE_Z,
  CUBE_FACE_POSITIVE_X,
  CUBE_FACE_POSITIVE_Y,
  CUBE_FACE_POSITIVE_Z,
  createProceduralSkybox,
  projectDirectionToCubeFace,
} from '../Skybox';

describe('projectDirectionToCubeFace', () => {
  it('centres the six axis directions on their respective faces', () => {
    expect(projectDirectionToCubeFace({ x: 1, y: 0, z: 0 })).toEqual({
      face: CUBE_FACE_POSITIVE_X,
      u: 0.5,
      v: 0.5,
    });
    expect(projectDirectionToCubeFace({ x: -1, y: 0, z: 0 })).toEqual({
      face: CUBE_FACE_NEGATIVE_X,
      u: 0.5,
      v: 0.5,
    });
    expect(projectDirectionToCubeFace({ x: 0, y: 1, z: 0 })).toEqual({
      face: CUBE_FACE_POSITIVE_Y,
      u: 0.5,
      v: 0.5,
    });
    expect(projectDirectionToCubeFace({ x: 0, y: -1, z: 0 })).toEqual({
      face: CUBE_FACE_NEGATIVE_Y,
      u: 0.5,
      v: 0.5,
    });
    expect(projectDirectionToCubeFace({ x: 0, y: 0, z: 1 })).toEqual({
      face: CUBE_FACE_POSITIVE_Z,
      u: 0.5,
      v: 0.5,
    });
    expect(projectDirectionToCubeFace({ x: 0, y: 0, z: -1 })).toEqual({
      face: CUBE_FACE_NEGATIVE_Z,
      u: 0.5,
      v: 0.5,
    });
  });

  it('returns UVs inside [0, 1] for any unit direction', () => {
    for (let i = 0; i < 200; i++) {
      const phi = Math.random() * 2 * Math.PI;
      const cosTheta = Math.random() * 2 - 1;
      const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
      const dir = {
        x: sinTheta * Math.cos(phi),
        y: sinTheta * Math.sin(phi),
        z: cosTheta,
      };
      const { u, v } = projectDirectionToCubeFace(dir);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('drops each direction on exactly one face (dominant-axis)', () => {
    // 45° between +X and +Z — ax=az. Dominant-axis rule favours X first.
    const { face } = projectDirectionToCubeFace({
      x: Math.SQRT1_2,
      y: 0,
      z: Math.SQRT1_2,
    });
    expect(face).toBe(CUBE_FACE_POSITIVE_X);
  });

  it('keeps UVs continuous across an edge (no seam gap)', () => {
    // Direction straddling the +X / +Z boundary from the +X side.
    // For +X face, sc = -z so as z → +1, u → 0 (left edge of the face).
    const epsilon = 1e-4;
    const { face, u, v } = projectDirectionToCubeFace({
      x: Math.SQRT1_2 + epsilon,
      y: 0,
      z: Math.SQRT1_2,
    });
    expect(face).toBe(CUBE_FACE_POSITIVE_X);
    expect(u).toBeLessThan(0.01); // snug against the left edge of +X
    expect(v).toBeCloseTo(0.5, 2);

    // The *same* spatial edge viewed from +Z: sc = x, so as x → +1, u → 1
    // (right edge of +Z). A single scalar gap between the two UVs proves
    // the two faces share a continuous sky.
    const across = projectDirectionToCubeFace({
      x: Math.SQRT1_2,
      y: 0,
      z: Math.SQRT1_2 + epsilon,
    });
    expect(across.face).toBe(CUBE_FACE_POSITIVE_Z);
    expect(across.u).toBeGreaterThan(0.99);
    expect(across.v).toBeCloseTo(0.5, 2);
  });
});

describe('createProceduralSkybox', () => {
  it('returns a CubeTexture whose 6 faces are populated canvases', () => {
    const skybox = createProceduralSkybox({ faceSize: 64, starCount: 300, seed: 42 });
    expect(skybox).toBeInstanceOf(CubeTexture);
    const canvases = skybox?.image as HTMLCanvasElement[] | undefined;
    expect(canvases).toHaveLength(6);
    for (const canvas of canvases ?? []) {
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(canvas.width).toBe(64);
      expect(canvas.height).toBe(64);
    }
    skybox?.dispose();
  });

  it('produces deterministic output for a fixed seed', () => {
    const a = createProceduralSkybox({ faceSize: 32, starCount: 150, seed: 7 });
    const b = createProceduralSkybox({ faceSize: 32, starCount: 150, seed: 7 });
    const canvasA = (a?.image as HTMLCanvasElement[])[0]!;
    const canvasB = (b?.image as HTMLCanvasElement[])[0]!;
    const imgA = canvasA.getContext('2d')!.getImageData(0, 0, 32, 32).data;
    const imgB = canvasB.getContext('2d')!.getImageData(0, 0, 32, 32).data;
    expect(imgA.length).toBe(imgB.length);
    for (let i = 0; i < imgA.length; i++) {
      expect(imgA[i]).toBe(imgB[i]);
    }
    a?.dispose();
    b?.dispose();
  });

  it('differs between seeds', () => {
    const a = createProceduralSkybox({ faceSize: 32, starCount: 150, seed: 1 });
    const b = createProceduralSkybox({ faceSize: 32, starCount: 150, seed: 2 });
    const imgA = ((a?.image as HTMLCanvasElement[])[0]!).getContext('2d')!.getImageData(0, 0, 32, 32).data;
    const imgB = ((b?.image as HTMLCanvasElement[])[0]!).getContext('2d')!.getImageData(0, 0, 32, 32).data;
    let diff = 0;
    for (let i = 0; i < imgA.length; i++) if (imgA[i] !== imgB[i]) diff++;
    expect(diff).toBeGreaterThan(0);
    a?.dispose();
    b?.dispose();
  });

  it('writes visible stars onto every face (no face is pure background)', () => {
    // With 3000 stars uniformly distributed, each face expects ≈ 500. 30 is a
    // conservative floor for the sparsest face.
    const skybox = createProceduralSkybox({ faceSize: 128, starCount: 3000, seed: 11 });
    const canvases = skybox?.image as HTMLCanvasElement[];
    for (let face = 0; face < 6; face++) {
      const data = canvases[face]!.getContext('2d')!.getImageData(0, 0, 128, 128).data;
      let litPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Background is #02030a — any pixel with luminance >20 is a star.
        const lum = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
        if (lum > 30) litPixels++;
      }
      expect(litPixels, `face ${face} star count`).toBeGreaterThan(30);
    }
    skybox?.dispose();
  });
});
