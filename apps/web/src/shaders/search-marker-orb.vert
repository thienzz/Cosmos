// Cosmos Explorer — Search target marker orb vertex shader (T-V-58).
//
// P2F UI affordance spawned at a fly-to search destination. Not a scientific
// entity; lives outside the ENT-ID shader family. Mounted via MaterialFactory
// so it shares the log-depth + camera-relative plumbing with real entities.

uniform float u_time;

out vec3 v_normal;
out vec3 v_worldPos;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  v_normal = normalize(normalMatrix * normal);
  // Gentle breathing pulse (±3%) so the marker reads as "live" not a dead ball.
  float s = 1.0 + 0.03 * sin(u_time * 2.5);
  vec4 world = modelMatrix * vec4(position * s, 1.0);
  v_worldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
