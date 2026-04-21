import {
  ICRS_TO_GALACTIC,
  OBLIQUITY_J2000_RAD,
} from '@cosmos/coordinate-utils';
import * as THREE from 'three';

import mwBandFragSource from '@/shaders/mw-band.frag';
import mwBandVertSource from '@/shaders/mw-band.vert';
import zodiacalLightFragSource from '@/shaders/zodiacal-light.frag';

import type { ScaleRegime } from '../stores/types';

import { applyEntityToggles } from './applyEntityToggles';
import type { GpuLifecycleHook } from './gpuLifecycle';

/**
 * T46a — Milky Way interior view composer (Doc 17 ENT-6010, Doc 19 §S2-S4,
 * Doc 24 §Night Sky View).
 *
 * Mounts two inside-out (`BackSide`) icosahedral spheres that surround the
 * camera and render the two sky backdrops the from-Earth Observation persona
 * expects:
 *
 *   1. **MW band sphere** — latitude-biased emissive glow in Galactic
 *      coordinates with dust absorption (Great Rift, Coalsack, Aquila Rift).
 *      Scaled additively over the starfield; cross-fades out when the camera
 *      leaves the Stellar regime (Doc 19 §Scale Transitions: 500 ly – 1 kly
 *      hysteresis band). At the Galactic scale the external galaxy-spiral
 *      renderer (T46) takes over.
 *
 *   2. **Zodiacal sphere** — cos²(β) conical glow along the ecliptic peaked
 *      near the Sun, plus an optional anti-solar gegenschein bump
 *      (educational toggle per Doc 22). Visible only inside the Solar System
 *      regime.
 *
 * Fully procedural (CLAUDE.md Rule #1) — the SFD dust-extinction texture
 * exception listed in CLAUDE.md is reserved for a future asset swap; the
 * shader currently approximates dust structure with fbm + hand-seeded
 * hotspots. Matches CmbBoundarySphere's texture-free approach to the CMB.
 *
 * The composer is *non-intrusive*: it writes only to its own meshes, never
 * to the scene's depth buffer (`depthWrite: false`, `additive blending`).
 * Callers (SceneManager) add the meshes directly; `update()` refreshes
 * dissolve ratios + ecliptic sun direction every frame.
 */

// Sgr A* direction (ICRS J2000.0) — the user-facing Galactic Centre anchor.
// RA = 266.4168°, Dec = -29.0078° (Reid & Brunthaler 2004 + IAU standard).
export const SGR_A_RA_DEG = 266.4168;
export const SGR_A_DEC_DEG = -29.0078;

/**
 * Row-major `view → galactic` basis matrix used by `mw-band.frag`:
 *   - column 0  = direction toward Sgr A* (ICRS-cartesian unit vec)
 *   - column 2  = direction toward North Galactic Pole
 *   - column 1  = cross(col2, col0) → right-handed orthonormal
 *
 * Because the scene-space axes are aligned with ICRS (Doc 23 §2.1), we can
 * feed the raw ICRS→Galactic matrix straight through; Three.js `Matrix3`
 * stores row-major arrays when passed to `uniformMatrix3fv` so we simply
 * flatten the Doc 23 §2.2 constants.
 */
export function buildViewToGalacticMatrix(): THREE.Matrix3 {
  const m = new THREE.Matrix3();
  // THREE.Matrix3.set is row-major.
  m.set(
    ICRS_TO_GALACTIC[0]![0], ICRS_TO_GALACTIC[0]![1], ICRS_TO_GALACTIC[0]![2],
    ICRS_TO_GALACTIC[1]![0], ICRS_TO_GALACTIC[1]![1], ICRS_TO_GALACTIC[1]![2],
    ICRS_TO_GALACTIC[2]![0], ICRS_TO_GALACTIC[2]![1], ICRS_TO_GALACTIC[2]![2],
  );
  return m;
}

/**
 * ICRS (J2000.0) → ecliptic rotation. Same obliquity rotation used by
 * coordinate-utils but hoisted to a Three.js Matrix3 for the shader uniform.
 */
export function buildViewToEclipticMatrix(): THREE.Matrix3 {
  const c = Math.cos(OBLIQUITY_J2000_RAD);
  const s = Math.sin(OBLIQUITY_J2000_RAD);
  const m = new THREE.Matrix3();
  m.set(
    1, 0, 0,
    0, c, s,
    0, -s, c,
  );
  return m;
}

