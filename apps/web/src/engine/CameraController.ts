import * as THREE from 'three';

import { damp3 } from './damp';
import {
  FlyToAnimator,
  computeFlyDuration,
  type FlyToSpec,
} from './FlyToAnimator';

/**
 * Multi-scale camera controller (Doc 19 §4.1 Free Flight + §4.4 Scale Wheel).
 *
 * Controls:
 *   - Left / Right drag: orbit around target (spherical coords; no gimbal
 *     lock because polar angle is clamped away from the poles).
 *   - Middle drag: screen-space pan — moves target and camera together.
 *   - Wheel: dolly (change orbital radius).
 *   - WASD / Arrow keys: strafe + forward/back in camera-local frame.
 *   - Q / E: descend / ascend in world Y.
 *   - Shift: 5x speed. Ctrl: 0.1x speed. Modifiers apply to both keyboard
 *     translation and wheel dolly.
 *
 * Integration: the consumer drives the controller by calling `update(dt)`
 * each frame. The controller mutates `camera.position`, `camera.quaternion`,
 * and `target` in place. SceneManager then publishes the new camera state
 * to the Zustand hot-store via `cameraStore.setState(...)` (Doc 27 §6.4).
 */

export interface CameraControllerOptions {
  /** Base translation speed (units per second), before shift/ctrl scale. */
  moveSpeed?: number;
  /** Pointer → radians per pixel for orbit drag. */
  orbitSpeed?: number;
  /** Fractional change in radius per wheel notch. */
  zoomSpeed?: number;
  /** Exponential damping lambda (1/τ). Doc 19 §4.1 → τ=0.2s → λ=5. */
  dampingLambda?: number;
  /** Clamp on orbit radius. */
  minDistance?: number;
  maxDistance?: number;
  /** Clamp on polar angle φ. Leave tiny ε off each pole to avoid gimbal lock. */
  minPolar?: number;
  maxPolar?: number;
}

const DEFAULT_OPTIONS: Required<CameraControllerOptions> = {
  moveSpeed: 10,
  orbitSpeed: 0.005,
  zoomSpeed: 0.1,
  dampingLambda: 5,
  minDistance: 0.001,
  maxDistance: 1e12,
  minPolar: 1e-4,
  maxPolar: Math.PI - 1e-4,
};

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const SHIFT_MULTIPLIER = 5;
const CTRL_MULTIPLIER = 0.1;

