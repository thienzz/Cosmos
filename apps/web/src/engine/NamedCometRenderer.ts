import * as THREE from 'three';

import {
  NAMED_COMETS,
  type NamedComet,
} from '@/data/namedComets';
import {
  smallbodyCometFragSource,
  smallbodyCometVertSource,
} from '@/shaders';

import { applyEntityToggles } from './applyEntityToggles';
import type { GpuLifecycleHook } from './gpuLifecycle';
import { keplerPosition } from './keplerianOrbit';

/**
 * Doc 22 comet family → ENT-ID. ENT-4020 is the generic comet spec;
 * ENT-4024 is the Doc 22 Interstellar Object spec. Long-period comets
 * share the generic comet spec (no dedicated long-period ENT-ID).
 */
const COMET_SUBTYPE_TO_ENT_ID: Record<string, string> = {
  'comet-short-period': 'ENT-4020',
  'comet-halley-type': 'ENT-4020',
  'comet-long-period': 'ENT-4020',
  'comet-interstellar': 'ENT-4024',
};

/**
 * Named-comet renderer (T44, Doc 17 §ENT-4020..ENT-4023, Doc 18 §Comets,
 * Doc 22 §10).
 *
 * The procedural cloud in {@link AsteroidFieldRenderer} draws 12k+
 * comets as bright additive points — enough to show the population at
 * Solar System scale, but not the Doc 17 "nucleus + coma + dual tails"
 * composite Hale-Bopp-style observers expect when they fly-to a
 * specific comet by name. This renderer meshes that composite for a
 * hand-picked list of real comets (Halley, Hale-Bopp, NEOWISE, ZTF,
 * 67P, Encke, Borisov) so the search box + fly-to animator surface a
 * real visual target.
 *
 * # Geometry
 *
 * Each comet is a single `THREE.Group` containing four draws:
 *
 *   1. Nucleus     — 1 quad, tiny (sub-scene unit), dark crust
 *   2. Coma halo   — 1 quad, ~4× nucleus radius, soft additive glow
 *   3. Dust tail   — 1 ribbon (16×4 quads), curved anti-sunward
 *   4. Ion tail    — 1 ribbon (16×4 quads), straight anti-sunward,
 *                    sinusoidally modulated by solar wind
 *
 * All four share a single `ShaderMaterial` instance per comet; the
 * per-draw `u_component` uniform switches between the four geometries
 * at render time via `onBeforeRender` callbacks on each Mesh. This keeps
 * the geometry budget low (≤ 4 × 64 = 256 vertices per comet × 7 comets
 * = ~1800 verts) and the draw call count bounded at 4 × 7 = 28.
 *
 * # Orientation
 *
 * The tail direction is computed CPU-side every frame as `-normalize(
 * nucleusPosition)` (heliocentric, since the Sun sits at the scene
 * origin). This direction is written to `u_sunDirection` on every
 * comet's material so the GPU builds anti-sunward ribbons. At scene
 * origin the renderer assumes the Sun is there — matches
 * {@link SolarSystemRenderer}.
 *
 * # Activity
 *
 * Doc 17 §5326 "Tail Growth/Shrinkage" — tail length scales with
 * heliocentric-distance-modulated activity. We compute
 * `activityScale = clamp(activity * (perihelion/currentR), 0, 1)` and
 * use it to modulate both tail length and coma opacity per frame.
 */

interface CometRecord {
  body: NamedComet;
  group: THREE.Group;
  material: THREE.ShaderMaterial;
  nucleus: THREE.Mesh;
  coma: THREE.Mesh;
  dustTail: THREE.Mesh;
  ionTail: THREE.Mesh;
}

export interface NamedCometRendererOptions {
  /** km → scene units (matches SolarSystemRenderer.orbitScale / AU). */
  kmToSceneScale: number;
  /** Initial JD. */
  initialJulianDate?: number;
}

const J2000_JD = 2_451_545.0;
const AU_KM = 149_597_870.7;

