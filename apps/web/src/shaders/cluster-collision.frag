// Cosmos Explorer — Merging/disrupting cluster shader (T-V-14).
//
// Doc 18 §ENT-7023 (cluster collisions — Bullet Cluster). Two Plummer
// profiles advancing along ±X, plus a tidal streamer trailing the lighter
// lobe. `u_mergePhase` 0..1 animates:
//
//   0.0  → well separated
//   0.5  → peak interaction (cores overlap, streamer extends)
//   1.0  → fully merged, streamer at maximum dispersal.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;

uniform float u_time;
uniform float u_shapeSeed;
// @param u_mergePhase — 0..1 collision animation phase.
uniform float u_mergePhase;

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

float plummer(vec3 p, vec3 c, float a) {
  float r = length(p - c);
  return pow(1.0 + (r * r) / (a * a), -2.5);
}

void main() {
  // Lobe centres move toward origin as phase advances.
  float separation = mix(0.7, 0.05, u_mergePhase);
  vec3 c1 = vec3( separation, 0.0, 0.0);
  vec3 c2 = vec3(-separation, 0.0, 0.0);
  float a = mix(0.18, 0.28, u_mergePhase);            // cores puff out during merger

  float d1 = plummer(v_modelPos, c1, a);
  float d2 = plummer(v_modelPos, c2, a);
  float sumDensity = d1 + d2;

  // Streamer — curved tidal tail behind c2 (trailing lobe), strength grows
  // then fades across the phase.
  vec3 trailDir = normalize(vec3(-1.0, 0.15 * sin(u_time * 0.2 + u_shapeSeed), 0.0));
  vec3 streamerFrom = c2;
  float alongTrail = dot(v_modelPos - streamerFrom, trailDir);
  float perpTrail  = length(v_modelPos - streamerFrom - trailDir * alongTrail);
  float streamerMask =
    smoothstep(-0.1, 0.0, alongTrail) *                 // only behind c2
    exp(-perpTrail * perpTrail * 35.0) *                // thin tail
    smoothstep(0.15, 0.55, u_mergePhase) *              // build up
    smoothstep(1.05, 0.55, u_mergePhase);               // fade out
  float streamer = streamerMask * 0.45;

  // Palette — lighter (c2) = cool blue, heavier (c1) = warm yellow.
  vec3 lightColor = vec3(0.55, 0.75, 1.15);
  vec3 heavyColor = vec3(1.05, 0.9, 0.62);
  float lobeMix = clamp(d2 / (d1 + d2 + 1e-4), 0.0, 1.0);
  vec3 palette = mix(heavyColor, lightColor, lobeMix);

  float grain = 0.85 + 0.3 * hash3(v_modelPos * 22.0 + u_shapeSeed);
  vec3 col = palette * (sumDensity + streamer) * grain;

  float alpha = clamp(sumDensity * 1.1 + streamer * 1.3, 0.0, 1.0);
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
