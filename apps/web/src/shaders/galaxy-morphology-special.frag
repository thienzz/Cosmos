// Cosmos Explorer — special-morphology galaxy fragment shader (T46).
//
// Covers four collision/environment-driven morphologies that don't fit the
// standard Hubble sequence, implemented as one raymarched shader selected
// by the discrete `u_specialSubtype` uniform:
//
//   0 = Ring (Hoag-type / Cartwheel)   — ENT-6051
//   1 = Jellyfish (ram-pressure tail)  — ENT-6052
//   2 = UDG (ultra-diffuse)            — ENT-6054
//   3 = Merging/Interacting pair       — ENT-6055
//
// Each subtype reuses the same composition primitives (stellar density,
// young-star tint, dust, emission) but with radically different geometry:
//
//   Ring     : torus density wave + optional spokes; blue leading edge.
//   Jellyfish: disk + trailing gas tail along +X with age gradient.
//   UDG      : very extended exponential halo + rare GC sparkle; transparent.
//   Merging  : two Sérsic cores + tidal bridge + long tidal tail.
//
// Doc 17 ENT-6051/6052/6054/6055 provided the reference palette and
// morphology formulas.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

uniform vec3  u_shockFrontColor;  // Ring leading edge / fresh OB (#0040FF).
uniform vec3  u_ringBulkColor;    // Ring main body (#4A90E2).
uniform vec3  u_trailColor;       // Ring trailing / jellyfish tail (#FFFFFF).
uniform vec3  u_nucleusColor;     // Ring nucleus / UDG old core (#FFD9B3).
uniform vec3  u_dustColor;        // Ring/jellyfish dust lane.
uniform vec3  u_gasColor;         // Hα / Ionised gas (#FF6666).
uniform vec3  u_udgColor;         // UDG faint tan halo (#C9976B).
uniform vec3  u_gcColor;          // UDG metal-poor GC (#6688DD).
uniform vec3  u_tidalTailColor;   // Merger tail stars.
uniform vec3  u_brightCoreColor;  // Merging starburst core yellow.

// ---- parameters -----------------------------------------------------------
uniform float u_specialSubtype;   // 0=Ring, 1=Jellyfish, 2=UDG, 3=Merging.

// Ring parameters.
uniform float u_ringRadius;
uniform float u_ringWidth;
uniform float u_ringSpokes;       // 0 = Hoag (clean), 1 = Cartwheel (spoked).
uniform float u_ringNucleus;      // 0 = detached, 1 = bright nucleus.
uniform float u_ringExpansion;    // rotation/expansion phase input (time-driven).

// Jellyfish parameters.
uniform float u_jellyTailLength;
uniform float u_jellyCompression; // leading-edge density enhancement.
uniform float u_jellyTailClumps;  // 0 = smooth tail, 1 = clumpy.

// UDG parameters.
uniform float u_udgHaloRadius;
uniform float u_udgGcCount;       // 0..24 GCs visible.
uniform float u_udgNucleated;     // 0 = smooth, 1 = nucleated dwarf core.

// Merging parameters.
uniform float u_mergerSeparation; // distance between the two cores (local u.).
uniform float u_mergerStage;      // 0=pre, 1=bridge, 2=advanced, 3=post.
uniform float u_mergerTailLength;

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

// Integer subtype for discrete branching.
int subtypeId() {
  return int(clamp(u_specialSubtype + 0.5, 0.0, 3.0));
}

