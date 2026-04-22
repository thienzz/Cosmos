// Cosmos Explorer — LSS gallery open-cluster / OB-association point shader (T-V-58).
//
// Points-based additive sprite renderer for the LSS gallery (ENT-7010 open
// clusters, ENT-7012 OB associations). Per-vertex colour + size; pixel-ratio
// scaling so sprites stay crisp on HiDPI. Distinct from cluster-open.* which
// renders the cluster as a single spherical mesh with procedural impostors.

in vec3 color;
in float size;

uniform float u_pixelRatio;

out vec3 v_color;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  v_color = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(1.0, size * u_pixelRatio);
  gl_Position = projectionMatrix * mv;
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
