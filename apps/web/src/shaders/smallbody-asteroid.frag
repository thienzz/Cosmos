// Cosmos Explorer — Tholen-taxonomy asteroid shader (T-V-03).
//
// Doc 18 §Small Bodies §"Asteroids by Type". Each Tholen class is selected
// via `#define` at compile time:
//
//   #define TYPE_C   — carbonaceous, albedo 0.05, blue-grey (#3C3C3C)
//   #define TYPE_S   — silicate,     albedo 0.21, reddish-brown (#B8860B)
//   #define TYPE_M   — metallic,     albedo 0.15, steel-grey (#808080) + glints
//   #define TYPE_V   — basaltic,     albedo 0.42, dark-grey (#696969) + faceted
//
// If no class is defined, the shader defaults to C-type behaviour (most
// common asteroid type). Every branch shares the same lighting, crater-normal
// noise, and tumbling-rotation pipeline — the class presets only retune
// albedo, chroma, specular response, and crater density.
//
// Three.js injects `#version 300 es`, precision qualifier, and depth-buffer
// uniforms — do NOT redeclare.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

// @param u_sunDir — world-space direction FROM asteroid TO sun (unit vec).
uniform vec3 u_sunDir;
// @param u_time — seconds since scene start, drives glint animation.
uniform float u_time;
// @param u_shapeSeed — per-instance hash drives crater + chunk noise [0..1].
uniform float u_shapeSeed;
// @param u_rotationSpeed — radians per second for spin shading [0..10].
uniform float u_rotationSpeed;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

// ---------------------------------------------------------------------------
// Noise primitives — pure math, seeded by position + u_shapeSeed so the
// surface is deterministic per-asteroid.
// ---------------------------------------------------------------------------

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

// Crater field — simulated by negative-bump Worley-style impacts.
float craterField(vec3 p, float density) {
  float crater = 0.0;
  vec3 ip = floor(p * density);
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      for (int z = -1; z <= 1; z++) {
        vec3 o = vec3(float(x), float(y), float(z));
        vec3 c = ip + o;
        vec3 seed = c + vec3(hash(c), hash(c + 1.5), hash(c + 3.5));
        vec3 site = (c + seed * 0.9) / density;
        float d = distance(p, site);
        float rim = smoothstep(0.15, 0.1, d) - smoothstep(0.1, 0.06, d);
        crater += rim * (0.3 + 0.7 * hash(c));
      }
    }
  }
  return clamp(crater, 0.0, 1.0);
}

// ---------------------------------------------------------------------------
// Class presets — gated at compile time via #define.
// ---------------------------------------------------------------------------

vec3 classBaseColor() {
  #if defined(TYPE_S)
    // Silicate — #B8860B reddish-brown.
    return vec3(0.722, 0.525, 0.043);
  #elif defined(TYPE_M)
    // Metallic — steel grey #808080.
    return vec3(0.502, 0.502, 0.502);
  #elif defined(TYPE_V)
    // Basaltic — darker grey with slight warm tint.
    return vec3(0.412, 0.412, 0.412);
  #else
    // Default + TYPE_C: carbonaceous, very dark.
    return vec3(0.235, 0.235, 0.235);
  #endif
}

float classAlbedo() {
  #if defined(TYPE_S)
    return 0.21;
  #elif defined(TYPE_M)
    return 0.15;
  #elif defined(TYPE_V)
    return 0.42;
  #else
    return 0.05;
  #endif
}

float classSpecular() {
  #if defined(TYPE_M)
    // Metallic — strong specular + glint animation.
    return 1.6;
  #elif defined(TYPE_S)
    return 0.35;
  #elif defined(TYPE_V)
    return 0.2;
  #else
    return 0.08;
  #endif
}

float classCraterDensity() {
  #if defined(TYPE_V)
    // Differentiated body → fewer preserved craters.
    return 5.0;
  #elif defined(TYPE_M)
    return 7.0;
  #elif defined(TYPE_S)
    return 8.0;
  #else
    return 9.0;
  #endif
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

void main() {
  vec3 N = normalize(v_normalW);
  vec3 L = normalize(u_sunDir);
  vec3 V = normalize(v_viewDirW);

  // Lambert + faceted sub-shading. The faceted term injects hard-edge
  // shading suggesting angular surfaces even on a low-poly sphere.
  float lambert = max(dot(N, L), 0.0);
  float facetNoise = fbm(v_modelPos * (6.0 + u_shapeSeed * 2.0), 3);
  float faceted = mix(0.85, 1.0, step(0.5, facetNoise));

  // Crater rims — darker inside, subtle bright rim on sunlit side.
  float craters = craterField(v_modelPos * classCraterDensity() + u_shapeSeed, 1.0);

  vec3 base = classBaseColor() * classAlbedo() * 4.5; // 4.5× compensates for
                                                      // low-albedo base so
                                                      // the asteroid isn't
                                                      // lost to black in
                                                      // ambient-floor shading.

  float shading = lambert * 0.85 + 0.15; // soft ambient fill.
  vec3 col = base * shading * faceted;
  col *= (1.0 - 0.35 * craters); // crater shadows.

  // Specular — reflection-like term; metallic class gets animated glint
  // as the asteroid tumbles under u_rotationSpeed * u_time.
  vec3 H = normalize(L + V);
  float specBase = pow(max(dot(N, H), 0.0), 32.0) * classSpecular();
  #if defined(TYPE_M)
    float glint = 0.5 + 0.5 * sin(u_time * (0.6 + u_rotationSpeed) + u_shapeSeed * 10.0);
    specBase *= 0.4 + 0.6 * glint;
  #endif
  col += vec3(specBase) * classBaseColor();

  fragColor = vec4(col, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