// --------- Ring subtype ----------------------------------------------------
// Torus density wave in the XZ plane + optional radial spokes.
float ringDensityAt(vec3 p, out vec3 color) {
  float rXZ = length(p.xz);
  float theta = atan(p.z, p.x);
  float radialProfile = exp(-pow((rXZ - u_ringRadius) / max(u_ringWidth, 1e-4), 2.0));
  float vert = exp(-pow(p.y / 0.04, 2.0));
  float ring = radialProfile * vert;

  // m=1 azimuthal perturbation for subtle asymmetry (shock front).
  float azim = 1.0 + 0.25 * cos(theta + u_ringExpansion * 0.3);
  ring *= azim;

  // Spokes — radial ridges connecting nucleus to ring.
  float spokes = 0.0;
  if (u_ringSpokes > 0.01) {
    float spokeWave = 0.5 + 0.5 * cos(6.0 * theta);
    float spokeRadial = exp(-pow(rXZ / max(u_ringRadius * 1.05, 1e-4), 2.0));
    spokes = pow(spokeWave, 4.0) * spokeRadial * vert * u_ringSpokes * 0.5;
  }

  // Nucleus (Hoag central spheroid).
  float nucleus = exp(-pow(length(p) / 0.11, 2.0)) * u_ringNucleus;

  // Colour: shock front at cos(theta) > 0 is bluer / younger.
  float shockPhase = 0.5 + 0.5 * cos(theta - u_ringExpansion * 0.3);
  vec3 ringColor = mix(u_trailColor, u_shockFrontColor, shockPhase);
  ringColor = mix(ringColor, u_ringBulkColor, 0.35);
  color = ringColor * ring + u_nucleusColor * nucleus * 1.6;
  // Spokes rendered with dust tint (dark bridges) but bright bridge stars at peak.
  color += u_ringBulkColor * spokes;
  // Gas emission along shock front.
  color += u_gasColor * ring * shockPhase * 0.35;
  return ring + nucleus + spokes;
}

// --------- Jellyfish subtype ----------------------------------------------
// Leading-edge compressed disk + trailing tail along +X with age gradient.
float jellyDensityAt(vec3 p, out vec3 color) {
  // Disk body near origin.
  float rXZ = length(p.xz);
  float vert = exp(-pow(p.y / 0.06, 2.0));
  float disk = exp(-rXZ / 0.45) * vert;

  // Leading-edge compression along -X (motion direction).
  float facing = max(0.0, -p.x);
  disk *= (1.0 + facing * u_jellyCompression);

  // Trailing tail — exponential stream along +X.
  float alongTail = clamp(p.x, 0.0, 1.5);
  float acrossTail = length(p.yz);
  float tailAlong = exp(-alongTail / max(u_jellyTailLength, 1e-4));
  float tailAcross = exp(-pow(acrossTail / 0.2, 2.0));
  float tail = tailAlong * tailAcross * step(0.0, p.x);

  // Optional clumps along the tail.
  if (u_jellyTailClumps > 0.01) {
    float clumpPhase = sin(p.x * 8.0 + cosmos_hash21(p.yz * 5.0) * 6.0);
    tail *= (1.0 + clamp(clumpPhase, 0.0, 1.0) * u_jellyTailClumps * 0.8);
  }

  // Age gradient — tail base (small x) blue, tip red/white.
  float ageNorm = clamp(alongTail / max(u_jellyTailLength * 1.1, 1e-4), 0.0, 1.0);
  vec3 tailColor;
  if (ageNorm < 0.33) tailColor = mix(u_shockFrontColor, u_trailColor, ageNorm / 0.33);
  else if (ageNorm < 0.67) tailColor = mix(u_trailColor, u_gasColor, (ageNorm - 0.33) / 0.34);
  else tailColor = mix(u_gasColor, u_dustColor, (ageNorm - 0.67) / 0.33);

  // Leading edge yellowish (dust scattering).
  vec3 diskColor = mix(u_ringBulkColor, u_nucleusColor, clamp(facing * 1.2, 0.0, 1.0));

  color = diskColor * disk + tailColor * tail * 0.9;
  color += u_gasColor * tail * (1.0 - ageNorm) * 0.5;
  return disk + tail;
}

