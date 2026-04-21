// Cosmos Explorer — supernova remnant fragment shader.
//
// Doc 18 §Supernova Remnant — expanding shock shell with filamentary
// substructure. The shell brightness peaks at `u_shellRadius` (gaussian-
// profiled, broadens with simulated age) and the filaments modulate the
// brightness with a high-octave fbm so the Crab / Cas A / Vela structure
// reads correctly.
//
// Synchrotron blue dominates — relativistic electrons in the amplified
// magnetic field emit non-thermally across the radio→optical spectrum.
// A central compact object (pulsar) adds a soft point glow near the origin
// when `u_pulsarIntensity > 0`.
//
// Expansion applies via `rEff = r / (1 + time × velocity)` so the shell
// drifts outward; at extreme playback speeds this is visually noticeable.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_synchrotronColor; // blue (Doc 18 #6495ED)
uniform vec3  u_filamentColor;    // blue-violet for dense filaments
uniform vec3  u_pulsarColor;      // central neutron-star glow

// ---- shell geometry -------------------------------------------------------
uniform float u_shellRadius;
uniform float u_shellSharpness;
uniform float u_filamentDensity;
uniform float u_synchrotronIntensity;
uniform float u_expansionVelocity;
uniform float u_pulsarIntensity;
uniform float u_time;

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

float filamentNoise(vec3 p) {
  // Higher-octave fbm with a directional bias so filaments look like
  // shock-driven streaks, not isotropic clouds.
  vec3 q = p * 3.5;
  q.y *= 1.4;
  return cosmos_warpedFbm(q, 5);
}

vec3 sampleRemnant(vec3 p) {
  float r = length(p);

  // Expand the sample frame by the shock velocity (equivalent to growing
  // the shell). Clamp denominator so tests at t=0 don't blow up.
  float expansion = 1.0 + u_time * u_expansionVelocity;
  float rEff = r / max(expansion, 1e-4);

  // Gaussian shell profile — brightest exactly at shellRadius.
  float sharpness = max(u_shellSharpness, 0.5);
  float d = (rEff - u_shellRadius) * sharpness;
  float shell = exp(-d * d);

  // Filamentary modulation. Lower base floor so the shell is visibly
  // clumpy rather than a smooth halo.
  float filaments = 0.35 + 0.65 * filamentNoise(p);
  filaments = pow(filaments, 1.8) * u_filamentDensity;

  vec3 synchrotron = u_synchrotronColor * shell * u_synchrotronIntensity;
  vec3 filamentEmission = u_filamentColor * shell * filaments * 0.6;

  // Pulsar — tight core glow inside the shell. Optional (gated on
  // u_pulsarIntensity so ENT-5050 shell remnants can disable it).
  float pulsarProfile = exp(-pow(r * 25.0, 2.0)) * u_pulsarIntensity;

  return synchrotron + filamentEmission + u_pulsarColor * pulsarProfile;
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

    vec3 emission = sampleRemnant(p);
    float intensity = max(max(emission.r, emission.g), emission.b);
    float sampleAlpha = clamp(intensity, 0.0, 1.0) * stepSize * 0.9;
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
