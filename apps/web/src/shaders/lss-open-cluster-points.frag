// Cosmos Explorer — LSS gallery open-cluster / OB-association point fragment (T-V-58).
//
// Radial Gaussian sprite with a tight core + soft halo. Additive blending is
// set on the host material. Paired with lss-open-cluster-points.vert; driven
// by MaterialFactory under the 'lss-open-cluster-points' registry key.

in vec3 v_color;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

out vec4 fragColor;

void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r2 = dot(d, d);
  float a = exp(-r2 * 18.0);
  fragColor = vec4(v_color * 1.4, a);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
