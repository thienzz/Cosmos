import { describe, expect, it } from 'vitest';

import {
  fpsToQualityLevel,
  PerformanceMonitor,
  qualityToAsteroidFraction,
  qualityToGpuTier,
  shouldBypassPostProcessing,
} from '../performanceMonitor';

describe('fpsToQualityLevel (Doc 27 §14.3 bands)', () => {
  it('≥55 → ultra', () => {
    expect(fpsToQualityLevel(60)).toBe('ultra');
    expect(fpsToQualityLevel(55)).toBe('ultra');
  });
  it('45–54 → high', () => {
    expect(fpsToQualityLevel(54)).toBe('high');
    expect(fpsToQualityLevel(45)).toBe('high');
  });
  it('35–44 → medium', () => {
    expect(fpsToQualityLevel(44)).toBe('medium');
    expect(fpsToQualityLevel(35)).toBe('medium');
  });
  it('25–34 → low', () => {
    expect(fpsToQualityLevel(34)).toBe('low');
    expect(fpsToQualityLevel(25)).toBe('low');
  });
  it('<25 → emergency', () => {
    expect(fpsToQualityLevel(24)).toBe('emergency');
    expect(fpsToQualityLevel(0)).toBe('emergency');
  });
});

describe('P3 — quality → GPU tier mapping', () => {
  it('collapses 5 levels into 3 GPU tiers', () => {
    expect(qualityToGpuTier('ultra')).toBe('high');
    expect(qualityToGpuTier('high')).toBe('high');
    expect(qualityToGpuTier('medium')).toBe('mid');
    expect(qualityToGpuTier('low')).toBe('low');
    expect(qualityToGpuTier('emergency')).toBe('low');
  });

  it('asteroid draw fraction shrinks monotonically as quality degrades', () => {
    expect(qualityToAsteroidFraction('ultra')).toBe(1.0);
    expect(qualityToAsteroidFraction('high')).toBe(1.0);
    expect(qualityToAsteroidFraction('medium')).toBe(0.5);
    expect(qualityToAsteroidFraction('low')).toBe(0.25);
    expect(qualityToAsteroidFraction('emergency')).toBe(0.1);
    // Sanity: strictly non-increasing across the ladder.
    const ladder: Array<ReturnType<typeof qualityToAsteroidFraction>> = [
      qualityToAsteroidFraction('ultra'),
      qualityToAsteroidFraction('high'),
      qualityToAsteroidFraction('medium'),
      qualityToAsteroidFraction('low'),
      qualityToAsteroidFraction('emergency'),
    ];
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i]).toBeLessThanOrEqual(ladder[i - 1] ?? 1);
    }
  });

  it('only bypasses post-processing at low and emergency', () => {
    expect(shouldBypassPostProcessing('ultra')).toBe(false);
    expect(shouldBypassPostProcessing('high')).toBe(false);
    expect(shouldBypassPostProcessing('medium')).toBe(false);
    expect(shouldBypassPostProcessing('low')).toBe(true);
    expect(shouldBypassPostProcessing('emergency')).toBe(true);
  });
});

function fillWithConstantFps(monitor: PerformanceMonitor, fps: number, frames: number): void {
  const delta = 1000 / fps;
  for (let i = 0; i < frames; i++) monitor.recordFrame(delta);
}