export interface MilkyWayInteriorOptions {
  /** World-space radius for both spheres. Default 2000 — inside the CMB
   *  sphere (800 is too small at stellar scales) and outside any solar
   *  system debris. */
  radius?: number;
  /** Icosahedron subdivision level. Default 4 (≈2562 verts — the fragment
   *  shader carries all the detail). */
  subdivisions?: number;
  /** Master MW band brightness (0..2). Default 1. */
  bandIntensity?: number;
  /** Galactic Centre bulge multiplier. Default 1.35. */
  bulgeIntensity?: number;
  /** Dust-lane opacity multiplier (0..1). Default 0.8. */
  dustStrength?: number;
  /** Zodiacal master scale (0..2). Default 0.9. */
  zodiacalIntensity?: number;
  /** Enable the anti-solar gegenschein bump. Default false (Doc 22
   *  educational toggle). */
  gegenscheinEnabled?: boolean;
  /** Gegenschein peak intensity (0..1). Default 0.55. */
  gegenscheinIntensity?: number;
  /** Scene-space direction from camera to the Sun (for Solar System mode).
   *  Defaults to the +X axis; callers that have a solar-system renderer
   *  should point this at the heliocentre. */
  sunDirection?: THREE.Vector3;
  /** Group name override. */
  groupName?: string;
}

/**
 * Regime-aware visibility driver. The composer itself stays in the scene
 * graph once mounted; `setRegime()` flips the dissolve uniform so the MW
 * band smoothly fades between Stellar (1.0) and Galactic (0.0) while the
 * zodiacal sphere disappears at Stellar scale and beyond.
 */
