/**
 * Post-processing params — single source of truth for Doc 18 §3.5 and
 * §Post-Processing & Global Effects.
 *
 * Values here drive {@link PostProcessingChain} and the Settings UI so both
 * the engine and the user-facing sliders read the same numbers.
 *
 * T30 deviations from Doc 18:
 * - **UnrealBloomPass** is reimplemented as a custom 4-stage Gaussian
 *   downsample/upsample chain because CLAUDE.md Rule #3 forbids importing
 *   from `three/examples/jsm/postprocessing`. The exposed knobs
 *   (`threshold` / `strength` / `radius`) keep parity with the Doc 18 values.
 * - **FXAA** is a single-pass Fast Approximate AA (Timothy Lottes luma-based
 *   variant) inside the composite shader; no dedicated pass.
 * - **Chromatic aberration + film grain + vignette + CRT scanlines** live
 *   in the same composite shader (one full-screen draw) — Doc 24 §3.4
 *   scanlines are a CSS overlay in the *UI* but the *viewport* (above the
 *   3D render, below the UI) gets them in-shader so they respect the
 *   render target resolution and reduced-motion accessibility gate.
 */

export interface BloomParams {
  /** Luminance above which fragments contribute to bloom. Doc 18 §3.5: 0.8. */
  threshold: number;
  /** Strength / intensity of the bloom add. Doc 18 §3.5: 1.5. */
  strength: number;
  /** Radius (pixel span of the blur) in pixels at 1080p reference. */
  radius: number;
}

/** Doc 18 §Post-Processing → UnrealBloomPass section global defaults. */
export const BLOOM_DEFAULT: BloomParams = {
  threshold: 0.8,
  strength: 1.5,
  radius: 8,
};

/** Doc 18 §Post-Processing → Chromatic Aberration. */
export interface ChromaticAberrationParams {
  /** Offset intensity (fraction of screen). Doc 18 §3.5: 0.002. */
  intensity: number;
  /** Edge-falloff radius — aberration is only visible near the edges. */
  edgeStart: number; // 0..1 (radius from centre where CA kicks in)
}

export const CHROMATIC_ABERRATION_DEFAULT: ChromaticAberrationParams = {
  intensity: 0.002,
  edgeStart: 0.55, // Doc 18 §3.5: "50px from edge" at 1080p ≈ 0.55 of half-diagonal
};

/** Doc 18 §Post-Processing → Film Grain. */
export interface FilmGrainParams {
  /** Opacity 0..1. Doc 18 §3.5: 0.03. */
  opacity: number;
  /** Spatial frequency of the grain pattern. Higher = finer. */
  scale: number;
  /** Temporal mix speed (seed advance per second). */
  speed: number;
}

export const FILM_GRAIN_DEFAULT: FilmGrainParams = {
  opacity: 0.03,
  scale: 380,
  speed: 24,
};

/**
 * Doc 24 §3.5 CRT Scanlines — in-viewport shader variant. The CSS overlay
 * still lives on the HTML layer above the canvas; the shader pass is cheap
 * and guarantees the scanline frequency is independent of device pixel
 * ratio (avoids moiré on retina).
 */
export interface ScanlineParams {
  /** Line opacity. Doc 24 §3.5: 0.03–0.06. */
  opacity: number;
  /** Scanline frequency in screen-space lines (pairs: 1 dark + 1 light). */
  frequency: number;
  /** Phosphor-dot frequency (sub-pixel RGB mask). 0 = off. */
  phosphorDot: number;
}

export const SCANLINE_DEFAULT: ScanlineParams = {
  opacity: 0.045,
  frequency: 320,
  phosphorDot: 0.25,
};

/** Doc 18 §Post-Processing → Color Grading (vignette + ACES tail). */
export interface VignetteParams {
  /** Vignette darkness at the corners 0..1. */
  darkness: number;
  /** Vignette offset — larger = smaller dark ring. */
  offset: number;
}

export const VIGNETTE_DEFAULT: VignetteParams = {
  darkness: 0.45,
  offset: 0.35,
};

/** Doc 18 §Post-Processing → ToneMapping (ACESFilmic). */
export interface ToneMappingParams {
  /** Exposure multiplier. Doc 18 §3.5: 1.0 (slider range 0.5–2.0). */
  exposure: number;
}

export const TONE_MAPPING_DEFAULT: ToneMappingParams = {
  exposure: 1.0,
};

/**
 * Per-quality-tier bloom iteration count. Doc 12 §Quality Tiers: Tier 1
 * (high) gets full HDR bloom, Tier 3 (low) disables bloom entirely.
 */
export const BLOOM_ITERATIONS_BY_TIER: Record<'low' | 'mid' | 'high', number> = {
  high: 5, // full 5-stage Gaussian pyramid
  mid: 3,  // 3-stage — visually similar, 40% cheaper
  low: 0,  // disabled per Doc 12 §2.1 Tier 3
};

/**
 * Doc 18 §Black Hole / §Gravitational Lensing Shader parameters. The T28
 * per-BH frag already carries `u_horizonRadius` and a fake photon ring;
 * the T30 post pass is a *fullscreen* Schwarzschild deflection that warps
 * the background (stars, nebulae) around the BH.
 */
export interface BlackHoleLensingParams {
  /** Number of deflection samples per pixel. More = smoother arcs. */
  samples: number;
  /** Einstein-radius scale factor applied to `schwarzschildRadius`. 1.5 = photon sphere. */
  einsteinScale: number;
  /**
   * Maximum deflection magnitude (radians). Clamp guards against
   * singular behaviour near the horizon.
   */
  maxDeflectionRad: number;
  /**
   * Deflection falloff exponent — 2 matches the weak-field Schwarzschild
   * approximation `α ≈ 2 r_s / b` reduced by b² in screen space.
   */
  falloffExponent: number;
}

export const BLACK_HOLE_LENSING_DEFAULT: BlackHoleLensingParams = {
  samples: 1,
  einsteinScale: 1.5,
  maxDeflectionRad: 0.9,
  falloffExponent: 1.0,
};
