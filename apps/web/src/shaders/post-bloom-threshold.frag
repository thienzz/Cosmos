// Cosmos Explorer — bloom threshold pass (T30, Doc 18 §3.5 UnrealBloomPass).
//
// Reads the HDR scene linear colour and writes only the portion above the
// luminance threshold. Uses a soft knee so faint bright features still
// contribute instead of clamping hard at the threshold (matches the
// "UnrealBloomPass" reference feel Doc 18 §3.5 calls out).

precision highp float;

uniform sampler2D u_scene;
uniform float     u_threshold;   // Doc 18 §3.5: 0.8
uniform float     u_softKnee;    // width of the soft-knee transition (0..1)

in vec2 v_uv;
out vec4 fragColor;

float cosmos_luma(vec3 c) {
  // Rec.709 luma — standard bloom luminance basis.
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec3 sceneColor = texture(u_scene, v_uv).rgb;
  float lum = cosmos_luma(sceneColor);

  // Soft-knee mask (Doc 18 §3.5 "Threshold 0.8"): fade in around the
  // threshold so bright edges of stars don't pop in all at once.
  float knee = max(u_softKnee, 1e-4);
  float soft = clamp((lum - u_threshold + knee) / (2.0 * knee), 0.0, 1.0);
  soft = soft * soft * (3.0 - 2.0 * soft); // smoothstep
  float mask = soft * smoothstep(u_threshold - knee, u_threshold + knee, lum);

  fragColor = vec4(sceneColor * mask, 1.0);
}
