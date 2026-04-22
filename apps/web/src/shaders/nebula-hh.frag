// Cosmos Explorer — Herbig-Haro nebula shader (T-V-48, Tier B).
//
// Doc 18 §Star-Forming Objects. Renders HH jet-cloud collision fronts:
// a bow shock front in Hα, with compact knots and optional bipolar jet.
//
//   #define HH_BIPOLAR  — adds the opposing-side blueshifted jet.

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
  vec3 P = v_modelPos;
  // Axial bow — bright on +X cone.
  float axial = P.x;
  float cone = smoothstep(0.0, 1.0, axial) * exp(-(P.y*P.y + P.z*P.z) * 3.5);
  // Knots in the jet — hash-driven flickers.
  float knots = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float jx = 0.3 + 0.2 * fi;
    float d = distance(P, vec3(jx, 0.0, 0.0));
    float k = smoothstep(0.15, 0.0, d) * (0.6 + 0.4 * hash3(P * 5.0 + fi + u_shapeSeed));
    knots += k;
  }

  vec3 col = vec3(1.2, 0.4, 0.35) * cone + vec3(1.3, 0.5, 0.4) * knots;

  #ifdef HH_BIPOLAR
  {
    float coneB = smoothstep(0.0, 1.0, -axial) * exp(-(P.y*P.y + P.z*P.z) * 3.5);
    col += vec3(0.5, 0.55, 1.1) * coneB * 0.8;
  }
  #endif

  float alpha = clamp(cone * 0.7 + knots * 1.2, 0.0, 0.95);
  if (alpha < 0.01) discard;
  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
