// Cosmos Explorer — protoplanetary-disk fragment shader.
//
// Doc 17 §ENT-5070 + Doc 18 §Young Stellar Objects (T Tauri protoplanetary
// disk). The disk is a THIN FLAT structure — Doc 17 explicitly warns
// against 3D volumetric clouds here. We raymarch the unit cube but the
// density function collapses quickly outside the disk's scale-height so
// most rays terminate after only a handful of samples.
//
// The visual features that must read correctly:
//   - Face-on / edge-on disk with a bright hot inner region.
//   - Dark central cavity (sublimation radius / planet-cleared zone).
//   - Concentric ALMA-style gaps (HL Tau etched rings).
//   - Radial temperature gradient (hot inner ≈ 1000 K, cool outer ≈ 50 K).
//   - Central T-Tauri star glow visible through the cavity.
//
// The disk plane is fixed to the local XY plane; callers can rotate the
// mesh to change inclination (face-on / edge-on / proplyds-in-Orion).
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_hotDustColor;     // inner hot dust, ~1000 K (Doc 17)
uniform vec3  u_warmDustColor;    // mid-disk 300-500 K
uniform vec3  u_coolDustColor;    // outer 50-150 K (Doc 17 #553300)
uniform vec3  u_starColor;        // central T-Tauri glow

// ---- geometry -------------------------------------------------------------
uniform float u_outerRadius;
uniform float u_innerRadius;
uniform float u_scaleHeight;
uniform float u_radialPower;
uniform float u_gap1Radius;
uniform float u_gap2Radius;
uniform float u_gapWidth;
uniform float u_coreIntensity;
uniform float u_coreRadius;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef NEBULA_STEPS
  #define NEBULA_STEPS 56
#endif

float gapMask(float rho, float gapR) {
  float d = (rho - gapR) / max(u_gapWidth, 1e-4);
  return 1.0 - 0.85 * exp(-d * d);
}

float diskDensity(vec3 p) {
  float rho = length(p.xy);
  float z = abs(p.z);

  // Outside the outer edge — zero.
  if (rho > u_outerRadius) return 0.0;

  // Scale-height increases with radius (realistic ∝ √r).
  float h = max(u_scaleHeight, 1e-4) * sqrt(rho / max(u_outerRadius, 1e-4));
  float vertical = exp(-z * z / (2.0 * h * h));

  // Inner cavity — no dust inside the sublimation / planet-cleared zone.
  float cavity = smoothstep(u_innerRadius * 0.6, u_innerRadius, rho);

  // Radial surface-density power law.
  float radial = pow(
    max(rho, u_innerRadius) / max(u_outerRadius, 1e-4),
    -u_radialPower
  );
  radial = min(radial, 8.0); // clamp peak so inner ring doesn't explode

  // Outer edge taper.
  float outerTaper = 1.0 - smoothstep(u_outerRadius * 0.7, u_outerRadius, rho);

  // ALMA-style gaps.
  float gaps = gapMask(rho, u_gap1Radius) * gapMask(rho, u_gap2Radius);

  // Gentle azimuthal asymmetry — lopsided rings from eccentric planets.
  float theta = atan(p.y, p.x);
  float asym = 1.0 + 0.12 * sin(theta * 2.0);

  return vertical * cavity * radial * outerTaper * gaps * asym;
}

vec3 diskEmission(vec3 p, float density) {
  float rho = length(p.xy);
  // Temperature gradient — Doc 17: T(r) = T0 * (r/r0)^-0.5
  float tNorm = clamp(
    pow(max(rho, 1e-3) / max(u_outerRadius, 1e-4), -0.5),
    0.0,
    4.0
  );

  // Blend hot → warm → cool along the radial profile.
  vec3 color;
  if (tNorm > 2.0) {
    color = mix(u_warmDustColor, u_hotDustColor, smoothstep(2.0, 3.5, tNorm));
  } else {
    color = mix(u_coolDustColor, u_warmDustColor, smoothstep(0.6, 2.0, tNorm));
  }

  // Intensity follows a tamed T^2 law — the real T^4 falloff renders the
  // outer disk almost invisible in the gallery preview, which defeats the
  // purpose of showing ALMA-style rings. Keep the inner/outer colour
  // gradient from Doc 17 but flatten the dynamic range.
  float brightness = clamp(pow(tNorm * 0.55, 2.0) + 0.25, 0.0, 3.5);
  return color * brightness * density * 1.6;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(NEBULA_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < NEBULA_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    float density = diskDensity(p);
    float r = length(p);
    // Central star — renders through the disk cavity.
    float core = exp(-pow(r / max(u_coreRadius, 1e-4), 2.0)) * u_coreIntensity;

    if (density > 0.005 || core > 0.01) {
      vec3 emission = diskEmission(p, density) + u_starColor * core;
      float sampleAlpha = clamp(density * 1.5 + core * 0.2, 0.0, 1.0) * stepSize * 0.8;
      accumColor += (1.0 - accumAlpha) * emission * stepSize;
      accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
      if (accumAlpha >= 0.99) break;
    }
    t += stepSize;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
