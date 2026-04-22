// Cosmos Explorer — LSS great-wall vertex shader (T-V-29).
out vec2 v_uv;
out float v_worldDepth;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
#endif
void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  v_worldDepth = 1.0 + gl_Position.w;
}
