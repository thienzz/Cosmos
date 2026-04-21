// Cosmos Explorer — pulsar fragment shader (T28, ENT-1020).
//
// Doc 18 §Neutron Star / Pulsar — four geometric features in one raymarch:
//
//   1. Core           — hot tight sphere at origin (neutron-star surface).
//   2. Beams          — two opposed cones along the magnetic axis. Beam
//                       intensity gates a sinusoidal pulse at
//                       `u_pulseFrequency` — the classic "lighthouse" sweep.
//   3. Polar caps     — bright spots on the core at beam footprints.
//   4. Pulsar wind nebula (PWN) — diffuse synchrotron halo extending to
//                       `u_windRadius`, modulated by fbm so filaments read.
//
// The magnetic axis is tilted from the rotation axis (uY) by
// `u_magneticTiltRad` — the off-axis angle is what makes the pulse visible
// to a fixed observer (if the beam were coaxial with the rotation axis we'd
// see a DC brightness).
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_coreColor;
uniform vec3  u_beamColor;
uniform vec3  u_polarCapColor;
uniform vec3  u_windNebulaColor;
uniform vec3  u_fieldColor;

// ---- geometry + animation -------------------------------------------------
uniform float u_coreRadius;
uniform float u_coreIntensity;
uniform float u_beamHalfAngle;
uniform float u_beamLength;
uniform float u_beamIntensity;
uniform float u_pulseFrequency;
uniform float u_magneticTiltRad;
uniform float u_windRadius;
uniform float u_windFbmScale;
uniform float u_windDensity;
uniform float u_polarCapIntensity;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef EXOTIC_STEPS
  #define EXOTIC_STEPS 56
#endif

// Magnetic axis = rotation(Y) × tilt(around X) × rotation(Y, time).
vec3 magneticAxis(float t) {
  float tilt = u_magneticTiltRad;
  // Start from +Y, tilt into the YZ plane by `tilt`.
  vec3 axis = vec3(0.0, cos(tilt), sin(tilt));
  // Rotate around Y at the pulsar's spin rate. Pulse frequency here is
  // rotations/sec; `2π` factor per rotation.
  float ang = t * 6.2831853 * u_pulseFrequency;
  float c = cos(ang);
  float s = sin(ang);
  return normalize(vec3(c * axis.x + s * axis.z, axis.y, -s * axis.x + c * axis.z));
}

vec3 coreEmission(float r) {
  if (r > u_coreRadius * 2.5) return vec3(0.0);
  float g = exp(-pow(r / max(u_coreRadius, 1e-4), 2.0));
  return u_coreColor * g * u_coreIntensity;
}

// Bipolar beam cone. Beams are symmetric — a sample is inside the beam if
// it's close enough to either +magAxis or −magAxis.
vec3 beamEmission(vec3 p, vec3 magAxis) {
  float r = length(p);
  if (r < u_coreRadius * 0.8 || r > u_beamLength) return vec3(0.0);
  vec3 dir = p / max(r, 1e-6);
  float cosTheta = max(dot(dir, magAxis), dot(dir, -magAxis));
  float cosLimit = cos(u_beamHalfAngle);
  if (cosTheta < cosLimit) return vec3(0.0);
  float angular = smoothstep(cosLimit, 1.0, cosTheta);
  // Axial falloff + slight FBM flicker for texture.
  float axial = 1.0 - smoothstep(u_coreRadius, u_beamLength, r);
  float flicker = 0.8 + 0.2 * cosmos_fbm(p * 3.5 + vec3(0.0, u_time * 2.0, 0.0), 2);
  return u_beamColor * (angular * axial * flicker) * u_beamIntensity;
}

// Hot polar caps: small bright disc on the surface around the beam footprint.
vec3 polarCapEmission(vec3 p, vec3 magAxis) {
  float r = length(p);
  float surfBand = exp(-pow((r - u_coreRadius) / max(u_coreRadius * 0.35, 1e-4), 2.0));
  if (surfBand < 1e-3) return vec3(0.0);
  vec3 dir = p / max(r, 1e-6);
  float cap = pow(max(abs(dot(dir, magAxis)), 0.0), 18.0);
  return u_polarCapColor * (cap * surfBand) * u_polarCapIntensity;
}

// Pulsar wind nebula — diffuse halo past the compact object.
vec3 pwnEmission(vec3 p, float r) {
  if (r < u_coreRadius * 1.5 || r > u_windRadius) return vec3(0.0);
  float radial = 1.0 - smoothstep(u_coreRadius * 1.5, u_windRadius, r);
  float fbm = cosmos_warpedFbm(p * u_windFbmScale + vec3(u_time * 0.05), 4);
  float density = u_windDensity * radial * fbm;
  return u_windNebulaColor * density;
}

// Faint field-line hint — dipole-like tint along the magnetic axis band.
vec3 fieldHintEmission(vec3 p, vec3 magAxis, float r) {
  if (r < u_coreRadius || r > u_windRadius * 0.8) return vec3(0.0);
  vec3 dir = p / max(r, 1e-6);
  float lat = abs(dot(dir, magAxis));
  float band = exp(-pow((r - u_coreRadius * 3.0) / 0.2, 2.0));
  float dipole = pow(lat, 8.0) * band;
  return u_fieldColor * dipole * 0.35;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  vec3 magAxis = magneticAxis(u_time);

  float stepSize = (tFar - tNear) / float(EXOTIC_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < EXOTIC_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;
    float r = length(p);

    vec3 emission =
      coreEmission(r)
      + beamEmission(p, magAxis)
      + polarCapEmission(p, magAxis)
      + pwnEmission(p, r)
      + fieldHintEmission(p, magAxis, r);
    float intensity = max(max(emission.r, emission.g), emission.b);
    if (intensity > 0.005) {
      float sampleAlpha = clamp(intensity, 0.0, 1.0) * stepSize * 0.9;
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
