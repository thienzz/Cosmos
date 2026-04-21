// Cosmos Explorer — main-sequence star fragment shader (T41).
//
// Doc references:
//   - Doc 17 §ENT-1010..§ENT-1019, §ENT-1021 (MK classes + L/T/Y brown
//     dwarfs + "main sequence general" bucket).
//   - Doc 18 §Star Rendering (corona widths, granulation octaves, limb
//     darkening coefficients, bloom targets per class).
//   - Doc 33 §4.2 spectral → colour mapping (TS-VQA-001 tolerance).
//
// Variant selection — mutually exclusive per compile:
//   SPECTRAL_O / _B / _A  — hot, sparse granulation, no spots, tight corona.
//   SPECTRAL_F / _G / _K  — solar-like granulation + spots + chromosphere.
//   SPECTRAL_M            — dense granulation, large spots, random flares.
//   SPECTRAL_L / _T / _Y  — brown dwarf: cloud-dominated, no corona/spots.
//   SPECTRAL_MS           — class-unknown bucket; reads only uniforms.
//
// CLAUDE.md Rule #1: zero texture samplers. Everything procedural.
// CLAUDE.md Rule #6: logarithmic depth when USE_LOGARITHMIC_DEPTH_BUFFER on.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"

// ---- palette uniforms (from MAINSEQ_PALETTES) -----------------------------

// @param u_coreColor        — Doc 18 core hex per class (#0080FF O, #FFFF99 G...).
uniform vec3  u_coreColor;
// @param u_haloColor        — Doc 17 photosphere noise overlay (e.g. O-type #6688FF).
uniform vec3  u_haloColor;
// @param u_spotColor        — Doc 17 "Spot color" (#CC8800 G, #441111 M).
uniform vec3  u_spotColor;
// @param u_chromosphereColor — Doc 17 chromospheric glow / plage (#FFFFCC G).
uniform vec3  u_chromosphereColor;
// @param u_limbColor        — Doc 17 "Limb: darkened edge" tint.
uniform vec3  u_limbColor;

// ---- feature magnitudes (from MAINSEQ_PARAMS) -----------------------------

// @param u_temperatureK     — effective surface K, used by MS-general blend.
uniform float u_temperatureK;
// @param u_coronaWidth      — Doc 18 "Corona width × starRadius" (0.3 for O, 0.22 for K).
uniform float u_coronaWidth;
// @param u_granulationOctaves — Doc 17 "FBM octaves" (float; cast to int in fbm call).
uniform float u_granulationOctaves;
// @param u_granulationAmp   — Doc 17 "amplitude" 0.06–0.15 per class.
uniform float u_granulationAmp;
// @param u_voronoiBlend     — Doc 17 "Voronoi overlay opacity" 0–0.5.
uniform float u_voronoiBlend;
// @param u_spotDensity      — Doc 17 "Sunspot density" 0 (O) to 0.4 (M-type).
uniform float u_spotDensity;
// @param u_limbDarkening    — Doc 18 "Limb darkening coefficient" exponent.
uniform float u_limbDarkening;
// @param u_bloomIntensity   — Doc 18 per-class bloom target (used for rim boost).
uniform float u_bloomIntensity;
// @param u_twinkleStrength  — surface scintillation amplitude.
uniform float u_twinkleStrength;
// @param u_flareRate        — Doc 17 M-type "1-10 per day" compressed to display Hz.
uniform float u_flareRate;
// @param u_time             — seconds since scene start.
uniform float u_time;
// @param u_sunDir           — world-space illumination direction (unused for
//   self-emissive stars but kept for API parity with the planet shader).
uniform vec3  u_sunDir;