// --------- UDG subtype ----------------------------------------------------
// Very extended exponential halo + sparse GC sparkle; transparent.
float udgDensityAt(vec3 p, out vec3 color) {
  float r = length(p);
  float halo = exp(-r / max(u_udgHaloRadius, 1e-4));
  // Keep it faint — dial density down so background shows through.
  halo *= 0.3;

  // Nucleated core.
  float nucleus = exp(-pow(r / 0.07, 2.0)) * u_udgNucleated;

  // Globular clusters — spatial-hash point sparkle, sparse (count gated).
  float sparkle = 0.0;
  vec3 cell = floor(p * 6.0);
  float hash = cosmos_hash31(cell + 1.3);
  float threshold = clamp(1.0 - u_udgGcCount / 24.0, 0.0, 0.99);
  if (hash > threshold) {
    vec3 local = fract(p * 6.0) - 0.5;
    float d = length(local);
    sparkle = smoothstep(0.22, 0.0, d) * (0.6 + 0.4 * hash);
  }

  color = u_udgColor * halo + u_nucleusColor * nucleus * 1.3 + u_gcColor * sparkle;
  return halo + nucleus + sparkle * 0.25;
}

// --------- Merging subtype ------------------------------------------------
// Two Sérsic cores + tidal bridge between + a long tidal tail along +X.
float mergingDensityAt(vec3 p, out vec3 color) {
  float sep = max(u_mergerSeparation, 0.02);
  vec3 c1 = vec3(-sep, 0.0, 0.0);
  vec3 c2 = vec3( sep, 0.0, 0.0);

  float r1 = length(p - c1);
  float r2 = length(p - c2);
  // Sérsic-like n=2.5 bulges, slightly different sizes for visual interest.
  float core1 = exp(-3.0 * pow(max(r1, 1e-3) / 0.28, 0.4));
  float core2 = exp(-3.0 * pow(max(r2, 1e-3) / 0.22, 0.4));

  // Tidal bridge — thin cylinder between the two cores along ±X.
  float alongBridge = clamp(p.x / sep, -1.0, 1.0);
  float bridgeAlong = exp(-pow(alongBridge, 2.0) * 2.2);
  float bridgeAcross = exp(-pow(length(p.yz) / 0.09, 2.0));
  float bridge = bridgeAlong * bridgeAcross * (u_mergerStage * 0.5 + 0.5);

  // Advanced/post-merger tidal tail along +X beyond c2.
  float tail = 0.0;
  if (u_mergerStage > 0.5) {
    float alongTail = clamp(p.x - sep, 0.0, 1.4);
    float acrossTail = length(p.yz);
    tail = exp(-alongTail / max(u_mergerTailLength, 1e-4))
           * exp(-pow(acrossTail / 0.14, 2.0))
           * step(0.0, p.x - sep) * 0.55;
  }

  // HII-burst bloom at bridge midpoint — starburst trigger.
  float bridgeBurst = bridgeAlong * exp(-pow(p.x / 0.12, 2.0)) * bridgeAcross
                      * (1.0 - abs(u_mergerStage - 1.5) * 0.3);

  float density = core1 * 0.9 + core2 * 0.9 + bridge * 0.4 + tail * 0.5 + bridgeBurst * 0.4;

  vec3 coreColor = mix(u_nucleusColor, u_brightCoreColor, u_mergerStage * 0.35);
  color = coreColor * (core1 + core2) * 1.2;
  color += u_tidalTailColor * tail * 0.9;
  color += u_shockFrontColor * bridge * 0.6;
  color += u_gasColor * bridgeBurst * 1.4;
  return density;
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

  int sid = subtypeId();

  // Alpha-gain per subtype — UDG is transparent, others are dense.
  float alphaGain = (sid == 2) ? 0.9 : 1.6;

  for (int i = 0; i < GALAXY_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    vec3 color = vec3(0.0);
    float density = 0.0;
    if (sid == 0) density = ringDensityAt(p, color);
    else if (sid == 1) density = jellyDensityAt(p, color);
    else if (sid == 2) density = udgDensityAt(p, color);
    else density = mergingDensityAt(p, color);

    if (density < 0.003) {
      t += stepSize;
      continue;
    }

    float sampleAlpha = clamp(density, 0.0, 1.0) * stepSize * alphaGain;
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
