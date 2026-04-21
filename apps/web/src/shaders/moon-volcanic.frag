// Cosmos Explorer — volcanic-moon fragment shader (T43).
// Doc 17 §3010 + Doc 18 §Volcanic Moon (Io-Type).
//
//   MOON_IO            ENT-3010  Io — sulfur allotrope zones, lava lakes,
//                                400+ calderas, plume fountains 200-400 km.
//   MOON_TIDAL_HEATED  ENT-3010  generic tidal-heated exomoon variant.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"
#include "lib/moon-common.glsl"

out vec4 fragColor;

// Sulfur allotrope zones — Voronoi cell id selects one of 4 palette samples.
// Io's dominant visual: overlapping deposits in orbital pathways.
vec3 sulfurBase(vec3 n) {
  vec2 cells = cosmos_voronoi(n * 6.0);
  float band = cells.y;                        // cell hash drives colour
  vec3 color;
  if (band < 0.30) {
    color = u_baseColor;                       // yellow SO₂
  } else if (band < 0.55) {
    color = u_highlightColor;                  // fresh yellow
  } else if (band < 0.80) {
    color = u_shadowColor;                     // red sulfur / basalt
  } else {
    color = u_poleColor;                       // SO₂ frost white
  }
  // Small-scale mottling inside each cell.
  float mottling = cosmos_fbm(n * 20.0, 3);
  return color * (0.85 + 0.3 * mottling);
}

