import * as THREE from 'three';

import {
  MAJOR_MOONS,
  PLANETS,
  SUN,
  DWARF_PLANETS,
  bodyById,
  renderableBodies,
  type SolarSystemBody,
} from '@/data/solarSystemCatalog';
import {
  MOON_NAME_TO_KIND,
  type MoonKind,
} from '@/utils/moonPalette';
import {
  SATURN_RING_GEOMETRY,
  isGasGiant,
  isRockyPlanet,
  type PlanetKind,
} from '@/utils/planetPalette';

import { AsteroidFieldRenderer, type AsteroidFieldRendererOptions } from './AsteroidFieldRenderer';
import type { EphemerisSampler, Vec3Km } from './EphemerisSampler';
import { keplerPosition } from './keplerianOrbit';
import { createMoonMaterial, type MoonMaterialHandle } from './MoonMaterial';
import { NamedCometRenderer } from './NamedCometRenderer';
import {
  applyEntityToggles,
  MOON_KIND_TO_ENT_ID,
  PLANET_KIND_TO_ENT_ID,
} from './applyEntityToggles';
import { createPlanetMaterial, type PlanetMaterialHandle } from './PlanetMaterial';
import { createRingMaterial, type RingMaterialHandle } from './RingMaterial';
import type { GpuLifecycleHook } from './SceneManager';
import { createStarMaterial, type StarMaterialHandle } from './StarMaterialFamily';
import {
  SurfaceFeatureRenderer,
  type SurfaceFeatureRendererOptions,
} from './SurfaceFeatureRenderer';

/**
 * Full solar-system renderer — Doc 23 §8 + Doc 22 Rocky/Gas/Moons toggles.
 *
 * Meshes every renderable body in `solarSystemCatalog` (Sun + 8 planets + 5
 * dwarf planets + 21 major moons) and drives their positions every frame
 * from `keplerPosition()`. Moons are parented to their planet's `THREE.Group`
 * so the browser handles the Sun → planet → moon transforms natively.
 *
 * # Scale + display choices
 *
 * Doc 23 §3.3 mandates strict 1:1 km scale across the universe. That's
 * unusable for a first demo — Earth (6,371 km) next to a 1-AU orbit (150M
 * km) at the same scale is literally a pixel. T14 therefore renders in a
 * **display scale** where:
 *
 *   - `orbitScale` = scene units per AU, defaults to 12 so the Neptune
 *     orbit (~30 AU) fits inside a ±360-unit box the camera can reach
 *     without flipping to cosmic regime.
 *   - `bodySizeScale` inflates every body to ≥0.2 scene units so it's
 *     visible at Neptune-distance camera frames. The ratio between
 *     planets (Jupiter ≈ 11.2× Earth) is preserved for educational value.
 *   - `moonOrbitScale` inflates moon orbits *relative to the parent planet
 *     radius* — at true scale the Moon is 60 Earth radii away and
 *     invisible next to Earth. We use 6× the parent's visual radius as
 *     the "Luna-equivalent" distance; the full hierarchical-frame 1:1
 *     scale lives in T23.
 *
 * When `realScale: true` the renderer drops every scale fudge and uses
 * literal km units. Future tests (T23) will exercise this path.
 *
 * # Time coupling
 *
 * The TimeEngine-driven JD is passed in every frame by SceneManager. The
 * renderer does NOT own the clock — it's a pure function of (JD, scale
 * options).
 */

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * P2D — visual scale profile. Picks Sun + planet + dwarf + moon radius
 * floors so the camera frames solar-system content in a tradeoff between
 * visibility ('default') and realistic relative sizes ('realistic').
 */
export type SolarSystemScaleMode = 'default' | 'realistic';

export interface SolarSystemScaleProfile {
  /** Minimum Sun visual radius (scene u). */
  sunMin: number;
  /** Maximum Sun visual radius (scene u). */
  sunMax: number;
  /** Multiplier on (Sun radius_km × bodySizeScale) before clamping. */
  sunMultiplier: number;
  /** Visual floor for planets + dwarf planets. */
  planetFloor: number;
  /** Visual floor for moons / minor bodies. */
  moonFloor: number;
}

export const SOLAR_SYSTEM_SCALE_PROFILES: Record<SolarSystemScaleMode, SolarSystemScaleProfile> = {
  default: {
    // Sun ~1.2 u, rocky planets 0.25 u. Feels "you are IN the solar system"
    // at the tuned initial camera (~25 u out). Planets are dots you need to
    // zoom into; the Sun doesn't fill the frame. Gas giants scale naturally
    // (Jupiter's real radius × 0.00002 ≈ 1.4 u already clears the floor).
    sunMin: 0.9, sunMax: 1.4, sunMultiplier: 0.10,
    planetFloor: 0.25, moonFloor: 0.12,
  },
  realistic: {
    // Same as default — alias for now. Kept so callers that request
    // 'realistic' explicitly don't break; a future mode can shrink further.
    sunMin: 0.9, sunMax: 1.4, sunMultiplier: 0.10,
    planetFloor: 0.25, moonFloor: 0.12,
  },
};

