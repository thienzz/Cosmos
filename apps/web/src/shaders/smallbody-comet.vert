// T44 — Named comet composite (nucleus + dust tail + ion tail + coma halo)
// vertex shader. Doc 17 §ENT-4020..ENT-4023, Doc 18 §Comets, Doc 22 §10.
//
// The host-side material uses THREE.ShaderMaterial with GLSL3, so Three
// injects `#version 300 es`, precision qualifiers, and the built-in
// matrices + `position` attribute — do NOT redeclare them here.
//
// Geometry is a unit quad (for nucleus + coma) or a 16×4 ribbon (for the
// two tails); we build the world offset in-shader from `a_tailCoord`
// (uv ∈ [0,1]²) + the sun-facing frame. `u_component` selects which part
// of the composite this draw is painting.

in vec2 a_tailCoord;

uniform vec3 u_sunDirection;     // Unit vector from nucleus → Sun (scene space)
uniform float u_tailLengthScene; // Tail length in scene units at current activity
uniform float u_tailWidthScene;  // Tail half-width at base in scene units
uniform float u_nucleusRadius;   // Nucleus billboard radius in scene units
uniform float u_activity;        // [0..1] — modulates tail extent
uniform int u_component;         // 0=nucleus, 1=dust tail, 2=ion tail, 3=coma halo
uniform float u_ionCurl;         // Sinusoidal modulation on the ion tail (solar-wind kinks)

out vec2 v_tailCoord;
flat out int v_component;
out float v_activity;

void main() {
  vec2 uv = a_tailCoord;
  vec3 tailDir = -normalize(u_sunDirection);   // Anti-sunward
  vec3 up = abs(tailDir.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 perp = normalize(cross(tailDir, up));

  vec3 worldOffset = vec3(0.0);

  if (u_component == 0) {
    // Nucleus — small billboard quad facing the camera.
    worldOffset = (uv.x - 0.5) * u_nucleusRadius * 2.0 * vec3(1.0, 0.0, 0.0)
                + (uv.y - 0.5) * u_nucleusRadius * 2.0 * vec3(0.0, 1.0, 0.0);
  } else if (u_component == 1) {
    // Dust tail — curved ribbon. u is along-tail [0..1], v across [-1..1].
    float along = uv.x;
    float across = uv.y * 2.0 - 1.0;
    float curve = along * along * 0.15;
    vec3 axial = tailDir * (along * u_tailLengthScene);
    vec3 lateral = perp * (across * u_tailWidthScene * (0.35 + along * 0.9));
    vec3 curlDir = normalize(cross(tailDir, perp));
    worldOffset = axial + lateral + curlDir * (curve * u_tailLengthScene * 0.35);
  } else if (u_component == 2) {
    // Ion tail — straight anti-sunward, narrower, sinusoidal solar-wind kink.
    float along = uv.x;
    float across = uv.y * 2.0 - 1.0;
    vec3 axial = tailDir * (along * u_tailLengthScene * 1.2);
    vec3 lateral = perp * (across * u_tailWidthScene * 0.35);
    vec3 curlDir = normalize(cross(tailDir, perp));
    float kink = sin(along * 12.566) * u_ionCurl * along;
    worldOffset = axial + lateral + curlDir * (kink * u_tailWidthScene);
  } else {
    // Coma halo — large billboard.
    float haloR = u_nucleusRadius * (4.0 + 6.0 * u_activity);
    worldOffset = (uv.x - 0.5) * haloR * 2.0 * vec3(1.0, 0.0, 0.0)
                + (uv.y - 0.5) * haloR * 2.0 * vec3(0.0, 1.0, 0.0);
  }

  vec4 mvPos = modelViewMatrix * vec4(worldOffset, 1.0);
  gl_Position = projectionMatrix * mvPos;

  v_tailCoord = uv;
  v_component = u_component;
  v_activity = u_activity;
}
