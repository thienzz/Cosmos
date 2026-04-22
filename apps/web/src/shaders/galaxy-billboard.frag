// Cosmos Explorer — Galaxy LOD billboard fragment shader (T-V-58).
//
// Radial alpha gradient tinted by the galaxy's palette colour. Cheap
// stand-in for the mid-distance LOD so we're not raymarching the
// volumetric cube at every range. Reads as a disk at any angle without
// overdraw spikes. Paired with galaxy-billboard.vert; driven by
// MaterialFactory under the 'galaxy-billboard' registry key.

in vec2 v_uv;
uniform vec3 u_tint;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float v_fragDepth;
  uniform float logDepthBufFC;
#endif

void main() {
  vec2 uv = v_uv * 2.0 - 1.0;
  float r = length(uv);
  if (r > 1.0) discard;
  float falloff = exp(-r * r * 2.4);
  fragColor = vec4(u_tint * falloff, falloff);
  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(v_fragDepth) * logDepthBufFC * 0.5;
  #endif
}
