import * as THREE from 'three';

import { applyEntityToggles } from './applyEntityToggles';
import type { GpuLifecycleHook } from './SceneManager';

/**
 * T29 — Cosmic Microwave Background boundary sphere (Doc 17 ENT-7040,
 * Doc 18 §Cosmic Microwave Background).
 *
 * Renders an enclosing icosahedral sphere at the horizon of the observable
 * universe (~46 Gly comoving) with a procedural temperature-anisotropy
 * colour field. The shader maps a fbm-driven temperature scalar ∈ [-1, 1]
 * through Doc 18's false-colour ramp:
 *   +1.0 (hot)  → #FF4444
 *   +0.5        → orange-red #FF7744
 *    0.0 (mean) → neutral gray #CCCCCC
 *  -0.5        → cyan-blue   #4477FF
 *  -1.0 (cold) → deep blue   #2233DD
 *
 * The sphere faces inward (`BackSide`) so the observer sees it wrapping the
 * scene. Low-frequency fbm produces the large-scale anisotropy pattern
 * (Planck multipoles ℓ ~ 2–200 approximated as noise), with a separate
 * higher-frequency pass for acoustic-peak speckle.
 *
 * CLAUDE.md Rule #1: fully procedural, no texture sampling (Doc 18
 * mentions loading Planck/WMAP data — that's a future asset swap).
 */

export interface CmbBoundarySphereOptions {
  /** World-space radius of the CMB sphere. Default 800 world units —
   *  large enough to enclose the cosmic-web gallery (filaments span ±50u),
   *  small enough that the back-face rendering stays inside the camera's
   *  `far` plane (Doc 10 §3: far = 1e14). */
  radius?: number;
  /** Icosahedron subdivision level. Doc 17 recommends ≥6 for close-up
   *  appearance; we default to 4 (≈2562 verts) since the fragment shader
   *  carries the detail. */
  subdivisions?: number;
  /** Overall temperature-anisotropy amplitude (0 = uniform, 1 = full
   *  false-colour range). Default 1. */
  anisotropyStrength?: number;
  /** Include CMB dipole (Doc 17 §Dipole). Default false. */
  dipoleEnabled?: boolean;
  /** Dipole direction (unit vector) for the toggle. */
  dipoleDirection?: THREE.Vector3;
  /** Group name override. */
  groupName?: string;
}

export class CmbBoundarySphere implements GpuLifecycleHook {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly uniforms: {
    u_anisotropyStrength: THREE.IUniform<number>;
    u_dipoleEnabled: THREE.IUniform<number>;
    u_dipoleDirection: THREE.IUniform<THREE.Vector3>;
    u_time: THREE.IUniform<number>;
  };

  constructor(options: CmbBoundarySphereOptions = {}) {
    const radius = options.radius ?? 800;
    const subdivisions = options.subdivisions ?? 4;
    const geometry = new THREE.IcosahedronGeometry(radius, subdivisions);

    this.uniforms = {
      u_anisotropyStrength: { value: options.anisotropyStrength ?? 1.0 },
      u_dipoleEnabled:      { value: options.dipoleEnabled ? 1 : 0 },
      u_dipoleDirection:    { value: (options.dipoleDirection?.clone() ?? new THREE.Vector3(0, 0, 1)).normalize() },
      u_time:               { value: 0 },
    };

    this.material = new THREE.ShaderMaterial({
      name: 'cmb-boundary',
      glslVersion: THREE.GLSL3,
      uniforms: this.uniforms as unknown as THREE.ShaderMaterial['uniforms'],
      side: THREE.BackSide,
      depthWrite: false,
      transparent: false,
      vertexShader: CMB_VERT,
      fragmentShader: CMB_FRAG,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = options.groupName ?? 'CmbBoundarySphere';
    this.mesh.frustumCulled = false;  // always visible
  }

  setAnisotropyStrength(strength: number): void {
    this.uniforms.u_anisotropyStrength.value = strength;
  }

  setDipoleEnabled(enabled: boolean): void {
    this.uniforms.u_dipoleEnabled.value = enabled ? 1 : 0;
  }

  setDipoleDirection(direction: THREE.Vector3): void {
    this.uniforms.u_dipoleDirection.value.copy(direction).normalize();
  }

  update(_deltaSec: number, elapsedSec: number): void {
    this.uniforms.u_time.value = elapsedSec;
    // T52 — route Doc 22 CMB toggles (ENT-8034) into the sphere shader.
    applyEntityToggles(this.material, 'ENT-8034');
  }

  rebuildAfterContextRestore(): void {
    this.material.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

// ---------------------------------------------------------------------------
// Inline shaders — too small to warrant separate .vert/.frag files.
// ---------------------------------------------------------------------------

const CMB_VERT = /* glsl */ `
out vec3 v_pos;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif
void main() {
  v_pos = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
`;

const CMB_FRAG = /* glsl */ `
precision highp float;
in vec3 v_pos;
uniform float u_anisotropyStrength;
uniform float u_dipoleEnabled;
uniform vec3  u_dipoleDirection;
uniform float u_time;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif
out vec4 fragColor;

// Hash + value noise inlined — too small to warrant pulling in lib/noise.glsl.
float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1,0,0));
  float n010 = hash(i + vec3(0,1,0));
  float n110 = hash(i + vec3(1,1,0));
  float n001 = hash(i + vec3(0,0,1));
  float n101 = hash(i + vec3(1,0,1));
  float n011 = hash(i + vec3(0,1,1));
  float n111 = hash(i + vec3(1,1,1));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
}

float fbm(vec3 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * valueNoise(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

// False-colour CMB ramp. Doc 18 CMB: red (+200 uK) -> white (mean) -> blue
// (-200 uK). Temperature t in [-1, 1].
vec3 cmbColor(float t) {
  if (t > 0.5)  return mix(vec3(1.0, 0.47, 0.27), vec3(1.0, 0.27, 0.27), (t - 0.5) * 2.0);
  if (t > 0.0)  return mix(vec3(0.80, 0.80, 0.80), vec3(1.0, 0.47, 0.27), t * 2.0);
  if (t > -0.5) return mix(vec3(0.27, 0.47, 1.0), vec3(0.80, 0.80, 0.80), (t + 0.5) * 2.0);
  return mix(vec3(0.13, 0.20, 0.87), vec3(0.27, 0.47, 1.0), (t + 1.0) * 2.0);
}

void main() {
  vec3 dir = normalize(v_pos);
  // Large-scale multipoles (ℓ ~ 2-40): 3-octave fbm on the unit sphere.
  float large = fbm(dir * 2.5, 3);
  // Acoustic peak speckle (ℓ ~ 200+): higher-freq fbm, lower amplitude.
  float speckle = fbm(dir * 14.0, 4) - 0.5;
  float temp = (large - 0.5) * 2.0 + speckle * 0.4;
  // Dipole (Doc 17 §Dipole — 3 mK kinematic).
  if (u_dipoleEnabled > 0.5) {
    temp += dot(dir, u_dipoleDirection) * 0.35;
  }
  temp = clamp(temp * u_anisotropyStrength, -1.0, 1.0);
  vec3 col = cmbColor(temp);
  fragColor = vec4(col, 1.0);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
`;
