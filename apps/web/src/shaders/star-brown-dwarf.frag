// Cosmos Explorer — Brown dwarf dedicated shader (T-V-30, Tier B).
//
// Doc 18 §Stellar Evolution Classes (extended). Unlike star-mainseq's
// generic SPECTRAL_L/T/Y extension, this shader is a first-class brown-
// dwarf renderer with methane/ammonia cloud weather, deep thermal emission,
// and class-dependent infrared fallback. Compile presets:
//
//   #define BD_L   (default)  — L-dwarf (1300..2000 K), magenta-pink.
//   #define BD_T             — T-dwarf (500..1300 K), reddish.
//   #define BD_Y             — Y-dwarf (<500 K), near-black, thermal only.
//   #define HAS_CLOUDS       — methane/ammonia weather bands (optional).
//
// Three.js injects `#version 300 es`, precision, and depth uniforms.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform vec3 u_sunDir;
uniform float u_time;
uniform float u_shapeSeed;
uniform float u_rotation;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

float hash3(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}
float vn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash3(i), hash3(i+vec3(1,0,0)), f.x), mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x), mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

void main() {
  vec3 N = normalize(v_normalW);
  vec3 V = normalize(v_viewDirW);

  // Brown dwarfs self-emit in IR; visible-light appearance is low-Lambert.
  // Class selection.
  vec3 thermalColor;
  float luminance;
  #if defined(BD_Y)
    thermalColor = vec3(0.08, 0.03, 0.02);
    luminance = 0.15;
  #elif defined(BD_T)
    thermalColor = vec3(0.55, 0.18, 0.12);
    luminance = 0.45;
  #else
    // BD_L default
    thermalColor = vec3(0.78, 0.35, 0.55);
    luminance = 0.78;
  #endif

  // Latitudinal weather bands.
  float lat = asin(clamp(N.y, -1.0, 1.0));
  float bands = 0.5 + 0.5 * sin(lat * 7.0 + u_time * 0.04);
  float turbulence = vn(v_modelPos * 3.0 + u_shapeSeed * 2.5 + u_time * 0.03);

  vec3 col = thermalColor;
  #ifdef HAS_CLOUDS
    // Methane/ammonia cloud deck — brighter patches modulating emission.
    float clouds = smoothstep(0.4, 0.8, turbulence * bands);
    col = mix(col, col * 1.9 + vec3(0.08, 0.04, 0.06), clouds * 0.55);
  #endif

  // Limb darkening — brown dwarfs have thick atmospheres.
  float rim = pow(max(dot(N, V), 0.0), 0.6);
  col *= luminance * rim;

  // Subtle rotation mottle.
  col *= 0.85 + 0.15 * vn(v_modelPos * 1.5 + vec3(u_rotation * 0.3, 0.0, 0.0));

  fragColor = vec4(col, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
