// Cosmos Explorer — Kilonova remnant shader (T-V-55).
// Neutron-star merger afterglow — r-process enriched ejecta, fading over weeks.

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

float hash3(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 P = v_modelPos;
  float r = length(P);

  // Red + blue components — red "kilonova" lanthanide-rich + blue jet.
  float redEjecta = exp(-pow((r - 0.5) * 3.5, 2.0));
  float blueJet = exp(-pow((P.y / 0.35), 2.0)) * exp(-length(P.xz) * length(P.xz) * 18.0);

  // Turbulent texture in the red ejecta.
  float turbulence = 0.7 + 0.3 * hash3(P * 6.0 + u_shapeSeed);

  vec3 red = vec3(1.1, 0.35, 0.22) * redEjecta * turbulence;
  vec3 blue = vec3(0.55, 0.7, 1.3) * blueJet * 0.8;
  float brightness = mix(2.2, 0.3, u_age);
  vec3 col = (red + blue) * brightness;
  float alpha = clamp((redEjecta + blueJet) * brightness * 0.5, 0.0, 0.95);
  if (alpha < 0.01) discard;
  fragColor = vec4(col, alpha);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
