// Cosmos Explorer — X-ray burster shader (T-V-55).
// Compact neutron-star accretor with periodic X-ray bursts.

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
  vec3 P = v_modelPos;
  float r = length(P);
  // Persistent compact core.
  float core = exp(-r * r * 80.0);
  // Periodic bursts — sharp peaks every ~4s with u_shapeSeed phase offset.
  float cyclePhase = fract(u_time * 0.25 + u_shapeSeed);
  float burst = smoothstep(0.04, 0.0, abs(cyclePhase - 0.5)) *
                smoothstep(0.08, 0.0, abs(cyclePhase - 0.5)) * 3.5;
  float diskGlow = exp(-abs(P.y) * 12.0) * smoothstep(0.1, 0.25, length(P.xz)) *
                   smoothstep(0.5, 0.3, length(P.xz));

  vec3 xrayColor = vec3(1.0, 0.85, 1.5);
  vec3 diskColor = vec3(1.1, 0.55, 0.35);
  vec3 col = xrayColor * (core * (1.0 + burst)) + diskColor * diskGlow * 0.7;
  float alpha = clamp(core + diskGlow * 0.6 + core * burst * 0.4, 0.0, 0.98);
  if (alpha < 0.01) discard;
  fragColor = vec4(col, alpha);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
