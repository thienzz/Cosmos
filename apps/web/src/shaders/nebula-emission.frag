// Cosmos Explorer — emission nebula (H II region) fragment shader.
//
// Doc 18 §Emission Nebula — dense volumetric raymarching with multi-line
// emission. Each sample is classified by fbm-derived density into Hα / OIII
// / SII / NII contributions (cf. Hubble narrowband palette, Doc 18
// §Color Mapping). Embedded young-star illumination is baked into the
// density's self-emission — no per-sample lighting lookups, so the shader
// stays cheap at 64 steps.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_haColor;        // H-alpha 656.3 nm  (Doc 18 #FF4444)
uniform vec3  u_oiiiColor;      // [OIII] 500.7 nm   (Doc 18 #00CED1)
uniform vec3  u_siiColor;       // [SII]  671.6 nm   (Doc 18 #8B0000)
uniform vec3  u_niiColor;       // [NII]  658.4 nm   (Doc 22 ENT-5010 #FF7F4A)

// ---- volumetric parameters ------------------------------------------------
uniform float u_fbmScale;
uniform float u_density;
uniform float u_emissionBoost;
uniform float u_falloff;
uniform float u_turbulenceRate;
uniform float u_time;
// Variant tint — 0 giant HII (default), 1 ultracompact HII, 2 HI region.
// Only changes the per-line mix ratios below; shader complexity stays flat.
uniform float u_variant;

// ---- Doc 22 ENT-5010 toggle uniforms -------------------------------------
// 26 named toggles. Defaults set per Doc 22 `defaultOn` in NebulaMaterial.
uniform float u_hAlphaGlow;
uniform float u_oIIIEmission;
uniform float u_nIIEmission;
uniform float u_sIIEmission;
uniform float u_heIIEmission;
uniform float u_stromgrenBoundary;
uniform float u_densityWaves;
uniform float u_filaments;
uniform float u_gasFingers;
uniform float u_bubbles;
uniform float u_velocityShear;
uniform float u_pillars;
uniform float u_dustLanes;
uniform float u_bokGlobules;
uniform float u_dustHalo;
uniform float u_pAHEmission;
uniform float u_bowShocks;
uniform float u_shockRims;
uniform float u_hHObjects;
uniform float u_turbulence;
uniform float u_starCores;
uniform float u_embeddedProtostars;
uniform float u_stellarWinds;
uniform float u_falseColor;
uniform float u_dopplerTint;
uniform float u_ionizationFront;
uniform float u_neutralHalo;
uniform float u_molecularEnvelope;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

// Step count is a compile-time constant so the loop can unroll. Quality
// tiers are plumbed via `#define NEBULA_STEPS_{LOW,MID,HIGH}` at material
// build time. Default mid budget keeps 5 nebulae within the 500-draw-call
// frame target.
#ifndef NEBULA_STEPS
  #define NEBULA_STEPS 64
#endif

