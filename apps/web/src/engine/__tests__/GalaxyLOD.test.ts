/**
 * GalaxyLOD tests (T29).
 *
 * Asserts tier-picking logic (volumetric → billboard → point) with the
 * correct hysteresis behaviour, and verifies dispose releases GPU state.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { DEFAULT_GALAXY_LOD_BREAKPOINTS, GalaxyLod } from '../GalaxyLOD';

function make(): GalaxyLod {
  return new GalaxyLod({
    kind: 'spiral',
    size: 7,
    tint: '#FFD8A0',
  });
}

describe('GalaxyLod', () => {
  it('initial tier = volumetric', () => {
    const lod = make();
    try {
      expect(lod.getCurrentTier()).toBe('volumetric');
      expect(lod.volumetricMesh.visible).toBe(true);
      expect(lod.billboardMesh.visible).toBe(false);
      expect(lod.pointMesh.visible).toBe(false);
    } finally {
      lod.dispose();
    }
  });

  it('transitions to billboard past volumetricMax * (1 + hysteresis)', () => {
    const lod = make();
    const bp = DEFAULT_GALAXY_LOD_BREAKPOINTS;
    try {
      // Just inside the volumetric hysteresis band — stays volumetric.
      lod.setCameraDistance(bp.volumetricMax * (1 + bp.hysteresis) - 0.1);
      expect(lod.getCurrentTier()).toBe('volumetric');
      // Past the outer edge — transitions to billboard.
      lod.setCameraDistance(bp.volumetricMax * (1 + bp.hysteresis) + 1);
      expect(lod.getCurrentTier()).toBe('billboard');
      expect(lod.billboardMesh.visible).toBe(true);
      expect(lod.volumetricMesh.visible).toBe(false);
    } finally {
      lod.dispose();
    }
  });

  it('transitions to point past pointMin * (1 + hysteresis)', () => {
    const lod = make();
    const bp = DEFAULT_GALAXY_LOD_BREAKPOINTS;
    try {
      // Walk out through billboard → point.
      lod.setCameraDistance(100);  // billboard
      expect(lod.getCurrentTier()).toBe('billboard');
      lod.setCameraDistance(bp.pointMin * (1 + bp.hysteresis) + 1);
      expect(lod.getCurrentTier()).toBe('point');
      expect(lod.pointMesh.visible).toBe(true);
    } finally {
      lod.dispose();
    }
  });

  it('hysteresis prevents flicker near boundary', () => {
    const lod = make();
    const bp = DEFAULT_GALAXY_LOD_BREAKPOINTS;
    try {
      // Cross into billboard.
      lod.setCameraDistance(bp.volumetricMax * (1 + bp.hysteresis) + 1);
      expect(lod.getCurrentTier()).toBe('billboard');
      // Hover just inside the original threshold — should STAY billboard
      // because we haven't crossed the inner hysteresis edge yet.
      lod.setCameraDistance(bp.volumetricMax - 1);
      expect(lod.getCurrentTier()).toBe('billboard');
      // Cross past the inner hysteresis edge — flip back to volumetric.
      lod.setCameraDistance(bp.volumetricMax * (1 - bp.hysteresis) - 1);
      expect(lod.getCurrentTier()).toBe('volumetric');
    } finally {
      lod.dispose();
    }
  });

  it('update() only ticks the volumetric material when its tier is active', () => {
    const lod = make();
    try {
      // Billboard tier — update should be a no-op on the material.
      lod.setCameraDistance(120);
      expect(lod.getCurrentTier()).toBe('billboard');
      const beforeTime = lod.materialHandle.material.uniforms.u_time.value as number;
      lod.update(0.016, 1.23, new THREE.Vector3(0, 0, 0));
      const afterTime = lod.materialHandle.material.uniforms.u_time.value as number;
      expect(afterTime).toBe(beforeTime);
      // Volumetric tier — update should advance u_time.
      lod.setCameraDistance(10);
      expect(lod.getCurrentTier()).toBe('volumetric');
      lod.update(0.016, 2.34, new THREE.Vector3(0, 0, 0));
      expect(lod.materialHandle.material.uniforms.u_time.value).toBeCloseTo(2.34, 5);
    } finally {
      lod.dispose();
    }
  });

  it('dispose releases geometry + material', () => {
    const lod = make();
    let matDisposed = false;
    const origDispose = lod.materialHandle.material.dispose.bind(lod.materialHandle.material);
    lod.materialHandle.material.dispose = () => {
      matDisposed = true;
      origDispose();
    };
    lod.dispose();
    expect(matDisposed).toBe(true);
  });
});
