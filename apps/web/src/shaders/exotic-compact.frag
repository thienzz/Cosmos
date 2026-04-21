// Cosmos Explorer — compact-family exotic shader (T48.1).
//
// Five Doc 17 variants sharing one raymarch: Quark (ENT-8010), Strange
// (ENT-8011), Preon (ENT-8012), Boson (ENT-8013), Gravastar (ENT-8014).
// Doc 18 §Exotic Objects (T48.0) defines uniform list + variant rule. Each
// kind is compact-star-sized with a distinct surface/interior palette; the
// `#define EXOTIC_COMPACT_*` switch picks the feature mix.
//
//   QUARK       — FBM ripple surface + red-orange interior + subtle shimmer.
//   STRANGE     — crystalline facets + cyan→blue flavour gradient.
//   PREON       — tiny fuzzy quantum point + virtual-pair sparkle.
//   BOSON       — almost invisible field + contour outline + slow breathing.
//   GRAVASTAR   — thin de Sitter shell + photon-sphere highlight.
//
// CLAUDE.md Rule #1: fully procedural; no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_surfaceColor;
uniform vec3  u_interiorColor;
uniform vec3  u_accentColor;

// ---- geometry + animation -------------------------------------------------
uniform float u_surfaceRadius;
uniform float u_surfaceFbmScale;
uniform float u_surfaceAmplitude;
uniform float u_interiorIntensity;
uniform float u_accentIntensity;
uniform float u_shimmerRate;
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

// --- variant-gated surface emission ----------------------------------------

vec3 compactSurface(vec3 p, float r) {
  #if defined(EXOTIC_COMPACT_PREON)
    // Quantum fuzz — radius wobbles with Planck-scale uncertainty.
    float wobble = u_surfaceRadius * (1.0 + 0.1 * sin(u_time * u_shimmerRate + r * 60.0));
    float band = exp(-pow((r - wobble) / max(u_surfaceRadius * 0.6, 1e-4), 2.0));
    float fuzz = cosmos_fbm(p * u_surfaceFbmScale + u_time * 4.0, 3);
    return u_surfaceColor * band * (0.4 + u_surfaceAmplitude * fuzz);
  #elif defined(EXOTIC_COMPACT_BOSON)
    // Near-invisible: thin contour ring at the "edge" + very faint interior.
    float edge = exp(-pow((r - u_surfaceRadius) / 0.03, 2.0));
    float breathe = 1.0 + 0.03 * sin(u_time * u_shimmerRate);
    return u_surfaceColor * edge * 0.08 * breathe;
  #elif defined(EXOTIC_COMPACT_GRAVASTAR)
    // Thin shell at u_surfaceRadius.
    float shell = cosmos_shellBrightness(r, u_surfaceRadius, 0.012);
    return u_surfaceColor * shell * 0.75;
  #else
    // Quark / Strange: opaque surface band with fbm detail.
    float band = exp(-pow((r - u_surfaceRadius) / max(u_surfaceRadius * 0.30, 1e-4), 2.0));
    if (band < 1e-3) return vec3(0.0);
    float detail = cosmos_fbm(p * u_surfaceFbmScale, 4);
    float shimmer = 0.5 + 0.5 * sin(u_time * u_shimmerRate + detail * 6.28);
    float brightness = 1.0 + (detail - 0.5) * u_surfaceAmplitude + shimmer * 0.04;
    return u_surfaceColor * band * brightness * 0.85;
  #endif
}

// --- variant-gated interior emission ---------------------------------------

vec3 compactInterior(vec3 p, float r) {
  #if defined(EXOTIC_COMPACT_BOSON)
    // Very faint semi-transparent envelope, domed Gaussian.
    float env = exp(-pow(r / u_surfaceRadius, 2.0));
    return u_interiorColor * env * u_interiorIntensity;
  #elif defined(EXOTIC_COMPACT_GRAVASTAR)
    // de Sitter glow — soft interior fill.
    if (r > u_surfaceRadius) return vec3(0.0);
    float fill = 1.0 - smoothstep(0.0, u_surfaceRadius, r);
    return u_interiorColor * fill * u_interiorIntensity;
  #else
    // Compact: hot-core radial falloff through the surface.
    float glow = exp(-r * 5.0);
    return u_interiorColor * glow * u_interiorIntensity;
  #endif
}

// --- variant-gated accent emission -----------------------------------------

vec3 compactAccent(vec3 p, float r) {
  #if defined(EXOTIC_COMPACT_STRANGE)
    // Flavour-asymmetry ribbon: large-scale low-freq noise tint sitting on
    // top of the surface.
    float band = exp(-pow((r - u_surfaceRadius) / 0.05, 2.0));
    float lf = cosmos_valueNoise(p * 1.4 + vec3(0.0, u_time * 0.05, 0.0));
    return u_accentColor * band * lf * u_accentIntensity;
  #elif defined(EXOTIC_COMPACT_PREON)
    // Virtual particle pairs: sparse stochastic sparkles just outside core.
    if (r > u_surfaceRadius * 3.0) return vec3(0.0);
    vec3 cell = floor(p * 14.0);
    float hash = cosmos_hash31(cell);
    if (hash < 0.88) return vec3(0.0);
    float pulse = 0.5 + 0.5 * sin((u_time + hash * 7.0) * 8.0);
    return u_accentColor * pulse * u_accentIntensity * 0.6;
  #elif defined(EXOTIC_COMPACT_BOSON)
    // Second contour outline, slightly larger — hints at dark-matter halo.
    float ring = exp(-pow((r - (u_surfaceRadius + 0.06)) / 0.02, 2.0));
    return u_accentColor * ring * u_accentIntensity * 0.6;
  #elif defined(EXOTIC_COMPACT_GRAVASTAR)
    // Photon-sphere highlight at r = 1.5 × shell (exterior).
    float ring = exp(-pow((r - u_surfaceRadius * 1.5) / 0.02, 2.0));
    float pulse = 0.8 + 0.2 * sin(u_time * u_shimmerRate * 0.6);
    return u_accentColor * ring * u_accentIntensity * pulse;
  #else
    // Quark: cooling neutrino burst — rare faint blue pulse.
    float pulse = 0.5 + 0.5 * sin(u_time * u_shimmerRate * 0.2);
    pulse = smoothstep(0.85, 1.0, pulse);
    float band = exp(-pow((r - u_surfaceRadius * 1.4) / 0.1, 2.0));
    return u_accentColor * band * pulse * u_accentIntensity;
  #endif
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
      compactSurface(p, r)
      + compactInterior(p, r)
      + compactAccent(p, r);
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
