// Cosmos Explorer — Star point-sprite fragment shader (Doc 10 §6.2, Doc 18 §Star).
//
// Draws a soft circular sprite with an optional corona halo on QUALITY_HIGH.
// Fragments outside the unit disc are discarded so the point is actually round,
// not a fuzzy square.
//
// Three.js injects `#version 300 es` and precision qualifiers for GLSL3
// ShaderMaterial — do NOT redeclare them here.

// @param u_bloomThreshold — brightness above which corona/bloom tint kicks in.
uniform float u_bloomThreshold;

in vec3 v_color;
in float v_brightness;
in float v_twinkle;

// Pair with star-point.vert's log-depth varying.  Writing gl_FragDepth
// even on a transparent primitive is necessary for the depth test
// against opaque meshes to use the correct encoding.
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

void main() {
  // gl_PointCoord is in [0,1]. Remap to [-1,1] so r = 0 at centre.
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(coord, coord);
  if (r2 > 1.0) discard;

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  // Core: Gaussian-ish falloff — peak 1.0 at centre, 0 at edge.
  float core = 1.0 - smoothstep(0.0, 1.0, r2);

#ifdef QUALITY_HIGH
  // Wider additive halo for bright stars so they bloom past the disc radius.
  float corona = exp(-r2 * 4.0);
  float shape = clamp(core + corona * 0.35, 0.0, 1.0);
#else
  float shape = core;
#endif

  vec3 color = v_color * shape * v_brightness * v_twinkle;

  // Above-threshold stars push extra light into the halo tint — this is the
  // pre-bloom signal that the HDR post chain will expand in T30.
  if (v_brightness > u_bloomThreshold) {
    float over = (v_brightness - u_bloomThreshold) / max(1e-4, 1.0 - u_bloomThreshold);
    color += v_color * pow(over, 2.0);
  }

  fragColor = vec4(color, shape);
}
