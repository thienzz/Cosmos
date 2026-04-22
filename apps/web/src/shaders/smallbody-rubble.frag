// Cosmos Explorer — rubble-pile asteroid shader (T-V-05).
//
// Doc 18 §Small Bodies "Rubble Pile vs. Monolith". Models Bennu/Ryugu-like
// top-shaped aggregate bodies as an ensemble of boulder-sized lumps. Uses
// a two-scale Worley (cellular) noise to place boulders and an AO term
// computed from neighbour-cell distance to darken boulder contact points.
//
// Only one compile-time preset for now:
//   (default)        — generic rubble-pile regolith, dark silicate palette.
//
// CPU-side the shader is bound to a slightly oblate geometry to hint at the
// characteristic top shape. All procedural — no textures.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

uniform vec3 u_sunDir;
uniform float u_time;
uniform float u_shapeSeed;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

float hash(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}

vec3 hash3(vec3 p) {
  return vec3(
    hash(p + vec3(1.7, 0.0, 0.0)),
    hash(p + vec3(0.0, 2.3, 0.0)),
    hash(p + vec3(0.0, 0.0, 3.7))
  );
}

// Worley / cellular noise returning both F1 (nearest feature) and F2
// (second-nearest). F2-F1 traces the Voronoi edges where boulders meet.
vec2 worley(vec3 p, float seed) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float f1 = 10.0;
  float f2 = 10.0;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 o = vec3(float(x), float(y), float(z));
        vec3 jitter = hash3(ip + o + seed);
        vec3 site = o + jitter * 0.85;
        float d = length(site - fp);
        if (d < f1) { f2 = f1; f1 = d; }
        else if (d < f2) { f2 = d; }
      }
    }
  }
  return vec2(f1, f2);
}

void main() {
  vec3 N = normalize(v_normalW);
  vec3 L = normalize(u_sunDir);

  // Two scales of boulders — 2-3 m "big boulders" + cm-scale regolith.
  vec2 w1 = worley(v_modelPos * 4.0, u_shapeSeed);
  vec2 w2 = worley(v_modelPos * 18.0, u_shapeSeed + 7.3);

  // F2-F1 edge factor darkens boulder contact points → AO pockets.
  float boulderEdges = smoothstep(0.02, 0.0, w1.y - w1.x);
  float pebbleEdges  = smoothstep(0.05, 0.0, w2.y - w2.x) * 0.4;
  float ao = 1.0 - 0.45 * boulderEdges - 0.2 * pebbleEdges;

  // Per-boulder brightness variation — some boulders are slightly brighter.
  float boulderId = hash(floor(v_modelPos * 4.0) + u_shapeSeed);
  float boulderTint = 0.75 + 0.35 * boulderId;

  // Lambert lighting with soft ambient floor (rubble piles are geometrically
  // self-shadowed; the AO term compensates for the smooth mesh we render).
  float lambert = max(dot(N, L), 0.0);
  float shading = lambert * 0.82 + 0.18;

  // Carbonaceous-silicate base (#4a4035 region of Bennu observations).
  vec3 base = vec3(0.29, 0.25, 0.21) * boulderTint;
  vec3 col = base * shading * ao;

  // Faint specular — rubble piles have mostly Lambertian return but a
  // handful of fresh boulder faces sparkle in highlight.
  float fresh = step(0.78, boulderId);
  vec3 H = normalize(L + normalize(v_viewDirW));
  float spec = pow(max(dot(N, H), 0.0), 40.0) * fresh * 0.18;
  col += vec3(spec);

  fragColor = vec4(col, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
