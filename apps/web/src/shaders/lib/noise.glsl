// Cosmos Explorer — shared procedural noise primitives.
//
// Used by every procedural body shader (Doc 18 planets, nebulae, moons).
// No textures — CLAUDE.md Critical Rule #1. Hash/noise/fbm are closed-form
// so the GPU is the only one paying; CPU stays free.
//
// #include-d by Three.js via vite-plugin-glsl. Safe to include multiple
// times per program — every symbol is prefixed `cosmos_` and guarded.

#ifndef COSMOS_NOISE_INCLUDED
#define COSMOS_NOISE_INCLUDED

// ---------------------------------------------------------------------------
// Hashes — the hot path. Deterministic, repeatable across hardware.
// Based on the BBS / PCG-style mix used by iq / Dave Hoskins.
// ---------------------------------------------------------------------------

float cosmos_hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float cosmos_hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float cosmos_hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

// ---------------------------------------------------------------------------
// Value noise — smooth 3D, range [0, 1].
// ---------------------------------------------------------------------------

float cosmos_valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);              // smoothstep interpolant

  float n000 = cosmos_hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = cosmos_hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = cosmos_hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = cosmos_hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = cosmos_hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = cosmos_hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = cosmos_hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = cosmos_hash31(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);

  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

// ---------------------------------------------------------------------------
// Fractal Brownian motion — 4 octaves by default. Range ~[0, 1].
// ---------------------------------------------------------------------------

float cosmos_fbm(vec3 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * cosmos_valueNoise(p);
    norm += amp;
    p *= 2.02;                              // not 2.0 → avoids axis-aligned beats
    amp *= 0.5;
  }
  return sum / norm;
}

// ---------------------------------------------------------------------------
// Domain-warped fbm — good for cloud + storm structure with "swirls".
// ---------------------------------------------------------------------------

float cosmos_warpedFbm(vec3 p, int octaves) {
  vec3 q = vec3(
    cosmos_fbm(p + vec3(0.0, 0.0, 0.0), octaves),
    cosmos_fbm(p + vec3(5.2, 1.3, 2.7), octaves),
    cosmos_fbm(p + vec3(8.7, 2.9, 6.1), octaves)
  );
  return cosmos_fbm(p + 4.0 * q, octaves);
}

// ---------------------------------------------------------------------------
// Voronoi (cellular) — returns F1 (nearest cell distance) and cell id.
// Used by Mercury crater fields and small-body surface irregularity.
// ---------------------------------------------------------------------------

vec2 cosmos_voronoi(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  float minDist = 1e9;
  float cellId = 0.0;

  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      for (int z = -1; z <= 1; z++) {
        vec3 offset = vec3(float(x), float(y), float(z));
        vec3 neighbour = i + offset;
        vec3 jitter = vec3(
          cosmos_hash31(neighbour + vec3(0.0, 0.0, 0.0)),
          cosmos_hash31(neighbour + vec3(1.0, 0.0, 0.0)),
          cosmos_hash31(neighbour + vec3(0.0, 1.0, 0.0))
        );
        vec3 delta = offset + jitter - f;
        float d2 = dot(delta, delta);
        if (d2 < minDist) {
          minDist = d2;
          cellId = cosmos_hash31(neighbour);
        }
      }
    }
  }
  return vec2(sqrt(minDist), cellId);
}

#endif
