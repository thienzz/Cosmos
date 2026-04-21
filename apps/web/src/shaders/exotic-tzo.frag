// Cosmos Explorer — Thorne-Żytkow Object shader (T48.1, ENT-8021).
//
// Doc 17 §ENT-8021 + Doc 18 §Exotic Objects (T48.0) §TZO.
//
// Red supergiant envelope with embedded neutron-star core. Three nested
// radial zones: (a) envelope sphere with FBM granulation, (b) hot-shell
// heated layer around the neutron star, (c) tiny bright NS nucleus at the
// origin.
//
// CLAUDE.md Rule #1: fully procedural.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

uniform vec3  u_envelopeColor;
uniform vec3  u_hotShellColor;
uniform vec3  u_coreColor;

uniform float u_envelopeRadius;
uniform float u_envelopeFbmScale;
uniform float u_envelopeOpacity;
uniform float u_hotShellRadius;
uniform float u_hotShellIntensity;
uniform float u_coreRadius;
uniform float u_coreIntensity;
uniform float u_rotationRate;
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
  // Slow-rotating granulation sampling.
  float a = u_time * u_rotationRate;
  mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 xz = R * p.xz;
  vec3 q = vec3(xz.x, p.y, xz.y);
  float granule = cosmos_fbm(q * u_envelopeFbmScale, 4);
  float density = (0.55 + 0.45 * granule) * (1.0 - smoothstep(u_envelopeRadius * 0.7, u_envelopeRadius, r));
  return u_envelopeColor * density * u_envelopeOpacity;
}

vec3 hotShellEmission(vec3 p, float r) {
  float band = exp(-pow((r - u_hotShellRadius) / max(u_hotShellRadius * 0.6, 1e-4), 2.0));
  float detail = 0.6 + 0.4 * cosmos_fbm(p * 4.0 + u_time * 0.2, 3);
  return u_hotShellColor * band * detail * u_hotShellIntensity;
}

vec3 coreEmission(vec3 p, float r) {
  float g = exp(-pow(r / max(u_coreRadius, 1e-4), 2.0));
  float pulse = 1.0 + 0.08 * sin(u_time * 3.2);
  return u_coreColor * g * u_coreIntensity * pulse;
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
      + hotShellEmission(p, r)
      + coreEmission(p, r);
    float intensity = max(max(emission.r, emission.g), emission.b);
    if (intensity > 0.003) {
      float sampleAlpha = clamp(intensity, 0.0, 1.0) * stepSize * 0.8;
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
