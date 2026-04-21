// Cosmos Explorer — shared moon fragment shader helpers (T43).
//
// Every moon family shares the same uniform block, varyings, latitude
// helper, and crater / plume primitives. Keeping these in one include
// avoids copy-paste drift between the 6 family shaders.

#ifndef COSMOS_MOON_COMMON_INCLUDED
#define COSMOS_MOON_COMMON_INCLUDED

// ---- shared moon palette uniforms ----------------------------------------
uniform vec3  u_baseColor;
uniform vec3  u_highlightColor;
uniform vec3  u_shadowColor;
uniform vec3  u_poleColor;
uniform vec3  u_atmosphereTint;
uniform vec3  u_emissiveColor;

// ---- feature magnitudes --------------------------------------------------
uniform float u_atmosphereStrength;
uniform float u_emissiveStrength;
uniform float u_plumeIntensity;
uniform float u_craterIntensity;
uniform float u_polarCapExtent;
uniform float u_hazeCoverage;
uniform float u_specularStrength;
uniform float u_terrainRoughness;
uniform float u_tholinAmount;
uniform float u_limbDarkening;
uniform float u_ambientFloor;
uniform float u_time;
uniform vec3  u_sunDir;

// ---- T52 Doc 22 moon toggle uniforms -------------------------------------
// Declared for every moon family. Effects gate by MOON_* #ifdef in the
// family-specific frag file. Unused uniforms compile away.
// Luna (ENT-3001):
uniform float u_highlands;
uniform float u_maria;
uniform float u_mariaBoundary;
uniform float u_swirls;
uniform float u_craters;
uniform float u_tychoCrater;
uniform float u_centralPeaks;
uniform float u_ejectaRays;
uniform float u_secondaryChains;
uniform float u_regolith;
uniform float u_spaceWeathering;
uniform float u_raySystems;
uniform float u_rayDegradation;
uniform float u_earthshine;
uniform float u_earthshineTint;
uniform float u_terminatorShadow;
uniform float u_terminatorGradient;
uniform float u_permanentShadow;
uniform float u_waterIce;
uniform float u_frostRings;
uniform float u_exosphereEmission;
uniform float u_exosphereDust;
uniform float u_apolloSites;
uniform float u_lunarBase;

// Io (ENT-3010) — Doc 22 canonical names:
uniform float u_tidalHeating;
uniform float u_volcanicActivity;
uniform float u_magmaChannels;
uniform float u_lokiPatera;
uniform float u_pateraNetwork;
uniform float u_volcanicCones;
uniform float u_lavaFlowNetwork;
uniform float u_yellowSulfur;
uniform float u_darkSulfur;
uniform float u_sulfurCracks;
uniform float u_moltenLakes;
uniform float u_lavaCrust;
uniform float u_lavaFountains;
uniform float u_umbrellaPlumes;
uniform float u_plumeFallout;
uniform float u_plumeAnimation;
uniform float u_sO2Emission;
uniform float u_sO2Frost;
uniform float u_frostSublimation;
uniform float u_frostContamination;
uniform float u_plasmaGlow;
uniform float u_sodiumCloud;
uniform float u_magneticFootprint;

// Europa (ENT-3011) — Doc 22 canonical names:
uniform float u_iceCrust;
uniform float u_iceThickness;
uniform float u_radiationDarkening;
uniform float u_craterRemnants;
uniform float u_linearLineae;
uniform float u_doubleRidges;
uniform float u_tripleRidges;
uniform float u_linaeAge;
uniform float u_conamaraIceChaos;
uniform float u_chaosBlocks;
uniform float u_chaosUpwelling;
uniform float u_oceanGlow;
uniform float u_thermalSignature;
uniform float u_cryoPlumes;
uniform float u_iceEruptionDeposits;
uniform float u_tidalFractures;
uniform float u_riftZones;
uniform float u_stressDirection;
uniform float u_inducedDipole;
uniform float u_saltDeposits;
uniform float u_saltVariation;

