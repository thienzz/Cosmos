// Cosmos Explorer — Trojan asteroid shader (T-V-08).
//
// Doc 18 §ENT-4051 (Jupiter Trojans, dominated by D-type). Renders the
// asteroid's body with a D-type palette (very dark reddish) and, when
// `u_showLagrangePoint > 0.5`, an outward fresnel halo tinted in a
// Lagrange-cluster accent colour to help identify L4 vs L5 swarms.
//
//   #define TROJAN_L4   — outer-leading swarm, warm accent halo.
//   #define TROJAN_L5   — inner-trailing swarm, cool accent halo.
//   (default)           — D-type body, no Lagrange colouring.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

uniform vec3 u_sunDir;
uniform float u_time;
uniform float u_shapeSeed;
// @param u_showLagrangePoint — 0..1, toggles the L4/L5 halo overlay.
uniform float u_showLagrangePoint;

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
float vn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x), f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x), f.y),
    f.z
  );
}

void main() {
  vec3 N = normalize(v_normalW);
  vec3 L = normalize(u_sunDir);
  vec3 V = normalize(v_viewDirW);

  float lambert = max(dot(N, L), 0.0);
  float shading = lambert * 0.88 + 0.12;

  // D-type body: very dark reddish-brown, albedo ~0.04.
  vec3 body = vec3(0.14, 0.10, 0.08);
  float facet = vn(v_modelPos * 6.0 + u_shapeSeed * 2.2);
  body *= 0.85 + 0.3 * facet;

  vec3 col = body * shading;

  // Lagrange halo overlay — fresnel rim in an accent colour.
  if (u_showLagrangePoint > 0.5) {
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 accent = vec3(0.9, 0.55, 0.2);           // default amber
    #ifdef TROJAN_L4
      accent = vec3(1.0, 0.78, 0.32);             // warm leading
    #endif
    #ifdef TROJAN_L5
      accent = vec3(0.45, 0.75, 1.0);             // cool trailing
    #endif
    col += accent * fresnel * 0.45;
  }

  fragColor = vec4(col, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
