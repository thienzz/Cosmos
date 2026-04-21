// Cosmos Explorer — rocky-moon fragment shader (T43).
// Doc 17 §3013..3016 + Doc 18 §Standard Rocky Moon.
//
//   MOON_LUNA       ENT-3013  Luna (Earth Moon) — maria + highlands + rays
//   MOON_CALLISTO   ENT-3016  Callisto + Mimas + Tethys + Dione + Rhea + Iapetus
//                             + Umbriel + Oberon. Saturated cratering, dust mantle.
//   MOON_IRREGULAR  ENT-3014  Phobos/Deimos captured body — Stickney rim,
//                             dark low-albedo regolith, groove striations.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"
#include "lib/moon-common.glsl"

out vec4 fragColor;

// Luna (ENT-3013) — Maria basalt plains vs anorthosite highlands vs ray systems.
#ifdef MOON_LUNA
vec3 surfaceLuna(vec3 n) {
  float mareField = cosmos_warpedFbm(n * 1.5, 4);
  float mareMask = smoothstep(0.55, 0.35, mareField);   // inverted → basins
  vec3 base = mix(u_highlightColor, u_shadowColor, mareMask);
  // Crater field — heavier on highlands, sparser on maria (basalt resurface).
  vec3 cratered = moon_craterLayer(base, n, 14.0);
  base = mix(cratered, base, mareMask * 0.6);
  // Regolith roughness dither.
  float dust = cosmos_fbm(n * 60.0, 3);
  base *= 0.9 + 0.2 * dust;
  // Ray-system bright streaks — only for the prominent youngest craters.
  vec2 tychoCr = cosmos_voronoi(n * 4.5);
  if (tychoCr.y > 0.93) {
    float rayDist = length(n - vec3(0.3, -0.7, 0.2));
    float ray = exp(-rayDist * 2.0) * 0.25;
    base += u_highlightColor * ray;
  }
  // Polar PSR tint (permanent-shadow ice hints).
  float latAbs = abs(moon_latDeg(n));
  float psr = smoothstep(u_polarCapExtent - 3.0, u_polarCapExtent, latAbs);
  return mix(base, u_poleColor, psr * 0.3);
}
#endif

// Callisto-type (ENT-3016) — ancient heavily cratered with Valhalla ring.
#ifdef MOON_CALLISTO
vec3 surfaceCallisto(vec3 n) {
  // Two-tone substrate (ice basement + rocky dust).
  float substrate = cosmos_fbm(n * 3.0, 5);
  vec3 base = mix(u_shadowColor, u_baseColor, smoothstep(0.35, 0.7, substrate));
  // Dense crater layer — higher scale + intensity than Luna.
  vec3 cratered = moon_craterLayer(base, n, 18.0);
  cratered = moon_craterLayer(cratered, n, 6.0);   // large basin overlay
  // Valhalla concentric rings — radial sinusoid around a fixed pole.
  float ringDist = length(n - vec3(0.0, 0.5, 0.8));
  float rings = 0.5 + 0.5 * sin(ringDist * 18.0);
  rings *= exp(-ringDist * 0.5);
  cratered = mix(cratered, u_highlightColor, rings * 0.15);
  // Iapetus-style hemisphere darkening — gentler blend so Callisto itself
  // stays uniformly dim.
  float hemi = smoothstep(-0.2, 0.6, n.x);
  cratered = mix(cratered, u_shadowColor, hemi * 0.15);
  return cratered;
}
#endif

