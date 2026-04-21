// Cosmos Explorer — shared planet-lighting helpers.
//
// Centralises the Lambert + rim + ambient terms so every planet shader uses
// the same lighting model. Each body tweaks the ambient floor and rim width
// via uniforms rather than forking the formula.
//
// #include-d by both rocky and gas-giant fragment shaders. All helpers are
// prefixed `cosmos_` to avoid collisions with Three.js chunks.

#ifndef COSMOS_LIGHTING_INCLUDED
#define COSMOS_LIGHTING_INCLUDED

// ---------------------------------------------------------------------------
// Diffuse Lambert with ambient floor. `u_ambient` controls how dark the
// nightside gets — Mercury has essentially none (0.02), Earth has the
// greatest due to atmospheric scattering (0.15).
// ---------------------------------------------------------------------------

float cosmos_diffuse(vec3 normalW, vec3 sunDir, float ambient) {
  float d = max(0.0, dot(normalW, sunDir));
  return ambient + (1.0 - ambient) * d;
}

// ---------------------------------------------------------------------------
// Terminator softness — smooths the dusk/dawn boundary. Gas giants want
// a wider terminator (atmospheric scattering); rocky bodies want it
// sharp.
// ---------------------------------------------------------------------------

float cosmos_softTerminator(vec3 normalW, vec3 sunDir, float softness) {
  float d = dot(normalW, sunDir);
  return smoothstep(-softness, softness, d);
}

// ---------------------------------------------------------------------------
// Limb darkening — fall-off near the planet edge. Doc 18 calls out
// coefficients per body (Mercury 0.4, Mars 0.35, etc.). Uses the standard
// linear limb-darkening law.
//   I(µ) = I(1) · (1 − u · (1 − µ))   where µ = cos(angle to normal).
// ---------------------------------------------------------------------------

float cosmos_limbDarken(vec3 normalW, vec3 viewDir, float coeff) {
  float mu = max(0.0, dot(normalW, viewDir));
  return 1.0 - coeff * (1.0 - mu);
}

// ---------------------------------------------------------------------------
// Atmospheric rim glow — bright thin band where the terminator meets the
// limb. `thickness` in [0,1]; tinted by the atmosphere colour.
// ---------------------------------------------------------------------------

vec3 cosmos_rimGlow(vec3 normalW, vec3 viewDir, vec3 sunDir, vec3 tint, float thickness) {
  float mu = abs(dot(normalW, viewDir));
  float rim = pow(1.0 - mu, 3.0);                     // concentrated at edge
  float sunFacing = max(0.0, dot(normalW, sunDir));   // only on lit side
  return tint * rim * sunFacing * thickness;
}

// ---------------------------------------------------------------------------
// Planet-local spherical coordinates from a model-space normal.
//   .x = longitude in [-π, π]   (0 at +X)
//   .y = latitude in [-π/2, π/2] (0 at equator, +π/2 at north pole = +Y)
// ---------------------------------------------------------------------------

vec2 cosmos_sphericalCoords(vec3 n) {
  float lon = atan(n.z, n.x);
  float lat = asin(clamp(n.y, -1.0, 1.0));
  return vec2(lon, lat);
}

#endif
