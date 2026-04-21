import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { NAMED_COMETS } from '@/data/namedComets';

import { NamedCometRenderer } from '../NamedCometRenderer';

describe('NamedCometRenderer (T44)', () => {
  it('meshes every named comet as a 4-draw composite', () => {
    const r = new NamedCometRenderer({ kmToSceneScale: 12 / 149_597_870.7 });
    try {
      expect(r.renderedCometCount).toBe(NAMED_COMETS.length);
      expect(r.group.children).toHaveLength(NAMED_COMETS.length);
      // Each comet group holds nucleus + coma + dust-tail + ion-tail = 4 meshes.
      for (const g of r.group.children) {
        expect((g as THREE.Group).children.length).toBe(4);
      }
    } finally {
      r.dispose();
    }
  });

  it('resolves Halley by NAIF id (T44 verify checklist)', () => {
    const r = new NamedCometRenderer({ kmToSceneScale: 12 / 149_597_870.7 });
    try {
      expect(r.hasNaif(1_000_001)).toBe(true);   // Halley
      expect(r.hasNaif(1_000_006)).toBe(true);   // C/2022 E3 (ZTF)
      expect(r.hasNaif(999)).toBe(false);         // Pluto — not a named comet
      const pos = r.getBodyWorldPosition(1_000_001);
      expect(pos).not.toBeNull();
      expect(pos!.length()).toBeGreaterThan(0);
    } finally {
      r.dispose();
    }
  });

  it('points the tail anti-sunward for a post-perihelion comet', () => {
    const r = new NamedCometRenderer({
      kmToSceneScale: 12 / 149_597_870.7,
      initialJulianDate: 2_451_545.0 + 1_000,  // arbitrary non-perihelion date
    });
    try {
      // Halley group record — pull directly via the private array.
      const halley = (r as unknown as { comets: { body: { naifId: number };
        material: THREE.ShaderMaterial; group: THREE.Group }[] })
        .comets.find((c) => c.body.naifId === 1_000_001);
      expect(halley).toBeDefined();
      const sunDir = halley!.material.uniforms.u_sunDirection.value as THREE.Vector3;
      // u_sunDirection is nucleus → Sun. Magnitude must be unit, and it
      // should point *toward* the scene origin (the Sun sits at 0,0,0).
      expect(sunDir.length()).toBeGreaterThan(0.9);
      expect(sunDir.length()).toBeLessThan(1.1);
      const nucleus = halley!.group.position.clone();
      if (nucleus.length() > 1e-6) {
        // sunDir should align with (-nucleus) normalised.
        const expected = nucleus.clone().negate().normalize();
        expect(sunDir.dot(expected)).toBeGreaterThan(0.95);
      }
    } finally {
      r.dispose();
    }
  });

  it('adds a pickable mesh per named comet', () => {
    const r = new NamedCometRenderer({ kmToSceneScale: 12 / 149_597_870.7 });
    try {
      const meshes = r.getPickableMeshes();
      expect(meshes).toHaveLength(NAMED_COMETS.length);
      for (const m of meshes) {
        expect(m.userData.naifId).toBeGreaterThan(1_000_000);
        expect(m.userData.pickable).toBe(true);
      }
    } finally {
      r.dispose();
    }
  });
});
