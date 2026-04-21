// Cosmos Explorer — rocky-planet fragment shader (Doc 18 §Rocky Planets,
// §Exotic Planet Types). T42 expansion: 14 variants covering every
// rocky-composition ENT-ID from Doc 17.
//
// Variant selection via `#define ROCKY_*` (new canonical names) with
// back-compat aliases kept for the original T13 `PLANET_*` defines so
// SolarSystemRenderer / PlanetGalleryRenderer T13 paths continue to work.
//
//   ROCKY_MERCURY       ENT-2010   (alias PLANET_MERCURY)
//   ROCKY_VENUS         ENT-2011   (alias PLANET_VENUS)
//   ROCKY_EARTH         ENT-2012   (alias PLANET_EARTH)
//   ROCKY_MARS          ENT-2013   (alias PLANET_MARS)
//   ROCKY_SUPER_EARTH   ENT-2031
//   ROCKY_MAGMA         ENT-2035
//   ROCKY_OCEAN         ENT-2036
//   ROCKY_CARBON        ENT-2037
//   ROCKY_IRON          ENT-2038
//   ROCKY_DESERT        ENT-2039
//   ROCKY_ROGUE         ENT-2040
//   ROCKY_PROTOPLANET   ENT-2042
//   ROCKY_WATER         ENT-2044
//   ROCKY_CHTHONIAN     ENT-2050
//
// CLAUDE.md Rule #1: fully procedural. No textures. Noise primitives from
// lib/noise.glsl; lighting helpers from lib/lighting.glsl.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"

// Back-compat alias bridge so old #define PLANET_* continues to work. ----
#if defined(PLANET_MERCURY) && !defined(ROCKY_MERCURY)
  #define ROCKY_MERCURY
#endif
#if defined(PLANET_VENUS) && !defined(ROCKY_VENUS)
  #define ROCKY_VENUS
#endif
#if defined(PLANET_EARTH) && !defined(ROCKY_EARTH)
  #define ROCKY_EARTH
#endif
#if defined(PLANET_MARS) && !defined(ROCKY_MARS)
  #define ROCKY_MARS
#endif

// ---- shared palette uniforms ----------------------------------------------
uniform vec3  u_baseColor;          // dominant equatorial surface hue
uniform vec3  u_highlightColor;     // desert / ray / bright-region tint
uniform vec3  u_shadowColor;        // basin / ocean / dark-terrain tint
uniform vec3  u_poleColor;          // ice-cap / polar region tint
uniform vec3  u_atmosphereTint;     // rim-glow colour
uniform vec3  u_cloudColor;         // cloud layer tint (ignored if clouds = 0)
uniform vec3  u_emissiveColor;      // lava / thermal / rogue infra-red glow

// ---- feature magnitudes ---------------------------------------------------
uniform float u_cloudCoverage;      // 0 = none, 1 = fully cloaked (Venus)
uniform float u_cloudOpacity;       // how much surface shows through clouds
uniform float u_atmosphereStrength; // rim glow intensity
uniform float u_craterIntensity;    // Mercury dominant, Mars mild
uniform float u_polarCapExtent;     // latitude band in degrees (0 = none)
uniform float u_nightEmission;      // Earth city lights, 0 elsewhere
uniform float u_limbDarkening;      // Doc 18 per-body coefficient
uniform float u_ambientFloor;       // dark-side floor (0.02–0.15)
uniform float u_emissiveStrength;   // magma/rogue/chthonian self-emission 0–2
uniform float u_specularStrength;   // iron/carbon facet specular highlight
uniform float u_oceanLevel;         // 0 = none, 1 = global. Controls water mask.
uniform float u_terrainRoughness;   // crater/mountain scale modulator
uniform float u_time;
uniform vec3  u_sunDir;             // world-space sun direction

// ---- T52 Doc 22 Earth feature toggles (ENT-2043) --------------------------
// Only active inside #ifdef ROCKY_EARTH branches; safe 0-defaults for other
// rocky bodies that share this shader. Default values match Doc 22's
// `defaultOn` field for ENT-2043 (1.0 = ON).
uniform float u_continents;         // land visibility
uniform float u_oceanCoverage;      // ocean mask strength
uniform float u_polarIce;           // ice cap visibility
uniform float u_volcanism;          // sparse volcanic glow spots
uniform float u_rayleighLimb;       // blue atmospheric rim strength multiplier
uniform float u_ozoneLayer;         // purple ozone tint in upper atmosphere
uniform float u_greenhouseEffect;   // warm IR false-colour overlay
uniform float u_cloudSystems;       // cloud layer visibility
uniform float u_cyclones;           // cyclone spiral overlay
uniform float u_seasonalChange;     // seasonal polar-cap & vegetation drift
uniform float u_vegetationRedEdge;  // NIR biomarker land brightening
uniform float u_oceanChlorophyll;   // phytoplankton green ocean tint
uniform float u_o2Signature;        // O2 absorption stripe in atmosphere
uniform float u_cityLights;         // nightside artificial light
uniform float u_magneticShield;     // dipole field-line overlay
uniform float u_aurora;             // polar aurora emission

// ---- T52 Doc 22 Mercury (ENT-2010) feature toggles -----------------------
// u_regolith and u_craters shared with Mars block; declare Mercury-only names.
uniform float u_raySystem;
uniform float u_spaceWeathering;
uniform float u_plainTerrain;
uniform float u_peakRingBasins;
uniform float u_secondaryCraters;
uniform float u_craterShadows;
uniform float u_ejectaBlankets;
uniform float u_rupesScarp;
uniform float u_ridgeOrientation;
uniform float u_basinRings;
uniform float u_calorisDepression;
uniform float u_calorisRidges;
uniform float u_antipodalHills;
uniform float u_permanentShadow;
uniform float u_waterIce;
uniform float u_craterColdZones;
uniform float u_sodiumTail;
uniform float u_hydrogenCorona;
uniform float u_dayglowEffect;
uniform float u_subsolarGlow;
uniform float u_nightSideCold;
uniform float u_mercuryMagFieldLines;
uniform float u_mercuryMagnetotail;

// ---- T52 Doc 22 Mars (ENT-2013) feature toggles --------------------------
uniform float u_regolith;
uniform float u_craters;
uniform float u_vallesMarineris;
uniform float u_olympusMons;
uniform float u_dichotomy;
uniform float u_tharsis;
uniform float u_lavaPlains;
uniform float u_fissureVents;
uniform float u_wrinkleRidges;
uniform float u_northPolarCap;
uniform float u_southPolarCap;
uniform float u_permanentFrost;
uniform float u_seasonalSublimation;
uniform float u_dustStorms;
uniform float u_dustDevils;
uniform float u_dustStreaks;
uniform float u_diurnalDustOpacity;
uniform float u_riverDeltas;
uniform float u_subsurfaceWater;
uniform float u_ancientLakes;
uniform float u_atmosphereHaze;
uniform float u_cO2Clouds;
uniform float u_fossilAnomalies;
uniform float u_magnetizationStripes;
uniform float u_settlements;
uniform float u_solarPanels;