// Sample the procedural density inside the unit cube. Range ≈ [0, 1];
// radial falloff enforces zero at the AABB faces so the volume fades into
// empty space without a seam.
float sampleDensity(vec3 p) {
  vec3 q = p * u_fbmScale;
  // Optional velocity-field shear — warps coordinates for subtle time-varying twist.
  q += vec3(sin(p.y * 3.0 + u_time * 0.1),
            cos(p.z * 3.0 + u_time * 0.1),
            sin(p.x * 3.0 + u_time * 0.1)) * 0.15 * u_velocityShear;
  // Slow turbulence — domain-shifted fbm so the nebula evolves on a
  // simulated-time scale of hours.
  float warp = cosmos_warpedFbm(q + vec3(u_time * u_turbulenceRate), 5);
  // Additional turbulence cascade (fine-scale)
  float tCascade = cosmos_fbm(q * 4.0, 3);
  warp += (tCascade - 0.5) * 0.20 * u_turbulence;
  // Density wave ripples — spiral undulation.
  float wavePhase = sin(length(p.xz) * 8.0 - atan(p.z, p.x) * 2.0 + u_time * 0.08);
  warp += wavePhase * 0.08 * u_densityWaves;
  // Gas finger protrusions — elongated radial ridges.
  float rD = length(p);
  float fingerPhase = 0.5 + 0.5 * sin(atan(p.z, p.x) * 8.0 + p.y * 5.0);
  warp += fingerPhase * smoothstep(0.7, 1.0, rD) * 0.15 * u_gasFingers;
  // Micro-cavities — subtractive density holes.
  float cavH = cosmos_hash31(floor(p * 8.0));
  warp -= step(0.92, cavH) * 0.30 * u_bubbles;
  // Bok globules — dense dark knots.
  float bokH = cosmos_hash31(floor(p * 12.0));
  warp -= step(0.90, bokH) * 0.35 * u_bokGlobules;
  // Pillar structures — dense vertical columns in lower hemisphere.
  float pillarMask = step(0.88, cosmos_hash31(vec3(floor(p.x * 4.0),
                                                   floor((p.y + 1.0) * 2.0),
                                                   floor(p.z * 4.0))))
                   * smoothstep(-0.2, 0.8, p.y);
  warp *= 1.0 + pillarMask * 0.4 * u_pillars;
  // Dust lane extinction — subtractive FBM.
  float dustEx = cosmos_fbm(q * 0.8 + vec3(3.0), 2);
  warp *= 1.0 - smoothstep(0.55, 0.85, dustEx) * 0.6 * u_dustLanes;
  float envelope = cosmos_radialFalloff(p, 1.0, u_falloff);
  return clamp(warp * envelope, 0.0, 1.0);
}

