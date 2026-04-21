// Cosmos Explorer — icy-moon fragment shader (T43).
// Doc 17 §3011 / 3015 / 3017 / 3024 + Doc 18 §Icy Moon / §Cryo-geyser Moon.
//
//   MOON_EUROPA            ENT-3011  Europa — lineae + chaos blocks, sparse plumes
//   MOON_ENCELADUS         ENT-3015  south-pole tiger stripes + 100+ geysers
//   MOON_GANYMEDE          ENT-3017  grooved terrain + dark terrain + polar caps
//                                    + magnetic-aurora polar glow
//   MOON_SUBSURFACE_OCEAN  ENT-3024  generic candidate (Ariel/Titania-like)

#include "lib/noise.glsl"
#include "lib/lighting.glsl"
#include "lib/moon-common.glsl"

out vec4 fragColor;

// Lineae pattern — long directional streaks from tidal stress. Uses
// domain-warped fbm so cracks cross and curve realistically.
float lineaMask(vec3 n, float density) {
  vec3 p = n * 4.0;
  float warp = cosmos_warpedFbm(p, 4);
  float lineField = abs(sin(warp * 12.0 + n.y * 8.0));
  return smoothstep(0.9, 0.98, 1.0 - lineField) * density;
}

// Chaos blocks — Voronoi cells offset from the ice base colour.
vec3 chaosBlocks(vec3 base, vec3 n) {
  vec2 cells = cosmos_voronoi(n * 9.0);
  float block = smoothstep(0.08, 0.0, cells.x);    // cell boundary
  float shade = 0.85 + 0.3 * cells.y;              // per-cell brightness
  return mix(base * shade, u_shadowColor, block * 0.35);
}

// Ganymede grooves — directional sinusoidal ridges along longitude bands.
vec3 groovedTerrain(vec3 base, vec3 n) {
  float lon = atan(n.z, n.x);
  float grooves = sin(lon * 45.0 + cosmos_fbm(n * 2.0, 3) * 4.0);
  grooves = smoothstep(0.3, 0.7, grooves * 0.5 + 0.5);
  vec3 grooved = mix(base, u_highlightColor, grooves * 0.4);
  // Dark-terrain patches fbm-blended.
  float darkField = cosmos_fbm(n * 2.5, 5);
  float dark = smoothstep(0.55, 0.3, darkField);
  return mix(grooved, u_shadowColor, dark * 0.6);
}

// Tiger-stripe south-pole parallel fractures (Enceladus).
float tigerStripes(vec3 n) {
  float lat = moon_latDeg(n);
  float polar = exp(-pow((lat + 75.0) / 10.0, 2.0));
  float lon = atan(n.z, n.x);
  float stripes = abs(sin(lon * 4.0 + 1.0));
  stripes = smoothstep(0.85, 1.0, 1.0 - stripes);
  return stripes * polar;
}

