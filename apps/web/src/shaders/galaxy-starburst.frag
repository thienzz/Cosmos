// Cosmos Explorer — starburst + ULIRG galaxy fragment shader (T46).
//
// Covers Doc 17 ENT-6050 (Starburst) and ENT-6053 (Ultra-Luminous Infrared
// Galaxy). Both share a compact disk + nuclear concentration, abundant
// HII regions, and a bipolar superwind (X-shape outflow). ULIRG differs in
// two ways:
//
//   1. Dust cocoon makes the OPTICAL appearance dim/red — we mix the
//      starburst blue population with a warm IR-dominated palette via the
//      `u_ulirgBlend ∈ [0,1]` uniform.
//   2. Multi-nucleus merger signature — ULIRGs are often post-merger with a
//      compact pair of cores (Arp 220-style). u_dualNucleus surfaces this.
//
// Density composition:
//   - Host disk:      exponential + vertical gaussian (mostly central).
//   - Nuclear core:   bright gaussian cluster at origin.
//   - HII regions:    spatial-hash distributed gaussian bumps.
//   - Superwind:      bipolar cone along ±Y, fading outward.
//   - Dust lanes:     subtractive fbm lane at the disk midplane.
//
// Doc 18 §Galaxy Animations note SFR-driven colour shift (young → older).
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palettes -------------------------------------------------------------
uniform vec3  u_youngStarColor;  // Doc 17 ENT-6050: #5085FF bright blue.
uniform vec3  u_oldStarColor;    // aging A/F stars: white.
uniform vec3  u_hiiColor;        // Hα red (#FF3333).
uniform vec3  u_dustCoolColor;   // 40 K cool dust (#663300).
uniform vec3  u_dustWarmColor;   // 70–100 K warm dust (#FF8833).
uniform vec3  u_superwindColor;  // hot gas #99CCFF.
uniform vec3  u_nucleusColor;    // bright nuclear cluster.

// ---- structure ------------------------------------------------------------
uniform float u_diskRadius;       // exponential disk scale (local units).
uniform float u_diskThickness;    // gaussian vertical σ.
uniform float u_nucleusStrength;  // nuclear starburst brightness.
uniform float u_hiiClumpCount;    // number of HII knots (0..16).
uniform float u_hiiClumpIntensity;
uniform float u_superwindStrength;// bipolar outflow opacity.
uniform float u_superwindAxisReach; // how far the cone reaches (0..1).
uniform float u_dustStrength;     // subtractive dust along midplane.
uniform float u_ulirgBlend;       // 0 = pure starburst, 1 = dusty ULIRG.
uniform float u_dualNucleus;      // 0 = single, 1 = merger dual-core (ULIRG).
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

// Deterministic HII clump placement — mirrors irregular shader logic.
vec4 hiiClumpAt(int i) {
  float fi = float(i);
  vec3 c = vec3(
    cosmos_hash21(vec2(fi, 1.7) + 0.3),
    cosmos_hash21(vec2(fi, 2.9) + 0.7) * 0.3,  // concentrated near midplane
    cosmos_hash21(vec2(fi, 3.4) + 1.9)
  );
  // Re-centre around origin, restrict to the disk.
  c = c * vec3(1.0, 0.6, 1.0) - vec3(0.5, 0.15, 0.5);
  float w = 0.5 + 0.5 * cosmos_hash21(vec2(fi, 5.1) + 2.7);
  return vec4(c, w);
}

float hiiContribution(vec3 p, out vec3 color) {
  float total = 0.0;
  color = vec3(0.0);
  int count = int(clamp(u_hiiClumpCount, 0.0, 16.0));
  for (int i = 0; i < 16; i++) {
    if (i >= count) break;
    vec4 c = hiiClumpAt(i);
    float r = length(p - c.xyz);
    float radius = 0.09 + 0.06 * c.w;
    float g = exp(-pow(r / radius, 2.0));
    total += g * c.w;
    color += mix(u_hiiColor, u_youngStarColor, 0.35) * g * c.w * u_hiiClumpIntensity;
  }
  return total;
}

// Superwind X-shape — bipolar double cone along ±Y. Cone half-angle ~30°.
float superwindDensity(vec3 p) {
  if (u_superwindStrength <= 0.001) return 0.0;
  float alongY = abs(p.y);
  float radiusXZ = length(p.xz);
  // Half-opening angle 30° → tan(30°) ≈ 0.577.
  float coneBoundary = alongY * 0.577 + 0.03;
  float inCone = smoothstep(coneBoundary + 0.06, coneBoundary, radiusXZ);
  float along = exp(-alongY / max(u_superwindAxisReach, 1e-4));
  return inCone * along;
}

// Dual-nucleus ULIRG merger profile — two compact cores at ±X ~0.16.
float dualNucleus(vec3 p) {
  if (u_dualNucleus <= 0.001) return 0.0;
  float d1 = length(p - vec3(-0.16, 0.0, 0.0));
  float d2 = length(p - vec3( 0.16, 0.0, 0.0));
  return (exp(-pow(d1 / 0.07, 2.0)) + exp(-pow(d2 / 0.07, 2.0))) * u_dualNucleus;
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

  for (int i = 0; i < GALAXY_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    // Exponential disk density.
    float rXZ = length(p.xz);
    float diskRad = exp(-rXZ / max(u_diskRadius, 1e-4));
    float diskVert = exp(-pow(p.y / max(u_diskThickness, 1e-4), 2.0));
    float disk = diskRad * diskVert;

    // Nuclear starburst — concentrated near origin.
    float nucleus = exp(-pow(length(p) / 0.18, 2.0)) * u_nucleusStrength;

    // HII clump sum.
    vec3 hiiColor;
    float hii = hiiContribution(p, hiiColor);

    // Bipolar superwind outflow.
    float wind = superwindDensity(p) * u_superwindStrength;

    // ULIRG dual nucleus.
    float dual = dualNucleus(p);

    float density = disk * 1.2 + nucleus * 0.9 + hii * 0.8 + wind * 0.4 + dual * 1.2;
    if (density < 0.003) {
      t += stepSize;
      continue;
    }

    // Base star-population colour — blue bias in pure starburst, shifting
    // warm when ULIRG blend is high (heavy dust reddening).
    vec3 starburstColor = mix(u_youngStarColor, u_oldStarColor, 0.25);
    vec3 ulirgColor     = mix(u_dustWarmColor, u_dustCoolColor, 0.4);
    vec3 diskColor = mix(starburstColor, ulirgColor, u_ulirgBlend);
    vec3 color = diskColor * disk;
    color += u_nucleusColor * nucleus * 2.2;
    color += hiiColor * 1.3;
    color += u_superwindColor * wind * 1.5;
    color += u_dustWarmColor * dual * 2.4;

    // Dust subtractive lane near midplane — heavier in ULIRG.
    float dust = cosmos_fbm(p * 3.4, 3);
    float laneVert = exp(-pow(p.y / max(u_diskThickness * 0.5, 1e-4), 2.0));
    float laneRadial = exp(-rXZ / max(u_diskRadius * 1.4, 1e-4));
    float dustAmt = clamp(dust, 0.0, 1.0) * laneVert * laneRadial
                    * (u_dustStrength + u_ulirgBlend * 0.6);
    color = mix(color, u_dustCoolColor * 0.5, clamp(dustAmt * 0.9, 0.0, 0.85));

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
