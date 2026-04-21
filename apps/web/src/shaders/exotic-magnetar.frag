// Cosmos Explorer — magnetar fragment shader (T28, ENT-8010).
//
// Doc 18 § (implicit — Doc 17 ENT-1031 / Doc 22 ENT-8010) — five features in
// one raymarch:
//
//   1. Surface         — tan iron-crust sphere with FBM granulation.
//   2. Polar caps      — bright orange-red hotspots at the magnetic poles.
//   3. Dipole field    — yellow→red radial "tube" intensity weighted by the
//                        magnetic-axis co-latitude, twisted around the axis
//                        by `u_fieldTwist` radians to read the Doc 22
//                        "helical winding" spec.
//   4. Reconnection    — sparse bright blue-white hotspots scattered along
//                        the field, pulsing at `u_reconnectionRate`.
//   5. Starquake flare — optional uniform-intensity flash (gated by
//                        `u_flareIntensity`; 0 disables).
//
// Field twist makes the visual distinctly magnetar-y: plain dipole field
// renders like a pulsar, while twisted/braided lines are the Doc 22 §Twisted
// signature of an active ENT-8010.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_surfaceColor;
uniform vec3  u_fieldHotColor;
uniform vec3  u_fieldCoolColor;
uniform vec3  u_polarCapColor;
uniform vec3  u_reconnectionColor;

// ---- geometry + animation -------------------------------------------------
uniform float u_surfaceRadius;
uniform float u_surfaceFbmScale;
uniform float u_surfaceAmplitude;
uniform float u_polarCapSize;
uniform float u_polarCapIntensity;
uniform float u_fieldDensity;
uniform float u_fieldTwist;
uniform float u_fieldIntensity;
uniform float u_reconnectionDensity;
uniform float u_reconnectionRate;
uniform float u_flareIntensity;
uniform float u_rotationRate;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef EXOTIC_STEPS
  #define EXOTIC_STEPS 48
#endif

// Surface-band emission — gaussian around the neutron-star radius.
vec3 surfaceEmission(vec3 p, float r) {
  float band = exp(-pow((r - u_surfaceRadius) / max(u_surfaceRadius * 0.25, 1e-4), 2.0));
  if (band < 1e-3) return vec3(0.0);
  float granule = cosmos_fbm(p * u_surfaceFbmScale, 4);
  float brightness = 1.0 + (granule - 0.5) * u_surfaceAmplitude;
  return u_surfaceColor * band * brightness * 0.9;
}

// Polar cap — bright spot at the +Y / -Y magnetic poles of the neutron star.
vec3 polarCapEmission(vec3 p, float r) {
  float band = exp(-pow((r - u_surfaceRadius) / max(u_surfaceRadius * 0.35, 1e-4), 2.0));
  if (band < 1e-3) return vec3(0.0);
  vec3 dir = p / max(r, 1e-6);
  float lat = abs(dir.y);
  float cap = smoothstep(cos(u_polarCapSize), 1.0, lat);
  return u_polarCapColor * band * cap * u_polarCapIntensity;
}

// Radial magnetic field visualisation — intensity weighted by proximity to
// the dipole axis + helical twist around that axis.
//
// We map the sample into cylindrical coords (ρ, φ, z) with z along the
// rotation axis (Y), then apply `φ' = φ + z × twist` so the field lines
// appear helical. Intensity = gaussian around the axis weighted by a
// sinusoidal modulation of `φ'` — looks like tubular field lines.
vec3 fieldEmission(vec3 p, float r) {
  if (r < u_surfaceRadius * 1.05 || r > 0.95) return vec3(0.0);
  float rho = length(p.xz);
  if (rho < 1e-4) return vec3(0.0);
  float phi = atan(p.z, p.x);
  // Add rotation with time so the field appears to co-rotate with the crust.
  phi += u_time * u_rotationRate;
  // Helical twist along the axis.
  float phiTwisted = phi + p.y * u_fieldTwist;
  // "Tube count" — 8 field lines around the circumference.
  float tube = pow(0.5 + 0.5 * cos(phiTwisted * 8.0), 4.0);
  // Latitude weight — field strongest near the poles of the dipole.
  float lat = abs(p.y / r);
  float latWeight = pow(lat, 1.2) * 0.6 + 0.4;
  // Radial falloff — stronger close to the surface, fading outward.
  float radial = exp(-pow((r - u_surfaceRadius) / 0.35, 2.0));
  // Colour interp: hot-gold at max intensity, red at low intensity.
  float strength = tube * latWeight * radial;
  vec3 col = mix(u_fieldCoolColor, u_fieldHotColor, clamp(strength, 0.0, 1.0));
  return col * strength * u_fieldDensity * u_fieldIntensity;
}

// Stochastic reconnection pulses — sparse bright blue-white points that
// flash at `u_reconnectionRate` Hz.
vec3 reconnectionEmission(vec3 p, float r) {
  if (r < u_surfaceRadius || r > 0.85) return vec3(0.0);
  // Quantise the sample to a grid so each grid cell is one potential
  // hotspot — sparse placement per Doc 22 "~8–12 hotspots".
  vec3 cell = floor(p * u_reconnectionDensity);
  float hash = cosmos_hash31(cell);
  if (hash < 0.78) return vec3(0.0);
  // Flash period offset per cell so they don't pulse in sync.
  float offset = cosmos_hash31(cell + vec3(17.0, 31.0, 57.0));
  float pulse = 0.5 + 0.5 * sin((u_time + offset * 10.0) * u_reconnectionRate * 6.2831853);
  if (pulse < 0.6) return vec3(0.0);
  vec3 frac = p * u_reconnectionDensity - cell - 0.5;
  float dist = length(frac);
  float core = exp(-pow(dist * 3.5, 2.0));
  return u_reconnectionColor * (core * (pulse - 0.6) / 0.4) * 1.8;
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

    vec3 emission =
      surfaceEmission(p, r)
      + polarCapEmission(p, r)
      + fieldEmission(p, r)
      + reconnectionEmission(p, r);
    // Flare: bump the entire emissive field uniformly while active.
    emission += u_fieldHotColor * u_flareIntensity * exp(-pow(r * 2.0, 2.0));
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
