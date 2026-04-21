// Cosmos Explorer — active galactic nucleus fragment shader (T46).
//
// Covers Doc 17 ENT-6040 (Seyfert 1 + Type 2), ENT-6041 (Quasar),
// ENT-6042 (Radio Galaxy FR I/II), ENT-6043 (Blazar), ENT-6044 (LINER) —
// five AGN subtypes that share a common compositional template:
//
//   Host galaxy     (smooth spheroid or disk, per subtype)
// + AGN core        (bright gaussian point at origin)
// + Accretion hint  (very hot central blob, bluer than core)
// + Dust torus      (dark annulus — Seyfert 2 + some LINERs)
// + NLR cone        (narrow ionisation cone — Seyfert 2 edge-on)
// + Bipolar jets    (relativistic beam along Y axis — radio/quasar/blazar)
// + Radio lobes     (diffuse volumes at jet termini — radio galaxy)
//
// All components are selectable per-subtype through uniforms; we do NOT use
// preprocessor branching — a single compiled shader renders every AGN by
// setting the appropriate floats. Subtypes enumerated in u_agnSubtype for
// inline conditional blocks that need the discrete label:
//   0 = Seyfert 1   (unobscured, bright blue-white core, no jets)
//   1 = Seyfert 2   (obscured core via torus, ionisation cone visible)
//   2 = Quasar      (dominant point source, optional jet)
//   3 = Radio       (paired FR I/II lobes + jets, modest core)
//   4 = Blazar      (core + single +Y beamed jet, extreme bloom hint)
//   5 = LINER       (faint nuclear glow, almost host-dominated)
//
// Host-galaxy shape picks between bulge (u_hostBulge) and disk (u_hostDisk),
// mixed by u_hostMorphology (0 = pure bulge, 1 = disk+bulge).
//
// Doc 18 §Active Galaxy: bloom intensity ~3.0, deep synchrotron blue. Doc 22
// note the Type 1/2 torus orientation fix (face-on vs edge-on).
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_hostColor;       // old-star host glow (yellow)
uniform vec3  u_bulgeColor;      // warm bulge tint
uniform vec3  u_coreColor;       // AGN continuum blue (#5588FF typ.)
uniform vec3  u_accretionColor;  // inner hot disk ~10^6 K (#AADDFF)
uniform vec3  u_torusColor;      // dust torus silhouette (#1a1a2e)
uniform vec3  u_nlrColor;        // [O III] ionisation cone cyan/blue
uniform vec3  u_jetColor;        // synchrotron (cyan/blue)
uniform vec3  u_lobeColor;       // lower-freq radio lobe purple
uniform vec3  u_hiiColor;        // host Hα

// ---- structure ------------------------------------------------------------
uniform float u_agnSubtype;          // 0..5 — see header comment.
uniform float u_hostMorphology;      // 0=pure spheroid, 1=disk+bulge.
uniform float u_hostDiskRadius;      // disk scale radius (if disk host).
uniform float u_hostBulgeRadius;     // bulge Sérsic radius.
uniform float u_coreRadius;          // AGN core gaussian σ (very small).
uniform float u_coreIntensity;       // 0.5 (LINER) … 10.0 (Quasar).
uniform float u_accretionIntensity;  // hottest-disk blob brightness.
uniform float u_torusRadius;         // torus ring radius.
uniform float u_torusThickness;      // torus half-height.
uniform float u_torusStrength;       // 0 = no torus, 1 = Seyfert 2 thick.
uniform float u_nlrConeAngle;        // half-angle radians.
uniform float u_nlrStrength;         // 0 = off, 1 = bright Seyfert 2 cone.
uniform float u_jetStrength;         // bipolar jet opacity.
uniform float u_jetLength;           // jet reach (0..1 local units).
uniform float u_jetRadius;           // jet cylinder half-width.
uniform float u_jetAsymmetry;        // 0 = symmetric, 1 = blazar (single +Y).
uniform float u_lobeStrength;        // radio-lobe volume density.
uniform float u_lobeRadius;          // lobe centre distance from origin.
uniform float u_variability;         // intensity modulation amplitude.
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef GALAXY_STEPS
  #define GALAXY_STEPS 56
#endif

// Jet axis — +Y for all subtypes; blazar makes it single-sided by multiplying
// by step(0, p.y) (see jetContribution).
const vec3 JET_AXIS = vec3(0.0, 1.0, 0.0);

// Time-dependent core flicker (Doc 17 ENT-6040 "Accretion Disk Flickering").
float coreFlicker(float t) {
  return 1.0 + u_variability * (
    0.6 * sin(t * 5.3) +
    0.4 * sin(t * 11.7 + 1.3) +
    0.2 * sin(t * 23.1 + 2.7)
  );
}

// Host spheroid density — Sérsic n≈3 (bulge-dominated AGN hosts).
float hostBulge(vec3 p) {
  float r = length(p);
  float x = r / max(u_hostBulgeRadius, 1e-4);
  return exp(-3.67 * pow(x, 1.0 / 3.0));  // b for n=3 ≈ 3.67.
}

