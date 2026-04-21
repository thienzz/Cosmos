import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { SMALL_BODY_SUBTYPES, SUBTYPE_COUNT } from '@/data/proceduralMinorBodies';

import { AsteroidFieldRenderer } from '../AsteroidFieldRenderer';

describe('AsteroidFieldRenderer (T39 + T44)', () => {
  it('mounts a Points mesh sized to the budget', () => {
    const r = new AsteroidFieldRenderer({
      kmToSceneScale: 12 / 149_597_870.7,
      budget: 5_000,
    });
    try {
      expect(r.particleCount).toBeGreaterThan(0);
      expect(r.particleCount).toBeLessThanOrEqual(5_000);
      expect(r.points).toBeInstanceOf(THREE.Points);
      const geom = r.points.geometry as THREE.BufferGeometry;
      expect(geom.getAttribute('a_orbitA_e_i')).toBeDefined();
      expect(geom.getAttribute('a_meanMotion')).toBeDefined();
      expect(geom.getAttribute('a_subtypeIndex')).toBeDefined();
    } finally {
      r.dispose();
    }
  });

  it('respects per-population budget split fractions', () => {
    const budget = 1000;
    const r = new AsteroidFieldRenderer({
      kmToSceneScale: 1e-7,
      budget,
      budgetSplit: { 'main-belt': 1.0, trojan: 0.0, kbo: 0.0, comet: 0.0 },
    });
    try {
      // With main-belt-only budget, every particle should be an asteroid
      // subtype (C/S/M/V or rubble/binary/contact-binary → indices 0..6).
      const subAttr = (r.points.geometry as THREE.BufferGeometry)
        .getAttribute('a_subtypeIndex') as THREE.BufferAttribute;
      let allAsteroid = true;
      for (let i = 0; i < subAttr.count; i++) {
        const idx = subAttr.getX(i);
        if (idx < 0 || idx > 6) { allAsteroid = false; break; }
      }
      expect(allAsteroid).toBe(true);
      expect(r.particleCount).toBe(budget);
    } finally {
      r.dispose();
    }
  });

  it('ships a 20-entry Doc 17 subtype palette (T44)', () => {
    const r = new AsteroidFieldRenderer({ kmToSceneScale: 1e-7, budget: 10 });
    try {
      const palette = r['material'].uniforms.u_palette.value as THREE.Color[];
      expect(palette).toHaveLength(SUBTYPE_COUNT);
      expect(SMALL_BODY_SUBTYPES).toHaveLength(20);
      for (const c of palette) expect(c).toBeInstanceOf(THREE.Color);
    } finally {
      r.dispose();
    }
  });

  it('exposes the Doc 17 subtype for a known main-belt id (T44)', () => {
    const r = new AsteroidFieldRenderer({ kmToSceneScale: 1e-7, budget: 500 });
    try {
      const sub = r.getSubtype(3_000_000);
      expect(sub).not.toBeNull();
      // Every procedural main-belt body is one of the asteroid subtypes.
      expect([
        'c-type', 's-type', 'm-type', 'v-type',
        'binary', 'rubble-pile', 'contact-binary',
      ]).toContain(sub);
    } finally {
      r.dispose();
    }
  });

  it('update() advances the time uniform without throwing', () => {
    const r = new AsteroidFieldRenderer({
      kmToSceneScale: 1e-7,
      budget: 100,
    });
    try {
      const initial = r['material'].uniforms.u_dtSecondsSinceEpoch.value as number;
      r.update(2_451_545.0 + 365);
      const after = r['material'].uniforms.u_dtSecondsSinceEpoch.value as number;
      expect(after).toBeGreaterThan(initial);
    } finally {
      r.dispose();
    }
  });

  it('computePosition returns a vector for a known main-belt id', () => {
    const r = new AsteroidFieldRenderer({
      kmToSceneScale: 1e-7,
      budget: 100,
    });
    try {
      const v = r.computePosition(3_000_000, 2_451_545.0);
      expect(v).not.toBeNull();
      expect(v!.length()).toBeGreaterThan(0);
    } finally {
      r.dispose();
    }
  });

  it('hasNaif covers the main-belt range and rejects unknown ids', () => {
    const r = new AsteroidFieldRenderer({
      kmToSceneScale: 1e-7,
      budget: 1000,
    });
    try {
      expect(r.hasNaif(3_000_000)).toBe(true);
      expect(r.hasNaif(1)).toBe(false); // Sun
      expect(r.hasNaif(399)).toBe(false); // Earth
    } finally {
      r.dispose();
    }
  });

  it('setVisible toggles the renderer group', () => {
    const r = new AsteroidFieldRenderer({
      kmToSceneScale: 1e-7,
      budget: 50,
    });
    try {
      r.setVisible(false);
      expect(r.group.visible).toBe(false);
      r.setVisible(true);
      expect(r.group.visible).toBe(true);
    } finally {
      r.dispose();
    }
  });

  describe('P3 — setDrawFraction (adaptive quality)', () => {
    it('clamps the draw-range count to fraction × particleCount', () => {
      const r = new AsteroidFieldRenderer({ kmToSceneScale: 1e-7, budget: 1000 });
      try {
        const total = r.particleCount;
        r.setDrawFraction(1.0);
        expect(r.getDrawCount()).toBe(total);
        r.setDrawFraction(0.5);
        expect(r.getDrawCount()).toBe(Math.floor(total * 0.5));
        r.setDrawFraction(0.25);
        expect(r.getDrawCount()).toBe(Math.floor(total * 0.25));
        r.setDrawFraction(0);
        expect(r.getDrawCount()).toBe(0);
      } finally {
        r.dispose();
      }
    });

    it('clamps out-of-range values to [0, 1]', () => {
      const r = new AsteroidFieldRenderer({ kmToSceneScale: 1e-7, budget: 500 });
      try {
        const total = r.particleCount;
        r.setDrawFraction(-1);
        expect(r.getDrawCount()).toBe(0);
        r.setDrawFraction(2);
        expect(r.getDrawCount()).toBe(total);
      } finally {
        r.dispose();
      }
    });

    it('is non-destructive — raising the fraction restores the full set', () => {
      const r = new AsteroidFieldRenderer({ kmToSceneScale: 1e-7, budget: 800 });
      try {
        const total = r.particleCount;
        r.setDrawFraction(0.1);
        r.setDrawFraction(0.5);
        r.setDrawFraction(1.0);
        expect(r.getDrawCount()).toBe(total);
      } finally {
        r.dispose();
      }
    });
  });
});
