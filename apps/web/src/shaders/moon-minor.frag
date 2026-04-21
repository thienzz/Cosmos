// Cosmos Explorer — minor-moon fragment shader (T43).
// Doc 17 §3021..3023 + Doc 18 §Moon Types.
//
//   MOON_SHEPHERD     ENT-3021  ring-shepherding small moons. Heavily cratered
//                               from ring-particle impact, dark ring-dust tint.
//   MOON_TROJAN_MOON  ENT-3022  L4/L5 co-orbital. D-type dark material.
//   MOON_BINARY       ENT-3023  binary pair (Pluto-Charon-like). Tidal bulge
//                               + bright sub-binary point.

#include "lib/noise.glsl"
#include "lib/lighting.glsl"
#include "lib/moon-common.glsl"

out vec4 fragColor;

// Small-body generic — fbm roughness + dense crater layer.
vec3 smallBodySurface(vec3 n) {
  float rough = cosmos_fbm(n * 6.0, 5) * u_terrainRoughness;
  vec3 base = mix(u_baseColor, u_shadowColor, rough * 0.4);
  return moon_craterLayer(base, n, 20.0);
}

void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  vec3 n  = normalize(v_surfaceNormal);
  vec3 nW = normalize(v_normalW);
  vec3 v  = normalize(v_viewDirW);
  vec3 s  = normalize(u_sunDir);

  vec3 surface = smallBodySurface(n);

  // Binary moon: bright sub-binary point (view of partner) + tidal glow
  // on the facing hemisphere. Assumes +X faces the partner.
  #ifdef MOON_BINARY
  {
    float facing = max(0.0, n.x);
    float subPoint = pow(facing, 4.0);
    surface = mix(surface, u_highlightColor, subPoint * 0.35);
  }
  #endif

  // Trojan moons — subtle tholin red-organic tint (D-type asteroid analog).
  #ifdef MOON_TROJAN_MOON
  {
    float tholin = cosmos_fbm(n * 3.0, 3);
    surface = mix(surface, u_shadowColor, smoothstep(0.55, 0.7, tholin) * u_tholinAmount);
  }
  #endif

  // Lighting.
  float sunFacing = dot(nW, s);
  float lit = cosmos_diffuse(nW, s, u_ambientFloor);
  float limb = cosmos_limbDarken(nW, v, u_limbDarkening);
  vec3 rim = cosmos_rimGlow(nW, v, s, u_atmosphereTint, u_atmosphereStrength);

  vec3 colorLit = surface * lit;

  // Tidal-heating emissive on binary's facing hemisphere.
  #ifdef MOON_BINARY
  {
    float facing = max(0.0, n.x);
    float facingBias = pow(facing, 2.0);
    colorLit += u_emissiveColor * facingBias * u_emissiveStrength * 0.4;
  }
  #endif

  if (u_specularStrength > 0.0) {
    vec3 h = normalize(s + v);
    float spec = pow(max(0.0, dot(nW, h)), 24.0);
    colorLit += vec3(1.0) * spec * u_specularStrength * max(0.0, sunFacing);
  }

  colorLit += rim;
  colorLit *= limb;

  fragColor = vec4(colorLit, 1.0);
}
