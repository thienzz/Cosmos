// Cosmos Explorer — full-screen post-process vertex shader (T30).
//
// Emits a single triangle covering clip space [-1, 1] with UVs on [0, 1]. A
// triangle (not a quad) avoids the diagonal seam that a two-triangle quad
// exhibits at sub-pixel derivatives.
//
// Three.js injects `#version 300 es` + precision qualifiers for GLSL3
// ShaderMaterials. Built-in `position` attribute is unused — we reconstruct
// clip-space positions from `gl_VertexID` so the caller doesn't need a
// custom BufferGeometry.

out vec2 v_uv;

void main() {
  // Three vertices: (−1,−1), (3,−1), (−1,3). Covers the screen with one
  // triangle; UV mapping places the quad on (0..1) with a 2-unit overshoot
  // at the far corner (which gets clipped away).
  vec2 pos = vec2(
    float((gl_VertexID & 1) << 2) - 1.0,
    float((gl_VertexID & 2) << 1) - 1.0
  );
  v_uv = 0.5 * (pos + 1.0);
  gl_Position = vec4(pos, 0.0, 1.0);
}
