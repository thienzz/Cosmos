import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  FlyToAnimator,
  approachDistanceForRadius,
  bezier3,
  computeFlyDuration,
  easeInOutCubic,
  type FlyToSpec,
} from '../FlyToAnimator';

describe('easeInOutCubic', () => {
  it('starts at 0, ends at 1, crosses 0.5 at t=0.5', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
  });

  it('has zero slope at the endpoints (smooth stop/start)', () => {
    const eps = 1e-3;
    const slopeStart = (easeInOutCubic(eps) - easeInOutCubic(0)) / eps;
    const slopeEnd = (easeInOutCubic(1) - easeInOutCubic(1 - eps)) / eps;
    expect(Math.abs(slopeStart)).toBeLessThan(0.05);
    expect(Math.abs(slopeEnd)).toBeLessThan(0.05);
  });

  it('clamps out-of-range inputs', () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });
});

describe('bezier3', () => {
  it('returns the endpoints at t=0 / t=1', () => {
    const p0 = new THREE.Vector3(0, 0, 0);
    const c1 = new THREE.Vector3(1, 2, 3);
    const c2 = new THREE.Vector3(4, 5, 6);
    const p3 = new THREE.Vector3(10, 0, 0);

    expect(bezier3(p0, c1, c2, p3, 0).equals(p0)).toBe(true);
    const end = bezier3(p0, c1, c2, p3, 1);
    expect(end.x).toBeCloseTo(p3.x, 6);
    expect(end.y).toBeCloseTo(p3.y, 6);
    expect(end.z).toBeCloseTo(p3.z, 6);
  });

  it('is convex — sample at t=0.5 stays between the control hull extents', () => {
    const p0 = new THREE.Vector3(0, 0, 0);
    const c1 = new THREE.Vector3(0, 5, 0);
    const c2 = new THREE.Vector3(10, 5, 0);
    const p3 = new THREE.Vector3(10, 0, 0);
    const mid = bezier3(p0, c1, c2, p3, 0.5);
    expect(mid.y).toBeGreaterThan(0);
    expect(mid.y).toBeLessThanOrEqual(5);
  });
});

describe('computeFlyDuration', () => {
  it('clamps to [1.5, 4] seconds', () => {
    expect(computeFlyDuration(0.0001)).toBeGreaterThanOrEqual(1.5);
    expect(computeFlyDuration(1e9)).toBeLessThanOrEqual(4);
  });

  it('returns ~2.5s for a reference-distance flight', () => {
    expect(computeFlyDuration(100, 100)).toBeCloseTo(2.5, 3);
  });

  it('longer flights take more time', () => {
    const near = computeFlyDuration(50);
    const far = computeFlyDuration(500);
    expect(far).toBeGreaterThan(near);
  });
});

describe('approachDistanceForRadius', () => {
  it('scales with visual radius (2.5 × r + buffer)', () => {
    expect(approachDistanceForRadius(1, 'solar_system')).toBeCloseTo(2.6, 5);
    expect(approachDistanceForRadius(4, 'solar_system')).toBeCloseTo(10.4, 5);
  });

  it('uses the 2× buffer for stellar+ regimes', () => {
    expect(approachDistanceForRadius(1, 'galactic')).toBeCloseTo(4.5, 5);
  });

  it('floors at 0.5 scene units', () => {
    expect(approachDistanceForRadius(0.01)).toBeGreaterThanOrEqual(0.5);
  });
});

