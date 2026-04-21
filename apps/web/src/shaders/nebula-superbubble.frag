// Cosmos Explorer — superbubble fragment shader.
//
// Doc 17 §ENT-5080 — enormous low-density cavities (50–500 pc) carved by
// multiple SNe + OB-association winds. Visually they're *large and faint*:
//   - A thin bright shell of swept-up ISM (compressed Hα + OIII).
//   - A near-empty hot interior (X-ray optically; we render a faint blue
//     false-colour contribution so the bubble reads as hollow-but-glowing).
//   - Optional blowouts — holes in the shell where older bubbles vented
//     hot gas into the galactic halo. Implemented as a directional fade
//     along +Y so the rendering has a recognisable chimney silhouette.
//
// CLAUDE.md Rule #1: fully procedural, no textures.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

// ---- palette --------------------------------------------------------------
uniform vec3  u_shellHaColor;       // shell Hα (Doc 17 #FF4444)
uniform vec3  u_shellOiiiColor;     // shell OIII (Doc 17 #00FF88)
uniform vec3  u_interiorColor;      // faint blue interior false-colour

// ---- geometry -------------------------------------------------------------
uniform float u_shellRadius;
uniform float u_shellThickness;
uniform float u_interiorDensity;
uniform float u_filamentStrength;
uniform float u_shellBrightness;
uniform float u_interiorBrightness;
uniform float u_blowout;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef NEBULA_STEPS
  #define NEBULA_STEPS 64
#endif

const vec3 BLOWOUT_AXIS = vec3(0.0, 1.0, 0.0);

float shellGauss(float r) {
  float d = (r - u_shellRadius) / max(u_shellThickness, 1e-4);
  return exp(-d * d);
}

float sampleBubble(vec3 p, out float shellW, out float interiorW) {
  float r = length(p);
  // Shell.
  float shell = shellGauss(r);
  // Blowout — directional fade removing a polar cap so the shell has a hole.
  float cosLat = dot(normalize(p + 1e-6), BLOWOUT_AXIS);
  float hole = smoothstep(0.5, 0.92, cosLat) * u_blowout;
  shell *= max(0.0, 1.0 - hole);

  // Filament substructure — sparse low-octave fbm (Doc 17: ancient, smooth).
  float fil = 0.5 + 0.5 * cosmos_fbm(p * 1.4, 4);
  float filaments = mix(1.0, fil, u_filamentStrength);
  shell *= filaments;

  // Interior low-density hot plasma.
  float interior = step(r, u_shellRadius * 0.95) * u_interiorDensity;
  // Centre fades smoothly toward zero so it doesn't read as a bright ball.
  interior *= smoothstep(0.0, u_shellRadius * 0.8, r);

  shellW = shell;
  interiorW = interior;
  return shell + interior;
}

vec3 bubbleEmission(float shell, float interior) {
  float shellFraction = clamp(shell / max(u_shellBrightness, 1e-4), 0.0, 1.0);
  // Shell colour: mostly Hα with a cooler OIII tint at the outer edge.
  vec3 shellColor = mix(u_shellHaColor, u_shellOiiiColor, 0.3 * shellFraction);
  vec3 shellEmission = shellColor * shell * u_shellBrightness;

  // Interior: dim blue false-colour so the cavity reads as "hollow but
  // glowing" rather than completely black.
  vec3 interiorEmission = u_interiorColor * interior * u_interiorBrightness;

  return shellEmission + interiorEmission;
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
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < NEBULA_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    float shell = 0.0;
    float interior = 0.0;
    float density = sampleBubble(p, shell, interior);

    if (density > 0.005) {
      vec3 emission = bubbleEmission(shell, interior);
      float sampleAlpha = clamp(density, 0.0, 1.0) * stepSize * 0.55;
      accumColor += (1.0 - accumAlpha) * emission * stepSize;
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
