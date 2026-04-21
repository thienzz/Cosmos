// Cosmos Explorer — GR-extreme exotic shader (T48.1).
//
// Three Doc 17 variants: White Hole (ENT-8015), Wormhole (ENT-8016), Naked
// Singularity (ENT-8025). Doc 18 §Exotic Objects (T48.0) §GR-extreme.
// Selection via `#define EXOTIC_GR_*`.
//
//   WHITEHOLE        — bright core + time-reversed bipolar jets.
//   WORMHOLE         — dim throat + bright photon ring + interior warping.
//   NAKEDSINGULARITY — magenta speckle + caustic streaks + dim photon ring.
//
// Full screen-space lensing lives in the post pipeline (`BlackHoleLensingPass`).
// These shaders only contribute the local volumetric signature; the post pass
// owns background distortion.
//
// CLAUDE.md Rule #1: fully procedural.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

uniform vec3  u_coreColor;
uniform vec3  u_accentColor;
uniform vec3  u_haloColor;

uniform float u_coreRadius;
uniform float u_coreIntensity;
uniform float u_jetHalfAngle;
uniform float u_jetLength;
uniform float u_jetIntensity;
uniform float u_ringRadius;
uniform float u_ringThickness;
uniform float u_ringIntensity;
uniform float u_flowRate;
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

vec3 coreEmission(vec3 p, float r) {
  #if defined(EXOTIC_GR_NAKEDSINGULARITY)
    // Very sharp point emission — Gaussian with a tight σ.
    float g = exp(-pow(r * 36.0, 2.0));
    return u_coreColor * g * u_coreIntensity;
  #elif defined(EXOTIC_GR_WORMHOLE)
    // Darker throat interior — subtractive-ish fill via negative emission
    // would be nonphysical; we simulate by dim interior with radial warp.
    if (r > u_coreRadius) return vec3(0.0);
    float fill = 1.0 - smoothstep(0.0, u_coreRadius, r);
    float warp = cosmos_fbm(p * 4.0 + u_time * u_flowRate, 3);
    return u_coreColor * fill * (0.4 + 0.3 * warp) * u_coreIntensity;
  #else
    // White hole: bright core sphere.
    float band = exp(-pow((r - u_coreRadius * 0.3) / max(u_coreRadius, 1e-4), 2.0));
    float pulse = 1.0 + 0.05 * sin(u_time * 4.0);
    return u_coreColor * band * u_coreIntensity * pulse;
  #endif
}

vec3 jetEmission(vec3 p, float r) {
  #if defined(EXOTIC_GR_WHITEHOLE)
    if (u_jetIntensity <= 0.0) return vec3(0.0);
    float axialAbs = abs(p.y);
    if (axialAbs > u_jetLength) return vec3(0.0);
    float rho = length(p.xz);
    float tan_half = tan(u_jetHalfAngle);
    float coneRadius = max(tan_half * axialAbs, 0.02);
    float coneFill = exp(-pow(rho / coneRadius, 2.0));
    float axial = 1.0 - smoothstep(0.0, u_jetLength, axialAbs);
    // Outward flow visualisation: fbm advected with +y axis ⇒ bright streaks.
    float flow = cosmos_fbm(vec3(p.x * 4.0, p.y * 2.0 - u_time * u_flowRate, p.z * 4.0), 3);
    float s = coneFill * axial * (0.5 + 0.5 * flow);
    vec3 col = mix(u_coreColor, u_accentColor, clamp(axialAbs / u_jetLength, 0.0, 1.0));
    return col * s * u_jetIntensity;
  #else
    return vec3(0.0);
  #endif
}

vec3 ringEmission(vec3 p, float r) {
  if (u_ringIntensity <= 0.0) return vec3(0.0);
  float d = abs(r - u_ringRadius);
  float ring = exp(-pow(d / max(u_ringThickness, 1e-4), 2.0));
  #if defined(EXOTIC_GR_WORMHOLE)
    // Bright light-ring on the equatorial plane: weight toward small |y|.
    float equator = exp(-pow(p.y * 3.0, 2.0));
    ring *= equator;
  #endif
  return u_haloColor * ring * u_ringIntensity;
}

#if defined(EXOTIC_GR_NAKEDSINGULARITY)
// Extreme lensing wake: pseudo-caustic radial streaks.
vec3 causticEmission(vec3 p, float r) {
  if (r < 0.02 || r > 0.7) return vec3(0.0);
  float phi = atan(p.z, p.x);
  float streak = pow(0.5 + 0.5 * cos(phi * 10.0 + u_time * 0.4), 8.0);
  float radial = pow(max(0.0, 1.0 - r * 1.8), 4.0);
  return u_accentColor * streak * radial * 1.2;
}
#endif

#if defined(EXOTIC_GR_WORMHOLE)
// Rim hint reading as "warping" — avoids a screen-space post pass.
vec3 warpRim(vec3 p, float r) {
  float d = abs(r - u_ringRadius);
  float band = exp(-pow(d / 0.08, 2.0));
  float phi = atan(p.z, p.x);
  float twist = 0.5 + 0.5 * sin(phi * 6.0 + u_time * 0.15 + p.y * 4.0);
  return u_accentColor * band * twist * 0.35;
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
    float r = length(p);

    vec3 emission = coreEmission(p, r) + jetEmission(p, r) + ringEmission(p, r);
    #if defined(EXOTIC_GR_NAKEDSINGULARITY)
      emission += causticEmission(p, r);
    #endif
    #if defined(EXOTIC_GR_WORMHOLE)
      emission += warpRim(p, r);
    #endif
    float intensity = max(max(emission.r, emission.g), emission.b);
    if (intensity > 0.003) {
      float sampleAlpha = clamp(intensity, 0.0, 1.0) * stepSize * 0.9;
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
