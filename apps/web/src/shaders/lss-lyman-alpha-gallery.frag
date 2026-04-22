// Cosmos Explorer — LSS gallery Lyman-α blob fragment shader (T-V-58).
//
// Gaussian radial envelope modulated by 4-octave value-noise fbm (u_time
// drifts the noise). Cyan emission palette per Doc 17 ENT-7033. Distinct
// from lyman-alpha-blob.frag (inward raymarch + purple Lα rest-frame);
// this is the simpler gallery-view variant registered as
// 'lss-lyman-alpha-gallery'.

in vec3 v_modelPos;

uniform float u_time;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1, 0, 0));
  float n010 = hash(i + vec3(0, 1, 0));
  float n110 = hash(i + vec3(1, 1, 0));
  float n001 = hash(i + vec3(0, 0, 1));
  float n101 = hash(i + vec3(1, 0, 1));
  float n011 = hash(i + vec3(0, 1, 1));
  float n111 = hash(i + vec3(1, 1, 1));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * valueNoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

void main() {
  float sigma = 4.5;
  float r = length(v_modelPos);
  float gaussianEnv = exp(-(r * r) / (2.0 * sigma * sigma));

  float n = fbm(v_modelPos * 0.6 + vec3(0.0, u_time * 0.05, 0.0));
  float density = gaussianEnv * (0.6 + 0.8 * n);

  vec3 cyan = vec3(0.27, 0.86, 1.0);
  vec3 col = cyan * density * 1.6;
  fragColor = vec4(col, clamp(density, 0.0, 0.85));
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