// ---- T52 Doc 22 Venus (ENT-2011) feature toggles -------------------------
uniform float u_cloudDeck;
uniform float u_equatorialStreaks;
uniform float u_polarVortex;
uniform float u_cloudAsymmetry;
uniform float u_hadleyCell;
uniform float u_superRotation;
uniform float u_windShear;
uniform float u_thermalTides;
uniform float u_hazeLayer;
uniform float u_radiativeOpacity;
uniform float u_aerosolGradient;
uniform float u_basaltSurface;
uniform float u_pancakeDomes;
uniform float u_tessera;
uniform float u_lightningFlashes;
uniform float u_lightningGlow;
uniform float u_nightsideFlash;
uniform float u_southDipole;
uniform float u_dipoleOscillation;
uniform float u_hydrogenTail;
uniform float u_limbBrighten;
uniform float u_subsolarBright;
uniform float u_nightsideGlow;

in vec3 v_modelPos;
in vec3 v_surfaceNormal;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

// Log-depth pairing with planet.vert — see that file for the "Sun bleeds
// through Earth" backstory.  logDepthBufFC is auto-uploaded by Three.js.
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

// ---------------------------------------------------------------------------
// Latitude helper — the body's north pole is +Y. Latitude is negated to
// match the CLAUDE convention where +lat = northern hemisphere.
// ---------------------------------------------------------------------------
float latitudeDegrees(vec3 n) {
  return degrees(asin(clamp(n.y, -1.0, 1.0)));
}

// ---------------------------------------------------------------------------
// Crater field — shared by Mercury, Mars, Protoplanet, Chthonian.
// Voronoi F1 gives a sharp rim; radial ray systems radiate from the
// brightest cells. Domain scale modulated by u_terrainRoughness.
// ---------------------------------------------------------------------------
vec3 craterLayer(vec3 baseColor, vec3 n, float scale) {
  vec2 craters = cosmos_voronoi(n * scale);
  float rim = smoothstep(0.12, 0.0, craters.x) * u_craterIntensity;
  float floor_ = smoothstep(0.0, 0.35, craters.x);
  vec3 withCrater = mix(u_shadowColor, baseColor, floor_);
  withCrater += rim * 0.3;
  if (craters.y > 0.95) {
    vec3 ray = normalize(n - vec3(craters.y, 0.5, -craters.y));
    float rayMask = pow(max(0.0, dot(n, ray)), 12.0);
    withCrater += u_highlightColor * rayMask * 0.35 * u_craterIntensity;
  }
  return withCrater;
}

// ---------------------------------------------------------------------------
// Mercury-only variant using the Doc 18 canonical crater density.
// ---------------------------------------------------------------------------
#ifdef ROCKY_MERCURY
vec3 surfaceMercury(vec3 n) {
  return craterLayer(u_baseColor, n, 12.0);
}
#endif

// ---------------------------------------------------------------------------
// Continent / biome field (Earth + Super-Earth + Ocean World shallow variant)
// Domain-warped fbm carves continents, ocean fills the shadow tint,
// mountains/desert/forest blend by altitude+latitude.
// ---------------------------------------------------------------------------
vec3 earthLikeSurface(vec3 n, float continentThreshold, float desertAmp) {
  #ifdef ROCKY_EARTH
  // T52: per-Doc22 seasonal drift shifts the continent threshold over time,
  // pushing vegetation/ice boundaries up and down with the year.
  float season = u_seasonalChange > 0.5 ? 0.05 * sin(u_time * 0.05) : 0.0;
  continentThreshold += season;
  #endif

  float continents = cosmos_warpedFbm(n * 2.5, 5);
  float land = smoothstep(continentThreshold - 0.03, continentThreshold + 0.03, continents);
  float ocean = 1.0 - land;

  float latAbs = abs(latitudeDegrees(n));
  float desertBand = exp(-pow((latAbs - 25.0) / 10.0, 2.0)) * desertAmp;
  float ice = smoothstep(u_polarCapExtent - 6.0, u_polarCapExtent, latAbs);

  #ifdef ROCKY_EARTH
  // Toggle gating — when ocean/continent/ice flipped OFF, zero their masks.
  land  *= u_continents;
  ocean *= u_oceanCoverage;
  ice   *= u_polarIce;
  // Seasonal ice expansion: caps advance/retreat ±8° over the year.
  if (u_seasonalChange > 0.5) {
    float seasonIce = 8.0 * sin(u_time * 0.05);
    ice = smoothstep(u_polarCapExtent - 6.0 - seasonIce, u_polarCapExtent - seasonIce, latAbs) * u_polarIce;
  }
  #endif

  vec3 color = u_shadowColor;

  #ifdef ROCKY_EARTH
  // Ocean chlorophyll — phytoplankton green tint in productive zones.
  if (u_oceanChlorophyll > 0.5) {
    float bloom = smoothstep(0.4, 0.6, cosmos_fbm(n * 6.0 + vec3(u_time * 0.002), 3));
    float productive = bloom * ocean * smoothstep(20.0, 55.0, latAbs); // coastal upwelling / polar blooms
    color = mix(color, vec3(0.16, 0.42, 0.35), productive * 0.65);
  }
  #endif

  float shelf = smoothstep(continentThreshold - 0.06, continentThreshold - 0.02, continents) * ocean;
  color = mix(color, u_shadowColor * 1.35, shelf);

  vec3 landColor = u_baseColor;
  landColor = mix(landColor, u_highlightColor, desertBand);
  float mountain = smoothstep(0.65, 0.8, continents);
  landColor = mix(landColor, vec3(0.55, 0.50, 0.45), mountain);

  #ifdef ROCKY_EARTH
  // Vegetation red edge — biomarker NIR brightening of vegetated land.
  if (u_vegetationRedEdge > 0.5) {
    float veg = (1.0 - desertBand) * (1.0 - mountain) * land;
    landColor = mix(landColor, vec3(0.56, 0.78, 0.44), veg * 0.55);
  }
  // Volcanic activity — sparse glowing vents on land.
  float volcEmit = 0.0;
  if (u_volcanism > 0.5) {
    vec2 vents = cosmos_voronoi(n * 22.0);
    volcEmit = smoothstep(0.03, 0.0, vents.x) * step(0.88, vents.y) * land;
    landColor = mix(landColor, vec3(1.0, 0.28, 0.04), volcEmit);
  }
  #endif

  color = mix(color, landColor, land);
  color = mix(color, u_poleColor, ice);
  return color;
}

