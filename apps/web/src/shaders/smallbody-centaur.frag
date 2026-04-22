// Cosmos Explorer — Centaur shader (T-V-07).
//
// Doc 18 §ENT-4050. Centaurs (Chiron, Chariklo) are icy bodies straddling
// the outer-giant zone with faint comet-like activity. This shader models
// the body's surface only — a cometary coma halo is enabled via
// `#define CENTAUR_ACTIVE` (blooms a faint outward fresnel haze in the
// body's own colour). Centaur-ring systems (Chariklo ENT-4050 variant)
// use the separate ring.vert/.frag pair rather than baking into this
// body shader.
//
//   #define CENTAUR_CHIRON     — slightly bluer, faint active halo.
//   #define CENTAUR_CHARIKLO   — reddish body; ring system rendered via
//                                ring.frag as a sibling mesh (CPU-wired).
//   #define CENTAUR_ACTIVE     — raise u_activity override; visible coma.
//   (default)                   — passive centaur, neutral grey-red.

in vec3 v_modelPos;
in vec3 v_normalW;
in vec3 v_viewDirW;
in vec3 v_worldPos;

uniform vec3 u_sunDir;
uniform float u_time;
uniform float u_shapeSeed;
// @param u_activity — 0..1, raises coma intensity. Default 0.
uniform float u_activity;

out vec4 fragColor;

#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
  in float vFragDepth;
  uniform float logDepthBufFC;
#endif

float hash(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}
float vn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  float n000=hash(i), n100=hash(i+vec3(1,0,0)), n010=hash(i+vec3(0,1,0)),
        n110=hash(i+vec3(1,1,0)), n001=hash(i+vec3(0,0,1)),
        n101=hash(i+vec3(1,0,1)), n011=hash(i+vec3(0,1,1)), n111=hash(i+vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),
             mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
}
float fbm(vec3 p, int oct) {
  float v=0.0, a=0.5;
  for (int i=0;i<6;i++) { if (i>=oct) break; v+=a*vn(p); p*=2.13; a*=0.5; }
  return v;
}

void main() {
  vec3 N = normalize(v_normalW);
  vec3 L = normalize(u_sunDir);
  vec3 V = normalize(v_viewDirW);
  float lambert = max(dot(N, L), 0.0);
  float shading = lambert * 0.85 + 0.15;

  // Base palette — centaur-red with a subtle ice admixture.
  vec3 body = vec3(0.52, 0.38, 0.28);
  vec3 ice  = vec3(0.82, 0.88, 0.92);

  #ifdef CENTAUR_CHIRON
    body = vec3(0.45, 0.42, 0.44);       // cooler blue-grey
  #endif
  #ifdef CENTAUR_CHARIKLO
    body = vec3(0.56, 0.38, 0.24);       // reddish Chariklo nucleus
  #endif

  float mottle = fbm(v_modelPos * 3.0 + u_shapeSeed, 4);
  vec3 base = mix(body, ice, smoothstep(0.55, 0.78, mottle) * 0.35);

  vec3 col = base * shading;

  // Coma halo — fresnel-style outward glow. Strength driven by activity.
  float activity = u_activity;
  #ifdef CENTAUR_ACTIVE
    activity = max(activity, 0.55);
  #endif
  if (activity > 0.01) {
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    float wobble = 0.8 + 0.2 * sin(u_time * 0.4 + u_shapeSeed * 6.28);
    vec3 coma = vec3(0.85, 0.9, 0.95) * activity * fresnel * wobble * 0.45;
    col += coma;
  }

  fragColor = vec4(col, 1.0);

  #ifdef USE_LOGARITHMIC_DEPTH_BUFFER
    gl_FragDepth = log2(vFragDepth) * logDepthBufFC * 0.5;
  #endif
}
