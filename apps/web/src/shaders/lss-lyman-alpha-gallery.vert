// Cosmos Explorer — LSS gallery Lyman-α blob vertex shader (T-V-58).
//
// Gallery-scale volumetric cyan blob (ENT-7033). Distinct from lyman-
// alpha-blob.* which walks 16 samples inward for a deep-space render —
// this variant is a Gaussian + fbm single-shell used for the side-by-
// side gallery comparison. Paired with lss-lyman-alpha-gallery.frag.

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