/**
 * Build a quad mesh whose UVs are a single u-vertex-spacing grid. The
 * tail ribbons need subdivisions so the vertex-shader curve comes out
 * smooth.
 */
function buildRibbon(uSegments: number, vSegments: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let u = 0; u <= uSegments; u++) {
    for (let v = 0; v <= vSegments; v++) {
      const uu = u / uSegments;
      const vv = v / vSegments;
      positions.push(uu, vv, 0);
      uvs.push(uu, vv);
    }
  }
  const stride = vSegments + 1;
  for (let u = 0; u < uSegments; u++) {
    for (let v = 0; v < vSegments; v++) {
      const a = u * stride + v;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('a_tailCoord', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  // The vertex shader transforms UVs into world offsets, so disable
  // frustum culling — the default bounding sphere around the unit quad
  // would cull at distances where we actually want the comet visible.
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
  return g;
}

function buildQuad(): THREE.BufferGeometry {
  return buildRibbon(1, 1);
}

export class NamedCometRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly comets: CometRecord[] = [];
  private readonly kmToScene: number;
  private jd: number;

  constructor(options: NamedCometRendererOptions) {
    this.group = new THREE.Group();
    this.group.name = 'NamedComets';
    this.kmToScene = options.kmToSceneScale;
    this.jd = options.initialJulianDate ?? J2000_JD;

    for (const body of NAMED_COMETS) {
      this.comets.push(this.buildComet(body));
    }
    // Drive the first frame so positions + uniforms are valid before
    // the first render — SolarSystemRenderer.update() will overwrite
    // them next tick, but this matters for snapshot tests.
    this.update(this.jd);
  }

  // ------------------------------------------------------------------
  // Construction
  // ------------------------------------------------------------------

  private buildComet(body: NamedComet): CometRecord {
    const material = new THREE.ShaderMaterial({
      name: `comet:${body.name}`,
      vertexShader: smallbodyCometVertSource,
      fragmentShader: smallbodyCometFragSource,
      glslVersion: THREE.GLSL3,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        u_sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        u_tailLengthScene: { value: this.tailLengthScene(body) },
        u_tailWidthScene: { value: this.tailWidthScene(body) },
        u_nucleusRadius: { value: 0.05 },
        u_activity: { value: body.activity },
        u_component: { value: 0 },
        u_ionCurl: { value: 0.15 },
        u_nucleusColour: { value: new THREE.Color('#1a1a2e') },
        u_dustColour: { value: new THREE.Color('#f5e6d3') },
        u_ionColour: { value: new THREE.Color('#4a8fc8') },
        u_comaColour: { value: new THREE.Color(
          body.subtype === 'comet-interstellar' ? '#ff9066' : '#9fbf9f',
        )},
      },
    });

    const group = new THREE.Group();
    group.name = `Comet:${body.name}`;
    group.userData = { naifId: body.naifId, bodyKind: 'comet', pickable: true };

    const nucleus = new THREE.Mesh(buildQuad(), material);
    nucleus.name = `${body.name}:nucleus`;
    nucleus.frustumCulled = false;
    nucleus.userData = { naifId: body.naifId, bodyKind: 'comet', pickable: true };
    nucleus.renderOrder = 3;                              // draw on top of tails
    nucleus.onBeforeRender = () => { material.uniforms.u_component.value = 0; };

    const coma = new THREE.Mesh(buildQuad(), material);
    coma.name = `${body.name}:coma`;
    coma.frustumCulled = false;
    coma.renderOrder = 2;
    coma.onBeforeRender = () => { material.uniforms.u_component.value = 3; };

    const dustTail = new THREE.Mesh(buildRibbon(16, 4), material);
    dustTail.name = `${body.name}:dust`;
    dustTail.frustumCulled = false;
    dustTail.renderOrder = 0;
    dustTail.onBeforeRender = () => { material.uniforms.u_component.value = 1; };

    const ionTail = new THREE.Mesh(buildRibbon(16, 4), material);
    ionTail.name = `${body.name}:ion`;
    ionTail.frustumCulled = false;
    ionTail.renderOrder = 1;
    ionTail.onBeforeRender = () => { material.uniforms.u_component.value = 2; };

    group.add(dustTail, ionTail, coma, nucleus);
    this.group.add(group);

    return { body, group, material, nucleus, coma, dustTail, ionTail };
  }

  private tailLengthScene(body: NamedComet): number {
    // Peak tail length in scene units. Scale aggressively so the tail
    // reads at the same Solar System camera distance planet orbits do.
    const km = Math.max(body.dustTailLength_km, body.ionTailLength_km);
    return km * this.kmToScene * 0.35;
  }

  private tailWidthScene(body: NamedComet): number {
    return this.tailLengthScene(body) * 0.06;
  }

  // ------------------------------------------------------------------
  // Per-frame
  // ------------------------------------------------------------------

  update(jd: number): void {
    this.jd = jd;
    const sunDir = new THREE.Vector3();
    for (const rec of this.comets) {
      const p = keplerPosition(rec.body.orbit, jd);
      const x = p.x * this.kmToScene;
      const y = p.z * this.kmToScene;
      const z = -p.y * this.kmToScene;
      rec.group.position.set(x, y, z);

      // Sun direction = nucleus → origin, normalised in scene space.
      sunDir.set(-x, -y, -z);
      if (sunDir.lengthSq() > 1e-12) sunDir.normalize();
      else sunDir.set(1, 0, 0);
      rec.material.uniforms.u_sunDirection.value.copy(sunDir);

      // Activity scaling — Doc 17 §5326 tail-length inverse-square drop
      // as comet recedes from the Sun. We compute heliocentric distance
      // in AU and scale linearly by the perihelion ratio clamped to
      // [0.1, 1.5] so distant comets still show a faint tail cue
      // instead of disappearing.
      const r_au = Math.hypot(p.x, p.y, p.z) / AU_KM;
      const perihelion_au = rec.body.orbit.a_km * (1 - rec.body.orbit.e) / AU_KM;
      const activityScale = Math.max(
        0.05,
        Math.min(1.5, (perihelion_au / Math.max(r_au, perihelion_au)) * rec.body.activity),
      );
      rec.material.uniforms.u_activity.value = activityScale;
      rec.material.uniforms.u_tailLengthScene.value =
        this.tailLengthScene(rec.body) * activityScale;
      // T52 — route Doc 22 comet toggles per sub-class (ENT-4020..4023).
      applyEntityToggles(rec.material, COMET_SUBTYPE_TO_ENT_ID[rec.body.subtype]);
    }
  }

  // ------------------------------------------------------------------
  // Fly-to / picking helpers
  // ------------------------------------------------------------------

  hasNaif(naifId: number): boolean {
    return this.comets.some((c) => c.body.naifId === naifId);
  }

  /** World-space position of the named comet, or `null` if unknown. */
  getBodyWorldPosition(naifId: number, out?: THREE.Vector3): THREE.Vector3 | null {
    const rec = this.comets.find((c) => c.body.naifId === naifId);
    if (!rec) return null;
    const target = out ?? new THREE.Vector3();
    rec.group.getWorldPosition(target);
    return target;
  }

  getPickableMeshes(): THREE.Mesh[] {
    // Nucleus is the pickable face — coma/tails overlap too aggressively
    // to be useful click targets.
    return this.comets.map((c) => c.nucleus);
  }

  get renderedCometCount(): number {
    return this.comets.length;
  }

  // ------------------------------------------------------------------
  // GpuLifecycleHook
  // ------------------------------------------------------------------

  rebuildAfterContextRestore(): void {
    for (const rec of this.comets) rec.material.needsUpdate = true;
  }

  dispose(): void {
    for (const rec of this.comets) {
      rec.material.dispose();
      rec.nucleus.geometry.dispose();
      rec.coma.geometry.dispose();
      rec.dustTail.geometry.dispose();
      rec.ionTail.geometry.dispose();
    }
    this.comets.length = 0;
  }
}