// Host disk density — thin exponential (Seyfert spirals).
float hostDisk(vec3 p) {
  float r = length(p.xz);
  float radial = exp(-r / max(u_hostDiskRadius, 1e-4));
  float vert = exp(-pow(p.y / 0.055, 2.0));
  return radial * vert * 0.7;
}

// Torus density — annulus around y=0 with the bar at the equator (XZ plane).
// Dense inside (u_torusRadius ± thickness) AND |y| < thickness.
float torusDensity(vec3 p) {
  float rXZ = length(p.xz);
  float ringR = exp(-pow((rXZ - u_torusRadius) / max(u_torusThickness, 1e-4), 2.0));
  float vert = exp(-pow(p.y / max(u_torusThickness * 0.6, 1e-4), 2.0));
  return ringR * vert;
}

// Narrow ionisation cone mask — full inside both +Y and -Y cones.
float nlrConeMask(vec3 p) {
  if (u_nlrStrength <= 0.001) return 0.0;
  vec3 dir = normalize(p + 1e-6);
  float cosLat = abs(dot(dir, JET_AXIS));
  float cone = smoothstep(cos(u_nlrConeAngle), cos(u_nlrConeAngle * 0.6), cosLat);
  float radius = length(p);
  float radial = exp(-pow(radius / 0.55, 1.8));
  return cone * radial;
}

// Jet cylinder — Gaussian across axis, fading with |y|.
float jetDensity(vec3 p) {
  if (u_jetStrength <= 0.001) return 0.0;
  float along = abs(p.y) / max(u_jetLength, 1e-4);
  float across = length(p.xz) / max(u_jetRadius, 1e-4);
  float beam = exp(-pow(across, 2.0)) * exp(-along);
  // Blazar asymmetry: kill the -Y branch.
  float oneSided = mix(1.0, step(0.0, p.y) * 2.0 - 0.0, u_jetAsymmetry);
  return beam * oneSided;
}

// Diffuse radio lobe volume at ±y ≈ u_lobeRadius.
float lobeDensity(vec3 p) {
  if (u_lobeStrength <= 0.001) return 0.0;
  vec3 c1 = vec3(0.0,  u_lobeRadius, 0.0);
  vec3 c2 = vec3(0.0, -u_lobeRadius, 0.0);
  float d1 = exp(-pow(length(p - c1) / 0.32, 2.0));
  float d2 = exp(-pow(length(p - c2) / 0.32, 2.0)) * (1.0 - u_jetAsymmetry);
  float fbm = cosmos_fbm(p * 3.5 + vec3(0.0, u_time * 0.04, 0.0), 3);
  return (d1 + d2) * (0.7 + 0.5 * fbm);
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(GALAXY_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;
  float flicker = coreFlicker(u_time);

  for (int i = 0; i < GALAXY_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    float host = mix(hostBulge(p), hostBulge(p) * 0.55 + hostDisk(p), u_hostMorphology);

    // AGN point source — gaussian at origin.
    float r = length(p);
    float core = exp(-pow(r / max(u_coreRadius, 1e-4), 2.0)) * u_coreIntensity * flicker;
    // Innermost hot-disk blob, even hotter / whiter.
    float hotInner = exp(-pow(r / max(u_coreRadius * 0.4, 1e-4), 2.0)) * u_accretionIntensity * flicker;

    float torus = torusDensity(p) * u_torusStrength;
    float nlr = nlrConeMask(p);
    float jet = jetDensity(p);
    float lobe = lobeDensity(p);

    float density = host * 1.4 + core * 0.8 + hotInner * 0.9
                    + torus * 1.2 + nlr * 0.3 + jet * 0.5 + lobe * 0.45;
    if (density < 0.003) {
      t += stepSize;
      continue;
    }

    // Torus is subtractive (obscures the core when viewed through). Compute
    // obscuration factor — only applies to emission happening at THIS ray
    // sample; the AABB march doesn't model true radiative transfer, so we
    // approximate by dimming non-torus emission proportionally to local
    // torus density.
    float obscure = clamp(torus * 1.4, 0.0, 0.85);

    vec3 color = u_hostColor * host * 1.0 + u_bulgeColor * host * 0.7;
    // AGN continuum + hot inner disk.
    color += u_coreColor * core * 1.6 * (1.0 - obscure);
    color += u_accretionColor * hotInner * 2.0 * (1.0 - obscure);
    // Dark torus silhouette — colour contribution is near-black tinted.
    color = mix(color, u_torusColor * 0.25, obscure);
    // NLR cone emission (Seyfert 2 ionisation cone).
    color += u_nlrColor * nlr * u_nlrStrength * 1.4;
    // Jet + lobe synchrotron emission.
    color += u_jetColor * jet * u_jetStrength * 1.8;
    color += u_lobeColor * lobe * u_lobeStrength * 1.1;
    // Host HII hint along disk midplane (weak).
    float hiiHint = host * exp(-pow(p.y / 0.05, 2.0)) * 0.12;
    color += u_hiiColor * hiiHint;

    float sampleAlpha = clamp(density, 0.0, 1.0) * stepSize * 1.6;
    accumColor += (1.0 - accumAlpha) * color * stepSize * 1.3;
    accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
    if (accumAlpha >= 0.99) break;
    t += stepSize;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
