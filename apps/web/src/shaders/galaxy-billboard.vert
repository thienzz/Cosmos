// Cosmos Explorer — Galaxy LOD billboard vertex shader (T-V-58).
//
// Camera-facing quad for the mid-distance galaxy LOD tier (Doc 18 §LOD1-2).
// Extracts the camera basis from viewMatrix so the quad always faces the
// camera regardless of the galaxy's world orientation. Uniform scale is
// assumed — we sample modelMatrix[0].xyz length as the world-space scale.

out vec2 v_uv;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float v_fragDepth;
#endif

void main() {
  v_uv = uv;
  vec3 right = vec3(viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x);
  vec3 up    = vec3(viewMatrix[0].y, viewMatrix[1].y, viewMatrix[2].y);
  vec3 localOffset = right * position.x + up * position.y;
  vec3 worldOffset = localOffset * length(vec3(modelMatrix[0].x, modelMatrix[0].y, modelMatrix[0].z));
  vec4 worldPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  worldPos.xyz += worldOffset;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    v_fragDepth = 1.0 + gl_Position.w;
  #endif
}
