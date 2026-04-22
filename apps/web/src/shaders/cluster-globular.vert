// Cosmos Explorer — Globular cluster vertex shader (T-V-12).
out vec3 v_modelPos;
out vec3 v_normalW;
out vec3 v_viewDirW;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif
void main() {
  v_modelPos = position;
  v_normalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  v_viewDirW = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