describe('FlyToAnimator', () => {
  const makeSpec = (overrides: Partial<FlyToSpec> = {}): FlyToSpec => ({
    startPosition: new THREE.Vector3(0, 0, 100),
    startTarget: new THREE.Vector3(0, 0, 0),
    endTarget: new THREE.Vector3(10, 0, 0),
    orbitDistance: 5,
    durationSec: 2,
    ...overrides,
  });

  it('samples the start position at t=0 and the approach point at t=1', () => {
    const anim = new FlyToAnimator(makeSpec());
    const first = anim.currentSample();
    expect(first.cameraPosition.distanceTo(new THREE.Vector3(0, 0, 100))).toBeCloseTo(0, 3);

    // Advance to completion.
    anim.advance(10);
    const last = anim.currentSample();
    expect(last.progress).toBe(1);
    // Approach point = endTarget + unit(start-end) * orbitDistance
    // For our spec that puts the camera at ≈ endTarget offset along +Z a bit and +X slightly back.
    // The key invariant: the distance from the end sample to endTarget ≈ orbitDistance.
    expect(last.cameraPosition.distanceTo(new THREE.Vector3(10, 0, 0))).toBeCloseTo(5, 1);
  });

  it('lerps the camera target from start to end', () => {
    const anim = new FlyToAnimator(makeSpec());
    const mid = (() => {
      anim.advance(1); // half duration
      return anim.currentSample();
    })();
    expect(mid.progress).toBeCloseTo(0.5, 3);
    // Target at mid-progress ≈ midpoint with eased weighting (eased(0.5)=0.5).
    expect(mid.cameraTarget.x).toBeCloseTo(5, 3);
  });

  it('transitions state running → finished when elapsed >= duration', () => {
    const anim = new FlyToAnimator(makeSpec());
    expect(anim.state).toBe('running');
    expect(anim.isActive).toBe(true);
    anim.advance(10);
    expect(anim.state).toBe('finished');
    expect(anim.isActive).toBe(false);
  });

  it('cancel() sets state to cancelled and freezes sampling', () => {
    const anim = new FlyToAnimator(makeSpec());
    anim.advance(0.5);
    const before = anim.currentSample().progress;
    anim.cancel();
    expect(anim.state).toBe('cancelled');
    expect(anim.isActive).toBe(false);
    // Further advance does not move progress forward.
    anim.advance(10);
    expect(anim.currentSample().progress).toBeCloseTo(before, 5);
  });

  it('bulge — avoidPoint pushes the path away vs the no-avoid baseline', () => {
    // Place the obstacle OFF the start→end axis so the perp projection is
    // non-degenerate. Baseline path runs from (0,0,100) to approach-point
    // near (9.5, 0, 5); an obstacle at y=+8 sits above the path plane.
    const avoidPoint = new THREE.Vector3(5, 8, 50);
    const baselineSpec = makeSpec();
    const avoidSpec = { ...baselineSpec, avoidPoint, avoidRadius: 5 };

    const sampleMinDist = (spec: FlyToSpec): number => {
      const anim = new FlyToAnimator(spec);
      let minDist = Infinity;
      for (let i = 1; i < 40; i++) {
        const t = i / 40;
        anim.elapsedSec = t * spec.durationSec;
        minDist = Math.min(
          minDist,
          anim.currentSample().cameraPosition.distanceTo(avoidPoint),
        );
      }
      return minDist;
    };

    const baselineMin = sampleMinDist(baselineSpec);
    const avoidedMin = sampleMinDist(avoidSpec);
    // Bulge must materially increase the obstacle clearance.
    expect(avoidedMin).toBeGreaterThan(baselineMin + 1);
  });

  it('handles start == end gracefully (degenerate flight)', () => {
    const spec = {
      ...makeSpec(),
      startPosition: new THREE.Vector3(0, 0, 0),
      endTarget: new THREE.Vector3(0, 0, 0),
    };
    const anim = new FlyToAnimator(spec);
    expect(anim.isActive).toBe(true);
    anim.advance(10);
    const last = anim.currentSample();
    expect(Number.isFinite(last.cameraPosition.x)).toBe(true);
    expect(Number.isFinite(last.cameraPosition.y)).toBe(true);
    expect(Number.isFinite(last.cameraPosition.z)).toBe(true);
  });

  // T33 — Doc 16 §Reduced Motion / Doc 24 §17.4: `durationSec <= 0` means
  // "teleport to the approach point with no easing". TS-A11Y-003.
  it('TS-A11Y-003: durationSec <= 0 snaps to final pose immediately', () => {
    const spec = { ...makeSpec(), durationSec: 0 };
    const anim = new FlyToAnimator(spec);
    expect(anim.isActive).toBe(false);
    expect(anim.state).toBe('finished');
    const sample = anim.currentSample();
    expect(sample.progress).toBe(1);
    // Camera must land at the approach point (end position exposed via getter).
    expect(sample.cameraPosition.distanceTo(anim.endPosition)).toBeCloseTo(0, 5);
    // Target matches the end target (lerp at eased=1).
    expect(sample.cameraTarget.distanceTo(anim.endTarget)).toBeCloseTo(0, 5);
  });

  it('TS-A11Y-003: negative durationSec is treated the same as zero', () => {
    const spec = { ...makeSpec(), durationSec: -0.5 };
    const anim = new FlyToAnimator(spec);
    expect(anim.state).toBe('finished');
    const sample = anim.currentSample();
    expect(sample.progress).toBe(1);
    expect(sample.cameraPosition.distanceTo(anim.endPosition)).toBeCloseTo(0, 5);
  });

  it('TS-A11Y-003: snapped flight still returns finite samples across advances', () => {
    const spec = { ...makeSpec(), durationSec: 0 };
    const anim = new FlyToAnimator(spec);
    anim.advance(0.016);
    const s1 = anim.currentSample();
    anim.advance(1);
    const s2 = anim.currentSample();
    for (const s of [s1, s2]) {
      expect(Number.isFinite(s.cameraPosition.x)).toBe(true);
      expect(Number.isFinite(s.progress)).toBe(true);
      expect(s.progress).toBe(1);
    }
  });
});
