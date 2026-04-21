// Cosmos Explorer — dark nebula / molecular cloud fragment shader.
//
// Doc 18 §Dark Nebula — extinction-dominated silhouette. The nebula emits
// almost no light; instead its job is to BLOCK background starfield light
// and slightly redden what leaks through. Since we don't have direct
// access to the framebuffer beneath us in a single-pass GLSL3 fragment,
// we emulate the effect by emitting a small warm-dust self-glow with a
// large alpha so the blending operator darkens whatever is behind.
//
// Blending: `{srcRGB=ONE, srcA=ONE, dstRGB=ONE_MINUS_SRC_ALPHA,
// dstA=ONE_MINUS_SRC_ALPHA}` — output RGB replaces the background when
// alpha = 1, and passes through the background when alpha = 0. This
// matches NebulaMaterial's default blend setup and gives Doc 18's
// "subtract stars behind" behaviour using a standard single-pass blend.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_reddeningTint;   // warm tint of any light leaking through
uniform vec3  u_dustColor;       // very dim warm brown self-glow

// ---- volumetric parameters ------------------------------------------------
uniform float u_fbmScale;
uniform float u_extinction;
uniform float u_reddeningStrength;
// Core sharpness — low values produce the diffuse Coalsack molecular-cloud
// silhouette (Doc 17 ENT-5040); high values produce the Bok-globule
// compact opaque core (Doc 17 ENT-5041 "Barnard 68 core"), `coreSharpness`
// exponent applied to the radial falloff.
uniform float u_coreSharpness;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef NEBULA_STEPS
  #define NEBULA_STEPS 40
#endif

float sampleExtinction(vec3 p) {
  vec3 q = p * u_fbmScale;
  // Sharper contrast than emission nebulae — dark clouds have steep
  // optical-depth gradients (Doc 22 ENT-5040 §Primary Extinction Cloud).
  float raw = cosmos_warpedFbm(q, 5);
  // Remap so low-density regions drop to zero (the nebula's outer halo
  // becomes transparent) and dense regions saturate quickly.
  float shaped = smoothstep(0.35, 0.75, raw);
  // `coreSharpness` blends a diffuse molecular-cloud halo with a tight Bok
  // globule core. Defaults to 1.1 (Coalsack-like); Bok globules push to
  // ~2.6 so the silhouette collapses to a small nearly-opaque sphere.
  float envelope = cosmos_radialFalloff(p, 1.0, max(u_coreSharpness, 0.1));
  return clamp(shaped * envelope, 0.0, 1.0);
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(NEBULA_STEPS);
  float tau = 0.0;   // integrated optical depth along the ray
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < NEBULA_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;
    tau += sampleExtinction(p) * stepSize;
    if (tau * u_extinction >= 6.0) break;   // fully opaque, stop marching
    t += stepSize;
  }

  // Extinction ∈ [0, 1] — 1 = completely blocked (Bok globule core).
  float extinction = 1.0 - exp(-tau * u_extinction);

  // Reddening tint: the tiny light that does leak through is biased toward
  // the warm end of the spectrum (Doc 18 §Dark Nebula reddening). We
  // modulate the self-glow so the core reads neutral-black and the halo
  // reads warmish-brown. The `0.35` coefficient is tuned so the gallery
  // preview (no starfield behind) still reads as a dust silhouette rather
  // than a flat-black billboard.
  float reddened = mix(1.0, u_reddeningStrength, extinction);
  vec3 dustTint = mix(u_reddeningTint, u_dustColor, extinction) * 0.35 * reddened;

  // Output: dustTint as the "replace" colour, extinction as alpha. With
  // standard pre-multiplied blending the background is reduced by (1 −
  // extinction) so the net effect is exactly the Doc 18 subtraction.
  fragColor = vec4(dustTint * extinction, extinction);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
