// Cosmos Explorer — gas-giant fragment shader (Doc 18 §Gas Giants, §Exotic
// Planet Types). T42 expansion: 9 variants covering every gaseous ENT-ID
// from Doc 17.
//
// Variant selection via `#define GAS_*` (new canonical names) with back-compat
// aliases for the original T13 `PLANET_*` defines.
//
//   GAS_JUPITER      ENT-2020   (alias PLANET_JUPITER)
//   GAS_SATURN       ENT-2021   (alias PLANET_SATURN)
//   GAS_URANUS       ENT-2025   (alias PLANET_URANUS)
//   GAS_NEPTUNE      ENT-2026   (alias PLANET_NEPTUNE)
//   GAS_HOT_JUPITER  ENT-2030   tidally locked, incandescent dayside
//   GAS_MINI_NEPTUNE ENT-2032   smaller, thicker haze, muted banding
//   GAS_PUFFY        ENT-2041   ultra-low density, diffuse glowing edge
//   GAS_HELIUM       ENT-2045   pale, nearly-featureless He-dominant
//   GAS_CIRCUMBINARY ENT-2046   Tatooine-type; two sun dirs lighting model
//
// CLAUDE.md Rule #1: no textures. fbm-based turbulence only.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"

// Back-compat alias bridge. ------------------------------------------------
#if defined(PLANET_JUPITER) && !defined(GAS_JUPITER)
  #define GAS_JUPITER
#endif
#if defined(PLANET_SATURN) && !defined(GAS_SATURN)
  #define GAS_SATURN
#endif
#if defined(PLANET_URANUS) && !defined(GAS_URANUS)
  #define GAS_URANUS
#endif
#if defined(PLANET_NEPTUNE) && !defined(GAS_NEPTUNE)
  #define GAS_NEPTUNE
#endif

uniform vec3  u_zoneColor;          // bright equatorial band tint
uniform vec3  u_beltColor;          // darker belt tint
uniform vec3  u_poleColor;          // high-latitude tint
uniform vec3  u_spotColor;          // GRS / Great Dark Spot tint
uniform vec3  u_atmosphereTint;     // rim glow colour
uniform vec3  u_thermalColor;       // Hot Jupiter dayside glow tint
uniform float u_bandCount;          // ~6 Jupiter, ~3 Saturn, ~1 Neptune/Uranus
uniform float u_bandIntensity;      // 0 = Uranus (flat), 1 = Jupiter
uniform float u_spotLatDeg;         // GRS ≈ −22, Neptune dark spot ≈ −20
uniform float u_spotSize;           // Gaussian σ in radians
uniform float u_spotIntensity;      // 0 = no spot
uniform float u_turbulence;         // fbm amplitude for zonal detail
uniform float u_hexagonStrength;    // Saturn only
uniform float u_atmosphereStrength;
uniform float u_ambientFloor;
uniform float u_limbDarkening;
uniform float u_hazeDensity;        // Mini-Neptune / Puffy thick-haze opacity
uniform float u_puffyExpansion;     // Puffy: extra outer falloff radius factor
uniform float u_thermalIntensity;   // Hot Jupiter incandescence
uniform vec3  u_secondarySunDir;    // Circumbinary second star direction
uniform float u_secondarySunMix;    // 0 = single sun, 1 = full binary lighting
uniform float u_time;
uniform vec3  u_sunDir;

// ---- Doc 22 ENT-2020 Jupiter + ENT-2021 Saturn toggle uniforms -----------
// Declared unconditionally. Only consumed inside matching GAS_JUPITER /
// GAS_SATURN blocks; other gas-giant variants ignore them.
uniform float u_equatorialZone;
uniform float u_equatorialBelts;
uniform float u_northTempZone;
uniform float u_southTempZone;
uniform float u_polarRegions;
uniform float u_gRSActive;
uniform float u_ovalBA;
uniform float u_whiteOvals;
uniform float u_redPlumes;
uniform float u_blueGreenJets;
uniform float u_impactScars;
uniform float u_ammoniaLayer;
uniform float u_waterLayer;
uniform float u_windShear;
uniform float u_vorticity;
uniform float u_hazeLayer;
uniform float u_northPoleCyclones;
uniform float u_southPoleCyclones;
uniform float u_polarHaze;
uniform float u_polarVortexWinds;
uniform float u_lightningFlashes;
uniform float u_auroralGlow;
uniform float u_radioEmission;
uniform float u_magneticRecFaint;
uniform float u_mainRing;
uniform float u_haloRing;
uniform float u_ringClumps;
uniform float u_magFieldLines;
uniform float u_ioTorus;
uniform float u_magnetotail;
uniform float u_moonPositions;
uniform float u_moonShadows;

// Saturn (ENT-2021) specific uniforms
uniform float u_aRingMain;
uniform float u_bRingMain;
uniform float u_cRingMain;
uniform float u_cassiniDiv;
uniform float u_enckeKeekerGaps;
uniform float u_dRingGossamer;
uniform float u_eRingOuter;
uniform float u_temperateBelts;
uniform float u_hazeLimb;
uniform float u_hexagonMain;
uniform float u_hexagonEdges;
uniform float u_hexagonInterior;
uniform float u_greatWhiteSpot;
uniform float u_stormClusters;
uniform float u_redSpotSouth;
uniform float u_ammoniumHS;
uniform float u_enceladusTorus;
uniform float u_titanHaze;
uniform float u_axialTilt;
uniform float u_seasonalIllum;

