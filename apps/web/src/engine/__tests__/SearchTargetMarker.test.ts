import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { SearchTargetMarker } from '../SearchTargetMarker';

describe('SearchTargetMarker — fly-to destination visualization', () => {
  it('places its group at the requested scene position', () => {
    const target = new THREE.Vector3(1000, 2000, -500);
    const m = new SearchTargetMarker(target, { label: 'Andromeda' });
    try {
      expect(m.group.position.x).toBe(1000);
      expect(m.group.position.y).toBe(2000);
      expect(m.group.position.z).toBe(-500);
    } finally {
      m.dispose();
    }
  });

  it('mounts an orb mesh (label sprite is optional in test envs)', () => {
    const m = new SearchTargetMarker(new THREE.Vector3(), { label: 'Test' });
    try {
      const orb = m.group.children.find(
        (c) => c.name === 'SearchTargetMarker:orb',
      ) as THREE.Mesh | undefined;
      expect(orb).toBeDefined();
      expect(orb!.geometry).toBeInstanceOf(THREE.SphereGeometry);
      // Label sprite skipped under jsdom (no Canvas2D measureText); in a
      // real browser there's a SpriteObject as a child, but the test env
      // tolerates the null case gracefully.
    } finally {
      m.dispose();
    }
  });

  it('scales the orb with camera distance so it stays readable at any range', () => {
    const m = new SearchTargetMarker(new THREE.Vector3(50_000, 0, 0));
    try {
      const orb = m.group.children.find(
        (c) => c.name === 'SearchTargetMarker:orb',
      ) as THREE.Mesh;

      // Camera 1 u away → orb shrinks to the floor size (≈ radiusHint × 0.8).
      m.update(0.016, new THREE.Vector3(49_999, 0, 0));
      const near = orb.scale.x;
      expect(near).toBeGreaterThan(0);
      expect(near).toBeLessThan(5);

      // Camera 20 000 u away → orb grows to ~1.2 % of distance.
      m.update(0.016, new THREE.Vector3(30_000, 0, 0));
      const far = orb.scale.x;
      expect(far).toBeGreaterThan(near);
      expect(far).toBeCloseTo(20_000 * 0.012, -1);
    } finally {
      m.dispose();
    }
  });

  it('advances its time uniform every update (drives the pulse animation)', () => {
    const m = new SearchTargetMarker(new THREE.Vector3());
    try {
      const orb = m.group.children.find(
        (c) => c.name === 'SearchTargetMarker:orb',
      ) as THREE.Mesh;
      const mat = orb.material as THREE.ShaderMaterial;
      const t0 = mat.uniforms.u_time.value;
      m.update(0.5, new THREE.Vector3(0, 0, 10));
      expect(mat.uniforms.u_time.value).toBeCloseTo(t0 + 0.5, 4);
      m.update(0.25, new THREE.Vector3(0, 0, 10));
      expect(mat.uniforms.u_time.value).toBeCloseTo(t0 + 0.75, 4);
    } finally {
      m.dispose();
    }
  });

  it('dispose() releases GPU resources without throwing', () => {
    const m = new SearchTargetMarker(new THREE.Vector3(), { label: 'X' });
    expect(() => m.dispose()).not.toThrow();
  });
});
