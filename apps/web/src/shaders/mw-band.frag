// Cosmos Explorer — Milky Way interior view band (T46a ENT-6010 inside).
//
// Doc 17 §ENT-6010 (MW spiral, SBbc) + Doc 19 §S2-S3 (Milky Way band visible)
// + Doc 24 §Night Sky View. Renders the MW as seen from inside — the glowing
// band arcing across the night sky — on a large inside-out billboard sphere
// at `BackSide` winding. Camera sits near origin; the sphere is effectively
// at infinity, so only the view direction matters.
//
// The band is a latitude-dependent emissive field in Galactic coordinates:
//   • Latitude b:   exp(-b² / σ²) gaussian biased to the galactic plane.
//   • Longitude ℓ:  broad Gaussian centred on Sagittarius A* (ℓ=0°) for the
//                   Galactic Centre bulge hint; secondary ridge around the
//                   anticentre (ℓ=180°) for the Perseus arm side.
//   • FBM:          2-octave noise in Galactic-Cartesian direction adds the
//                   dust-cloud / HII patchy structure.
//   • Dust-lane:    subtractive FBM ridge along b=0 with a sharper vertical
//                   gaussian — the Great Rift, Coalsack, Aquila Rift appear
//                   as darker absorption lanes bisecting the band.
//
// The shader is fully procedural (CLAUDE.md Rule #1). The SFD dust-extinction
// texture exception noted in CLAUDE.md is currently *unused* — the dust
// structure here is procedural fbm biased toward a handful of seeded
// absorption hotspots that approximate Great Rift / Coalsack / Aquila. A
// future asset swap can replace the procedural dust term with a 2D sampler
// at minimal cost (uniform u_dustMap + texture lookup in `dustExtinction`).

#include "lib/noise.glsl"

uniform vec3  u_bandColor;        // Doc 22 MW diffuse — warm cream
uniform vec3  u_bulgeColor;       // Doc 22 MW core glow — gold
uniform vec3  u_dustColor;        // Doc 22 #14 dust brown-black
uniform float u_bandIntensity;    // Overall MW band brightness (0..2)
uniform float u_bulgeIntensity;   // Galactic Centre bulge multiplier
uniform float u_dustStrength;     // Great Rift / Coalsack absorption depth
uniform float u_dissolve;         // 1 = fully visible, 0 = crossfade to external
uniform float u_time;             // animation (very slow breathing)
uniform mat3  u_viewToGalactic;   // world-space dir → galactic (l,b) cart basis

in vec3 v_pos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

// Gaussian centred on 0 with spread sigma.
float gauss(float x, float sigma) {
  float s = x / max(sigma, 1e-4);
  return exp(-s * s);
}

// Procedural absorption hotspots approximating real dust complexes.
//
// Returns 0..1 opacity of a foreground dust cloud at Galactic (l, b) in
// radians. The "real" implementation will swap this for a 2D SFD dust-map
// sampler — see CLAUDE.md Rule #1 texture exception for T46a.
//
// Coordinates in radians (l∈[-π,π], b∈[-π/2,π/2]):
//   Great Rift:   ℓ ≈ [0°, 60°],  b ≈ 0°, long north-south ridge.
//   Coalsack:     ℓ ≈ 303°, b ≈ 0°  (so ≈ -57° wrapped).
//   Aquila Rift:  ℓ ≈ 30°,  b ≈ 0°.
//   Pipe Nebula:  ℓ ≈ 358°, b ≈ 4°.
float dustHotspots(float l, float b) {
  float rift = gauss(l - 0.52, 0.55) * gauss(b, 0.06) * 0.85;      // Great Rift ~30°
  rift      += gauss(l - 0.00, 0.35) * gauss(b - 0.02, 0.05) * 0.6; // Aquila/zenith side
  float coal = gauss(mod(l + 3.14159, 6.28318) - 3.14159 - (-0.99), 0.18)
             * gauss(b + 0.02, 0.07) * 0.7;                         // Coalsack ~303°
  float pipe = gauss(l + 0.035, 0.12) * gauss(b - 0.07, 0.05) * 0.45;
  return clamp(rift + coal + pipe, 0.0, 1.0);
}

// Map a view direction (unit vector) into galactic direction, then spherical
// (l, b). The supplied u_viewToGalactic transforms from world-space rotation
// into the galactic-aligned frame: x toward Galactic Centre, z toward North
// Galactic Pole (right-handed).
vec2 galacticLB(vec3 worldDir) {
  vec3 g = normalize(u_viewToGalactic * worldDir);
  // latitude b from z component, longitude l from atan2(y, x).
  float b = asin(clamp(g.z, -1.0, 1.0));
  float l = atan(g.y, g.x);
  return vec2(l, b);
}

void main() {
  vec3 dir = normalize(v_pos);
  vec2 lb = galacticLB(dir);
  float l = lb.x;
  float b = lb.y;

  // 1. Latitude envelope — the band itself. σ ≈ 8° in radians ≈ 0.14.
  float bandLat = gauss(b, 0.14);

  // 2. Longitude modulation — Sagittarius (l=0) strongest, anticentre (l=±π)
  //    secondary. Use a pair of Gaussians (wrapped by cosine).
  float lWrap = mod(l + 3.14159265, 6.2831853) - 3.14159265;
  float bulge = gauss(lWrap, 0.45);
  float arc   = 0.55 + 0.45 * (0.5 + 0.5 * cos(lWrap));  // bias front hemisphere

  // 3. FBM patchiness. Sample in galactic Cartesian coords so the clouds
  //    maintain orientation relative to the galactic plane rather than the
  //    viewer.
  vec3 gDir = normalize(u_viewToGalactic * dir);
  float patchy = cosmos_fbm(gDir * 3.2 + vec3(0.0, 0.0, u_time * 0.004), 3);
  patchy = 0.65 + 0.7 * patchy;   // lift into 0.65..1.35

  // 4. Emissive MW term.
  vec3 mwCol  = u_bandColor * arc;
  mwCol      += u_bulgeColor * bulge * u_bulgeIntensity;
  float mwLum = bandLat * arc * patchy * u_bandIntensity;

  // 5. Dust absorption. Combines a thin-disc fbm ridge with hand-seeded
  //    hotspots for Great Rift / Coalsack / Aquila.
  float dustBand = gauss(b, 0.05);
  float dustFbm  = cosmos_fbm(gDir * 6.5, 4);
  float dust     = dustBand * (0.3 + 0.8 * dustFbm) + dustHotspots(l, b);
  dust           = clamp(dust * u_dustStrength, 0.0, 0.95);

  // 6. Apply absorption: mix toward dust colour + attenuate luminance.
  vec3 col = mwCol * mwLum;
  col = mix(col, u_dustColor * mwLum * 0.15, dust);
  col *= (1.0 - dust * 0.75);

  // 7. Dissolve to zero over the Stellar→Galactic hysteresis band (CPU feeds
  //    u_dissolve from a smoothstep over distance-to-Sun). Premultiplied
  //    alpha keeps additive blending clean when composited over the starfield.
  float alpha = clamp(mwLum, 0.0, 1.0) * u_dissolve;
  fragColor = vec4(col * u_dissolve, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
