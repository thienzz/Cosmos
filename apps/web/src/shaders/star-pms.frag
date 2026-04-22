// Cosmos Explorer — Pre-main-sequence shader (T-V-33, Tier B).
//
// Covers young stars not yet on the main sequence:
//   #define PMS_HERBIG_AE   — A-type PMS, blue-white with dust disk.
//   #define PMS_HERBIG_BE   — B-type PMS, hotter blue.
//   #define PMS_T_TAURI     — Classical T Tauri (K/M + UV accretion funnel).
//   #define PMS_T_TAURI_WL  — Weak-lined T Tauri (bare photosphere, no disk).
//   #define PMS_FU_ORI      — FU Orionis outburst, dramatic luminosity spike.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;
// @param u_accretionRate — 0..1 for T Tauri hot-spot flicker.
uniform float u_accretionRate;

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

void main() {
  vec3 N = normalize(v_normalW);
  vec3 V = normalize(v_viewDirW);
  float limb = pow(max(dot(N, V), 0.0), 0.55);

  vec3 surface;
  float brightness = 1.0;

  #if defined(PMS_HERBIG_BE)
    surface = vec3(0.78, 0.88, 1.3);
    brightness = 1.3;
  #elif defined(PMS_HERBIG_AE)
    surface = vec3(0.95, 0.95, 1.1);
    brightness = 1.15;
  #elif defined(PMS_T_TAURI_WL)
    surface = vec3(1.05, 0.58, 0.38);    // K/M photosphere, no hot spot
    brightness = 0.7;
  #elif defined(PMS_FU_ORI)
    // Outburst — dramatic disk brightening.
    surface = vec3(1.3, 1.1, 0.8);
    brightness = 2.0 + 0.4 * sin(u_time * 0.2 + u_shapeSeed * 6.28);
  #else
    // PMS_T_TAURI default — Classical T Tauri.
    surface = vec3(1.0, 0.65, 0.45);
    // Accretion hot-spot flicker.
    float spot = smoothstep(0.5, 1.0, hash3(v_modelPos * 15.0 + u_time * 0.6));
    surface += vec3(0.2, 0.3, 0.7) * spot * u_accretionRate;
    brightness = 0.95;
  #endif

  // Subtle photospheric granulation.
  float g = 0.88 + 0.12 * hash3(v_modelPos * 22.0 + u_time * 0.3);
  fragColor = vec4(surface * brightness * g * limb, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
