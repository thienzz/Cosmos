// Cosmos Explorer — Open cluster shader (T-V-11).
//
// Doc 18 §ENT-7010 (Open clusters — Pleiades, Hyades, M45-like). Rendered
// as a single spherical mesh representing the cluster volume. Procedural
// 3D hash samples act as per-star Gaussian impostors, so the cluster reads
// as a sparse point distribution without CPU-side per-star instancing.
//
// Defines:
//   (default)            — blue-white stellar palette.
//   #define NEBULOSITY_ON — adds a soft reflection-nebula halo in the
//                           cluster's own blue — Pleiades-style dust.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;
// @param u_coreRadius — cluster core scale 0..1 (fraction of mesh radius).
uniform float u_coreRadius;
// @param u_starDensity — bright-point probability threshold, 0..1.
uniform float u_starDensity;

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

// Star points via 3D grid — per-cell probability + radial density envelope.
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
          float brightness = pow(mag, 6.0); // few bright, many dim
          accum += (1.0 / (1.0 + 60.0 * d * d)) * brightness;
        }
      }
    }
  }
  return accum;
}

void main() {
  // Radial density envelope (open clusters: soft Gaussian roll-off).
  float r = length(v_modelPos);
  float radial = exp(-r * r / max(u_coreRadius, 0.15) / max(u_coreRadius, 0.15));

  float stars = starField(v_modelPos * 14.0, max(u_starDensity, 0.02));
  stars *= radial;

  vec3 starColor = vec3(0.78, 0.85, 1.0);              // blue-white
  vec3 col = starColor * stars * 2.0;

  #ifdef NEBULOSITY_ON
    // Reflection nebula halo — soft outward glow in a cooler blue.
    float haze = radial * (0.6 + 0.4 * hash3(v_modelPos * 3.0));
    col += vec3(0.45, 0.55, 0.78) * haze * 0.35;
  #endif

  float alpha = clamp(stars + 0.15 * radial, 0.0, 1.0);
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