export interface SolarSystemRendererOptions {
  /** Scene units per AU for planet orbits (default 12). */
  orbitScale?: number;
  /** Global multiplier on every body's physical radius (default 0.00002). */
  bodySizeScale?: number;
  /** P2D — visual scale profile (default 'default'). */
  scaleMode?: SolarSystemScaleMode;
  /** Moon orbit multiplier relative to parent visual radius (default 6). */
  moonOrbitScale?: number;
  /** Draw dashed orbital paths (default true). */
  showOrbits?: boolean;
  /** Path colour (default cyan phosphor). */
  orbitColor?: string;
  /** Keep the Sun's mesh fixed at origin even if the real Sun–SSB offset drifts. */
  fixSunAtOrigin?: boolean;
  /** Initial JD (default J2000). Reset each frame by SceneManager. */
  initialJulianDate?: number;
  /** 1:1 km mode (future T23 — not yet wired through the camera regime). */
  realScale?: boolean;
  /**
   * Optional T21 live-ephemeris sampler. When supplied, planet and dwarf
   * positions are read from the sampler (SPICE-backed via the HTTP
   * `/ephemeris/range` endpoint) and fall back silently to the local
   * Keplerian propagator whenever the sampler has no data for the current
   * JD — e.g. before the first fetch resolves, mid-network-failure, or
   * at playback speeds above the sampler's throttle.
   *
   * Moons are *not* routed through the sampler in T21 because the
   * catalog encodes their orbital elements in the parent-equatorial
   * frame while the API defaults to ecliptic J2000. The parent-equatorial
   * swap is scheduled alongside the per-moon shader work in T27.
   */
  ephemerisSampler?: EphemerisSampler | null;
}

// ---------------------------------------------------------------------------
// Handle types
// ---------------------------------------------------------------------------

interface PlanetRecord {
  body: SolarSystemBody;
  group: THREE.Group;                // holds mesh + moons so we can transform together
  mesh: THREE.Mesh;
  materialHandle: PlanetMaterialHandle;
  ringHandle: RingMaterialHandle | null;
  ringMesh: THREE.Mesh | null;
  moons: MoonRecord[];
  /** Visual radius in scene units — used for moon-orbit scaling. */
  visualRadius: number;
}

interface MoonRecord {
  body: SolarSystemBody;
  mesh: THREE.Mesh;
  /** T43 — per-moon shader handle. Null only for moons without catalog match. */
  materialHandle: MoonMaterialHandle | null;
  /** Plain material fallback for moons we haven't authored a shader for. */
  fallbackMaterial: THREE.MeshStandardMaterial | null;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

const AU_KM = 149_597_870.7;

export class SolarSystemRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;

  private readonly orbitScale: number;
  private readonly bodySizeScale: number;
  private readonly scaleProfile: SolarSystemScaleProfile;
  private moonOrbitScale: number;
  private readonly orbitColor: THREE.Color;
  private readonly showOrbits: boolean;
  private readonly fixSunAtOrigin: boolean;

  readonly sun: { body: SolarSystemBody; mesh: THREE.Mesh; materialHandle: StarMaterialHandle };
  private readonly planets: PlanetRecord[] = [];
  private readonly dwarfPlanets: PlanetRecord[] = [];
  private readonly orbitLines: THREE.Line[] = [];
  private readonly disposables: { dispose(): void }[] = [];

  private sunDirection = new THREE.Vector3(1, 0, 0);
  /** Scratch vector reused by per-frame update to avoid allocations. */
  private readonly sunOrigin = new THREE.Vector3(0, 0, 0);
  private jd = 2_451_545.0;
  private sampler: EphemerisSampler | null;
  /** Scratch vector re-used every frame to avoid per-body allocations. */
  private readonly scratchSample: Vec3Km = { x: 0, y: 0, z: 0 };
  /** P2 — per-frame scratch for the "body → Sun" vector (normalized). */
  private readonly scratchToSun = new THREE.Vector3();
  /** P2 — per-frame scratch for ring meshes' world-space position. */
  private readonly scratchRingWorld = new THREE.Vector3();
  /** P2 — per-frame scratch for moon Kepler positions (parent-centric km). */
  private readonly scratchMoonPos: Vec3Km = { x: 0, y: 0, z: 0 };
  /** P2 — per-frame scratch for the planet/dwarf Kepler fallback. */
  private readonly scratchPlanetPos: Vec3Km = { x: 0, y: 0, z: 0 };
  /** Per-frame counter of successful sampler hits — exposed for tests + telemetry. */
  private lastLiveHits = 0;
  /** T39 — instanced minor-body cloud, populated by `mountAsteroidField()`. */
  private asteroidField: AsteroidFieldRenderer | null = null;
  /** T39 — IAU planetary nomenclature renderer, populated by `mountSurfaceFeatures()`. */
  private surfaceFeatures: SurfaceFeatureRenderer | null = null;
  /** T44 — named-comet composite renderer (Halley, ZTF, Hale-Bopp, …). */
  private namedComets: NamedCometRenderer | null = null;

