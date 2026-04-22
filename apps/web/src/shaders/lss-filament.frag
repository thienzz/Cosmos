// Cosmos Explorer — Cosmic-web filament shader (T-V-29).
//
// Doc 18 §Large-Scale Structures. Renders ENT-7030 cosmic filaments as
// elongated tube/ribbon meshes. CPU provides `uv.x` along-filament (0..1)
// and `uv.y` cross-filament (-0.5..0.5). Shader applies a density taper
// (brighter at knot junctions), hot-colour ramp (cooler in voids), and
// per-segment grain suggesting embedded galaxies.

in vec2 v_uv;
in float v_worldDepth;
in float v_density;       // optional per-vertex density; CPU may set via attribute

uniform float u_time;
uniform float u_shapeSeed;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
#endif

float hash1(float x) {
  return fract(sin(x * 12.9898 + u_shapeSeed) * 43758.5453);
}

void main() {
  float u = v_uv.x;
  float v = v_uv.y;

  float crossDensity = exp(-v * v * 18.0);
  float alongDensity = 0.5 + 0.5 * cos(u * 6.2831 * 3.0);  // knot bumps
  float density = crossDensity * mix(0.4, 1.0, alongDensity);

  // Per-segment galaxy specks.
  float seg = floor(u * 80.0);
  float galaxy = step(0.94, hash1(seg)) * exp(-v * v * 40.0);

  vec3 cool = vec3(0.25, 0.35, 0.6);
  vec3 warm = vec3(0.9, 0.75, 0.5);
  vec3 col = mix(cool, warm, alongDensity) * density + vec3(galaxy) * 1.2;

  float alpha = clamp(density * 0.6 + galaxy, 0.0, 0.9);
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(v_worldDepth) * logDepthBufFC * 0.5;
  #endif
}
