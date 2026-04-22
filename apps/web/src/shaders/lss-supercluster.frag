// Cosmos Explorer — Supercluster / galaxy-cluster node shader (T-V-29).
//
// Doc 18 §Large-Scale Structures. Renders ENT-7020 (galaxy group),
// ENT-7021 (galaxy cluster), ENT-7022 (supercluster) as translucent
// diffuse spheres with an Abell-richness-driven density taper.
//
// Defines:
//   #define LSS_GROUP      — R0, small sparse group.
//   #define LSS_CLUSTER    — R1..R2, denser core.
//   #define LSS_SUPERCL    — R3+, diffuse outer halo dominates.
//   (default)               LSS_CLUSTER.
//
// Pairs with lss-common.vert (shared transform). Extracted from
// LargeScaleStructureRenderer.ts inline material by T-V-29. Caller swap
// to MaterialFactory is T-V-58.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;
uniform float u_richness;   // 0..1 Abell proxy

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

float hash3(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}

void main() {
  float r = length(v_modelPos);
  float richness = clamp(u_richness, 0.0, 1.0);

  float core = 0.25;
  #ifdef LSS_GROUP
    core = 0.4;
  #endif
  #ifdef LSS_SUPERCL
    core = 0.12;
  #endif
  float falloff = exp(-r * r / (core * core));

  // Internal graininess — galaxy members.
  float grain = hash3(v_modelPos * (12.0 + 8.0 * richness) + u_shapeSeed);
  float stars = step(0.985 - 0.04 * richness, grain);

  vec3 haloColor = vec3(0.6, 0.55, 0.8);
  vec3 coreColor = vec3(1.0, 0.9, 0.7);
  vec3 col = mix(haloColor, coreColor, falloff) * (falloff + stars * 0.8);

  float alpha = clamp(falloff * (0.25 + 0.5 * richness) + stars * 0.6, 0.0, 0.85);
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