export class MilkyWayInteriorComposer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  readonly bandMesh: THREE.Mesh;
  readonly zodiacalMesh: THREE.Mesh;

  private readonly bandMaterial: THREE.ShaderMaterial;
  private readonly zodiacalMaterial: THREE.ShaderMaterial;

  private readonly bandUniforms: {
    u_bandColor: THREE.IUniform<THREE.Color>;
    u_bulgeColor: THREE.IUniform<THREE.Color>;
    u_dustColor: THREE.IUniform<THREE.Color>;
    u_bandIntensity: THREE.IUniform<number>;
    u_bulgeIntensity: THREE.IUniform<number>;
    u_dustStrength: THREE.IUniform<number>;
    u_dissolve: THREE.IUniform<number>;
    u_time: THREE.IUniform<number>;
    u_viewToGalactic: THREE.IUniform<THREE.Matrix3>;
  };

  private readonly zodiacalUniforms: {
    u_zodiacalColor: THREE.IUniform<THREE.Color>;
    u_zodiacalIntensity: THREE.IUniform<number>;
    u_gegenscheinEnabled: THREE.IUniform<number>;
    u_gegenscheinIntensity: THREE.IUniform<number>;
    u_sunDirectionView: THREE.IUniform<THREE.Vector3>;
    u_viewToEcliptic: THREE.IUniform<THREE.Matrix3>;
    u_time: THREE.IUniform<number>;
  };

  /** Current dissolve target — animated toward by `update()`. */
  private bandDissolveTarget = 1.0;
  private zodiacalTarget = 1.0;

  constructor(options: MilkyWayInteriorOptions = {}) {
    const radius = options.radius ?? 2000;
    const subdivisions = options.subdivisions ?? 4;

    const geometry = new THREE.IcosahedronGeometry(radius, subdivisions);

    // --- MW band shader ---
    this.bandUniforms = {
      u_bandColor:       { value: new THREE.Color('#f5e6c8') }, // warm cream
      u_bulgeColor:      { value: new THREE.Color('#ffcf88') }, // Sgr gold
      u_dustColor:       { value: new THREE.Color('#1a0f08') }, // brown-black
      u_bandIntensity:   { value: options.bandIntensity ?? 1.0 },
      u_bulgeIntensity:  { value: options.bulgeIntensity ?? 1.35 },
      u_dustStrength:    { value: options.dustStrength ?? 0.8 },
      u_dissolve:        { value: 1.0 },
      u_time:            { value: 0 },
      u_viewToGalactic:  { value: buildViewToGalacticMatrix() },
    };

    this.bandMaterial = new THREE.ShaderMaterial({
      name: 'mw-band',
      glslVersion: THREE.GLSL3,
      uniforms: this.bandUniforms as unknown as THREE.ShaderMaterial['uniforms'],
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexShader: mwBandVertSource,
      fragmentShader: mwBandFragSource,
    });

    this.bandMesh = new THREE.Mesh(geometry, this.bandMaterial);
    this.bandMesh.name = 'MilkyWayInteriorBand';
    this.bandMesh.renderOrder = -2; // behind everything but the skybox
    this.bandMesh.frustumCulled = false;

    // --- Zodiacal shader — shares the same geometry instance. ---
    const sunDir = (options.sunDirection ?? new THREE.Vector3(1, 0, 0)).clone().normalize();
    this.zodiacalUniforms = {
      u_zodiacalColor:        { value: new THREE.Color('#f7e4c2') },
      u_zodiacalIntensity:    { value: options.zodiacalIntensity ?? 0.9 },
      u_gegenscheinEnabled:   { value: options.gegenscheinEnabled ? 1 : 0 },
      u_gegenscheinIntensity: { value: options.gegenscheinIntensity ?? 0.55 },
      u_sunDirectionView:     { value: sunDir },
      u_viewToEcliptic:       { value: buildViewToEclipticMatrix() },
      u_time:                 { value: 0 },
    };

    this.zodiacalMaterial = new THREE.ShaderMaterial({
      name: 'zodiacal-light',
      glslVersion: THREE.GLSL3,
      uniforms: this.zodiacalUniforms as unknown as THREE.ShaderMaterial['uniforms'],
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexShader: mwBandVertSource,
      fragmentShader: zodiacalLightFragSource,
    });

    this.zodiacalMesh = new THREE.Mesh(geometry, this.zodiacalMaterial);
    this.zodiacalMesh.name = 'ZodiacalLight';
    this.zodiacalMesh.renderOrder = -1; // on top of MW band, below world
    this.zodiacalMesh.frustumCulled = false;

    this.group = new THREE.Group();
    this.group.name = options.groupName ?? 'MilkyWayInteriorComposer';
    this.group.add(this.bandMesh);
    this.group.add(this.zodiacalMesh);
  }

  /**
   * Regime-aware cross-fade targets (Doc 19 §Scale Transitions):
   *   • solar_system — MW band + zodiacal both visible.
   *   • stellar      — MW band full on, zodiacal fades (only near home star).
   *   • galactic     — MW band fades (external galaxy-spiral takes over),
   *                    zodiacal off.
   *   • cosmic       — both off.
   */
  setRegime(regime: ScaleRegime): void {
    switch (regime) {
      case 'solar_system':
        this.bandDissolveTarget = 1.0;
        this.zodiacalTarget = 1.0;
        break;
      case 'stellar':
        this.bandDissolveTarget = 1.0;
        this.zodiacalTarget = 0.0;
        break;
      case 'galactic':
      case 'cosmic':
        this.bandDissolveTarget = 0.0;
        this.zodiacalTarget = 0.0;
        break;
    }
  }

  /**
   * Explicit dissolve override — useful for the hysteresis crossfade where
   * the caller samples the camera distance and drives a smoothstep across
   * the 800..1000 pc band (Doc 19 §Scale Transitions, Doc 27 §9.2).
   * Values outside [0, 1] are clamped.
   */
  setBandDissolve(value: number): void {
    this.bandDissolveTarget = Math.max(0, Math.min(1, value));
  }

  setZodiacalIntensity(value: number): void {
    this.zodiacalUniforms.u_zodiacalIntensity.value = Math.max(0, value);
  }

  setGegenscheinEnabled(enabled: boolean): void {
    this.zodiacalUniforms.u_gegenscheinEnabled.value = enabled ? 1 : 0;
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.zodiacalUniforms.u_sunDirectionView.value.copy(dir).normalize();
  }

  /** Current dissolve values — exposed for tests. */
  get bandDissolve(): number {
    return this.bandUniforms.u_dissolve.value;
  }
  get zodiacalDissolve(): number {
    return this.zodiacalUniforms.u_zodiacalIntensity.value;
  }

  update(deltaSec: number, elapsedSec: number): void {
    this.bandUniforms.u_time.value = elapsedSec;
    this.zodiacalUniforms.u_time.value = elapsedSec;

    // Damped approach — avoids popping at regime transitions. Time constant
    // ≈ 0.5 s so a solar→galactic fly-out crossfade feels like a natural dim
    // rather than a hard cut.
    const rate = Math.min(1, deltaSec * 2.0);
    const current = this.bandUniforms.u_dissolve.value;
    this.bandUniforms.u_dissolve.value = current + (this.bandDissolveTarget - current) * rate;

    // Zodiacal uses its own intensity uniform as the fade channel so the
    // user-set master intensity still acts as a multiplier.
    const masterScale = this.zodiacalTarget;
    const currentZ = this.zodiacalUniforms.u_zodiacalIntensity.value;
    // Approach the target master value without discarding the user's intended
    // scale — we retain the configured peak via the mesh visibility flag when
    // fully faded.
    if (masterScale === 0 && currentZ > 0.01) {
      this.zodiacalUniforms.u_zodiacalIntensity.value = currentZ * (1 - rate);
    } else if (masterScale > 0 && currentZ < 0.89) {
      this.zodiacalUniforms.u_zodiacalIntensity.value =
        currentZ + (0.9 - currentZ) * rate;
    }

    // Hide the zodiacal mesh entirely when fully dark (Doc 12 perf budget —
    // skip a full-screen pass that would produce zero output anyway).
    this.zodiacalMesh.visible = this.zodiacalUniforms.u_zodiacalIntensity.value > 0.005;
    this.bandMesh.visible = this.bandUniforms.u_dissolve.value > 0.005;

    // T52 — route Doc 22 zodiacal-light toggles (ENT-4036) into the shader.
    applyEntityToggles(this.zodiacalMaterial, 'ENT-4036');
  }

  rebuildAfterContextRestore(): void {
    this.bandMaterial.needsUpdate = true;
    this.zodiacalMaterial.needsUpdate = true;
  }

  dispose(): void {
    // Geometry is shared between both meshes — dispose once.
    this.bandMesh.geometry.dispose();
    this.bandMaterial.dispose();
    this.zodiacalMaterial.dispose();
  }
}