// ---------------------------------------------------------------------------
// Venus surface — barely visible through 92-bar cloud deck. fbm gives
// volcanic plains; latitude-banded upper cloud decks dominate.
// ---------------------------------------------------------------------------
#ifdef ROCKY_VENUS
vec3 surfaceVenus(vec3 n) {
  float tessera = cosmos_fbm(n * 6.0, 4);
  return mix(u_baseColor, u_shadowColor, tessera);
}
#endif

// ---------------------------------------------------------------------------
// Mars surface — iron-oxide base modulated by bright albedo regions and
// dark basalt lowlands. Polar caps dominate at the right latitude.
// ---------------------------------------------------------------------------
#ifdef ROCKY_MARS
vec3 surfaceMars(vec3 n) {
  float albedo = cosmos_fbm(n * 3.0, 5);
  vec3 color = mix(u_shadowColor, u_highlightColor, smoothstep(0.3, 0.7, albedo));
  color = mix(color, u_baseColor, 0.6);

  float lat = abs(latitudeDegrees(n));
  float cap = smoothstep(u_polarCapExtent - 5.0, u_polarCapExtent, lat);
  cap += n.y > 0.0 ? 0.1 * sin(u_time * 0.002) : 0.0;
  color = mix(color, u_poleColor, clamp(cap, 0.0, 1.0));

  vec2 craters = cosmos_voronoi(n * 15.0);
  float rim = smoothstep(0.08, 0.0, craters.x) * u_craterIntensity;
  color = mix(color, u_shadowColor, rim * 0.6);
  return color;
}
#endif

// ---------------------------------------------------------------------------
// Super-Earth — Earth-like but compressed relief (lower continent variance)
// and a thicker haze applied downstream via larger u_atmosphereStrength.
// ---------------------------------------------------------------------------
#ifdef ROCKY_SUPER_EARTH
vec3 surfaceSuperEarth(vec3 n) {
  return earthLikeSurface(n, 0.50, 0.7);
}
#endif

// ---------------------------------------------------------------------------
// Magma / Lava World (ENT-2035) — molten crust with Voronoi cracks revealing
// glowing lava. Animated crack phase → convection. Doc 18 §Lava/Magma World.
// ---------------------------------------------------------------------------
#ifdef ROCKY_MAGMA
vec3 surfaceMagma(vec3 n, out float emissionMask) {
  vec2 cells = cosmos_voronoi(n * 10.0 + vec3(u_time * 0.02, 0.0, 0.0));
  float crackPhase = 0.5 + 0.5 * sin(u_time * 0.3 + cells.y * 6.28);
  float cracks = smoothstep(0.05, 0.2, cells.x) * (0.4 + 0.4 * crackPhase);
  cracks = 1.0 - cracks;                                   // 1 at crack centre
  float cellVariation = cosmos_fbm(n * 4.0, 3);
  vec3 crust = mix(u_shadowColor, u_baseColor, cellVariation);
  vec3 lava  = mix(u_baseColor, u_highlightColor, crackPhase);
  emissionMask = cracks;
  return mix(crust, lava, cracks);
}
#endif

// ---------------------------------------------------------------------------
// Ocean World (ENT-2036) — global water surface with Gerstner-style ripples
// and coastal shelf hints. Specular handled downstream via u_specularStrength.
// ---------------------------------------------------------------------------
#ifdef ROCKY_OCEAN
vec3 surfaceOcean(vec3 n) {
  vec3 p = n * 4.0 + vec3(u_time * 0.01, 0.0, 0.0);
  float ripple = cosmos_fbm(p, 5);
  float current = cosmos_warpedFbm(n * 1.5, 3);
  vec3 deep = u_shadowColor;
  vec3 shallow = u_baseColor;
  vec3 color = mix(deep, shallow, smoothstep(0.4, 0.6, current));
  color += (ripple - 0.5) * 0.08;

  float latAbs = abs(latitudeDegrees(n));
  float ice = smoothstep(u_polarCapExtent - 4.0, u_polarCapExtent, latAbs);
  return mix(color, u_poleColor, ice);
}
#endif

// ---------------------------------------------------------------------------
// Carbon / Diamond World (ENT-2037) — graphite base with crystalline facet
// highlights; optional tar-lake dark patches.
// ---------------------------------------------------------------------------
#ifdef ROCKY_CARBON
vec3 surfaceCarbon(vec3 n) {
  float facet = cosmos_valueNoise(n * 18.0);
  float tarField = cosmos_fbm(n * 2.5, 4);
  float tar = smoothstep(0.55, 0.65, tarField);
  vec3 graphite = mix(u_baseColor, u_highlightColor, facet);
  vec3 tarColor = u_shadowColor;                           // near-black
  return mix(graphite, tarColor, tar);
}
#endif

// ---------------------------------------------------------------------------
// Iron Planet (ENT-2038) — polished metal with oxidized rust patches.
// Fresnel-driven specular handled downstream; surface just assigns base/rust.
// ---------------------------------------------------------------------------
#ifdef ROCKY_IRON
vec3 surfaceIron(vec3 n) {
  float rustField = cosmos_fbm(n * 3.5, 5);
  float rust = smoothstep(0.45, 0.7, rustField);
  vec3 steel = u_baseColor;
  vec3 ox    = u_highlightColor;
  vec3 color = mix(steel, ox, rust);
  // Craters (impacts) remain visible.
  vec2 craters = cosmos_voronoi(n * 10.0);
  float rim = smoothstep(0.1, 0.0, craters.x) * u_craterIntensity;
  color = mix(color, u_shadowColor, rim * 0.5);
  return color;
}
#endif

// ---------------------------------------------------------------------------
// Desert World (ENT-2039) — dune patterns + canyons + polar ice caps; dust
// storm tint modulated by u_cloudCoverage.
// ---------------------------------------------------------------------------
#ifdef ROCKY_DESERT
vec3 surfaceDesert(vec3 n) {
  // Directional dune noise — stretches along latitude bands.
  vec3 dunePos = n * vec3(6.0, 2.0, 6.0);
  float dunes = cosmos_fbm(dunePos, 5);
  float canyons = cosmos_warpedFbm(n * 3.0, 4);
  float cn = smoothstep(0.3, 0.45, canyons);               // canyon floor mask
  vec3 sand = mix(u_baseColor, u_highlightColor, dunes);
  vec3 canyonFloor = u_shadowColor;
  vec3 color = mix(canyonFloor, sand, cn);

  float latAbs = abs(latitudeDegrees(n));
  float cap = smoothstep(u_polarCapExtent - 4.0, u_polarCapExtent, latAbs);
  return mix(color, u_poleColor, cap);
}
#endif

