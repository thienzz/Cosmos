// Cosmos Explorer — OB association shader (T-V-13).
//
// Doc 18 §ENT-7012 (OB associations — Orion OB1, Scorpius-Centaurus). Young
// loose groupings dominated by O/B spectral-type stars. Similar sampling
// structure to cluster-open but palette shifts hard into the O-B spectral
// regime (deep blue → blue-white) and, when a parent star-forming nebula
// is present, tints the halo with the nebula's Hα emission.
//
//   #define HAS_PARENT_NEBULA — tints the diffuse halo with u_nebulaTint.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;
uniform float u_coreRadius;
uniform float u_starDensity;
// @param u_nebulaTint — Hα emission colour when HAS_PARENT_NEBULA is set.
uniform vec3 u_nebulaTint;

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

float starField(vec3 p, float density) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  float accum = 0.0;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 oc = vec3(float(x), float(y), float(z));
        vec3 c = cell + oc;
        float lottery = hash3(c + u_shapeSeed);
        if (lottery > 1.0 - density) {
          vec3 jitter = vec3(
            hash3(c + vec3(0.7, 0.0, 0.0)),
            hash3(c + vec3(0.0, 0.7, 0.0)),
            hash3(c + vec3(0.0, 0.0, 0.7))
          );
          vec3 starPos = oc + jitter;
          float d = length(f - starPos);
          float mag = hash3(c + vec3(3.1, 0.0, 0.0));
          accum += (1.0 / (1.0 + 50.0 * d * d)) * pow(mag, 5.0);
        }
      }
    }
  }
  return accum;
}

void main() {
  float r = length(v_modelPos);
  float radial = exp(-r * r / max(u_coreRadius, 0.2) / max(u_coreRadius, 0.2));
  float stars = starField(v_modelPos * 12.0, max(u_starDensity, 0.05)) * radial;

  // O/B spectral palette — deep blue dominant, hints of cyan on the brightest.
  vec3 obColor = vec3(0.55, 0.7, 1.15);                // super-blue-white
  vec3 col = obColor * stars * 2.3;

  #ifdef HAS_PARENT_NEBULA
    float haze = radial * (0.65 + 0.35 * hash3(v_modelPos * 2.5));
    col += u_nebulaTint * haze * 0.55;
  #endif

  float alpha = clamp(stars + 0.12 * radial, 0.0, 1.0);
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
