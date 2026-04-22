// Cosmos Explorer — Kuiper Belt Object shader (T-V-06).
//
// Doc 18 §ENT-4030..4042. Renders dwarf-planet-scale bodies with tholin
// reddish surfaces, latitude-banded ice caps, and crater noise. Compile-
// time presets select specific named bodies:
//
//   #define KBO_PLUTO   — tholin red-brown + Sputnik Planitia heart.
//   #define KBO_ERIS    — methane-frost high-albedo snow.
//   #define KBO_CERES   — water-ice bright spots on darker carbonaceous
//                         crust (main-belt, not strictly KBO — grouped by
//                         Doc 17 dwarf-planet bucket).
//   (default)           — generic classical-KBO tholin.
//
// Three.js injects `#version 300 es`, precision, and depth uniforms.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

uniform vec3 u_sunDir;
uniform float u_time;
uniform float u_shapeSeed;
uniform float u_rotation;

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

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i + vec3(0, 0, 0));
  float n100 = hash(i + vec3(1, 0, 0));
  float n010 = hash(i + vec3(0, 1, 0));
  float n110 = hash(i + vec3(1, 1, 0));
  float n001 = hash(i + vec3(0, 0, 1));
  float n101 = hash(i + vec3(1, 0, 1));
  float n011 = hash(i + vec3(0, 1, 1));
  float n111 = hash(i + vec3(1, 1, 1));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p, int octaves) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    v += amp * valueNoise(p);
    p *= 2.13;
    amp *= 0.5;
  }
  return v;
}

// Rotate the shading-frame normal around Y so named features spin with time.
vec3 rotatedSurfNormal(vec3 n) {
  float c = cos(u_rotation);
  float s = sin(u_rotation);
  return vec3(c * n.x - s * n.z, n.y, s * n.x + c * n.z);
}

// Heart-shaped mask centred on equator at a specific longitude — approximates
// Sputnik Planitia. Returns 1.0 inside, 0 outside, with a soft edge.
float heartMask(vec3 surfN) {
  // Rotate to put the heart's centre on +X half of equator.
  float lon = atan(surfN.z, surfN.x);      // [-π..π]
  float lat = asin(clamp(surfN.y, -1.0, 1.0));
  // Remap to heart-shape coords: u along longitude, v along latitude.
  float u = lon * 1.4;
  float v = lat * 1.8 - 0.15;
  // Heart equation: (u² + v² - 1)³ - u²v³ < 0 is inside.
  float uu = u * u;
  float vv = v * v;
  float lhs = (uu + vv - 0.55);
  lhs = lhs * lhs * lhs - uu * v * vv * 1.2;
  return smoothstep(0.02, -0.08, lhs);
}

void main() {
  vec3 N = normalize(v_normalW);
  vec3 L = normalize(u_sunDir);
  vec3 surfN = rotatedSurfNormal(normalize(v_modelPos));

  float lambert = max(dot(N, L), 0.0);
  float shading = lambert * 0.85 + 0.15;

  // Base tholin-red palette.
  vec3 tholin   = vec3(0.58, 0.35, 0.20);
  vec3 highland = vec3(0.72, 0.55, 0.35);
  vec3 ice      = vec3(0.92, 0.95, 0.98);
  vec3 dark     = vec3(0.20, 0.16, 0.13);

  // Large-scale terrain noise selects lowland / highland / dark patches.
  float t = fbm(v_modelPos * 2.0 + u_shapeSeed * 3.1, 4);
  vec3 base = mix(tholin, highland, smoothstep(0.35, 0.65, t));
  base = mix(base, dark, smoothstep(0.75, 0.95, t));

  // Latitude mask — ice caps beyond ±55°. Strength varies by body.
  float lat = asin(clamp(surfN.y, -1.0, 1.0));
  float capLatitude = 0.95; // radians cut-off; tweaked per body below.
  float capStrength = 0.6;

  #ifdef KBO_ERIS
    // Eris is nearly entirely frost-coated; push the cap down.
    capLatitude = 0.25;
    capStrength = 0.95;
    base = mix(base, ice, 0.55);        // brighter overall
  #endif

  #ifdef KBO_PLUTO
    capLatitude = 0.9;
    capStrength = 0.45;
    // Sputnik Planitia heart: bright nitrogen-ice plain.
    float heart = heartMask(surfN);
    base = mix(base, ice, heart * 0.8);
  #endif

  #ifdef KBO_CERES
    // Occator-style bright spots: a few hash-picked sites on a darker
    // carbonaceous crust (no strong reddening).
    base = mix(vec3(0.22, 0.20, 0.18), vec3(0.32, 0.30, 0.28), smoothstep(0.3, 0.7, t));
    vec3 spotCoord = floor(surfN * 8.0);
    float spotId = hash(spotCoord + 3.7);
    float spotMask = step(0.985, spotId) * smoothstep(0.8, 1.0, hash(spotCoord + 1.1));
    base = mix(base, vec3(0.92, 0.92, 0.95), spotMask);
    capStrength = 0.15;                 // Ceres has only faint frost
  #endif

  float capMask = smoothstep(capLatitude - 0.15, capLatitude, abs(lat));
  vec3 col = mix(base, ice, capMask * capStrength);
  col *= shading;

  // Crater field — subtle dark ring shadows.
  float craters = 0.0;
  vec3 cp = floor(v_modelPos * 9.0);
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      for (int z = -1; z <= 1; z++) {
        vec3 o = vec3(float(x), float(y), float(z));
        vec3 c = cp + o;
        float d = distance(v_modelPos * 9.0, c + vec3(hash(c), hash(c + 1.5), hash(c + 3.5)) * 0.9);
        craters += (smoothstep(0.15, 0.08, d) - smoothstep(0.08, 0.05, d)) * (0.2 + 0.6 * hash(c));
      }
    }
  }
  col *= 1.0 - 0.22 * clamp(craters, 0.0, 1.0);

  fragColor = vec4(col, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
