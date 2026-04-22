// Cosmos Explorer — Sub-dwarf shader (T-V-31, Tier B).
//
// sdO: hot helium-burning remnant, bluer-than-main-sequence, low luminosity.
// sdB: cooler He-core burning, horizontal-branch-like but sub-MS lumminosity.
// Both sit below the main sequence on the HR diagram.
//
//   #define SUBDWARF_O  — sdO hot blue (~40000-70000 K effective).
//   #define SUBDWARF_B  (default) — sdB cooler blue (~25000-40000 K).

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;

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
  vec3 N = normalize(v_normalW);
  vec3 V = normalize(v_viewDirW);

  vec3 surface;
  #ifdef SUBDWARF_O
    surface = vec3(0.72, 0.85, 1.4);     // hot blue-white (lower than MS O)
  #else
    surface = vec3(0.55, 0.68, 1.1);     // cooler sdB blue
  #endif

  // Limb brightening (sub-dwarfs have thin atmospheres).
  float limb = pow(max(dot(N, V), 0.0), 0.35);
  // Granulation mottle.
  float g = 0.85 + 0.15 * hash3(v_modelPos * 20.0 + u_shapeSeed + u_time * 0.2);

  fragColor = vec4(surface * limb * g, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