// ---------------------------------------------------------------------------
// Rogue Planet (ENT-2040) — nearly black sphere with faint thermal IR glow
// from radioactive decay. emissionMask = radial glow from interior.
// ---------------------------------------------------------------------------
#ifdef ROCKY_ROGUE
vec3 surfaceRogue(vec3 n, out float emissionMask) {
  float frost = cosmos_fbm(n * 4.0, 4);
  vec3 darkRock = mix(u_shadowColor, u_baseColor, frost);
  // Frozen-volatile frost patches near the poles.
  float latAbs = abs(latitudeDegrees(n));
  float capWeight = smoothstep(u_polarCapExtent - 8.0, u_polarCapExtent, latAbs);
  vec3 withFrost = mix(darkRock, u_poleColor, capWeight * 0.6);
  // Weak interior-heat mask (uniform; dipped by noise so texture shows).
  emissionMask = 0.4 + 0.4 * frost;
  return withFrost;
}
#endif

// ---------------------------------------------------------------------------
// Protoplanet (ENT-2042) — high crater density + molten impact zones.
// ---------------------------------------------------------------------------
#ifdef ROCKY_PROTOPLANET
vec3 surfaceProto(vec3 n, out float emissionMask) {
  vec3 craterBase = craterLayer(u_baseColor, n, 9.0);
  // Molten impact zones — random Voronoi cells marked "hot".
  vec2 hotCells = cosmos_voronoi(n * 4.5);
  float heat = smoothstep(0.7, 1.0, hotCells.y);
  emissionMask = heat;
  return mix(craterBase, u_highlightColor, heat * 0.7);
}
#endif

// ---------------------------------------------------------------------------
// Water World (ENT-2044) — deep ocean blue-black with subtle thermal glow
// from internal heat (hydrothermal). Different tint than ROCKY_OCEAN.
// ---------------------------------------------------------------------------
#ifdef ROCKY_WATER
vec3 surfaceWater(vec3 n, out float emissionMask) {
  vec3 p = n * 3.0 + vec3(u_time * 0.005, 0.0, 0.0);
  float ripple = cosmos_fbm(p, 6);
  vec3 deep = u_shadowColor;
  vec3 mid  = u_baseColor;
  vec3 color = mix(deep, mid, smoothstep(0.3, 0.7, ripple));
  // Hydrothermal vents — sparse emissive spots.
  vec2 vents = cosmos_voronoi(n * 7.0);
  float vent = smoothstep(0.05, 0.0, vents.x) * step(0.85, vents.y);
  emissionMask = vent * 0.5;
  return color;
}
#endif

// ---------------------------------------------------------------------------
// Chthonian Planet (ENT-2050) — stripped gas giant core. Silicate variant:
// volcanic cracks + thermal glow. Appearance close to magma but with metal
// sheen rather than flowing lava.
// ---------------------------------------------------------------------------
#ifdef ROCKY_CHTHONIAN
vec3 surfaceChthonian(vec3 n, out float emissionMask) {
  vec3 craterBase = craterLayer(u_baseColor, n, 8.0);
  vec2 veins = cosmos_voronoi(n * 12.0);
  float veinMask = smoothstep(0.15, 0.0, veins.x);
  emissionMask = veinMask;
  return mix(craterBase, u_highlightColor, veinMask * 0.6);
}
#endif

// ---------------------------------------------------------------------------
// Cloud layer — shared for Venus/Earth/Super-Earth/Desert (dust). Advected
// westward by time, thicker near latitude bands per body. Output .w = alpha.
// ---------------------------------------------------------------------------
vec4 cloudLayer(vec3 n) {
  vec3 p = n * 3.5 + vec3(u_time * 0.004, 0.0, 0.0);
  float c1 = cosmos_fbm(p, 4);
  float c2 = cosmos_fbm(p * 2.2 + vec3(0.0, u_time * 0.002, 0.0), 3);
  float clouds = mix(c1, c2, 0.55);

  float lat = latitudeDegrees(n);
  #ifdef ROCKY_VENUS
    float latWeight = 1.0 - abs(abs(lat) - 45.0) / 90.0;
  #else
    float latWeight = 1.0;
  #endif

  float density = clamp(clouds * u_cloudCoverage * latWeight, 0.0, 1.0);

  #ifdef ROCKY_EARTH
  // Toggle gating: u_cloudSystems collapses the density, u_cyclones boosts
  // large rotating convective towers at 3 fixed "storm tracks".
  density *= u_cloudSystems;
  if (u_cyclones > 0.5) {
    // Three synthetic cyclone centers that rotate with time — spiral arms
    // modulate cloud opacity in a radial cosine pattern around each centre.
    float cyc = 0.0;
    for (int i = 0; i < 3; i++) {
      float phi = float(i) * 2.0943951 + u_time * 0.1;
      vec3 centre = normalize(vec3(cos(phi), 0.25 * sin(phi * 0.8 + 1.0), sin(phi)));
      float d = acos(clamp(dot(n, centre), -1.0, 1.0));
      if (d < 0.22) {
        float ang = atan(dot(cross(centre, n), vec3(0.0, 1.0, 0.0)), dot(n, centre) - cos(0.22));
        float spiral = 0.5 + 0.5 * cos(ang * 5.0 - d * 30.0);
        cyc = max(cyc, spiral * smoothstep(0.22, 0.0, d));
      }
    }
    density = clamp(density + cyc * 0.5, 0.0, 1.0);
  }
  #endif

  return vec4(u_cloudColor, density);
}

// ---------------------------------------------------------------------------
// City-light emission (Earth only). Lights cluster in continental interiors
// at 30-60° latitude; clouds occlude.
// ---------------------------------------------------------------------------
vec3 cityLights(vec3 n, float sunFacing, float cloudDensity) {
  #ifdef ROCKY_EARTH
    // T52: Doc 22 u_cityLights (default OFF) gates emission. u_nightEmission
    // still multiplies for magnitude control via PlanetMaterial params.
    if (u_cityLights <= 0.0 || u_nightEmission <= 0.0) return vec3(0.0);
    float continents = cosmos_warpedFbm(n * 2.5, 4);
    float isLand = smoothstep(0.48, 0.54, continents);
    float populated = smoothstep(0.55, 0.75, continents);
    float lat = abs(latitudeDegrees(n));
    float habitable = smoothstep(60.0, 30.0, lat);
    float night = 1.0 - smoothstep(-0.1, 0.1, sunFacing);
    float cityMask = isLand * populated * habitable * night
                   * (1.0 - cloudDensity * 0.7);
    return vec3(1.0, 0.85, 0.55) * cityMask * u_nightEmission * u_cityLights;
  #else
    return vec3(0.0);
  #endif
}

