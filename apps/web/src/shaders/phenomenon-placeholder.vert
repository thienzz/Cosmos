// Cosmos Explorer — Phenomenon placeholder vertex shader (T-V-58).
//
// Used by PhenomenaGalleryRenderer for the 20 Doc 22 phenomena (kilonova,
// GRB, TDE, bow shock, …) that don't have a dedicated procedural shader
// yet. A trivial passthrough is enough — the universal toggle post-
// correction injected by applyEntityToggles.patchMaterial is what gives
// these entries their visible response to InfoPanel toggle flips.

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
