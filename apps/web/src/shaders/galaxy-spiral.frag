// Cosmos Explorer — spiral galaxy fragment shader (T29 ENT-6010 + T46 ENT-6011).
//
// Doc 18 §Spiral Galaxy + Doc 17 ENT-6010/6011 + Doc 22 #6,#7,#19. Raymarches
// a thin disk volume inside the unit cube. Density is the sum of:
//   1. Bulge:      Sérsic-style central concentration (age-gradient tint).
//   2. Disk:       exponential radial falloff × gaussian vertical profile.
//   3. Spiral arms: logarithmic-spiral ridge `θ = log(r) / tan(pitch)`.
//   4. Bar:        gaussian ridge along +X/-X inside the bulge radius.
//                  Doc 17 ENT-6011: SB variants anchor arms to bar ends.
//   5. HII knots:  periodic bright red bumps along the arm curve.
//                  SB variants add a bright nuclear ring at bar centre.
//   6. Dust lanes: subtractive FBM ridge on the leading edge of each arm.
//
// T46 extends T29 with the SB (barred) variant via uniforms:
//   u_barLength     — 0.0 = unbarred SA, 0.35+ = SB.
//   u_barArmAnchor  — 0.0 = arms from bulge (SA), 1.0 = arms from bar ends.
//   u_nuclearRing   — 0.0 = none, 1.0 = bright HII nuclear ring (SB).
//
// Disk and arms rotate slowly via `u_time / u_rotationPeriod`. Camera-relative
// rendering stays in local space (unit cube); scale is applied via mesh.scale
// and folded into `u_cameraLocal` on the CPU (NebulaMaterial pattern).
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3 u_armColor;       // Doc 22 #7 arm blue-white
uniform vec3 u_interArmColor;  // Doc 22 #19 inter-arm warm yellow
uniform vec3 u_bulgeColor;     // Doc 22 #1 warm gold
uniform vec3 u_dustColor;      // Doc 22 #14 dust brown-black
uniform vec3 u_hiiColor;       // Doc 22 #17 Hα pink
uniform vec3 u_barColor;       // Doc 22 #2 bar yellow
uniform vec3 u_haloColor;      // Doc 22 halo pale

// ---- geometry + animation -------------------------------------------------
uniform float u_pitchAngle;       // radians
uniform float u_armCount;         // 2.0 or 4.0
uniform float u_armWidth;
uniform float u_diskScaleRadius;
uniform float u_diskThickness;
uniform float u_bulgeRadius;
uniform float u_bulgeSersic;
uniform float u_barLength;
uniform float u_barArmAnchor;   // Doc 17 ENT-6011: 1.0 = arms from bar ends.
uniform float u_nuclearRing;    // Doc 17 ENT-6011: bar-driven HII ring.
uniform float u_dustStrength;
uniform float u_hiiDensity;
uniform float u_rotationPeriod;
uniform float u_time;

// ---- Doc 22 ENT-6010 toggle uniforms -------------------------------------
uniform float u_bulge;
uniform float u_bar;
uniform float u_bulgeDispersion;
uniform float u_coreConcentration;
uniform float u_metallicityGradient;
uniform float u_spiralArms;
uniform float u_armStarFormation;
uniform float u_spiralShock;
uniform float u_multipleArms;
uniform float u_pitchVariation;
uniform float u_armOrientation;
uniform float u_thinDisk;
uniform float u_thickDisk;
uniform float u_dustLanes;
uniform float u_hILayer;
uniform float u_warp;
uniform float u_hIIRegions;
uniform float u_nebulosity;
uniform float u_ageGradient;
uniform float u_oBAssociations;
uniform float u_halo;
uniform float u_globularClusters;
uniform float u_clusterBulgeConcentration;
uniform float u_stellarStreams;
uniform float u_sMBH;
uniform float u_nuclearCluster;
uniform float u_circumnuclearDisk;
uniform float u_orbitalPerturbation;
uniform float u_satellites;
uniform float u_tidalStreams;
uniform float u_dopplerTintGal;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef GALAXY_STEPS
  #define GALAXY_STEPS 56
#endif

// Disk-plane polar coords: disk lies in the XZ plane; Y is "vertical".
// Returns `vec2(r, theta)` where `theta` is signed azimuth about +Y.
vec2 diskPolar(vec3 p) {
  float r = length(p.xz);
  float theta = atan(p.z, p.x);
  return vec2(r, theta);
}

