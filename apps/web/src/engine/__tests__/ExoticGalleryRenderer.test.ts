/**
 * ExoticGalleryRenderer tests (T28 base + T48 extension).
 *
 * Mirrors NebulaGalleryRenderer.test — asserts the gallery builds every
 * declared exotic kind in order, centres on origin, propagates options,
 * and the update() / dispose() / rebuildAfterContextRestore hooks behave.
 *
 * T48.1 extends EXOTIC_KINDS from 3 to 16 (Doc 17 §ENT-8010..8025). The
 * test below reads the length from the canonical constant so it stays in
 * lockstep with the catalog.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { EXOTIC_KINDS } from '@/utils/exoticPalette';

import { ExoticGalleryRenderer } from '../ExoticGalleryRenderer';

describe('ExoticGalleryRenderer', () => {
  it('builds one mesh per EXOTIC_KINDS entry in declared order', () => {
    const gallery = new ExoticGalleryRenderer();
    try {
      const handles = gallery.getHandles();
      expect(handles).toHaveLength(EXOTIC_KINDS.length);
      // T48.1: canonical Doc 17 ENT-8010..8025 is 16 subtypes. The gallery
      // also carries the original T28 fixtures (blackhole, pulsar) which
      // own other ENT-IDs (ENT-1032, ENT-1031) — so the total list is
      // 18 = 16 catalog entries + 2 T28 compatibility fixtures.
      expect(EXOTIC_KINDS.length).toBe(18);
      for (let i = 0; i < EXOTIC_KINDS.length; i++) {
        expect(handles[i]!.kind).toBe(EXOTIC_KINDS[i]);
      }
    } finally {
      gallery.dispose();
    }
  });

  it('row is centred on origin along X (bounds centre ≈ 0)', () => {
    const gallery = new ExoticGalleryRenderer({ size: 6, gap: 4 });
    try {
      gallery.group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(gallery.group);
      const centre = bounds.getCenter(new THREE.Vector3());
      expect(Math.abs(centre.x)).toBeLessThan(1e-5);
    } finally {
      gallery.dispose();
    }
  });

  it('applies stepsOverride to every material', () => {
    const gallery = new ExoticGalleryRenderer({ stepsOverride: 24 });
    try {
      for (const handle of gallery.getHandles()) {
        const defines = handle.material.defines as Record<string, string>;
        expect(defines.EXOTIC_STEPS).toBe('24');
      }
    } finally {
      gallery.dispose();
    }
  });

  it('diskTilt option propagates to the black-hole material', () => {
    const gallery = new ExoticGalleryRenderer({ diskTilt: 1.0 });
    try {
      const bh = gallery.getHandles().find((h) => h.kind === 'blackhole');
      expect(bh).toBeDefined();
      expect(bh!.material.uniforms.u_diskTilt.value).toBe(1.0);
    } finally {
      gallery.dispose();
    }
  });

  it('pulseFrequency option propagates to the pulsar material', () => {
    const gallery = new ExoticGalleryRenderer({ pulseFrequency: 10 });
    try {
      const p = gallery.getHandles().find((h) => h.kind === 'pulsar');
      expect(p).toBeDefined();
      expect(p!.material.uniforms.u_pulseFrequency.value).toBe(10);
    } finally {
      gallery.dispose();
    }
  });

  it('flareIntensity option propagates to the magnetar material', () => {
    const gallery = new ExoticGalleryRenderer({ flareIntensity: 0.6 });
    try {
      const m = gallery.getHandles().find((h) => h.kind === 'magnetar');
      expect(m).toBeDefined();
      expect(m!.material.uniforms.u_flareIntensity.value).toBe(0.6);
    } finally {
      gallery.dispose();
    }
  });

  it('update() writes u_cameraLocal per mesh using its own worldToLocal', () => {
    const gallery = new ExoticGalleryRenderer({ size: 4, gap: 3 });
    try {
      const cameraWorld = new THREE.Vector3(0, 0, 40);
      gallery.update(0.016, 1.0, cameraWorld);

      const meshes = gallery.getMeshes();
      const handles = gallery.getHandles();
      expect(meshes).toHaveLength(handles.length);
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i]!;
        const handle = handles[i]!;
        const expected = cameraWorld.clone();
        mesh.worldToLocal(expected);
        const local = handle.material.uniforms.u_cameraLocal.value as THREE.Vector3;
        expect(local.x).toBeCloseTo(expected.x, 4);
        expect(local.y).toBeCloseTo(expected.y, 4);
        expect(local.z).toBeCloseTo(expected.z, 4);
      }
    } finally {
      gallery.dispose();
    }
  });

  it('update() advances u_time uniformly across all handles', () => {
    const gallery = new ExoticGalleryRenderer();
    try {
      gallery.update(0.016, 1.5, new THREE.Vector3(0, 0, 50));
      for (const h of gallery.getHandles()) {
        expect(h.material.uniforms.u_time.value).toBe(1.5);
      }
    } finally {
      gallery.dispose();
    }
  });

  it('dispose() clears the internal handle list and disposes each material', () => {
    const gallery = new ExoticGalleryRenderer();
    const handles = [...gallery.getHandles()];
    expect(handles.length).toBe(EXOTIC_KINDS.length);
    const disposed = handles.map(() => false);
    handles.forEach((h, i) => {
      const original = h.material.dispose.bind(h.material);
      h.material.dispose = () => {
        disposed[i] = true;
        original();
      };
    });
    gallery.dispose();
    for (const wasDisposed of disposed) {
      expect(wasDisposed).toBe(true);
    }
    expect(gallery.getHandles()).toHaveLength(0);
  });

  it('rebuildAfterContextRestore bumps every material version', () => {
    const gallery = new ExoticGalleryRenderer();
    try {
      const baseline = gallery.getHandles().map((h) => h.material.version);
      gallery.rebuildAfterContextRestore();
      const after = gallery.getHandles().map((h) => h.material.version);
      for (let i = 0; i < baseline.length; i++) {
        expect(after[i]).toBeGreaterThan(baseline[i]!);
      }
    } finally {
      gallery.dispose();
    }
  });

  // ---------------------------------------------------------------------
  // P2C — catalog positioning mode
  // ---------------------------------------------------------------------

  it('catalog mode places Sgr A* at 8.178 kpc × unitsPerPc', () => {
    const gallery = new ExoticGalleryRenderer({
      positionMode: 'catalog',
      catalog: [
        {
          id: 'sgr-a-star',
          name: 'Sagittarius A*',
          kind: 'blackhole',
          ra_deg: 266.4168,
          dec_deg: -29.0078,
          distance_pc: 8178,
        },
      ],
      sceneScale: { unitsPerPc: 500 },
      size: 4,
    });
    try {
      const meshes = gallery.getMeshes();
      expect(meshes.length).toBe(1);
      const pos = meshes[0]!.position;
      const rUnits = Math.hypot(pos.x, pos.y, pos.z);
      expect(rUnits).toBeCloseTo(8178 * 500, 0);
      expect(gallery.getCatalogEntries()[0]?.id).toBe('sgr-a-star');
    } finally {
      gallery.dispose();
    }
  });

  it('catalog mode places M87* far beyond Sgr A* (Mpc scale)', () => {
    const gallery = new ExoticGalleryRenderer({
      positionMode: 'catalog',
      catalog: [
        { id: 'sgr', name: 'Sgr A*', kind: 'blackhole', ra_deg: 266.4, dec_deg: -29, distance_pc: 8178 },
        { id: 'm87', name: 'M87*',  kind: 'blackhole', ra_deg: 187.7, dec_deg: 12.4, distance_pc: 16_800_000 },
      ],
      sceneScale: { unitsPerPc: 500 },
    });
    try {
      const meshes = gallery.getMeshes();
      const r0 = Math.hypot(meshes[0]!.position.x, meshes[0]!.position.y, meshes[0]!.position.z);
      const r1 = Math.hypot(meshes[1]!.position.x, meshes[1]!.position.y, meshes[1]!.position.z);
      // M87* (16.8 Mpc) should be ~2000× farther than Sgr A* (8.178 kpc).
      expect(r1 / r0).toBeCloseTo(16_800_000 / 8178, 0);
    } finally {
      gallery.dispose();
    }
  });
});