// ---------------------------------------------------------------------------
// Aurora (Earth only).
// ---------------------------------------------------------------------------
vec3 auroraLayer(vec3 n, float sunFacing) {
  #ifdef ROCKY_EARTH
    // T52: gate aurora by Doc 22 u_aurora toggle (default OFF).
    if (u_aurora <= 0.0) return vec3(0.0);
    float lat = abs(latitudeDegrees(n));
    float oval = exp(-pow((lat - 70.0) / 4.0, 2.0));
    float nightSide = 1.0 - smoothstep(-0.2, 0.05, sunFacing);
    float wave = 0.7 + 0.3 * sin(u_time * 0.3 + n.x * 12.0);
    vec3 green = vec3(0.0, 1.0, 0.3) * oval;
    vec3 red   = vec3(1.0, 0.1, 0.2) * exp(-pow((lat - 78.0) / 3.0, 2.0));
    return (green + red * 0.4) * nightSide * wave * 0.6 * u_aurora;
  #else
    return vec3(0.0);
  #endif
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);   // body-frame surface normal
  vec3 nW = normalize(v_normalW);          // world-frame for lighting
  vec3 v  = normalize(v_viewDirW);
  vec3 s  = normalize(u_sunDir);

  // Per-variant surface sample. `emissionMask` drives self-illumination for
  // worlds with internal heat (magma, rogue, water vents, protoplanet,
  // chthonian). It stays 0 for ordinary rocky bodies.
  vec3 surface;
  float emissionMask = 0.0;

  #if defined(ROCKY_MERCURY)
    surface = surfaceMercury(n);
  #elif defined(ROCKY_VENUS)
    surface = surfaceVenus(n);
  #elif defined(ROCKY_EARTH)
    surface = earthLikeSurface(n, 0.51, 1.0);
  #elif defined(ROCKY_MARS)
    surface = surfaceMars(n);
  #elif defined(ROCKY_SUPER_EARTH)
    surface = surfaceSuperEarth(n);
  #elif defined(ROCKY_MAGMA)
    surface = surfaceMagma(n, emissionMask);
  #elif defined(ROCKY_OCEAN)
    surface = surfaceOcean(n);
  #elif defined(ROCKY_CARBON)
    surface = surfaceCarbon(n);
  #elif defined(ROCKY_IRON)
    surface = surfaceIron(n);
  #elif defined(ROCKY_DESERT)
    surface = surfaceDesert(n);
  #elif defined(ROCKY_ROGUE)
    surface = surfaceRogue(n, emissionMask);
  #elif defined(ROCKY_PROTOPLANET)
    surface = surfaceProto(n, emissionMask);
  #elif defined(ROCKY_WATER)
    surface = surfaceWater(n, emissionMask);
  #elif defined(ROCKY_CHTHONIAN)
    surface = surfaceChthonian(n, emissionMask);
  #else
    surface = u_baseColor;
  #endif

  // Lighting terms.
  float sunFacing = dot(nW, s);
  float lit = cosmos_diffuse(nW, s, u_ambientFloor);
  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  float rimStrength = u_atmosphereStrength;
  #ifdef ROCKY_EARTH
  // T52: Doc 22 u_rayleighLimb directly scales the atmospheric rim glow.
  rimStrength *= u_rayleighLimb;
  #endif
  vec3 rim = cosmos_rimGlow(nW, v, s, u_atmosphereTint, rimStrength);

  #ifdef ROCKY_EARTH
  // T52: Doc 22 u_ozoneLayer — UV-absorbing ozone band tints the upper
  // atmosphere a subtle purple-blue on the day-side limb.
  if (u_ozoneLayer > 0.5) {
    float rimFactor = 1.0 - abs(dot(nW, v));
    float daySide = max(0.0, sunFacing);
    rim += vec3(0.40, 0.28, 0.65) * rimFactor * rimFactor * daySide * 0.25;
  }
  #endif

  // Clouds (Earth/Venus/Super-Earth/Desert). Skipped for airless bodies via
  // cloudCoverage = 0 making the resulting alpha zero.
  vec4 clouds = cloudLayer(n);
  vec3 cloudShaded = clouds.rgb * max(u_ambientFloor, sunFacing * 0.9 + 0.1);
  vec3 colorLit = surface * lit;
  colorLit = mix(colorLit, cloudShaded, clouds.a * u_cloudOpacity);

  // Self-emission (lava / rogue / protoplanet / water vent / chthonian).
  colorLit += u_emissiveColor * emissionMask * u_emissiveStrength;

  // Specular highlight (iron/carbon/ocean/water). Blinn-Phong style; cheap.
  if (u_specularStrength > 0.0) {
    vec3 h = normalize(s + v);
    float spec = pow(max(0.0, dot(nW, h)), 48.0);
    colorLit += vec3(1.0) * spec * u_specularStrength * max(0.0, sunFacing);
  }

  // Emissives (city lights, aurora). Clouds dim them but don't kill.
  colorLit += cityLights(n, sunFacing, clouds.a);
  colorLit += auroraLayer(n, sunFacing);

  // Atmospheric limb glow (sits on top of lit term; always positive).
  colorLit += rim;

  // ---------------------------------------------------------------------
  // T52 Doc 22 ENT-2010 (Mercury) toggle effects.
  // ---------------------------------------------------------------------
  #ifdef ROCKY_MERCURY
  {
    float latDegMe = latitudeDegrees(n);
    float latAbsMe = abs(latDegMe);
    float lonMe = atan(n.z, n.x);
    float dayMe = max(0.0, sunFacing);
    float nightMe = max(0.0, -sunFacing);
    float rimMuMe = 1.0 - abs(dot(nW, v));

    // Regolith — dusty surface baseline (OFF brightens).
    colorLit = mix(colorLit * 0.9, colorLit, u_regolith);

    // Ray system — bright radial streaks from young craters.
    float rayPhase = sin(lonMe * 9.0 + latDegMe * 5.0);
    colorLit += vec3(0.90, 0.85, 0.75)
              * smoothstep(0.92, 0.98, rayPhase) * 0.35 * u_raySystem;

    // Space weathering — darkens exposed surfaces.
    float weatherH = cosmos_hash31(floor(n * 6.0));
    colorLit = mix(colorLit, colorLit * 0.75, weatherH * 0.25 * u_spaceWeathering);

    // Plain terrain — smoother inter-crater plains.
    float plain = cosmos_fbm(n * 4.0, 2);
    colorLit += vec3(0.04) * smoothstep(0.45, 0.65, plain) * 0.35 * u_plainTerrain;

    // Craters — already gated via main craterLayer; extra darkening.
    vec2 crMe = cosmos_voronoi(n * 13.0);
    float crRim2 = smoothstep(0.10, 0.0, crMe.x);
    colorLit = mix(colorLit, colorLit * 0.70, crRim2 * 0.5 * u_craters);

    // Peak ring basins — medium-size double-rim features.
    float prbH = cosmos_hash31(floor(n * 5.0) + vec3(3.0));
    colorLit = mix(colorLit, vec3(0.42, 0.38, 0.32),
                   step(0.88, prbH) * 0.35 * u_peakRingBasins);

    // Secondary craters — small sharp pockmarks.
    float scH = cosmos_hash31(floor(n * 35.0));
    colorLit = mix(colorLit, vec3(0.25, 0.22, 0.18),
                   step(0.92, scH) * 0.30 * u_secondaryCraters);

    // Crater shadows — darkens crater floors on the day side.
    colorLit = mix(colorLit, vec3(0.0), crRim2 * dayMe * 0.35 * u_craterShadows);

    // Ejecta blankets — bright halo around craters.
    float ejecta = smoothstep(0.35, 0.15, crMe.x) * (1.0 - crRim2);
    colorLit += vec3(0.75, 0.70, 0.60) * ejecta * 0.25 * u_ejectaBlankets;

    // Rupes scarp — long cliff line.
    float rupesPhase = sin(lonMe * 3.5 + latDegMe * 2.0);
    colorLit += vec3(0.15) * smoothstep(0.92, 0.97, rupesPhase) * 0.35 * u_rupesScarp;

    // Ridge orientation — NS/EW preferred banding.
    float ridge = sin(latDegMe * 1.5) * sin(lonMe * 1.5);
    colorLit += vec3(0.06) * abs(ridge) * 0.25 * u_ridgeOrientation;

    // Basin rings — concentric bright rings around big impacts.
    float ringR = length(n.xz) * 12.0 + latDegMe * 0.1;
    colorLit += vec3(0.10) * (0.5 + 0.5 * sin(ringR)) * 0.20 * u_basinRings;

    // Caloris depression — huge dark basin at lon ~180°.
    float calLon = mod(lonMe - 3.14 + 3.14159, 6.28318) - 3.14159;
    float calMask = exp(-pow(calLon / 0.55, 2.0)
                      - pow((latDegMe - 30.0) / 30.0, 2.0));
    colorLit = mix(colorLit, vec3(0.22, 0.18, 0.15), calMask * 0.55 * u_calorisDepression);

    // Caloris ridges — concentric bright ridges around Caloris.
    float calRing = abs(sin(length(vec2(calLon, (latDegMe - 30.0) * 0.03)) * 18.0));
    colorLit += vec3(0.30, 0.25, 0.20) * calRing * smoothstep(0.3, 0.8, calMask) * u_calorisRidges;

    // Antipodal hills — chaotic terrain opposite Caloris.
    float antiLon = mod(lonMe + 3.14159, 6.28318) - 3.14159;
    float antiMask = exp(-pow(antiLon / 0.55, 2.0)
                       - pow((latDegMe + 30.0) / 30.0, 2.0));
    float chaos = cosmos_fbm(n * 15.0, 4);
    colorLit += vec3(0.25, 0.20, 0.15) * antiMask * chaos * 0.40 * u_antipodalHills;

    // Permanent shadow — dark crater interiors at high lat.
    float psMask = step(0.97, cosmos_hash31(floor(n * 18.0) + vec3(5.0)))
                 * smoothstep(65.0, 85.0, latAbsMe);
    colorLit *= 1.0 - psMask * 0.9 * u_permanentShadow;

    // Water ice — faint bright patches in polar shadows.
    float wiH = cosmos_hash31(floor(n * 22.0) + vec3(7.0));
    colorLit += vec3(0.75, 0.80, 0.85) * step(0.97, wiH)
              * smoothstep(70.0, 85.0, latAbsMe) * 0.55 * u_waterIce;

    // Crater cold zones — slightly blue-tinted polar craters.
    colorLit += vec3(-0.02, 0.0, 0.05) * smoothstep(60.0, 80.0, latAbsMe)
              * 0.5 * u_craterColdZones;

    // Sodium tail — orange diffuse nightside plume.
    colorLit += vec3(0.95, 0.55, 0.25) * nightMe * rimMuMe * 0.18 * u_sodiumTail;

    // Hydrogen corona — faint rim halo.
    colorLit += vec3(0.55, 0.45, 0.80) * rimMuMe * rimMuMe * 0.12 * u_hydrogenCorona;

    // Dayglow effect — bright subsolar haze.
    colorLit += vec3(0.8, 0.7, 0.55) * dayMe * (1.0 - rimMuMe) * 0.15 * u_dayglowEffect;

    // Subsolar glow — point-like bright spot facing sun.
    colorLit += vec3(1.0, 0.85, 0.65) * pow(dayMe, 5.0) * 0.30 * u_subsolarGlow;

    // Night side cold — deep blue tint on night hemisphere.
    colorLit += vec3(-0.05, 0.0, 0.10) * nightMe * u_nightSideCold;

    // Magnetic field lines (rebranded uniforms to avoid Mars conflict).
    float mfPh = sin(lonMe * 4.0 + latDegMe * 3.0 + u_time * 0.05);
    colorLit += mix(vec3(0.25, 0.41, 0.88), vec3(0.88, 0.22, 0.22),
                    step(0.0, mfPh)) * abs(mfPh) * 0.06 * u_mercuryMagFieldLines;

    // Magnetotail — nightside reddish tint.
    colorLit += vec3(0.65, 0.35, 0.35) * nightMe * 0.10 * u_mercuryMagnetotail;
  }
  #endif

  // ---------------------------------------------------------------------
  // T52 Doc 22 ENT-2013 (Mars) toggle effects.
  // ---------------------------------------------------------------------
  #ifdef ROCKY_MARS
  {
    float latDegM = latitudeDegrees(n);
    float latAbsM = abs(latDegM);
    float lonM = atan(n.z, n.x);

    // Regolith — red-brown base tint, toggle brightens when off.
    colorLit = mix(colorLit * 0.85, colorLit, u_regolith);

    // Craters — gated crater-rim contrast.
    vec2 cr = cosmos_voronoi(n * 15.0);
    float crRim = smoothstep(0.08, 0.0, cr.x);
    colorLit = mix(colorLit, colorLit * 0.7, crRim * 0.5 * u_craters);

    // Valles Marineris — long equatorial canyon at lon ~-60°.
    float vmLat = 0.0;
    float vmLonR = lonM + 1.05;
    vmLonR = mod(vmLonR + 3.14159, 6.28318) - 3.14159;
    float vmMask = exp(-pow((latDegM - vmLat) / 6.0, 2.0))
                 * exp(-pow(vmLonR / 0.45, 2.0));
    colorLit = mix(colorLit, vec3(0.16, 0.10, 0.06), vmMask * 0.55 * u_vallesMarineris);

    // Olympus Mons — huge shield volcano at ~18°N lon~226°.
    float omLat = 18.0 * 0.01745;
    float omLon = -2.33;
    float omLonD = mod(lonM - omLon + 3.14159, 6.28318) - 3.14159;
    float omMask = exp(-pow((asin(n.y) - omLat) / 0.15, 2.0)
                     - pow(omLonD / 0.15, 2.0));
    colorLit += vec3(0.55, 0.28, 0.13) * omMask * 0.55 * u_olympusMons;

    // Dichotomy — hemispheric split (north lowlands lighter).
    colorLit = mix(colorLit, colorLit * 1.15, step(0.0, n.y) * 0.25 * u_dichotomy);

    // Tharsis rise — broad bulge at lon ~-100°.
    float thLonD = mod(lonM - (-1.75) + 3.14159, 6.28318) - 3.14159;
    float thMask = exp(-pow(thLonD / 0.8, 2.0)) * exp(-pow(latDegM / 30.0, 2.0));
    colorLit += vec3(0.60, 0.35, 0.15) * thMask * 0.30 * u_tharsis;

    // Lava plains — basalt-dark patches.
    float lavaP = smoothstep(0.35, 0.55, cosmos_fbm(n * 4.0 + vec3(7.0), 3));
    colorLit = mix(colorLit, vec3(0.24, 0.15, 0.10), lavaP * 0.35 * u_lavaPlains);

    // Fissure vents — sparse dark cracks.
    float ventH = cosmos_hash31(floor(n * 20.0) + vec3(1.0));
    colorLit = mix(colorLit, vec3(0.10, 0.06, 0.04), step(0.95, ventH) * 0.45 * u_fissureVents);

    // Wrinkle ridges — linear brightening lines at low lat.
    float wrPhase = sin(lonM * 8.0 + latDegM * 0.5);
    colorLit += vec3(0.08) * smoothstep(0.7, 0.9, wrPhase) * 0.30 * u_wrinkleRidges;

    // North polar cap — bright white above +65°.
    float npc = smoothstep(65.0, 80.0, latDegM);
    colorLit = mix(colorLit, u_poleColor, npc * 0.85 * u_northPolarCap);

    // South polar cap — bright white below -65°.
    float spc = smoothstep(65.0, 80.0, -latDegM);
    colorLit = mix(colorLit, u_poleColor, spc * 0.85 * u_southPolarCap);

    // Permanent frost — small perennial patches just outside polar caps.
    float frostH = cosmos_hash31(floor(n * 30.0) + vec3(3.0));
    colorLit = mix(colorLit, vec3(0.9), step(0.96, frostH)
                              * smoothstep(50.0, 70.0, latAbsM) * 0.6 * u_permanentFrost);

    // Seasonal sublimation — time-varying cap size change.
    float season = 5.0 * sin(u_time * 0.04);
    float sMask = smoothstep(60.0 - season, 75.0 - season, latAbsM);
    colorLit = mix(colorLit, u_poleColor * 0.8, sMask * 0.15 * u_seasonalSublimation);

    // Dust storms — time-modulated orange haze patches.
    float stormM = 0.5 + 0.5 * sin(u_time * 0.2 + n.x * 3.0) * cosmos_fbm(n * 4.0, 2);
    colorLit = mix(colorLit, vec3(0.82, 0.55, 0.30),
                   smoothstep(0.65, 0.95, stormM) * 0.55 * u_dustStorms);

    // Dust devils — small transient bright spots.
    float ddH = cosmos_hash31(floor(n * 25.0) + vec3(floor(u_time * 2.0)));
    colorLit += vec3(0.9, 0.7, 0.5) * step(0.97, ddH) * 0.40 * u_dustDevils;

    // Dust streaks — thin linear brightening.
    float dsPhase = sin(lonM * 6.0 + latDegM * 3.0);
    colorLit += vec3(0.85, 0.65, 0.45) * smoothstep(0.85, 0.95, dsPhase) * 0.25 * u_dustStreaks;

    // Diurnal dust opacity — blends surface toward haze tint.
    float day = max(0.0, sunFacing);
    colorLit = mix(colorLit, vec3(0.85, 0.65, 0.48), day * 0.15 * u_diurnalDustOpacity);

    // River deltas — dark meandering lines at low-mid lat.
    float delta = smoothstep(0.62, 0.68, cosmos_fbm(n * 10.0 + vec3(4.0), 3));
    colorLit = mix(colorLit, vec3(0.18, 0.10, 0.05), delta * 0.35 * u_riverDeltas);

    // Subsurface water — subtle blue tint in mid-latitudes.
    colorLit += vec3(-0.02, 0.0, 0.06)
              * smoothstep(30.0, 60.0, latAbsM) * u_subsurfaceWater;

    // Ancient lakes — round dark basins.
    float lakeH = cosmos_hash31(floor(n * 8.0) + vec3(5.0));
    colorLit = mix(colorLit, vec3(0.10, 0.07, 0.05), step(0.92, lakeH) * 0.45 * u_ancientLakes);

    // Atmosphere haze — soft pink rim.
    float rimMu = 1.0 - abs(dot(nW, v));
    colorLit += vec3(0.95, 0.70, 0.50) * rimMu * rimMu * 0.20 * u_atmosphereHaze;

    // CO2 clouds — wispy high-altitude streaks.
    float co2 = smoothstep(0.6, 0.75, cosmos_fbm(n * 5.0 + vec3(u_time * 0.05), 2));
    colorLit += vec3(1.0) * co2 * 0.15 * u_cO2Clouds;

    // Fossil anomalies — speculative tiny purple markers.
    float fossilH = cosmos_hash31(floor(n * 40.0) + vec3(13.0));
    colorLit += vec3(0.75, 0.31, 0.78) * step(0.98, fossilH) * 0.50 * u_fossilAnomalies;

    // Magnetization stripes — parallel banded pattern at high latitude.
    float magS = sin(latDegM * 2.0);
    colorLit += vec3(0.25, 0.41, 0.88) * step(0.5, magS)
              * smoothstep(40.0, 80.0, latAbsM) * 0.08 * u_magnetizationStripes;

    // Settlements — sparse yellow nightside dots (speculative).
    float nightM = max(0.0, -sunFacing);
    float setH = cosmos_hash31(floor(n * 18.0) + vec3(21.0));
    colorLit += vec3(1.0, 0.88, 0.50) * step(0.97, setH) * nightM * 0.6 * u_settlements;

    // Solar panels — bluish reflective patches.
    float spH = cosmos_hash31(floor(n * 22.0) + vec3(31.0));
    colorLit += vec3(0.40, 0.60, 0.90) * step(0.98, spH) * day * 0.4 * u_solarPanels;
  }
  #endif

  // ---------------------------------------------------------------------
  // T52 Doc 22 ENT-2011 (Venus) toggle effects.
  // ---------------------------------------------------------------------
  #ifdef ROCKY_VENUS
  {
    float latDegV = latitudeDegrees(n);
    float latAbsV = abs(latDegV);
    float lonV = atan(n.z, n.x);
    float dayV = max(0.0, sunFacing);

    // Cloud deck — primary yellowish sulfuric cloud tint.
    colorLit = mix(colorLit * 0.85, colorLit, u_cloudDeck);

    // Equatorial streaks — horizontal bright bands.
    float eqB = smoothstep(0.85, 1.0,
               0.5 + 0.5 * sin(latDegV * 0.4 + lonV * 6.0 + u_time * 0.1));
    colorLit += vec3(0.92, 0.78, 0.56) * eqB * smoothstep(25.0, 0.0, latAbsV) * 0.30 * u_equatorialStreaks;

    // Polar vortex — swirling mask at both poles.
    float pv = smoothstep(60.0, 85.0, latAbsV)
             * (0.5 + 0.5 * sin(lonV * 2.0 + sign(n.y) * u_time * 0.6));
    colorLit = mix(colorLit, vec3(0.69, 0.60, 0.38), pv * 0.40 * u_polarVortex);

    // Cloud asymmetry — N/S bias subtle tint.
    colorLit += vec3(0.03, 0.01, -0.01) * n.y * u_cloudAsymmetry;

    // Hadley cell — latitude-banded subtle modulation.
    colorLit += vec3(0.05, 0.04, 0.03) * cos(latDegV * 0.06) * u_hadleyCell;

    // Super-rotation — UV-style dark bands (time-moving).
    float srPhase = sin(lonV * 4.0 - u_time * 1.2);
    colorLit = mix(colorLit, colorLit * 0.8, smoothstep(0.7, 0.95, srPhase) * 0.35 * u_superRotation);

    // Wind shear — sharp inter-band lines.
    float shear = smoothstep(0.97, 1.0, sin(latDegV * 12.0));
    colorLit += vec3(0.1) * shear * 0.25 * u_windShear;

    // Thermal tides — subsolar warm glow.
    colorLit += vec3(0.25, 0.16, 0.06) * dayV * 0.15 * u_thermalTides;

    // Haze layer — additional upper-atmosphere limb softening.
    float rimMuV = 1.0 - abs(dot(nW, v));
    colorLit += vec3(0.90, 0.78, 0.55) * rimMuV * rimMuV * 0.20 * u_hazeLayer;

    // Radiative opacity — tints the entire surface warmer.
    colorLit *= mix(vec3(0.9, 0.85, 0.78), vec3(1.0), 1.0 - u_radiativeOpacity);

    // Aerosol gradient — pole-to-equator slight color shift.
    colorLit += vec3(0.05, 0.03, -0.02)
              * smoothstep(30.0, 70.0, latAbsV) * u_aerosolGradient;

    // Basalt surface — darker tessera patches (visible through thin clouds).
    float basalt = cosmos_fbm(n * 5.0, 3);
    colorLit = mix(colorLit, vec3(0.30, 0.20, 0.12), step(0.55, basalt) * 0.20 * u_basaltSurface);

    // Pancake domes — round bright features.
    float pdH = cosmos_hash31(floor(n * 12.0) + vec3(17.0));
    colorLit += vec3(0.70, 0.55, 0.35) * step(0.93, pdH) * 0.30 * u_pancakeDomes;

    // Tessera — complex ridged terrain (sharp noise).
    float tess = cosmos_fbm(n * 18.0, 4);
    colorLit += vec3(0.08) * smoothstep(0.55, 0.75, tess) * u_tessera;

    // Lightning flashes — sparse bright strobes.
    float lightH = cosmos_hash31(floor(n * 20.0) + vec3(floor(u_time * 4.0)));
    float lightM = step(0.996, lightH);
    colorLit += vec3(1.0) * lightM * 0.75 * u_lightningFlashes;

    // Lightning glow — broader halo around recent flashes.
    colorLit += vec3(0.6, 0.7, 1.0) * lightM * 0.35 * u_lightningGlow;

    // Nightside ashen glow — dim purple-red emission on night side.
    float nightV = max(0.0, -sunFacing);
    colorLit += vec3(0.30, 0.10, 0.15) * nightV * 0.20 * u_nightsideFlash;

    // South dipole — blue tint near south pole (induced magnetic).
    float sdM = smoothstep(-90.0, -50.0, latDegV);
    colorLit += vec3(0.2, 0.3, 0.7) * sdM * 0.10 * u_southDipole;

    // Dipole oscillation — time-modulated dipole tint.
    float dOsc = 0.5 + 0.5 * sin(u_time * 0.3);
    colorLit += vec3(0.15, 0.20, 0.50) * sdM * dOsc * 0.10 * u_dipoleOscillation;

    // Hydrogen tail — faint orange nightside plume.
    colorLit += vec3(0.9, 0.45, 0.25) * nightV * (1.0 - rimMuV) * 0.12 * u_hydrogenTail;

    // Limb brightening — inverse of limb darkening.
    colorLit += vec3(0.2) * rimMuV * rimMuV * u_limbBrighten;

    // Subsolar brightening — center-facing area boosted.
    colorLit += vec3(0.15) * pow(dayV, 3.0) * u_subsolarBright;

    // Nightside glow — uniform faint orange on night hemisphere.
    colorLit += vec3(0.30, 0.18, 0.10) * nightV * 0.20 * u_nightsideGlow;
  }
  #endif

  #ifdef ROCKY_EARTH
  // T52 Doc 22 Earth overlays -----------------------------------------------
  // Greenhouse effect — false-colour warm IR bias on the day-side.
  if (u_greenhouseEffect > 0.5) {
    float day = max(0.0, sunFacing);
    colorLit = mix(colorLit, colorLit * vec3(1.20, 0.95, 0.75), day * 0.35);
  }
  // Atmospheric O2 signature — faint blue absorption pulse on day-side limb.
  if (u_o2Signature > 0.5) {
    float rimFactor = 1.0 - abs(dot(nW, v));
    float daySide = max(0.0, sunFacing);
    float pulse = 0.5 + 0.5 * sin(u_time * 2.0);
    colorLit += vec3(0.25, 0.55, 0.95) * rimFactor * daySide * 0.18 * pulse;
  }
  // Dipole magnetic field overlay — meridian arcs from pole to pole.
  if (u_magneticShield > 0.5) {
    float lon = atan(n.z, n.x);
    // Six field-line longitudes. Distance to nearest arc drives a glow.
    float loop = 1.0;
    for (int i = 0; i < 6; i++) {
      float target = -3.14159 + float(i) * 1.0472;
      float d = abs(mod(lon - target + 3.14159, 6.28318) - 3.14159);
      loop = min(loop, d);
    }
    float arc = smoothstep(0.07, 0.0, loop);
    // Field lines bulge equatorially toward the sun (compressed dayside).
    float bulge = 1.0 - abs(n.y);
    colorLit += vec3(0.42, 0.42, 1.0) * arc * bulge * 0.45;
  }
  #endif

  // Limb darkening last so it catches every contributor.
  colorLit *= limb;

  fragColor = vec4(colorLit, 1.0);
}
