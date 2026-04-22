// Cosmos Explorer — evolved-star fragment shader (T41).
//
// Doc references:
//   - Doc 17 §ENT-1020 (Protostar/T Tauri), §ENT-1022 (Subgiant),
//     §ENT-1023 (Red Giant/Supergiant), §ENT-1024 (Blue Supergiant),
//     §ENT-1025 (AGB), §ENT-1026 (Horizontal Branch), §ENT-1027 (Wolf-Rayet),
//     §ENT-1028 (Luminous Blue Variable), §ENT-1029 (Carbon Star),
//     §ENT-1040 (Hypergiant).
//   - Doc 18 §Stellar Evolution Classes (Red Giant envelope shader,
//     Red Supergiant, Blue Supergiant).
//
// Variants — mutually exclusive per compile:
//   EVOLVED_PROTOSTAR   — disk-equator band + bipolar jet mask.
//   EVOLVED_SUBGIANT    — transition-zone defaults, minimal extras.
//   EVOLVED_RGB         — full convection, dusty mass-loss wisps.
//   EVOLVED_BSG         — tight blue surface, extended wind halo.
//   EVOLVED_AGB         — extreme envelope, thermal-pulse brightening.
//   EVOLVED_HB          — horizontal branch, clean compact surface.
//   EVOLVED_WR          — ejected-envelope ring at r ∈ [1.08, 1.22].
//   EVOLVED_LBV         — S-Doradus brightness pulsation.
//   EVOLVED_CARBON      — dust-tint overlay (#660000 reddish-brown).
//   EVOLVED_HYPERGIANT  — extreme-scale envelope, strong wisps.
//
// CLAUDE.md Rule #1: fully procedural, no texture samplers.
// CLAUDE.md Rule #6: log-depth when USE_LOGARITHMIC_DEPTH_BUFFER.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"

// ---- palette uniforms -----------------------------------------------------

// @param u_coreColor      — Doc 17 photosphere colour per subtype.
uniform vec3  u_coreColor;
// @param u_haloColor      — Doc 17 extended envelope / halo tint.
uniform vec3  u_haloColor;
// @param u_spotColor      — Doc 17 convection-cell dark centres.
uniform vec3  u_spotColor;
// @param u_chromosphereColor — Doc 17 hot accretion / flare / HeII ring tint.
uniform vec3  u_chromosphereColor;
// @param u_dustColor      — Doc 17 dust shell tint (carbon: #660000; AGB: #884433).
uniform vec3  u_dustColor;
// @param u_limbColor      — Doc 17 limb / cool-edge tint.
uniform vec3  u_limbColor;

// ---- feature magnitudes ---------------------------------------------------

// @param u_temperatureK   — effective T, informational.
uniform float u_temperatureK;
// @param u_envelopeWidth  — Doc 18 §Red Giant shader: 0.8→1.0 core, 1.0→1.2 envelope.
uniform float u_envelopeWidth;
// @param u_granulationOctaves — Doc 17 FBM octaves (4 BSG, 8 AGB).
uniform float u_granulationOctaves;
// @param u_granulationAmp — Doc 17 FBM amplitude 0.03 HB → 0.20 AGB.
uniform float u_granulationAmp;
// @param u_voronoiBlend   — Doc 17 Voronoi overlay 0 HB → 0.7 AGB.
uniform float u_voronoiBlend;
// @param u_windRate       — Doc 17 mass-loss advection rate (units/sec).
uniform float u_windRate;
// @param u_shellIntensity — Wolf-Rayet ejected-envelope ring intensity (0 elsewhere).
uniform float u_shellIntensity;
// @param u_sdoradusAmp    — LBV S-Doradus brightness modulation amplitude (0 elsewhere).
uniform float u_sdoradusAmp;
// @param u_jetIntensity   — Protostar bipolar-jet mask (0 elsewhere).
uniform float u_jetIntensity;
// @param u_limbDarkening  — Doc 17 per-subtype limb exponent.
uniform float u_limbDarkening;
// @param u_bloomIntensity — Doc 17 per-subtype bloom target.
uniform float u_bloomIntensity;
// @param u_chromosphereIntensity — Doc 17 chromospheric layer strength.
uniform float u_chromosphereIntensity;
// @param u_time           — seconds since scene start.
uniform float u_time;
// @param u_sunDir         — kept for API parity with planet.vert sibling.
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

// ---------------------------------------------------------------------------
// Convection — giant-cell FBM + coarse Voronoi. Vigorous advection on AGB
// and Mira progenitors; gentle on horizontal branch.
// ---------------------------------------------------------------------------
vec3 convection(vec3 n) {
  vec3 p = n + vec3(u_time * u_windRate * 0.3, 0.0, u_time * u_windRate * 0.2);
  int oct = int(clamp(u_granulationOctaves, 1.0, 8.0));
  float fbm = cosmos_fbm(p * 3.0, oct);
  float cells = 1.0 - cosmos_voronoi(p * 2.0).x;
  float mixed = mix(fbm, cells, u_voronoiBlend);
  float g = (mixed - 0.5) * u_granulationAmp * 2.0;
  vec3 base = u_coreColor;
  base = mix(base, u_haloColor, smoothstep(0.0, u_granulationAmp, g));
  base = mix(base, u_spotColor, smoothstep(0.0, u_granulationAmp, -g));
  return base;
}

