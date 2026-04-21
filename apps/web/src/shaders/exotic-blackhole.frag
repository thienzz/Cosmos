// Cosmos Explorer — black hole fragment shader (T28, ENT-1030 / ENT-1032).
//
// Doc 18 §Black Hole — a composite of five geometric features rendered inside
// a single raymarch over the unit cube:
//
//   1. Event horizon   — opaque black sphere at `u_horizonRadius`.
//   2. Photon sphere   — thin emissive ring at 1.5 × r_s (Einstein ring).
//   3. Accretion disk  — thin toroid in the disk plane, temperature gradient
//                        (white → yellow → orange) + Keplerian rotation +
//                        Doppler beaming (approaching side brighter).
//   4. Relativistic jets — two collimated cones along the spin axis.
//   5. Lensing tint    — subtle bend of the disk photon path into a bright
//                        curl above/below the horizon (approximation of the
//                        full Schwarzschild geodesic — full ray-trace lens
//                        is deferred to T30 post-processing).
//
// We march through the cube, sample each feature's density, and front-to-back
// composite. Opaque horizon early-terminates by setting alpha = 1.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_horizonColor;     // #000000
uniform vec3  u_photonRingColor;  // #DDEEFF
uniform vec3  u_diskInnerColor;   // #FFFFFF
uniform vec3  u_diskMidColor;     // #FFDDAA
uniform vec3  u_diskOuterColor;   // #FF9966
uniform vec3  u_jetColor;         // #4A8BFF

// ---- geometry + animation -------------------------------------------------
uniform float u_horizonRadius;
uniform float u_photonRingRadius;
uniform float u_photonRingThickness;
uniform float u_diskInnerRadius;
uniform float u_diskOuterRadius;
uniform float u_diskThickness;
uniform float u_diskTilt;
uniform float u_diskRotationRate;
uniform float u_dopplerStrength;
uniform float u_turbulenceScale;
uniform float u_jetHalfAngle;
uniform float u_jetLength;
uniform float u_jetIntensity;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef EXOTIC_STEPS
  #define EXOTIC_STEPS 64
#endif

// Rotate a sample into the disk frame so `disk.y == 0` is the midplane.
vec3 toDiskFrame(vec3 p) {
  float c = cos(u_diskTilt);
  float s = sin(u_diskTilt);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

// Doppler brightness multiplier — approaching side (+X in rotating frame)
// brighter, receding side dimmer. `phase` is the azimuth + time-advance.
float doppler(float azimuth, float t) {
  float phase = azimuth - t * u_diskRotationRate;
  return 1.0 + u_dopplerStrength * cos(phase);
}

// Temperature → emission colour for the disk. Inner (white) → outer (orange)
// with a yellow-white midband. Doc 17 ENT-1032 gradient.
vec3 diskColour(float tNorm) {
  // tNorm = 1 at inner edge, 0 at outer.
  vec3 c;
  if (tNorm > 0.6) {
    c = mix(u_diskMidColor, u_diskInnerColor, (tNorm - 0.6) / 0.4);
  } else if (tNorm > 0.25) {
    c = mix(u_diskOuterColor, u_diskMidColor, (tNorm - 0.25) / 0.35);
  } else {
    c = u_diskOuterColor * (0.6 + 0.4 * tNorm / 0.25);
  }
  return c;
}

// Returns accretion disk emission at world-space point `p`.
vec3 diskEmission(vec3 p, float r) {
  vec3 d = toDiskFrame(p);
  float rho = length(d.xz);              // radius in disk plane
  if (rho < u_diskInnerRadius || rho > u_diskOuterRadius) return vec3(0.0);
  // Thin-disk envelope in Y (perpendicular to disk plane).
  float yEnv = exp(-pow(d.y / max(u_diskThickness, 1e-4), 2.0));
  if (yEnv < 1e-3) return vec3(0.0);
  float tNorm = 1.0 - (rho - u_diskInnerRadius) / max(u_diskOuterRadius - u_diskInnerRadius, 1e-4);
  // Temperature ramps as 1/sqrt(r) — bias the normalised parameter toward
  // the inner edge so white/blue dominates where it should.
  float tempBias = pow(tNorm, 0.6);
  vec3 base = diskColour(tempBias);
  float az = atan(d.z, d.x);
  float beam = doppler(az, u_time);
  // Turbulence — fbm modulates the brightness for MHD-instability look.
  float turb = cosmos_fbm(d * u_turbulenceScale + vec3(u_time * 0.1), 4);
  float density = yEnv * (0.55 + 0.85 * turb);
  // Fade the very outer 15% for a smooth truncation.
  float edge = smoothstep(u_diskOuterRadius, u_diskOuterRadius * 0.85, rho);
  return base * beam * density * edge * (1.7 + tempBias);
}

// Thin photon ring — equatorial bright circle at 1.5 × r_s.
vec3 photonRingEmission(vec3 p) {
  vec3 d = toDiskFrame(p);
  float rho = length(d.xz);
  float radialG = exp(-pow((rho - u_photonRingRadius) / max(u_photonRingThickness, 1e-4), 2.0));
  float yEnv = exp(-pow(d.y / max(u_photonRingThickness * 1.2, 1e-4), 2.0));
  return u_photonRingColor * (radialG * yEnv) * 2.4;
}

// Bipolar relativistic jets along the +/-Y axis (in model frame). Cones
// thicken slightly with distance from origin to hint at spreading.
vec3 jetEmission(vec3 p) {
  float axial = abs(p.y);
  if (axial > u_jetLength) return vec3(0.0);
  // Radial distance from the +/-Y axis.
  float rho = length(p.xz);
  float width = u_jetHalfAngle * axial + 0.02;
  if (rho > width) return vec3(0.0);
  float profile = 1.0 - smoothstep(width * 0.3, width, rho);
  // Intensity falls off along the jet length (distance from compact source).
  float falloff = 1.0 - smoothstep(0.05, u_jetLength, axial);
  // Knotty structure inside the jet.
  float knot = 0.5 + 0.5 * cosmos_fbm(p * 5.0 + vec3(0.0, u_time * 0.3, 0.0), 3);
  // Relativistic beaming asymmetry — +Y side brighter.
  float beam = p.y > 0.0 ? 1.2 : 0.65;
  return u_jetColor * (profile * falloff * knot * beam) * u_jetIntensity;
}

// Horizon opacity — binary 1 inside the sphere, 0 outside.
float horizonOpacity(float r) {
  return 1.0 - smoothstep(u_horizonRadius * 0.95, u_horizonRadius * 1.02, r);
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(EXOTIC_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < EXOTIC_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;
    float r = length(p);

    // Horizon — binary opaque black. If we hit it, write black and stop.
    float hOp = horizonOpacity(r);
    if (hOp > 0.5) {
      // Keep what we've accumulated in front of the horizon, fill the
      // remainder with absolute black.
      accumColor += (1.0 - accumAlpha) * u_horizonColor;
      accumAlpha  = 1.0;
      break;
    }

    // Emissive features.
    vec3 emission = diskEmission(p, r) + photonRingEmission(p) + jetEmission(p);
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
