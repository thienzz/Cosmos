import * as THREE from 'three';

/**
 * Cinematic fly-to transition (Doc 19 §4.2).
 *
 * Pure math — no DOM, no Three.js scene mutation. Each `sample(elapsedSec)`
 * call returns the interpolated `cameraPosition` and `cameraTarget` for that
 * moment; the caller copies them onto `THREE.PerspectiveCamera`.
 *
 * # Path shape
 *
 * Cubic Bezier from the camera's start position to the approach point:
 *
 *   P(t) = (1-t)³P0 + 3(1-t)²t·C1 + 3(1-t)t²·C2 + t³P3
 *
 * where `P0` = start camera, `P3` = approach point (`target + unit × orbitDistance`
 * along the start-to-target view axis), and `C1, C2` are offset perpendicular
 * to the start→end segment by a fraction of its length. Doc 19 §4.2 uses this
 * to avoid "passing through" the target when the start is already close;
 * for a smaller-budget first pass we use a symmetric perpendicular offset
 * instead of picking a specific obstacle to skirt. When a stronger
 * obstacle-avoidance heuristic is needed (e.g. Sun in the middle of a planet
 * flight) callers can pass `avoidPoint` + `avoidRadius`.
 *
 * # Easing
 *
 * Progress `t` is driven through smoothStep³ (`cubic-in-out`) so the camera
 * eases off input smoothly at both ends of the flight. Linear Bezier on
 * raw time feels abrupt at the endpoints.
 *
 * # Target interpolation
 *
 * Linear-lerp the orbit target from start to destination. When the user
 * hasn't been orbiting anything specific, start target is assumed to be
 * the controller's current `target` (passed in by the caller).
 *
 * # Interruption
 *
 * `cancel()` sets `state='cancelled'`. `sample()` still returns the frozen
 * final values so the caller can blend out if desired; `isActive` returns
 * false.
 */

export interface FlyToSpec {
  startPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
  /** World position of the body we're flying to. */
  endTarget: THREE.Vector3;
  /** Final distance from endTarget (scene units). */
  orbitDistance: number;
  durationSec: number;
  /**
   * Optional obstacle to skirt. When supplied, the Bezier control points
   * are offset so the curve bulges away from `avoidPoint` by roughly
   * `avoidRadius × 2`. Typical use: Sun when flying between planets.
   */
  avoidPoint?: THREE.Vector3;
  avoidRadius?: number;
  /**
   * Optional final camera facing direction. When omitted the approach
   * point is colinear with the start→endTarget vector.
   */
  approachDirection?: THREE.Vector3;
}

export interface FlyToSample {
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  /** 0 .. 1 */
  progress: number;
}

export type FlyToState = 'idle' | 'running' | 'finished' | 'cancelled';

/**
 * Compute a sensible travel time from "distance from start to end"
 * (Doc 19 §4.2).  Clamped to 1.5–4 s so very-near / very-far flights
 * still read as cinematic.
 */
export function computeFlyDuration(
  startToEnd: number,
  referenceDistance = 100,
): number {
  const base = 2.5;
  const ratio = Math.max(1e-6, startToEnd / Math.max(1e-6, referenceDistance));
  const adjusted = base + Math.log10(ratio) * 0.5;
  return THREE.MathUtils.clamp(adjusted, 1.5, 4);
}

/**
 * Ease-in-out cubic. Equivalent to smootherStep without the quintic tail.
 * Both endpoints have zero derivative so the camera starts and ends at rest.
 */
