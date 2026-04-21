// Cosmos Explorer — Wolf-Rayet nebula fragment shader.
//
// Doc 17 §ENT-5060 + Doc 18 §Wolf-Rayet Nebulae.
//
// A Wolf-Rayet nebula is a wind-blown bubble — a bright, relatively thick
// shell of swept-up ISM ionised by the 50,000–150,000 K central WR star.
// Compared to planetary-nebula shells the WR ring is:
//   - Thicker (0.1–0.3 pc compression zone vs. 0.03–0.08 pc PN rim).
//   - Clumpier (fbm noise modulates the shell; Doc 17 cites 5-octave fbm
//     + Voronoi-like clumping for NGC 6888 / M1-67).
//   - Optionally asymmetric (crescent morphology — e.g. NGC 6888's partial
//     shell). The `u_crescent` uniform biases one hemisphere dimmer.
// The interior is not empty but very low-density hot wind — we add a soft
// exp-decay term so the centre reads as a faint glow rather than a hole.
//
// Colour: Hα dominates (Doc 17 ENT-5060 describes Stark-broadened Hα), with
// a green OIII cool edge and a blue Hβ inner contribution.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_haColor;        // Hα deep red (Doc 17 #FF3333)
uniform vec3  u_hbColor;        // Hβ blue-green (Doc 17 #4CB2FF)
uniform vec3  u_oiiiColor;      // OIII outer ring (Doc 17 #00FF88)
uniform vec3  u_starColor;      // central WR star glow

// ---- shell geometry -------------------------------------------------------
uniform float u_shellRadius;
uniform float u_shellThickness;
uniform float u_clumpiness;
uniform float u_interiorDensity;
uniform float u_coreIntensity;
uniform float u_coreRadius;
uniform float u_expansionRate;
uniform float u_crescent;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef NEBULA_STEPS
  #define NEBULA_STEPS 64
#endif

// Crescent axis — lobe brightens along +X, dims along -X. Baked because
// rotating is cheap enough to apply at mesh level if needed.
const vec3 CRESCENT_AXIS = vec3(1.0, 0.0, 0.0);

float shellProfile(float r) {
  float t = (r - u_shellRadius) / max(u_shellThickness, 1e-4);
  return exp(-t * t);
}

float sampleWR(vec3 p, out float shellWeight) {
  float r = length(p);
  float expansion = 1.0 + u_time * u_expansionRate;
  float rEff = r / max(expansion, 1e-4);

  float shell = shellProfile(rEff);
  shellWeight = shell;

  // Clumpy substructure — 5-octave fbm per Doc 17 §ENT-5060.
  float clumps = 0.5 + 0.5 * cosmos_warpedFbm(p * 3.2, 5);
  clumps = mix(1.0, clumps, u_clumpiness);

  // Crescent asymmetry — 0.5 + 0.5 dot() biases brightness to +X hemisphere.
  float crescent = 0.5 + 0.5 * dot(normalize(p + 1e-6), CRESCENT_AXIS);
  float asym = mix(1.0, crescent, u_crescent);

  // Hot interior wind — exponential decay, never quite zero inside the shell.
  float interior = exp(-rEff / max(u_shellRadius, 1e-4)) * u_interiorDensity;

  return shell * clumps * asym + interior;
}

vec3 emissionWR(vec3 p, float density, float shell) {
  float r = length(p);
  // Shell-fraction cue: the outer half of the shell cools and gains OIII.
  float shellFraction = smoothstep(
    u_shellRadius - u_shellThickness * 0.5,
    u_shellRadius + u_shellThickness * 1.5,
    r
  );

  // Hα dominates interior of the shell.
  vec3 ha = u_haColor * density * (0.9 - 0.25 * shellFraction);
  // Hβ weaker blue-green mid-shell.
  vec3 hb = u_hbColor * density * (0.15 + 0.2 * shellFraction) * 0.5;
  // OIII cooler outer edge.
  vec3 oiii = u_oiiiColor * density * (1.0 - shellFraction) * 0.35;

  // Unused `shell` arg — keep the signature available for future shader
  // tweaks without invalidating caller plumbing.
  float _shell = shell;

  return ha + hb + oiii + _shell * 0.0;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(NEBULA_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < NEBULA_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    float shell = 0.0;
    float density = sampleWR(p, shell);

    // Central WR star glow — a tight gaussian near the origin so the
    // bubble's central engine reads as a bright point.
    float r = length(p);
    float core = exp(-pow(r / max(u_coreRadius, 1e-4), 2.0)) * u_coreIntensity;

    if (density > 0.01 || core > 0.01) {
      vec3 emission = emissionWR(p, density, shell) + u_starColor * core;
      float sampleAlpha = clamp(density + core * 0.2, 0.0, 1.0) * stepSize * 0.9;
      accumColor += (1.0 - accumAlpha) * emission * stepSize;
      accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
      if (accumAlpha >= 0.99) break;
    }
    t += stepSize;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
