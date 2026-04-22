// Cosmos Explorer — Lyman-α blob shader (T-V-15).
//
// Doc 18 §ENT-7033 (Lyman-α blobs — LAB-1 Matsuda 2004). Extended high-z
// emission nebulae. Rendered as a volumetric sphere via cheap front-face
// ray-march; density falls off smoothly from the cluster centre. Colour
// ramp favours purplish-blue (redshifted Lα at observer rest frame).
//
// Rendering is non-geometric: each fragment walks a handful of samples
// inward along the view direction, accumulating emission. Intentionally
// bounded to 16 samples — budget-friendly for Doc 12 constraints.

in vec3 v_modelPos;
in vec3 v_viewDirW;
in vec3 v_worldPos;

uniform float u_time;
uniform float u_shapeSeed;
// @param u_blobScale — 0..1, maps model-space radius; smaller = denser.
uniform float u_blobScale;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

float hash3(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}
float vn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  float n000=hash3(i), n100=hash3(i+vec3(1,0,0)), n010=hash3(i+vec3(0,1,0)),
        n110=hash3(i+vec3(1,1,0)), n001=hash3(i+vec3(0,0,1)),
        n101=hash3(i+vec3(1,0,1)), n011=hash3(i+vec3(0,1,1)), n111=hash3(i+vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),
             mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
}

void main() {
  // Walk inward from the model-space entry point along the negated
  // view-dir for a fixed number of steps. Because the mesh is a sphere,
  // v_modelPos is the surface hit; step inward by -V.
  vec3 dir = normalize(v_modelPos);                    // outward normal
  vec3 pos = v_modelPos;
  float totalEmission = 0.0;
  const int SAMPLES = 16;
  for (int i = 0; i < SAMPLES; i++) {
    float r = length(pos);
    float density = exp(-r * r / max(u_blobScale, 0.25) / max(u_blobScale, 0.25));
    density *= 0.6 + 0.4 * vn(pos * 3.5 + u_shapeSeed * 1.7);
    totalEmission += density;
    pos -= dir * 0.12;                                 // step inward
  }
  totalEmission /= float(SAMPLES);

  // Redshifted Lα colour ramp.
  vec3 innerColor = vec3(0.85, 0.55, 1.05);            // purplish-white core
  vec3 outerColor = vec3(0.35, 0.30, 0.75);            // deeper purple halo
  float rout = length(v_modelPos);
  vec3 palette = mix(innerColor, outerColor, smoothstep(0.0, 0.8, rout));

  vec3 col = palette * totalEmission * 1.4;
  float alpha = clamp(totalEmission * 1.8, 0.0, 0.9);
  if (alpha < 0.01) discard;

  fragColor = vec4(col, alpha);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
