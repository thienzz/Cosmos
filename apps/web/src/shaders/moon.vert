// Cosmos Explorer — shared moon vertex shader (T43).
//
// Identical varying set to planet.vert so the moon fragment shaders can
// reuse the same lighting helpers. Kept as its own file (vs re-exporting
// planet.vert) because moon tidal-flexing / cantaloupe-relief variants
// want a small vertex-side perturbation later; having a dedicated entry
// point makes that expansion painless.

uniform float u_rotation;

out vec3 v_modelPos;
out vec3 v_surfaceNormal;
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

  vec3 nW = normalize(mat3(normalMatrix) * normal);
  v_normalW = nW;
  v_viewDirW = normalize(cameraPosition - worldPos.xyz);

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
