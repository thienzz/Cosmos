// Cosmos Explorer — Search target marker orb fragment shader (T-V-58).
//
// Rim-lit sphere with fresnel falloff + slow hue pulse so the orb reads
// against a black starfield background as a "you arrived here" UI anchor.
// Paired with search-marker-orb.vert; driven by MaterialFactory via the
// 'search-marker-orb' registry key. See SearchTargetMarker.ts for the host.

in vec3 v_normal;
in vec3 v_worldPos;

uniform float u_time;
// @param u_color — base orb color (vec3 0..1). Supplied per-instance via the
// render block so different search flyovers can use distinct hues.
uniform vec3 u_color;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

void main() {
  vec3 view = normalize(cameraPosition - v_worldPos);
  float fres = pow(1.0 - max(0.0, dot(v_normal, view)), 2.0);
  float core = max(0.0, dot(v_normal, view));
  // Slow hue shift so multiple simultaneous markers read distinctly.
  float pulse = 0.6 + 0.4 * sin(u_time * 1.7);
  vec3 col = u_color * (core * 0.7 + fres * 1.5 * pulse);
  // Alpha falloff on rim so the sphere looks translucent, not cartoony.
  float a = 0.35 + 0.55 * fres;
  fragColor = vec4(col, a);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