// Map density → emission colour per the Hubble narrowband palette. High
// density → Hα (dense ionized hydrogen), mid → OIII near hot stars, low
// → SII/NII shock edges. We blend contiguously so no banding shows up.
vec3 sampleEmission(float d) {
  // Three weighted Gaussians — one peak per emission line — so the
  // transitions are smooth, not step functions.
  float wHa   = exp(-pow((d - 0.80) * 4.0, 2.0));
  float wOiii = exp(-pow((d - 0.50) * 4.5, 2.0));
  float wSii  = exp(-pow((d - 0.30) * 5.0, 2.0));
  float wNii  = exp(-pow((d - 0.15) * 6.0, 2.0));

  // Variant-specific line mix (Doc 17 §5010..5012).
  //   variant 0 — Giant HII: all lines active (Orion / Eagle).
  //   variant 1 — Ultracompact: stronger Hα + OIII tight core, weaker wings.
  //   variant 2 — HI region: neutral → Hα only, no OIII/SII/NII emission.
  float vTight = smoothstep(0.5, 1.0, u_variant); // activates for v>=1
  float vHI    = smoothstep(1.5, 2.0, u_variant); // activates for v==2

  float mixOiii = mix(1.0, 0.35, vHI);
  float mixSii  = mix(1.0, 0.25, vHI);
  float mixNii  = mix(1.0, 0.25, vHI);
  float haBoost = mix(1.0, 1.35, vTight);

  return u_haColor   * wHa   * haBoost * u_hAlphaGlow
       + u_oiiiColor * wOiii * mixOiii * u_oIIIEmission
       + u_siiColor  * wSii  * mixSii  * u_sIIEmission
       + u_niiColor  * wNii  * mixNii  * u_nIIEmission;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(NEBULA_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;   // mid-point of first step

  for (int i = 0; i < NEBULA_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    // Clamp to the AABB so numerical drift at the far face doesn't sample
    // density outside the envelope.
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    float d = sampleDensity(p);
    if (d > 0.01) {
      vec3 emission = sampleEmission(d) * u_emissionBoost;

      // HeII ultraviolet — sparse violet-blue near dense cores.
      float heII = smoothstep(0.85, 1.0, d);
      emission += vec3(0.35, 0.498, 1.0) * heII * 0.35 * u_heIIEmission;

      // Strömgren sphere boundary — bright hot-pink edge at density gradient.
      float rSphere = length(p);
      float bd = abs(rSphere - 0.85);
      emission += vec3(1.0, 0.376, 0.502) * exp(-bd * 20.0) * 0.30 * u_stromgrenBoundary;

      // Nebular filaments — high-freq FBM additive threads.
      float fil = cosmos_fbm(p * 12.0, 4);
      emission += vec3(1.0, 0.314, 0.502) * smoothstep(0.65, 0.85, fil) * 0.40 * u_filaments;

      // Dust grain scattering halo (orange-red near dense structures).
      float haloD = smoothstep(0.15, 0.35, d) * (1.0 - smoothstep(0.5, 0.7, d));
      emission += vec3(1.0, 0.439, 0.376) * haloD * 0.18 * u_dustHalo;

      // PAH emission — yellow-orange false-color overlay on dust regions.
      float pah = cosmos_fbm(p * 1.8, 2);
      emission += vec3(1.0, 0.722, 0.314) * pah * 0.10 * u_pAHEmission;

      // Bow shock structures — curved surfaces at directional density edges.
      vec3 gradDir = normalize(p + vec3(0.001));
      float bowShock = smoothstep(0.55, 0.75, d) * max(0.0, dot(gradDir, normalize(p)));
      emission += vec3(1.0, 0.502, 0.251) * bowShock * 0.35 * u_bowShocks;

      // Shock-heated rim brightening — gradient-aware bright edges.
      float rimShock = d * (1.0 - d) * 4.0;
      emission += vec3(1.0, 0.251, 0.314) * rimShock * 0.30 * u_shockRims;

      // Herbig-Haro jet objects — bright blue directional cones.
      float hhPhase = atan(p.z, p.x) * 4.0 + p.y * 3.0;
      float hhMask = step(0.88, cosmos_hash31(floor(vec3(hhPhase, 0.0, 0.0))))
                   * smoothstep(0.3, 0.7, abs(p.y));
      emission += vec3(0.29, 0.498, 1.0) * hhMask * 0.50 * u_hHObjects;

      // Ionizing star cores — bright point light at cluster center.
      float coreG = smoothstep(0.25, 0.0, rSphere);
      emission += vec3(1.0, 0.910, 0.753) * coreG * 0.8 * u_starCores;

      // Embedded protostars — small orange knots in dense globules.
      float protoH = cosmos_hash31(floor(p * 8.0));
      emission += vec3(1.0, 0.502, 0.376) * step(0.95, protoH) * 0.60 * u_embeddedProtostars;

      // O/B star wind momentum — radial density depression tint.
      float windDep = (1.0 - smoothstep(0.0, 0.4, rSphere)) * d;
      emission += vec3(0.9) * windDep * 0.15 * u_stellarWinds;

      // False-color RGB overlay (Hα→R, OIII→G, NII→B).
      vec3 falseC = vec3(dot(emission, vec3(0.6, 0.2, 0.2)),
                         dot(emission, vec3(0.2, 0.8, 0.2)),
                         dot(emission, vec3(0.4, 0.2, 0.6)));
      emission = mix(emission, falseC, u_falseColor);

      // Doppler velocity tint — blue/red shift based on radial velocity sign.
      float vRad = dot(normalize(p), normalize(v_modelPos - v_rayOriginLocal));
      emission += mix(vec3(0.25, 0.50, 1.0), vec3(1.0, 0.50, 0.25),
                      0.5 + 0.5 * vRad) * 0.15 * u_dopplerTint;

      // Ionization front — bright discontinuity at density edge.
      float iFront = smoothstep(0.90, 0.95, 1.0 - abs(rSphere - 0.80));
      emission *= 1.0 + iFront * 0.50 * u_ionizationFront;

      // Neutral H halo — warm tint at outer low-density envelope.
      float neutral = smoothstep(0.0, 0.15, d) * smoothstep(0.95, 1.0, rSphere);
      emission += vec3(0.8, 0.6, 0.4) * neutral * 0.15 * u_neutralHalo;

      // Molecular cloud envelope — faint brown halo.
      float molE = smoothstep(0.92, 0.98, rSphere) * (1.0 - d);
      emission += vec3(0.8, 0.376, 0.251) * molE * 0.08 * u_molecularEnvelope;

      float sampleAlpha = d * u_density * stepSize;
      // Front-to-back compositing — (1 - αacc) weights new contributions
      // against already-opaque path.
      accumColor += (1.0 - accumAlpha) * emission * sampleAlpha;
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