export function easeInOutCubic(t: number): number {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

export class FlyToAnimator {
  private readonly spec: FlyToSpec;
  private readonly p0: THREE.Vector3;
  private readonly p3: THREE.Vector3;
  private readonly c1: THREE.Vector3;
  private readonly c2: THREE.Vector3;

  state: FlyToState = 'idle';
  elapsedSec = 0;

  constructor(spec: FlyToSpec) {
    this.spec = { ...spec };
    this.p0 = spec.startPosition.clone();
    const approachDir = (spec.approachDirection ?? new THREE.Vector3()
      .subVectors(spec.startPosition, spec.endTarget))
      .clone();
    if (approachDir.lengthSq() < 1e-10) {
      // Start already at target; push the approach point up the world-Y axis.
      approachDir.set(0, 0, 1);
    }
    approachDir.normalize();
    this.p3 = spec.endTarget.clone().addScaledVector(approachDir, spec.orbitDistance);

    // Segment vector + a perpendicular we can offset the control points along.
    const segment = new THREE.Vector3().subVectors(this.p3, this.p0);
    const segmentLen = Math.max(1e-6, segment.length());
    const segmentDir = segment.clone().multiplyScalar(1 / segmentLen);
    const worldUp = Math.abs(segmentDir.y) < 0.95
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    const perp = new THREE.Vector3().crossVectors(segmentDir, worldUp).normalize();

    // Default "S-curve" offset — feels cinematic and avoids cutting straight
    // through the destination.  Magnitude scaled by segment length so short
    // flights don't over-bulge.
    let bulge = segmentLen * 0.15;

    // Obstacle-avoidance: push the Bezier hump away from the avoidPoint. The
    // perpendicular direction is `away - (away · segmentDir) * segmentDir`
    // so we strip out any component along the travel path (otherwise when
    // the avoidPoint is near the segment the bulge ends up parallel to it
    // and doesn't clear the obstacle).
    if (spec.avoidPoint && typeof spec.avoidRadius === 'number' && spec.avoidRadius > 0) {
      const midpoint = this.p0.clone().lerp(this.p3, 0.5);
      const away = new THREE.Vector3().subVectors(midpoint, spec.avoidPoint);
      const alongSegment = away.dot(segmentDir);
      away.addScaledVector(segmentDir, -alongSegment);
      const orthLen = away.length();
      if (orthLen > 1e-6) {
        perp.copy(away).multiplyScalar(1 / orthLen);
      }
      bulge = Math.max(bulge, spec.avoidRadius * 2);
    }

    this.c1 = this.p0.clone().lerp(this.p3, 0.25).addScaledVector(perp, bulge);
    this.c2 = this.p0.clone().lerp(this.p3, 0.75).addScaledVector(perp, bulge);

    // Doc 16 §Reduced Motion / T33: `durationSec <= 0` means "snap
    // immediately" — the camera teleports to the approach point on the
    // next frame without any cinematic easing. Used when the user has
    // enabled `settingsStore.reducedMotion`. We normalise the stored
    // duration to a tiny positive epsilon so the `progress` getter's
    // division stays finite, and pre-flag the animation as finished so
    // the very first `advance()` samples the end pose.
    if (this.spec.durationSec <= 0) {
      this.spec.durationSec = 1e-6;
      this.elapsedSec = this.spec.durationSec;
      this.state = 'finished';
    } else {
      this.state = 'running';
    }
  }

  get isActive(): boolean {
    return this.state === 'running';
  }

  get progress(): number {
    return THREE.MathUtils.clamp(this.elapsedSec / this.spec.durationSec, 0, 1);
  }

  get endPosition(): THREE.Vector3 {
    return this.p3.clone();
  }

  get endTarget(): THREE.Vector3 {
    return this.spec.endTarget.clone();
  }

  /** Cancel the animation. `sample()` will continue to return the frozen final values. */
  cancel(): void {
    if (this.state === 'running') this.state = 'cancelled';
  }

  /** Advance by `dt` seconds and return the interpolated sample. */
  advance(dtSec: number): FlyToSample {
    if (this.state === 'running') {
      this.elapsedSec += Math.max(0, dtSec);
      if (this.elapsedSec >= this.spec.durationSec) {
        this.elapsedSec = this.spec.durationSec;
        this.state = 'finished';
      }
    }
    return this.currentSample();
  }

  /** Compute the sample for the current elapsed time without advancing. */
  currentSample(): FlyToSample {
    const linear = this.progress;
    const eased = easeInOutCubic(linear);

    const position = bezier3(this.p0, this.c1, this.c2, this.p3, eased);
    const target = this.spec.startTarget.clone().lerp(this.spec.endTarget, eased);

    return {
      cameraPosition: position,
      cameraTarget: target,
      progress: linear,
    };
  }
}

/** De Casteljau cubic Bezier. Allocates a fresh Vector3 for the result. */
export function bezier3(
  p0: THREE.Vector3,
  c1: THREE.Vector3,
  c2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
): THREE.Vector3 {
  const u = 1 - t;
  const uu = u * u;
  const uuu = uu * u;
  const tt = t * t;
  const ttt = tt * t;

  const out = new THREE.Vector3();
  out.addScaledVector(p0, uuu);
  out.addScaledVector(c1, 3 * uu * t);
  out.addScaledVector(c2, 3 * u * tt);
  out.addScaledVector(p3, ttt);
  return out;
}

/**
 * Doc 19 §4.2 — approach distance = 2.5 × visual radius + scale buffer.
 *
 * The caller resolves the body's visual radius (in scene units) and the
 * active scale regime; we keep both numeric inputs in scene units so the
 * function doesn't care whether the units are AU, pc, or Mpc.
 *
 * The buffer values approximate the per-regime defaults from Doc 19:
 *   S0 / S1  — buffer = 0.1 × visualRadius  (up-close viewing)
 *   S2+      — buffer = 2.0 × visualRadius  (wide framing)
 */
export function approachDistanceForRadius(
  visualRadius: number,
  regime: 'solar_system' | 'stellar' | 'galactic' | 'cosmic' = 'solar_system',
): number {
  const buffer = regime === 'solar_system' ? 0.1 * visualRadius : 2 * visualRadius;
  return Math.max(0.5, 2.5 * visualRadius + buffer);
}
