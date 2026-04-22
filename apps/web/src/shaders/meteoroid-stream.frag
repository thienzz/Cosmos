// Cosmos Explorer — Meteoroid stream shader (T-V-09).
//
// Doc 18 §Meteoroid Streams (ENT-4060). Renders the debris trail left along
// a parent comet's orbit — Perseids, Leonids, Geminids — as a translucent
// ribbon. The CPU builds the ribbon mesh along the keplerian orbit (UVs:
// U along-orbit 0..1, V cross-ribbon -0.5..0.5) and this shader handles
// the dust density falloff + a brightness boost near the radiant.
//
// Defines (optional accent palettes):
//   #define STREAM_BLUE_WHITE   — default Perseid/Leonid blue-white.
//   #define STREAM_WARM         — Geminid-style warmer yellow-white.
//   #define STREAM_FAINT        — old, dispersed stream: narrower + dimmer.

in vec2 v_uv;
in float v_worldDepth;

// @param u_radiantU — along-orbit position of the radiant (Earth crossing).
// Must be in 0..1. Brightness peaks at this U value.
uniform float u_radiantU;
// @param u_activity — 0..1. Peaks during the meteor shower's maximum.
uniform float u_activity;
uniform float u_time;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
#endif

void main() {
  float u = v_uv.x;
  float v = v_uv.y;

  // Cross-ribbon density — Gaussian envelope.
  float width = 1.0;
  #ifdef STREAM_FAINT
    width = 0.45;
  #endif
  float crossDensity = exp(-v * v * (6.0 / width));

  // Along-orbit taper at the endpoints so the ribbon fades smoothly.
  float endFade = smoothstep(0.0, 0.04, u) * smoothstep(1.0, 0.96, u);

  // Radiant boost — Gaussian peak at u_radiantU.
  float radDist = abs(u - u_radiantU);
  // Wrap around the orbit — stream is periodic in u.
  radDist = min(radDist, 1.0 - radDist);
  float radiantBoost = exp(-radDist * radDist * 40.0) * u_activity;

  float baseDensity = 0.08 + radiantBoost * 0.55;

  vec3 col = vec3(0.7, 0.8, 1.0);               // default blue-white
  #ifdef STREAM_WARM
    col = vec3(1.0, 0.85, 0.55);                // Geminid yellow-white
  #endif
  #ifdef STREAM_FAINT
    col *= 0.6;
  #endif

  // Slight twinkle — micrograin brightness flicker.
  float twinkle = 0.85 + 0.15 * sin(u * 128.0 + u_time * 0.8);

  float alpha = crossDensity * endFade * baseDensity * twinkle;
  if (alpha < 0.002) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(v_worldDepth) * logDepthBufFC * 0.5;
  #endif
}