// ---- Doc 22 ENT-2022 (Uranus) toggle uniforms -----------------------------
uniform float u_methaneLay;
uniform float u_cloudDecks;
uniform float u_faintZoning;
uniform float u_limbHaze;
uniform float u_equatorialBand;
uniform float u_midLatBands;
uniform float u_polarBrighten;
uniform float u_poleWind;
uniform float u_sunlitPole;
uniform float u_nightPole;
uniform float u_polarInversion;
uniform float u_mainRings;
uniform float u_epsilonRing;
uniform float u_ringShepher;
uniform float u_magDipole;
uniform float u_magBulge;
uniform float u_auroralMag;
uniform float u_moonInclined;
uniform float u_stratoHaze;
uniform float u_thermalEmit;

// ---- Doc 22 ENT-2023 (Neptune) toggle uniforms ----------------------------
uniform float u_baseBlue;
uniform float u_equatorialDarker;
uniform float u_cloudBreaks;
uniform float u_greatDarkSpot;
uniform float u_scooter;
uniform float u_darkSpotSmall;
uniform float u_brightOvals;
uniform float u_equatorialJet;
uniform float u_retrogradeBelts;
uniform float u_midLatZones;
uniform float u_polarCirc;
uniform float u_methaneCirc;
uniform float u_circusStreaks;
uniform float u_convectivePlumes;
uniform float u_thermalGlow;
uniform float u_warmSpots;
uniform float u_ringArcs;
uniform float u_tritonPos;
uniform float u_tritonGeysers;
uniform float u_auroralAsym;

in vec3 v_modelPos;
in vec3 v_surfaceNormal;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

// Log-depth pairing with planet.vert.
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

// ---------------------------------------------------------------------------
// Zonal band shape.
// ---------------------------------------------------------------------------
float zoneBandWeight(float sinLat) {
  float phase = sinLat * u_bandCount * 3.14159265;
  return 0.5 + 0.5 * sin(phase);
}

// Jet-stream distortion per band.
vec3 differentialRotate(vec3 n) {
  float sinLat = clamp(n.y, -1.0, 1.0);
  float zoneIndex = floor(sinLat * u_bandCount + 0.5);
  float bandSpeed = 0.02 * (1.0 - abs(sinLat) * 0.6);
  float phase = u_time * bandSpeed + zoneIndex * 0.8;
  float c = cos(phase);
  float s = sin(phase);
  return vec3(c * n.x - s * n.z, n.y, s * n.x + c * n.z);
}

// Persistent-spot mask.
float persistentSpot(vec3 n) {
  if (u_spotIntensity <= 0.0) return 0.0;
  float latRad = asin(clamp(n.y, -1.0, 1.0));
  float lonRad = atan(n.z, n.x);
  float spotLatRad = radians(u_spotLatDeg);
  float spotLonRad = 0.5 * sin(u_time * 0.03);
  float dLat = (latRad - spotLatRad) / (u_spotSize * 0.6);
  float dLon = (lonRad - spotLonRad) / u_spotSize;
  return exp(-(dLat * dLat + dLon * dLon));
}

// Saturn hexagonal polar vortex.
float hexagonalVortex(vec3 n) {
  #ifdef GAS_SATURN
    if (u_hexagonStrength <= 0.0) return 0.0;
    float r = length(n.xz);
    if (n.y < 0.7) return 0.0;
    float angle = atan(n.z, n.x) + u_time * 0.05;
    float hexWave = cos(angle * 3.0) * 0.15;
    float hex = smoothstep(0.0, 0.15, 0.18 - abs(r + hexWave - 0.28));
    return hex * u_hexagonStrength;
  #else
    return 0.0;
  #endif
}

