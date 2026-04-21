// Cosmos Explorer — Saturn ring vertex shader (Doc 18 §Saturn — Rings).
//
// Applied to a flat disc mesh (RingGeometry) centred on the parent planet
// and oriented in its equatorial plane. We forward the *local* XY position
// so the fragment shader can measure radius directly in ring-plane units.

out vec2 v_ringLocal;   // XY in parent-radius units
out vec3 v_normalW;     // world-space normal (for lighting)
out vec3 v_viewDirW;
out vec3 v_worldPos;
out vec3 v_modelPos;

// See planet.vert — custom ShaderMaterial must emit log-depth manually
// when logarithmicDepthBuffer is on or depth comparisons desync with
// built-in materials (Sun, orbit lines, stars).
#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  out float vFragDepth;
#endif

void main() {
  v_modelPos   = position;
  v_ringLocal  = position.xy;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  v_worldPos   = worldPos.xyz;
  v_normalW    = normalize(mat3(normalMatrix) * normal);
  v_viewDirW   = normalize(cameraPosition - worldPos.xyz);
  gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    vFragDepth = 1.0 + gl_Position.w;
  #endif
}
