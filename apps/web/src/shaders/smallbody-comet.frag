// T44 — Named comet composite fragment shader. Doc 17 §4020..4023,
// Doc 18 §Comets, Doc 22 §10.
//
// Three.js injects `#version 300 es` and the precision qualifier when
// `glslVersion: THREE.GLSL3` is set — do NOT redeclare them here.
//
// Each of the four components (nucleus, dust tail, ion tail, coma halo)
// is rendered as a separate draw with its own `u_component` uniform.
// This shader selects the appropriate palette + falloff for whichever
// component is active, so the CPU side keeps the material setup simple.

in vec2 v_tailCoord;
flat in int v_component;
in float v_activity;

uniform vec3 u_nucleusColour;
uniform vec3 u_dustColour;
uniform vec3 u_ionColour;
uniform vec3 u_comaColour;

out vec4 fragColor;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

void main() {
  vec2 uv = v_tailCoord;

  if (v_component == 0) {
    vec2 centred = uv - vec2(0.5);
    float r2 = dot(centred, centred);
    if (r2 > 0.25) discard;
    float alpha = smoothstep(0.25, 0.05, r2);
    fragColor = vec4(u_nucleusColour, alpha);
    return;
  }

  if (v_component == 1) {
    float along = uv.x;
    float across = uv.y * 2.0 - 1.0;
    float widthAlpha = exp(-across * across * 4.0);
    float lengthAlpha = (1.0 - along) * (0.35 + v_activity * 0.65);
    float striae = step(0.3, hash11(along * 80.0)) * 0.2;
    vec3 col = mix(u_dustColour, u_dustColour * 0.55, along) * (1.0 - striae);
    float alpha = widthAlpha * lengthAlpha;
    if (alpha < 0.002) discard;
    fragColor = vec4(col, alpha);
    return;
  }

  if (v_component == 2) {
    float along = uv.x;
    float across = uv.y * 2.0 - 1.0;
    float widthAlpha = exp(-across * across * 12.0);
    float lengthAlpha = (1.0 - along * 0.8) * (0.4 + v_activity * 0.6);
    vec3 col = u_ionColour * (1.0 + 0.3 * (1.0 - along));
    float alpha = widthAlpha * lengthAlpha;
    if (alpha < 0.002) discard;
    fragColor = vec4(col, alpha);
    return;
  }

  vec2 centred = uv - vec2(0.5);
  float r = length(centred);
  if (r > 0.5) discard;
  float alpha = pow(1.0 - (r / 0.5), 2.2) * (0.25 + 0.35 * v_activity);
  vec3 col = u_comaColour;
  fragColor = vec4(col, alpha);
}
