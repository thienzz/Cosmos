// Cosmos Explorer — exoplanet host-star marker fragment shader.
//
// Renders a compact terminal-style glyph + orbital trace ring around a host
// star that has confirmed exoplanets. This is scene-level UI, NOT a planet
// shader — it appears at the galactic/stellar scale when an individual
// exoplanet body would be sub-pixel, so the user can spot "this star has
// planets" at a glance and fly-in for the details.
//
// Design language: AETHER V4 — phosphor-cyan rings, soft CRT glow, no
// antialiasing beyond what pow-falloff provides. Colour is clamped to the
// terminal palette so it sits flush on dark backgrounds.
//
// Expected geometry: a planar unit-circle quad (RingGeometry or screen-aligned
// billboard). `v_uv.xy` spans [-1, 1] in marker-space.

#include "lib/noise.glsl"

uniform vec3  u_glyphColor;          // cyan phosphor default
uniform vec3  u_ringColor;           // orbit trace tint
uniform float u_planetCount;         // 1..8 — controls concentric ring count
uniform float u_habitableFlag;       // 0 or 1 — adds green inner ring if HZ planet present
uniform float u_pulsePhase;          // 0..1, cycles to show "live signal"
uniform float u_time;

in vec2 v_uv;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

float ringMask(float r, float target, float thickness) {
  return exp(-pow((r - target) / max(thickness, 0.001), 2.0));
}

void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  float r = length(v_uv);
  if (r > 1.05) discard;                          // soft clip outside marker

  // Concentric orbit rings — one per known planet, spaced 0.15 units apart
  // starting at r = 0.35.
  int planets = int(clamp(u_planetCount, 1.0, 8.0));
  float rings = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= planets) break;
    float rad = 0.35 + float(i) * 0.12;
    rings += ringMask(r, rad, 0.018);
  }

  vec3 color = u_ringColor * rings * 0.9;

  // Central glyph: small filled dot for the host star.
  float core = smoothstep(0.09, 0.0, r);
  color += u_glyphColor * core;

  // Pulsating outer ring — "signal detected" feel.
  float pulse = 0.5 + 0.5 * sin(u_time * 1.5 + u_pulsePhase * 6.28);
  float outerRing = ringMask(r, 0.98, 0.02);
  color += u_glyphColor * outerRing * pulse * 0.5;

  // Habitable-zone highlight — green accent ring at r=0.5.
  if (u_habitableFlag > 0.5) {
    float hz = ringMask(r, 0.50, 0.025);
    color += vec3(0.0, 1.0, 0.4) * hz * 0.75;
  }

  // CRT phosphor-glow: radial falloff so the marker fades into the scene.
  float falloff = smoothstep(1.0, 0.0, r) * 0.15;
  color += u_glyphColor * falloff;

  float alpha = clamp(rings + core + outerRing * pulse + falloff, 0.0, 1.0);
  fragColor = vec4(color, alpha);
}
