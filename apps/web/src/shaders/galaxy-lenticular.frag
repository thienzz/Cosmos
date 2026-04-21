// Cosmos Explorer — lenticular galaxy fragment shader (T29, ENT-6012).
//
// Doc 18 §Galaxy Rendering + Doc 17 ENT-6012 Lenticular (S0). Raymarches a
// smooth disk-plus-bulge blend inside the unit cube:
//
//   - Disk:  exponential radial × gaussian vertical (thicker than spiral,
//            smaller azimuthal ripple, no spiral arms).
//   - Bulge: Sérsic n≈3, dominant in the centre.
//   - Dust:  optional thin dust lane along the disk midplane (S0a subtype).
//
// No spiral arms, no HII knots, no bar — pure smooth disk+bulge separated by
// a colour gradient. Doc 17 ENT-6012 "lens-shaped" description verbatim:
// bulge red (#CC8844) → inner disk orange → outer disk yellow-orange.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3 u_bulgeColor;       // Doc 17 bulge reddish-brown
uniform vec3 u_innerDiskColor;   // Doc 17 inner disk orange
uniform vec3 u_outerDiskColor;   // Doc 17 outer disk yellow-orange
uniform vec3 u_haloColor;        // Doc 17 halo pale
uniform vec3 u_dustColor;        // Doc 17 dust dark

// ---- parameters -----------------------------------------------------------
uniform float u_diskScaleRadius;
uniform float u_diskThickness;
uniform float u_bulgeRadius;
uniform float u_bulgeSersic;
uniform float u_azimuthalRipple;
uniform float u_dustOpacity;
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

float bulgeDensity(vec3 p) {
  float r = length(p);
  float x = r / max(u_bulgeRadius, 1e-4);
  float b = mix(1.9992, 7.669, clamp((u_bulgeSersic - 1.0) / 3.0, 0.0, 1.0));
  return exp(-b * pow(x, 1.0 / max(u_bulgeSersic, 1.0)));
}

float diskDensity(vec3 p) {
  float r = length(p.xz);
  float radial = exp(-r / max(u_diskScaleRadius, 1e-4));
  float theta = atan(p.z, p.x);
  // Slight azimuthal ripple per Doc 17 ENT-6012 lenticularDiskDensity.
  float ripple = 1.0 + u_azimuthalRipple * sin(3.0 * theta);
  float vert = exp(-pow(p.y / max(u_diskThickness, 1e-4), 2.0));
  return radial * vert * ripple;
}

// Optional S0a dust lane. Thin gaussian along the midplane, modulated by
// low-frequency fbm so it looks wispy.
float dustLane(vec3 p) {
  if (u_dustOpacity <= 1e-4) return 0.0;
  float vert = exp(-pow(p.y / max(u_diskThickness * 0.4, 1e-4), 2.0));
  float radial = exp(-length(p.xz) / max(u_diskScaleRadius * 1.2, 1e-4));
  float fbm = cosmos_fbm(p * 2.5, 2);
  return vert * radial * (0.4 + 0.6 * fbm) * u_dustOpacity;
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

    float dBulge = bulgeDensity(p);
    float dDisk  = diskDensity(p);
    float density = dBulge * 2.0 + dDisk;
    if (density < 0.002) {
      t += stepSize;
      continue;
    }

    // Colour: bulge colour at centre, inner disk orange near mid-radius,
    // outer disk yellow-orange at large radius.
    float radial = length(p.xz);
    float radiusMix = clamp(radial / max(u_diskScaleRadius, 1e-4), 0.0, 1.0);
    vec3 diskColor = mix(u_innerDiskColor, u_outerDiskColor, radiusMix);
    vec3 color = u_bulgeColor * dBulge * 2.0 + diskColor * dDisk;

    // Dust: multiplicative attenuation.
    float dust = dustLane(p);
    color = mix(color, u_dustColor * 0.25, clamp(dust * 0.7, 0.0, 0.7));

    // Halo tint at low density.
    float haloWeight = clamp(1.0 - density * 2.0, 0.0, 1.0);
    color += u_haloColor * haloWeight * 0.04;

    float sampleAlpha = clamp(density, 0.0, 1.0) * stepSize * 1.5;
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
