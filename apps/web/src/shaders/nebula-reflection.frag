// Cosmos Explorer — reflection nebula fragment shader.
//
// Doc 18 §Reflection Nebula — dust scattering starlight, blue-dominant from
// the Rayleigh λ⁻⁴ preference. We approximate the single-scattering solution
// with a Henyey-Greenstein phase function biased forward (dust grains are
// forward-scatter peaked) and a low-density fbm envelope so the silhouette
// looks filamentary.
//
// Illumination comes from a single embedded / offset star whose direction
// is passed in local space via `u_starDirLocal`. No raymarch-from-light
// is performed — that would cost a second march per sample. The dust
// attenuates scattered light by the local density instead, which matches
// the visual intuition without the square-cost.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_scatterColor;   // Rayleigh blue (Doc 18 #6495ED)
uniform vec3  u_starColor;      // Illuminating star tint (Doc 18 #DDEEFF)

// ---- volumetric parameters ------------------------------------------------
uniform vec3  u_starDirLocal;   // direction FROM nebula TO star, local space
uniform float u_fbmScale;
uniform float u_density;
uniform float u_forwardScatter; // Henyey-Greenstein g
uniform float u_falloff;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef NEBULA_STEPS
  #define NEBULA_STEPS 48
#endif

float sampleDustDensity(vec3 p) {
  vec3 q = p * u_fbmScale;
  // Directional bias so the dust has filament grain along a preferred
  // axis (Doc 22 ENT-5020 §Dust Grain Aligned Structure).
  q += 0.4 * vec3(p.y, p.z, p.x);
  float warp = cosmos_warpedFbm(q, 4);
  float envelope = cosmos_radialFalloff(p, 1.0, u_falloff);
  return clamp(warp * envelope, 0.0, 1.0);
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  // Scattering angle: viewer looks along rayDir; light travels TO the
  // viewer from the nebula. cosTheta between view and light direction.
  vec3 lightDir = normalize(u_starDirLocal);
  float cosTheta = dot(-rayDir, lightDir);
  float phase = cosmos_henyeyGreenstein(cosTheta, u_forwardScatter);

  float stepSize = (tFar - tNear) / float(NEBULA_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < NEBULA_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    float dust = sampleDustDensity(p);
    if (dust > 0.01) {
      // Brighter toward the illuminating star — simulates the crescent
      // illumination pattern typical of offset-star reflection nebulae.
      float starProximity = 0.5 + 0.5 * dot(normalize(p), lightDir);
      // Floor the phase contribution so back-lit angles still return a
      // visible blue glow — the gallery preview has no external backdrop
      // so a pure forward-peaked response would read as near-black.
      float phaseFloor = max(phase, 0.35);
      vec3 localColor = u_scatterColor * phaseFloor * 1.8
                     + u_starColor * 0.25 * starProximity;
      float sampleAlpha = dust * u_density * stepSize * 1.4;
      accumColor += (1.0 - accumAlpha) * localColor * sampleAlpha;
      accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
      if (accumAlpha >= 0.98) break;
    }
    t += stepSize;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