// ---- Sun (ENT-1007) Doc 22 toggle uniforms --------------------------------
// Only consumed inside SPECTRAL_G branch. Declared unconditionally so that
// material.uniforms resolves direct names; unused branches optimize away.
uniform float u_radiativeZone;
uniform float u_convectionZone;
uniform float u_helioseismicModes;
uniform float u_granulation;
uniform float u_supergranulation;
uniform float u_facularBrightening;
uniform float u_spiculeTexture;
uniform float u_photosphericInflation;
uniform float u_chromosphereLayer;
uniform float u_spiculeForest;
uniform float u_mottledTexture;
uniform float u_limbProminences;
uniform float u_coronaHaze;
uniform float u_coronalLoops;
uniform float u_helmetStreamers;
uniform float u_coronalMassEjections;
uniform float u_coronalDimming;
uniform float u_sunspots;
uniform float u_spotMagneticField;
uniform float u_solarFlares;
uniform float u_eruptiveProminences;
uniform float u_plageRegions;
uniform float u_magneticFieldLines;
uniform float u_polarityReversal;
uniform float u_polarCoronalHoles;
uniform float u_heliosphereBoundary;
uniform float u_solarWindStreaks;
uniform float u_interplanetaryMagneticField;
uniform float u_coronalRadiationZones;

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

// ---------------------------------------------------------------------------
// Granulation — FBM + Voronoi convection cells. Both domains are advected by
// u_time so cells evolve over ~20-minute real equivalents (compressed).
// ---------------------------------------------------------------------------
vec3 granulation(vec3 n) {
  // Advect both domains slowly — Doc 18 "granulation animation 0.05 units/s".
  vec3 p = n + vec3(u_time * 0.02, 0.0, u_time * 0.01);
  int  oct = int(clamp(u_granulationOctaves, 1.0, 8.0));
  // Real solar granules are ~1000 km vs Sun radius 696 000 km ≈ 1/700 of
  // radius. Our Voronoi was at frequency 4.0 which painted fist-sized
  // polygons across the visible disk (user report: "pumpkin" look). Bump to
  // 40 so cells sub-sample the disk at ~30 cells across — fine enough to
  // read as texture rather than tiling, and the FBM blends them into a
  // soft, smoothly-glowing surface.
  float fbm = cosmos_fbm(p * 6.0, oct);
  float cells = 1.0 - cosmos_voronoi(p * 40.0).x;      // bright rims, dark centers
  float mixed = mix(fbm, cells, u_voronoiBlend);
  float g = (mixed - 0.5) * u_granulationAmp * 2.0;    // centered on 0

  // Colour: brightest edges take haloColor, dark lanes take spotColor
  // (scaled down so M-type dark lanes don't go fully black). Keep the dark
  // side bright enough (0.78×) that the overall surface reads as emissive
  // — real stars don't have visible "shadow" patches.
  vec3 base = u_coreColor;
  base = mix(base, u_haloColor, smoothstep(0.0, u_granulationAmp, g));
  base = mix(base, u_coreColor * 0.78, smoothstep(0.0, u_granulationAmp, -g));
  return base;
}

// ---------------------------------------------------------------------------
// Starspot field — low-frequency Voronoi threshold. Disabled when spotDensity
// is 0 (O/B/A classes and brown dwarfs).
// ---------------------------------------------------------------------------
float spotMask(vec3 n) {
  if (u_spotDensity <= 0.0) return 0.0;
  // Real sunspots on the Sun are ~20 000 km across on a 1.4M km disc —
  // roughly 1/70 of the diameter. Old frequency 5.0 painted polygon-sized
  // patches that read as wallpaper, not spots; 50.0 shrinks them to
  // small, recognisable dark specks scattered across the photosphere.
  vec2 v = cosmos_voronoi(n * 50.0 + vec3(u_time * 0.01));
  float t = 1.0 - u_spotDensity;
  return smoothstep(t, t - 0.15, v.y);
}

// ---------------------------------------------------------------------------
// Flare burst — only active when SPECTRAL_M defined. Picks random surface
// cells, brightens them for a fraction of a second (Doc 17 M-type flare spec).
// ---------------------------------------------------------------------------
float flareBurst(vec3 n) {
  #ifdef SPECTRAL_M
    if (u_flareRate <= 0.0) return 0.0;
    float cellHash = cosmos_hash31(floor(n * 20.0));
    // Quantized time bin: once per ~1/u_flareRate seconds on average.
    float tBin = floor(u_time * u_flareRate + cellHash * 13.7);
    float trigger = cosmos_hash31(vec3(tBin, cellHash * 97.0, 0.0));
    float burst = smoothstep(0.95, 1.0, trigger);
    // Local cell fall-off (only the hashed cell brightens).
    float cellFall = smoothstep(0.0, 0.3, cosmos_voronoi(n * 20.0).x);
    return burst * (1.0 - cellFall);
  #else
    return 0.0;
  #endif
}