const MOVE_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyQ',
  'KeyE',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  readonly domElement: HTMLElement;
  readonly target = new THREE.Vector3(0, 0, 0);

  private readonly options: Required<CameraControllerOptions>;
  private readonly keys = new Set<string>();
  private shiftHeld = false;
  private ctrlHeld = false;

  private pointerButtons = 0;
  private pointerDeltaX = 0;
  private pointerDeltaY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private wheelDelta = 0;

  private readonly velocity = new THREE.Vector3();
  private readonly spherical = new THREE.Spherical();

  private disposed = false;
  private enabled = true;

  private flyToAnimator: FlyToAnimator | null = null;
  private onFlyToComplete?: (completed: boolean) => void;

  /** T20 — identity of the body currently being tracked (null = disabled). */
  private trackedId: number | null = null;
  /** T20 — last known world position of the tracked body. */
  private trackedAnchor: THREE.Vector3 | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    options: CameraControllerOptions = {},
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Initialise spherical coords from camera's current pose relative to target.
    const offset = camera.position.clone().sub(this.target);
    this.spherical.setFromVector3(offset);

    this.attachListeners();
  }

  setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z);
    this.resyncSphericalFromCamera();
  }

  /**
   * P4 — update WASD base translation speed after construction. The scene
   * spans 13 orders of magnitude between solar-system and cosmic regimes,
   * so a single `moveSpeed` would leave the user either snail-crawling
   * through galactic space or teleporting past planets. SceneManager calls
   * this on regime transitions to pick a scale-appropriate base speed.
   */
  setMoveSpeed(moveSpeed: number): void {
    this.options.moveSpeed = Math.max(0, moveSpeed);
  }

  /** Exposed for tests + telemetry. */
  getMoveSpeed(): number {
    return this.options.moveSpeed;
  }

  /**
   * Update the orbit-radius clamp after construction. T26 uses this to
   * widen the controller's range when the scene enters stellar regime —
   * the default `maxDistance=1e5` would otherwise prevent wheel-zoom
   * from reaching the 100-pc tile fringe.
   */
  setDistanceClamp(minDistance: number, maxDistance: number): void {
    this.options.minDistance = minDistance;
    this.options.maxDistance = maxDistance;
    this.spherical.radius = Math.max(
      minDistance,
      Math.min(maxDistance, this.spherical.radius),
    );
  }

  /**
   * Rebuild spherical coords from the current camera position + target. Call
   * after any direct write to `camera.position` (fly-to end, warp, etc.) so
   * the next orbit drag doesn't snap back to the stale spherical snapshot.
   */
  private resyncSphericalFromCamera(): void {
    const offset = this.camera.position.clone().sub(this.target);
    this.spherical.setFromVector3(offset);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.keys.clear();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start a fly-to animation. Disables pointer/keyboard control for its
   * duration; on completion the spherical coordinates are re-snapshotted so
   * free-flight and orbit drag pick up from the new pose seamlessly.
   *
   * Any in-flight animation is cancelled and the new one takes over.
   * Pass `duration: undefined` to compute a log-scaled time per Doc 19 §4.2.
   */
  flyTo(
    spec: Omit<FlyToSpec, 'startPosition' | 'startTarget' | 'durationSec'> & {
      durationSec?: number;
    },
    onComplete?: (completed: boolean) => void,
  ): void {
    if (this.disposed) return;
    if (this.flyToAnimator) {
      this.flyToAnimator.cancel();
      this.onFlyToComplete?.(false);
    }

    const start = this.camera.position.clone();
    const duration =
      spec.durationSec ?? computeFlyDuration(start.distanceTo(spec.endTarget));

    const payload: FlyToSpec = {
      startPosition: start,
      startTarget: this.target.clone(),
      endTarget: spec.endTarget.clone(),
      orbitDistance: spec.orbitDistance,
      durationSec: duration,
    };
    if (spec.avoidPoint) payload.avoidPoint = spec.avoidPoint.clone();
    if (typeof spec.avoidRadius === 'number') payload.avoidRadius = spec.avoidRadius;
    if (spec.approachDirection) {
      payload.approachDirection = spec.approachDirection.clone();
    }

    this.flyToAnimator = new FlyToAnimator(payload);
    this.onFlyToComplete = onComplete;

    // Drop stale input so the transition isn't immediately cancelled by
    // leftover drag delta / keyboard repeats.
    this.keys.clear();
    this.pointerButtons = 0;
    this.pointerDeltaX = 0;
    this.pointerDeltaY = 0;
    this.wheelDelta = 0;
    this.velocity.set(0, 0, 0);
  }

  /** True while a fly-to animation is in progress. */
  isFlyingTo(): boolean {
    return this.flyToAnimator?.isActive === true;
  }

  /**
   * T20 — keep the camera locked to a moving body's frame (Doc 19 §3.3
   * "Track selected object option"). Call once per frame AFTER the body's
   * world position has been updated and BEFORE {@link update}.
   *
   * Pass `(id, worldPos)` while tracking is active; `(null, null)` to stop.
   * The first call (or a change in `id`) re-baselines the anchor — no
   * camera shift fires. Subsequent calls shift `target` by the body's
   * Δposition since last frame, preserving the spherical offset so the
   * user's orbit pose is maintained. During a fly-to the anchor is
   * re-baselined but no shift is applied; fly-to owns the camera.
   */
  syncTracking(id: number | null, worldPos: THREE.Vector3 | null): void {
    if (this.disposed) return;
    if (id === null || worldPos === null) {
      this.trackedId = null;
      this.trackedAnchor = null;
      return;
    }
    // Fly-to owns the camera — re-baseline so tracking resumes cleanly on arrival.
    if (this.flyToAnimator?.isActive) {
      this.trackedId = id;
      if (this.trackedAnchor === null) this.trackedAnchor = worldPos.clone();
      else this.trackedAnchor.copy(worldPos);
      return;
    }
    // New body or first call: baseline, no shift.
    if (this.trackedId !== id || this.trackedAnchor === null) {
      this.trackedId = id;
      this.trackedAnchor = worldPos.clone();
      return;
    }
    const dx = worldPos.x - this.trackedAnchor.x;
    const dy = worldPos.y - this.trackedAnchor.y;
    const dz = worldPos.z - this.trackedAnchor.z;
    if (dx * dx + dy * dy + dz * dz < 1e-14) return;
    // Shift target — `update()` will recompute camera.position from
    // target + sphericalOffset so the orbital pose stays identical. We
    // also shift camera.position so assertions that read it between
    // frames (or consumers that read it before the next `update()` fires)
    // see a consistent state.
    this.target.x += dx;
    this.target.y += dy;
    this.target.z += dz;
    this.camera.position.x += dx;
    this.camera.position.y += dy;
    this.camera.position.z += dz;
    this.trackedAnchor.copy(worldPos);
  }

  /** Read the currently tracked NAIF id, or `null`. (Test / introspection.) */
  getTrackedId(): number | null {
    return this.trackedId;
  }

  /** Cancel any fly-to animation. The camera stays wherever the cancel fires. */
  cancelFlyTo(): void {
    if (!this.flyToAnimator?.isActive) return;
    this.flyToAnimator.cancel();
    // Re-snapshot spherical from current pose so orbit drag continues cleanly.
    this.resyncSphericalFromCamera();
    const cb = this.onFlyToComplete;
    this.flyToAnimator = null;
    this.onFlyToComplete = undefined;
    cb?.(false);
  }

  /**
   * Advance the controller by `dtSeconds`. Consumers normally pass the
   * render loop's frame delta. Safe to call with dt=0.
   */
  update(dtSeconds: number): void {
    if (this.disposed) return;
    const dt = Math.max(0, dtSeconds);

    if (this.flyToAnimator) {
      const wasActive = this.flyToAnimator.isActive;
      const sample = this.flyToAnimator.advance(dt);
      this.camera.position.copy(sample.cameraPosition);
      this.target.copy(sample.cameraTarget);
      this.camera.up.copy(WORLD_UP);
      this.camera.lookAt(this.target);
      // Clear any stray input accumulated while animating.
      this.pointerDeltaX = 0;
      this.pointerDeltaY = 0;
      this.wheelDelta = 0;

      // T33 — when `durationSec <= 0` (reduced-motion), the animator
      // arrives pre-finished so `wasActive` is false on the first tick.
      // Treat the single-tick "already done" case as a completion so the
      // camera isn't locked to the fly-to sample forever.
      const justFinished = wasActive && !this.flyToAnimator.isActive;
      const preFinished = !wasActive && this.flyToAnimator.state === 'finished';
      if (justFinished || preFinished) {
        // Finished — resnap spherical, fire callback, drop animator.
        this.resyncSphericalFromCamera();
        const cb = this.onFlyToComplete;
        this.flyToAnimator = null;
        this.onFlyToComplete = undefined;
        cb?.(true);
      }
      return;
    }

    if (!this.enabled) return;

    // --- Orbit (left/right drag) ---
    if (this.pointerButtons & (POINTER_BUTTON_LEFT | POINTER_BUTTON_RIGHT)) {
      this.spherical.theta -= this.pointerDeltaX * this.options.orbitSpeed;
      this.spherical.phi -= this.pointerDeltaY * this.options.orbitSpeed;
      this.spherical.phi = THREE.MathUtils.clamp(
        this.spherical.phi,
        this.options.minPolar,
        this.options.maxPolar,
      );
    }

    // --- Middle-drag pan (screen space translation of target+camera) ---
    if (this.pointerButtons & POINTER_BUTTON_MIDDLE) {
      const element = this.domElement;
      const elementHeight = Math.max(1, element.clientHeight);
      // Pixels → world units: we pan a fraction of the viewport proportional
      // to the current orbit radius so dragging feels consistent at any scale.
      const halfFovY = (this.camera.fov * 0.5 * Math.PI) / 180;
      const panScale = (2 * Math.tan(halfFovY) * this.spherical.radius) / elementHeight;

      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      this.camera.matrix.extractBasis(right, up, new THREE.Vector3());

      const offset = new THREE.Vector3()
        .addScaledVector(right, -this.pointerDeltaX * panScale)
        .addScaledVector(up, this.pointerDeltaY * panScale);

      this.target.add(offset);
      this.camera.position.add(offset);
    }

    // --- Wheel dolly (change radius) ---
    if (this.wheelDelta !== 0) {
      const sign = Math.sign(this.wheelDelta);
      const factor = 1 + sign * this.options.zoomSpeed * this.getSpeedMultiplier();
      this.spherical.radius = THREE.MathUtils.clamp(
        this.spherical.radius * factor,
        this.options.minDistance,
        this.options.maxDistance,
      );
    }

    // Apply the (possibly updated) spherical to the camera position.
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.up.copy(WORLD_UP);
    this.camera.lookAt(this.target);

    // --- WASD/QE keyboard translation with exponential damping ---
    const keyboardDesired = this.computeKeyboardDesiredVelocity();
    damp3(this.velocity, keyboardDesired, this.options.dampingLambda, dt);

    if (this.velocity.lengthSq() > 1e-12) {
      const step = this.velocity.clone().multiplyScalar(dt);
      this.camera.position.add(step);
      this.target.add(step);
      const nextOffset = this.camera.position.clone().sub(this.target);
      this.spherical.setFromVector3(nextOffset);
      this.spherical.phi = THREE.MathUtils.clamp(
        this.spherical.phi,
        this.options.minPolar,
        this.options.maxPolar,
      );
    } else if (!this.keys.size) {
      // Tiny residual velocities floor to zero to keep the hot-store stable.
      this.velocity.set(0, 0, 0);
    }

    // Reset per-frame input accumulators.
    this.pointerDeltaX = 0;
    this.pointerDeltaY = 0;
    this.wheelDelta = 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.detachListeners();
    this.keys.clear();
  }

  // -- private -------------------------------------------------------------

  private getSpeedMultiplier(): number {
    let m = 1;
    if (this.shiftHeld) m *= SHIFT_MULTIPLIER;
    if (this.ctrlHeld) m *= CTRL_MULTIPLIER;
    return m;
  }

  private computeKeyboardDesiredVelocity(): THREE.Vector3 {
    const desired = new THREE.Vector3();
    if (this.keys.size === 0) return desired;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-12) {
      // Looking straight up/down — fall back to screen-up as horizontal.
      forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
      forward.y = 0;
    }
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, WORLD_UP).normalize();

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) desired.add(forward);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) desired.sub(forward);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) desired.add(right);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) desired.sub(right);
    if (this.keys.has('KeyE')) desired.add(WORLD_UP);
    if (this.keys.has('KeyQ')) desired.sub(WORLD_UP);

    if (desired.lengthSq() < 1e-12) return desired;
    desired.normalize();
    desired.multiplyScalar(this.options.moveSpeed * this.getSpeedMultiplier());
    return desired;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.shiftHeld = event.shiftKey;
    this.ctrlHeld = event.ctrlKey || event.metaKey;
    if (MOVE_KEYS.has(event.code)) {
      this.keys.add(event.code);
      // Prevent browser from scrolling on arrow keys when the canvas has focus.
      if (event.target === this.domElement) event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.shiftHeld = event.shiftKey;
    this.ctrlHeld = event.ctrlKey || event.metaKey;
    if (MOVE_KEYS.has(event.code)) this.keys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.keys.clear();
    this.pointerButtons = 0;
    this.shiftHeld = false;
    this.ctrlHeld = false;
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.pointerButtons |= buttonBit(event.button);
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.domElement.setPointerCapture?.(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.pointerButtons === 0) return;
    this.pointerDeltaX += event.clientX - this.lastPointerX;
    this.pointerDeltaY += event.clientY - this.lastPointerY;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.pointerButtons &= ~buttonBit(event.button);
    if (this.pointerButtons === 0) {
      this.domElement.releasePointerCapture?.(event.pointerId);
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    // Normalise: 1 notch ≈ ±100 deltaY across browsers. Use sign only so the
    // dolly speed is driven by `zoomSpeed`, not the OS's scroll velocity.
    this.wheelDelta += Math.sign(event.deltaY) || 0;
  };

  private readonly onContextMenu = (event: Event): void => {
    // Right-drag is orbit, so suppress the browser context menu.
    event.preventDefault();
  };

  private attachListeners(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('pointercancel', this.onPointerUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private detachListeners(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointercancel', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }
}

// -- pointer button helpers ------------------------------------------------

const POINTER_BUTTON_LEFT = 1 << 0;
const POINTER_BUTTON_MIDDLE = 1 << 1;
const POINTER_BUTTON_RIGHT = 1 << 2;

function buttonBit(buttonIndex: number): number {
  switch (buttonIndex) {
    case 0:
      return POINTER_BUTTON_LEFT;
    case 1:
      return POINTER_BUTTON_MIDDLE;
    case 2:
      return POINTER_BUTTON_RIGHT;
    default:
      return 0;
  }
}

export const _internals = { POINTER_BUTTON_LEFT, POINTER_BUTTON_MIDDLE, POINTER_BUTTON_RIGHT };
