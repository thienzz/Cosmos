// Cosmos Explorer — Carbon star shader (T-V-32, Tier B).
//
// Doc 18 §Stellar Evolution Classes — carbon stars (C type). Morgan-Keenan
// sub-classes:
//
//   #define CARBON_CR  — classical ruby-red continuum (C-R).
//   #define CARBON_CN  (default) — N-type intense C₂ absorption, deep red-orange.
//   #define CARBON_CJ  — ¹³C-enhanced, tinted slightly bluer.
//
// Photospheric C₂ absorption bands appear as coarse chromatic dithering.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;

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

  vec3 surface;
  #if defined(CARBON_CR)
    surface = vec3(1.25, 0.55, 0.45);    // ruby red
  #elif defined(CARBON_CJ)
    surface = vec3(1.05, 0.58, 0.48);    // bluer-tinted
  #else
    // CARBON_CN default
    surface = vec3(1.2, 0.45, 0.22);     // deep red-orange
  #endif

  // C₂ absorption bands — coarse dark chromatic dithering.
  float bands = vn(v_modelPos * 4.0 + u_shapeSeed + u_time * 0.05);
  float absorption = smoothstep(0.55, 0.85, bands);
  surface = mix(surface, surface * 0.4, absorption * 0.45);

  // Granulation.
  float g = 0.9 + 0.1 * hash3(v_modelPos * 25.0 + u_time * 0.15);

  // Limb darkening.
  float limb = pow(max(dot(N, V), 0.0), 0.7);
  fragColor = vec4(surface * g * limb, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
