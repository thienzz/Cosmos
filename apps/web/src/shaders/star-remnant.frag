// Cosmos Explorer — compact-remnant fragment shader (T41).
//
// Doc references:
//   - Doc 17 §ENT-1030 (White Dwarf), §ENT-1031 (Neutron Star / Pulsar).
//     ENT-1032 Black Hole stays on `exotic-blackhole.frag` — T28 shipped.
//   - Doc 18 §White Dwarf, §Neutron Star / Pulsar.
//
// Variants — mutually exclusive:
//   REMNANT_WHITEDWARF — featureless hot sphere, temp→colour interp.
//   REMNANT_NEUTRONSTAR — tiny core + magnetic polar-cap hotspots +
//                          rotating-beam phase marker.
//
// Note: T28 already ships volumetric pulsar wind nebula + emission beams
// via `exotic-pulsar.frag` for ENT-1031's PWN visualisation. This shader
// renders the *compact surface* of the neutron star itself (surface sphere);
// T41 extends T28 for coverage-checklist purposes but does NOT duplicate the
// volumetric raymarched PWN.
//
// CLAUDE.md Rule #1: fully procedural. CLAUDE.md Rule #6: log-depth.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"

// ---- palette uniforms -----------------------------------------------------

// @param u_hotColor    — Doc 17 hot end (#3366FF young WD, #AABBFF young NS).
uniform vec3  u_hotColor;
// @param u_coolColor   — Doc 17 cool end (#FFFFFF → #FFDDAA cooled WD).
uniform vec3  u_coolColor;
// @param u_polarColor  — Doc 17 magnetic polar-cap hotspot tint.
uniform vec3  u_polarColor;
// @param u_beamColor   — Doc 17 radio-beam emission tint (#00DDFF PWN base).
uniform vec3  u_beamColor;
// @param u_limbColor   — Limb tint for the extreme high-gravity falloff.
uniform vec3  u_limbColor;

// ---- feature magnitudes ---------------------------------------------------

// @param u_wdTemperature — Doc 17 §ENT-1030: 5k–160k K, default median 15k K.
//   Used to interpolate hotColor ↔ coolColor.
uniform float u_wdTemperature;
// @param u_rotationHz    — Doc 17 §ENT-1031 pulsar rotation frequency (Hz).
//   Crab 29.9 Hz slowed to 2 Hz for UX; WD defaults ~0.1 Hz.
uniform float u_rotationHz;
// @param u_magneticTilt  — Doc 17: angle between rotation axis and magnetic
//   axis (radians). 0 = aligned, π/2 = orthogonal.
uniform float u_magneticTilt;
// @param u_beamHalfAngle — Doc 18 §Rotating Beam Shader: 10°–30° → 0.17–0.52 rad.
uniform float u_beamHalfAngle;
// @param u_beamIntensity — additive emission when inside the beam cone.
uniform float u_beamIntensity;
// @param u_polarCapIntensity — brightness of the two hot spots at the
//   magnetic poles (Doc 18 NS "X-ray hot spots ~1-5 km across").
uniform float u_polarCapIntensity;
// @param u_limbDarkening — Doc 18 §WD "2.5–3.0" extremely pronounced.
uniform float u_limbDarkening;
// @param u_bloomIntensity — per-subtype bloom scalar.
uniform float u_bloomIntensity;
// @param u_pulsationAmp  — ZZ Ceti amplitude (white-dwarf DA sub-variant).
//   Default 0. Actual displacement is handled in star.vert via u_pulsation.
uniform float u_pulsationAmp;
// @param u_time — seconds since scene start.
uniform float u_time;
// @param u_sunDir — kept for API parity.
uniform vec3  u_sunDir;

in vec3 v_modelPos;
in vec3 v_surfaceNormal;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

