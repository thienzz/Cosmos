// Cosmos Explorer — Globular cluster shader (T-V-12).
//
// Doc 18 §ENT-7011 (Globular clusters — M13, ω Centauri). King-profile
// density with a dense core and sparse halo; colour ramp from hot blue at
// the core to aged-yellow-orange in the halo (Population II).
//
// Renders as a single sphere mesh. Density uses the simplified Plummer
// model (King is close enough for visual purposes). Per Doc 18 §4524 the
// base colour is uniform warm yellow (#FFD700), but at high LOD we let
// the core read bluer as a hint at the integrated bright-blue stragglers.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;
// @param u_coreRadius — core scale (fraction of mesh radius). Smaller →
// more concentrated Plummer density. Typical globular: 0.08..0.2.
uniform float u_coreRadius;

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
          accum += (1.0 / (1.0 + 90.0 * d * d)) * pow(mag, 4.0);
        }
      }
    }
  }
  return accum;
}

void main() {
  float r = length(v_modelPos);
  // Plummer density ∝ (1 + r²/a²)^(-5/2).
  float a = max(u_coreRadius, 0.08);
  float plummer = pow(1.0 + (r * r) / (a * a), -2.5);

  // Aged-halo / young-core colour ramp. Core hotter (brighter blue straggler
  // contamination); halo yellow-orange (Population II).
  vec3 coreColor = vec3(0.95, 0.88, 0.72);
  vec3 haloColor = vec3(0.85, 0.55, 0.22);
  float warmMix = smoothstep(0.0, 0.7, r);
  vec3 palette = mix(coreColor, haloColor, warmMix);

  float density = 0.15 + 0.55 * plummer;
  float stars = starField(v_modelPos * 18.0, density) * plummer * 2.2;
  float smooth_ = plummer * 0.45;

  vec3 col = palette * (stars + smooth_);
  float alpha = clamp(plummer * 1.3 + stars * 0.7, 0.0, 1.0);
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
