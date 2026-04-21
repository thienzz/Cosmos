// Cosmos Explorer — extreme-planet fragment shader (Doc 18 §Exotic Planet
// Types + Doc 17 §ENT-2033, 2034, 2043, 2047).
//
// These four variants share non-standard surface geometry that warrants a
// dedicated shader rather than shoehorning into rocky-planet.frag:
//
//   EXTREME_HYCEAN          ENT-2033  H₂ atmosphere over global ocean;
//                                     extended haze scale-height, no land.
//   EXTREME_EYEBALL         ENT-2034  Tidally-locked terrestrial with
//                                     substellar-facing "pupil" and frozen
//                                     nightside antipode. Terminator ring.
//   EXTREME_TIDALLY_HEATED  ENT-2043  Io-type, volcanic hotspots + sulfur
//                                     colour zones + plume rim. Crosses
//                                     rocky territory but the plume geometry
//                                     lives here.
//   EXTREME_SYNESTIA        ENT-2047  Post-giant-impact rotating debris
//                                     torus. Not a sphere in strict geometry
//                                     sense — we cheat with a heavily-tinted
//                                     oblate sphere + radial dust falloff.
//
// CLAUDE.md Rule #1: fully procedural. No textures.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"

uniform vec3  u_baseColor;
uniform vec3  u_highlightColor;
uniform vec3  u_shadowColor;
uniform vec3  u_poleColor;
uniform vec3  u_atmosphereTint;
uniform vec3  u_hotspotColor;       // lava / substellar / plume tint
uniform float u_atmosphereStrength;
uniform float u_hazeDensity;        // Hycean thick H₂ haze
uniform float u_emissiveStrength;
uniform float u_terminatorWidthDeg; // Eyeball ring width
uniform float u_plumeIntensity;     // Io plume glow
uniform float u_ringDustDensity;    // Synestia outer dust density
uniform float u_limbDarkening;
uniform float u_ambientFloor;
uniform float u_time;
uniform vec3  u_sunDir;

in vec3 v_modelPos;
in vec3 v_surfaceNormal;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

float latDeg(vec3 n) {
  return degrees(asin(clamp(n.y, -1.0, 1.0)));
}

// ---------------------------------------------------------------------------
// Hycean — extended H₂ atmosphere over a water ocean. Surface shader: wave
// ripples; atmosphere: thick haze blend.
// ---------------------------------------------------------------------------
#ifdef EXTREME_HYCEAN
vec3 surfaceHycean(vec3 n) {
  vec3 p = n * 5.0 + vec3(u_time * 0.01, 0.0, 0.0);
  float waves = cosmos_fbm(p, 6);
  vec3 deep = u_shadowColor;
  vec3 shallow = u_baseColor;
  return mix(deep, shallow, smoothstep(0.35, 0.65, waves));
}
#endif

// ---------------------------------------------------------------------------
// Eyeball — uses the sunFacing dot directly to classify pixels into hot
// substellar day (pupil), cold frozen antipode, and habitable terminator ring.
// ---------------------------------------------------------------------------
#ifdef EXTREME_EYEBALL
vec3 surfaceEyeball(vec3 nW, vec3 sunDir) {
  float sunFacing = dot(nW, sunDir);                 // +1 = substellar
  // Terminator ring — bright habitable band at sunFacing ≈ 0.
  float ringRad = radians(u_terminatorWidthDeg);
  float ring = exp(-pow(sunFacing / max(ringRad, 0.05), 2.0));
  vec3 pupil = u_highlightColor;                     // hot substellar (reds)
  vec3 night = u_poleColor;                          // frozen ice antipode
  float dayMix = smoothstep(-0.1, 0.3, sunFacing);
  vec3 base = mix(night, pupil, dayMix);
  return mix(base, u_baseColor, ring);
}
#endif

// ---------------------------------------------------------------------------
// Tidally heated (Io) — sulfur base with hotspot Voronoi cells + plume arcs.
// ---------------------------------------------------------------------------
#ifdef EXTREME_TIDALLY_HEATED
vec3 surfaceIo(vec3 n, out float emissionMask) {
  float sulfur = cosmos_fbm(n * 4.0, 5);
  vec3 yellow = u_baseColor;
  vec3 orange = u_highlightColor;
  vec3 red    = u_shadowColor;
  vec3 color = mix(yellow, orange, sulfur);
  color = mix(color, red, smoothstep(0.65, 0.85, sulfur) * 0.5);

  vec2 volcanoes = cosmos_voronoi(n * 6.0);
  float vHot = smoothstep(0.08, 0.0, volcanoes.x) * step(0.7, volcanoes.y);
  emissionMask = vHot;
  return mix(color, u_hotspotColor, vHot);
}
#endif

// ---------------------------------------------------------------------------
// Synestia — rotating oblate debris disk. We mark the equatorial band as
// hot/bright and fade polewards. Ring dust wraps outside the sphere but
// since we render a single mesh, we cheat with an equatorial glow.
// ---------------------------------------------------------------------------
#ifdef EXTREME_SYNESTIA
vec3 surfaceSynestia(vec3 n, out float emissionMask) {
  float latAbs = abs(latDeg(n));
  float equator = exp(-pow(latAbs / 25.0, 2.0));     // brightest at equator
  float turbulence = cosmos_warpedFbm(n * 3.0, 5);
  vec3 core = mix(u_baseColor, u_highlightColor, turbulence);
  vec3 color = mix(u_shadowColor, core, equator);
  emissionMask = equator * u_ringDustDensity;
  return color;
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
  float emissionMask = 0.0;

  #if defined(EXTREME_HYCEAN)
    surface = surfaceHycean(n);
  #elif defined(EXTREME_EYEBALL)
    surface = surfaceEyeball(nW, s);
  #elif defined(EXTREME_TIDALLY_HEATED)
    surface = surfaceIo(n, emissionMask);
  #elif defined(EXTREME_SYNESTIA)
    surface = surfaceSynestia(n, emissionMask);
  #else
    surface = u_baseColor;
  #endif

  float lit  = cosmos_diffuse(nW, s, u_ambientFloor);
  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  vec3  rim  = cosmos_rimGlow(nW, v, s, u_atmosphereTint, u_atmosphereStrength);

  vec3 color = surface * lit + rim;

  // Hycean thick haze — blend toward atmospheric tint for an overall soft
  // gas-giant look over the ocean.
  if (u_hazeDensity > 0.0) {
    color = mix(color, u_atmosphereTint * (0.55 + 0.45 * lit), u_hazeDensity * 0.6);
  }

  // Plume / substellar / hotspot emission.
  color += u_hotspotColor * emissionMask * u_emissiveStrength;

  // Plume outer-rim arcs (Io) — modulate rim intensity by plume magnitude.
  #if defined(EXTREME_TIDALLY_HEATED)
    float rimPlume = pow(1.0 - max(0.0, dot(nW, v)), 3.0);
    color += u_hotspotColor * rimPlume * u_plumeIntensity * 0.8;
  #endif

  // Synestia: outer dust halo uses the fresnel rim as dust density proxy.
  #if defined(EXTREME_SYNESTIA)
    float dust = pow(1.0 - max(0.0, dot(nW, v)), 1.5);
    color += u_atmosphereTint * dust * u_ringDustDensity * 1.2;
  #endif

  color *= limb;
  fragColor = vec4(color, 1.0);
}
