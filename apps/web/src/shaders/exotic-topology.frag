// Cosmos Explorer — cosmic string shader (T48.1, ENT-8017).
//
// Doc 17 §ENT-8017 + Doc 18 §Exotic Objects (T48.0) §Topology.
//
// Renders a 1D topological defect running along the Y axis of the unit cube.
// Since a true string has Planck-scale width, we glow it to a visible radius
// (`u_stringRadius`) via a Gaussian on the cylindrical ρ. Two dim "ghost"
// copies at ±`u_lensingOffset` stand in for the double-image lensing
// signature without requiring a full screen-space pass.
//
// CLAUDE.md Rule #1: fully procedural.

#include "lib/noise.glsl"
#include "lib/volumetric.glsl"

uniform vec3  u_stringColor;
uniform vec3  u_ghostColor;

uniform float u_stringRadius;
uniform float u_stringIntensity;
uniform float u_waveAmp;
uniform float u_waveFreq;
uniform float u_waveSpeed;
uniform float u_lensingOffset;
uniform float u_ghostIntensity;
uniform float u_time;

in vec3 v_modelPos;
in vec3 v_rayOriginLocal;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  uniform float logDepthBufFC;
  in float vFragDepth;
#endif

out vec4 fragColor;

#ifndef EXOTIC_STEPS
  #define EXOTIC_STEPS 32
#endif

// Distance in the XZ plane from a vertical string displaced by (dx, 0, 0).
float stringDist(vec3 p, float dx) {
  // Gentle undulation — cosmic strings oscillate with transverse waves.
  float displace = u_waveAmp * sin(p.y * u_waveFreq + u_time * u_waveSpeed);
  float x = p.x - dx - displace;
  return sqrt(x * x + p.z * p.z);
}

vec3 stringEmission(vec3 p) {
  float d = stringDist(p, 0.0);
  float core = exp(-pow(d / max(u_stringRadius, 1e-4), 2.0));
  return u_stringColor * core * u_stringIntensity;
}

vec3 ghostEmission(vec3 p) {
  float dL = stringDist(p, -u_lensingOffset);
  float dR = stringDist(p, +u_lensingOffset);
  float gL = exp(-pow(dL / max(u_stringRadius * 1.2, 1e-4), 2.0));
  float gR = exp(-pow(dR / max(u_stringRadius * 1.2, 1e-4), 2.0));
  return u_ghostColor * (gL + gR) * u_ghostIntensity * 0.5;
}

void main() {
  vec3 rayDir = normalize(v_modelPos - v_rayOriginLocal);
  vec2 hit = cosmos_rayAabb(v_rayOriginLocal, rayDir, vec3(-1.0), vec3(1.0));
  float tNear = max(hit.x, 0.0);
  float tFar  = hit.y;
  if (tFar <= tNear) discard;

  float stepSize = (tFar - tNear) / float(EXOTIC_STEPS);
  vec3 accumColor = vec3(0.0);
  float accumAlpha = 0.0;
  float t = tNear + stepSize * 0.5;

  for (int i = 0; i < EXOTIC_STEPS; i++) {
    vec3 p = v_rayOriginLocal + rayDir * t;
    if (any(greaterThan(abs(p), vec3(1.001)))) break;

    vec3 emission = stringEmission(p) + ghostEmission(p);
    float intensity = max(max(emission.r, emission.g), emission.b);
    if (intensity > 0.003) {
      float sampleAlpha = clamp(intensity, 0.0, 1.0) * stepSize * 0.9;
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
