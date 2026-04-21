// Cosmos Explorer — variable-star fragment shader (T41).
//
// Doc references:
//   - Doc 17 §ENT-1033 (Cepheid), §ENT-1034 (RR Lyrae), §ENT-1035 (Mira),
//     §ENT-1036 (Eclipsing Binary), §ENT-1037 (Cataclysmic Variable),
//     §ENT-1038 (Symbiotic), §ENT-1039 (Blue Straggler).
//   - Doc 18 §Star Rendering (base granulation), §Red Giant envelope
//     (Mira-type shader).
//
// The variable family shares one granulation/pulsation skeleton, then
// branches per subtype on light-curve shape and colour modulation:
//
//   VAR_CEPHEID        — asymmetric sawtooth (fast rise, slow fall).
//   VAR_RRLYRAE        — like Cepheid but smaller amplitude.
//   VAR_MIRA           — deep sine + dust-wisp envelope.
//   VAR_ECLIPSING      — secondary dimming via companion dark-disk mask.
//   VAR_CATACLYSMIC    — stochastic nova hotspot + accretion footprint.
//   VAR_SYMBIOTIC      — bichromatic blend between cool & hot palette slots.
//   VAR_BLUESTRAGGLER  — steady with blue-channel boost (u_blueExcess).
//
// CLAUDE.md Rule #1: fully procedural. CLAUDE.md Rule #6: log-depth.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"

#define TWO_PI 6.28318530718

// ---- palette uniforms -----------------------------------------------------

// @param u_coolColor   — min-brightness phase tint (Doc 17 per-subtype).
uniform vec3  u_coolColor;
// @param u_hotColor    — max-brightness phase tint.
uniform vec3  u_hotColor;
// @param u_haloColor   — chromospheric / accretion-disk tint.
uniform vec3  u_haloColor;
// @param u_spotColor   — companion silhouette / spot / donor-star tint.
uniform vec3  u_spotColor;
// @param u_limbColor   — limb tint (cool edge).
uniform vec3  u_limbColor;

// ---- feature magnitudes ---------------------------------------------------

// @param u_pulsationPeriodSec — Doc 17 period (compressed demo timescale).
uniform float u_pulsationPeriodSec;
// @param u_pulsationAmp       — radius oscillation amplitude (fraction).
uniform float u_pulsationAmp;
// @param u_brightnessAmp      — brightness oscillation amplitude (fraction).
uniform float u_brightnessAmp;
// @param u_granulationOctaves — FBM octaves for base surface.
uniform float u_granulationOctaves;
// @param u_granulationAmp     — FBM amplitude.
uniform float u_granulationAmp;
// @param u_voronoiBlend       — Voronoi overlay opacity.
uniform float u_voronoiBlend;
// @param u_dipDepth           — eclipse secondary dimming (0..1).
uniform float u_dipDepth;
// @param u_companionPhase     — eclipsing companion orbital phase (rad).
uniform float u_companionPhase;
// @param u_flareIntensity     — cataclysmic nova burst amplitude (0..1).
uniform float u_flareIntensity;
// @param u_blueExcess         — blue-straggler blue-channel boost (0..1).
uniform float u_blueExcess;
// @param u_limbDarkening      — limb exponent.
uniform float u_limbDarkening;
// @param u_bloomIntensity     — base bloom scalar (pulsation modulates).
uniform float u_bloomIntensity;
// @param u_time               — seconds since scene start.
uniform float u_time;
// @param u_sunDir             — kept for API parity.
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
// Phase in [0, 1). Safe for very small / zero periods.
// ---------------------------------------------------------------------------
float pulsePhase() {
  float period = max(0.0001, u_pulsationPeriodSec);
  return fract(u_time / period);
}

// ---------------------------------------------------------------------------
// Brightness modulation — subtype-specific light-curve shape.
// ---------------------------------------------------------------------------
float brightnessModulation() {
  float p = pulsePhase();
  #ifdef VAR_CEPHEID
    // Asymmetric sawtooth: pow(p, 0.3) rises quickly then flattens.
    float s = pow(p, 0.3);
    return 1.0 + u_brightnessAmp * (2.0 * s - 1.0);
  #elif defined(VAR_RRLYRAE)
    // Same shape as Cepheid but smaller amplitude (already baked into param).
    float s = pow(p, 0.3);
    return 1.0 + u_brightnessAmp * (2.0 * s - 1.0);
  #elif defined(VAR_MIRA)
    // Slow deep sine (see Doc 17 ENT-1035 "±50% brightness, long period").
    return 1.0 + u_brightnessAmp * sin(TWO_PI * p);
  #elif defined(VAR_ECLIPSING)
    // Two dips per orbital cycle at phase 0.5 & 1.0. We handle the primary
    // dip here; the secondary is triggered in-shader by companion-phase
    // geometry (below).
    float primary = 1.0 - u_dipDepth
      * exp(-pow((p - 0.5) * 12.0, 2.0));
    return primary;
  #elif defined(VAR_CATACLYSMIC)
    // Stochastic bursts — gated by u_flareIntensity. When triggered, add
    // a sharp spike that decays over ~1 s.
    float burstBin = floor(u_time * 1.0);
    float burstTrig = step(0.97, cosmos_hash31(vec3(burstBin, 0.0, 0.0)));
    float burst = burstTrig * u_flareIntensity
                * exp(-fract(u_time) * 3.0);
    return 1.0 + burst * 4.0;
  #elif defined(VAR_SYMBIOTIC)
    // Long-period smooth sinusoid.
    return 1.0 + u_brightnessAmp * sin(TWO_PI * p);
  #elif defined(VAR_BLUESTRAGGLER)
    // Near-steady brightness.
    return 1.0 + u_brightnessAmp * sin(TWO_PI * p);
  #else
    return 1.0;
  #endif
}

