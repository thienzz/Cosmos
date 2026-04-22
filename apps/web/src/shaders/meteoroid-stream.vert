// Cosmos Explorer — Meteoroid stream ribbon vertex shader (T-V-09).
//
// Assumes a CPU-generated ribbon mesh along the parent comet's keplerian
// orbit. Standard Three.js attribute `uv` is interpreted as:
//   uv.x = along-orbit parametric position 0..1 (wraps).
//   uv.y = cross-ribbon offset -0.5..0.5.

out vec2 v_uv;
out float v_worldDepth;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  // No varying needed — we write the depth into v_worldDepth and convert in
  // the fragment stage; keeps the name-collision surface minimal.
#endif

void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  v_worldDepth = 1.0 + gl_Position.w;
}
