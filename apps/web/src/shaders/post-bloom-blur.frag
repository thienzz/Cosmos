// Cosmos Explorer — separable Gaussian blur pass (T30, Doc 18 §3.5).
//
// Used in a ping-pong chain: horizontal blur → vertical blur → downsample.
// The shader reads `u_source` (previous level) and writes a blurred result
// one step along `u_direction` (either `(1, 0) / width` or `(0, 1) / height`).
//
// 9-tap Gaussian kernel σ≈2.0 — enough spread to look smooth after 4-5
// pyramid levels; tighter than σ=4 so fewer texture fetches per pass.

precision highp float;

uniform sampler2D u_source;
uniform vec2      u_direction; // step vector in texel space (already divided by texture size)

in vec2 v_uv;
out vec4 fragColor;

// Pre-computed Gaussian weights (σ = 2.0, kernel radius = 4).
const float W0 = 0.19741;
const float W1 = 0.17467;
const float W2 = 0.12090;
const float W3 = 0.06559;
const float W4 = 0.02785;

void main() {
  vec4 acc = texture(u_source, v_uv) * W0;
  vec2 d1 = u_direction;
  vec2 d2 = u_direction * 2.0;
  vec2 d3 = u_direction * 3.0;
  vec2 d4 = u_direction * 4.0;

  acc += texture(u_source, v_uv + d1) * W1;
  acc += texture(u_source, v_uv - d1) * W1;
  acc += texture(u_source, v_uv + d2) * W2;
  acc += texture(u_source, v_uv - d2) * W2;
  acc += texture(u_source, v_uv + d3) * W3;
  acc += texture(u_source, v_uv - d3) * W3;
  acc += texture(u_source, v_uv + d4) * W4;
  acc += texture(u_source, v_uv - d4) * W4;

  fragColor = acc;
}
