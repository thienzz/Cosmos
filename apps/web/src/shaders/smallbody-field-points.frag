// Cosmos Explorer — Procedural minor-body field fragment shader (T-V-58).
//
// Radial sprite with palette lookup per subtype. Palette size is fixed at
// compile time via the SUBTYPE_COUNT define passed in the render block so
// the dynamic-array-index lookup collapses into a fast constant-indexed
// access on constrained drivers. Host renderer uploads the palette as
// `uniform vec3 u_palette[SUBTYPE_COUNT]` post-creation — the u_palette
// slot is not in the MaterialFactory's auto-uniform set.

#ifndef SUBTYPE_COUNT
  #define SUBTYPE_COUNT 1
#endif

in float v_subtypeIndex;
in float v_comet;

uniform vec3 u_palette[SUBTYPE_COUNT];

out vec4 fragColor;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float r2 = dot(uv, uv);
  if (r2 > 0.25) discard;
  float alpha = smoothstep(0.25, 0.0, r2);

  int idx = int(clamp(v_subtypeIndex + 0.5, 0.0, float(SUBTYPE_COUNT - 1)));
  vec3 colour = u_palette[idx];

  // Comets get a pale-cyan halo bias so they read against the dust cloud.
  vec3 cometBoost = vec3(0.25, 0.45, 0.55) * v_comet;
  colour += cometBoost * alpha * 0.4;

  fragColor = vec4(colour, alpha);
}
