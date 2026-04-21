// Cosmos Explorer — shared nebula vertex shader.
//
// Every nebula (Doc 18 §Nebula Rendering) is rendered as a unit cube in model
// space. The fragment shader raymarches in model space, so the only thing
// this vertex shader has to produce is:
//   - v_modelPos:       fragment's position in model space (raymarch entry).
//   - v_rayOriginLocal: camera position in model space (raymarch origin).
//
// `u_cameraLocal` is uploaded by the NebulaMaterial handle each frame from
// `mesh.worldToLocal(camera.position)`. We pre-compute it on the CPU rather
// than calling `inverse(modelMatrix)` in GLSL because the inverse in the
// vertex shader runs per-vertex (wasteful for a 24-vertex cube) and because
// Three.js already invalidates/recomputes `matrixWorld` lazily.
//
// Three.js injects `#version 300 es`, precision qualifiers, and the
// built-in uniforms (`modelMatrix`, `modelViewMatrix`, `projectionMatrix`,
// `cameraPosition`, …). Do NOT redeclare them.

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