describe('PerformanceMonitor', () => {
  it('getFps returns 0 until the first sample', () => {
    const monitor = new PerformanceMonitor({ windowSize: 10 });
    expect(monitor.getFps()).toBe(0);
    expect(monitor.getSnapshot().sampleCount).toBe(0);
  });

  it('averages FPS across the rolling window', () => {
    const monitor = new PerformanceMonitor({ windowSize: 30 });
    fillWithConstantFps(monitor, 60, 30);
    expect(monitor.getFps()).toBeCloseTo(60, 1);
  });

  it('ignores non-finite or non-positive deltas', () => {
    const monitor = new PerformanceMonitor({ windowSize: 10 });
    monitor.recordFrame(Number.NaN);
    monitor.recordFrame(0);
    monitor.recordFrame(-5);
    expect(monitor.getSnapshot().sampleCount).toBe(0);
  });

  it('tracks quality ultra → low as FPS drops past bands', () => {
    const monitor = new PerformanceMonitor({ windowSize: 30, hysteresisFps: 0 });
    fillWithConstantFps(monitor, 60, 30);
    expect(monitor.getSnapshot().quality).toBe('ultra');
    fillWithConstantFps(monitor, 48, 30);
    expect(monitor.getSnapshot().quality).toBe('high');
    fillWithConstantFps(monitor, 40, 30);
    expect(monitor.getSnapshot().quality).toBe('medium');
    fillWithConstantFps(monitor, 28, 30);
    expect(monitor.getSnapshot().quality).toBe('low');
    fillWithConstantFps(monitor, 10, 30);
    expect(monitor.getSnapshot().quality).toBe('emergency');
  });

  it('upgrades quality instantly when FPS recovers', () => {
    const monitor = new PerformanceMonitor({ windowSize: 10 });
    fillWithConstantFps(monitor, 20, 10);
    expect(monitor.getSnapshot().quality).toBe('emergency');
    fillWithConstantFps(monitor, 60, 10);
    expect(monitor.getSnapshot().quality).toBe('ultra');
  });

  it('applies hysteresis to prevent flapping just below a band', () => {
    const monitor = new PerformanceMonitor({ windowSize: 10, hysteresisFps: 3 });
    fillWithConstantFps(monitor, 60, 10);
    expect(monitor.getSnapshot().quality).toBe('ultra');
    // 53 is below the 55 min but within the 3 FPS hysteresis band.
    fillWithConstantFps(monitor, 53, 10);
    expect(monitor.getSnapshot().quality).toBe('ultra');
    // 50 is past the hysteresis — now we drop.
    fillWithConstantFps(monitor, 50, 10);
    expect(monitor.getSnapshot().quality).toBe('high');
  });

  it('resetSamples clears the window without touching current quality', () => {
    const monitor = new PerformanceMonitor({ windowSize: 10 });
    fillWithConstantFps(monitor, 40, 10);
    expect(monitor.getSnapshot().quality).toBe('medium');
    monitor.resetSamples();
    const snap = monitor.getSnapshot();
    expect(snap.sampleCount).toBe(0);
    expect(snap.fps).toBe(0);
    expect(snap.quality).toBe('medium');
  });

  it('setQuality allows a manual override', () => {
    const monitor = new PerformanceMonitor({ windowSize: 10 });
    monitor.setQuality('low');
    expect(monitor.getSnapshot().quality).toBe('low');
  });
});

/**
 * P5 — synthetic pipeline test. Walks the PerformanceMonitor through every
 * FPS band and asserts the downstream adapter mappings (GPU tier +
 * asteroid fraction + post-processing bypass) line up with the active
 * quality level. Acts as a canary for P3 regressions where someone edits
 * one mapping without updating its neighbours.
 */
describe('P5 — FPS → quality → GPU pipeline (synthetic)', () => {
  interface Expected {
    fps: number;
    quality: ReturnType<PerformanceMonitor['getSnapshot']>['quality'];
    tier: 'low' | 'mid' | 'high';
    asteroidFraction: number;
    bypassPost: boolean;
  }

  const cases: Expected[] = [
    { fps: 60, quality: 'ultra',     tier: 'high', asteroidFraction: 1.0,  bypassPost: false },
    { fps: 48, quality: 'high',      tier: 'high', asteroidFraction: 1.0,  bypassPost: false },
    { fps: 38, quality: 'medium',    tier: 'mid',  asteroidFraction: 0.5,  bypassPost: false },
    { fps: 28, quality: 'low',       tier: 'low',  asteroidFraction: 0.25, bypassPost: true  },
    { fps: 10, quality: 'emergency', tier: 'low',  asteroidFraction: 0.1,  bypassPost: true  },
  ];

  for (const want of cases) {
    it(`${want.fps} fps → ${want.quality} → tier=${want.tier}, asteroid=${want.asteroidFraction}, bypass=${want.bypassPost}`, () => {
      const monitor = new PerformanceMonitor({ windowSize: 30, hysteresisFps: 0 });
      fillWithConstantFps(monitor, want.fps, 30);
      const q = monitor.getSnapshot().quality;
      expect(q).toBe(want.quality);
      expect(qualityToGpuTier(q)).toBe(want.tier);
      expect(qualityToAsteroidFraction(q)).toBe(want.asteroidFraction);
      expect(shouldBypassPostProcessing(q)).toBe(want.bypassPost);
    });
  }

  it('monotonic tier degradation as FPS falls through the bands', () => {
    const monitor = new PerformanceMonitor({ windowSize: 30, hysteresisFps: 0 });
    const tiers: Array<'low' | 'mid' | 'high'> = [];
    for (const fps of [60, 48, 38, 28, 10]) {
      fillWithConstantFps(monitor, fps, 30);
      tiers.push(qualityToGpuTier(monitor.getSnapshot().quality));
    }
    const order: Record<'low' | 'mid' | 'high', number> = { low: 0, mid: 1, high: 2 };
    for (let i = 1; i < tiers.length; i++) {
      const current = tiers[i];
      const previous = tiers[i - 1];
      if (current && previous) {
        expect(order[current]).toBeLessThanOrEqual(order[previous]);
      }
    }
  });
});
