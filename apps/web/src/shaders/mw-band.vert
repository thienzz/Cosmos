// Cosmos Explorer — Milky Way interior sphere vertex shader (T46a).
//
// Parallels CmbBoundarySphere.ts inline vert: a BackSide icosahedron wraps
// the camera at fixed world radius. v_pos carries the outward-pointing unit
// direction for the fragment shader to convert into Galactic (l, b).
//
// Three.js r184 injects `#version 300 es`, precision qualifiers, and the
// built-in uniforms (modelViewMatrix, projectionMatrix, position). Do NOT
// redeclare them.

out vec3 v_pos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  v_pos = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
