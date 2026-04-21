// Cosmos Explorer — final composite post pass (T30, Doc 18 §3.5 / §14 /
// Doc 24 §3.5).
//
// Single fragment that composites everything from the HDR input plus the
// bloom pyramid plus the optional lensed scene, then runs:
//   1. ACES Filmic tone mapping.
//   2. Optional FXAA (compile-time #define).
//   3. Optional chromatic aberration near the screen edges.
//   4. Optional vignette / scanlines / phosphor / film grain.
//
// Everything is gated by #define so quality tier / accessibility settings
// translate directly to GLSL — no dynamic branching at runtime cost.

precision highp float;

uniform sampler2D u_scene;        // HDR linear-light scene (Float16 input)
uniform sampler2D u_bloom;        // Accumulated bloom (RGBA, linear)
uniform float     u_bloomStrength; // Doc 18 §3.5: 1.5
uniform float     u_exposure;      // ACES exposure multiplier

// CA uniforms (only sampled when #define POST_CHROMATIC_ABERRATION is set)
uniform float u_chromaIntensity;
uniform float u_chromaEdgeStart;

// Film grain (only sampled when #define POST_FILM_GRAIN is set)
uniform float u_grainOpacity;
uniform float u_grainScale;
uniform float u_grainSeed; // advanced on CPU — deterministic under reduced-motion

// Vignette
uniform float u_vignetteDarkness;
uniform float u_vignetteOffset;

// Scanlines + phosphor (viewport resolution)
uniform vec2  u_resolution;
uniform float u_scanlineOpacity;
uniform float u_scanlineFrequency;
uniform float u_phosphorMask;

in vec2 v_uv;
out vec4 fragColor;

