// Cosmos Explorer — elliptical galaxy fragment shader (T29 ENT-6020, extended
// by T46 for ENT-6021 dwarf elliptical (dE) + ENT-6022 dwarf spheroidal).
//
// Doc 18 §Elliptical Galaxy + Doc 17 ENT-6020/6021/6022 + Doc 22. Raymarches
// a smooth spheroidal density profile inside the unit cube:
//
//   ρ(r') ∝ exp(-b * (r' / Re)^(1/n))
//
// where r' is the axis-ratio-warped radius (ellipticity ε compresses along
// +Y to match the Doc 22 E0–E7 sequence) and n is the Sérsic index.
//
// T46 scale-grade via uniforms (same shader, varied uniforms):
//   - Giant E  (ENT-6020): n=4 de Vaucouleurs, Re=0.45, globular sparkle on,
//                          coreExcess=1.3, haloFalloff=2.2.
//   - dE       (ENT-6021): n=1–2 exponential, Re=0.35, optional nucleus,
//                          coreExcess=1.0–3.0 if nucleated.
//   - dSph     (ENT-6022): n=1 exponential, Re=0.55 very extended, sparse
//                          stars (low density), bluer GCs, transparent.
//
// Doc 17 ENT-6021 palette: #DD6644 / #FFEE99 nucleus. ENT-6022: #CC7755 /
// metal-poor GCs #AABBFF.
//
// No arms, no dust, no bar — just a smooth gradient and an optional
// globular-cluster sparkle layer (spatial-hash driven, no extra geometry).
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3 u_coreColor;       // Doc 22 #6 core yellow-gold
uniform vec3 u_haloColor;       // Doc 22 #6 halo cooler red
uniform vec3 u_envelopeColor;   // Doc 22 #4 outer reddish-brown
uniform vec3 u_globularColor;   // Doc 22 #9 globular yellow

// ---- geometry -------------------------------------------------------------
uniform float u_ellipticity;     // 0=spherical (E0), 0.7=E7
uniform float u_effectiveRadius; // Re
uniform float u_sersicIndex;     // n
uniform float u_coreExcess;      // central brightening
uniform float u_envelopeFalloff; // outer tail exponent
uniform float u_globularVisibility;
uniform float u_globularMetallicity; // 0=metal-poor blue (dSph), 1=metal-rich red.
uniform float u_diffuseness;     // 0=giant (opaque core), 1=dSph (ghost-like).
uniform float u_nucleusStrength; // dE,N nucleated cluster (0 = smooth dE).
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef GALAXY_STEPS
  #define GALAXY_STEPS 48
#endif

// Apply the axis-ratio warp: compress the short-axis coordinate so a
// spherical sample becomes an oblate spheroid. Long axis = X/Z, short = Y.
vec3 warpForEllipticity(vec3 p) {
  float q = 1.0 - clamp(u_ellipticity, 0.0, 0.8);
  return vec3(p.x, p.y / max(q, 1e-3), p.z);
}

// Sérsic density: exp(-b * (r/Re)^(1/n)).
float sersic(float rScaled, float n) {
  // b_n ≈ 2n - 1/3 + 4/(405 n) (Ciotti-Bertin). For n=4, b≈7.669.
  float b = 2.0 * n - 1.0 / 3.0 + 4.0 / max(405.0 * n, 1e-3);
  return exp(-b * pow(max(rScaled, 0.0), 1.0 / max(n, 0.25)));
}

// Sparkly globular-cluster layer. Grid-cell hash, bright hashes become
// visible as point-like highlights. Weighted toward the outer halo where
// the bulge brightness is low enough for them to stand out.
float globularSparkle(vec3 p, float t) {
  vec3 cell = floor(p * 8.0);
  float hash = cosmos_hash31(cell + 13.7);
  if (hash < 0.92) return 0.0;
  // Within the cell, local coord close to centre = a tight sparkle.
  vec3 local = fract(p * 8.0) - 0.5;
  float d = length(local);
  float twinkle = 0.6 + 0.4 * sin(t * 0.8 + hash * 31.0);
  return smoothstep(0.3, 0.0, d) * twinkle;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(GALAXY_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < GALAXY_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    vec3 pw = warpForEllipticity(p);
    float r = length(pw);
    float rScaled = r / max(u_effectiveRadius, 1e-3);
    float rho = sersic(rScaled, u_sersicIndex);
    // Central cusp from nuclear cluster.
    if (r < 0.03) rho *= u_coreExcess;
    // Outer envelope tail.
    float envelope = exp(-pow(rScaled * 0.45, u_envelopeFalloff));

    float density = rho + envelope * 0.1;
    // dSph "ghost galaxy" attenuation — doc 17 ENT-6022 rendering note:
    // μ > 24 mag/arcsec², transparency to background.
    density *= (1.0 - u_diffuseness * 0.85);
    if (density < 0.002) {
      t += stepSize;
      continue;
    }

    // Core-to-halo colour gradient (metallicity mix).
    float mixFactor = clamp(rScaled, 0.0, 1.6) / 1.6;
    vec3 color = mix(u_coreColor, u_haloColor, mixFactor);
    color = mix(color, u_envelopeColor, smoothstep(1.0, 1.6, rScaled));

    // dE,N nucleated cluster — bright central point, ~5× surrounding density.
    // Doc 17 ENT-6021 §Nucleated dE. Distinct from coreExcess (which scales
    // the smooth profile); nucleus is a gaussian point at r=0.
    if (u_nucleusStrength > 0.01) {
      float nuclear = exp(-pow(r / 0.04, 2.0)) * u_nucleusStrength;
      color += vec3(1.0, 0.93, 0.60) * nuclear * 1.8;  // Doc 17 #FFEE99.
      density += nuclear * 0.6;
    }

    // Globular sparkle — mostly visible in the outer envelope. Metallicity
    // dial picks blue (dSph/young halo) vs red (giant E / old halo).
    if (u_globularVisibility > 0.0 && rScaled > 0.6) {
      float sparkle = globularSparkle(p, u_time);
      vec3 gcColor = mix(
        vec3(0.67, 0.73, 1.00),   // Doc 17 ENT-6022 #AABBFF (metal-poor blue)
        u_globularColor,          // giant E warm yellow (metal-rich)
        u_globularMetallicity
      );
      color += gcColor * sparkle * u_globularVisibility;
      density += sparkle * 0.2 * u_globularVisibility;
    }

    float sampleAlpha = clamp(density, 0.0, 1.0) * stepSize * 1.6;
    accumColor += (1.0 - accumAlpha) * color * stepSize * 1.3;
    accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
    if (accumAlpha >= 0.99) break;
    t += stepSize;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
