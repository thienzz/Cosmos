// Cosmos Explorer — TDE shader (T-V-55).
// Tidal Disruption Event: stellar stream + accretion flare around a SMBH.

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

  // Accretion disk thin torus.
  float rInPlane = length(P.xz);
  float disk = exp(-abs(P.y) * 15.0) * smoothstep(0.15, 0.4, rInPlane) *
               smoothstep(0.8, 0.5, rInPlane);
  float spiral = 0.5 + 0.5 * cos(atan(P.z, P.x) * 3.0 + u_time * 0.8 - rInPlane * 6.0);
  disk *= 0.6 + 0.4 * spiral;

  // Central flare pulse.
  float pulse = 0.7 + 0.3 * sin(u_time * 2.0 + u_shapeSeed * 6.28);
  float flare = exp(-r * r * 45.0) * pulse;

  vec3 diskColor = vec3(1.2, 0.85, 0.5);
  vec3 flareColor = vec3(1.5, 1.2, 0.9);
  vec3 col = diskColor * disk * 1.4 + flareColor * flare * 2.0;
  float alpha = clamp(disk * 0.85 + flare * 1.1, 0.0, 1.0);
  if (alpha < 0.01) discard;
  fragColor = vec4(col, alpha);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
