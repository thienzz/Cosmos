// Cosmos Explorer — planetary nebula fragment shader.
//
// Doc 18 §Planetary Nebula — three concentric ionization shells around a
// central white dwarf plus an optional bipolar-lobe mask for morphologies
// like the Butterfly / Cat's Eye. The shells are gaussian-profiled
// so each one has a soft rim; the OIII (inner), NII (middle), Hα (outer)
// palette is per Doc 18's colour mapping. Expansion is applied by scaling
// the sampled radius with `1 + time × rate`, so the nebula visibly drifts
// outward over a long simulation.
//
// The central white dwarf is a separate radial emission disc that sits
// inside the inner shell — visible as a bright point when the camera is
// aimed near it.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_coreColor;       // central white dwarf (Doc 18 #FFFFFF)
uniform vec3  u_innerColor;      // OIII cyan     (Doc 18 #00FFFF)
uniform vec3  u_middleColor;     // NII orange    (Doc 18 #FF8000)
uniform vec3  u_outerColor;      // Hα red        (Doc 18 #FF3333)

// ---- shell geometry -------------------------------------------------------
uniform float u_shellInner;
uniform float u_shellMiddle;
uniform float u_shellOuter;
uniform float u_shellThickness;
uniform float u_bipolarRatio;
uniform float u_coreRadius;
uniform float u_coreIntensity;
uniform float u_expansionRate;
uniform float u_time;
// Irregularity — 0 clean concentric shells (ENT-5020 Ring / Owl),
// 0.6+ asymmetric cometary-knot ejecta (ENT-5022 Skull / Helix).
uniform float u_irregularity;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef NEBULA_STEPS
  #define NEBULA_STEPS 72
#endif

const vec3 BIPOLAR_AXIS = vec3(0.0, 1.0, 0.0);

vec3 sampleShellEmission(vec3 p) {
  float r = length(p);
  // Apply slow expansion by shrinking the sample radius (equivalent to
  // growing the shells).
  float expansion = 1.0 + u_time * u_expansionRate;
  float rEff = r / expansion;

  // Irregular-PN warping — perturb the effective radius per-direction so
  // the shells gain lumpy cometary-knot structure (ENT-5022 Skull Nebula /
  // Helix inner cometary knots). When `u_irregularity = 0` this collapses
  // to the clean concentric shell path (ENT-5020 Ring / Owl).
  if (u_irregularity > 0.001) {
    float warp = cosmos_fbm(p * 2.5, 4) - 0.5;
    rEff *= 1.0 + u_irregularity * warp * 0.45;
  }

  float innerShell  = cosmos_shellBrightness(rEff, u_shellInner,  u_shellThickness);
  float middleShell = cosmos_shellBrightness(rEff, u_shellMiddle, u_shellThickness);
  float outerShell  = cosmos_shellBrightness(rEff, u_shellOuter,  u_shellThickness);

  // Filamentary modulation — lightly break each shell into Rayleigh-
  // Taylor-like streaks so the planetary doesn't read as a perfect ring.
  float streak = 0.7 + 0.3 * cosmos_fbm(p * 6.0, 3);

  // Bipolar mask (1 = polar lobe, < 1 = equator). Collapses to isotropic
  // when u_bipolarRatio == 0.
  float bipolar = cosmos_bipolarMask(p, BIPOLAR_AXIS, u_bipolarRatio);

  vec3 color = u_innerColor  * innerShell  * 1.1
             + u_middleColor * middleShell * 1.0
             + u_outerColor  * outerShell  * 0.85;

  // Central white-dwarf glow — super-tight gaussian near the origin.
  float core = exp(-pow(r / max(u_coreRadius, 1e-4), 2.0)) * u_coreIntensity;
  color += u_coreColor * core;

  return color * streak * bipolar;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(NEBULA_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < NEBULA_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    vec3 emission = sampleShellEmission(p);
    float intensity = max(max(emission.r, emission.g), emission.b);
    float sampleAlpha = clamp(intensity, 0.0, 1.0) * stepSize * 0.8;
    if (intensity > 0.005) {
      accumColor += (1.0 - accumAlpha) * emission * stepSize;
      accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
      if (accumAlpha >= 0.99) break;
    }
    t += stepSize;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
