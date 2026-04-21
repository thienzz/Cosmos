import {
  encodeStarTile,
  packColorIndex,
  packMagnitude,
} from '@cosmos/tile-decoder';
import * as THREE from 'three';
import type { Points } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { StarTileRenderer } from '../StarTileRenderer';

function buildSampleTile(stars: Array<{ x: number; y: number; z: number; spec?: number; bv?: number; mag?: number; catalog?: number }>): ArrayBuffer {
  return encodeStarTile({
    tileId: 1,
    minDistance: 0,
    maxDistance: 100,
    stars: stars.map((s, i) => ({
      x: s.x,
      y: s.y,
      z: s.z,
      spectralType: s.spec ?? 4,
      colorIndex: packColorIndex(s.bv ?? 0.6),
      magnitude: packMagnitude(s.mag ?? 4),
      flags: 0,
      catalogIndex: s.catalog ?? i,
    })),
  });
}

describe('StarTileRenderer', () => {
  let renderer: StarTileRenderer;

  beforeEach(() => {
    renderer = new StarTileRenderer({ sceneUnitsPerPc: 100 });
  });
  afterEach(() => {
    renderer.dispose();
  });

  it('mounts decoded tiles as Points meshes under the group', () => {
    const buf = buildSampleTile([
      { x: 1, y: 2, z: 3 },
      { x: -1, y: -2, z: -3 },
    ]);
    const ok = renderer.addTile('stars/1/4/4/0', buf, { x: 0, y: 0, z: 0 });
    expect(ok).toBe(true);
    expect(renderer.getTileCount()).toBe(1);
    expect(renderer.getStarCount()).toBe(2);
    expect(renderer.group.children).toHaveLength(1);
    const mesh = renderer.group.children[0]!;
    expect(mesh.name).toBe('star-tile:stars/1/4/4/0');
  });

  it('applies the ICRS → scene axis permutation with sceneUnitsPerPc scale', () => {
    // Single star at pc (x=1, y=0, z=0). Centre (0,0,0) + scale 100 →
    // scene-space (100, 0, 0) after permutation (X,Y,Z → X, Z, −Y).
    const buf = buildSampleTile([{ x: 1, y: 0, z: 0 }]);
    renderer.addTile('stars/1/4/4/0', buf, { x: 0, y: 0, z: 0 });
    const geometry = (renderer.group.children[0] as Points).geometry;
    const pos = geometry.getAttribute('position');
    expect(pos.getX(0)).toBeCloseTo(100, 0);
    expect(pos.getY(0)).toBeCloseTo(0, 0);
    expect(pos.getZ(0)).toBeCloseTo(0, 0);

    renderer.removeTile('stars/1/4/4/0');

    // Single star at pc (x=0, y=1, z=0) → scene (0, 0, −100).
    const buf2 = buildSampleTile([{ x: 0, y: 1, z: 0 }]);
    renderer.addTile('stars/1/4/4/0', buf2, { x: 0, y: 0, z: 0 });
    const geom2 = (renderer.group.children[0] as Points).geometry;
    const pos2 = geom2.getAttribute('position');
    expect(pos2.getX(0)).toBeCloseTo(0, 0);
    expect(pos2.getY(0)).toBeCloseTo(0, 0);
    expect(pos2.getZ(0)).toBeCloseTo(-100, 0);

    renderer.removeTile('stars/1/4/4/0');

    // Single star at pc (x=0, y=0, z=1) → scene (0, 100, 0).
    const buf3 = buildSampleTile([{ x: 0, y: 0, z: 1 }]);
    renderer.addTile('stars/1/4/4/0', buf3, { x: 0, y: 0, z: 0 });
    const geom3 = (renderer.group.children[0] as Points).geometry;
    const pos3 = geom3.getAttribute('position');
    expect(pos3.getX(0)).toBeCloseTo(0, 0);
    expect(pos3.getY(0)).toBeCloseTo(100, 0);
    expect(pos3.getZ(0)).toBeCloseTo(0, 0);
  });

  it('offsets record positions by the tile centre', () => {
    // Record at relative (1, 0, 0); tile centred at pc (10, 0, 0). Expected
    // scene position: (10 + 1) × 100 = 1100 on X.
    const buf = buildSampleTile([{ x: 1, y: 0, z: 0 }]);
    renderer.addTile('stars/1/4/4/0', buf, { x: 10, y: 0, z: 0 });
    const geom = (renderer.group.children[0] as Points).geometry;
    const pos = geom.getAttribute('position');
    expect(pos.getX(0)).toBeCloseTo(1100, 0);
  });

  it('double-adding the same address is idempotent', () => {
    const buf = buildSampleTile([{ x: 0, y: 0, z: 0 }]);
    expect(renderer.addTile('a', buf, { x: 0, y: 0, z: 0 })).toBe(true);
    expect(renderer.addTile('a', buf, { x: 0, y: 0, z: 0 })).toBe(false);
    expect(renderer.getTileCount()).toBe(1);
  });

  it('removeTile drops the mesh and decrements the star count', () => {
    renderer.addTile('a', buildSampleTile([{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }]), { x: 0, y: 0, z: 0 });
    expect(renderer.getStarCount()).toBe(2);
    expect(renderer.removeTile('a')).toBe(true);
    expect(renderer.getTileCount()).toBe(0);
    expect(renderer.getStarCount()).toBe(0);
    expect(renderer.group.children).toHaveLength(0);
  });

  it('invalid buffers are rejected without crashing', () => {
    const notATile = new ArrayBuffer(4);
    const ok = renderer.addTile('a', notATile, { x: 0, y: 0, z: 0 });
    expect(ok).toBe(false);
    expect(renderer.getTileCount()).toBe(0);
  });

  it('rebuildAfterContextRestore re-mounts every tile', () => {
    renderer.addTile('a', buildSampleTile([{ x: 0, y: 0, z: 0 }]), { x: 0, y: 0, z: 0 });
    renderer.addTile('b', buildSampleTile([{ x: 1, y: 1, z: 1 }]), { x: 10, y: 0, z: 0 });
    expect(renderer.getTileCount()).toBe(2);
    renderer.rebuildAfterContextRestore();
    expect(renderer.getTileCount()).toBe(2);
    expect(renderer.getMountedAddresses().sort()).toEqual(['a', 'b']);
  });

  it('decodes unknown spectral code via BV fallback (no crash)', () => {
    const buf = buildSampleTile([{ x: 0, y: 0, z: 0, spec: 7, bv: 1.2 }]);
    const ok = renderer.addTile('a', buf, { x: 0, y: 0, z: 0 });
    expect(ok).toBe(true);
    const geom = (renderer.group.children[0] as Points).geometry;
    const col = geom.getAttribute('a_color');
    // Black-body path for BV≈1.2 sits warm — red channel strongly dominant.
    expect(col.getX(0)).toBeGreaterThan(col.getZ(0));
  });

  it('100K-star tile upload completes and all attributes populate', () => {
    const count = 100_000;
    const stars = Array.from({ length: count }, (_, i) => ({
      x: (i % 100) * 0.1,
      y: Math.floor(i / 100) % 100 * 0.1,
      z: 0,
      spec: i % 7,
    }));
    const buf = encodeStarTile({
      tileId: 1,
      minDistance: 0,
      maxDistance: 20,
      stars: stars.map((s, i) => ({
        x: s.x,
        y: s.y,
        z: s.z,
        spectralType: s.spec,
        colorIndex: packColorIndex(0.6),
        magnitude: packMagnitude(6),
        flags: 0,
        catalogIndex: i,
      })),
    });
    const ok = renderer.addTile('stars/1/4/4/0', buf, { x: 0, y: 0, z: 0 });
    expect(ok).toBe(true);
    expect(renderer.getStarCount()).toBe(count);
    const geom = (renderer.group.children[0] as Points).geometry;
    expect(geom.getAttribute('position').count).toBe(count);
    expect(geom.getAttribute('a_color').count).toBe(count);
    expect(geom.getAttribute('a_magnitude').count).toBe(count);
    expect(geom.getAttribute('a_twinklePhase').count).toBe(count);
  });

  // -------------------------------------------------------------------
  // P3 — frustum culling
  // -------------------------------------------------------------------

  it('applyFrustumCulling flips mesh.visible based on the frustum', () => {
    // Three tiles: one at camera, one in front (visible), one way behind.
    renderer.addTile('stars/near', buildSampleTile([{ x: 0, y: 0, z: 0 }]), { x: 0, y: 0, z: 0 });
    renderer.addTile('stars/front', buildSampleTile([{ x: 0, y: 0, z: 0 }]), { x: 0, y: 0, z: -0.5 });
    renderer.addTile('stars/behind', buildSampleTile([{ x: 0, y: 0, z: 0 }]), { x: 0, y: 0, z: 20 });

    // Camera at origin looking down -Z.
    const camera = new THREE.PerspectiveCamera(60, 1.6, 0.1, 1000);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
    camera.updateMatrixWorld(true);
    const frustum = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    );

    const result = renderer.applyFrustumCulling(frustum, 10); // 10-unit radius
    expect(result.visible + result.hidden).toBe(3);
    // The tile at z=20 (camera is at z=0 looking toward -z) is behind the
    // camera, so it must be hidden.
    const behind = renderer.group.children.find((c) => c.name === 'star-tile:stars/behind');
    expect(behind?.visible).toBe(false);
  });
});
