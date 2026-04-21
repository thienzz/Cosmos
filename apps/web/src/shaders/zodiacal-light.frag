// Cosmos Explorer — Zodiacal light + gegenschein (T46a).
//
// Doc 19 §S2-S3 (zodiacal light extending from star, visible near home
// system). Interplanetary-dust forward-scattering glow along the ecliptic
// plane. Has three visual components:
//
//   1. Zodiacal cone — broad cos²(β) ramp along the ecliptic with a strong
//      bias toward the Sun direction (the false-dawn / false-dusk pyramid).
//   2. Gegenschein spot — ~10° circular brightening at the anti-solar point
//      from dust backscatter (Doc 22 educational toggle).
//   3. Zodiacal band — a thin continuous ribbon connecting the two, very
//      faint. Appears in dark-site observations.
//
// Rendered on the same inside-out sphere as the MW band (own pass, additive
// blend). Visible only in Observation mode + Solar System / Stellar regime.
// Cross-fades out when the camera leaves the Solar System (Doc 19 line 2129:
// "zodiacal light fades" at 1.0 sec into the zoom-out).
//
// Fully procedural (CLAUDE.md Rule #1) — no textures.

#include "lib/noise.glsl"

uniform vec3  u_zodiacalColor;     // Warm cream, Doc 22 #3
uniform float u_zodiacalIntensity; // Master scale (0 disables)
uniform float u_gegenscheinEnabled;// 0/1 toggle (Doc 22 educational)
uniform float u_gegenscheinIntensity;
uniform vec3  u_sunDirectionView;  // world-space unit vec from camera → Sun
uniform mat3  u_viewToEcliptic;    // world dir → ecliptic (λ, β) basis
uniform float u_time;

in vec3 v_pos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

void main() {
  vec3 dir = normalize(v_pos);

  // Ecliptic-basis direction. Z axis = North ecliptic pole.
  vec3 eDir = normalize(u_viewToEcliptic * dir);
  float beta = asin(clamp(eDir.z, -1.0, 1.0));  // ecliptic latitude

  // Ecliptic-latitude envelope — cos²(β) wedge with narrow σ.
  float latWedge = exp(-pow(beta / 0.32, 2.0));      // ~18° FWHM
  float latBand  = exp(-pow(beta / 0.09, 2.0));      // thin brightness band

  // Angle from Sun direction (dot product). Zodiacal cone peaks at Sun,
  // drops with elongation.
  float sunDot = clamp(dot(dir, normalize(u_sunDirectionView)), -1.0, 1.0);
  float sunElong = acos(sunDot);                      // 0..π

  // Cone brightness: strong near sun but shaded by the Sun itself — we
  // suppress the inner ~15° because the Sun covers it. Peaks at ~30°.
  float coneNear = smoothstep(0.26, 0.55, sunElong);  // ~15°..~31°
  float coneFar  = 1.0 - smoothstep(0.55, 2.4, sunElong); // tapers beyond ~140°
  float cone = coneNear * coneFar;

  // Anti-solar gegenschein: ~10° wide bump at dot(dir, -sun) = 1.
  float antiDot = clamp(dot(dir, -normalize(u_sunDirectionView)), -1.0, 1.0);
  float antiAngle = acos(antiDot);
  float gegen = exp(-pow(antiAngle / 0.09, 2.0));     // σ ≈ 5°
  gegen *= u_gegenscheinEnabled * u_gegenscheinIntensity;

  // Zodiacal ribbon: faint connective glow between cone and gegenschein
  // along β ≈ 0. Uses the narrower latitude band.
  float ribbon = latBand * 0.14 * (1.0 - smoothstep(1.3, 2.8, sunElong));

  // Fine-grain patchy noise so the cone isn't a sterile gradient. Shift by
  // time to suggest slow dust-lane drift.
  float patchy = cosmos_fbm(eDir * 2.5 + vec3(0.0, 0.0, u_time * 0.01), 2);
  patchy = 0.82 + 0.22 * patchy;

  float glow = (cone * latWedge + ribbon) * patchy + gegen * latBand;
  glow *= u_zodiacalIntensity;

  vec3 col = u_zodiacalColor * glow;
  fragColor = vec4(col, clamp(glow, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