void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);
  vec3 nW = normalize(v_normalW);
  vec3 v  = normalize(v_viewDirW);
  vec3 s  = normalize(u_sunDir);

  // Base sulfur + basalt surface.
  vec3 surface = sulfurBase(n);

  // Lava-lake mask — Voronoi at low scale marks sparse active calderas.
  vec2 calderas = cosmos_voronoi(n * 8.0 + vec3(0.0, u_time * 0.003, 0.0));
  float caldera = smoothstep(0.15, 0.02, calderas.x) * step(0.82, calderas.y);
  // Lava glow pulses slowly — sine on cell-id phase so each lake breathes.
  float pulse = 0.6 + 0.4 * sin(u_time * 0.8 + calderas.y * 6.28);
  float lavaMask = caldera * pulse;
  surface = mix(surface, u_emissiveColor, lavaMask);

  // Surface lighting.
  float sunFacing = dot(nW, s);
  float lit = cosmos_diffuse(nW, s, u_ambientFloor);
  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  vec3 rim = cosmos_rimGlow(nW, v, s, u_atmosphereTint, u_atmosphereStrength);

  vec3 colorLit = surface * lit;

  // Lava emission — bright even on the night side (thermal radiation) but
  // attenuated there so night-side lavas glow dimly rather than blinding.
  float nightFactor = 0.4 + 0.6 * max(0.0, sunFacing);
  colorLit += u_emissiveColor * lavaMask * u_emissiveStrength * nightFactor;

  // Plume fountains — bright arc above the limb near active vents.
  // Approximate with a Fresnel-driven halo whose colour matches u_emissiveColor
  // modulated by vent distribution. At close-zoom a dedicated particle
  // system (Doc 18 §Io) will take over; the shader halo covers all LODs.
  float vents = moon_plumeMask(n, 0.0);
  float fresnel = pow(1.0 - max(0.0, dot(nW, v)), 2.0);
  vec3 plumeGlow = u_emissiveColor * vents * fresnel * u_plumeIntensity * 0.6;
  colorLit += plumeGlow;

  // Polar SO₂ frost — bright bands replacing sulfur.
  float latAbs = abs(moon_latDeg(n));
  float frost = smoothstep(u_polarCapExtent - 8.0, u_polarCapExtent, latAbs);
  colorLit = mix(colorLit, u_poleColor * lit, frost * 0.4);

  // ---------------------------------------------------------------------
  // T52 Doc 22 ENT-3010 (Io) toggle effects — canonical Doc 22 names.
  // ---------------------------------------------------------------------
  #ifdef MOON_IO
  {
    float latDegIo = moon_latDeg(n);
    float latAbsIo = abs(latDegIo);
    float lonIo = atan(n.z, n.x);
    float rimMuIo = 1.0 - abs(dot(nW, v));
    float nightIo = max(0.0, -sunFacing);

    // Tidal heating — overall thermal tint boost.
    colorLit += vec3(0.10, 0.05, 0.02) * u_tidalHeating;

    // Volcanic activity — bright plume fountains near limb.
    colorLit += vec3(1.0, 0.85, 0.55) * vents * rimMuIo * 0.5 * u_volcanicActivity;

    // Magma channels — red-orange flowing streams.
    float channelFlow = smoothstep(0.7, 0.95, cosmos_fbm(n * 8.0, 3));
    colorLit += vec3(1.0, 0.35, 0.10) * channelFlow * 0.40 * u_magmaChannels;

    // Loki Patera — single large bright lava lake at one position.
    float lokiLat = 10.0 * 0.01745;
    float lokiLon = -0.5;
    float lokiDist = length(vec2(asin(n.y) - lokiLat,
                                 mod(lonIo - lokiLon + 3.14159, 6.28318) - 3.14159));
    colorLit += vec3(1.0, 0.55, 0.15) * exp(-lokiDist * 8.0) * 0.60 * u_lokiPatera;

    // Patera network — distributed volcanic calderas.
    float patH = cosmos_hash31(floor(n * 12.0) + vec3(5.0));
    colorLit = mix(colorLit, vec3(0.50, 0.25, 0.10),
                   step(0.88, patH) * 0.40 * u_pateraNetwork);

    // Volcanic cones — sharp bright peaks.
    float coneP = sin(lonIo * 12.0 + latDegIo * 5.0);
    colorLit += vec3(0.10) * smoothstep(0.90, 0.98, coneP) * 0.30 * u_volcanicCones;

    // Lava flow network — bright linear features.
    float flNet = sin(lonIo * 15.0 - latDegIo * 3.0);
    colorLit += vec3(0.85, 0.30, 0.10) * smoothstep(0.92, 0.98, flNet) * 0.30 * u_lavaFlowNetwork;

    // Yellow sulfur gate — primary surface.
    vec2 sulfCells = cosmos_voronoi(n * 6.0);
    colorLit = mix(colorLit * 0.85, colorLit, u_yellowSulfur);

    // Dark sulfur — darker basaltic patches.
    float darkH = cosmos_hash31(floor(n * 10.0));
    colorLit = mix(colorLit, vec3(0.22, 0.14, 0.08),
                   step(0.90, darkH) * 0.40 * u_darkSulfur);

    // Sulfur cracks — thin dark fissures.
    float crackP = sin(lonIo * 18.0 + latDegIo * 4.0);
    colorLit = mix(colorLit, colorLit * 0.70,
                   smoothstep(0.92, 0.98, crackP) * 0.30 * u_sulfurCracks);

    // Molten lakes — dark glowing patches.
    colorLit += vec3(1.0, 0.45, 0.10) * lavaMask * 0.4 * u_moltenLakes;

    // Lava crust — tint shift on lava surfaces.
    colorLit += vec3(0.15, 0.05, 0.0) * lavaMask * u_lavaCrust;

    // Lava fountains — tall bright jets above limb.
    float fountainPhase = sin(lonIo * 6.0 + u_time * 2.0);
    colorLit += vec3(1.0, 0.75, 0.35) * rimMuIo
              * smoothstep(0.85, 0.95, fountainPhase) * 0.50 * u_lavaFountains;

    // Umbrella plumes — wide mushroom-shaped plume halos at limb.
    colorLit += vec3(0.9, 0.7, 0.5) * rimMuIo * rimMuIo
              * smoothstep(0.8, 1.0, vents) * 0.45 * u_umbrellaPlumes;

    // Plume fallout — pale halo deposits.
    colorLit += vec3(0.80, 0.75, 0.65) * vents * 0.20 * u_plumeFallout;

    // Plume animation — time-varying bright flickers.
    float animT = floor(u_time * 0.5);
    float animHash = cosmos_hash31(vec3(animT, floor(lonIo * 8.0), 0.0));
    colorLit += vec3(1.0, 0.75, 0.30)
              * step(0.92, animHash) * (1.0 - fract(u_time * 0.5)) * 0.60 * u_plumeAnimation;

    // SO2 emission — atmospheric haze tint.
    colorLit += vec3(0.7, 0.75, 0.8) * rimMuIo * 0.12 * u_sO2Emission;

    // SO2 frost — white polar caps.
    float polarIo = smoothstep(60.0, 85.0, latAbsIo);
    colorLit = mix(colorLit, vec3(0.95, 0.95, 0.90), polarIo * 0.55 * u_sO2Frost);

    // Frost sublimation — time-varying frost extent.
    float frostSubT = 0.5 + 0.3 * sin(u_time * 0.15);
    colorLit += vec3(0.08) * polarIo * frostSubT * u_frostSublimation;

    // Frost contamination — reddish tinted frost.
    colorLit += vec3(0.15, 0.08, 0.04) * polarIo * u_frostContamination;

    // Plasma glow — faint green equatorial glow.
    float plasmaBand = exp(-pow(latDegIo / 15.0, 2.0));
    colorLit += vec3(0.4, 0.9, 0.5) * plasmaBand * rimMuIo * 0.10 * u_plasmaGlow;

    // Sodium cloud — orange nightside plume.
    colorLit += vec3(0.95, 0.55, 0.25) * nightIo * rimMuIo * 0.15 * u_sodiumCloud;

    // Magnetic footprint — bright auroral oval.
    float aurIo = exp(-pow((latAbsIo - 75.0) / 8.0, 2.0));
    colorLit += vec3(0.3, 0.8, 0.6) * aurIo * 0.30 * u_magneticFootprint;
  }
  #endif

  colorLit += rim;
  colorLit *= limb;

  fragColor = vec4(colorLit, 1.0);
}