void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);
  vec3 nW = normalize(v_normalW);
  vec3 v  = normalize(v_viewDirW);
  vec3 s  = normalize(u_sunDir);

  vec3 nBand = differentialRotate(n);

  float sinLat = clamp(n.y, -1.0, 1.0);
  float zones = zoneBandWeight(sinLat);
  float turb = cosmos_fbm(nBand * 4.0, 4);
  float band = clamp(zones + (turb - 0.5) * u_turbulence, 0.0, 1.0);

  vec3 color = mix(u_beltColor, u_zoneColor, band);
  float latAbs = abs(degrees(asin(sinLat)));
  float poleMix = smoothstep(50.0, 80.0, latAbs);
  color = mix(color, u_poleColor, poleMix * 0.6);

  float spot = persistentSpot(nBand);
  color = mix(color, u_spotColor, spot * u_spotIntensity);

  float hex = hexagonalVortex(n);
  color *= (1.0 - hex * 0.35);

  color = mix(u_zoneColor, color, u_bandIntensity);

  // ---------------------------------------------------------------------
  // Doc 22 ENT-2020 (Jupiter) toggle effects — direct uniform branches.
  // ---------------------------------------------------------------------
  #ifdef GAS_JUPITER
  {
    float sinL = clamp(n.y, -1.0, 1.0);
    float latAbs2 = abs(degrees(asin(sinL)));
    // Equatorial zone band (±15°) — cream brightening.
    float eqMask = 1.0 - smoothstep(10.0, 30.0, latAbs2);
    color = mix(color, u_zoneColor * 1.1, eqMask * 0.25 * (1.0 - u_equatorialZone));
    color += u_zoneColor * 0.05 * eqMask * u_equatorialZone;

    // Equatorial belts (±10–20°) — dark reddish-brown twin belts.
    float beltMask = smoothstep(8.0, 15.0, latAbs2) * (1.0 - smoothstep(20.0, 28.0, latAbs2));
    color = mix(color, vec3(0.56, 0.35, 0.20), beltMask * 0.35 * u_equatorialBelts);

    // Temperate zones (±25–40°) — light tan.
    float nTemp = smoothstep(22.0, 28.0, degrees(asin(sinL))) * (1.0 - smoothstep(36.0, 45.0, degrees(asin(sinL))));
    float sTemp = smoothstep(22.0, 28.0, -degrees(asin(sinL))) * (1.0 - smoothstep(36.0, 45.0, -degrees(asin(sinL))));
    color = mix(color, vec3(0.788, 0.722, 0.565), nTemp * 0.30 * u_northTempZone);
    color = mix(color, vec3(0.788, 0.722, 0.565), sTemp * 0.30 * u_southTempZone);

    // Polar regions (|lat|>55°) — deep blue-gray.
    float polar2 = smoothstep(50.0, 70.0, latAbs2);
    color = mix(color, vec3(0.29, 0.29, 0.435), polar2 * 0.45 * u_polarRegions);

    // GRS — anticyclonic oval at ~22°S.
    float grsLat = -22.0 * 3.14159 / 180.0;
    float latR = asin(sinL);
    float lonR = atan(n.z, n.x);
    float grsLon = u_time * 0.02;
    float grsDLat = (latR - grsLat) / 0.16;
    float grsDLon = (lonR - grsLon) / 0.28;
    float grs = exp(-(grsDLat*grsDLat + grsDLon*grsDLon));
    color = mix(color, vec3(0.66, 0.27, 0.11), grs * 0.75 * u_gRSActive);

    // Oval BA — at ~33°S.
    float baLat = -33.0 * 3.14159 / 180.0;
    float baLon = u_time * 0.015 + 2.1;
    float baDLat = (latR - baLat) / 0.10;
    float baDLon = (lonR - baLon) / 0.18;
    float ba = exp(-(baDLat*baDLat + baDLon*baDLon));
    color = mix(color, vec3(0.831, 0.455, 0.235), ba * 0.55 * u_ovalBA);

    // White ovals cluster at ~35°S.
    float woLat = -35.0 * 3.14159 / 180.0;
    float woLon = lonR * 3.0 + u_time * 0.04;
    float woM = smoothstep(0.7, 1.0, sin(woLon)) * exp(-pow((latR-woLat)/0.08, 2.0));
    color = mix(color, vec3(0.961, 0.918, 0.847), woM * 0.45 * u_whiteOvals);

    // Red plumes — equatorial transient patches.
    float plumeHash = cosmos_hash31(vec3(floor(lonR*6.0), floor(u_time*0.3), 0.0));
    float plumeMask = exp(-pow(latR/0.18, 2.0))
                   * step(0.85, plumeHash) * (1.0 - fract(u_time * 0.3));
    color += vec3(0.722, 0.267, 0.122) * plumeMask * 0.45 * u_redPlumes;

    // Blue-green jets (±10-20° N/S, transient).
    float jetMask = smoothstep(8.0, 12.0, latAbs2) * (1.0 - smoothstep(18.0, 24.0, latAbs2))
                  * (0.5 + 0.5 * sin(lonR * 12.0 + u_time * 0.5));
    color += vec3(0.29, 0.50, 0.625) * jetMask * 0.30 * u_blueGreenJets;

    // Impact scars (south polar historical).
    float scarMask = smoothstep(-90.0, -60.0, degrees(latR))
                   * step(0.92, cosmos_hash31(vec3(floor(lonR*5.0), 3.0, 0.0)));
    color = mix(color, vec3(0.165, 0.165, 0.227), scarMask * 0.55 * u_impactScars);

    // Ammonia + water cloud chemistry — tint shift.
    color = mix(color * 0.7, color, u_ammoniaLayer);
    color += vec3(-0.05, -0.02, -0.03) * (1.0 - u_waterLayer);

    // Wind shear — strong band-edge turbulence line.
    float shearLine = smoothstep(0.98, 1.0, sin(latR * 30.0));
    color += vec3(1.0) * shearLine * 0.10 * u_windShear;

    // Vorticity — fine swirling detail.
    float vorDetail = sin(lonR * 70.0 + latR * 40.0 + u_time * 0.3);
    color += vec3(0.1, 0.08, 0.06) * vorDetail * 0.08 * u_vorticity;

    // Haze layer — pale rim softening.
    float hazeMu = abs(dot(nW, v));
    color = mix(color, vec3(0.851, 0.808, 0.769), (1.0 - hazeMu) * 0.15 * u_hazeLayer);

    // Polar cyclones — 8-fold / 6-fold symmetry at poles.
    if (n.y > 0.85) {
      float symN = mod(atan(n.z, n.x), 3.14159 * 2.0 / 8.0);
      float nC = exp(-pow((symN - 3.14159/8.0)/0.18, 2.0));
      color = mix(color, vec3(0.71, 0.83, 0.94), nC * 0.6 * u_northPoleCyclones);
    }
    if (n.y < -0.85) {
      float symS = mod(atan(n.z, n.x), 3.14159 * 2.0 / 6.0);
      float sC = exp(-pow((symS - 3.14159/6.0)/0.22, 2.0));
      color = mix(color, vec3(0.71, 0.83, 0.94), sC * 0.6 * u_southPoleCyclones);
    }

    // Polar haze darkening.
    float polarH2 = smoothstep(0.7, 1.0, abs(n.y));
    color = mix(color, vec3(0.353, 0.353, 0.435), polarH2 * 0.45 * u_polarHaze);

    // Polar vortex wind jets — swirling streak distortion.
    if (abs(n.y) > 0.7) {
      float swirl = sin(lonR * 15.0 + sign(n.y) * u_time * 0.8);
      color += vec3(0.05) * swirl * 0.35 * u_polarVortexWinds;
    }

    // Lightning flashes — deep cloud layer strobe.
    float lightH = cosmos_hash31(floor(n * 20.0) + vec3(floor(u_time * 3.0)));
    float lightMask = smoothstep(0.995, 1.0, lightH) * beltMask;
    color += vec3(1.0) * lightMask * 0.8 * u_lightningFlashes;

    // Auroral glow — polar band at ±75°.
    float auroralMask = exp(-pow((latAbs2 - 75.0) / 8.0, 2.0));
    color += vec3(0.29, 0.561, 0.816) * auroralMask * 0.25 * u_auroralGlow;

    // Radio emission strobe at poles.
    float radioM = smoothstep(0.75, 1.0, abs(n.y)) * step(0.5, sin(u_time * 3.14));
    color += vec3(1.0) * radioM * 0.20 * u_radioEmission;

    // Magnetic reconnection glow — faint orange in storms.
    float recGlow = cosmos_hash31(n * 30.0 + vec3(u_time * 0.4));
    color += vec3(1.0, 0.565, 0.251) * step(0.93, recGlow) * beltMask * 0.15 * u_magneticRecFaint;

    // Main ring — faint equatorial tint.
    float ringMask = exp(-pow(n.y * 8.0, 2.0));
    color += vec3(0.165, 0.094, 0.063) * ringMask * 0.08 * u_mainRing;

    // Halo ring — diffuse equatorial band.
    color += vec3(0.10, 0.075, 0.031) * ringMask * 0.05 * u_haloRing;

    // Ring clumps — sparse bright dots.
    float ringClumpH = cosmos_hash31(vec3(floor(lonR * 30.0), floor(n.y * 100.0), 0.0));
    color += vec3(0.431, 0.353, 0.251)
           * step(0.92, ringClumpH) * ringMask * 0.20 * u_ringClumps;

    // Magnetic field lines — global glowing pattern.
    float magLine = sin(lonR * 3.0 + latR * 5.0 + u_time * 0.05);
    color += mix(vec3(1.0, 0.996, 0.961), vec3(1.0, 0.376, 0.188),
                 step(0.0, magLine)) * abs(magLine) * 0.05 * u_magFieldLines;

    // Io torus — bright greenish band at low-mid latitudes.
    float ioMask = exp(-pow(n.y * 3.5, 2.0)) * (1.0 - ringMask);
    color += vec3(0.498, 0.816, 0.624) * ioMask * 0.12 * u_ioTorus;

    // Magnetotail — nightside faint reddish tint.
    float night = max(0.0, -dot(nW, normalize(u_sunDir)));
    color += vec3(0.784, 0.251, 0.251) * night * 0.10 * u_magnetotail;

    // Moon positions markers — subtle equatorial sparkles.
    float moonMark = step(0.97, cosmos_hash31(vec3(floor(u_time * 0.5), floor(lonR * 8.0), 0.0)));
    color += vec3(1.0, 0.722, 0.125) * moonMark * ringMask * 0.30 * u_moonPositions;

    // Moon transit shadows — subtle dark oval on equator.
    float shadowPhase = sin(u_time * 0.3 + lonR * 2.0);
    float shadowMask = smoothstep(0.85, 1.0, shadowPhase) * exp(-pow(n.y * 4.0, 2.0));
    color *= 1.0 - shadowMask * 0.35 * u_moonShadows;
  }
  #endif

  // ---------------------------------------------------------------------
  // Doc 22 ENT-2022 (Uranus) toggle effects.
  // ---------------------------------------------------------------------
  #ifdef GAS_URANUS
  {
    float sinLU = clamp(n.y, -1.0, 1.0);
    float latU = asin(sinLU);
    float latDegU = degrees(latU);
    float latAbsU = abs(latDegU);
    float lonU = atan(n.z, n.x);
    float rimMuU = 1.0 - abs(dot(nW, v));
    float dayU = max(0.0, dot(nW, normalize(u_sunDir)));

    // Methane layer — greenish-cyan tint (OFF dims).
    color = mix(color * 0.85, color, u_methaneLay);

    // Cloud decks — subtle bright streaks.
    float cdPhase = 0.5 + 0.5 * sin(latU * 4.0 + lonU * 2.0 + u_time * 0.1);
    color += vec3(0.08, 0.09, 0.09) * cdPhase * u_cloudDecks;

    // Faint zoning — broad bands.
    color += vec3(0.04, 0.05, 0.05) * sin(latU * 3.0) * u_faintZoning;

    // Limb haze — soft cyan rim.
    color += vec3(0.77, 0.87, 0.84) * rimMuU * rimMuU * 0.18 * u_limbHaze;

    // Equatorial band — bright equatorial stripe.
    color += vec3(0.10, 0.12, 0.11) * exp(-pow(latDegU / 8.0, 2.0)) * u_equatorialBand;

    // Mid-lat bands — symmetric pale bands at ±35°.
    color += vec3(0.06) * exp(-pow((latAbsU - 35.0) / 8.0, 2.0)) * u_midLatBands;

    // Polar brightening — bright near poles (sunlit pole seasonally).
    color += vec3(0.15, 0.12, 0.10) * smoothstep(60.0, 85.0, latAbsU) * 0.35 * u_polarBrighten;

    // Pole wind — swirling high-lat jets.
    float pw = smoothstep(65.0, 85.0, latAbsU)
             * (0.5 + 0.5 * sin(lonU * 4.0 + sign(n.y) * u_time * 0.5));
    color += vec3(0.04, 0.05, 0.06) * pw * 0.4 * u_poleWind;

    // Sunlit pole — day-side pole bright cap.
    color += vec3(0.20, 0.25, 0.22) * pow(dayU, 2.0) * abs(n.y) * 0.35 * u_sunlitPole;

    // Night pole — dark blue night cap.
    float nightU = max(0.0, -dot(nW, normalize(u_sunDir)));
    color += vec3(-0.05, -0.03, 0.05) * nightU * abs(n.y) * u_nightPole;

    // Polar inversion — odd temperature structure (purple tint).
    color += vec3(0.10, -0.02, 0.15) * smoothstep(70.0, 88.0, latAbsU) * 0.30 * u_polarInversion;

    // Main rings — faint equatorial dark bands.
    float ringEqU = exp(-pow(n.y * 7.5, 2.0));
    color = mix(color, vec3(0.20, 0.18, 0.15), ringEqU * 0.20 * u_mainRings);

    // Epsilon ring — bright thin outer ring tint.
    color += vec3(0.25, 0.20, 0.15) * exp(-pow(n.y * 12.0, 2.0)) * 0.15 * u_epsilonRing;

    // Ring shepherd moons — sparkle.
    float rsH = cosmos_hash31(vec3(floor(lonU * 20.0), floor(u_time * 0.3), 0.0));
    color += vec3(0.9, 0.85, 0.75) * step(0.95, rsH) * ringEqU * 0.20 * u_ringShepher;

    // Magnetic dipole — offset/tilted field tint.
    float mdP = sin(lonU * 2.0 + latU * 3.0 + u_time * 0.03);
    color += mix(vec3(0.30, 0.45, 0.85), vec3(0.90, 0.35, 0.35),
                 step(0.0, mdP)) * abs(mdP) * 0.05 * u_magDipole;

    // Magnetic bulge — asymmetric field concentration.
    color += vec3(0.10, 0.12, 0.20) * smoothstep(0.0, 0.5, n.x * n.y) * 0.25 * u_magBulge;

    // Auroral magnetic — bright polar oval.
    float aurM = exp(-pow((latAbsU - 70.0) / 10.0, 2.0));
    color += vec3(0.30, 0.60, 0.85) * aurM * 0.30 * u_auroralMag;

    // Moon positions — bright equatorial sparkles.
    float mpU = step(0.96, cosmos_hash31(vec3(floor(u_time * 0.5),
                                              floor(lonU * 10.0), 7.0)));
    color += vec3(0.8, 0.85, 0.85) * mpU * ringEqU * 0.30 * u_moonPositions;

    // Moon inclined — distinct orbital plane (tilted band).
    float miPhase = sin(lonU * 1.5 + latU * 2.0);
    color += vec3(0.6, 0.6, 0.7)
           * step(0.88, cosmos_hash31(vec3(floor(miPhase * 5.0), 3.0, 0.0)))
           * 0.20 * u_moonInclined;

    // Stratospheric haze — subtle blue limb tint.
    color += vec3(0.40, 0.55, 0.70) * rimMuU * 0.15 * u_stratoHaze;

    // Thermal emission — faint deep-red glow on nightside.
    color += vec3(0.30, 0.10, 0.10) * nightU * 0.10 * u_thermalEmit;
  }
  #endif

  // ---------------------------------------------------------------------
  // Doc 22 ENT-2023 (Neptune) toggle effects.
  // ---------------------------------------------------------------------
  #ifdef GAS_NEPTUNE
  {
    float sinLN = clamp(n.y, -1.0, 1.0);
    float latN = asin(sinLN);
    float latDegN = degrees(latN);
    float latAbsN = abs(latDegN);
    float lonN = atan(n.z, n.x);
    float rimMuN = 1.0 - abs(dot(nW, v));
    float dayN = max(0.0, dot(nW, normalize(u_sunDir)));
    float nightN = max(0.0, -dot(nW, normalize(u_sunDir)));

    // Base blue — Neptune's deep cerulean (OFF dims).
    color = mix(color * 0.80, color, u_baseBlue);

    // Equatorial darker — darker equatorial band.
    color *= 1.0 - exp(-pow(latDegN / 15.0, 2.0)) * 0.15 * u_equatorialDarker;

    // Cloud breaks — bright high-altitude methane-ice clouds.
    float cbH = cosmos_hash31(floor(n * 8.0) + vec3(floor(u_time * 0.3)));
    color += vec3(1.0) * step(0.92, cbH) * 0.45 * u_cloudBreaks;

    // Limb haze — soft blue rim.
    color += vec3(0.60, 0.80, 0.95) * rimMuN * rimMuN * 0.20 * u_limbHaze;

    // Great Dark Spot — large oval at ~20°S (transient).
    float gdsLat = -20.0 * 0.01745;
    float gdsLon = u_time * 0.015;
    float gdsD = exp(-pow((latN - gdsLat)/0.15, 2.0)
                   - pow((lonN - gdsLon)/0.30, 2.0));
    color = mix(color, vec3(0.10, 0.14, 0.25), gdsD * 0.55 * u_greatDarkSpot);

    // Scooter — fast-moving white cloud chunk.
    float scPhase = sin(lonN * 3.0 - u_time * 1.5);
    float scM = smoothstep(0.85, 0.95, scPhase) * exp(-pow(latDegN / 8.0, 2.0));
    color += vec3(1.0) * scM * 0.4 * u_scooter;

    // Small dark spots — wandering.
    float dssH = cosmos_hash31(vec3(floor(lonN * 6.0 - u_time * 0.4),
                                    floor(latDegN * 0.2), 0.0));
    color = mix(color, vec3(0.13, 0.15, 0.22), step(0.94, dssH) * 0.40 * u_darkSpotSmall);

    // Bright ovals — white anticyclones.
    float boH = cosmos_hash31(vec3(floor(lonN * 5.0),
                                   floor(latDegN * 0.15), 3.0));
    color += vec3(0.95, 0.95, 1.0) * step(0.93, boH) * 0.40 * u_brightOvals;

    // Equatorial retrograde jet — superrotating band.
    float ejM = exp(-pow(latDegN / 12.0, 2.0));
    color += vec3(0.10, 0.12, 0.18) * sin(lonN * 8.0 - u_time * 1.0) * ejM * 0.25 * u_equatorialJet;

    // Retrograde belts — dark zonal belts.
    color *= 1.0 - smoothstep(0.90, 1.0, sin(latN * 6.0)) * 0.15 * u_retrogradeBelts;

    // Mid-lat zones — brighter zonal band at ±35°.
    color += vec3(0.08, 0.10, 0.12) * exp(-pow((latAbsN - 35.0) / 10.0, 2.0)) * u_midLatZones;

    // Polar circulation — swirling pattern at high latitudes.
    float pcPhase = smoothstep(60.0, 85.0, latAbsN)
                  * (0.5 + 0.5 * sin(lonN * 4.0 + u_time * 0.8));
    color += vec3(0.12, 0.15, 0.20) * pcPhase * 0.30 * u_polarCirc;

    // Methane circulation — whitish high-altitude motion.
    float mcPhase = sin(latN * 3.0 + lonN * 2.0 + u_time * 0.3);
    color += vec3(0.15) * mcPhase * 0.10 * u_methaneCirc;

    // Circus streaks — thin linear cloud streaks.
    float csPhase = sin(latN * 20.0 + u_time * 0.4);
    color += vec3(0.9) * smoothstep(0.9, 0.98, csPhase) * 0.25 * u_circusStreaks;

    // Convective plumes — rising bright spots.
    float cpH = cosmos_hash31(floor(n * 16.0) + vec3(floor(u_time * 2.0)));
    color += vec3(1.0) * step(0.97, cpH) * 0.50 * u_convectivePlumes;

    // Thermal glow — warm IR-like emission from night side.
    color += vec3(0.35, 0.20, 0.25) * nightN * 0.15 * u_thermalGlow;

    // Warm spots — hot thermal anomalies.
    float wsH = cosmos_hash31(floor(n * 10.0) + vec3(5.0));
    color += vec3(0.95, 0.55, 0.40) * step(0.96, wsH) * 0.35 * u_warmSpots;

    // Ring arcs — partial rings as equatorial streaks.
    float ringEqN = exp(-pow(n.y * 9.0, 2.0));
    float arcPhase = smoothstep(0.7, 0.95, sin(lonN * 2.0 + u_time * 0.1));
    color += vec3(0.40, 0.40, 0.45) * ringEqN * arcPhase * 0.30 * u_ringArcs;

    // Ring shepherds — sparkle.
    float rshH = cosmos_hash31(vec3(floor(lonN * 20.0), floor(u_time * 0.3), 7.0));
    color += vec3(0.8) * step(0.95, rshH) * ringEqN * 0.20 * u_ringShepher;

    // Triton position — bright icy marker off-equator.
    float tpPhase = sin(u_time * 0.3 + lonN);
    color += vec3(0.9, 0.92, 0.95) * step(0.95, tpPhase)
           * exp(-pow(n.y * 3.0, 2.0)) * 0.40 * u_tritonPos;

    // Triton geysers — nitrogen plumes (subtle bright flickers).
    float tgH = cosmos_hash31(vec3(floor(u_time * 3.0), floor(lonN * 12.0), 9.0));
    color += vec3(1.0) * step(0.98, tgH) * 0.35 * u_tritonGeysers;

    // Magnetic dipole — tilted offset field pattern.
    float mdN = sin(lonN * 2.0 + latN * 4.0 + u_time * 0.05);
    color += mix(vec3(0.30, 0.45, 0.90), vec3(0.90, 0.35, 0.30),
                 step(0.0, mdN)) * abs(mdN) * 0.05 * u_magDipole;

    // Auroral asymmetry — asymmetric aurora near magnetic axis.
    float aurN = exp(-pow((latDegN + 45.0) / 15.0, 2.0)) * smoothstep(0.0, 0.5, n.x);
    color += vec3(0.30, 0.70, 0.95) * aurN * 0.35 * u_auroralAsym;
  }
  #endif

  // ---------------------------------------------------------------------
  // Doc 22 ENT-2021 (Saturn) toggle effects.
  // ---------------------------------------------------------------------
  #ifdef GAS_SATURN
  {
    float sinLS = clamp(n.y, -1.0, 1.0);
    float latRS = asin(sinLS);
    float latDegS = degrees(latRS);
    float lonRS = atan(n.z, n.x);
    float latAbsS = abs(latDegS);

    // Ring shadows cast on body (equatorial darkening).
    float ringProj = exp(-pow(n.y * 7.0, 2.0));
    float ringVisA = step(0.22, abs(n.y)) * smoothstep(0.10, 0.30, abs(n.y));
    color *= 1.0 - ringProj * 0.25 * u_aRingMain * ringVisA;

    // Equatorial zone — cream band.
    float eqS = 1.0 - smoothstep(15.0, 30.0, latAbsS);
    color = mix(color, vec3(0.910, 0.863, 0.784), eqS * 0.20 * u_equatorialZone);

    // Temperate belts.
    float tempS = smoothstep(8.0, 14.0, latAbsS) * (1.0 - smoothstep(30.0, 40.0, latAbsS));
    color = mix(color, vec3(0.788, 0.659, 0.502), tempS * 0.30 * u_temperateBelts);

    // Polar regions.
    float polarS = smoothstep(50.0, 70.0, latAbsS);
    color = mix(color, vec3(0.353, 0.478, 0.624), polarS * 0.40 * u_polarRegions);

    // Haze + limb brightening.
    float hazeMuS = abs(dot(nW, v));
    color = mix(color, vec3(0.851, 0.808, 0.769), (1.0 - hazeMuS) * 0.18 * u_hazeLimb);

    // Hexagon main (north pole).
    float hexMain = 0.0;
    if (n.y > 0.7) {
      float angle = atan(n.z, n.x) + u_time * 0.05;
      float hx = cos(angle * 3.0) * 0.15;
      float r = length(n.xz);
      hexMain = smoothstep(0.0, 0.15, 0.18 - abs(r + hx - 0.28));
    }
    color = mix(color, vec3(0.831, 0.722, 0.439), hexMain * 0.40 * u_hexagonMain);

    // Hexagon edges — thin bright perimeter.
    float hexEdge = smoothstep(0.60, 0.80, hexMain) * (1.0 - smoothstep(0.80, 0.95, hexMain));
    color += vec3(0.541, 0.478, 0.439) * hexEdge * 0.35 * u_hexagonEdges;

    // Hexagon interior mottle.
    float hexInt = hexMain * cosmos_hash31(n * 40.0);
    color += vec3(0.937, 0.894, 0.847) * step(0.6, hexInt) * 0.20 * u_hexagonInterior;

    // Great White Spot (seasonal, default OFF).
    float gwsLat = 12.0 * 3.14159 / 180.0;
    float gwsD = exp(-pow((latRS - gwsLat)/0.18, 2.0)
                   - pow((lonRS - u_time*0.08)/0.25, 2.0));
    color = mix(color, vec3(0.961, 0.961, 0.941), gwsD * 0.70 * u_greatWhiteSpot);

    // Storm clusters (temperate).
    float scPhase = sin(lonRS * 6.0 + u_time * 0.2);
    float scMask = tempS * smoothstep(0.75, 0.95, scPhase);
    color = mix(color, vec3(0.910, 0.878, 0.847), scMask * 0.40 * u_stormClusters);

    // Red spot south (speculative, OFF).
    float rssLat = -35.0 * 3.14159 / 180.0;
    float rss = exp(-pow((latRS - rssLat)/0.12, 2.0)
                  - pow((lonRS - u_time*0.03 - 1.7)/0.18, 2.0));
    color = mix(color, vec3(0.722, 0.267, 0.122), rss * 0.55 * u_redSpotSouth);

    // Ammonia cloud chemistry tint.
    color = mix(color * 0.75, color, u_ammoniaLayer);

    // Ammonium hydrosulfide layer (deeper brown).
    color += vec3(-0.03, -0.02, -0.01) * (1.0 - u_ammoniumHS);

    // Water cloud layer (deep, default OFF).
    color += vec3(-0.02, -0.03, -0.04) * u_waterLayer;

    // Wind shear boundaries.
    float shearS = smoothstep(0.98, 1.0, sin(latRS * 28.0));
    color += vec3(1.0) * shearS * 0.12 * u_windShear;

    // Magnetic field lines (saturn).
    float magS = sin(lonRS * 3.0 + latRS * 4.5 + u_time * 0.04);
    color += mix(vec3(0.29, 0.624, 0.875), vec3(1.0, 0.251, 0.251),
                 step(0.0, magS)) * abs(magS) * 0.04 * u_magFieldLines;

    // Enceladus torus — faint green at low latitudes.
    float etMask = exp(-pow(n.y * 2.5, 2.0));
    color += vec3(0.498, 0.624, 0.659) * etMask * 0.08 * u_enceladusTorus;

    // Magnetotail night side tint.
    float nightS = max(0.0, -dot(nW, normalize(u_sunDir)));
    color += vec3(0.416, 0.353, 0.498) * nightS * 0.08 * u_magnetotail;

    // Moon markers (brighter sparkle near rings).
    float mmHash = cosmos_hash31(vec3(floor(u_time * 0.4), floor(lonRS * 10.0), 0.0));
    color += vec3(1.0, 0.722, 0.314) * step(0.94, mmHash) * ringProj * 0.30 * u_moonPositions;

    // Titan haze aura.
    float titanPhase = sin(u_time * 0.15 + lonRS * 0.5);
    float titanA = step(0.8, titanPhase) * ringProj;
    color += vec3(0.784, 0.565, 0.314) * titanA * 0.25 * u_titanHaze;

    // Axial tilt indicator — tints nightside bluer.
    color += vec3(-0.02, 0.01, 0.04) * nightS * u_axialTilt;

    // Seasonal illumination — brighter at daylit pole.
    color += vec3(0.1) * max(0.0, dot(nW, normalize(u_sunDir))) * abs(n.y) * 0.15 * u_seasonalIllum;

    // Ring-specific tints visible on body (shadows/brightening from each ring).
    color *= 1.0 - ringProj * 0.20 * u_bRingMain * ringVisA;
    color *= 1.0 - ringProj * 0.12 * u_cRingMain * ringVisA;
    color += vec3(0.05, 0.05, 0.03) * ringProj * 0.08 * u_cassiniDiv;
    color += vec3(0.03) * ringProj * 0.06 * u_enckeKeekerGaps;
    color += vec3(0.06, 0.05, 0.04) * ringProj * 0.08 * u_dRingGossamer;
    color += vec3(0.05) * ringProj * 0.04 * u_eRingOuter;
  }
  #endif

  // Lighting — Lambert with optional binary secondary.
  float lit  = cosmos_diffuse(nW, s, u_ambientFloor);
  #if defined(GAS_CIRCUMBINARY)
    vec3 s2 = normalize(u_secondarySunDir);
    float lit2 = cosmos_diffuse(nW, s2, u_ambientFloor);
    lit = mix(lit, max(lit, lit2), u_secondarySunMix);
  #endif
  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  vec3  rim  = cosmos_rimGlow(nW, v, s, u_atmosphereTint, u_atmosphereStrength);

  vec3 finalColor = color * lit + rim;

  // Thick haze (Mini-Neptune, Puffy). Blend toward atmospheric tint to soften
  // all contrast — puffy planets read as diffuse blobs; mini-Neptunes as
  // muted bands.
  if (u_hazeDensity > 0.0) {
    finalColor = mix(finalColor, u_atmosphereTint * (0.6 + 0.4 * lit), u_hazeDensity);
  }

  // Puffy expansion: brighten rim further so the planet looks diffuse.
  if (u_puffyExpansion > 0.0) {
    float fres = pow(1.0 - max(0.0, dot(nW, v)), 2.0);
    finalColor += u_atmosphereTint * fres * u_puffyExpansion * 0.8;
  }

  #if defined(GAS_HOT_JUPITER)
    // Day-side incandescence: white-yellow glow scaled by sunFacing.
    float sunDot = max(0.0, dot(nW, s));
    finalColor += u_thermalColor * u_thermalIntensity * pow(sunDot, 0.8);
    // Terminator wind-streaks: sinusoidal band brightness along longitude at
    // the day/night boundary.
    float terminator = 1.0 - abs(dot(nW, s));
    float latDeg = degrees(asin(clamp(n.y, -1.0, 1.0)));
    float streaks = 0.5 + 0.5 * sin(latDeg * 0.6 + u_time * 0.5);
    finalColor += u_thermalColor * terminator * streaks * u_thermalIntensity * 0.25;
  #endif

  finalColor *= limb;

  fragColor = vec4(finalColor, 1.0);
}
