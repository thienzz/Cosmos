// Cosmos Explorer — GRB afterglow shader (T-V-55, Tier B transient).
//
// Gamma-ray burst afterglow: expanding fireball with time-dependent colour
// fade (hot blue at peak → orange → red → dim). u_age 0..1 drives phase.

in vec3 v_modelPos;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;
uniform float u_age;   // 0 = peak, 1 = faded

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

void main() {
  float r = length(v_modelPos);
  // Fireball shell — radial density with age-driven width.
  float shellR = 0.4 + u_age * 0.55;
  float shell = exp(-pow((r - shellR) / (0.15 + u_age * 0.2), 2.0));
  // Colour ramp peak → fade.
  vec3 hot = vec3(1.2, 1.05, 0.85);
  vec3 warm = vec3(1.1, 0.6, 0.3);
  vec3 cool = vec3(0.55, 0.25, 0.15);
  vec3 col = mix(hot, mix(warm, cool, u_age), u_age);
  float brightness = mix(2.0, 0.2, u_age);
  vec3 final = col * shell * brightness;
  float alpha = shell * mix(0.95, 0.2, u_age);
  if (alpha < 0.01) discard;
  fragColor = vec4(final, alpha);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
