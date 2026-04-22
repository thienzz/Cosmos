// Cosmos Explorer — Pillar / EGG nebula shader (T-V-48, Tier B).
//
// Doc 18 §Star-Forming Objects. Renders erosion-sculpted pillars
// (M16 "Pillars of Creation") or evaporating gaseous globules (EGGs)
// via elongated density columns silhouetted against a softer halo.
//
//   #define PILLAR_EGG  — compact pillar-tip globule variant.

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
float vn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash3(i), hash3(i+vec3(1,0,0)), f.x), mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x), mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

void main() {
  vec3 P = v_modelPos;
  // Pillar = tall vertical column, tapered top.
  float axial = 0.5 + 0.5 * P.y;
  float radius = length(P.xz);
  float taper = mix(1.0, 0.4, smoothstep(-0.2, 0.8, P.y));
  float pillarDensity = smoothstep(taper, taper * 0.5, radius);

  float turbulence = vn(P * 4.0 + u_shapeSeed + u_time * 0.02);
  pillarDensity *= 0.6 + 0.4 * turbulence;

  // Back-light Hα rim on the windward face (+X).
  vec3 N = normalize(v_normalW);
  float rim = max(dot(N, vec3(1, 0, 0)), 0.0);

  vec3 dark = vec3(0.1, 0.08, 0.05);
  vec3 rimColor = vec3(1.1, 0.5, 0.35);
  vec3 col = mix(dark, rimColor, pow(rim, 2.0) * 0.9) * pillarDensity;

  #ifdef PILLAR_EGG
    // Compact globule — concentrate density at pillar tip.
    float eggMask = smoothstep(0.6, 0.9, P.y) * smoothstep(0.4, 0.1, radius);
    col += vec3(0.9, 0.45, 0.3) * eggMask * 0.9;
  #endif

  float alpha = clamp(pillarDensity * 0.95, 0.0, 0.95);
  if (alpha < 0.02) discard;
  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