// ---------------------------------------------------------------------------
// Corona rim-glow. Doc 18: bright chromospheric ring on the lit terminator.
// For brown dwarfs coronaWidth == 0 → skipped.
// ---------------------------------------------------------------------------
vec3 coronaGlow(vec3 nW, vec3 v) {
  if (u_coronaWidth <= 0.0) return vec3(0.0);
  float mu  = abs(dot(nW, v));
  float rim = pow(1.0 - mu, 2.0);                      // concentrated at limb
  return u_chromosphereColor * rim * u_coronaWidth * u_bloomIntensity;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);
  vec3 nW = normalize(v_normalW);
  vec3 v  = normalize(v_viewDirW);

  // Base surface assembly.
  vec3 surface;

  #if defined(SPECTRAL_L) || defined(SPECTRAL_T) || defined(SPECTRAL_Y)
    // Brown dwarfs: cloud-dominated. Very low-amplitude FBM, mixing
    // coreColor ↔ spotColor (iron / silicate / ammonia tints). No corona.
    vec3 p = n * 2.5 + vec3(u_time * 0.004);
    float cloud = cosmos_fbm(p, int(clamp(u_granulationOctaves, 1.0, 8.0)));
    surface = mix(u_coreColor, u_spotColor, cloud * u_granulationAmp * 15.0);
  #else
    // Sequence-like path: granulation + optional spots + flare hotspots.
    surface = granulation(n);

    float spot = spotMask(n);
    surface = mix(surface, u_spotColor, spot);

    // Plage-like brightening around spots (Doc 17 "Plages: #FFFFCC").
    float plage = smoothstep(0.0, 0.2, spot) * (1.0 - spot);
    surface = mix(surface, u_chromosphereColor, plage * 0.25);

    // M-type optical-continuum flare brightening.
    float flare = flareBurst(n);
    surface = mix(surface, u_chromosphereColor, flare);
  #endif

  // Surface twinkle / scintillation — tiny temporal jitter.
  float twinkle = (cosmos_hash31(n * 500.0 + vec3(u_time * 0.5)) - 0.5)
                * u_twinkleStrength;
  surface *= 1.0 + twinkle;

  // Limb darkening — I(µ) = 1 − u·(1 − µ^N) approximated via exponent form.
  // Real solar photosphere drops to ~30 % brightness only at µ=0.1 (very
  // close to the geometric edge). Exponent form `µ^(1/α)` with α≈0.6 would
  // send µ=0.5 to 0.31 (user-reported "shadow"). Use the proper linear
  // model — still honours u_limbDarkening but keeps µ∈[0.3,1] visibly
  // bright, so the Sun reads as a uniformly glowing disk with just a hint
  // of rim dimming, not a half-lit ball.
  float mu = max(0.0, dot(nW, v));
  float u  = clamp(u_limbDarkening * 0.35, 0.0, 0.95);
  float limb = 1.0 - u * (1.0 - mu);

  // -------------------------------------------------------------------------
  // Doc 22 ENT-1007 Sun-specific toggle effects. Each uniform is 0..1 and
  // gates a named visual. Gated by SPECTRAL_G so G-type Sun is the only
  // variant affected. Other MS classes silently ignore these.
  // -------------------------------------------------------------------------
  #ifdef SPECTRAL_G
    float rimG = pow(1.0 - mu, 2.2);

    // Radiative zone — soft core glow on disk centre.
    surface += u_chromosphereColor * 0.15 * u_radiativeZone
             * smoothstep(0.2, 0.9, mu);

    // Convection zone — boosts dark-lane contrast.
    surface *= mix(0.82, 1.0, u_convectionZone);

    // Helioseismic modes — standing-wave ripple (blue-white).
    float shm = sin(n.x * 9.0 + u_time * 0.4)
              * sin(n.y * 7.0) * sin(n.z * 8.0);
    surface += vec3(0.03, 0.05, 0.09) * shm * u_helioseismicModes;

    // Granulation toggle — OFF flattens surface toward core colour.
    surface = mix(u_coreColor * 0.85, surface, u_granulation);

    // Supergranulation — low-freq brightness modulation.
    float supGr = cosmos_fbm(n * 2.5 + vec3(u_time * 0.02), 2);
    surface *= 1.0 + (supGr - 0.5) * 0.10 * u_supergranulation;

    // Compute spot-presence value for plage/facular effects.
    float spotV = spotMask(n);

    // Facular brightening — near-spot brightening.
    float facMask = smoothstep(0.05, 0.25, spotV) * (1.0 - spotV);
    surface += u_chromosphereColor * facMask * 0.25 * u_facularBrightening;

    // Spicule texture — fine hashed needle grain.
    float sp = cosmos_hash31(n * 90.0) * 0.05;
    surface += vec3(sp) * u_spiculeTexture;

    // Photospheric inflation — micro relief.
    float roughP = (cosmos_hash31(n * 18.0) - 0.5) * 0.12;
    surface *= 1.0 + roughP * u_photosphericInflation;

    // Chromosphere layer — H-alpha rim reddening.
    surface += vec3(1.0, 0.42, 0.29) * rimG * 0.28 * u_chromosphereLayer;

    // Spicule forest — pink needle density at limb.
    float needles = rimG
                  * (0.5 + 0.5 * sin(atan(n.z, n.x) * 140.0 + u_time * 1.2));
    surface += vec3(1.0, 0.545, 0.498) * needles * 0.20 * u_spiculeForest;

    // Mottled texture — voronoi fine detail.
    float mott = 1.0 - cosmos_voronoi(n * 28.0).x;
    surface *= 1.0 + (mott - 0.5) * 0.08 * u_mottledTexture;

    // Limb prominences — arched plasma at edge.
    float promPhase = atan(n.z, n.x) * 3.0 + u_time * 0.8;
    float prom = rimG * max(0.0, sin(promPhase));
    surface += vec3(1.0, 0.35, 0.35) * pow(prom, 2.0) * 0.35 * u_limbProminences;

    // Coronal haze — extended rim tint.
    surface += vec3(0.94, 0.90, 0.82) * rimG * 0.20 * u_coronaHaze;

    // Coronal loops — bright equatorial-biased arcs.
    float equator = exp(-pow(n.y * 2.2, 2.0));
    float loops = max(0.0, sin(n.x * 22.0) * sin(n.z * 22.0 + u_time * 0.3));
    surface += vec3(1.0) * loops * equator * 0.12 * u_coronalLoops;

    // Helmet streamers — equator-concentrated extended glow.
    surface += vec3(1.0, 0.98, 0.80) * equator * rimG * 0.30 * u_helmetStreamers;

    // Coronal mass ejection — stochastic bright plume.
    float cmeT = floor(u_time * 0.25);
    float cmeHash = cosmos_hash31(vec3(cmeT, 11.0, 3.0));
    float cmeActive = step(0.80, cmeHash);
    float cmeFade = 1.0 - fract(u_time * 0.25);
    float cmeDir = smoothstep(0.55, 1.0, dot(n,
      normalize(vec3(
        cosmos_hash31(vec3(cmeT, 21.0, 0.0)) - 0.5,
        cosmos_hash31(vec3(cmeT, 22.0, 0.0)) - 0.5,
        cosmos_hash31(vec3(cmeT, 23.0, 0.0)) - 0.5))));
    surface += vec3(1.0) * cmeActive * cmeFade * cmeDir * 0.5
             * u_coronalMassEjections;

    // Coronal dimming — localized darkening after CMEs.
    surface *= 1.0 - rimG * 0.35 * u_coronalDimming;

    // Sunspots gate — OFF brightens dark spot regions back to base.
    surface = mix(surface + u_spotColor * spotV * 0.9, surface, u_sunspots);

    // Spot magnetic field — red/blue dipole lines around spots.
    float mfPhase = sin(length(n.xz) * 36.0 + spotV * 28.0);
    surface += mix(vec3(0.25, 0.41, 0.88), vec3(0.86, 0.08, 0.24),
                   step(0.0, mfPhase)) * abs(mfPhase) * spotV * 0.35
             * u_spotMagneticField;

    // Solar flares — bright white flash at stochastic sites.
    float flareH = cosmos_hash31(floor(n * 14.0)
                 + vec3(floor(u_time * 0.6)));
    float flareBurstG = smoothstep(0.96, 1.0, flareH)
                     * (1.0 - fract(u_time * 0.6));
    surface += vec3(1.0, 0.99, 0.80) * flareBurstG * 0.60 * u_solarFlares;

    // Eruptive prominences — time-modulated limb arcs.
    float eruptPhase = u_time * 0.45 + sin(atan(n.z, n.x) * 4.3);
    float erupt = max(0.0, sin(eruptPhase)) * rimG * 0.5;
    surface += vec3(1.0, 0.50, 0.31) * erupt * u_eruptiveProminences;

    // Plage regions — bright facular patches around spots.
    float plageV = smoothstep(0.0, 0.25, spotV) * (1.0 - spotV);
    surface += u_chromosphereColor * plageV * 0.30 * u_plageRegions;

    // Global magnetic field lines — dipole pattern.
    float gfPhase = sin(n.x * 6.0 + n.y * 7.0 + u_time * 0.04);
    surface += mix(vec3(0.25, 0.41, 0.88), vec3(0.86, 0.08, 0.24),
                   step(0.0, gfPhase)) * abs(gfPhase) * 0.05
             * u_magneticFieldLines;

    // Polarity reversal — hemisphere tint asymmetry.
    surface += mix(vec3(-0.05, 0.0,  0.10),
                   vec3( 0.10, 0.0, -0.05),
                   sign(n.y) * 0.5 + 0.5) * u_polarityReversal;

    // Polar coronal holes — polar dark V-shape.
    float polarM = smoothstep(0.55, 1.0, abs(n.y));
    surface *= 1.0 - polarM * 0.35 * u_polarCoronalHoles;

    // Heliosphere boundary — soft blue rim.
    float helioB = smoothstep(0.85, 1.0, 1.0 - mu);
    surface += vec3(0.53, 0.81, 0.92) * helioB * 0.18 * u_heliosphereBoundary;

    // Solar wind streaks — radial equatorial wisps.
    float windT = atan(n.z, n.x) * 22.0 + u_time * 0.7;
    float wind = max(0.0, sin(windT)) * equator * rimG;
    surface += vec3(1.0) * wind * 0.25 * u_solarWindStreaks;

    // Interplanetary magnetic field — Parker spiral pattern.
    float spiralP = sin(length(n.xz) * 11.0 - atan(n.z, n.x) * 3.2
                      + u_time * 0.12);
    surface += mix(vec3(0.25, 0.41, 0.88), vec3(0.86, 0.08, 0.24),
                   step(0.0, spiralP)) * abs(spiralP) * 0.09
             * u_interplanetaryMagneticField;

    // Coronal radiation zones — banded yellow glow.
    float bandsR = 0.5 + 0.5 * sin(n.y * 5.0 + u_time * 0.25);
    surface += vec3(1.0, 1.0, 0.60) * bandsR * rimG * 0.30
             * u_coronalRadiationZones;
  #endif

  // MS-general bucket (ENT-1021): blend surface with blackbody-ish tint
  // nudged by u_temperatureK. Cooler T biases toward limbColor; hotter T
  // biases toward chromosphereColor. No-op when T near 5800 K.
  #ifdef SPECTRAL_MS
    float tNorm = clamp((u_temperatureK - 3000.0) / 9000.0, 0.0, 1.0);
    vec3 tempTint = mix(u_limbColor, u_chromosphereColor, tNorm);
    surface = mix(surface, tempTint, 0.15);
  #endif

  vec3 lit  = surface * limb;
  vec3 rim  = coronaGlow(nW, v);
  vec3 color = lit + rim;

  // Silence unused-uniform warnings (u_sunDir may not be read above).
  color += u_sunDir * 0.0;

  fragColor = vec4(color, 1.0);
}
