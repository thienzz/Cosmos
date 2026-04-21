// Cosmos Explorer — exoplanet host-star marker vertex shader.
//
// Expects a unit plane (PlaneGeometry centred at origin, size 2) and emits
// v_uv in [-1, 1] so the fragment shader can compute a radial field.

out vec2 v_uv;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  v_uv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
