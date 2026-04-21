// Cosmos Explorer — shared volumetric raymarching helpers.
//
// Used by every nebula shader (Doc 18 §Nebula Rendering). Each nebula is
// rendered as a unit cube in model space (`position` ∈ [-1, 1]³); the fragment
// shader reconstructs a ray from the model-space camera position to the
// model-space fragment, marches through the cube, and samples a procedural
// density function defined per-kind.
//
// All helpers are pure closed-form procedural primitives — CLAUDE.md Rule #1.

#ifndef COSMOS_VOLUMETRIC_INCLUDED
#define COSMOS_VOLUMETRIC_INCLUDED

// ---------------------------------------------------------------------------
// Ray-AABB intersection (slab method, branch-free).
// Returns vec2(tNear, tFar). If tFar < max(tNear, 0.0) the ray misses.
// Epsilon on rayDir protects against div-by-zero when the ray is axis-
// aligned with a slab.
// ---------------------------------------------------------------------------

vec2 cosmos_rayAabb(vec3 origin, vec3 rayDir, vec3 aabbMin, vec3 aabbMax) {
  vec3 invDir = 1.0 / (rayDir + sign(rayDir + 1e-8) * 1e-8);
  vec3 t0 = (aabbMin - origin) * invDir;
  vec3 t1 = (aabbMax - origin) * invDir;
  vec3 tMin = min(t0, t1);
  vec3 tMax = max(t0, t1);
  float tNear = max(max(tMin.x, tMin.y), tMin.z);
  float tFar  = min(min(tMax.x, tMax.y), tMax.z);
  return vec2(tNear, tFar);
}

// ---------------------------------------------------------------------------
// Soft spherical radial falloff — 1 at origin, 0 at `radius`. Used by every
// nebula kind to envelope the procedural density inside the unit cube so
// there's no hard billboard edge at the faces of the AABB.
// ---------------------------------------------------------------------------

float cosmos_radialFalloff(vec3 p, float radius, float power) {
  float r = length(p) / max(radius, 1e-4);
  return pow(max(0.0, 1.0 - r), power);
}

// ---------------------------------------------------------------------------
// Henyey-Greenstein phase function — approximates dust-grain angular
// scattering. `g = 0` is isotropic, `g → 1` is forward-peaked. Used by the
// reflection-nebula shader to bias brightness toward the illuminating star.
// ---------------------------------------------------------------------------

float cosmos_henyeyGreenstein(float cosTheta, float g) {
  float g2 = g * g;
  float denom = 1.0 + g2 - 2.0 * g * cosTheta;
  return (1.0 - g2) / max(1e-4, 12.566370614 * pow(denom, 1.5));
}

// ---------------------------------------------------------------------------
// Gaussian shell profile — brightest at `r = center`, σ = `thickness`.
// Used by planetary-nebula shells and supernova-remnant shock fronts.
// ---------------------------------------------------------------------------

float cosmos_shellBrightness(float r, float center, float thickness) {
  float d = (r - center) / max(thickness, 1e-4);
  return exp(-d * d);
}

// ---------------------------------------------------------------------------
// Bipolar-lobe mask — 1 along `axis` poles, 0 at the equator. `ratio` 0 gives
// a spherical result; 1 gives a sharp polar ellipsoid.
// ---------------------------------------------------------------------------

float cosmos_bipolarMask(vec3 p, vec3 axis, float ratio) {
  float cosLat = abs(dot(normalize(p + 1e-6), normalize(axis)));
  return mix(1.0, smoothstep(0.4, 0.95, cosLat), ratio);
}

#endif