// ---------------------------------------------------------------------------
// ACES Filmic tone mapping — Narkowicz 2015 approximation. Same curve the
// Three.js built-in `ACESFilmicToneMapping` uses, but applied in-shader so
// we feed the HDR Float16 buffer directly without relying on
// `renderer.toneMapping` (we kept the renderer in `NoToneMapping` so our
// custom passes consume linear light).
// ---------------------------------------------------------------------------
vec3 cosmos_acesFilmic(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// ---------------------------------------------------------------------------
// FXAA — simplified single-pass luma AA (Timothy Lottes variant).
// ---------------------------------------------------------------------------
#ifdef POST_FXAA
float cosmos_fxaaLuma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 cosmos_fxaa(vec2 uv, vec2 invRes) {
  vec3 rgbNW = texture(u_scene, uv + invRes * vec2(-1.0, -1.0)).rgb;
  vec3 rgbNE = texture(u_scene, uv + invRes * vec2( 1.0, -1.0)).rgb;
  vec3 rgbSW = texture(u_scene, uv + invRes * vec2(-1.0,  1.0)).rgb;
  vec3 rgbSE = texture(u_scene, uv + invRes * vec2( 1.0,  1.0)).rgb;
  vec3 rgbM  = texture(u_scene, uv).rgb;

  float lumaNW = cosmos_fxaaLuma(rgbNW);
  float lumaNE = cosmos_fxaaLuma(rgbNE);
  float lumaSW = cosmos_fxaaLuma(rgbSW);
  float lumaSE = cosmos_fxaaLuma(rgbSE);
  float lumaM  = cosmos_fxaaLuma(rgbM);

  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

  vec2 dir;
  dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
  dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

  float dirReduce = max(
    (lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * 1.0 / 128.0),
    1.0 / 128.0
  );
  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = clamp(dir * rcpDirMin, vec2(-8.0), vec2(8.0)) * invRes;

  vec3 rgbA = 0.5 * (
    texture(u_scene, uv + dir * (1.0 / 3.0 - 0.5)).rgb +
    texture(u_scene, uv + dir * (2.0 / 3.0 - 0.5)).rgb
  );
  vec3 rgbB = rgbA * 0.5 + 0.25 * (
    texture(u_scene, uv + dir * -0.5).rgb +
    texture(u_scene, uv + dir *  0.5).rgb
  );

  float lumaB = cosmos_fxaaLuma(rgbB);
  if (lumaB < lumaMin || lumaB > lumaMax) return rgbA;
  return rgbB;
}
#endif

// ---------------------------------------------------------------------------
// Chromatic aberration — separates RGB sample offsets along the radial
// direction. Intensity ramps from 0 at the centre to max at the corners
// so the centre of the frame stays sharp (Doc 18 §3.5: "50px from edge").
// ---------------------------------------------------------------------------
#ifdef POST_CHROMATIC_ABERRATION
vec3 cosmos_chromaticAberration(vec2 uv) {
  vec2 centred = uv - 0.5;
  float radius = length(centred) * 1.41421356; // normalise against half-diagonal
  float edge = smoothstep(u_chromaEdgeStart, 1.0, radius);
  vec2 dir = radius > 1e-6 ? centred / radius : vec2(0.0);
  float off = u_chromaIntensity * edge;
  float r = texture(u_scene, uv + dir * off).r;
  float g = texture(u_scene, uv).g;
  float b = texture(u_scene, uv - dir * off).b;
  return vec3(r, g, b);
}
#endif

// ---------------------------------------------------------------------------
// Hash / noise for film grain (Doc 18 §3.5).
// ---------------------------------------------------------------------------
#ifdef POST_FILM_GRAIN
float cosmos_grainHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
#endif

void main() {
  vec2 uv = v_uv;
  vec2 invRes = 1.0 / u_resolution;

  // ---- 1. scene sample (with optional FXAA + CA preempting the base tap)
  vec3 sceneLinear;
#ifdef POST_CHROMATIC_ABERRATION
  sceneLinear = cosmos_chromaticAberration(uv);
#elif defined(POST_FXAA)
  sceneLinear = cosmos_fxaa(uv, invRes);
#else
  sceneLinear = texture(u_scene, uv).rgb;
#endif

  // ---- 2. bloom add (always sampled; strength 0 is the "off" case)
  vec3 bloom = texture(u_bloom, uv).rgb;
  sceneLinear += bloom * u_bloomStrength;

  // ---- 3. exposure + ACES tone-map
  vec3 toneMapped = cosmos_acesFilmic(sceneLinear * u_exposure);

  // ---- 4. vignette
#ifdef POST_VIGNETTE
  {
    vec2 centred = uv - 0.5;
    float r = length(centred) * 1.41421356;
    float vig = smoothstep(u_vignetteOffset, 1.0, r);
    toneMapped *= 1.0 - vig * u_vignetteDarkness;
  }
#endif

  // ---- 5. CRT scanlines + phosphor mask (Doc 24 §3.5)
#ifdef POST_SCANLINES
  {
    // Horizontal scan lines. Frequency is in lines-per-screen.
    float scan = 0.5 + 0.5 * cos(6.2831853 * uv.y * u_scanlineFrequency);
    // Darker under a line, lighter between: (1 - opacity + opacity * scan)
    toneMapped *= mix(1.0 - u_scanlineOpacity, 1.0, scan);

    // Phosphor RGB mask — sub-pixel columns. Three bands per pixel triad.
    float col = mod(gl_FragCoord.x, 3.0);
    vec3 phos = vec3(
      col < 1.0 ? 1.0 : (col < 2.0 ? 0.6 : 0.6),
      col < 1.0 ? 0.6 : (col < 2.0 ? 1.0 : 0.6),
      col < 1.0 ? 0.6 : (col < 2.0 ? 0.6 : 1.0)
    );
    toneMapped *= mix(vec3(1.0), phos, u_phosphorMask);
  }
#endif

  // ---- 6. film grain — uniformly animated unless reduced-motion pins seed
#ifdef POST_FILM_GRAIN
  {
    float n = cosmos_grainHash(floor(uv * u_grainScale) + u_grainSeed);
    toneMapped += (n - 0.5) * u_grainOpacity;
  }
#endif

  // Output is linear; Three.js converts to the renderer output colour
  // space when we hit the default framebuffer (renderer.outputColorSpace
  // = SRGBColorSpace).
  fragColor = vec4(clamp(toneMapped, 0.0, 1.0), 1.0);
}
