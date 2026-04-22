// Cosmos Explorer — LSS gallery globular-cluster King-profile fragment (T-V-58).
//
// King radial density ρ(r) = 1 / (1 + (r/r_c)²)^1.5 with tidal-radius
// Gaussian cutoff. Warm-yellow core → dim-red halo palette. `cellRadius ≈
// 12` is the gallery cell half-extent; the 1/12 normalisation matches the
// LargeScaleStructureRenderer layout. A tiny twinkle sampled on an integer
// lattice fakes resolved stars at the surface. Paired with lss-globular-
// king.vert; driven by MaterialFactory under the 'lss-globular-king' key.

in vec3 v_modelPos;

uniform float u_time;
uniform float u_rCore;
uniform float u_rTidal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  float maxR = u_rTidal;
  float r = length(v_modelPos) / 12.0;
  if (r > maxR) discard;

  float x = r / u_rCore;
  float density = 1.0 / pow(1.0 + x * x, 1.5);
  density *= exp(-(r * r) / (maxR * maxR));

  float twinkle = hash(floor(v_modelPos * 40.0) + floor(u_time * 3.0));
  density += twinkle * 0.04 * smoothstep(0.2, 0.8, r / maxR);

  vec3 core  = vec3(1.0, 0.86, 0.45);
  vec3 outer = vec3(0.55, 0.18, 0.10);
  vec3 col = mix(outer, core, pow(density, 0.6));
  float alpha = clamp(density * 1.6, 0.0, 1.0);
  fragColor = vec4(col * (1.0 + density * 0.8), alpha);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
