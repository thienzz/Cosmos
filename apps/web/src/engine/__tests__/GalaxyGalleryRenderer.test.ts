/**
 * GalaxyGalleryRenderer tests (T29).
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  GALAXY_SUBTYPES,
  GALAXY_SUBTYPE_KIND,
} from '@/utils/galaxyPalette';

import { GalaxyGalleryRenderer } from '../GalaxyGalleryRenderer';

describe('GalaxyGalleryRenderer', () => {
  it('mounts the base-kind galaxies in legacy order by default', () => {
    const gallery = new GalaxyGalleryRenderer();
    try {
      const lods = gallery.getLods();
      // GalaxyGalleryRenderer.ORDER pulls from GALAXY_KINDS.slice(0, 6) —
      // asserting against `.length` avoids drift when new kinds are added.
      expect(lods.length).toBe(GalaxyGalleryRenderer.ORDER.length);
      expect(lods.map((l) => l.kind)).toEqual([...GalaxyGalleryRenderer.ORDER]);
    } finally {
      gallery.dispose();
    }
  });

  it('centres the row on origin', () => {
    const gallery = new GalaxyGalleryRenderer({ size: 7, gap: 6 });
    try {
      const box = new THREE.Box3().setFromObject(gallery.group);
      const centre = box.getCenter(new THREE.Vector3());
      expect(centre.x).toBeCloseTo(0, 1);
    } finally {
      gallery.dispose();
    }
  });

  it('forwards stepsOverride into every material handle', () => {
    const gallery = new GalaxyGalleryRenderer({ stepsOverride: 32 });
    try {
      for (const lod of gallery.getLods()) {
        const defines = lod.materialHandle.material.defines as Record<string, string>;
        expect(defines.GALAXY_STEPS).toBe('32');
      }
    } finally {
      gallery.dispose();
    }
  });

  it('update() picks a tier per galaxy based on camera distance', () => {
    // Force tight LOD thresholds so the spread of galaxy positions doesn't
    // force different tiers for the "all volumetric" vs "all billboard"
    // sweeps. volumetricMax=150 comfortably contains every per-galaxy
    // distance at the close camera, pointMin=1000 pushes the far sweep
    // safely into billboard on all four.
    const gallery = new GalaxyGalleryRenderer({
      lodBreakpoints: { volumetricMax: 150, pointMin: 1000 },
    });
    try {
      // Close camera — all volumetric.
      gallery.update(0.016, 0, new THREE.Vector3(0, 0, -35));
      for (const tier of gallery.getCurrentTiers()) {
        expect(tier).toBe('volumetric');
      }
      // Pull the camera far away — all billboard or point.
      gallery.update(0.016, 0, new THREE.Vector3(0, 0, 500));
      for (const tier of gallery.getCurrentTiers()) {
        expect(tier).not.toBe('volumetric');
      }
    } finally {
      gallery.dispose();
    }
  });

  it('dispose() clears the body list', () => {
    const gallery = new GalaxyGalleryRenderer();
    gallery.dispose();
    expect(gallery.getLods().length).toBe(0);
  });

  // ---------------------------------------------------------------------
  // T46 — 19-subtype grid layout.
  // ---------------------------------------------------------------------

  it('mounts all 19 Doc 17 subtypes when passed GALAXY_SUBTYPES', () => {
    const gallery = new GalaxyGalleryRenderer({
      subtypes: GALAXY_SUBTYPES,
      size: 4,
      gap: 2,
    });
    try {
      expect(gallery.getLods().length).toBe(19);
      expect(gallery.getSubtypeIds()).toEqual([...GALAXY_SUBTYPES]);
      // Every rendered body uses the family shader mapped by GALAXY_SUBTYPE_KIND.
      const lods = gallery.getLods();
      for (let i = 0; i < lods.length; i++) {
        const sub = GALAXY_SUBTYPES[i]!;
        expect(lods[i]!.kind).toBe(GALAXY_SUBTYPE_KIND[sub]);
      }
    } finally {
      gallery.dispose();
    }
  });

  // ---------------------------------------------------------------------
  // P2C — catalog positioning mode
  // ---------------------------------------------------------------------

  it('catalog mode places Andromeda (M31) at 778 kpc × unitsPerPc', () => {
    // Feed a tiny 1-entry catalog so we can assert exact positioning.
    const gallery = new GalaxyGalleryRenderer({
      positionMode: 'catalog',
      catalog: [
        {
          id: 'm31',
          name: 'Andromeda',
          kind: 'spiral',
          ra_deg: 10.6847,
          dec_deg: 41.2688,
          distance_kpc: 778,
          magnitude: 3.44,
        },
      ],
      sceneScale: { unitsPerPc: 500 },
    });
    try {
      const lods = gallery.getLods();
      expect(lods.length).toBe(1);
      const pos = lods[0]!.group.position;
      const rUnits = Math.hypot(pos.x, pos.y, pos.z);
      // 778 kpc × 1000 pc/kpc × 500 units/pc = 389,000,000
      expect(rUnits).toBeCloseTo(778 * 1000 * 500, 0);
    } finally {
      gallery.dispose();
    }
  });

  it('catalog mode mounts every entry in the default GALAXY_CATALOG', () => {
    const gallery = new GalaxyGalleryRenderer({ positionMode: 'catalog' });
    try {
      const entries = gallery.getCatalogEntries();
      expect(entries.length).toBeGreaterThan(0);
      // At minimum the showcase catalog should include Andromeda.
      expect(entries.some((e) => e?.id === 'm31')).toBe(true);
    } finally {
      gallery.dispose();
    }
  });

  it('catalog mode skips entries with invalid distances', () => {
    const gallery = new GalaxyGalleryRenderer({
      positionMode: 'catalog',
      catalog: [
        { id: 'a', name: 'Valid', kind: 'spiral', ra_deg: 0, dec_deg: 0, distance_kpc: 100, magnitude: 9 },
        { id: 'b', name: 'Zero', kind: 'spiral', ra_deg: 0, dec_deg: 0, distance_kpc: 0, magnitude: 9 },
        { id: 'c', name: 'Neg', kind: 'spiral', ra_deg: 0, dec_deg: 0, distance_kpc: -10, magnitude: 9 },
      ],
    });
    try {
      const entries = gallery.getCatalogEntries();
      expect(entries.length).toBe(1);
      expect(entries[0]?.id).toBe('a');
    } finally {
      gallery.dispose();
    }
  });
});
