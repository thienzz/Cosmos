// Cosmos Explorer — atmospheric-moon fragment shader (T43).
// Doc 17 §3012 + Doc 18 §Atmospheric Moon (Titan-Type).
//
//   MOON_TITAN  ENT-3012  Titan — N₂+CH₄ 1.5-bar haze, methane lakes,
//                         hydrocarbon dunes, ice highlands, limb glow.
//
// Implementation: a heavy Titan-orange haze shell obscures most of the
// surface. Lakes + highlands poke through in high-contrast polar bands.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"
#include "lib/moon-common.glsl"

out vec4 fragColor;

// Underlying surface glimpse — dunes (linear dark streaks) + highlands (bright
// patches) + polar methane lakes (very dark, specular).
vec3 titanSurface(vec3 n) {
  // Directional dune noise — stretches along equator.
  vec3 dunePos = n * vec3(8.0, 2.5, 8.0);
  float dunes = cosmos_fbm(dunePos, 5);
  // Highlands (bright water-ice) — sparse high-frequency patches.
  float highlands = smoothstep(0.7, 0.85, cosmos_fbm(n * 6.0, 4));
  // Polar methane lakes — very dark, concentrated at high latitude.
  float latAbs = abs(moon_latDeg(n));
  float latPolar = smoothstep(u_polarCapExtent - 10.0, u_polarCapExtent, latAbs);
  float lakeField = cosmos_warpedFbm(n * 4.0, 4);
  float lakes = smoothstep(0.55, 0.7, lakeField) * latPolar;

  vec3 color = mix(u_poleColor, u_baseColor, dunes);
  color = mix(color, u_highlightColor, highlands * 0.7);
  color = mix(color, u_shadowColor, lakes);
  return color;
}

