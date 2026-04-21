// Cosmos Explorer — dark-family shader (T48.1).
//
// Two variants: Dark Matter Halo (ENT-8018, NFW profile volumetric) and
// Dark Energy Void (ENT-8019, inverse density + Hubble-flow streaks).
// Doc 17 §8018/§8019 + Doc 18 §Exotic Objects (T48.0) §Dark.
//
//   DARK_HALO  — NFW profile ρ = ρ_s / (x(1+x)²) → warm inside, cold outside.
//   DARK_VOID  — smoothstep density rise → bluer toward horizon.
//
// CLAUDE.md Rule #1: fully procedural.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

uniform vec3  u_highColor;
uniform vec3  u_midColor;
uniform vec3  u_lowColor;
uniform vec3  u_contourColor;

uniform float u_scaleRadius;
uniform float u_extentRadius;
uniform float u_densityScale;
uniform float u_isoLevel;
uniform float u_isoIntensity;
uniform float u_flowRate;
uniform float u_alphaScale;
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

// Sample the per-kind density at p (0..1-normalised).
float densityField(vec3 p) {
  float r = length(p);
  if (r > u_extentRadius) return 0.0;
  #if defined(EXOTIC_DARK_VOID)
    // Void: low density interior, rising toward horizon.
    float d = smoothstep(0.0, u_scaleRadius, r);
    return d * u_densityScale;
  #else
    // NFW halo: ρ(x) = 1 / (x(1+x)²), normalised.
    float x = r / max(u_scaleRadius, 1e-4);
    float rho = 1.0 / (max(x, 1e-4) * pow(1.0 + x, 2.0));
    return clamp(rho, 0.0, 3.0) * u_densityScale * 0.35;
  #endif
}

vec3 densityColor(float d) {
  // Map density [0..1] through low → mid → high.
  float t = clamp(d, 0.0, 1.0);
  vec3 lowMid = mix(u_lowColor, u_midColor, smoothstep(0.0, 0.5, t));
  return mix(lowMid, u_highColor, smoothstep(0.5, 1.0, t));
}

#if defined(EXOTIC_DARK_VOID)
// Hubble-flow streaks — sparse radial advection.
vec3 hubbleFlow(vec3 p) {
  vec3 advected = p - normalize(p + 1e-6) * u_time * u_flowRate;
  float n = cosmos_fbm(advected * 3.0, 3);
  float r = length(p);
  float mask = smoothstep(u_extentRadius * 0.3, u_extentRadius, r);
  return u_contourColor * mask * pow(n, 3.0) * 0.35;
}
#endif

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

    float density = densityField(p);
    vec3 emission = densityColor(density) * density;

    // Isocontour highlight (thin ring around the chosen density level).
    float isoDist = abs(density - u_isoLevel);
    float iso = exp(-pow(isoDist / 0.05, 2.0));
    emission += u_contourColor * iso * u_isoIntensity * 0.15;

    #if defined(EXOTIC_DARK_VOID)
      emission += hubbleFlow(p);
    #endif

    float sampleAlpha = clamp(density, 0.0, 1.0) * stepSize * u_alphaScale;
    accumColor += (1.0 - accumAlpha) * emission * stepSize;
    accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
    if (accumAlpha >= 0.99) break;
    t += stepSize;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
