/**
 * NebulaGalleryRenderer tests (T27 + T45).
 *
 * Asserts that the gallery builds all declared slots in the expected order,
 * lays them out along +X with the expected spacing, and that `update()`
 * feeds each material's `u_cameraLocal` from the per-mesh worldToLocal
 * inversion. Also checks dispose tears down the GPU resources.
 *
 * The default mode is 'subtypes' (T45 — 14 slots per Doc 17 §5010..5080);
 * the legacy 5-family layout is still available via `mode: 'families'`.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { NEBULA_KINDS, NEBULA_SUBTYPES } from '@/utils/nebulaPalette';

import { NebulaGalleryRenderer } from '../NebulaGalleryRenderer';

describe('NebulaGalleryRenderer — subtypes mode (default, T45)', () => {
  it('builds 14 meshes in Doc 17 §5010..5080 order', () => {
    const gallery = new NebulaGalleryRenderer();
    try {
      const handles = gallery.getHandles();
      const subtypes = gallery.getSubtypes();
      expect(handles).toHaveLength(NEBULA_SUBTYPES.length);
      for (let i = 0; i < NEBULA_SUBTYPES.length; i++) {
        expect(subtypes[i]).toBe(NEBULA_SUBTYPES[i]);
      }
    } finally {
      gallery.dispose();
    }
  });

  it('each subtype resolves to a live shader family', () => {
    const gallery = new NebulaGalleryRenderer();
    try {
      const kinds = gallery.getHandles().map((h) => h.kind);
      // All 8 shader families must appear at least once across the 14
      // subtypes (reflection / wolfrayet / protoplanetary / superbubble
      // each have exactly one subtype, so absence would mean the mapping
      // is broken).
      for (const family of NEBULA_KINDS) {
        expect(kinds).toContain(family);
      }
    } finally {
      gallery.dispose();
    }
  });

  it('row is centred on origin along X (bounds centre ≈ 0)', () => {
    const gallery = new NebulaGalleryRenderer({ size: 6, gap: 3 });
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
    const gallery = new NebulaGalleryRenderer({ stepsOverride: 24 });
    try {
      for (const handle of gallery.getHandles()) {
        const defines = handle.material.defines as Record<string, string>;
        expect(defines.NEBULA_STEPS).toBe('24');
      }
    } finally {
      gallery.dispose();
    }
  });
});

describe('NebulaGalleryRenderer — families mode (legacy T27)', () => {
  it('builds 8 meshes in the declared family order', () => {
    const gallery = new NebulaGalleryRenderer({ mode: 'families' });
    try {
      const handles = gallery.getHandles();
      expect(handles).toHaveLength(NEBULA_KINDS.length);
      for (let i = 0; i < NEBULA_KINDS.length; i++) {
        expect(handles[i]!.kind).toBe(NEBULA_KINDS[i]);
      }
    } finally {
      gallery.dispose();
    }
  });

  it('update() writes u_cameraLocal per mesh using its own worldToLocal', () => {
    const gallery = new NebulaGalleryRenderer({ mode: 'families', size: 4, gap: 2 });
    try {
      const cameraWorld = new THREE.Vector3(0, 0, 50);
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

  it('dispose() clears the internal handle list and disposes each material', () => {
    const gallery = new NebulaGalleryRenderer({ mode: 'families' });
    const handles = [...gallery.getHandles()];
    expect(handles.length).toBe(NEBULA_KINDS.length);
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
    const gallery = new NebulaGalleryRenderer({ mode: 'families' });
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
});

describe('NebulaGalleryRenderer — catalog mode (P2C)', () => {
  it('places Orion Nebula (M42) at 412 pc × unitsPerPc', () => {
    const gallery = new NebulaGalleryRenderer({
      mode: 'catalog',
      catalog: [
        {
          id: 'm42',
          name: 'Orion Nebula',
          subtype: 'hii-giant',
          ra_deg: 83.8221,
          dec_deg: -5.3911,
          distance_pc: 412,
          diameter_pc: 7.3,
          magnitude: 4.0,
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
      expect(rUnits).toBeCloseTo(412 * 500, 0);
      expect(gallery.getCatalogEntries()[0]?.id).toBe('m42');
    } finally {
      gallery.dispose();
    }
  });

  it('catalog mode keeps group un-recentred (ICRS positions are truth)', () => {
    const gallery = new NebulaGalleryRenderer({ mode: 'catalog' });
    try {
      // Gallery group position is NOT translated — positions come from catalog.
      expect(gallery.group.position.x).toBe(0);
      expect(gallery.group.position.y).toBe(0);
      expect(gallery.group.position.z).toBe(0);
    } finally {
      gallery.dispose();
    }
  });
});
