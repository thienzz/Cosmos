/**
 * Rolling-FPS monitor + adaptive-quality mapping per Doc 27 §14.3.
 *
 * The render loop records every frame's delta; the monitor exposes an
 * averaged FPS and a `QualityLevel` token. Consumers (SceneManager,
 * post-processing pipeline) react by downgrading effects.
 */

export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low' | 'emergency';

/**
 * Doc 27 §14.3 FPS thresholds. Each band is stable — hysteresis is applied
 * on top so callers don't flap between two adjacent levels.
 */
const QUALITY_BANDS: Array<{ level: QualityLevel; min: number }> = [
  { level: 'ultra', min: 55 },
  { level: 'high', min: 45 },
  { level: 'medium', min: 35 },
  { level: 'low', min: 25 },
  { level: 'emergency', min: 0 },
];

const QUALITY_ORDER: Record<QualityLevel, number> = {
  ultra: 4,
  high: 3,
  medium: 2,
  low: 1,
  emergency: 0,
};

export interface PerformanceMonitorOptions {
  /** Number of recent frame deltas to average. Default 60 (~1s at 60 Hz). */
  windowSize?: number;
  /** Drop downgrades that are less than this value below current level. */
  hysteresisFps?: number;
}

export interface PerformanceSnapshot {
  fps: number;
  frameTimeMs: number;
  sampleCount: number;
  quality: QualityLevel;
}

/** Map a raw FPS number to its band-based QualityLevel (Doc 27 §14.3). */
export function fpsToQualityLevel(fps: number): QualityLevel {
  for (const band of QUALITY_BANDS) {
    if (fps >= band.min) return band.level;
  }
  return 'emergency';
}

/**
 * P3 — collapse the 5-step adaptive quality ladder into the 3 GPU tiers used
 * by hardware-facing code (post-processing bloom pyramid, tile budget, etc.).
 * The ladder was designed for UI adaptation (granular telemetry); GPU paths
 * like `PostProcessingChain.setQualityTier` only know `low | mid | high`.
 *
 *   ultra / high → 'high'
 *   medium       → 'mid'
 *   low          → 'low'
 *   emergency    → 'low'   (no separate tier — post-processing bypass kicks
 *                           in via {@link shouldBypassPostProcessing})
 */
export function qualityToGpuTier(level: QualityLevel): 'low' | 'mid' | 'high' {
  switch (level) {
    case 'ultra':
    case 'high':
      return 'high';
    case 'medium':
      return 'mid';
    case 'low':
    case 'emergency':
      return 'low';
  }
}

/**
 * P3 — fraction of the asteroid-field particle budget to draw at each level.
 * Full 1.2M budget at ultra/high; a cheaper subset as FPS degrades so the
 * per-vertex Kepler solve stops bottlenecking the frame. The drawRange
 * adjustment is non-destructive — climbing back up restores the full set
 * without a buffer re-upload.
 */
export function qualityToAsteroidFraction(level: QualityLevel): number {
  switch (level) {
    case 'ultra':
      return 1.0;
    case 'high':
      return 1.0;
    case 'medium':
      return 0.5;
    case 'low':
      return 0.25;
    case 'emergency':
      return 0.1;
  }
}

/**
 * P3 — at or below this quality level, bypass the post-processing chain
 * entirely and render the scene straight to the default framebuffer. Saves
 * the full-viewport HDR RTT + bloom pyramid + composite shader on low-end
 * GPUs where those passes alone can cost 4–8 ms/frame.
 */
export function shouldBypassPostProcessing(level: QualityLevel): boolean {
  return level === 'low' || level === 'emergency';
}

export class PerformanceMonitor {
  private readonly windowSize: number;
  private readonly hysteresisFps: number;
  private readonly deltas: number[] = [];
  private writeIndex = 0;
  private sampleCount = 0;
  private currentQuality: QualityLevel = 'ultra';

  constructor(options: PerformanceMonitorOptions = {}) {
    this.windowSize = Math.max(1, Math.floor(options.windowSize ?? 60));
    this.hysteresisFps = Math.max(0, options.hysteresisFps ?? 3);
    this.deltas = new Array<number>(this.windowSize).fill(0);
  }

  /** Record a frame delta in milliseconds. */
  recordFrame(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    this.deltas[this.writeIndex] = deltaMs;
    this.writeIndex = (this.writeIndex + 1) % this.windowSize;
    if (this.sampleCount < this.windowSize) this.sampleCount += 1;
    this.updateQuality();
  }

  /** Average FPS over the recorded window. Returns 0 until first sample. */
  getFps(): number {
    if (this.sampleCount === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.sampleCount; i++) sum += this.deltas[i] ?? 0;
    const avgDelta = sum / this.sampleCount;
    return avgDelta > 0 ? 1000 / avgDelta : 0;
  }

  getSnapshot(): PerformanceSnapshot {
    const fps = this.getFps();
    return {
      fps,
      frameTimeMs: fps > 0 ? 1000 / fps : 0,
      sampleCount: this.sampleCount,
      quality: this.currentQuality,
    };
  }

  /**
   * Reset the sampling window without touching the current quality level —
   * useful on tab visibility change where a long delta would poison the
   * rolling average.
   */
  resetSamples(): void {
    for (let i = 0; i < this.windowSize; i++) this.deltas[i] = 0;
    this.writeIndex = 0;
    this.sampleCount = 0;
  }

  /** Force a quality level (e.g., user override in settings). */
  setQuality(level: QualityLevel): void {
    this.currentQuality = level;
  }

  private updateQuality(): void {
    const fps = this.getFps();
    const proposed = fpsToQualityLevel(fps);
    if (proposed === this.currentQuality) return;

    const proposedOrder = QUALITY_ORDER[proposed];
    const currentOrder = QUALITY_ORDER[this.currentQuality];

    // Always upgrade immediately on improvement; only downgrade when we're
    // clearly past the hysteresis band. This mirrors Doc 27 §14.3's intent
    // that the engine be quick to restore quality as conditions improve.
    if (proposedOrder > currentOrder) {
      this.currentQuality = proposed;
      return;
    }

    const currentBand = QUALITY_BANDS.find((b) => b.level === this.currentQuality);
    if (!currentBand) {
      this.currentQuality = proposed;
      return;
    }
    if (fps < currentBand.min - this.hysteresisFps) {
      this.currentQuality = proposed;
    }
  }
}