// ---------------------------------------------------------------------------
// White-dwarf temperature → colour. Doc 18 interpolation brackets:
//   T > 100 000 K : blue-white
//   T >  50 000 K : bright white
//   T >  20 000 K : white
//   T >  10 000 K : yellow-white
//   T <  10 000 K : yellow → red (age-dependent; we fold age into T).
// ---------------------------------------------------------------------------
vec3 wdTempColor() {
  float t = clamp(u_wdTemperature, 3000.0, 200000.0);
  float tNorm = clamp((t - 5000.0) / 155000.0, 0.0, 1.0);
  return mix(u_coolColor, u_hotColor, tNorm);
}

// ---------------------------------------------------------------------------
// Neutron-star magnetic axis — rotate +Y by u_magneticTilt around +X, then
// rotate around +Y by the current rotation phase so the axis sweeps with
// time (lighthouse effect). Returns unit vector.
// ---------------------------------------------------------------------------
vec3 magneticAxis() {
  float phase = 6.28318530718 * u_rotationHz * u_time;
  // Start with +Y, tilt around X by magneticTilt.
  vec3 axis = vec3(0.0, cos(u_magneticTilt), sin(u_magneticTilt));
  // Rotate around +Y by phase.
  float c = cos(phase);
  float s = sin(phase);
  return normalize(vec3(c * axis.x + s * axis.z, axis.y, -s * axis.x + c * axis.z));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);
  vec3 nW = normalize(v_normalW);
  vec3 v  = normalize(v_viewDirW);

  vec3 color;

  #ifdef REMNANT_WHITEDWARF
    // Featureless hot sphere, optional ZZ Ceti pulsation handled in vertex
    // shader via u_pulsation. Surface gets a tiny noise shimmer to avoid
    // looking completely flat.
    color = wdTempColor();
    float shimmer = (cosmos_hash31(n * 200.0 + vec3(u_time * 0.2)) - 0.5)
                   * 0.02 * (1.0 + u_pulsationAmp);
    color *= 1.0 + shimmer;
  #endif

  #ifdef REMNANT_NEUTRONSTAR
    // Base hot surface — Doc 17: "nearly featureless Perlin noise amplitude 0.005".
    vec3 base = u_hotColor;
    float shimmer = (cosmos_hash31(n * 400.0) - 0.5) * 0.03;
    base *= 1.0 + shimmer;

    // Magnetic polar-cap hotspots — Gaussian around ±magnetic-axis.
    vec3 mAxis = magneticAxis();
    float dPlus  = max(0.0, dot(nW, mAxis));
    float dMinus = max(0.0, dot(nW, -mAxis));
    float cap = exp(-pow((1.0 - dPlus) * 6.0, 2.0))
              + exp(-pow((1.0 - dMinus) * 6.0, 2.0));
    base = mix(base, u_polarColor, cap * clamp(u_polarCapIntensity * 0.4, 0.0, 1.0));

    // Rotating beam: when the magnetic axis falls near the view direction,
    // the observer sees the beam; brighten the surface additively.
    float beamAlign = max(0.0, dot(v, mAxis));
    float beamMask  = smoothstep(cos(u_beamHalfAngle) - 0.02,
                                 cos(u_beamHalfAngle) + 0.02,
                                 beamAlign);
    vec3 beamGlow = u_beamColor * beamMask * u_beamIntensity * 0.3;

    color = base + beamGlow;
  #endif

  // Limb darkening.
  float mu = max(0.0, dot(nW, v));
  float limb = pow(mu, 1.0 / max(0.5, u_limbDarkening));
  color *= limb;

  // Limb tint ensures the edge doesn't go completely black at extreme
  // coefficients (WD can hit ^3.0).
  color = mix(color, u_limbColor, (1.0 - limb) * 0.15);

  // Bloom scalar — output is opaque; post-processing does the actual bloom,
  // we just brighten by the target intensity so the bloom threshold triggers.
  color *= max(u_bloomIntensity, 0.1);

  // Silence unused uniforms.
  color += u_sunDir * 0.0;

  fragColor = vec4(color, 1.0);
}
