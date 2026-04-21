// Cosmos Explorer — extreme-geology-moon fragment shader (T43).
// Doc 17 §3018..3020 + Doc 18 §Moon Types.
//
//   MOON_TRITON    ENT-3018  retrograde captured KBO — cantaloupe hex ridges,
//                            nitrogen geysers, tholins, bright N₂ ice.
//   MOON_MIRANDA   ENT-3019  Verona Rupes 20 km cliff, coronae race-tracks,
//                            chaotic mixed old+young terrain.
//   MOON_HYPERION  ENT-3020  sponge-like porous body, deep cavities,
//                            chaotic rotation (simulated via higher u_time rate).

#include "lib/noise.glsl"
#include "lib/lighting.glsl"
#include "lib/moon-common.glsl"

out vec4 fragColor;

// Triton cantaloupe — hex-ish Voronoi via modified distance metric.
// We approximate by mixing two Voronoi fields at different scales + phase.
#ifdef MOON_TRITON
vec3 surfaceTriton(vec3 n) {
  vec2 cellsA = cosmos_voronoi(n * 5.0);
  vec2 cellsB = cosmos_voronoi(n * 5.0 + vec3(1.5, 0.0, 2.2));
  float ridgeA = smoothstep(0.12, 0.0, cellsA.x);
  float ridgeB = smoothstep(0.12, 0.0, cellsB.x);
  float ridge = max(ridgeA, ridgeB) * u_terrainRoughness;

  vec3 base = mix(u_baseColor, u_highlightColor, ridge * 0.5);
  // Tholin reddish-brown patches — UV-processed organics near equator.
  float tholinField = cosmos_fbm(n * 3.5, 4);
  float tholin = smoothstep(0.55, 0.75, tholinField) * u_tholinAmount;
  base = mix(base, u_shadowColor, tholin);
  // Polar N₂ cap — purest white.
  float latAbs = abs(moon_latDeg(n));
  float cap = smoothstep(u_polarCapExtent - 4.0, u_polarCapExtent, latAbs);
  base = mix(base, u_poleColor, cap);
  return base;
}
#endif

// Miranda — Verona Rupes cliff + coronae race-tracks + mixed old/young terrain.
#ifdef MOON_MIRANDA
vec3 surfaceMiranda(vec3 n) {
  // Base icy-rocky terrain.
  float terrainField = cosmos_fbm(n * 4.0, 5);
  vec3 base = mix(u_shadowColor, u_baseColor, terrainField);

  // Verona Rupes-like cliff — a sharp discontinuity along a great circle.
  // Use a normal/plane dot product to detect the cliff face.
  vec3 cliffPlane = normalize(vec3(0.5, 0.3, 0.8));
  float cliffDist = dot(n, cliffPlane);
  float cliffBand = smoothstep(0.0, 0.02, abs(cliffDist - 0.15));
  float cliffFace = 1.0 - cliffBand;                    // 1 at cliff edge
  base = mix(base, u_highlightColor, cliffFace * 0.6);
  // Shadow on the far side of the cliff.
  float cliffShadow = smoothstep(0.15, 0.0, cliffDist - 0.15) * 0.5;
  base = mix(base, u_shadowColor, cliffShadow);

  // Coronae — concentric race-track ridges at two centres.
  float coronaA = abs(sin(length(n - vec3(-0.4, 0.2, -0.7)) * 20.0));
  float coronaB = abs(sin(length(n - vec3(0.3, -0.6, 0.2)) * 18.0));
  float coronas = smoothstep(0.7, 0.95, max(coronaA, coronaB));
  base = mix(base, u_highlightColor, coronas * 0.3);

  // Craters preserved on older terrain — low intensity overlay.
  base = moon_craterLayer(base, n, 12.0);
  return base;
}
#endif

// Hyperion sponge — huge cavities, low-density porous look.
#ifdef MOON_HYPERION
vec3 surfaceHyperion(vec3 n) {
  // Perturbed normal via fbm → pseudo-pores.
  float porosity = cosmos_fbm(n * 8.0, 5) * u_terrainRoughness;
  vec3 base = mix(u_baseColor, u_shadowColor, porosity * 0.6);
  // Deep-cavity Voronoi — widely spaced, sharp rims.
  vec2 cavities = cosmos_voronoi(n * 4.0);
  float cavityFloor = smoothstep(0.35, 0.15, cavities.x)
                    * step(0.7, cavities.y);
  base = mix(base, u_shadowColor, cavityFloor * 0.8);
  // Cavity rim highlight — bright boulder material.
  float cavityRim = smoothstep(0.08, 0.02, abs(cavities.x - 0.15))
                  * step(0.7, cavities.y);
  base = mix(base, u_highlightColor, cavityRim * 0.3);
  // Fine boulder-dust noise.
  float dust = cosmos_fbm(n * 30.0, 3);
  return base * (0.8 + 0.4 * dust);
}
#endif

void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);
  vec3 nW = normalize(v_normalW);
  vec3 v  = normalize(v_viewDirW);
  vec3 s  = normalize(u_sunDir);

  vec3 surface;
  float plumeActivity = 0.0;
  #if defined(MOON_TRITON)
    surface = surfaceTriton(n);
    plumeActivity = moon_plumeMask(n, 0.6);             // mostly southern
  #elif defined(MOON_MIRANDA)
    surface = surfaceMiranda(n);
  #elif defined(MOON_HYPERION)
    surface = surfaceHyperion(n);
  #else
    surface = u_baseColor;
  #endif

  // Lighting.
  float sunFacing = dot(nW, s);
  float lit = cosmos_diffuse(nW, s, u_ambientFloor);
  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  vec3 rim = cosmos_rimGlow(nW, v, s, u_atmosphereTint, u_atmosphereStrength);

  vec3 colorLit = surface * lit;

  // Specular on nitrogen ice.
  if (u_specularStrength > 0.0) {
    vec3 h = normalize(s + v);
    float spec = pow(max(0.0, dot(nW, h)), 48.0);
    colorLit += vec3(1.0) * spec * u_specularStrength * max(0.0, sunFacing);
  }

  // Nitrogen geyser halo for Triton.
  #ifdef MOON_TRITON
    float fresnel = pow(1.0 - max(0.0, dot(nW, v)), 2.5);
    colorLit += u_emissiveColor * plumeActivity * fresnel * 0.5;
  #endif

  colorLit += rim;
  colorLit *= limb;

  fragColor = vec4(colorLit, 1.0);
}