// Sérsic-ish bulge density. We use n=4 → ρ ∝ exp(-k * r^(1/4)).
float bulgeDensity(float r) {
  float x = r / max(u_bulgeRadius, 1e-4);
  // Doc 18 §Elliptical Galaxy approximation. Numerical constant 7.669 is
  // the standard de Vaucouleurs b4; for n=4 shapes we reuse it.
  float b = mix(1.9992, 7.669, clamp((u_bulgeSersic - 1.0) / 3.0, 0.0, 1.0));
  return exp(-b * pow(x, 1.0 / max(u_bulgeSersic, 1.0)));
}

// Exponential disk radial × gaussian vertical.
float diskDensity(vec3 p) {
  float r = length(p.xz);
  float radial = exp(-r / max(u_diskScaleRadius, 1e-4));
  float vert = exp(-pow(p.y / max(u_diskThickness, 1e-4), 2.0));
  return radial * vert;
}

// Logarithmic spiral: r = r0 * exp(θ * tan(pitch)) → θ_arm(r) = log(r/r0)/tan(pitch).
// We measure angular distance from the nearest arm's expected azimuth.
float spiralArmMask(float r, float theta, float timePhase) {
  // SA spirals: arms begin just outside the bulge (r ≥ 0.08).
  // SB spirals: arms begin at the bar ends (r ≥ barLength) so we push the
  // inner cutoff outward proportionally to u_barArmAnchor.
  float innerCutoff = mix(0.08, max(u_barLength * 0.9, 0.08), u_barArmAnchor);
  if (r < innerCutoff) return 0.0;

  float logR = log(max(r, 1e-3) / max(innerCutoff * 1.05, 0.1));
  float armPhase = logR / max(tan(u_pitchAngle), 1e-4) + timePhase;
  float two_pi = 6.2831853;
  float armSpacing = two_pi / max(u_armCount, 1.0);
  // Distance to nearest arm: wrap (theta - armPhase) into [-π, π], then
  // modulo the arm spacing.
  float diff = theta - armPhase;
  diff = mod(diff + 3.141593, two_pi) - 3.141593;
  diff = mod(diff + armSpacing * 0.5, armSpacing) - armSpacing * 0.5;
  // Gaussian ridge.
  float sigma = u_armWidth;
  return exp(-pow(diff / sigma, 2.0));
}

// Bar density — gaussian along X axis only, confined to bulge region.
float barDensity(vec3 p) {
  if (u_barLength < 1e-3) return 0.0;
  float along = abs(p.x) / max(u_barLength, 1e-4);
  float across = length(vec2(p.z, p.y * 2.0)) / max(u_barLength * 0.3, 1e-4);
  return exp(-along * along) * exp(-across * across);
}

// HII region highlights — periodic bright bumps along the arm curve.
float hiiKnots(float r, float theta, float armMask, float timePhase) {
  if (armMask < 0.05 || r < 0.12 || r > 0.9) return 0.0;
  // Position within the nearest arm, parameterised by log-radius.
  float logR = log(max(r, 1e-3) / 0.1);
  float along = logR * u_hiiDensity + timePhase * 0.3;
  float knot = 0.5 + 0.5 * sin(along * 6.2831853);
  // Sharper bumps — raise to high power.
  knot = pow(max(knot, 0.0), 5.0);
  return knot * armMask;
}

