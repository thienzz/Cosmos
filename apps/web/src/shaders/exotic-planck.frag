// Cosmos Explorer — Planck Star shader (T48.1, ENT-8024).
//
// Doc 17 §ENT-8024 + Doc 18 §Exotic Objects (T48.0) §Quantum.
//
// Extremely small core with time-cycled rainbow colour + quantum-fuzz
// shimmer halo. The `u_bouncePhase` uniform optionally drives an expanding
// bright shell (cosmological-bounce signature); phase 0 disables.
//
// CLAUDE.md Rule #1: fully procedural.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

uniform vec3  u_coreColorA;
uniform vec3  u_coreColorB;
uniform vec3  u_coreColorC;
uniform vec3  u_shimmerColor;

uniform float u_coreRadius;
uniform float u_coreIntensity;
uniform float u_hueSpeed;
uniform float u_shimmerScale;
uniform float u_shimmerIntensity;
uniform float u_bouncePhase;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef EXOTIC_STEPS
  #define EXOTIC_STEPS 36
#endif

vec3 rainbowCore(float r) {
  // Three-way sinusoidal blend between the palette entries.
  float a = 0.33 + 0.33 * sin(u_time * u_hueSpeed);
  float b = 0.33 + 0.33 * sin(u_time * u_hueSpeed + 2.094);  // 120°
  float c = 0.33 + 0.33 * sin(u_time * u_hueSpeed + 4.188);  // 240°
  vec3 col = u_coreColorA * a + u_coreColorB * b + u_coreColorC * c;
  float g = exp(-pow(r / max(u_coreRadius, 1e-4), 2.0));
  return col * g * u_coreIntensity;
}

vec3 quantumShimmer(vec3 p) {
  float n = cosmos_fbm(p * u_shimmerScale + vec3(u_time * 5.0, u_time * 3.3, u_time * 7.1), 3);
  // Flicker: only bright when local noise crosses a threshold.
  float flash = smoothstep(0.65, 0.85, n);
  return u_shimmerColor * flash * u_shimmerIntensity;
}

vec3 bounceRipple(float r) {
  if (u_bouncePhase <= 0.0) return vec3(0.0);
  // Expanding shell: centre at `u_bouncePhase`, width 0.05.
  float d = abs(r - u_bouncePhase);
  float ring = exp(-pow(d / 0.05, 2.0));
  return vec3(1.0, 1.0, 0.88) * ring * 1.5;
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

    vec3 emission = rainbowCore(r) + quantumShimmer(p) + bounceRipple(r);
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
