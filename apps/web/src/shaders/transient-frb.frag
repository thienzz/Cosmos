// Cosmos Explorer — FRB site shader (T-V-55, Tier B transient).
//
// Fast Radio Burst site: millisecond-flash visual indicator (pulsed point)
// embedded in a host-galaxy halo.

in vec3 v_modelPos;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

void main() {
  float r = length(v_modelPos);
  // Galaxy halo — soft Gaussian.
  float halo = exp(-r * r * 1.8);
  // Pulse — sharp narrow flashes every ~1.2s.
  float phase = fract(u_time * 0.7 + u_shapeSeed);
  float flash = smoothstep(0.02, 0.0, abs(phase - 0.5)) * 4.0;
  float point = exp(-r * r * 120.0) * flash;
  vec3 haloColor = vec3(0.4, 0.6, 0.85);
  vec3 burstColor = vec3(1.3, 1.1, 1.5);
  vec3 col = haloColor * halo * 0.4 + burstColor * point;
  float alpha = halo * 0.3 + point * 0.9;
  if (alpha < 0.01) discard;
  fragColor = vec4(col, alpha);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
