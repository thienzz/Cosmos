// Cosmos Explorer — Primordial Black Hole shader (T48.1, ENT-8022).
//
// Doc 17 §ENT-8022 + Doc 18 §Exotic Objects (T48.0) §Primordial.
//
// Small black event-horizon sphere surrounded by a Hawking-radiation thermal
// glow. Colour of the glow is picked from `u_hawkingColor` (the CPU selects
// the tint based on `u_temperatureIndex` or the scene's effective
// temperature). A thin photon ring at 1.5 × horizon provides a visual
// reference. No accretion disk (isolated by default).
//
// CLAUDE.md Rule #1: fully procedural.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

uniform vec3  u_horizonColor;
uniform vec3  u_hawkingColor;
uniform vec3  u_photonRingColor;

uniform float u_horizonRadius;
uniform float u_hawkingGlowRadius;
uniform float u_hawkingIntensity;
uniform float u_photonRingRadius;
uniform float u_photonRingThickness;
uniform float u_temperatureIndex;
uniform float u_evaporationRate;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef EXOTIC_STEPS
  #define EXOTIC_STEPS 40
#endif

vec3 hawkingEmission(vec3 p, float r) {
  if (r < u_horizonRadius) return vec3(0.0);
  // Thermal glow: exponential falloff from horizon.
  float d = (r - u_horizonRadius) / max(u_hawkingGlowRadius, 1e-4);
  float glow = exp(-d * 3.0);
  // Flicker from stochastic particle production.
  float jitter = cosmos_fbm(p * 8.0 + u_time * u_evaporationRate, 3);
  float flick = 0.6 + 0.4 * jitter;
  float tempBoost = 0.5 + 1.2 * u_temperatureIndex;
  return u_hawkingColor * glow * flick * u_hawkingIntensity * tempBoost;
}

vec3 photonRing(vec3 p, float r) {
  float d = abs(r - u_photonRingRadius);
  float ring = exp(-pow(d / max(u_photonRingThickness, 1e-4), 2.0));
  // Equatorial weighting so the ring reads flat.
  float equator = exp(-pow(p.y * 4.0, 2.0));
  return u_photonRingColor * ring * equator * 1.6;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(EXOTIC_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;
  bool hitHorizon = false;

  for (int i = 0; i < EXOTIC_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;
    float r = length(p);

    if (r < u_horizonRadius) {
      // Event horizon — absolute shadow. Stop accumulating.
      hitHorizon = true;
      break;
    }

    vec3 emission = hawkingEmission(p, r) + photonRing(p, r);
    float intensity = max(max(emission.r, emission.g), emission.b);
    if (intensity > 0.003) {
      float sampleAlpha = clamp(intensity, 0.0, 1.0) * stepSize * 0.8;
      accumColor += (1.0 - accumAlpha) * emission * stepSize;
      accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
      if (accumAlpha >= 0.99) break;
    }
    t += stepSize;
  }

  if (hitHorizon) {
    // Blend in a solid horizon shadow behind anything already accumulated.
    accumColor += (1.0 - accumAlpha) * u_horizonColor;
    accumAlpha = 1.0;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
