// Cosmos Explorer — Star point-sprite vertex shader (Doc 10 §6.2, Doc 18 §Star).
//
// Feeds a single draw call with up to 500K catalogue stars. The host-side
// material uses THREE.Points, so `position` is Three.js's auto-declared
// attribute. All custom attributes follow the `a_` prefix convention.
//
// Three.js injects `#version 300 es`, precision qualifiers, and built-in
// matrices/attributes when glslVersion is GLSL3 — do NOT redeclare them:
//   uniform mat4 modelViewMatrix;
//   uniform mat4 projectionMatrix;
//   in vec3 position;

// @param u_time — monotonically-increasing seconds, drives the twinkle sine.
uniform float u_time;
// @param u_pixelRatio — devicePixelRatio snapshot so points are crisp on HiDPI.
uniform float u_pixelRatio;
// @param u_pointSizeScale — global multiplier for settings.starPointSize (0.5–2.0).
uniform float u_pointSizeScale;
// @param u_twinkleStrength — 0 disables twinkle (reduced-motion setting).
uniform float u_twinkleStrength;

// @attr a_color — Doc 18 spectral colour, sRGB 0-1, precomputed host-side.
in vec3 a_color;
// @attr a_magnitude — apparent magnitude; brighter ⇒ smaller number.
in float a_magnitude;
// @attr a_twinklePhase — random [0, 2π] phase offset per star.
in float a_twinklePhase;

out vec3 v_color;
out float v_brightness;
out float v_twinkle;

// Log-depth varying — stars draw with `depthWrite:false transparent:true`,
// but their depth test still has to agree with planet meshes that write
// log-depth.  Without this, stars float in front of opaque planets.
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewPos;

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif

  // Brightness (Pogson ratio). Magnitude 0 maps to 1.0; +5 → 0.01.
  // Clamped so faint stars still contribute to the sprite's alpha.
  float brightness = pow(10.0, -0.4 * a_magnitude);
  v_brightness = clamp(brightness, 0.01, 1.0);

  // Pixel size — brighter stars render larger. Scale by pixel ratio so the
  // same apparent size holds on HiDPI displays. See Doc 10 §6.2.
  float sizeFromMag = 2.0 + max(0.0, 6.0 - a_magnitude);
  float distanceAttenuation = 1.0 / max(1.0, 0.05 * -viewPos.z);
  gl_PointSize = max(1.0, sizeFromMag * u_pointSizeScale * u_pixelRatio * distanceAttenuation);

  // Per-star twinkle — a cheap sinusoid with per-star phase.
  float raw = sin(u_time * 2.0 + a_twinklePhase);
  v_twinkle = mix(1.0, 0.7 + 0.3 * raw, u_twinkleStrength);

  v_color = a_color;
}
