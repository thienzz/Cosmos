import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

import type { ApiEphemerisRange } from '@/api';
import { DWARF_PLANETS, MAJOR_MOONS, PLANETS } from '@/data/solarSystemCatalog';

import { EphemerisSampler } from '../EphemerisSampler';
import { SolarSystemRenderer } from '../SolarSystemRenderer';

describe('SolarSystemRenderer', () => {
  it('meshes Sun + 8 planets + all dwarf planets', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      expect(r.renderedMeshCount).toBe(
        1 /* sun */ + PLANETS.length + DWARF_PLANETS.length + MAJOR_MOONS.length,
      );
    } finally {
      r.dispose();
    }
  });

  it('renderable body count ≥ planets + dwarfs + moons + sun', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      expect(r.renderableBodyCount).toBeGreaterThanOrEqual(
        1 + PLANETS.length + DWARF_PLANETS.length + MAJOR_MOONS.length,
      );
    } finally {
      r.dispose();
    }
  });

  it('builds orbit path lines when showOrbits = true', () => {
    const r = new SolarSystemRenderer({ showOrbits: true });
    try {
      const lines = r.group.children.filter(
        (c): c is THREE.Line => c instanceof THREE.Line,
      );
      expect(lines.length).toBe(PLANETS.length + DWARF_PLANETS.length);
    } finally {
      r.dispose();
    }
  });

  it('does not build orbit path lines when showOrbits = false', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      const lines = r.group.children.filter(
        (c): c is THREE.Line => c instanceof THREE.Line,
      );
      expect(lines).toHaveLength(0);
    } finally {
      r.dispose();
    }
  });

  it('update() moves planets away from origin after advancing JD', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      // Find Earth's group.
      const earth = r.group.children.find(
        (c) => c.name === 'SolarSystem:Earth',
      ) as THREE.Group | undefined;
      expect(earth).toBeDefined();

      r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
      const p0 = earth!.position.clone();

      // Advance half an Earth year — position must change.
      r.update(0.016, 0.016, 2_451_545.0 + 182, new THREE.Vector3(1, 0, 0));
      const p1 = earth!.position.clone();
      expect(p0.distanceTo(p1)).toBeGreaterThan(1);
    } finally {
      r.dispose();
    }
  });

  it('setOrbitsVisible toggles all orbit lines', () => {
    const r = new SolarSystemRenderer({ showOrbits: true });
    try {
      r.setOrbitsVisible(false);
      const lines = r.group.children.filter(
        (c): c is THREE.Line => c instanceof THREE.Line,
      );
      expect(lines.every((l) => !l.visible)).toBe(true);
      r.setOrbitsVisible(true);
      expect(lines.every((l) => l.visible)).toBe(true);
    } finally {
      r.dispose();
    }
  });

  it('Saturn group contains a ring mesh', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      const saturnGroup = r.group.children.find(
        (c) => c.name === 'SolarSystem:Saturn',
      ) as THREE.Group | undefined;
      expect(saturnGroup).toBeDefined();
      const saturnMesh = saturnGroup!.children.find(
        (c) => c.name === 'SolarSystem:Saturn:mesh',
      ) as THREE.Mesh | undefined;
      expect(saturnMesh).toBeDefined();
      const ring = saturnMesh!.children.find(
        (c) => c.name === 'SolarSystem:Saturn:rings',
      );
      expect(ring).toBeDefined();
    } finally {
      r.dispose();
    }
  });

  it('Jupiter has 4 Galilean moons parented to its group', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      const jupiter = r.group.children.find(
        (c) => c.name === 'SolarSystem:Jupiter',
      ) as THREE.Group | undefined;
      const moonMeshes = jupiter!.children.filter((c) =>
        /SolarSystem:(Io|Europa|Ganymede|Callisto):mesh/.test(c.name),
      );
      expect(moonMeshes).toHaveLength(4);
    } finally {
      r.dispose();
    }
  });

  it('dispose() releases child meshes', () => {
    const r = new SolarSystemRenderer({ showOrbits: true });
    r.dispose();
    // After dispose the catalog getters still work but no internal meshes.
    expect(r.renderableBodyCount).toBeGreaterThan(0);
  });

  it('getBodyWorldPosition returns the mesh world position for a known NAIF id', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      // Advance to a non-J2000 epoch so Earth has a non-zero position.
      r.update(0.016, 0.016, 2_451_545.0 + 100, new THREE.Vector3(1, 0, 0));
      // Three.js world matrices are lazily recomputed; groups haven't been
      // added to a parent scene, so we force-update their world matrix tree.
      r.group.updateMatrixWorld(true);

      const earthGroup = r.group.children.find(
        (c) => c.name === 'SolarSystem:Earth',
      ) as THREE.Group | undefined;
      expect(earthGroup).toBeDefined();

      const earthMesh = earthGroup!.children.find(
        (c) => c.name === 'SolarSystem:Earth:mesh',
      ) as THREE.Mesh | undefined;
      expect(earthMesh).toBeDefined();

      const pos = r.getBodyWorldPosition(399);
      expect(pos).not.toBeNull();
      const expected = earthMesh!.getWorldPosition(new THREE.Vector3());
      expect(pos!.distanceTo(expected)).toBeLessThan(1e-6);
    } finally {
      r.dispose();
    }
  });

  it('getBodyWorldPosition returns null for unknown NAIF ids', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      expect(r.getBodyWorldPosition(9_999_999)).toBeNull();
    } finally {
      r.dispose();
    }
  });

  it('P2C — getBodyWorldPosition resolves unmeshed named minor moons via parent-centric Kepler', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      // Advance JD so Jupiter is off-origin.
      r.update(0.016, 0.016, 2_451_545.0 + 100, new THREE.Vector3(1, 0, 0));
      r.group.updateMatrixWorld(true);

      // Amalthea (NAIF 505) is a NAMED_MINOR_MOON of Jupiter — no mesh.
      const amalthea = r.getBodyWorldPosition(505);
      expect(amalthea).not.toBeNull();

      // It must lie close to Jupiter (parent), not at origin.
      const jupiter = r.getBodyWorldPosition(599)!;
      expect(amalthea!.distanceTo(jupiter)).toBeLessThan(jupiter.length());
      // And not at the Sun.
      expect(amalthea!.length()).toBeGreaterThan(0);
    } finally {
      r.dispose();
    }
  });

  // -----------------------------------------------------------------------
  // P2D — visual scale profile
  // -----------------------------------------------------------------------

  it("P2E — 'default' scale profile keeps Sun small and planets as dots", () => {
    const r = new SolarSystemRenderer({ showOrbits: false, scaleMode: 'default' });
    try {
      const sunR = (r.sun.mesh.geometry as THREE.SphereGeometry).parameters.radius;
      // Sun clamped to [0.9, 1.4] — doesn't fill the frame at the new
      // ~22 u initial camera.
      expect(sunR).toBeGreaterThanOrEqual(0.9);
      expect(sunR).toBeLessThanOrEqual(1.4);

      const earthGroup = r.group.children.find(
        (c) => c.name === 'SolarSystem:Earth',
      ) as THREE.Group;
      const earthMesh = earthGroup.children.find(
        (c) => c.name === 'SolarSystem:Earth:mesh',
      ) as THREE.Mesh;
      const earthR = (earthMesh.geometry as THREE.SphereGeometry).parameters.radius;
      // Floor 0.25 — rocky planets read as small dots; user zooms in for
      // surface detail rather than the god-view showing every planet.
      expect(earthR).toBeCloseTo(0.25, 2);

      // Sun vs Earth visual ratio bumped vs the pre-P2E compressed defaults
      // (was 3.48×); now closer to ~5×.
      expect(sunR / earthR).toBeGreaterThan(3.5);
    } finally {
      r.dispose();
    }
  });

  it("P2E — 'realistic' scale profile is currently aliased to default", () => {
    const rDef = new SolarSystemRenderer({ showOrbits: false, scaleMode: 'default' });
    const rReal = new SolarSystemRenderer({ showOrbits: false, scaleMode: 'realistic' });
    try {
      const sunDef = (rDef.sun.mesh.geometry as THREE.SphereGeometry).parameters.radius;
      const sunReal = (rReal.sun.mesh.geometry as THREE.SphereGeometry).parameters.radius;
      expect(sunDef).toBeCloseTo(sunReal, 4);
    } finally {
      rDef.dispose();
      rReal.dispose();
    }
  });

  it('P2C — getBodyWorldPosition resolves Dysnomia (Eris moon) via fallback scale', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      r.update(0.016, 0.016, 2_451_545.0 + 50, new THREE.Vector3(1, 0, 0));
      r.group.updateMatrixWorld(true);

      // Dysnomia (NAIF 120_002) orbits Eris, which has no meshed moons.
      const dysnomia = r.getBodyWorldPosition(120_002);
      expect(dysnomia).not.toBeNull();

      const eris = r.getBodyWorldPosition(136_199)!;
      // Dysnomia should be within a few parent-radii of Eris (the fallback
      // scale uses moonOrbitScale × visualRadius / a_km → moon lands near
      // the dwarf's mesh rather than drifting to the Sun).
      const sep = dysnomia!.distanceTo(eris);
      expect(sep).toBeGreaterThan(0);
      expect(sep).toBeLessThan(20); // well under the Eris–Sun distance
    } finally {
      r.dispose();
    }
  });

  it('getBodyWorldPosition writes to the supplied `out` vector and returns it', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      r.update(0.016, 0.016, 2_451_545.0 + 50, new THREE.Vector3(1, 0, 0));
      r.group.updateMatrixWorld(true);
      const out = new THREE.Vector3();
      const result = r.getBodyWorldPosition(199 /* Mercury */, out);
      expect(result).toBe(out);
      expect(out.lengthSq()).toBeGreaterThan(0);
    } finally {
      r.dispose();
    }
  });

  it('uses the live ephemeris sampler when it has data, else falls back to Kepler', async () => {
    // Fixed position at (5, 0, 0) AU so Earth lands at a known scene spot
    // regardless of JD. If the renderer falls back to Kepler this won't
    // line up with the expected scene x-coordinate.
    const stubRange: ApiEphemerisRange = {
      naif_id: 399,
      name: 'Earth',
      frame: 'ECLIPJ2000',
      observer: 10,
      start_jd: 2_451_545.0 - 10,
      end_jd: 2_451_545.0 + 10,
      step_days: 1,
      positions: Array.from({ length: 21 }, () => [5, 0, 0] as [number, number, number]),
      count: 21,
    };
    const sampler = new EphemerisSampler({
      fetcher: vi.fn().mockResolvedValue(stubRange),
      now: () => 0,
    });
    // Register only Earth — every other body should stay on Kepler.
    sampler.register({ naifId: 399 });

    const r = new SolarSystemRenderer({
      showOrbits: false,
      ephemerisSampler: sampler,
    });
    try {
      const earth = r.group.children.find(
        (c) => c.name === 'SolarSystem:Earth',
      ) as THREE.Group | undefined;
      expect(earth).toBeDefined();

      // First frame — sampler cache is cold, Kepler fallback runs. Earth
      // should be near (cos(0) · 1 AU, 0, 0) in ECLIPJ2000 = ~1 AU from origin.
      r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
      expect(r.getLastLiveHitCount()).toBe(0);
      const keplerDistance = earth!.position.length();
      expect(keplerDistance).toBeGreaterThan(0.5);

      // Let the fetch resolve and re-run the frame — now the sampler should
      // hit and Earth should snap to (5 AU, 0, 0) → scene x = 5 * orbitScale
      // = 60 (orbitScale default 12).
      await new Promise((r) => setTimeout(r, 0));
      expect(sampler.getCacheStatus(399)).toBe('ready');
      r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
      expect(r.getLastLiveHitCount()).toBe(1);
      expect(earth!.position.x).toBeCloseTo(60, 3);
      expect(earth!.position.y).toBeCloseTo(0, 3);
      expect(earth!.position.z).toBeCloseTo(0, 3);
    } finally {
      r.dispose();
      sampler.dispose();
    }
  });

  it('setEphemerisSampler(null) disables live sampling mid-flight', async () => {
    const stubRange: ApiEphemerisRange = {
      naif_id: 399,
      name: 'Earth',
      frame: 'ECLIPJ2000',
      observer: 10,
      start_jd: 2_451_545.0 - 10,
      end_jd: 2_451_545.0 + 10,
      step_days: 1,
      positions: Array.from({ length: 21 }, () => [5, 0, 0] as [number, number, number]),
      count: 21,
    };
    const sampler = new EphemerisSampler({
      fetcher: vi.fn().mockResolvedValue(stubRange),
      now: () => 0,
    });
    sampler.register({ naifId: 399 });
    const r = new SolarSystemRenderer({ showOrbits: false, ephemerisSampler: sampler });
    try {
      r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
      await new Promise((r) => setTimeout(r, 0));
      r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
      expect(r.getLastLiveHitCount()).toBeGreaterThan(0);

      r.setEphemerisSampler(null);
      r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
      expect(r.getLastLiveHitCount()).toBe(0);
    } finally {
      r.dispose();
      sampler.dispose();
    }
  });

  it('getHeliocentricBodyIds includes every planet and dwarf, excluding moons and sun', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      const ids = r.getHeliocentricBodyIds();
      expect(ids).toHaveLength(PLANETS.length + DWARF_PLANETS.length);
      expect(ids).not.toContain(10);
      // The Moon (301) is parent-equatorial in the catalog — must not leak in.
      expect(ids).not.toContain(301);
    } finally {
      r.dispose();
    }
  });

  it('getPickableMeshes returns every mesh tagged with a naifId', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      const pickables = r.getPickableMeshes();
      expect(pickables.length).toBe(
        1 + PLANETS.length + DWARF_PLANETS.length + MAJOR_MOONS.length,
      );
      // Every pickable carries userData.naifId.
      for (const mesh of pickables) {
        expect(typeof mesh.userData.naifId).toBe('number');
        expect(mesh.userData.pickable).toBe(true);
      }
      // Sun is in the list.
      expect(pickables.some((m) => m.userData.naifId === 10)).toBe(true);
      // Mercury is in the list.
      expect(pickables.some((m) => m.userData.naifId === 199)).toBe(true);
      // Luna is in the list.
      expect(pickables.some((m) => m.userData.naifId === 301)).toBe(true);
    } finally {
      r.dispose();
    }
  });

  // ---------------------------------------------------------------------
  // T39 — asteroid field + IAU surface features
  // ---------------------------------------------------------------------

  it('mountAsteroidField attaches a Points node to the solar group', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      const field = r.mountAsteroidField({ budget: 1000 });
      expect(field).toBe(r.getAsteroidField());
      expect(field.particleCount).toBeGreaterThan(0);
      // The field group is a child of the renderer's group.
      expect(r.group.children).toContain(field.group);
    } finally {
      r.dispose();
    }
  });

  it('mountAsteroidField is idempotent — second call replaces the prior field', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      const f1 = r.mountAsteroidField({ budget: 500 });
      const f2 = r.mountAsteroidField({ budget: 800 });
      expect(f1).not.toBe(f2);
      expect(r.getAsteroidField()).toBe(f2);
      expect(r.group.children).toContain(f2.group);
      expect(r.group.children).not.toContain(f1.group);
    } finally {
      r.dispose();
    }
  });

  it('getBodyWorldPosition resolves a procedural minor body via the field', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      r.mountAsteroidField({ budget: 200 });
      r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
      r.group.updateMatrixWorld(true);
      const pos = r.getBodyWorldPosition(3_000_000);
      expect(pos).not.toBeNull();
      // Should land somewhere in the main belt (~2-4 AU * orbitScale 12 = ~24-48 units).
      expect(pos!.length()).toBeGreaterThan(15);
      expect(pos!.length()).toBeLessThan(60);
    } finally {
      r.dispose();
    }
  });

  it('mountSurfaceFeatures parents a Nomenclature group to each planet mesh', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      const surface = r.mountSurfaceFeatures();
      expect(surface).toBe(r.getSurfaceFeatures());

      // Earth's mesh should now contain a Nomenclature group via Moon's parent
      // — actually, Moon (301) features attach to the Moon mesh (parent=Earth's group).
      // Mars (499) features attach to the Mars mesh.
      const marsRecord = r.group.children.find(
        (c) => c.name === 'SolarSystem:Mars',
      ) as THREE.Group | undefined;
      expect(marsRecord).toBeDefined();
      const marsMesh = marsRecord!.children.find(
        (c) => c.name === 'SolarSystem:Mars:mesh',
      ) as THREE.Mesh | undefined;
      expect(marsMesh).toBeDefined();
      const nomenclature = marsMesh!.children.find(
        (c) => c.name === 'Nomenclature:499',
      );
      expect(nomenclature).toBeDefined();
    } finally {
      r.dispose();
    }
  });

  it('dispose tears down the asteroid field + surface features', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    r.mountAsteroidField({ budget: 100 });
    r.mountSurfaceFeatures();
    r.dispose();
    expect(r.getAsteroidField()).toBeNull();
    expect(r.getSurfaceFeatures()).toBeNull();
  });

  it('getBodyWorldPosition resolves named asteroid (Bennu) via Kepler fallback', () => {
    const r = new SolarSystemRenderer({ showOrbits: false });
    try {
      r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
      r.group.updateMatrixWorld(true);
      const pos = r.getBodyWorldPosition(2_101_955); // Bennu
      expect(pos).not.toBeNull();
      // Bennu's a≈1.13 AU, so |scene pos| ≈ 1.13 * orbitScale (12) ≈ 14.
      expect(pos!.length()).toBeGreaterThan(8);
      expect(pos!.length()).toBeLessThan(20);
    } finally {
      r.dispose();
    }
  });

  describe('P4 — setMoonOrbitScale (mode-aware moon compression)', () => {
    it('defaults to the constructor option then reflects setMoonOrbitScale', () => {
      const r = new SolarSystemRenderer({ showOrbits: false, moonOrbitScale: 6 });
      try {
        expect(r.getMoonOrbitScale()).toBe(6);
        r.setMoonOrbitScale(60);
        expect(r.getMoonOrbitScale()).toBe(60);
        r.setMoonOrbitScale(12);
        expect(r.getMoonOrbitScale()).toBe(12);
      } finally {
        r.dispose();
      }
    });

    it('clamps to a positive number (0 or negatives collapse moons onto parent)', () => {
      const r = new SolarSystemRenderer({ showOrbits: false });
      try {
        r.setMoonOrbitScale(0);
        expect(r.getMoonOrbitScale()).toBeGreaterThan(0);
        r.setMoonOrbitScale(-5);
        expect(r.getMoonOrbitScale()).toBeGreaterThan(0);
      } finally {
        r.dispose();
      }
    });

    it('research-tier scale (60) pushes Luna ~10× further from Earth than education-tier (6)', () => {
      const r = new SolarSystemRenderer({ showOrbits: false, moonOrbitScale: 6 });
      try {
        r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
        r.group.updateMatrixWorld(true);
        const lunaEducation = r.getBodyWorldPosition(301);
        const earthEducation = r.getBodyWorldPosition(399);
        expect(lunaEducation).not.toBeNull();
        expect(earthEducation).not.toBeNull();
        const dEducation = lunaEducation!.distanceTo(earthEducation!);

        r.setMoonOrbitScale(60);
        r.update(0, 0, 2_451_545.0, new THREE.Vector3(1, 0, 0));
        r.group.updateMatrixWorld(true);
        const lunaResearch = r.getBodyWorldPosition(301);
        const earthResearch = r.getBodyWorldPosition(399);
        const dResearch = lunaResearch!.distanceTo(earthResearch!);

        expect(dResearch / dEducation).toBeGreaterThan(5);
      } finally {
        r.dispose();
      }
    });
  });

  // =====================================================================
  // Phase 3 / TS-PERF — adaptive asteroid-field density
  // =====================================================================
  describe('TS-PERF — adaptive asteroid density (Phase 3 regression)', () => {
    /** Build a renderer with a small asteroid budget and return the
     *  solar-system + its mounted asteroid field. Low budget keeps the
     *  test fast (default budget is 1.2 M particles). */
    function buildWithAsteroids(budget = 1000) {
      const r = new SolarSystemRenderer({ showOrbits: false });
      const field = r.mountAsteroidField({ budget });
      return { r, field };
    }

    it('100% at camera inside inner solar system (< 40 units)', () => {
      const { r, field } = buildWithAsteroids();
      try {
        const camera = new THREE.Vector3(20, 0, 0); // within Mercury's orbit.
        r.update(0.016, 0, 2_451_545.0, undefined, camera);
        const fraction = field.getDrawCount() / field.particleCount;
        expect(fraction).toBeCloseTo(1.0, 2);
      } finally {
        r.dispose();
      }
    });

    it('~65% at camera near Saturn (300 units)', () => {
      const { r, field } = buildWithAsteroids();
      try {
        const camera = new THREE.Vector3(300, 0, 0);
        r.update(0.016, 0, 2_451_545.0, undefined, camera);
        const fraction = field.getDrawCount() / field.particleCount;
        expect(fraction).toBeGreaterThan(0.55);
        expect(fraction).toBeLessThan(0.75);
      } finally {
        r.dispose();
      }
    });

    it('~25% at camera beyond Neptune (600 units)', () => {
      const { r, field } = buildWithAsteroids();
      try {
        const camera = new THREE.Vector3(600, 0, 0);
        r.update(0.016, 0, 2_451_545.0, undefined, camera);
        const fraction = field.getDrawCount() / field.particleCount;
        expect(fraction).toBeGreaterThan(0.2);
        expect(fraction).toBeLessThan(0.35);
      } finally {
        r.dispose();
      }
    });

    it('5% floor at camera > 2000 units (stellar regime)', () => {
      const { r, field } = buildWithAsteroids();
      try {
        const camera = new THREE.Vector3(5000, 0, 0);
        r.update(0.016, 0, 2_451_545.0, undefined, camera);
        const fraction = field.getDrawCount() / field.particleCount;
        expect(fraction).toBeLessThanOrEqual(0.05 + 0.01);
        expect(fraction).toBeGreaterThanOrEqual(0.04);
      } finally {
        r.dispose();
      }
    });

    it('fraction is monotonically non-increasing as camera moves out', () => {
      const { r, field } = buildWithAsteroids();
      try {
        const distances = [10, 50, 100, 200, 400, 800, 1500, 3000];
        const fractions: number[] = [];
        for (const d of distances) {
          r.update(0.016, 0, 2_451_545.0, undefined, new THREE.Vector3(d, 0, 0));
          fractions.push(field.getDrawCount() / field.particleCount);
        }
        for (let i = 1; i < fractions.length; i++) {
          // Allow ε for float rounding; main assertion is monotonic.
          expect(fractions[i]).toBeLessThanOrEqual(fractions[i - 1]! + 1e-6);
        }
      } finally {
        r.dispose();
      }
    });

    it('omitting cameraWorld leaves the draw count untouched', () => {
      const { r, field } = buildWithAsteroids();
      try {
        // First call with camera sets fraction to 0.05.
        r.update(0.016, 0, 2_451_545.0, undefined, new THREE.Vector3(5000, 0, 0));
        const reducedCount = field.getDrawCount();
        // Subsequent call without cameraWorld should keep the reduced count.
        r.update(0.016, 0, 2_451_545.0);
        expect(field.getDrawCount()).toBe(reducedCount);
      } finally {
        r.dispose();
      }
    });
  });
});
