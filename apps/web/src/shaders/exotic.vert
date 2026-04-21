// Cosmos Explorer — shared exotic-object vertex shader (T28).
//
// Parallels T27's nebula.vert: every exotic body (black hole, pulsar,
// magnetar) renders as a unit-cube volume (BoxGeometry(2, 2, 2)) that the
// fragment shader raymarches in model space.
//
// The only per-vertex work is writing the fragment's model-space position
// and passing the CPU-computed `u_cameraLocal` through to the fragment so
// it can reconstruct the ray origin without per-vertex matrix inverse.
//
// Three.js r184 injects `#version 300 es`, precision qualifiers, and the
// built-in uniforms. Do NOT redeclare them.

// @param u_cameraLocal — camera position in this mesh's local space.
uniform vec3 u_cameraLocal;

out vec3 v_modelPos;
out vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  v_modelPos = position;
  v_rayOriginLocal = u_cameraLocal;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
