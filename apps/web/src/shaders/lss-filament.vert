// Cosmos Explorer — Cosmic-web filament vertex shader (T-V-29).
out vec2 v_uv;
out float v_worldDepth;
out float v_density;
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
#endif
void main() {
  v_uv = uv;
  v_density = 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  v_worldDepth = 1.0 + gl_Position.w;
}
