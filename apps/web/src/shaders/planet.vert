// Cosmos Explorer — shared planet vertex shader.
//
// Drives every body in Doc 18 §Rocky Planets + §Gas Giants. The per-body
// fragment shader branches on uniforms / defines to select its surface
// treatment, but every planet uses this same transform + varyings setup.
//
// Three.js injects `#version 300 es`, precision qualifiers, built-in
// attributes (`position`, `normal`) and matrices (`modelMatrix`,
// `modelViewMatrix`, `projectionMatrix`, `normalMatrix`). Do NOT redeclare.

// @param u_rotation — per-body rotation angle in radians, rotates the
// surface coords so day/night and longitude-locked features (Jupiter GRS,
// Neptune dark spot) spin with `time`. Applied to the *surface-frame*
// normal only, never to the geometry — the geometry keeps its real
// orientation so Saturn's tilt / Uranus's 97° tilt stay authentic.
uniform float u_rotation;

out vec3 v_modelPos;       // model-space position (for 3D texture domain)
out vec3 v_surfaceNormal;  // model-space normal, rotated by u_rotation
out vec3 v_normalW;        // world-space normal (lighting)
out vec3 v_viewDirW;       // world-space view direction
out vec3 v_worldPos;       // world-space position (for distance-based LOD)

// Logarithmic depth-buffer varying (Three.js auto-defines USE_LOGDEPTHBUF
// when WebGLRenderer.logarithmicDepthBuffer is true — CLAUDE.md Rule #6).
// Without this, custom ShaderMaterial writes standard perspective depth
// while built-in materials write log depth → mismatched depth comparisons
// → occlusion failures (Sun bleeds through Earth).
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  v_worldPos = worldPos.xyz;
  v_modelPos = position;

  // World-space lighting frame. NOTE: Three.js's `normalMatrix` is
  // inverse-transpose of modelViewMatrix → VIEW-space, not world-space.
  // Using it here produced a day/night terminator whose orientation
  // depended on the camera heading (user report: Mercury rendered pure
  // black at close zoom even though sunFacing math said 0.99). Planets
  // use uniform scale, so `mat3(modelMatrix) * normal` is the correct
  // true-world normal for dotting against the world-space u_sunDir.
  vec3 nW = normalize(mat3(modelMatrix) * normal);
  v_normalW = nW;
  v_viewDirW = normalize(cameraPosition - worldPos.xyz);

  // Rotate the *surface* normal around the body's Y axis so textures
  // (zones, storms, city lights) pin to body-frame longitudes and spin
  // with u_rotation.
  float c = cos(u_rotation);
  float s = sin(u_rotation);
  vec3 surfN = normalize(normal);
  v_surfaceNormal = vec3(
    c * surfN.x - s * surfN.z,
    surfN.y,
    s * surfN.x + c * surfN.z
  );

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