// Phobos-type (ENT-3014) — potato shape, dark regolith, Stickney rim.
#ifdef MOON_IRREGULAR
vec3 surfaceIrregular(vec3 n) {
  // Pseudo-shape via normal perturbation (not geometry — CLAUDE.md Rule #4).
  float roughness = cosmos_fbm(n * 10.0, 5) * u_terrainRoughness;
  vec3 base = mix(u_baseColor, u_shadowColor, roughness * 0.5);
  // Stickney-like dominant crater on one face.
  float stickneyDist = length(n - vec3(0.7, 0.0, 0.4));
  float stickneyRim = smoothstep(0.3, 0.2, stickneyDist)
                    * smoothstep(0.15, 0.3, stickneyDist);
  float stickneyFloor = smoothstep(0.25, 0.15, stickneyDist);
  base = mix(base, u_shadowColor, stickneyFloor);
  base += u_highlightColor * stickneyRim * 0.3;
  // Radial grooves from Stickney — aligned striations.
  vec3 toStickney = normalize(n - vec3(0.7, 0.0, 0.4));
  float grooveCoord = dot(n, toStickney) * 20.0;
  float grooves = sin(grooveCoord) * 0.5 + 0.5;
  grooves = smoothstep(0.65, 0.85, grooves);
  base -= grooves * 0.08;
  // Many micro-craters.
  return moon_craterLayer(base, n, 28.0);
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
  #if defined(MOON_LUNA)
    surface = surfaceLuna(n);
  #elif defined(MOON_CALLISTO)
    surface = surfaceCallisto(n);
  #elif defined(MOON_IRREGULAR)
    surface = surfaceIrregular(n);
  #else
    surface = moon_craterLayer(u_baseColor, n, 14.0);
  #endif

  // Lighting.
  float sunFacing = dot(nW, s);
  float lit = cosmos_diffuse(nW, s, u_ambientFloor);
  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  vec3 rim = cosmos_rimGlow(nW, v, s, u_atmosphereTint, u_atmosphereStrength);

  vec3 colorLit = surface * lit;

  // Earthshine-style ambient for Luna only — cool blue tint on the
  // otherwise pitch night side. Never brighter than the direct lit term.
  #ifdef MOON_LUNA
  {
    float night = 1.0 - smoothstep(-0.2, 0.1, sunFacing);
    float latDegL = moon_latDeg(n);
    float latAbsL = abs(latDegL);
    float lonL = atan(n.z, n.x);
    float rimMuL = 1.0 - abs(dot(nW, v));

    // Earthshine gate.
    vec3 earthshine = vec3(0.12, 0.20, 0.30) * night * u_atmosphereStrength * 6.0;
    colorLit += earthshine * u_earthshine;

    // Earthshine tint variant — warmer reddish shift when enabled.
    colorLit += vec3(0.08, 0.03, -0.02) * night * u_earthshineTint;

    // Highlands toggle — brighten anorthosite highlands.
    float hlField = cosmos_warpedFbm(n * 1.5, 4);
    float hlMask = smoothstep(0.35, 0.55, hlField);
    colorLit += vec3(0.10) * hlMask * u_highlands;

    // Maria toggle — darken basalt plains.
    float mareMask = smoothstep(0.55, 0.35, hlField);
    colorLit = mix(colorLit, colorLit * 0.7, mareMask * 0.35 * u_maria);

    // Maria boundary — highlight transition edges.
    float mbEdge = smoothstep(0.42, 0.48, hlField) * (1.0 - smoothstep(0.48, 0.54, hlField));
    colorLit += vec3(0.15) * mbEdge * 0.25 * u_mariaBoundary;

    // Swirls — bright high-albedo patterns.
    float swPhase = sin(lonL * 8.0 + latDegL * 2.0);
    colorLit += vec3(0.85, 0.85, 0.80) * smoothstep(0.85, 0.95, swPhase) * 0.20 * u_swirls;

    // Craters gate — additional contrast.
    vec2 crL = cosmos_voronoi(n * 14.0);
    float crRimL = smoothstep(0.10, 0.0, crL.x);
    colorLit = mix(colorLit, colorLit * 0.75, crRimL * 0.4 * u_craters);

    // Tycho crater — bright rays from southern hemisphere.
    float tychoLat = -43.0 * 0.01745;
    float tychoLon = -0.19;
    float tychoDist = length(vec2(asin(n.y) - tychoLat,
                                  mod(lonL - tychoLon + 3.14159, 6.28318) - 3.14159));
    colorLit += vec3(0.90, 0.85, 0.80) * exp(-tychoDist * 3.0) * 0.35 * u_tychoCrater;

    // Central peaks — bright spots in crater centers.
    float cpMask = smoothstep(0.25, 0.45, crL.x) * (1.0 - crRimL);
    colorLit += vec3(0.12) * cpMask * 0.30 * u_centralPeaks;

    // Ejecta rays — long bright streaks from young craters.
    if (crL.y > 0.92) {
      float ejDist = length(n - vec3(crL.y, 0.5, -crL.y));
      colorLit += vec3(0.2) * exp(-ejDist * 2.0) * 0.30 * u_ejectaRays;
    }

    // Secondary chains — linear secondary crater patterns.
    float scPhase = sin(lonL * 20.0 + latDegL * 8.0);
    colorLit = mix(colorLit, colorLit * 0.85,
                   smoothstep(0.9, 0.98, scPhase) * 0.25 * u_secondaryChains);

    // Regolith — dusty gray cover.
    colorLit = mix(colorLit * 0.90, colorLit, u_regolith);

    // Space weathering — reddening from solar wind.
    colorLit += vec3(0.05, 0.02, 0.0)
              * cosmos_hash31(floor(n * 8.0)) * u_spaceWeathering;

    // Ray systems — bright radial streaks.
    float raySysPhase = sin(lonL * 12.0 + latDegL * 4.0);
    colorLit += vec3(0.90, 0.88, 0.85)
              * smoothstep(0.90, 0.98, raySysPhase) * 0.25 * u_raySystems;

    // Ray degradation — darkens old rays.
    colorLit += vec3(-0.05) * u_rayDegradation;

    // Terminator shadow — emphasize terminator line.
    float termDist = abs(sunFacing);
    colorLit *= 1.0 - smoothstep(0.05, 0.0, termDist) * 0.35 * u_terminatorShadow;

    // Terminator gradient — gentle gradient at day/night boundary.
    colorLit += vec3(0.03) * (1.0 - smoothstep(0.0, 0.3, termDist)) * u_terminatorGradient;

    // Permanent shadow — deep dark regions near poles.
    float psH = cosmos_hash31(floor(n * 18.0) + vec3(5.0));
    float psMaskL = step(0.97, psH) * smoothstep(70.0, 88.0, latAbsL);
    colorLit *= 1.0 - psMaskL * 0.9 * u_permanentShadow;

    // Water ice — bright patches in shadowed polar craters.
    float wiH = cosmos_hash31(floor(n * 22.0) + vec3(3.0));
    colorLit += vec3(0.85, 0.90, 0.95) * step(0.97, wiH)
              * smoothstep(75.0, 88.0, latAbsL) * 0.55 * u_waterIce;

    // Frost rings — bright rings around polar craters.
    float frR = abs(sin(length(n.xz) * 30.0));
    colorLit += vec3(0.90) * frR * smoothstep(70.0, 85.0, latAbsL) * 0.10 * u_frostRings;

    // Exosphere emission — faint blue-violet rim halo.
    colorLit += vec3(0.30, 0.35, 0.55) * rimMuL * rimMuL * 0.10 * u_exosphereEmission;

    // Exosphere dust — additional orange rim tint.
    colorLit += vec3(0.55, 0.40, 0.30) * rimMuL * 0.08 * u_exosphereDust;

    // Apollo sites — speculative bright markers (near-side only).
    float apH = cosmos_hash31(floor(n * 40.0) + vec3(21.0));
    colorLit += vec3(1.0, 0.92, 0.70) * step(0.98, apH)
              * max(0.0, n.x) * 0.5 * u_apolloSites;

    // Lunar base — speculative nightside lights.
    float lbH = cosmos_hash31(floor(n * 30.0) + vec3(31.0));
    colorLit += vec3(0.30, 0.75, 1.0) * step(0.98, lbH) * night * 0.6 * u_lunarBase;
  }
  #endif

  // Rim glow + limb darkening + subtle specular (basalt sheen).
  if (u_specularStrength > 0.0) {
    vec3 h = normalize(s + v);
    float spec = pow(max(0.0, dot(nW, h)), 32.0);
    colorLit += vec3(1.0) * spec * u_specularStrength * max(0.0, sunFacing);
  }
  colorLit += rim;
  colorLit *= limb;

  fragColor = vec4(colorLit, 1.0);
}