// ---------------------------------------------------------------------------
// Extended envelope — alpha-modulated outer shell between [1-envelopeWidth,
// 1+envelopeWidth] in unit-sphere terms. For dusty subtypes (RGB, AGB,
// Hypergiant), warpedFbm gives wisp structure; for cleaner ones this
// contributes a gentle rim glow.
// ---------------------------------------------------------------------------
vec3 envelope(vec3 n, out float envAlpha) {
  // Approximate "height above core surface" via view-dir-limb distance.
  // (We're on a single sphere — the rim term is how we fake the extended
  //  envelope depth. For volumetric renders we'd raymarch, but this shader
  //  is a surface-sphere per the T41 spec.)
  float wisp = cosmos_warpedFbm(n * 3.0 + vec3(u_time * u_windRate), 4);
  envAlpha = clamp(wisp * u_envelopeWidth, 0.0, 1.0);
  vec3 col = mix(u_haloColor, u_dustColor, 0.4);
  return col;
}

// ---------------------------------------------------------------------------
// Wolf-Rayet ring: bright shell at r ∈ [1.08, 1.22] in the envelope frame.
// We approximate "radial distance" via the fragment position's length on the
// unit sphere by looking at the inverse of the surface normal's dot with the
// view direction — the limb is effectively the "outer" edge.
// ---------------------------------------------------------------------------
float wolfRayetRing(vec3 nW, vec3 v) {
  #ifdef EVOLVED_WR
    if (u_shellIntensity <= 0.0) return 0.0;
    float mu = abs(dot(nW, v));
    float r = 1.0 - mu;                             // 0 centre, ~1 limb
    // Ring band between 0.08 and 0.22 off the limb equivalent.
    return smoothstep(0.08, 0.15, r) - smoothstep(0.15, 0.22, r);
  #else
    return 0.0;
  #endif
}

// ---------------------------------------------------------------------------
// S-Doradus luminosity cycle (Luminous Blue Variable). 30-second demo period
// per Doc 17 ENT-1028 compression. Scalar multiplier in [1 - amp, 1 + amp].
// ---------------------------------------------------------------------------
float sDoradusCycle() {
  #ifdef EVOLVED_LBV
    return 1.0 + u_sdoradusAmp * sin(6.28318530718 * u_time / 30.0);
  #else
    return 1.0;
  #endif
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

  // Base photosphere via convection noise.
  vec3 surface = convection(n);

  #ifdef EVOLVED_PROTOSTAR
    // Equatorial accretion-disk bright band: latitude-based.
    float lat = abs(n.y);
    float diskBand = smoothstep(0.35, 0.0, lat);
    surface = mix(surface, u_chromosphereColor, diskBand * u_jetIntensity * 0.6);
    // Bipolar jet mask — bright near poles.
    float jetMask = pow(abs(n.y), 4.0);
    surface = mix(surface, u_chromosphereColor, jetMask * u_jetIntensity * 0.5);
  #endif

  #if defined(EVOLVED_RGB) || defined(EVOLVED_AGB) || defined(EVOLVED_HYPERGIANT)
    // Dusty mass-loss wisps modulate surface alpha near the limb; bake into
    // colour here (surface sphere, not volumetric).
    float envA = 0.0;
    vec3 envCol = envelope(n, envA);
    surface = mix(surface, envCol, envA * 0.35);
  #endif

  #ifdef EVOLVED_WR
    float ring = wolfRayetRing(nW, v);
    surface += u_chromosphereColor * ring * u_shellIntensity * 0.6;
    // WR subtype-specific dust tint (dustColor encodes WN HeII green vs WC red).
    surface = mix(surface, u_dustColor, ring * 0.25);
  #endif

  #ifdef EVOLVED_LBV
    // Colour shift across cycle: cooler/redder during eruption phase.
    float phase = 0.5 + 0.5 * sin(6.28318530718 * u_time / 30.0);
    surface = mix(surface, u_dustColor, phase * 0.4);
  #endif

  #ifdef EVOLVED_CARBON
    // Carbon star reddish-brown overlay (#660000 tholin tint).
    surface = mix(surface, u_dustColor, 0.35);
    // Dust extinction: reduce blue + green per Doc 17 ENT-1029 spec.
    surface *= vec3(1.0, 0.7, 0.5);
  #endif

  #ifdef EVOLVED_BSG
    // Blue-supergiant wind glow near limb (Doc 17 §ENT-1024 "cyan #00DDFF").
    // Scoped so `muBsg`/`rimBsg` don't collide with the outer `mu`/`rim`
    // variables below — GLSL ES 3.0 forbids re-declaration at function
    // scope even across disjoint #ifdef branches.
    {
      float muBsg = abs(dot(nW, v));
      float rimBsg = pow(1.0 - muBsg, 2.5);
      surface += u_chromosphereColor * rimBsg * 0.35;
    }
  #endif

  #ifdef EVOLVED_HB
    // Horizontal Branch: very clean surface — muted convection.
    surface = mix(surface, u_coreColor, 0.55);
  #endif

  #ifdef EVOLVED_SUBGIANT
    // Subgiant: blend core and halo 50/50 to sell transition feel.
    surface = mix(surface, u_haloColor, 0.25);
  #endif

  // Corona rim-glow contribution — uses chromosphereIntensity uniform.
  float mu  = max(0.0, dot(nW, v));
  float limb = pow(mu, 1.0 / max(0.5, u_limbDarkening));
  float rim = pow(1.0 - mu, 3.0);
  vec3 corona = u_chromosphereColor * rim * u_chromosphereIntensity;

  // Apply S-Doradus luminosity cycle (LBV only — pass-through 1.0 otherwise).
  float cycle = sDoradusCycle();

  vec3 color = surface * limb * cycle + corona;

  // Silence unused-uniform warning.
  color += u_sunDir * 0.0 + u_temperatureK * 0.0;

  fragColor = vec4(color, 1.0);
}
