// Cosmos Explorer — LSS gallery globular-cluster King-profile vertex (T-V-58).
//
// Single-sphere mesh for the globular-cluster gallery entry (ENT-7011
// internal → ENT-7040 Doc 22). Distinct from cluster-globular.* which uses
// a Plummer profile with starField speckle for the dedicated cluster view;
// this variant reads as a soft-shell integrated-light blur sized for the
// gallery-cell scale.

out vec3 v_modelPos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  v_modelPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
