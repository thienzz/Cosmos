// Cosmos Explorer — Cosmic void shader (T-V-29).
//
// Doc 18 §Large-Scale Structures. Renders ENT-7031 cosmic voids as
// spherical shells of DIMMING — the void interior is darker than the
// surrounding intergalactic medium. Rendered on a sphere mesh; the shader
// writes low-alpha additive darkening onto the far-background.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

void main() {
  float r = length(v_modelPos);
  // Dimming peaks in the centre, falls off linearly to the wall.
  float dim = smoothstep(1.0, 0.3, r);

  // Faint bluish-grey tint on the limb suggesting the wall contrast.
  vec3 col = mix(vec3(0.02, 0.02, 0.03), vec3(0.12, 0.12, 0.16), 1.0 - r);

  float alpha = dim * 0.45;
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
