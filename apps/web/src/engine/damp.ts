import type { Vector3 } from 'three';

/**
 * Frame-rate independent exponential decay ("damped lerp").
 *
 * `lambda` is the "speed" — higher = faster convergence. Approx rule:
 * λ = 1 / τ where τ is the time constant (seconds to reach 63% of target).
 * Doc 19 §4.1 uses a damping factor of 0.2s → λ = 5.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  if (dt <= 0) return current;
  if (!Number.isFinite(lambda) || lambda <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** In-place damp of a THREE.Vector3 toward target. Returns `current`. */
export function damp3(current: Vector3, target: Vector3, lambda: number, dt: number): Vector3 {
  current.x = damp(current.x, target.x, lambda, dt);
  current.y = damp(current.y, target.y, lambda, dt);
  current.z = damp(current.z, target.z, lambda, dt);
  return current;
}
