// Cosmos Explorer — irregular galaxy fragment shader
// (T29 ENT-6030 Irr I Magellanic + T46 ENT-6031 Irr II tidal-disruption).
//
// Doc 18 §Irregular Galaxy + Doc 17 ENT-6030/6031 + Doc 22. Raymarches a
// chaotic density blob inside the unit cube:
//
//   base density = fbm(p * fbmScale) — no preferred axis
//   starburst clumps = N gaussian peaks placed by spatial hash
//   tidal stretch = asymmetric compression along +X
//   tidal tail = Doc 17 ENT-6031: long extended low-density stream
//   dust chaos = Doc 17 ENT-6031: fragmented absorbing patches
//   HII halos = ring of bright pink around each starburst clump
//
// T46 Irr II via uniforms (same shader, varied uniforms):
//   u_tidalTailStrength — 0 = Irr I, 1 = Irr II extended tail along +X.
//   u_dustChaos         — 0 = Irr I mild dust, 1 = Irr II fragmented lanes.
//   u_dualNucleus       — 0 = single core, 1 = mid-merger two-core blob.
//
// Colour blend: young-star blue where starburst regions dominate, older-star
// yellow fills the rest. Dust tint subtracts from the background in
// heavily-dust-weighted fbm regions.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3 u_youngStarColor;  // Doc 22 #1 blue-white
uniform vec3 u_oldStarColor;    // Doc 22 #1 warm yellow
uniform vec3 u_starburstColor;  // Doc 22 #8 starburst orange
uniform vec3 u_hiiColor;        // Doc 22 #12 HII pink
uniform vec3 u_dustColor;       // Doc 22 dust brown

// ---- parameters -----------------------------------------------------------
uniform float u_fbmScale;
uniform float u_clumpCount;
uniform float u_clumpIntensity;
uniform float u_tidalStretch;
uniform float u_tidalTailStrength; // ENT-6031: 0=Irr I, 1=Irr II extended tail.
uniform float u_dustChaos;         // ENT-6031: fragmented absorbing patches.
uniform float u_dualNucleus;       // ENT-6031: 1 = mid-merger dual core.
uniform float u_hiiStrength;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef GALAXY_STEPS
  #define GALAXY_STEPS 52
#endif

// Place N starburst clumps via spatial hash on the [-1,1]³ cube. We seed
// the hash with integer indices so placement is deterministic per `#count`.
// Returns the clump centre and intensity for clump index `i`.
vec4 clumpAt(int i) {
  // Deterministic clump centre in [-0.55, 0.55]³ — keep them inside the
  // visible envelope after tidal stretch.
  float fi = float(i);
  vec3 c = vec3(
    cosmos_hash21(vec2(fi, 1.0) + 0.5),
    cosmos_hash21(vec2(fi, 2.0) + 1.5),
    cosmos_hash21(vec2(fi, 3.0) + 2.5)
  ) * 1.1 - 0.55;
  float intensity = 0.6 + 0.4 * cosmos_hash21(vec2(fi, 4.0) + 5.5);
  return vec4(c, intensity);
}

float clumpContribution(vec3 p, out vec3 color) {
  float total = 0.0;
  color = vec3(0.0);
  int count = int(clamp(u_clumpCount, 0.0, 16.0));
  for (int i = 0; i < 16; i++) {
    if (i >= count) break;
    vec4 c = clumpAt(i);
    float r = length(p - c.xyz);
    float radius = 0.18 + 0.08 * c.w;
    float g = exp(-pow(r / radius, 2.0));
    float halo = exp(-pow(r / (radius * 2.2), 2.0)) - g;
    total += g * c.w;
    color += mix(u_starburstColor, u_youngStarColor, 0.5) * g * c.w * u_clumpIntensity;
    color += u_hiiColor * max(halo, 0.0) * c.w * u_hiiStrength;
  }
  return total;
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
    vec3 raw = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(raw), vec3(1.001)))) break;

    // Tidal stretch: compress along +X so density trails asymmetrically.
    vec3 p = raw;
    p.x += u_tidalStretch * (raw.x - 0.5) * 0.4;

    // Envelope: fade near the AABB faces to avoid a hard billboard edge.
    float env = cosmos_radialFalloff(p, 1.0, 1.5);

    // Base chaotic density.
    float fbm = cosmos_fbm(p * u_fbmScale + vec3(u_time * 0.02), 4);
    float baseDensity = clamp(fbm - 0.25, 0.0, 1.0) * env;

    // Irr II extended tidal tail — exponential stream along +X (Doc 17
    // ENT-6031 "Tidal tail extends 2–5× main body diameter"). Core lies near
    // origin; tail trails toward +X with lateral gaussian falloff.
    float tidalTail = 0.0;
    if (u_tidalTailStrength > 0.01) {
      float alongTail = clamp(raw.x + 0.3, 0.0, 1.4);
      float acrossTail = length(raw.yz);
      float along = exp(-alongTail / 0.45) * step(-0.25, raw.x);
      float across = exp(-pow(acrossTail / 0.22, 2.0));
      tidalTail = along * across * u_tidalTailStrength * 0.4;
    }

    // Starburst clumps.
    vec3 clumpColor;
    float clumpDensity = clumpContribution(p, clumpColor) * env;

    // Mid-merger dual nucleus — two gaussian cores along ±X inside the
    // central 0.25 radius (Doc 17 ENT-6031 "advanced merger" stage).
    float dualCore = 0.0;
    if (u_dualNucleus > 0.01) {
      float d1 = length(raw - vec3(-0.18, 0.0, 0.0));
      float d2 = length(raw - vec3( 0.18, 0.0, 0.0));
      dualCore = (exp(-pow(d1 / 0.09, 2.0)) + exp(-pow(d2 / 0.09, 2.0))) * u_dualNucleus * 0.7;
    }

    float density = baseDensity + clumpDensity + tidalTail + dualCore;
    if (density < 0.003) {
      t += stepSize;
      continue;
    }

    // Base colour mix: where fbm is high, young-star tint dominates.
    float youthfulness = clamp(fbm * 1.2, 0.0, 1.0);
    vec3 color = mix(u_oldStarColor, u_youngStarColor, youthfulness) * baseDensity;
    color += clumpColor;
    // Tidal tail: mix of young (blue) and old (warm) stars depending on
    // stripping stage. For simplicity, tie to dual-nucleus state: late-stage
    // merger → redder tail; early → bluer.
    if (tidalTail > 0.0) {
      vec3 tailCol = mix(u_youngStarColor, u_oldStarColor, clamp(u_dualNucleus + 0.25, 0.0, 1.0));
      color += tailCol * tidalTail;
    }
    if (dualCore > 0.0) {
      color += u_oldStarColor * dualCore * 1.2;
    }

    // Dust subtractive tint — anti-correlates with stellar density.
    // Irr II dust chaos: multiply baseline with a cell-noise modulation so
    // patches appear fragmented rather than smoothly distributed.
    float dust = clamp(1.0 - fbm, 0.0, 0.6) * 0.35;
    if (u_dustChaos > 0.01) {
      float chaos = cosmos_fbm(p * (u_fbmScale * 2.4) + vec3(7.3, 1.1, 4.9), 3);
      dust = mix(dust, dust * smoothstep(0.35, 0.75, chaos) * 1.6, u_dustChaos);
    }
    color = mix(color, u_dustColor * 0.2, dust);

    float sampleAlpha = clamp(density, 0.0, 1.0) * stepSize * 1.5;
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