  constructor(options: SolarSystemRendererOptions = {}) {
    this.orbitScale = options.orbitScale ?? 12;
    this.bodySizeScale = options.bodySizeScale ?? 0.000_02;
    this.scaleProfile = SOLAR_SYSTEM_SCALE_PROFILES[options.scaleMode ?? 'default'];
    this.moonOrbitScale = options.moonOrbitScale ?? 6;
    this.showOrbits = options.showOrbits ?? true;
    this.orbitColor = new THREE.Color(options.orbitColor ?? '#3fe0ff');
    this.fixSunAtOrigin = options.fixSunAtOrigin ?? true;
    this.jd = options.initialJulianDate ?? 2_451_545.0;
    this.sampler = options.ephemerisSampler ?? null;

    this.group = new THREE.Group();
    this.group.name = 'SolarSystem';

    // Central light emitting from the Sun mesh so the gas/rocky shaders
    // have something to orient against even before the frame update fires.
    const sunLight = new THREE.PointLight(0xffe6b3, 2.0, 0, 0);
    sunLight.position.set(0, 0, 0);
    this.group.add(sunLight);

    this.sun = this.buildSun();
    for (const planet of PLANETS) {
      const record = this.buildPlanet(planet);
      this.planets.push(record);
      this.group.add(record.group);
    }
    for (const dwarf of DWARF_PLANETS) {
      const record = this.buildPlanet(dwarf);
      this.dwarfPlanets.push(record);
      this.group.add(record.group);
    }
    if (this.showOrbits) this.buildOrbitPaths();
    this.update(0, 0, this.jd, this.sunDirection);
  }

  // ------------------------------------------------------------------
  // Construction helpers
  // ------------------------------------------------------------------

  private buildSun(): { body: SolarSystemBody; mesh: THREE.Mesh; materialHandle: StarMaterialHandle } {
    // Real Sun at bodySizeScale 0.00002 = 13.9 units — bigger than Mercury's
    // whole orbit. Log-compress so it reads as "the star at the centre" but
    // stays visually inside Mercury's ellipse. 'realistic' mode widens the
    // clamp so the Sun reads dominant (~5 u) vs the gas giants (~1.4 u).
    const profile = this.scaleProfile;
    const radius = Math.max(
      profile.sunMin,
      Math.min(profile.sunMax, SUN.radius_km * this.bodySizeScale * profile.sunMultiplier),
    );
    const geometry = new THREE.SphereGeometry(radius, 96, 64);
    // T41 — G2V procedural surface (granulation + starspots + chromosphere +
    // corona rim) replaces the flat MeshBasicMaterial disc.
    const materialHandle = createStarMaterial('G', {
      sunDirection: this.sunDirection,
      quality: 'high',
    });
    const mesh = new THREE.Mesh(geometry, materialHandle.material);
    mesh.name = 'SolarSystem:sun';
    mesh.userData = { naifId: SUN.naifId, bodyKind: SUN.kind, pickable: true };
    if (this.fixSunAtOrigin) mesh.position.set(0, 0, 0);
    this.group.add(mesh);
    this.disposables.push({ dispose: () => { geometry.dispose(); materialHandle.dispose(); } });
    return { body: SUN, mesh, materialHandle };
  }

