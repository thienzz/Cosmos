// Cosmos Explorer — Great Wall / cosmic sheet shader (T-V-29).
//
// Doc 18 §Large-Scale Structures. Renders ENT-7032 "Great Wall" class
// planar sheets (Sloan Great Wall, CfA2) as thin lit planes with a
// galaxy-concentration density field.

in vec2 v_uv;
in float v_worldDepth;

uniform float u_time;
uniform float u_shapeSeed;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
#endif

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + u_shapeSeed) * 43758.5453);
}

void main() {
  vec2 uv = v_uv;
  vec2 g = floor(uv * 80.0);
  float galaxyLottery = hash2(g);
  float galaxy = step(0.93, galaxyLottery);
  // Density taper at wall edges.
  float taper = smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x) *
                smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);

  vec3 glow = vec3(0.65, 0.7, 1.0);
  vec3 col = glow * (0.05 + 0.9 * galaxy) * taper;
  float alpha = (0.05 + galaxy * 0.7) * taper;
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(v_worldDepth) * logDepthBufFC * 0.5;
  #endif
}