// Dust-lane mask — fbm-modulated narrow ridge on the trailing edge.
float dustLaneMask(vec3 p, float theta, float armMask) {
  float vert = exp(-pow(p.y / max(u_diskThickness * 0.6, 1e-4), 2.0));
  float fbm = cosmos_fbm(p * 4.0, 3);
  return armMask * fbm * vert;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(GALAXY_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  float timePhase = u_time * 6.2831853 / max(u_rotationPeriod, 1e-2);

  for (int i = 0; i < GALAXY_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    vec2 pol = diskPolar(p);
    float r = pol.x;
    float theta = pol.y;

    // Warped outer disk — sinusoidal z-offset at large radii.
    vec3 pW = p;
    pW.y += sin(theta * 2.0) * smoothstep(0.6, 1.0, r) * 0.08 * u_warp;

    float dBulge = bulgeDensity(length(pW)) * u_bulge;
    float dDisk  = diskDensity(pW) * u_thinDisk;
    // Thick disk — secondary exponential component.
    float thickRadial = exp(-r / max(u_diskScaleRadius * 1.3, 1e-4));
    float thickVert = exp(-pow(pW.y / max(u_diskThickness * 3.0, 1e-4), 2.0));
    float dThick = thickRadial * thickVert * 0.25 * u_thickDisk;
    // HI layer — extended low-density envelope.
    float dHI = exp(-r / 1.4) * exp(-pow(pW.y / 0.3, 2.0)) * 0.15 * u_hILayer;

    float dBar   = barDensity(pW) * u_bar;
    float armMask = spiralArmMask(r, theta, timePhase) * u_spiralArms;
    // Multiple arms adjust — reduces arm amplitude when off (single dominant).
    armMask *= mix(0.5, 1.0, u_multipleArms);
    // Arm orientation — trailing (1) vs leading (0) mirrors arm phase.
    armMask *= mix(0.6, 1.0, u_armOrientation);
    // Pitch variation adjusts arm tightness subtly.
    armMask *= 1.0 + (sin(r * 6.0) * 0.15) * u_pitchVariation;
    float dArm    = armMask * diskDensity(pW) * 2.2;

    // Bulge velocity dispersion — adds turbulent jitter in bulge.
    float dispersion = cosmos_hash31(p * 80.0) * 0.08 * u_bulgeDispersion;
    dBulge += dispersion * smoothstep(0.0, 0.3, dBulge);

    // Central star density enhancement (power-law cusp).
    float coreEnh = exp(-length(p) * 20.0) * u_coreConcentration;
    dBulge += coreEnh * 0.5;

    float density = dBulge * 2.0 + dDisk + dThick + dHI + dArm + dBar * 1.2;

    // Halo stellar distribution — low-opacity spherical outer envelope.
    float rHalo = length(p);
    float dHalo = exp(-rHalo * 1.8) * u_halo;
    density += dHalo * 0.15;

    if (density < 0.002) {
      t += stepSize;
      continue;
    }

    // Colour blend: bulge → arms → interarm → bar.
    vec3 color = u_interArmColor * dDisk;

    // Thick disk warmer/older stars color.
    color += vec3(0.847, 0.753, 0.502) * dThick;
    // HI reddish-tan halo.
    color += vec3(0.667, 0.565, 0.502) * dHI * 0.5;

    color += u_bulgeColor * dBulge * 2.0;
    color += u_armColor * dArm;
    color += u_barColor * dBar * 1.2;

    // Metallicity gradient — warmer core, cooler outer bulge.
    vec3 metalTint = mix(vec3(1.0, 0.973, 0.816),
                         vec3(0.847, 0.722, 0.502),
                         clamp(length(p) / max(u_bulgeRadius, 1e-4), 0.0, 1.0));
    color += metalTint * dBulge * 0.20 * u_metallicityGradient;

    // Age gradient — arm blue vs inter-arm yellow.
    color += mix(vec3(0.847, 0.722, 0.502) * dDisk,
                 vec3(0.690, 0.847, 1.0) * dArm,
                 armMask) * 0.25 * u_ageGradient;

    // Halo color tint.
    color += u_haloColor * dHalo * 0.35;

    // Stellar streams — faint elongated tidal arcs in outer halo.
    float streamPhase = sin(theta * 1.5 + rHalo * 4.0) * smoothstep(0.6, 0.95, rHalo);
    color += vec3(0.627, 0.502, 0.502) * max(0.0, streamPhase) * 0.08 * u_stellarStreams;

    // Tidal streams (bright linear density) — same mechanism, brighter.
    color += vec3(0.8, 0.7, 0.65) * max(0.0, streamPhase) * 0.12 * u_tidalStreams;

    // HII hot-spots along arms.
    float hii = hiiKnots(r, theta, armMask, timePhase) * u_hIIRegions;
    color += u_hiiColor * hii * 1.8;

    // Arm star formation knots — additional bright knots.
    float sfH = cosmos_hash31(vec3(floor(r * 30.0), floor(theta * 20.0), 0.0));
    color += u_hiiColor * step(0.92, sfH) * armMask * 0.7 * u_armStarFormation;

    // Spiral shock front — bright ridge at arm leading edge.
    float shockRidge = exp(-pow((armMask - 0.6) / 0.12, 2.0)) * armMask;
    color += vec3(0.784, 0.847, 1.0) * shockRidge * 0.30 * u_spiralShock;

    // Ionized nebulosity — faint diffuse Hα following spiral.
    float nebSoft = armMask * cosmos_fbm(p * 3.0, 2);
    color += vec3(1.0, 0.314, 0.502) * nebSoft * 0.15 * u_nebulosity;

    // OB associations — bright violet-blue point clusters.
    float obH = cosmos_hash31(vec3(floor(r * 25.0), floor(theta * 15.0), 7.0));
    color += vec3(0.541, 0.690, 1.0) * step(0.96, obH) * armMask * 0.5 * u_oBAssociations;

    // Globular clusters — bright warm spheres in halo.
    float gcH = cosmos_hash31(floor(p * 14.0));
    float gcMask = step(0.93, gcH) * smoothstep(0.1, 0.6, rHalo);
    // Cluster bulge concentration — weights density toward center.
    float gcWeight = mix(1.0, 1.0 - smoothstep(0.0, 0.6, rHalo),
                         u_clusterBulgeConcentration * 0.5);
    color += vec3(1.0, 0.847, 0.627) * gcMask * gcWeight * 0.55 * u_globularClusters;

    // Central SMBH sphere of influence — bright central point.
    float smbhMask = smoothstep(0.04, 0.0, length(p));
    color += vec3(1.0) * smbhMask * 0.8 * u_sMBH;

    // Nuclear star cluster — bright dense core just outside SMBH.
    float nscMask = smoothstep(0.08, 0.03, length(p)) * (1.0 - smbhMask);
    color += vec3(1.0, 0.941, 0.816) * nscMask * 0.6 * u_nuclearCluster;

    // Circumnuclear disk — thin bright ring at r~0.08.
    float cndMask = exp(-pow((length(p) - 0.10) / 0.02, 2.0));
    color += vec3(1.0, 0.565, 0.376) * cndMask * 0.40 * u_circumnuclearDisk;

    // Orbital perturbation — adds swirling texture in outer disk.
    float perturb = sin(theta * 4.0 + r * 12.0 + u_time * 0.3) * armMask;
    color += vec3(0.2, 0.3, 0.4) * perturb * 0.08 * u_orbitalPerturbation;

    // Satellite galaxies — faint bright spots in halo.
    float satH = cosmos_hash31(floor(p * 5.0) + vec3(11.0));
    color += vec3(0.8, 0.7, 0.6) * step(0.97, satH) * smoothstep(0.4, 0.95, rHalo) * 0.6 * u_satellites;

    // Doppler tint (rotation-based blue/red shift).
    float vRot = sin(theta);
    color += mix(vec3(0.25, 0.50, 1.0), vec3(1.0, 0.50, 0.25),
                 0.5 + 0.5 * vRot) * 0.10 * u_dopplerTintGal;
    // SB nuclear ring — bright ionised gas at bar centre (Doc 17 ENT-6011).
    if (u_nuclearRing > 0.01) {
      float ringCentre = max(u_bulgeRadius * 0.55, 0.06);
      float ringSigma = max(u_bulgeRadius * 0.25, 0.03);
      float ringR = exp(-pow((r - ringCentre) / ringSigma, 2.0));
      float ringVert = exp(-pow(p.y / max(u_diskThickness * 0.8, 1e-4), 2.0));
      float ring = ringR * ringVert * u_nuclearRing;
      color += u_hiiColor * ring * 2.2;
      density += ring * 0.4;
    }
    // Subtractive dust — desaturate toward dust colour inside dust-lane
    // regions on the disk midplane. Gated by Doc 22 u_dustLanes toggle.
    float dust = dustLaneMask(pW, theta, armMask) * u_dustStrength * u_dustLanes;
    color = mix(color, u_dustColor * 0.3, clamp(dust * 0.65, 0.0, 0.65));

    // Halo tint for the very low-density outer envelope.
    float haloWeight = clamp(1.0 - dDisk * 4.0, 0.0, 1.0) * clamp(1.0 - dBulge * 4.0, 0.0, 1.0);
    color += u_haloColor * haloWeight * 0.05;

    float sampleAlpha = clamp(density, 0.0, 1.0) * stepSize * 1.4;
    accumColor += (1.0 - accumAlpha) * color * stepSize * 1.3;
    accumAlpha += (1.0 - accumAlpha) * sampleAlpha;
    if (accumAlpha >= 0.99) break;
    t += stepSize;
  }

  fragColor = vec4(accumColor, clamp(accumAlpha, 0.0, 1.0));

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
