// Cosmos Explorer — full-screen Schwarzschild gravitational lensing pass
// (T30, Doc 18 §Gravitational Lensing Shader, follow-up to T28 which had
// an emission photon ring standing in for the real geodesic).
//
// For each screen pixel, we:
//   1. Project up to POST_LENSING_MAX_BLACKHOLES BH positions from world
//      space to screen space (CPU-side we upload projected NDC + apparent
//      angular Schwarzschild radius).
//   2. Compute impact parameter b in NDC space.
//   3. Bend the sampling UV by the Schwarzschild weak-field deflection
//      angle α ≈ 2 r_s / b, capped by `u_maxDeflectionRad` so the inner
//      photon sphere doesn't produce a divergent offset.
//   4. Resample `u_scene` at the bent UV, then composite the result on
//      top of the original (full replace inside the lensing radius, no
//      change outside it).
//
// This is the Doc 18 §Black Hole "lensing" approximation: a weak-field
// ray-bend good enough to curl nearby stars and nebulae around the
// horizon. Kerr / exact Schwarzschild geodesic integration (multi-image,
// frame-dragging) is out of scope and can layer on top of the same pass
// signature later.

#ifndef POST_LENSING_MAX_BLACKHOLES
#define POST_LENSING_MAX_BLACKHOLES 4
#endif

precision highp float;

uniform sampler2D u_scene;
uniform int       u_blackHoleCount;
// Per-BH in screen-space. .xy = NDC-normalised centre on [0,1]
// (computed CPU-side from camera projection), .z = apparent (angular)
// Schwarzschild radius in UV units, .w = Einstein scale factor (usually
// 1.5 per Doc 18 §Black Hole photon sphere).
uniform vec4      u_blackHoles[POST_LENSING_MAX_BLACKHOLES];
uniform float     u_maxDeflectionRad;
uniform float     u_falloffExponent;
uniform vec2      u_aspect; // width/height ratio so deflection is isotropic in pixel space

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 uv = v_uv;
  vec2 bentUv = uv;
  float lensAccum = 0.0;
  float insideHorizon = 0.0;

  // Aspect-corrected working vector so circular horizons stay circular.
  vec2 aspectUv = (uv - 0.5) * u_aspect;

  int count = min(u_blackHoleCount, POST_LENSING_MAX_BLACKHOLES);
  for (int i = 0; i < POST_LENSING_MAX_BLACKHOLES; i++) {
    if (i >= count) break;
    vec4 bh = u_blackHoles[i];
    vec2 bhAspect = (bh.xy - 0.5) * u_aspect;
    vec2 offset = aspectUv - bhAspect;
    float b = length(offset); // impact parameter in aspect-corrected UV units
    float rs = bh.z;
    float einsteinR = rs * bh.w;

    // Inside horizon → hard black disc. We still let other BHs shift b
    // (unlikely to stack, but the loop stays uniform).
    if (b < rs) {
      insideHorizon = 1.0;
      continue;
    }

    // Weak-field Schwarzschild deflection in radians:
    //   α = 2 r_s / b   (Einstein 1916)
    // We interpret α directly in UV-space as a proportional pull
    // toward the black hole, scaled by `einsteinScale` (the photon
    // sphere radius at 1.5 × r_s).
    float denom = max(b, rs * 1.001);
    float alpha = 2.0 * einsteinR / pow(denom, max(u_falloffExponent, 0.01));
    alpha = clamp(alpha, 0.0, u_maxDeflectionRad);

    // Deflection direction: radial, toward the black hole.
    vec2 dir = -offset / denom; // inverted offset → pulls light toward BH
    // Undo aspect correction when writing the UV step.
    vec2 uvShift = dir * alpha * (1.0 / u_aspect);
    bentUv += uvShift;
    lensAccum += smoothstep(einsteinR * 3.0, einsteinR * 1.05, b);
  }

  if (insideHorizon > 0.5) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Clamp the bent UV so we don't sample outside the HDR target (Three.js
  // wraps to UV [0,1] but the Float16 target is clamped at the border).
  bentUv = clamp(bentUv, vec2(0.0001), vec2(0.9999));

  vec3 lensed = texture(u_scene, bentUv).rgb;
  vec3 straight = texture(u_scene, uv).rgb;

  // Lerp between straight and lensed based on how close we are to a BH.
  float mix01 = clamp(lensAccum, 0.0, 1.0);
  vec3 result = mix(straight, lensed, mix01);

  fragColor = vec4(result, 1.0);
}