// ---------------------------------------------------------------------------
// Surface base — shared G/K/M granulation path.
// ---------------------------------------------------------------------------
vec3 surfaceBase(vec3 n) {
  vec3 p = n + vec3(u_time * 0.02, 0.0, u_time * 0.01);
  int  oct = int(clamp(u_granulationOctaves, 1.0, 8.0));
  float fbm = cosmos_fbm(p * 5.0, oct);
  float cells = 1.0 - cosmos_voronoi(p * 3.0).x;
  float mixed = mix(fbm, cells, u_voronoiBlend);
  float g = (mixed - 0.5) * u_granulationAmp * 2.0;

  // Interpolate hot↔cool by phase: sinusoidal (all subtypes share this).
  float phaseBlend = 0.5 + 0.5 * sin(TWO_PI * pulsePhase());
  vec3 base = mix(u_coolColor, u_hotColor, phaseBlend);

  base = mix(base, u_haloColor, smoothstep(0.0, u_granulationAmp, g));
  base = mix(base, base * 0.6, smoothstep(0.0, u_granulationAmp, -g));
  return base;
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

  vec3 surface = surfaceBase(n);

  #ifdef VAR_MIRA
    // Dust wisps — shared with evolved AGB envelope.
    float wisp = cosmos_warpedFbm(n * 2.5 + vec3(u_time * 0.05), 4);
    surface = mix(surface, u_coolColor * 0.8, wisp * 0.3);
  #endif

  #ifdef VAR_ECLIPSING
    // Secondary dimming via a moving dark disk — the "companion" sweeps a
    // great circle and shadows one hemisphere when aligned with the view.
    vec3 companionDir = vec3(
      sin(u_companionPhase), 0.0, cos(u_companionPhase)
    );
    float shadow = smoothstep(0.3, 0.0, dot(n, companionDir) - 0.7);
    surface = mix(surface, u_spotColor, shadow * u_dipDepth);
  #endif

  #ifdef VAR_CATACLYSMIC
    // Accretion disk footprint: bright hotspot at equator where matter
    // impacts the white dwarf surface.
    float equator = 1.0 - abs(n.y);
    float footprint = pow(equator, 8.0);
    surface = mix(surface, u_haloColor, footprint * 0.35);
  #endif

  #ifdef VAR_SYMBIOTIC
    // Bichromatic: one hemisphere red-giant dominant, the other hot
    // WD-dominated, slow sinusoidal interchange.
    float swap = 0.5 + 0.5 * sin(TWO_PI * pulsePhase() + n.x * 1.5);
    surface = mix(u_coolColor, u_hotColor, swap);
    // Ionised-nebula halo at limb.
    float mu = abs(dot(nW, v));
    surface += u_haloColor * pow(1.0 - mu, 3.0) * 0.3;
  #endif

  #ifdef VAR_BLUESTRAGGLER
    // Blue excess — brighten blue channel linearly per u_blueExcess.
    surface.b = min(1.0, surface.b + u_blueExcess * 0.35);
  #endif

  // Limb darkening.
  float mu   = max(0.0, dot(nW, v));
  float limb = pow(mu, 1.0 / max(0.5, u_limbDarkening));

  // Apply brightness modulation last so the eclipse / flare / pulsation
  // affects all contributions uniformly.
  float bright = brightnessModulation();

  vec3 color = surface * limb * bright * max(u_bloomIntensity, 0.1);

  // Limb tint rescue.
  color = mix(color, u_limbColor, (1.0 - limb) * 0.15);

  // Silence unused uniforms (u_sunDir, u_pulsationAmp — the vertex shader
  // uses u_pulsationAmp via u_pulsation built by the factory).
  color += u_sunDir * 0.0 + u_pulsationAmp * 0.0;

  fragColor = vec4(color, 1.0);
}
