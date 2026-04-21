// Cosmos Explorer — shared star vertex shader (T41).
//
// Drives every surface-sphere star in Doc 18 §Star Rendering +
// §Stellar Evolution Classes (Main Sequence, Evolved, Remnant, Variable).
// Pairs with the four star-*.frag shaders via #define selection; each frag
// branches on its local subtype define but all share this transform.
//
// Three.js injects `#version 300 es`, precision qualifiers, built-in
// attributes (`position`, `normal`) and matrices (`modelMatrix`,
// `modelViewMatrix`, `projectionMatrix`, `normalMatrix`). Do NOT redeclare.
//
// Differences vs planet.vert:
//   • `u_pulsation` — radial vertex displacement for variable stars + AGB
//     envelope pulsation + Mira ±50% breathing + LBV S-Doradus expansion.
//     Positive = expand, negative = contract. Applied BEFORE the model-view
//     transform so the pulsated geometry sees log-depth correctly.

// @param u_rotation — per-star rotation angle (radians). Rotates the
//   surface-frame normal so spots/granules advect with time. Doc 17 ENT-1014
//   §Animation "Rotation period: 25-35 days" etc.
uniform float u_rotation;

// @param u_pulsation — scalar radial displacement (world units). 0 = static.
//   CPU advances per frame from MAINSEQ/EVOLVED/VARIABLE params.pulsationAmp
//   × sin(2π·t / period). Doc 18 §Red Giant Pulsation, Doc 17 ENT-1033/1035
//   Cepheid/Mira breathing.
uniform float u_pulsation;

out vec3 v_modelPos;       // model-space position (pre-pulsation)
out vec3 v_surfaceNormal;  // model-space normal, rotated by u_rotation
out vec3 v_normalW;        // world-space normal (lighting)
out vec3 v_viewDirW;       // world-space view direction
out vec3 v_worldPos;       // world-space position (post-pulsation)

// Logarithmic depth-buffer varying (CLAUDE.md Rule #6). Same contract as
// planet.vert — without this, custom ShaderMaterial writes standard
// perspective depth while Three.js built-in materials write log depth and
// occlusion breaks at astronomical distances.
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  // Pulsation: radial vertex displacement. For a unit-ish SphereGeometry
  // the normal is (approximately) the normalized position, so adding
  // `normal * u_pulsation` expands/contracts the mesh isotropically.
  vec3 pulsatedPos = position + normal * u_pulsation;

  vec4 worldPos = modelMatrix * vec4(pulsatedPos, 1.0);
  v_worldPos = worldPos.xyz;
  v_modelPos = position;                                      // untransformed

  // World-space lighting frame. Three.js's `normalMatrix` is the
  // inverse-transpose of *modelViewMatrix* → view-space, not world.
  // Stars use uniform scale, so `mat3(modelMatrix) * normal` gives the
  // true world-space normal for limb darkening.
  vec3 nW = normalize(mat3(modelMatrix) * normal);
  v_normalW = nW;
  v_viewDirW = normalize(cameraPosition - worldPos.xyz);

  // Rotate the *surface* normal around the body's Y axis so spots/granules
  // stay pinned to body-frame longitudes and rotate with u_rotation.
  float c = cos(u_rotation);
  float s = sin(u_rotation);
  vec3 surfN = normalize(normal);
  v_surfaceNormal = vec3(
    c * surfN.x - s * surfN.z,
    surfN.y,
    s * surfN.x + c * surfN.z
  );

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pulsatedPos, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
