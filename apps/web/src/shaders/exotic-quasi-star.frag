// Cosmos Explorer — Quasi-Star shader (T48.1, ENT-8023).
//
// Doc 17 §ENT-8023 + Doc 18 §Exotic Objects (T48.0) §Quasi.
//
// Large pale-yellow envelope with embedded supermassive-BH interior glow.
// The interior glow bleeds through a thick convective envelope; a subtle
// polar-boost makes the caps slightly whiter than the equator. A thin wind
// halo at the boundary hints at radiation-pressure-driven mass loss.
//
// CLAUDE.md Rule #1: fully procedural.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

uniform vec3  u_envelopeColor;
uniform vec3  u_interiorColor;
uniform vec3  u_windColor;

uniform float u_envelopeRadius;
uniform float u_envelopeFbmScale;
uniform float u_envelopeOpacity;
uniform float u_interiorIntensity;
uniform float u_interiorFalloff;
uniform float u_windRadius;
uniform float u_windIntensity;
uniform float u_windSpeed;
uniform float u_polarBoost;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef EXOTIC_STEPS
  #define EXOTIC_STEPS 48
#endif

vec3 envelopeEmission(vec3 p, float r) {
  if (r > u_envelopeRadius) return vec3(0.0);
  float granule = cosmos_fbm(p * u_envelopeFbmScale, 4);
  float depth = 1.0 - smoothstep(u_envelopeRadius * 0.65, u_envelopeRadius, r);
  float density = (0.55 + 0.45 * granule) * depth;
  // Polar boost: brighter at the caps.
  float latCos = abs(p.y / max(r, 1e-4));
  float boost = 1.0 + u_polarBoost * latCos;
  return u_envelopeColor * density * u_envelopeOpacity * boost;
}

vec3 interiorGlow(vec3 p, float r) {
  float glow = exp(-r * u_interiorFalloff);
  float ripple = 0.6 + 0.4 * cosmos_fbm(p * 4.0 + u_time * 0.3, 3);
  return u_interiorColor * glow * ripple * u_interiorIntensity;
}

vec3 windEmission(vec3 p, float r) {
  if (r < u_envelopeRadius * 0.95) return vec3(0.0);
  vec3 advected = p - normalize(p + 1e-6) * u_time * u_windSpeed;
  float n = cosmos_fbm(advected * 2.5, 3);
  float mask = smoothstep(u_envelopeRadius, u_windRadius, r);
  return u_windColor * n * mask * u_windIntensity;
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

  for (int i = 0; i < EXOTIC_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;
    float r = length(p);

    vec3 emission =
      envelopeEmission(p, r)
      + interiorGlow(p, r)
      + windEmission(p, r);
    float intensity = max(max(emission.r, emission.g), emission.b);
    if (intensity > 0.003) {
      float sampleAlpha = clamp(intensity, 0.0, 1.0) * stepSize * 0.75;
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
