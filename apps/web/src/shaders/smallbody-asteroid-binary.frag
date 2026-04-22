// Cosmos Explorer — binary asteroid shader (T-V-04).
//
// Two modes, selected via `#define`:
//   #define BINARY_CONTACT  — single-mesh contact binary (Arrokoth ENT-4016).
//                             Models the dumbbell shape as two lobes along
//                             the body's Y axis, with ambient occlusion
//                             injected at the neck seam.
//   #define BINARY_PAIR     — CPU spawns two separate mesh instances for
//                             the pair (Didymos/Dimorphos, ENT-4014). The
//                             shader then just adds a subtle partner-cast
//                             shadow via `u_partnerDir` when available.
//
// Falls back to single-body rendering without either define — identical to
// smallbody-asteroid at that point. Shares the same value-noise faceting
// and crater-field primitives so visual consistency is guaranteed.
//
// Three.js injects `#version 300 es`, precision, and depth uniforms.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

uniform vec3 u_sunDir;
uniform float u_time;
uniform float u_shapeSeed;
// @param u_partnerDir — direction from this body TO its orbital partner,
// world-space unit vec. Zero vec => no partner (single body).
uniform vec3 u_partnerDir;
// @param u_partnerRadiusRatio — partner radius / this radius (for soft-shadow
// penumbra width). Zero => no partner shadow.
uniform float u_partnerRadiusRatio;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

float hash(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i + vec3(0, 0, 0));
  float n100 = hash(i + vec3(1, 0, 0));
  float n010 = hash(i + vec3(0, 1, 0));
  float n110 = hash(i + vec3(1, 1, 0));
  float n001 = hash(i + vec3(0, 0, 1));
  float n101 = hash(i + vec3(1, 0, 1));
  float n011 = hash(i + vec3(0, 1, 1));
  float n111 = hash(i + vec3(1, 1, 1));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p, int octaves) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    v += amp * valueNoise(p);
    p *= 2.13;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec3 N = normalize(v_normalW);
  vec3 L = normalize(u_sunDir);
  float lambert = max(dot(N, L), 0.0);

  // Base S-type-like albedo (contact binaries / binary pairs are mostly
  // silicate per observational stats).
  vec3 base = vec3(0.35, 0.28, 0.22) * 0.7;
  float facets = fbm(v_modelPos * 7.0 + u_shapeSeed, 3);
  base *= 0.75 + 0.25 * facets;

  float shading = lambert * 0.88 + 0.12;
  vec3 col = base * shading;

  #ifdef BINARY_CONTACT
  {
    // Neck AO: darken pixels whose model-space Y is near zero (the seam
    // between the two lobes). Stronger darkening where the normal also
    // points sideways (shadowed by both lobes).
    float neckY = abs(v_modelPos.y);
    float sideways = 1.0 - abs(dot(N, vec3(0, 1, 0)));
    float neckMask = smoothstep(0.35, 0.0, neckY) * sideways;
    float neckAO = 1.0 - 0.55 * neckMask;
    col *= neckAO;

    // Small bump at the seam where regolith piles up.
    float seamHi = smoothstep(0.2, 0.0, neckY) * (1.0 - sideways);
    col += vec3(0.03, 0.025, 0.02) * seamHi;
  }
  #endif

  #ifdef BINARY_PAIR
  if (dot(u_partnerDir, u_partnerDir) > 0.1) {
    // Partner-cast shadow: when this body sits between the partner and
    // the sun, the partner's silhouette falls on our near-partner face.
    // Approximate with a dot-based cone — penumbra softened by the
    // partner's apparent angular radius (u_partnerRadiusRatio is a proxy
    // for distance/size).
    vec3 P = normalize(u_partnerDir);
    float alignment = dot(N, -P);                     // face-toward-partner
    float sunPartnerAngle = dot(L, P);                // sun behind partner?
    float eclipse = smoothstep(0.4, 0.95, alignment) *
                    smoothstep(-0.2, 0.7, sunPartnerAngle);
    float penumbra = clamp(1.0 - eclipse * (0.25 + 0.35 * u_partnerRadiusRatio), 0.0, 1.0);
    col *= penumbra;
  }
  #endif

  fragColor = vec4(col, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