// Ganymede (ENT-3012) — Doc 22 canonical names:
uniform float u_darkTerrain;
uniform float u_darkRays;
uniform float u_magneticAnomaly;
uniform float u_groovedTerrain;
uniform float u_grooveRidges;
uniform float u_grooveOrientation;
uniform float u_crosscuttingGrooves;
uniform float u_gilgameshBasin;
uniform float u_palimpsests;
// u_centralPeaks shared with Luna — already declared above.
uniform float u_rayEjecta;
uniform float u_rayFading;
uniform float u_oceanConvection;
uniform float u_oceanConductivity;
uniform float u_dipoleField;
uniform float u_magneticPoles;
uniform float u_magnetosphereSize;
uniform float u_aurorae;
uniform float u_auroraVariability;

// Titan (ENT-3020) — Doc 22 canonical names:
uniform float u_atmosphereHaze;
uniform float u_upperHaze;
uniform float u_stratosphere;
uniform float u_atmosBands;
uniform float u_tholinHaze;
uniform float u_methaneClouds;
uniform float u_hazeVariation;
uniform float u_bedrockElevation;
uniform float u_xanaduRegion;
uniform float u_krakenMare;
uniform float u_ligeiaMare;
uniform float u_smallLakes;
uniform float u_coastlineDetail;
uniform float u_methaneRain;
uniform float u_cumulonimbusUpper;
uniform float u_windStreaks;
uniform float u_cryoDomes;
uniform float u_cryoLavaFlows;
uniform float u_sandDunes;
uniform float u_duneMigration;
uniform float u_jetStreamWind;
uniform float u_seasonalWindReversal;

// Enceladus (ENT-3021) — Doc 22 canonical names:
uniform float u_whiteIce;
uniform float u_oldTerrain;
uniform float u_iceGrainSize;
uniform float u_tigerStripes;
uniform float u_fractureWallHeight;
uniform float u_fractureGlow;
uniform float u_waterPlumes;
uniform float u_plumeSpreading;
uniform float u_plumeFallback;
uniform float u_eruptionFrequency;
uniform float u_southPolarHeat;
uniform float u_hotspotShifting;
uniform float u_oceanGlowEnc;
uniform float u_oceanThermal;
uniform float u_eringParticles;
uniform float u_ejectionCone;
uniform float u_blueTerrain;

// Shared / cross-moon declarations (Europa/Ganymede reuse these):
uniform float u_magnetotail;
uniform float u_terrainRoughnessMoon;

in vec3 v_modelPos;
in vec3 v_surfaceNormal;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

// ---------------------------------------------------------------------------
// Latitude helper — identical convention to planet-rocky.frag
// (+lat = northern hemisphere). Returned in degrees.
// ---------------------------------------------------------------------------
float moon_latDeg(vec3 n) {
  return degrees(asin(clamp(n.y, -1.0, 1.0)));
}

// ---------------------------------------------------------------------------
// Crater layer — Voronoi F1 rim + radial ray streaks. Shared across rocky
// and extreme families.
// ---------------------------------------------------------------------------
vec3 moon_craterLayer(vec3 base, vec3 n, float scale) {
  vec2 cr = cosmos_voronoi(n * scale);
  float rim = smoothstep(0.12, 0.0, cr.x) * u_craterIntensity;
  float floor_ = smoothstep(0.0, 0.35, cr.x);
  vec3 withCrater = mix(u_shadowColor, base, floor_);
  withCrater += rim * 0.3;
  if (cr.y > 0.95) {
    vec3 ray = normalize(n - vec3(cr.y, 0.5, -cr.y));
    float rayMask = pow(max(0.0, dot(n, ray)), 14.0);
    withCrater += u_highlightColor * rayMask * 0.4 * u_craterIntensity;
  }
  return withCrater;
}

// ---------------------------------------------------------------------------
// Plume halo — polar-focused bloom for geyser / volcanic / cryovolcanic
// moons. South-pole biased (Enceladus, Triton) by default; families that
// want equatorial distribution multiply out the `southMask`.
// ---------------------------------------------------------------------------
float moon_plumeMask(vec3 n, float southBias) {
  float lat = moon_latDeg(n);
  float southMask = mix(1.0, exp(-pow((lat + 70.0) / 15.0, 2.0)), southBias);
  float jitter = cosmos_fbm(n * 12.0 + vec3(u_time * 0.06, 0.0, 0.0), 3);
  float ventField = smoothstep(0.55, 0.8, jitter);
  return ventField * southMask * u_plumeIntensity;
}

#endif
