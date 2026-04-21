// Cosmos Explorer — binary-star overlay fragment shader (T41).
//
// Doc references:
//   - Doc 17 §ENT-1036 (Eclipsing Binary), §ENT-1037 (Cataclysmic Variable).
//   - Doc 22 §Stars — "Binary" toggle group.
//   - Doc 18 §Stellar Evolution: Roche-lobe visualisation rationale.
//
// This is an *overlay* shader rendered with additive blending on a
// bounding volume enclosing both binary components. It paints:
//   • A crude Roche-equipotential contour (u_lobeStrength → full common
//     envelope).
//   • A mass-transfer stream: a narrow, warped-FBM-modulated bright
//     thread along the line connecting the two bodies.
//
// The renderer that instantiates this material owns the geometry (usually
// a larger enclosing sphere or box); this shader contains no opaque
// photosphere and does NOT write to gl_FragDepth (transparent overlay per
// CLAUDE.md Rule #6).

#include "lib/noise.glsl"

// ---- geometry uniforms (mesh-local coordinates) ---------------------------

// @param u_primaryCenter   — mesh-local centre of the primary star.
uniform vec3  u_primaryCenter;
// @param u_secondaryCenter — mesh-local centre of the secondary star.
uniform vec3  u_secondaryCenter;
// @param u_primaryRadius   — primary photosphere radius in the same units.
uniform float u_primaryRadius;
// @param u_secondaryRadius — secondary photosphere radius.
uniform float u_secondaryRadius;
// @param u_lobeStrength    — 0 (no envelope), 1 (full common envelope).
uniform float u_lobeStrength;
// @param u_massTransferRate — brightness of the donor→accretor stream.
uniform float u_massTransferRate;

// ---- palette uniforms -----------------------------------------------------

// @param u_streamColor         — Doc 22 "mass-transfer stream" tint (#FFAA33 default).
uniform vec3  u_streamColor;
// @param u_commonEnvelopeColor — Doc 22 "Roche lobe shading" tint.
uniform vec3  u_commonEnvelopeColor;

// @param u_time — seconds since scene start.
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_surfaceNormal;  // unused by the overlay but present in shared vert.
in vec3 v_normalW;        // unused
in vec3 v_viewDirW;       // unused
in vec3 v_worldPos;       // unused

out vec4 fragColor;

// ---------------------------------------------------------------------------
// Roche-like iso-potential: Φ(p) ≈ m1/|p−p1| + m2/|p−p2|. We take
// primaryRadius^2 and secondaryRadius^2 as effective "mass" proxies so the
// isophote shape scales like the real Roche equipotential.
// ---------------------------------------------------------------------------
float rochePotential(vec3 p) {
  float d1 = max(0.01, length(p - u_primaryCenter));
  float d2 = max(0.01, length(p - u_secondaryCenter));
  float m1 = u_primaryRadius * u_primaryRadius;
  float m2 = u_secondaryRadius * u_secondaryRadius;
  return m1 / d1 + m2 / d2;
}

// ---------------------------------------------------------------------------
// Distance from the point to the line segment between the two centres.
// Used to paint the mass-transfer stream as a thin bright thread.
// ---------------------------------------------------------------------------
float distanceToAxis(vec3 p) {
  vec3 ab = u_secondaryCenter - u_primaryCenter;
  float abLen2 = max(1e-6, dot(ab, ab));
  float t = clamp(dot(p - u_primaryCenter, ab) / abLen2, 0.0, 1.0);
  vec3 proj = u_primaryCenter + ab * t;
  return length(p - proj);
}

void main() {
  // Mesh-local position.
  vec3 p = v_modelPos;

  // ---- Roche equipotential contour ----------------------------------------
  float phi = rochePotential(p);
  // Critical potential estimate: sum of masses / separation distance.
  float sep = max(0.001, length(u_secondaryCenter - u_primaryCenter));
  float phiCrit = (u_primaryRadius * u_primaryRadius
                  + u_secondaryRadius * u_secondaryRadius) / sep;

  // Thin iso-contour band just outside phiCrit — widens as u_lobeStrength
  // increases, until at 1.0 it spans a full common envelope.
  float band = smoothstep(phiCrit * 1.05, phiCrit * 0.95, phi)
             * smoothstep(phiCrit * 0.6,  phiCrit * 0.95, phi);
  float envelope = band * u_lobeStrength;

  // ---- Mass-transfer stream -----------------------------------------------
  float axisDist = distanceToAxis(p);
  float streamWidth = max(u_primaryRadius, u_secondaryRadius) * 0.18;
  float streamMask = smoothstep(streamWidth, 0.0, axisDist);

  // Warped FBM along the axis so the stream looks turbulent.
  float turbulence = cosmos_warpedFbm(p * 2.0 + vec3(u_time * 0.3), 3);
  float streamIntensity = streamMask * (0.4 + 0.6 * turbulence)
                        * u_massTransferRate;

  // ---- Combined overlay colour + alpha ------------------------------------
  vec3 color = u_commonEnvelopeColor * envelope * 0.7
             + u_streamColor          * streamIntensity;
  float alpha = clamp(envelope * 0.5 + streamIntensity, 0.0, 1.0);

  // Additive-friendly output: RGB premultiplied (already scaled by alpha in
  // the way typical additive chains expect), alpha for depth/weighting only.
  fragColor = vec4(color, alpha);
}
