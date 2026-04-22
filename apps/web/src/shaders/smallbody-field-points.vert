// Cosmos Explorer — Procedural minor-body field vertex shader (T-V-58).
//
// GPU-side Kepler propagator for ~1.2M asteroids, Trojans, KBOs and comets
// rendered as Points. Solves Kepler's equation per vertex (3 Newton
// iterations), transforms orbital-plane Cartesian → ICRS via the standard
// 3-1-3 Euler rotation, and divides by the scene's km-per-unit conversion
// to land in scene units. Paired with smallbody-field-points.frag;
// registered with MaterialFactory under 'smallbody-field-points'.
//
// Attributes (THREE.BufferAttribute on the hosting geometry):
//   a_orbitA_e_i    — vec3(a km, e, i rad)
//   a_node_arg_M0   — vec3(Ω rad, ω rad, M0 rad)
//   a_meanMotion    — float (rad/sec)
//   a_subtypeIndex  — float (0..SUBTYPE_COUNT-1; palette lookup)

in vec3 a_orbitA_e_i;
in vec3 a_node_arg_M0;
in float a_meanMotion;
in float a_subtypeIndex;

uniform float u_dtSecondsSinceEpoch;
uniform float u_kmToScene;
uniform float u_pointSizePx;
uniform float u_devicePixelRatio;

out float v_subtypeIndex;
out float v_comet;

float solveKepler(float M, float e) {
  M = mod(M + 3.141592653589793, 6.283185307179586) - 3.141592653589793;
  float E = M + e * sin(M);
  for (int i = 0; i < 3; i++) {
    float dE = (E - e * sin(E) - M) / (1.0 - e * cos(E));
    E -= dE;
  }
  return E;
}

void main() {
  float a = a_orbitA_e_i.x;
  float e = a_orbitA_e_i.y;
  float inc = a_orbitA_e_i.z;
  float Omega = a_node_arg_M0.x;
  float omega = a_node_arg_M0.y;
  float M0 = a_node_arg_M0.z;

  float M = M0 + a_meanMotion * u_dtSecondsSinceEpoch;
  float E = solveKepler(M, e);
  float cosE = cos(E);
  float sinE = sin(E);

  float sqrtFactor = sqrt(1.0 - e * e);
  float nu = atan(sqrtFactor * sinE, cosE - e);
  float r = a * (1.0 - e * cosE);

  float xOrb = r * cos(nu);
  float yOrb = r * sin(nu);

  float cw = cos(omega);
  float sw = sin(omega);
  float x1 = xOrb * cw - yOrb * sw;
  float y1 = xOrb * sw + yOrb * cw;

  float ci = cos(inc);
  float si = sin(inc);
  float x2 = x1;
  float y2 = y1 * ci;
  float z2 = y1 * si;

  float cO = cos(Omega);
  float sO = sin(Omega);
  vec3 ecliptic = vec3(
    x2 * cO - y2 * sO,
    x2 * sO + y2 * cO,
    z2
  );

  vec3 scenePos = vec3(ecliptic.x, ecliptic.z, -ecliptic.y) * u_kmToScene;

  vec4 mvPos = modelViewMatrix * vec4(scenePos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  float dist = max(1.0, -mvPos.z);

  // Subtype indices 7..10 are comets — give them a slightly larger point
  // size so the coma cue is visible at Solar System zoom.
  float subtype = a_subtypeIndex;
  float cometFlag = (subtype >= 6.5 && subtype <= 10.5) ? 1.0 : 0.0;
  float sizeBoost = 1.0 + 0.8 * cometFlag;

  gl_PointSize = u_pointSizePx * u_devicePixelRatio * (60.0 / dist) * sizeBoost;
  v_subtypeIndex = subtype;
  v_comet = cometFlag;
}
