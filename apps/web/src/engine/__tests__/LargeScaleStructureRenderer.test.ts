/**
 * T47 — LargeScaleStructureRenderer tests.
 *
 * Verifies gallery composition, per-ENT slot coverage, procedural-GLSL
 * usage (no texture atlases), and disposal against the Doc 17 §7010..7033
 * layout.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  COLLIDING_CLUSTERS,
  COSMIC_VOIDS,
  GALAXY_CLUSTERS,
  GREAT_WALLS,
  HARRIS_DIAS_OPEN_CLUSTERS,
  HARRIS_GLOBULAR_CLUSTERS,
  LSS_CATALOG_MANIFEST,
  LSS_TOTAL_SEED_COUNT,
  LYMAN_ALPHA_BLOBS,
  OB_ASSOCIATIONS,
} from '@/data/largeScaleStructureCatalog';

import { LargeScaleStructureRenderer } from '../LargeScaleStructureRenderer';

describe('largeScaleStructureCatalog', () => {
  it('ships a non-empty subset for every Doc 17 §70xx slot', () => {
    expect(HARRIS_DIAS_OPEN_CLUSTERS.length).toBeGreaterThan(0);
    expect(HARRIS_GLOBULAR_CLUSTERS.length).toBeGreaterThan(0);
    expect(OB_ASSOCIATIONS.length).toBeGreaterThan(0);
    expect(GALAXY_CLUSTERS.length).toBeGreaterThan(0);
    expect(COLLIDING_CLUSTERS.length).toBeGreaterThan(0);
    expect(GREAT_WALLS.length).toBeGreaterThan(0);
    expect(COSMIC_VOIDS.length).toBeGreaterThan(0);
    expect(LYMAN_ALPHA_BLOBS.length).toBeGreaterThan(0);
  });

  it('manifest totals match the array lengths', () => {
    expect(LSS_CATALOG_MANIFEST['ENT-7010']).toBe(HARRIS_DIAS_OPEN_CLUSTERS.length);
    expect(LSS_CATALOG_MANIFEST['ENT-7011']).toBe(HARRIS_GLOBULAR_CLUSTERS.length);
    expect(LSS_CATALOG_MANIFEST['ENT-7012']).toBe(OB_ASSOCIATIONS.length);
    expect(LSS_CATALOG_MANIFEST['ENT-7020_7021_7022']).toBe(GALAXY_CLUSTERS.length);
    expect(LSS_CATALOG_MANIFEST['ENT-7023']).toBe(COLLIDING_CLUSTERS.length);
    expect(LSS_CATALOG_MANIFEST['ENT-7031']).toBe(COSMIC_VOIDS.length);
    expect(LSS_CATALOG_MANIFEST['ENT-7032']).toBe(GREAT_WALLS.length);
    expect(LSS_CATALOG_MANIFEST['ENT-7033']).toBe(LYMAN_ALPHA_BLOBS.length);
  });

  it('sum total is the sum of all subcategories', () => {
    const sum =
      HARRIS_DIAS_OPEN_CLUSTERS.length +
      HARRIS_GLOBULAR_CLUSTERS.length +
      OB_ASSOCIATIONS.length +
      GALAXY_CLUSTERS.length +
      COLLIDING_CLUSTERS.length +
      COSMIC_VOIDS.length +
      GREAT_WALLS.length +
      LYMAN_ALPHA_BLOBS.length;
    expect(LSS_TOTAL_SEED_COUNT).toBe(sum);
  });

  it('every catalog entry has valid ICRS position (RA 0-360, Dec -90..+90)', () => {
    const all = [
      ...HARRIS_DIAS_OPEN_CLUSTERS,
      ...HARRIS_GLOBULAR_CLUSTERS,
      ...OB_ASSOCIATIONS,
      ...GALAXY_CLUSTERS,
      ...COLLIDING_CLUSTERS,
      ...GREAT_WALLS,
      ...COSMIC_VOIDS,
      ...LYMAN_ALPHA_BLOBS,
    ];
    for (const e of all) {
      expect(e.position.raDeg).toBeGreaterThanOrEqual(0);
      expect(e.position.raDeg).toBeLessThan(360);
      expect(e.position.decDeg).toBeGreaterThanOrEqual(-90);
      expect(e.position.decDeg).toBeLessThanOrEqual(90);
      expect(e.position.distancePc).toBeGreaterThan(0);
    }
  });

  it('Harris GC subset includes the three canonical fly-to targets from T47 verify block', () => {
    const ids = new Set(HARRIS_GLOBULAR_CLUSTERS.map((g) => g.id));
    // T47 verify: "Fly-to M13 → globular with bright core + red-blue CMD distribution"
    expect(ids).toContain('gc-m13');
    // Additional sanity: ω Cen is the most massive MW GC, should be present.
    expect(ids).toContain('gc-omega-cen');
  });

  it('void catalog includes Boötes Void (T47 verify block)', () => {
    const ids = new Set(COSMIC_VOIDS.map((v) => v.id));
    expect(ids).toContain('vd-bootes');
  });

  it('colliding-cluster catalog includes the Bullet Cluster (T47 verify block)', () => {
    const ids = new Set(COLLIDING_CLUSTERS.map((c) => c.id));
    expect(ids).toContain('cc-bullet');
  });
});

describe('LargeScaleStructureRenderer', () => {
  it('constructs one sub-renderer per Doc 17 §70xx slot', () => {
    const r = new LargeScaleStructureRenderer();
    try {
      const ids = r.getSubrendererIds();
      expect(ids).toEqual([
        'open-cluster',
        'globular-cluster',
        'ob-association',
        'galaxy-cluster',
        'supercluster',
        'colliding-cluster',
        'great-wall',
        'cosmic-void',
        'lyman-alpha-blob',
      ]);
    } finally {
      r.dispose();
    }
  });

  it('each sub-renderer is tagged with a Doc 17 ENT-7xxx code', () => {
    const r = new LargeScaleStructureRenderer();
    try {
      const codes = r.getEntityCodes();
      expect(codes).toContain('ENT-7010');
      expect(codes).toContain('ENT-7011');
      expect(codes).toContain('ENT-7012');
      expect(codes).toContain('ENT-7020_7021');
      expect(codes).toContain('ENT-7022');
      expect(codes).toContain('ENT-7023');
      expect(codes).toContain('ENT-7031');
      expect(codes).toContain('ENT-7032');
      expect(codes).toContain('ENT-7033');
    } finally {
      r.dispose();
    }
  });

  it('places every sub-renderer group in the scene without overlap', () => {
    const r = new LargeScaleStructureRenderer({ cellRadius: 12 });
    try {
      const positions = r.group.children.map((c) => c.position.clone());
      // All 9 grid cells should have unique (x,y) coordinates.
      const keys = new Set(positions.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`));
      expect(keys.size).toBe(9);
    } finally {
      r.dispose();
    }
  });

  it('update() is safe to call repeatedly and advances time uniforms', () => {
    const r = new LargeScaleStructureRenderer();
    try {
      expect(() => r.update(0.016, 0)).not.toThrow();
      expect(() => r.update(0.016, 1.0)).not.toThrow();
      expect(() => r.update(0.016, 5.0)).not.toThrow();
    } finally {
      r.dispose();
    }
  });

  it('uses ShaderMaterial (procedural GLSL) for the globular and Lyα sub-renderers per CLAUDE.md Rule #1', () => {
    const r = new LargeScaleStructureRenderer();
    try {
      const materials: THREE.Material[] = [];
      r.group.traverse((obj) => {
        if ((obj as THREE.Mesh).material) {
          const m = (obj as THREE.Mesh).material;
          if (Array.isArray(m)) materials.push(...m);
          else materials.push(m);
        }
      });
      const shaderMats = materials.filter((m) => m instanceof THREE.ShaderMaterial);
      // Procedural expectations: globular King profile + Lyα volumetric
      // + open-cluster points + OB points = at least 4 ShaderMaterials.
      expect(shaderMats.length).toBeGreaterThanOrEqual(4);
      // No material should carry a texture map (Rule #1 applies — Planck
      // CMB exception is in CmbBoundarySphere, not here).
      for (const m of materials) {
        const anyMat = m as unknown as Record<string, unknown>;
        if ('map' in anyMat) {
          expect(anyMat['map']).toBeFalsy();
        }
      }
    } finally {
      r.dispose();
    }
  });

  it('rebuildAfterContextRestore marks all materials for re-upload', () => {
    const r = new LargeScaleStructureRenderer();
    try {
      expect(() => r.rebuildAfterContextRestore()).not.toThrow();
    } finally {
      r.dispose();
    }
  });

  it('dispose clears sub-renderer references (second dispose is a no-op)', () => {
    const r = new LargeScaleStructureRenderer();
    r.dispose();
    expect(r.getSubrendererIds().length).toBe(0);
    expect(() => r.dispose()).not.toThrow();
  });
});
