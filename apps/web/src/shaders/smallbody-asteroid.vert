// Cosmos Explorer — small-body asteroid vertex shader (T-V-03).
//
// Doc 18 §Small Bodies. Renders Tholen C/S/M/V asteroids on a lumpy
// low-poly sphere geometry. The CPU side can optionally pass an irregular
// mesh (Doc 18 §3635 "irregular polyhedron") — this vertex shader treats
// it as opaque geometry and just passes normals + positions downstream.
//
// Three.js injects `#version 300 es`, precision, built-in attributes and
// matrices — do NOT redeclare.

out vec3 v_modelPos;
out vec3 v_normalW;
out vec3 v_viewDirW;
out vec3 v_worldPos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  v_worldPos = worldPos.xyz;
  v_modelPos = position;
  v_normalW = normalize(mat3(modelMatrix) * normal);
  v_viewDirW = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
