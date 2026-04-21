/**
 * MoonGalleryRenderer tests (T43).
 *
 * Asserts the gallery builds one mesh per moon kind, lays them out on a
 * centred grid, and cycles update / dispose without leaking.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { ALL_MOON_KINDS } from '@/utils/moonPalette';

import { MoonGalleryRenderer } from '../MoonGalleryRenderer';

describe('MoonGalleryRenderer', () => {
  it('builds one mesh per MoonKind in declared order', () => {
    const gallery = new MoonGalleryRenderer();
    try {
      const meshes = gallery.getMeshes();
      expect(meshes).toHaveLength(ALL_MOON_KINDS.length);
      for (let i = 0; i < ALL_MOON_KINDS.length; i++) {
        expect(meshes[i]!.userData.moonKind).toBe(ALL_MOON_KINDS[i]);
      }
    } finally {
      gallery.dispose();
    }
  });

  it('centres the grid on origin (bounds centre ≈ 0)', () => {
    const gallery = new MoonGalleryRenderer({ equalRadius: 1.0, gridColumns: 4 });
    try {
      gallery.group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(gallery.group);
      const centre = bounds.getCenter(new THREE.Vector3());
      expect(Math.abs(centre.x)).toBeLessThan(1e-5);
      expect(Math.abs(centre.y)).toBeLessThan(1e-5);
    } finally {
      gallery.dispose();
    }
  });

  it('accepts a subset of kinds via `kinds`', () => {
    const gallery = new MoonGalleryRenderer({ kinds: ['io', 'europa', 'titan'] });
    try {
      const meshes = gallery.getMeshes();
      expect(meshes).toHaveLength(3);
      expect(meshes.map((m) => m.userData.moonKind)).toEqual(['io', 'europa', 'titan']);
    } finally {
      gallery.dispose();
    }
  });

  it('update() advances shader time without throwing', () => {
    const gallery = new MoonGalleryRenderer();
    try {
      expect(() => gallery.update(0.016, 1.0)).not.toThrow();
      // Mesh rotation should have advanced from zero.
      const mesh = gallery.getMeshes()[0]!;
      expect(mesh.rotation.y).toBeGreaterThan(0);
    } finally {
      gallery.dispose();
    }
  });

  it('rebuildAfterContextRestore increments material version', () => {
    const gallery = new MoonGalleryRenderer();
    try {
      // ShaderMaterial.needsUpdate is a write-only setter; read `version`
      // instead (assignment to needsUpdate bumps version under the hood).
      const before = gallery
        .getMeshes()
        .map((m) => (m.material as THREE.ShaderMaterial).version);
      gallery.rebuildAfterContextRestore();
      const after = gallery
        .getMeshes()
        .map((m) => (m.material as THREE.ShaderMaterial).version);
      for (let i = 0; i < before.length; i++) {
        expect(after[i]!).toBeGreaterThan(before[i]!);
      }
    } finally {
      gallery.dispose();
    }
  });
});
