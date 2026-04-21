import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { SurfaceFeatureRenderer } from '../SurfaceFeatureRenderer';

describe('SurfaceFeatureRenderer (T39 IAU nomenclature)', () => {
  it('builds groups for every body in the IAU catalog', () => {
    const r = new SurfaceFeatureRenderer();
    try {
      const handles = r.allHandles();
      expect(handles.length).toBeGreaterThanOrEqual(7); // Mercury/Venus/Moon/Mars/Io/Europa/Enceladus
      // Each handle has at least 1 feature.
      for (const h of handles) {
        expect(h.features.length).toBeGreaterThan(0);
      }
    } finally {
      r.dispose();
    }
  });

  it('hides feature groups by default (zoom-gated)', () => {
    const r = new SurfaceFeatureRenderer();
    try {
      for (const h of r.allHandles()) {
        expect(h.group.visible).toBe(false);
      }
    } finally {
      r.dispose();
    }
  });

  it('reveals features once camera is within visibility range', () => {
    const r = new SurfaceFeatureRenderer({ visibilityDistanceUnits: 5 });
    try {
      // Parent the Moon handle to a sentinel mesh so update() has a parent.
      const moon = r.getHandle(301);
      expect(moon).not.toBeNull();
      const parent = new THREE.Object3D();
      parent.position.set(0, 0, 0);
      parent.add(moon!.group);
      const scene = new THREE.Scene();
      scene.add(parent);
      scene.updateMatrixWorld(true);

      // Camera at distance 100 → hidden.
      r.update(new THREE.Vector3(100, 0, 0));
      expect(moon!.group.visible).toBe(false);

      // Camera at distance 2 → visible.
      r.update(new THREE.Vector3(2, 0, 0));
      expect(moon!.group.visible).toBe(true);
    } finally {
      r.dispose();
    }
  });

  it('getFeatureWorldPosition resolves a known landing site', () => {
    const r = new SurfaceFeatureRenderer();
    try {
      // Attach moon handle to a parent at origin so worldPos = local
      // (modulo the body radius scaling).
      const moon = r.getHandle(301);
      expect(moon).not.toBeNull();
      const parent = new THREE.Object3D();
      parent.add(moon!.group);
      parent.updateMatrixWorld(true);
      const pos = r.getFeatureWorldPosition(301, 'Apollo 11 Landing Site', 1);
      expect(pos).not.toBeNull();
      // Apollo 11 is on the Moon's near side (lat=0.67, lon=23.47), so the
      // resulting unit vector should have positive x (cos(lat)·cos(lon) > 0).
      expect(pos!.x).toBeGreaterThan(0);
    } finally {
      r.dispose();
    }
  });
});