  private buildPlanet(body: SolarSystemBody): PlanetRecord {
    const group = new THREE.Group();
    group.name = `SolarSystem:${body.name}`;

    // Raw 0.00002 scale gives Jupiter ~1.4 units and Mercury ~0.05 — too
    // small to read at Neptune-distance frames. Floor driven by the active
    // scale profile: 'default' keeps rocky planets at 0.6 u, 'realistic'
    // drops them to 0.35 u so the Sun reads dominant.
    const profile = this.scaleProfile;
    const floor = body.kind === 'planet' || body.kind === 'dwarf_planet'
      ? profile.planetFloor
      : profile.moonFloor;
    const visualRadius = Math.max(floor, body.radius_km * this.bodySizeScale);
    const geometry = new THREE.SphereGeometry(visualRadius, 64, 48);
    geometry.rotateZ((body.obliquity_deg ?? 0) * (Math.PI / 180));

    let materialHandle: PlanetMaterialHandle;
    if (body.renderAs && (isRockyPlanet(body.renderAs) || isGasGiant(body.renderAs))) {
      materialHandle = createPlanetMaterial(body.renderAs as PlanetKind, {
        sunDirection: this.sunDirection,
      });
    } else {
      // Dwarf planets without a dedicated shader → mercury-like fallback.
      materialHandle = createPlanetMaterial('mercury', { sunDirection: this.sunDirection });
    }

    const mesh = new THREE.Mesh(geometry, materialHandle.material);
    mesh.name = `SolarSystem:${body.name}:mesh`;
    mesh.userData = { naifId: body.naifId, bodyKind: body.kind, pickable: true };
    group.add(mesh);

    // Saturn rings.
    let ringHandle: RingMaterialHandle | null = null;
    let ringMesh: THREE.Mesh | null = null;
    if (body.hasRings && body.renderAs === 'saturn') {
      const inner = SATURN_RING_GEOMETRY.innerC * visualRadius;
      const outer = SATURN_RING_GEOMETRY.outerA * visualRadius * 1.02;
      const ringGeo = new THREE.RingGeometry(inner, outer, 192, 1);
      ringHandle = createRingMaterial({
        planetPositionWorld: new THREE.Vector3(),
        planetRadiusWorld: visualRadius,
        sunDirection: this.sunDirection,
      });
      ringMesh = new THREE.Mesh(ringGeo, ringHandle.material);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.name = `SolarSystem:${body.name}:rings`;
      mesh.add(ringMesh);
      this.disposables.push({ dispose: () => { ringGeo.dispose(); ringHandle!.dispose(); } });
    }

    // Attach moons of this body.
    const moons: MoonRecord[] = [];
    for (const moon of MAJOR_MOONS.filter((m) => m.parentNaifId === body.naifId)) {
      moons.push(this.buildMoon(moon, visualRadius, group));
    }

    this.disposables.push({ dispose: () => { geometry.dispose(); materialHandle.dispose(); } });

    return {
      body,
      group,
      mesh,
      materialHandle,
      ringHandle,
      ringMesh,
      moons,
      visualRadius,
    };
  }

  private buildMoon(
    moon: SolarSystemBody,
    parentVisualRadius: number,
    parentGroup: THREE.Group,
  ): MoonRecord {
    // Moons are tiny in absolute terms but we want them readable; floor at
    // 10% of the parent's visual radius.
    const visualRadius = Math.max(
      parentVisualRadius * 0.08,
      moon.radius_km * this.bodySizeScale * 3,
    );
    const geometry = new THREE.SphereGeometry(visualRadius, 32, 24);

    // T43 — per-moon shader via the `MOON_NAME_TO_KIND` catalog map. Moons
    // not listed (irregular outer satellites) fall back to the generic
    // 'luna' rocky shader so they still read as cratered grey bodies
    // rather than featureless Mercury-like spheres.
    const moonKind: MoonKind = MOON_NAME_TO_KIND[moon.name] ?? 'luna';
    const materialHandle = createMoonMaterial(moonKind, {
      sunDirection: this.sunDirection,
      // Slightly brighter ambient so moons don't blend into shadow.
      ambientOverride: 0.12,
    });
    const mesh = new THREE.Mesh(geometry, materialHandle.material);
    mesh.name = `SolarSystem:${moon.name}:mesh`;
    mesh.userData = {
      naifId: moon.naifId,
      bodyKind: moon.kind,
      moonKind,
      pickable: true,
    };
    parentGroup.add(mesh);
    this.disposables.push({
      dispose: () => {
        geometry.dispose();
        materialHandle.dispose();
      },
    });
    return { body: moon, mesh, materialHandle, fallbackMaterial: null };
  }

  private buildOrbitPaths(): void {
    const segments = 256;
    for (const planet of this.planets) {
      this.orbitLines.push(this.buildOrbitLine(planet.body, segments, 1 / AU_KM * this.orbitScale));
    }
    for (const dwarf of this.dwarfPlanets) {
      this.orbitLines.push(this.buildOrbitLine(dwarf.body, segments, 1 / AU_KM * this.orbitScale));
    }
    for (const line of this.orbitLines) this.group.add(line);
  }