void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);
  vec3 nW = normalize(v_normalW);
  vec3 v  = normalize(v_viewDirW);
  vec3 s  = normalize(u_sunDir);

  // Underlying surface.
  vec3 surface = titanSurface(n);

  // Haze extinction — thick orange atmosphere obscures surface. Thicker at
  // the limb (longer optical path), reduces surface contrast uniformly.
  float mu = max(0.0, dot(nW, v));
  float hazeDepth = mix(1.0, 0.35, mu);                 // 1 at limb, 0.35 centre
  float hazeFactor = clamp(hazeDepth * u_hazeCoverage, 0.0, 1.0);
  // Haze colour varies with altitude — inner richer orange, limb deeper brown.
  vec3 hazeInner = u_atmosphereTint;
  vec3 hazeLimb = u_poleColor;                          // deep organic brown
  vec3 hazeColor = mix(hazeInner, hazeLimb, 1.0 - mu);
  surface = mix(surface, hazeColor, hazeFactor * 0.85);

  // Lighting — Titan is far from the Sun; terminator is soft from
  // multiple scattering in the haze.
  float sunFacing = dot(nW, s);
  float lit = cosmos_diffuse(nW, s, u_ambientFloor);
  // Soften the terminator to mimic haze forward-scattering.
  float softTerm = cosmos_softTerminator(nW, s, 0.35);
  lit = mix(lit * 0.4, lit, softTerm);

  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  // Extended atmosphere rim — three-layer haze silhouette.
  float mu2 = abs(dot(nW, v));
  float rimOuter = pow(1.0 - mu2, 2.0);
  float rimMid = pow(1.0 - mu2, 4.0);
  vec3 rim = hazeInner * rimOuter * 0.35 + u_highlightColor * rimMid * 0.25;
  rim *= max(0.0, sunFacing) * u_atmosphereStrength;

  vec3 colorLit = surface * lit;

  // Specular glint off polar methane lakes — visible through haze at
  // limb angles where Cassini's Huygens confirmed the effect.
  if (u_specularStrength > 0.0) {
    vec3 h = normalize(s + v);
    float spec = pow(max(0.0, dot(nW, h)), 80.0);
    colorLit += vec3(0.9, 0.7, 0.4) * spec * u_specularStrength * max(0.0, sunFacing) * 0.2;
  }

  // ---------------------------------------------------------------------
  // T52 Doc 22 ENT-3020 (Titan) toggle effects — canonical Doc 22 names.
  // ---------------------------------------------------------------------
  #ifdef MOON_TITAN
  {
    float latDegT = moon_latDeg(n);
    float latAbsT = abs(latDegT);
    float lonT = atan(n.z, n.x);
    float rimMuT = 1.0 - abs(dot(nW, v));
    float dayT = max(0.0, sunFacing);

    // Atmosphere haze — primary orange haze gate.
    colorLit = mix(colorLit * 0.80, colorLit, u_atmosphereHaze);

    // Upper haze — bright halo near limb.
    colorLit += vec3(0.55, 0.35, 0.12) * rimMuT * rimMuT * 0.20 * u_upperHaze;

    // Stratosphere — layered limb bands.
    float stratL = 0.5 + 0.5 * sin(rimMuT * 18.0);
    colorLit += vec3(0.40, 0.25, 0.10) * rimMuT * stratL * 0.20 * u_stratosphere;

    // Atmospheric bands — zonal band patterns.
    colorLit += vec3(0.08, 0.05, 0.02) * sin(latDegT * 0.15) * u_atmosBands;

    // Tholin haze — orange-brown chemistry tint.
    colorLit += vec3(0.30, 0.18, 0.05) * 0.25 * u_tholinHaze;

    // Methane clouds — white drifting patches.
    float mcPhase = cosmos_fbm(n * 5.0 + vec3(u_time * 0.02), 3);
    colorLit += vec3(0.85, 0.78, 0.65)
              * smoothstep(0.60, 0.75, mcPhase) * 0.30 * u_methaneClouds;

    // Haze variation — additional tint modulation.
    colorLit += vec3(0.08, 0.04, 0.0) * cosmos_fbm(n * 3.0, 2) * u_hazeVariation;

    // Bedrock elevation — bright highlands glimpse.
    float beE = smoothstep(0.70, 0.85, cosmos_fbm(n * 6.0, 4));
    colorLit += vec3(0.20) * beE * 0.30 * u_bedrockElevation;

    // Xanadu region — large bright equatorial terrain.
    float xLat = 10.0 * 0.01745;
    float xLon = 1.5;
    float xDist = length(vec2(asin(n.y) - xLat,
                              mod(lonT - xLon + 3.14159, 6.28318) - 3.14159));
    colorLit += vec3(0.25, 0.20, 0.12) * exp(-xDist * 1.8) * 0.35 * u_xanaduRegion;

    // Kraken Mare — large methane sea (north polar).
    float krLat = 68.0 * 0.01745;
    float krDist = length(vec2(asin(n.y) - krLat,
                               mod(lonT + 2.0 + 3.14159, 6.28318) - 3.14159));
    colorLit = mix(colorLit, vec3(0.05, 0.04, 0.03),
                   exp(-krDist * 3.5) * 0.55 * u_krakenMare);

    // Ligeia Mare — second large methane sea.
    float lgLat = 78.0 * 0.01745;
    float lgDist = length(vec2(asin(n.y) - lgLat,
                               mod(lonT - 2.3 + 3.14159, 6.28318) - 3.14159));
    colorLit = mix(colorLit, vec3(0.06, 0.05, 0.04),
                   exp(-lgDist * 4.0) * 0.45 * u_ligeiaMare);

    // Small lakes — scattered dark polar patches.
    float polarT = smoothstep(55.0, 80.0, latAbsT);
    float lakeF = smoothstep(0.55, 0.70, cosmos_warpedFbm(n * 4.0, 4));
    colorLit = mix(colorLit, vec3(0.10, 0.08, 0.06),
                   lakeF * polarT * 0.40 * u_smallLakes);

    // Coastline detail — sharpened lake edges.
    float cSharp = smoothstep(0.52, 0.58, cosmos_warpedFbm(n * 4.0, 4))
                 - smoothstep(0.58, 0.64, cosmos_warpedFbm(n * 4.0, 4));
    colorLit += vec3(0.12) * cSharp * polarT * u_coastlineDetail;

    // Methane rain — falling droplets.
    float mrH = cosmos_hash31(floor(n * 30.0) + vec3(floor(u_time * 0.5)));
    colorLit += vec3(0.55, 0.35, 0.15) * step(0.97, mrH) * dayT * 0.25 * u_methaneRain;

    // Cumulonimbus upper — towering cloud tops.
    float cuH = cosmos_hash31(floor(n * 8.0) + vec3(3.0));
    colorLit += vec3(0.9, 0.85, 0.70) * step(0.95, cuH) * 0.35 * u_cumulonimbusUpper;

    // Wind streaks — horizontal bright lines.
    float wsPhase = sin(latDegT * 3.0 + u_time * 0.1);
    colorLit += vec3(0.15, 0.10, 0.05) * smoothstep(0.85, 0.95, wsPhase) * 0.20 * u_windStreaks;

    // Cryovolcanic domes — bright dome features.
    float cdH = cosmos_hash31(floor(n * 10.0) + vec3(7.0));
    colorLit += vec3(0.85, 0.75, 0.55) * step(0.94, cdH) * 0.30 * u_cryoDomes;

    // Cryo lava flows — darker linear flow streaks.
    float clPhase = sin(lonT * 15.0 + latDegT * 2.0);
    colorLit = mix(colorLit, vec3(0.25, 0.15, 0.08),
                   smoothstep(0.92, 0.98, clPhase) * 0.30 * u_cryoLavaFlows);

    // Sand dunes — equatorial linear dark streaks.
    float dunesT = cosmos_fbm(n * vec3(8.0, 2.5, 8.0), 5);
    float dMask = exp(-pow(latDegT / 25.0, 2.0))
                * smoothstep(0.40, 0.60, dunesT);
    colorLit = mix(colorLit, vec3(0.40, 0.26, 0.14), dMask * 0.40 * u_sandDunes);

    // Dune migration — time-varying dune tint.
    colorLit += vec3(0.04) * sin(u_time * 0.05 + lonT) * dMask * u_duneMigration;

    // Jet stream wind — bright mid-latitude band.
    float jsT = exp(-pow((latAbsT - 40.0) / 6.0, 2.0));
    colorLit += vec3(0.12) * jsT * 0.25 * u_jetStreamWind;

    // Seasonal wind reversal — time-modulated tint shift.
    colorLit += vec3(0.08, -0.03, 0.05) * sin(u_time * 0.02) * u_seasonalWindReversal;
  }
  #endif

  colorLit += rim;
  colorLit *= limb;

  fragColor = vec4(colorLit, 1.0);
}
