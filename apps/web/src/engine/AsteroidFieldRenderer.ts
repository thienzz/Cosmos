import * as THREE from 'three';

import {
  RENDERABLE_PARTICLE_BUDGET,
  SMALL_BODY_SUBTYPES,
  SMALL_BODY_SUBTYPE_COLOR,
  SUBTYPE_COUNT,
  getCometPopulation,
  getKboPopulation,
  getMainBeltPopulation,
  getTrojanPopulation,
  type PopulationStore,
  type ProceduralBodyKind,
  type SmallBodySubtype,
} from '@/data/proceduralMinorBodies';

import { applyEntityToggles } from './applyEntityToggles';
import type { GpuLifecycleHook } from './gpuLifecycle';
import { createMaterialForEntity } from './MaterialFactory';

/**
 * Procedural minor-body field renderer (T39 + T44, Doc 23 §8.7,
 * Doc 18 §Small Bodies).
 *
 * Three.js doesn't ship a GPU Kepler propagator, so we drive it here:
 *
 *   1. CPU upload — six orbital-element attributes (a, e, i, Ω, ω, M0) +
 *      a mean-motion attribute + a T44 subtype index per particle. Packed
 *      as `THREE.BufferAttribute`s on a single `THREE.BufferGeometry`.
 *      ~32 bytes per particle × 1.2M ≈ ~38 MB GPU upload, done once at
 *      mount.
 *
 *   2. GPU per-frame — a `RawShaderMaterial` solves Kepler's equation in
 *      the vertex shader using a 3-iteration Newton refinement, transforms
 *      the orbital-plane Cartesian into ICRS via the standard 3-1-3 Euler
 *      rotation, then divides by the scene's km-per-unit conversion to
 *      land in scene units.
 *
 *   3. T44 — Per-subtype colour palette (Doc 17 §Small Bodies, 20 ENT-IDs
 *      ENT-4010..ENT-4060). The vertex shader forwards a subtype index to
 *      the fragment shader, which reads the colour from a uniform array.
 *      Still one draw call — we've just widened the palette lookup from
 *      4 entries to 20.
 *
 * # Population scoping
 *
 * Doc 23 §6.4 lists 1.3M total minor bodies. T44 raises the default
 * renderable budget to 1.2M (was 100k) so the verify checklist's "≥ 1M
 * asteroids visible at Solar System scale" passes. Low-tier GPU paths can
 * clamp via `options.budget`.
 *
 * # Fly-to interaction
 *
 * The renderer exposes `getBodyWorldPosition(naifId)` mirroring
 * {@link SolarSystemRenderer.getBodyWorldPosition} so the engine bridge
 * can resolve a fly-to target for any procedural body — the propagator is
 * evaluated on the CPU for that single body so we don't need a GPU
 * readback.
 */

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface AsteroidFieldRendererOptions {
  /** km → scene units (matches `SolarSystemRenderer.orbitScale / AU`). */
  kmToSceneScale: number;
  /** Maximum particles drawn per frame. Default {@link RENDERABLE_PARTICLE_BUDGET}. */
  budget?: number;
  /**
   * Per-population fraction of the budget. Defaults: main-belt 0.88,
   * trojans 0.01, KBOs 0.10, comets 0.01. Tuned so the visible cloud
   * stays main-belt-dominated at Solar System scale (~1M asteroids) while
   * leaving enough particles for Trojans/KBOs to register visually. The
   * renderer normalises if the fractions don't sum to 1.0.
   */
  budgetSplit?: Partial<Record<ProceduralBodyKind, number>>;
  /** Initial JD — same epoch the {@link SolarSystemRenderer} starts at. */
  initialJulianDate?: number;
  /** Per-subtype colour overrides (RGB hex strings). */
  colors?: Partial<Record<SmallBodySubtype, string>>;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_BUDGET_SPLIT: Record<ProceduralBodyKind, number> = {
  'main-belt': 0.88,
  'trojan': 0.01,
  'kbo': 0.10,
  'comet': 0.01,
};

const J2000_JD = 2_451_545.0;
const SECONDS_PER_DAY = 86_400.0;

// Shaders moved to apps/web/src/shaders/smallbody-field-points.{vert,frag}
// and routed through MaterialFactory under 'smallbody-field-points' (T-V-58).
// SUBTYPE_COUNT is passed as a compile-time define; u_palette is set post-
// creation because the factory's render-block uniforms don't cover array
// shapes.

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

interface PackedSlice {
  store: PopulationStore;
  /** First index in the store this slice represents. */
  startIndex: number;
  /** Inclusive count of bodies pulled from the store. */
  count: number;
  /** Population kind — resolved via {@link PopulationStore.kind}. */
  kind: ProceduralBodyKind;
}

function buildPalette(
  overrides: Partial<Record<SmallBodySubtype, string>>,
): THREE.Color[] {
  return SMALL_BODY_SUBTYPES.map((subtype) => {
    const hex = overrides[subtype] ?? SMALL_BODY_SUBTYPE_COLOR[subtype];
    return new THREE.Color(hex);
  });
}

export class AsteroidFieldRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  readonly points: THREE.Points;

  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.ShaderMaterial;
  private readonly slices: PackedSlice[];
  /** Total particles uploaded (≤ budget). */
  readonly particleCount: number;

  constructor(options: AsteroidFieldRendererOptions) {
    const budget = Math.min(options.budget ?? RENDERABLE_PARTICLE_BUDGET, RENDERABLE_PARTICLE_BUDGET);
    this.slices = this.planSlices(budget, options.budgetSplit);

    const total = this.slices.reduce((s, slice) => s + slice.count, 0);
    this.particleCount = total;

    const orbitAEI = new Float32Array(total * 3);
    const nodeArgM0 = new Float32Array(total * 3);
    const meanMotion = new Float32Array(total);
    const subtypeIndex = new Float32Array(total);

    let cursor = 0;
    for (const slice of this.slices) {
      const { store, startIndex, count } = slice;
      for (let i = 0; i < count; i++) {
        const src = startIndex + i;
        orbitAEI[cursor * 3]     = store.a_km[src];
        orbitAEI[cursor * 3 + 1] = store.e[src];
        orbitAEI[cursor * 3 + 2] = store.i_rad[src];
        nodeArgM0[cursor * 3]     = store.Omega_rad[src];
        nodeArgM0[cursor * 3 + 1] = store.omega_rad[src];
        nodeArgM0[cursor * 3 + 2] = store.M0_rad[src];
        meanMotion[cursor] = store.n_rad_per_sec[src];
        subtypeIndex[cursor] = store.subtype[src];
        cursor++;
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('a_orbitA_e_i', new THREE.BufferAttribute(orbitAEI, 3));
    this.geometry.setAttribute('a_node_arg_M0', new THREE.BufferAttribute(nodeArgM0, 3));
    this.geometry.setAttribute('a_meanMotion', new THREE.BufferAttribute(meanMotion, 1));
    this.geometry.setAttribute('a_subtypeIndex', new THREE.BufferAttribute(subtypeIndex, 1));
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
    this.geometry.setDrawRange(0, total);
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);

    const palette = buildPalette(options.colors ?? {});
    const { material } = createMaterialForEntity(
      {
        render: {
          shader: 'smallbody-field-points',
          defines: { SUBTYPE_COUNT },
          uniforms: {
            u_dtSecondsSinceEpoch:
              ((options.initialJulianDate ?? J2000_JD) - J2000_JD) * SECONDS_PER_DAY,
            u_kmToScene: options.kmToSceneScale,
            u_pointSizePx: 1.6,
            u_devicePixelRatio:
              typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
          },
        },
      },
      { debugName: 'asteroid-field' },
    );
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    // Array uniform — set post-creation. MaterialFactory's buildUniformValue
    // only handles numbers + 2/3/4-length arrays, not THREE.Color[].
    material.uniforms.u_palette = { value: palette };
    this.material = material;

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'AsteroidField';
    this.points.frustumCulled = false;
    this.group = new THREE.Group();
    this.group.name = 'AsteroidField:group';
    this.group.add(this.points);
  }

  // ------------------------------------------------------------------
  // Per-frame
  // ------------------------------------------------------------------

  update(jd: number): void {
    this.material.uniforms.u_dtSecondsSinceEpoch.value =
      (jd - J2000_JD) * SECONDS_PER_DAY;
    // T52 — route Doc 22 asteroid toggles (ENT-4010) into the field shader
    // so flipping any feature in the InfoPanel produces a visible change.
    applyEntityToggles(this.material, 'ENT-4010');
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  /**
   * P3 — clamp the GPU draw to a fraction of the uploaded particle count.
   * Non-destructive: raising the fraction later restores the full set
   * without re-uploading buffers. Used by the adaptive-quality wiring to
   * shed per-vertex Kepler work when FPS dips below mid-tier.
   *
   * `fraction` is clamped to [0, 1]; `0` hides the field entirely (draw-
   * range length 0). The slice layout is preserved, so reducing the
   * fraction always trims from the tail (KBOs + comets drop first, then
   * Trojans, then main-belt — matches {@link DEFAULT_BUDGET_SPLIT}).
   */
  setDrawFraction(fraction: number): void {
    const clamped = Math.max(0, Math.min(1, fraction));
    const count = Math.floor(this.particleCount * clamped);
    this.geometry.setDrawRange(0, count);
  }

  /** Current draw-range count (for telemetry + tests). */
  getDrawCount(): number {
    return this.geometry.drawRange.count;
  }

  // ------------------------------------------------------------------
  // CPU-side propagation for fly-to and InfoPanel queries
  // ------------------------------------------------------------------

  computePosition(naifId: number, jd: number, kmToScene?: number): THREE.Vector3 | null {
    for (const slice of this.slices) {
      const range = sliceRange(slice);
      if (naifId < range.min || naifId >= range.max) continue;
      const idx = slice.startIndex + (naifId - range.min);
      const a = slice.store.a_km[idx];
      const e = slice.store.e[idx];
      const inc = slice.store.i_rad[idx];
      const Omega = slice.store.Omega_rad[idx];
      const omega = slice.store.omega_rad[idx];
      const M0 = slice.store.M0_rad[idx];
      const n = slice.store.n_rad_per_sec[idx];
      const dt = (jd - J2000_JD) * SECONDS_PER_DAY;
      const M = M0 + n * dt;
      const E = solveKeplerCpu(M, e);
      const cosE = Math.cos(E);
      const sinE = Math.sin(E);
      const sqrtFactor = Math.sqrt(1 - e * e);
      const nu = Math.atan2(sqrtFactor * sinE, cosE - e);
      const r = a * (1 - e * cosE);
      const xOrb = r * Math.cos(nu);
      const yOrb = r * Math.sin(nu);
      const cw = Math.cos(omega), sw = Math.sin(omega);
      const x1 = xOrb * cw - yOrb * sw;
      const y1 = xOrb * sw + yOrb * cw;
      const ci = Math.cos(inc), si = Math.sin(inc);
      const x2 = x1;
      const y2 = y1 * ci;
      const z2 = y1 * si;
      const cO = Math.cos(Omega), sO = Math.sin(Omega);
      const ex = x2 * cO - y2 * sO;
      const ey = x2 * sO + y2 * cO;
      const ez = z2;
      const scale = kmToScene ?? 1;
      return new THREE.Vector3(ex * scale, ez * scale, -ey * scale);
    }
    return null;
  }

  /** True if the renderer's instanced cloud covers this NAIF id. */
  hasNaif(naifId: number): boolean {
    for (const slice of this.slices) {
      const range = sliceRange(slice);
      if (naifId >= range.min && naifId < range.max) return true;
    }
    return false;
  }

  /**
   * Subtype classification for the particle identified by `naifId`, or
   * `null` if the id sits outside every slice. Used by entityAdapter +
   * the InfoPanel so a user clicking a cloud particle gets "S-type
   * Asteroid" rather than the generic "Asteroid" label.
   */
  getSubtype(naifId: number): SmallBodySubtype | null {
    for (const slice of this.slices) {
      const range = sliceRange(slice);
      if (naifId < range.min || naifId >= range.max) continue;
      const idx = slice.startIndex + (naifId - range.min);
      return SMALL_BODY_SUBTYPES[slice.store.subtype[idx]] ?? null;
    }
    return null;
  }

  // ------------------------------------------------------------------
  // GpuLifecycleHook
  // ------------------------------------------------------------------

  rebuildAfterContextRestore(): void {
    this.material.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private planSlices(
    budget: number,
    splitOverride?: Partial<Record<ProceduralBodyKind, number>>,
  ): PackedSlice[] {
    const split = { ...DEFAULT_BUDGET_SPLIT, ...(splitOverride ?? {}) };
    const total = (Object.values(split) as number[]).reduce((s, v) => s + v, 0);
    const norm = total > 0 ? total : 1;

    const populations: { kind: ProceduralBodyKind; store: PopulationStore }[] = [
      { kind: 'main-belt', store: getMainBeltPopulation() },
      { kind: 'trojan', store: getTrojanPopulation() },
      { kind: 'kbo', store: getKboPopulation() },
      { kind: 'comet', store: getCometPopulation() },
    ];
    const slices: PackedSlice[] = [];
    for (const { kind, store } of populations) {
      const fraction = (split[kind] ?? 0) / norm;
      const count = Math.min(store.count, Math.floor(budget * fraction));
      if (count === 0) continue;
      slices.push({
        store,
        startIndex: 0,
        count,
        kind,
      });
    }
    return slices;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function solveKeplerCpu(M: number, e: number): number {
  let mod = ((M + Math.PI) % (Math.PI * 2));
  if (mod < 0) mod += Math.PI * 2;
  const wrapped = mod - Math.PI;
  let E = wrapped + e * Math.sin(wrapped);
  for (let i = 0; i < 4; i++) {
    const dE = (E - e * Math.sin(E) - wrapped) / (1 - e * Math.cos(E));
    E -= dE;
  }
  return E;
}

function sliceRange(slice: PackedSlice): { min: number; max: number } {
  return {
    min: slice.store.naifIds[0],
    max: slice.store.naifIds[0] + slice.count,
  };
}