  private buildOrbitLine(body: SolarSystemBody, segments: number, kmToScene: number): THREE.Line {
    const el = body.orbit;
    const points: THREE.Vector3[] = [];
    for (let k = 0; k <= segments; k++) {
      const t = k / segments;
      // One full orbit sampled by sweeping true anomaly — use keplerPosition
      // by temporarily rewriting the mean anomaly. Avoid allocating a
      // full KeplerianElements struct for each sample.
      const fakeJd = 2_451_545.0 + t * el.periodDays;
      const p = keplerPosition(el, fakeJd);
      points.push(new THREE.Vector3(p.x * kmToScene, p.z * kmToScene, -p.y * kmToScene));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: this.orbitColor,
      transparent: true,
      opacity: 0.35,
    });
    this.disposables.push({ dispose: () => { geometry.dispose(); material.dispose(); } });
    const line = new THREE.Line(geometry, material);
    line.name = `SolarSystem:${body.name}:orbit`;
    return line;
  }

  // ------------------------------------------------------------------
  // Per-frame update
  // ------------------------------------------------------------------

  /**
   * Called by SceneManager every rAF tick. `jd` is the simulated Julian Date
   * from `TimeEngine`; `sunDirectionWorld` is the world-space direction from
   * each body to the Sun (used for shader lighting).
   */
  update(
    deltaSec: number,
    elapsedSec: number,
    jd: number,
    sunDirectionWorld?: THREE.Vector3,
    cameraWorld?: THREE.Vector3,
  ): void {
    this.jd = jd;
    if (sunDirectionWorld) this.sunDirection.copy(sunDirectionWorld);

    const kmToScene = (this.orbitScale / AU_KM);
    this.lastLiveHits = 0;

    // T41 — drive the Sun's G2V procedural surface (granulation advection,
    // starspot drift, corona rim). u_sunDir is meaningless for a self-
    // luminous star so we reuse the global sunDirection as a placeholder.
    this.sun.materialHandle.update(
      deltaSec,
      elapsedSec,
      this.sunDirection,
      this.sunOrigin,
      this.sun.mesh.matrixWorld,
    );
    // T52 — Sun is the G-Type (ENT-1007) spec from Doc 22. Route its toggles
    // into the star material so flipping "Granulation" etc. dims the Sun.
    applyEntityToggles(this.sun.materialHandle.material, 'ENT-1007');

    for (const record of [...this.planets, ...this.dwarfPlanets]) {
      // T21 — prefer the live SPICE sampler if it has data; otherwise fall
      // back to the local Keplerian propagator (T14). The sampler returns
      // `null` whenever its cache is empty, the JD is outside the fetched
      // window, or the user scrubbed faster than the refetch threshold.
      let pos: Vec3Km | null = null;
      if (this.sampler) {
        pos = this.sampler.sample(record.body.naifId, jd, this.scratchSample);
        if (pos) this.lastLiveHits++;
      }
      if (!pos) pos = keplerPosition(record.body.orbit, jd, this.scratchPlanetPos);
      const { x, y, z } = pos;
      // Scene uses Y-up; ICRS uses Z-up ecliptic. Map (X, Y, Z)_icrs →
      // (X, Z, −Y)_scene so the ecliptic plane is the scene's XZ plane.
      record.group.position.set(x * kmToScene, z * kmToScene, -y * kmToScene);

      // Sun direction for this body's shader = from body to Sun (origin).
      // Sun is fixed at origin → `toSun = −normalize(pos)`. Using scratch.
      const toSun = this.scratchToSun
        .copy(record.group.position)
        .negate()
        .normalize();
      record.materialHandle.update(deltaSec, elapsedSec, toSun);
      // T52 hot-path: copy Doc 22 toggle values for this body's ENT-ID into
      // any matching u_<name> uniform on the material (Doc 27 §6.4).
      // Toggles whose uniform isn't aliased to a real shader uniform are no-ops.
      // Dwarf planets share Mercury's shader (`renderAs: 'mercury'`) but have
      // their own Doc 22 spec — route by kind first, then fall back to
      // the planet-kind map for the eight classical planets.
      const entId =
        record.body.kind === 'dwarf_planet'
          ? (record.body.naifId === 2_000_001 ? 'ENT-4031' : 'ENT-4030')
          : PLANET_KIND_TO_ENT_ID[record.body.renderAs as PlanetKind];
      applyEntityToggles(record.materialHandle.material, entId);
      if (record.ringHandle) {
        const worldPos = record.mesh.getWorldPosition(this.scratchRingWorld);
        record.ringHandle.update(deltaSec, elapsedSec, worldPos, toSun);
        // T52 — rings inherit their parent planet's Doc 22 ENT-ID so toggles
        // on the host body also dim/tint the ring material (no rings-specific
        // Doc 22 spec exists yet).
        applyEntityToggles(record.ringHandle.material, entId);
      }

      // Moons — parent-centric Kepler, then inflate orbit so they're visible.
      // Scale each moon orbit such that the outermost body in this system
      // sits at `moonOrbitScale * visualRadius`. Preserves relative spacing.
      const maxA = record.moons.reduce((m, r) => Math.max(m, r.body.orbit.a_km), 0) || 1;
      const moonKmToScene = (this.moonOrbitScale * record.visualRadius) / maxA;
      for (const moon of record.moons) {
        const p = keplerPosition(moon.body.orbit, jd, this.scratchMoonPos);
        moon.mesh.position.set(
          p.x * moonKmToScene,
          p.z * moonKmToScene,
          -p.y * moonKmToScene,
        );
        moon.materialHandle?.update(deltaSec, elapsedSec, toSun);
        if (moon.materialHandle) {
          const moonKind = moon.mesh.userData.moonKind as MoonKind | undefined;
          applyEntityToggles(
            moon.materialHandle.material,
            moonKind ? MOON_KIND_TO_ENT_ID[moonKind] : undefined,
          );
        }
      }
    }

    // T39 — drive the GPU minor-body cloud off the same JD.
    if (this.asteroidField) {
      this.asteroidField.update(jd);
      // P3 — adaptive density: shrink the visible asteroid draw call as the
      // camera leaves the inner planets. At ~40 units (outer main belt +
      // Jupiter) every particle is still individually resolvable; at ~600
      // units (beyond Neptune) the cloud becomes a haze and 25 % of the
      // particles are enough to preserve the silhouette. Beyond 2000 units
      // the solar system is a point in the sky, so we drop to ~5 %.
      if (cameraWorld) {
        const camDist = cameraWorld.length();
        let fraction = 1;
        if (camDist > 40) {
          // Smooth ramp: 1 at 40 units, 0.25 at 600 units, 0.05 at 2000+.
          if (camDist < 600) {
            const t = (camDist - 40) / (600 - 40);
            fraction = 1 - 0.75 * t;
          } else if (camDist < 2000) {
            const t = (camDist - 600) / (2000 - 600);
            fraction = 0.25 - 0.2 * t;
          } else {
            fraction = 0.05;
          }
        }
        this.asteroidField.setDrawFraction(fraction);
      }
    }
    // T44 — drive the named-comet composite off the same JD.
    if (this.namedComets) {
      this.namedComets.update(jd);
    }
  }

  // ------------------------------------------------------------------
  // T39 — Procedural minor-body field
  // ------------------------------------------------------------------

  /**
   * Mount the procedural asteroid + Trojan + KBO + comet field. Doc 23 §8.7
   * describes "GPU instanced points sampling the MPC orbital element
   * distribution at each frame". The renderer is owned here so its
   * lifecycle (mount/dispose/context-loss) tracks the solar-system group.
   *
   * Idempotent: calling twice replaces the prior field. The same
   * `kmToScene` conversion the planet rendering uses must be passed in so
   * the cloud lines up with the planet orbits.
   */
  mountAsteroidField(options?: Omit<AsteroidFieldRendererOptions, 'kmToSceneScale' | 'initialJulianDate'>): AsteroidFieldRenderer {
    if (this.asteroidField) {
      this.unmountAsteroidField();
    }
    const kmToScene = this.orbitScale / AU_KM;
    this.asteroidField = new AsteroidFieldRenderer({
      ...options,
      kmToSceneScale: kmToScene,
      initialJulianDate: this.jd,
    });
    this.group.add(this.asteroidField.group);
    return this.asteroidField;
  }

  /** Tear down the asteroid field (no-op if never mounted). */
  unmountAsteroidField(): void {
    if (!this.asteroidField) return;
    this.group.remove(this.asteroidField.group);
    this.asteroidField.dispose();
    this.asteroidField = null;
  }

  /** Read-only handle to the mounted field, for tests + UI toggles. */
  getAsteroidField(): AsteroidFieldRenderer | null {
    return this.asteroidField;
  }

  // ------------------------------------------------------------------
  // T44 — Named-comet composite
  // ------------------------------------------------------------------

  /**
   * Mount the named-comet composite renderer (Halley, 2P/Encke, 67P,
   * Hale-Bopp, NEOWISE, C/2022 E3 ZTF, Borisov). Doc 17 §ENT-4020..4023
   * require a visible nucleus + coma + dust tail + ion tail per body.
   * Idempotent — calling twice replaces the prior renderer.
   */
  mountNamedComets(): NamedCometRenderer {
    if (this.namedComets) {
      this.unmountNamedComets();
    }
    const kmToScene = this.orbitScale / AU_KM;
    this.namedComets = new NamedCometRenderer({
      kmToSceneScale: kmToScene,
      initialJulianDate: this.jd,
    });
    this.group.add(this.namedComets.group);
    return this.namedComets;
  }

  unmountNamedComets(): void {
    if (!this.namedComets) return;
    this.group.remove(this.namedComets.group);
    this.namedComets.dispose();
    this.namedComets = null;
  }

  getNamedComets(): NamedCometRenderer | null {
    return this.namedComets;
  }

  /**
   * Mount the IAU surface-feature catalog (T39). Each parent body that has
   * features in the catalog gets a marker cloud parented to its mesh; per
   * the per-body radius the cloud scales with the body's visual radius so
   * markers sit just above the surface. Visibility is gated by zoom in
   * `update()` — feature groups stay hidden until the camera approaches.
   *
   * Returns the renderer handle so callers can drive zoom-gating with the
   * camera position they already track.
   */
  mountSurfaceFeatures(options?: SurfaceFeatureRendererOptions): SurfaceFeatureRenderer {
    if (this.surfaceFeatures) {
      this.unmountSurfaceFeatures();
    }
    this.surfaceFeatures = new SurfaceFeatureRenderer(options);
    for (const handle of this.surfaceFeatures.allHandles()) {
      // Find the planet/dwarf record + its mesh; attach the feature group
      // there and scale to that body's visual radius.
      const record = this.findRecordByNaif(handle.parentNaifId);
      if (!record) continue;
      handle.group.scale.setScalar(record.visualRadius);
      record.mesh.add(handle.group);
    }
    return this.surfaceFeatures;
  }

  /** Tear down surface-feature renderer. */
  unmountSurfaceFeatures(): void {
    if (!this.surfaceFeatures) return;
    for (const handle of this.surfaceFeatures.allHandles()) {
      handle.group.parent?.remove(handle.group);
    }
    this.surfaceFeatures.dispose();
    this.surfaceFeatures = null;
  }

  /** Mounted surface-feature renderer (or `null`). */
  getSurfaceFeatures(): SurfaceFeatureRenderer | null {
    return this.surfaceFeatures;
  }

  /** Internal — locate a planet/dwarf record by NAIF id. */
  private findRecordByNaif(naifId: number): PlanetRecord | null {
    for (const record of this.planets) {
      if (record.body.naifId === naifId) return record;
    }
    for (const record of this.dwarfPlanets) {
      if (record.body.naifId === naifId) return record;
    }
    return null;
  }

  /** Update orbit-line visibility at runtime (UI toggle). */
  setOrbitsVisible(visible: boolean): void {
    for (const line of this.orbitLines) line.visible = visible;
  }

  /**
   * T21 — swap the live-ephemeris sampler at runtime. Pass `null` to
   * disable live sampling and fall back to the Kepler propagator only.
   * Does not register bodies; the caller should `sampler.register(...)`
   * each planet/dwarf they want backed by SPICE.
   */
  setEphemerisSampler(sampler: EphemerisSampler | null): void {
    this.sampler = sampler;
  }

  /** NAIF ids of every heliocentric body the sampler should be primed for. */
  getHeliocentricBodyIds(): number[] {
    return [...this.planets, ...this.dwarfPlanets].map((r) => r.body.naifId);
  }

  /**
   * P4 — adjust the moon-orbit display multiplier at runtime. Lower values
   * compress moons closer to their parent for an educational overview;
   * higher values push toward the Doc 23 §3.3 true-scale (Moon sits 60
   * Earth-radii out from Earth). Applied on the next frame's `update()`
   * via the per-planet `moonKmToScene` re-derivation (no geometry rebuild).
   *
   * Mode wiring (SceneManager): education = 6 (default compressed),
   * research = 60 (true scale), exploration / observation = 6 (readable
   * default). Clamped to a positive number; `0` would flatten all moons
   * onto the parent.
   */
  setMoonOrbitScale(scale: number): void {
    this.moonOrbitScale = Math.max(0.01, scale);
  }

  /** Exposed for tests + UI telemetry. */
  getMoonOrbitScale(): number {
    return this.moonOrbitScale;
  }

  /** Frame hits from the last `update()` — telemetry / smoke-test probe. */
  getLastLiveHitCount(): number {
    return this.lastLiveHits;
  }

  rebuildAfterContextRestore(): void {
    for (const record of [...this.planets, ...this.dwarfPlanets]) {
      record.materialHandle.material.needsUpdate = true;
      for (const moon of record.moons) {
        moon.materialHandle?.material && (moon.materialHandle.material.needsUpdate = true);
      }
      record.ringHandle && (record.ringHandle.material.needsUpdate = true);
    }
    this.asteroidField?.rebuildAfterContextRestore();
    this.surfaceFeatures?.rebuildAfterContextRestore();
    this.namedComets?.rebuildAfterContextRestore();
  }

  dispose(): void {
    this.unmountSurfaceFeatures();
    this.unmountAsteroidField();
    this.unmountNamedComets();
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    this.planets.length = 0;
    this.dwarfPlanets.length = 0;
    this.orbitLines.length = 0;
  }

  // ------------------------------------------------------------------
  // Introspection for tests
  // ------------------------------------------------------------------

  get renderableBodyCount(): number {
    return renderableBodies().length;
  }

  /**
   * Flat list of every mesh tagged with `userData.pickable === true`. Feeds
   * the PickingController's raycaster — we skip orbit lines and helper
   * lights this way without walking the full scene graph.
   */
  getPickableMeshes(): THREE.Mesh[] {
    const out: THREE.Mesh[] = [this.sun.mesh];
    for (const record of [...this.planets, ...this.dwarfPlanets]) {
      out.push(record.mesh);
      for (const moon of record.moons) out.push(moon.mesh);
    }
    if (this.namedComets) {
      out.push(...this.namedComets.getPickableMeshes());
    }
    return out;
  }

  /**
   * World-space position of the body identified by NAIF id, or `null` if the
   * body isn't rendered in the current scene. Used by T20 tracking — called
   * every frame, so we walk the flat pickable list (≤35 meshes) rather than
   * hitting `THREE.Object3D.traverse`.
   *
   * Returns a fresh Vector3 unless `out` is supplied, in which case the
   * result is written into `out` and `out` is returned.
   */
  getBodyWorldPosition(naifId: number, out?: THREE.Vector3): THREE.Vector3 | null {
    const meshes = this.getPickableMeshes();
    for (const mesh of meshes) {
      if (mesh.userData.naifId === naifId) {
        const target = out ?? new THREE.Vector3();
        mesh.getWorldPosition(target);
        return target;
      }
    }
    // T44 — named comets are in `getPickableMeshes()` (above) so the
    // initial mesh walk already resolved them, but if the caller asked
    // before the first frame the userData.naifId may not be set yet.
    // Fall back to the renderer's world-position helper.
    if (this.namedComets && this.namedComets.hasNaif(naifId)) {
      const pos = this.namedComets.getBodyWorldPosition(naifId, out);
      if (pos) return pos;
    }
    // T39 — procedural minor bodies don't have meshes; compute their
    // current scene position from the GPU-side propagator's CPU mirror.
    if (this.asteroidField && this.asteroidField.hasNaif(naifId)) {
      const kmToScene = this.orbitScale / AU_KM;
      const local = this.asteroidField.computePosition(naifId, this.jd, kmToScene);
      if (!local) return null;
      const target = out ?? new THREE.Vector3();
      target.copy(local);
      // The asteroid-field group is a child of `this.group` — apply the
      // group's world transform so callers can use the result against
      // any camera.
      this.asteroidField.group.localToWorld(target);
      return target;
    }
    // T39 — catalog-enumerated heliocentric bodies that don't have meshes
    // (named asteroids: Bennu, Eros, Itokawa, Apophis, Psyche, …) still
    // need fly-to. Fall through to a per-body Keplerian compute so the
    // engine bridge can resolve them.
    const catalogBody = bodyById(naifId);
    if (catalogBody && catalogBody.parentNaifId === SUN.naifId && catalogBody.orbit.a_km > 0) {
      const kmToScene = this.orbitScale / AU_KM;
      const p = keplerPosition(catalogBody.orbit, this.jd);
      const target = out ?? new THREE.Vector3();
      target.set(p.x * kmToScene, p.z * kmToScene, -p.y * kmToScene);
      this.group.localToWorld(target);
      return target;
    }
    // P2C — named minor moons (Amalthea, Phoebe, Styx, Dysnomia…) aren't
    // mesh-rendered at the current scale (sub-km at 12u/AU). For search
    // fly-to we still need a world position. Compute it as
    //   parent.world  +  Kepler(moon.orbit) × parentMoonScale
    // where parentMoonScale reuses the parent's major-moon scene scale
    // (so Amalthea sits ~3 Jupiter-radii in, Phoebe beyond Iapetus, etc.)
    if (catalogBody && catalogBody.kind === 'moon' && catalogBody.parentNaifId > 0 &&
        catalogBody.orbit.a_km > 0) {
      const parentRecord = this.planets.find((r) => r.body.naifId === catalogBody.parentNaifId) ??
                           this.dwarfPlanets.find((r) => r.body.naifId === catalogBody.parentNaifId);
      if (parentRecord) {
        const parentWorld = out ?? new THREE.Vector3();
        parentRecord.mesh.getWorldPosition(parentWorld);
        const maxA = parentRecord.moons.reduce(
          (m, r) => Math.max(m, r.body.orbit.a_km),
          0,
        );
        // When parent has no meshed moons (e.g. Eris + Dysnomia, Haumea +
        // Hi‘iaka/Namaka — all NAMED_MINOR_MOONS), fall back to the
        // moonOrbitScale × parent-radius convention so the moon still
        // lands at a readable standoff rather than the catalog's raw km.
        const scaleFactor = maxA > 0
          ? (this.moonOrbitScale * parentRecord.visualRadius) / maxA
          : (this.moonOrbitScale * parentRecord.visualRadius) / catalogBody.orbit.a_km;
        const p = keplerPosition(catalogBody.orbit, this.jd);
        parentWorld.x += p.x * scaleFactor;
        parentWorld.y += p.z * scaleFactor;
        parentWorld.z += -p.y * scaleFactor;
        return parentWorld;
      }
    }
    return null;
  }

  get renderedMeshCount(): number {
    return (
      1 /* sun */ +
      this.planets.length +
      this.dwarfPlanets.length +
      this.planets.reduce((acc, p) => acc + p.moons.length, 0) +
      this.dwarfPlanets.reduce((acc, p) => acc + p.moons.length, 0)
    );
  }
}
