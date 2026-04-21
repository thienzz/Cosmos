// Cosmos Explorer — Saturn ring fragment shader (Doc 18 §Saturn — Rings).
//
// Renders the Saturn ring system as a flat annulus with four radial bands:
//   C Ring (inner, faint)  — r ∈ [r_C_in,  r_C_out]
//   B Ring (dense)         — r ∈ [r_B_in,  r_B_out]
//   Cassini Division       — r ∈ [r_B_out, r_A_in]    (discarded)
//   A Ring (outer)         — r ∈ [r_A_in,  r_A_out]
//
// Doc 18 quotes the absolute km radii; we pass them through as `planet-radius`
// multiples so the same shader works at any scale. The Encke gap inside the
// A ring shows as a thin dark line. Forward scattering brightens the rings
// when viewed against the sun (Cassini's iconic shot). Planet shadow
// darkens fragments that fall inside the parent's silhouette.
//
// CLAUDE.md Rule #1: procedural. fbm modulates particle density across the
// ring sheet.

#include "lib/noise.glsl"

uniform float u_time;
uniform vec3  u_sunDir;
uniform vec3  u_planetPosW;         // world-space parent position
uniform float u_planetRadiusW;      // world-space parent radius

// Ring band radii in PARENT-RADIUS UNITS.
uniform float u_innerC;             // 1.24 (74,500 km / 60,268 km)
uniform float u_outerC;             // 1.53
uniform float u_innerB;             // 1.53
uniform float u_outerB;             // 1.95
uniform float u_innerA;             // 2.03 (after Cassini Division)
uniform float u_outerA;             // 2.27
uniform float u_enckeGapCenter;     // 2.22
uniform float u_enckeGapWidth;      // 0.01

uniform vec3  u_colorC;
uniform vec3  u_colorB;
uniform vec3  u_colorA;
uniform float u_opacityScale;

in vec2 v_ringLocal;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;
in vec3 v_modelPos;

// Log-depth input — even though the ring is transparent and doesn't write
// depth, its fragment depth must share the encoding of opaque writers so
// depth *tests* against the planet mesh succeed.
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

void main() {
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif

  float r = length(v_ringLocal);

  // Resolve which band (or discard if we're in a gap).
  vec3  base = vec3(0.0);
  float alpha = 0.0;

  if (r >= u_innerC && r < u_outerC) {
    base  = u_colorC;
    alpha = 0.30;
  } else if (r >= u_innerB && r < u_outerB) {
    base  = u_colorB;
    alpha = 1.0;
  } else if (r >= u_innerA && r < u_outerA) {
    base  = u_colorA;
    alpha = 0.80;

    // Encke Gap: narrow dark line within A ring.
    float encke = smoothstep(u_enckeGapWidth * 0.5, 0.0,
                             abs(r - u_enckeGapCenter));
    alpha *= 1.0 - encke * 0.85;
  } else {
    discard;
  }

  // Procedural particle density variation — fbm along the annulus.
  float angle = atan(v_ringLocal.y, v_ringLocal.x);
  vec3  sampleP = vec3(cos(angle) * r, sin(angle) * r, 0.0) * 4.0;
  float density = mix(0.7, 1.1, cosmos_fbm(sampleP, 3));
  alpha *= clamp(density, 0.0, 1.0);

  // Forward scattering — rings are translucent and glow when backlit.
  vec3 v = normalize(v_viewDirW);
  vec3 s = normalize(u_sunDir);
  float forward = max(0.0, dot(v, -s));
  float scatter = mix(0.65, 1.35, pow(forward, 2.0));

  // Planet shadow — rings dim inside the sun-occluded cone behind the parent.
  // Project the ring fragment onto the sun axis; if it's on the dark side
  // and inside the planet cylinder we darken it.
  vec3  fromPlanet = v_worldPos - u_planetPosW;
  float alongSun   = dot(fromPlanet, s);
  vec3  lateral    = fromPlanet - alongSun * s;
  float cylRadius  = length(lateral);
  float inShadow   = step(cylRadius, u_planetRadiusW) * step(alongSun, 0.0);
  scatter *= mix(1.0, 0.35, inShadow);

  // Sparkle — a handful of bright specks rotating with the ring plane.
  float sparkle = pow(cosmos_valueNoise(sampleP * 20.0 + vec3(u_time * 0.2)), 24.0);
  base += sparkle * 0.8;

  fragColor = vec4(base * scatter, alpha * u_opacityScale);
}