void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);
  vec3 nW = normalize(v_normalW);
  vec3 v  = normalize(v_viewDirW);
  vec3 s  = normalize(u_sunDir);

  vec3 surface = u_baseColor;
  float plumeActivity = 0.0;
  float auroraMask = 0.0;

  #if defined(MOON_EUROPA)
    // Europa: chaos + lineae, very young surface (few craters).
    surface = chaosBlocks(surface, n);
    float lineae = lineaMask(n, 1.0);
    surface = mix(surface, u_shadowColor, lineae);    // rust/salt tint
    plumeActivity = u_plumeIntensity * exp(-pow((moon_latDeg(n) + 60.0) / 25.0, 2.0));
  #elif defined(MOON_ENCELADUS)
    // Enceladus: bright ice + grooved terrain + tiger stripes.
    surface = mix(surface, u_highlightColor, cosmos_fbm(n * 3.0, 5) * 0.3);
    float tiger = tigerStripes(n);
    surface = mix(surface, u_shadowColor, tiger);
    plumeActivity = u_plumeIntensity * (tiger * 3.0
                  + exp(-pow((moon_latDeg(n) + 70.0) / 10.0, 2.0)) * 0.6);
  #elif defined(MOON_GANYMEDE)
    surface = groovedTerrain(surface, n);
    // Magnetic-aurora polar glow — ring near poles, pulses slowly.
    float latAbs = abs(moon_latDeg(n));
    float polar = smoothstep(u_polarCapExtent - 8.0, u_polarCapExtent, latAbs);
    surface = mix(surface, u_poleColor, polar);
    auroraMask = exp(-pow((latAbs - 75.0) / 5.0, 2.0));
  #elif defined(MOON_SUBSURFACE_OCEAN)
    // Generic subsurface-ocean moon — chaos + sparse lineae + faint warm spots.
    surface = chaosBlocks(surface, n);
    float lineae = lineaMask(n, 0.6);
    surface = mix(surface, u_shadowColor, lineae * 0.7);
    // Warm regions over geothermal hotspots.
    vec2 vents = cosmos_voronoi(n * 6.0);
    float vent = smoothstep(0.05, 0.0, vents.x) * step(0.88, vents.y);
    surface = mix(surface, u_emissiveColor, vent * 0.4);
    plumeActivity = u_plumeIntensity * vent;
  #else
    surface = chaosBlocks(surface, n);
  #endif

  // Lighting.
  float sunFacing = dot(nW, s);
  float lit = cosmos_diffuse(nW, s, u_ambientFloor);
  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  vec3 rim = cosmos_rimGlow(nW, v, s, u_atmosphereTint, u_atmosphereStrength);

  vec3 colorLit = surface * lit;

  // Specular sheen — the defining visual of fresh ice.
  if (u_specularStrength > 0.0) {
    vec3 h = normalize(s + v);
    float spec = pow(max(0.0, dot(nW, h)), 64.0);
    colorLit += vec3(1.0) * spec * u_specularStrength * max(0.0, sunFacing);
  }

  // Plume halo — cryovolcanic vents above the limb.
  float fresnel = pow(1.0 - max(0.0, dot(nW, v)), 2.5);
  colorLit += u_emissiveColor * plumeActivity * fresnel * 0.4;

  // Magnetic aurora (Ganymede) — oval glow independent of sun direction.
  #ifdef MOON_GANYMEDE
    float nightSide = 1.0 - smoothstep(-0.25, 0.1, sunFacing);
    colorLit += u_emissiveColor * auroraMask * u_emissiveStrength * nightSide;
  #endif

  // ---------------------------------------------------------------------
  // T52 Doc 22 ENT-3011 (Europa) toggle effects — canonical Doc 22 names.
  // ---------------------------------------------------------------------
  #ifdef MOON_EUROPA
  {
    float latDegE = moon_latDeg(n);
    float latAbsE = abs(latDegE);
    float lonE = atan(n.z, n.x);
    float rimMuE = 1.0 - abs(dot(nW, v));

    // Ice crust — global bright ice surface.
    colorLit = mix(colorLit * 0.85, colorLit, u_iceCrust);

    // Ice thickness — subtle depth tint.
    colorLit += vec3(0.02, 0.05, 0.08) * u_iceThickness;

    // Radiation darkening — orangey tint from radiolysis.
    colorLit += vec3(0.15, 0.08, 0.04) * cosmos_hash31(floor(n * 6.0)) * u_radiationDarkening;

    // Crater remnants — faint old impact marks.
    float crH = cosmos_hash31(floor(n * 10.0) + vec3(3.0));
    colorLit += vec3(0.08) * step(0.90, crH) * 0.25 * u_craterRemnants;

    // Linear lineae — straight brown streaks.
    float linE = lineaMask(n, 1.0);
    colorLit = mix(colorLit, vec3(0.45, 0.30, 0.22), linE * 0.45 * u_linearLineae);

    // Double ridges — bright parallel lines.
    float drPhase = sin(lonE * 25.0 + latDegE * 3.0);
    colorLit += vec3(0.10) * smoothstep(0.90, 0.98, drPhase) * 0.30 * u_doubleRidges;

    // Triple ridges — more complex parallel bands.
    float trPhase = sin(lonE * 40.0 + latDegE * 2.0);
    colorLit += vec3(0.08) * smoothstep(0.92, 0.98, trPhase) * 0.25 * u_tripleRidges;

    // Lineae age — darker/older lineae tint.
    colorLit += vec3(0.05, 0.03, 0.0) * linE * u_linaeAge;

    // Conamara-type ice chaos.
    float conH = cosmos_hash31(floor(n * 8.0) + vec3(9.0));
    colorLit = mix(colorLit, vec3(0.55, 0.45, 0.40), step(0.88, conH) * 0.35 * u_conamaraIceChaos);

    // Chaos blocks — tilted ice rafts.
    float cbH = cosmos_hash31(floor(n * 6.0) + vec3(11.0));
    colorLit += vec3(-0.05) * step(0.82, cbH) * 0.35 * u_chaosBlocks;

    // Chaos upwelling — red-brown staining.
    colorLit += vec3(0.20, 0.10, 0.05) * step(0.88, cbH) * u_chaosUpwelling;

    // Ocean glow — subtle blue from below.
    colorLit += vec3(-0.02, 0.0, 0.08) * u_oceanGlow;

    // Thermal signature — localized warm spots.
    float tsH = cosmos_hash31(floor(n * 12.0) + vec3(13.0));
    colorLit += vec3(0.4, 0.25, 0.15) * step(0.94, tsH) * 0.35 * u_thermalSignature;

    // Cryoplumes — south-pole fountain halo.
    float pfMaskE = exp(-pow((latDegE + 65.0) / 10.0, 2.0)) * rimMuE;
    colorLit += vec3(0.85, 0.90, 1.0) * pfMaskE * 0.40 * u_cryoPlumes;

    // Ice eruption deposits — pale surface spatter.
    colorLit += vec3(0.85) * pfMaskE * 0.25 * u_iceEruptionDeposits;

    // Tidal fractures — sharp radial fracture lines.
    float tfPhase = sin(lonE * 30.0);
    colorLit += vec3(0.12) * smoothstep(0.93, 0.98, tfPhase) * 0.30 * u_tidalFractures;

    // Rift zones — wider extensional bands.
    float rzPhase = sin(latDegE * 8.0);
    colorLit = mix(colorLit, vec3(0.35, 0.25, 0.18),
                   smoothstep(0.92, 0.98, rzPhase) * 0.30 * u_riftZones);

    // Stress direction — fabric-like patterning.
    colorLit += vec3(0.05) * sin(latDegE * 0.5 + lonE) * u_stressDirection;

    // Induced dipole — subtle blue tint modulation.
    float idPhase = sin(lonE * 2.0 + u_time * 0.08);
    colorLit += vec3(0.08, 0.10, 0.18) * idPhase * 0.05 * u_inducedDipole;

    // Magnetotail — nightside reddish tint.
    float nightE = 1.0 - smoothstep(-0.2, 0.1, sunFacing);
    colorLit += vec3(0.45, 0.30, 0.30) * nightE * 0.10 * u_magnetotail;

    // Salt deposits — bright yellow-white patches.
    float sdH = cosmos_hash31(floor(n * 16.0) + vec3(17.0));
    colorLit += vec3(0.95, 0.85, 0.55) * step(0.95, sdH) * 0.35 * u_saltDeposits;

    // Salt variation — hue shift across deposits.
    colorLit += vec3(0.08, 0.05, 0.0) * step(0.80, sdH) * u_saltVariation;
  }
  #endif

  // ---------------------------------------------------------------------
  // T52 Doc 22 ENT-3012 (Ganymede) toggle effects — canonical Doc 22 names.
  // ---------------------------------------------------------------------
  #ifdef MOON_GANYMEDE
  {
    float latDegG = moon_latDeg(n);
    float latAbsG = abs(latDegG);
    float lonG = atan(n.z, n.x);
    float rimMuG = 1.0 - abs(dot(nW, v));
    float nightG = 1.0 - smoothstep(-0.2, 0.1, sunFacing);

    // Dark terrain — ancient cratered areas.
    float darkField = cosmos_fbm(n * 2.5, 5);
    float dark = smoothstep(0.55, 0.3, darkField);
    colorLit = mix(colorLit, colorLit * 0.70, dark * 0.40 * u_darkTerrain);

    // Dark rays — bright crater ejecta on dark terrain.
    float rayPhase = sin(lonG * 8.0 + latDegG * 4.0);
    colorLit += vec3(0.90, 0.85, 0.80)
              * smoothstep(0.92, 0.98, rayPhase) * dark * 0.35 * u_darkRays;

    // Terrain roughness — fine-scale bumpiness.
    colorLit += vec3(0.04) * cosmos_hash31(floor(n * 15.0)) * u_terrainRoughnessMoon;

    // Magnetic anomaly — localized field irregularity tint.
    float maH = cosmos_hash31(floor(n * 4.0) + vec3(23.0));
    colorLit += vec3(0.10, 0.15, 0.35) * step(0.88, maH) * 0.20 * u_magneticAnomaly;

    // Grooved terrain — parallel ridges (already in base surface).
    float grooves = sin(lonG * 45.0 + darkField * 4.0);
    colorLit += vec3(0.10) * smoothstep(0.3, 0.7, grooves * 0.5 + 0.5) * 0.35 * u_groovedTerrain;

    // Groove ridges — peaks of grooves.
    colorLit += vec3(0.15) * smoothstep(0.80, 0.95, grooves * 0.5 + 0.5) * 0.25 * u_grooveRidges;

    // Groove orientation — subtle directionality.
    colorLit += vec3(0.05) * sin(latDegG * 0.3) * u_grooveOrientation;

    // Crosscutting grooves — overlapping different-direction grooves.
    float ccP = sin(lonG * 30.0) + sin(latDegG * 20.0);
    colorLit += vec3(0.08) * smoothstep(1.5, 1.8, abs(ccP)) * 0.25 * u_crosscuttingGrooves;

    // Gilgamesh basin — large dark basin at specific position.
    float gilLat = -60.0 * 0.01745;
    float gilLon = 2.0;
    float gilDist = length(vec2(asin(n.y) - gilLat,
                                mod(lonG - gilLon + 3.14159, 6.28318) - 3.14159));
    colorLit = mix(colorLit, vec3(0.20, 0.18, 0.16),
                   exp(-gilDist * 3.0) * 0.50 * u_gilgameshBasin);

    // Palimpsests — faded circular crater remnants.
    float palH = cosmos_hash31(floor(n * 4.0) + vec3(17.0));
    colorLit += vec3(0.08) * step(0.85, palH) * 0.25 * u_palimpsests;

    // Central peaks — bright crater centers.
    vec2 crG = cosmos_voronoi(n * 14.0);
    float cpMaskG = smoothstep(0.25, 0.45, crG.x);
    colorLit += vec3(0.15) * cpMaskG * 0.30 * u_centralPeaks;

    // Ray ejecta — bright radial streaks from young craters.
    if (crG.y > 0.93) {
      float rayDG = length(n - vec3(crG.y, 0.5, -crG.y));
      colorLit += vec3(0.2) * exp(-rayDG * 2.5) * 0.30 * u_rayEjecta;
    }

    // Ray fading — darker old rays.
    colorLit += vec3(-0.03) * u_rayFading;

    // Ocean convection — subtle blue modulation.
    float ocP = sin(latDegG * 2.0 + u_time * 0.05);
    colorLit += vec3(0.02, 0.04, 0.08) * ocP * u_oceanConvection;

    // Ocean conductivity — tint for inducted field.
    colorLit += vec3(0.03, 0.05, 0.10) * u_oceanConductivity;

    // Dipole field — magnetic lines pattern.
    float dfP = sin(lonG * 3.0 + latDegG * 4.0 + u_time * 0.04);
    colorLit += mix(vec3(0.25, 0.41, 0.88), vec3(0.88, 0.35, 0.25),
                    step(0.0, dfP)) * abs(dfP) * 0.05 * u_dipoleField;

    // Magnetic poles — bright polar hot spots.
    float mpMask = smoothstep(70.0, 85.0, latAbsG);
    colorLit += vec3(0.30, 0.60, 0.85) * mpMask * 0.30 * u_magneticPoles;

    // Magnetosphere size — overall field extent tint.
    colorLit += vec3(0.05, 0.08, 0.15) * rimMuG * u_magnetosphereSize;

    // Induced dipole — oscillating tint (shared alias).
    float idP = sin(lonG * 2.0 + u_time * 0.1);
    colorLit += vec3(0.08, 0.10, 0.20) * idP * 0.05 * u_inducedDipole;

    // Magnetotail — nightside tint.
    colorLit += vec3(0.45, 0.30, 0.30) * nightG * 0.10 * u_magnetotail;

    // Aurorae — polar glowing bands (Ganymede has sun-independent aurora).
    float aurG = exp(-pow((latAbsG - 72.0) / 6.0, 2.0));
    colorLit += u_emissiveColor * aurG * nightG * 0.60 * u_aurorae;

    // Aurora variability — time-varying intensity.
    colorLit += vec3(0.10, 0.50, 0.90) * aurG
              * (0.5 + 0.5 * sin(u_time * 0.5)) * 0.20 * u_auroraVariability;
  }
  #endif

  // ---------------------------------------------------------------------
  // T52 Doc 22 ENT-3021 (Enceladus) toggle effects — canonical Doc 22.
  // ---------------------------------------------------------------------
  #ifdef MOON_ENCELADUS
  {
    float latDegEn = moon_latDeg(n);
    float lonEn = atan(n.z, n.x);
    float rimMuEn = 1.0 - abs(dot(nW, v));

    // White ice — brightest surface globally.
    colorLit = mix(colorLit * 0.85, colorLit, u_whiteIce);

    // Old terrain — darker cratered regions.
    float otField = cosmos_fbm(n * 3.0, 4);
    colorLit = mix(colorLit, colorLit * 0.75, smoothstep(0.55, 0.7, otField) * 0.30 * u_oldTerrain);

    // Ice grain size — subtle texture modulation.
    colorLit += vec3(0.04) * cosmos_hash31(floor(n * 20.0)) * u_iceGrainSize;

    // Tiger stripes — visible parallel fractures at south pole.
    float tigerEn = tigerStripes(n);
    colorLit = mix(colorLit, vec3(0.55, 0.65, 0.80), tigerEn * 0.55 * u_tigerStripes);

    // Fracture wall height — shadow relief on stripes.
    colorLit = mix(colorLit, colorLit * 0.6, tigerEn * 0.25 * u_fractureWallHeight);

    // Fracture glow — warm stripe emission.
    colorLit += vec3(0.50, 0.20, 0.10) * tigerEn * 0.40 * u_fractureGlow;

    // Water plumes — south-pole fountain above limb.
    float plumeMaskEn = exp(-pow((latDegEn + 75.0) / 8.0, 2.0)) * rimMuEn;
    colorLit += vec3(0.95, 0.98, 1.0) * plumeMaskEn * 0.55 * u_waterPlumes;

    // Plume spreading — wider halo.
    colorLit += vec3(0.8, 0.9, 1.0) * plumeMaskEn * rimMuEn * 0.35 * u_plumeSpreading;

    // Plume fallback — bright deposits on surface.
    colorLit += vec3(0.85) * exp(-pow((latDegEn + 70.0) / 15.0, 2.0)) * 0.20 * u_plumeFallback;

    // Eruption frequency — temporal modulation.
    colorLit += vec3(0.30, 0.40, 0.50) * plumeMaskEn
              * (0.5 + 0.5 * sin(u_time * 2.0)) * u_eruptionFrequency;

    // South polar heat — warm red tint at south pole.
    colorLit += vec3(0.45, 0.20, 0.10)
              * exp(-pow((latDegEn + 70.0) / 12.0, 2.0)) * 0.25 * u_southPolarHeat;

    // Hotspot shifting — time-moving hotspots.
    float hsShift = sin(lonEn * 3.0 + u_time * 0.5);
    colorLit += vec3(0.35, 0.15, 0.08) * tigerEn
              * smoothstep(0.5, 0.8, hsShift) * u_hotspotShifting;

    // Ocean glow — subtle blue tint from below.
    colorLit += vec3(-0.03, 0.0, 0.10) * u_oceanGlowEnc;

    // Ocean thermal — warm emission from subsurface.
    colorLit += vec3(0.10, 0.05, 0.02) * tigerEn * u_oceanThermal;

    // E-ring particles — sparkle around moon.
    colorLit += vec3(0.90, 0.92, 0.95) * rimMuEn * rimMuEn * 0.15 * u_eringParticles;

    // Ejection cone — directional plume shape.
    float ecCone = pow(max(0.0, -n.y), 2.0) * rimMuEn;
    colorLit += vec3(1.0) * ecCone * 0.30 * u_ejectionCone;

    // Blue terrain — bluish ice tint in young regions.
    colorLit += vec3(-0.02, 0.02, 0.08) * smoothstep(0.6, 0.8, otField) * u_blueTerrain;
  }
  #endif

  colorLit += rim;
  colorLit *= limb;

  fragColor = vec4(colorLit, 1.0);
}
