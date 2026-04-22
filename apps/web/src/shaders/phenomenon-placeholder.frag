// Cosmos Explorer — Phenomenon placeholder fragment shader (T-V-58).
//
// Constant-colour placeholder for Doc 22 8xxx phenomena (and a few 4xxx /
// 7xxx rows whose real meshes are LineBasic-backed, so toggles can't patch
// them in-place). The universal toggle post-correction injected by
// applyEntityToggles.patchMaterial multiplies fragColor by u_toggleBright
// / u_toggleSat / u_toggleTint — that's what produces the visible toggle
// response. If a proper shader later ships for one of these ENT-IDs,
// route its material through applyEntityToggles and drop the entry here.

uniform vec3 u_tint;

out vec4 fragColor;

void main() {
  fragColor = vec4(u_tint, 1.0);
}
