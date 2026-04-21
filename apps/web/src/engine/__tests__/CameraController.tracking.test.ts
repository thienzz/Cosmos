import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CameraController } from '../CameraController';

/**
 * T20 — CameraController.syncTracking
 *
 * Verifies the Δ-shift tracking keeps the camera's spherical offset
 * relative to the body constant as the body moves in world space, across
 * the four states defined in `syncTracking()`:
 *
 *   1. First call / id change → baseline anchor, no shift.
 *   2. Delta frame → `target` (and camera.position) shift by body Δ.
 *   3. Fly-to active → re-baseline only, no shift (fly-to owns camera).
 *   4. Disable → clears anchor; re-enabling next frame baselines from
 *      scratch (no phantom delta from the old anchor).
 */

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
  Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });
  document.body.appendChild(canvas);
  return canvas;
}

function setup(): {
  canvas: HTMLCanvasElement;
  camera: PerspectiveCamera;
  controller: CameraController;
} {
  const canvas = makeCanvas();
  const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1000);
  camera.position.set(0, 0, 50);
  camera.lookAt(0, 0, 0);
  const controller = new CameraController(camera, canvas, {
    moveSpeed: 10,
    dampingLambda: 5,
    zoomSpeed: 0.1,
    orbitSpeed: 0.005,
  });
  return { canvas, camera, controller };
}

describe('CameraController.syncTracking', () => {
  let harness: ReturnType<typeof setup>;

  beforeEach(() => {
    harness = setup();
  });

  afterEach(() => {
    harness.controller.dispose();
    harness.canvas.remove();
  });

  it('first call baselines the anchor without shifting the camera', () => {
    const { camera, controller } = harness;
    const posBefore = camera.position.clone();
    const targetBefore = controller.target.clone();

    controller.syncTracking(399, new Vector3(20, 0, 0));

    expect(camera.position.equals(posBefore)).toBe(true);
    expect(controller.target.equals(targetBefore)).toBe(true);
    expect(controller.getTrackedId()).toBe(399);
  });

  it('subsequent call shifts target by body Δ-position (delta frame)', () => {
    const { controller } = harness;
    const targetBefore = controller.target.clone();

    controller.syncTracking(399, new Vector3(20, 0, 0));
    controller.syncTracking(399, new Vector3(25, 1, -3));

    const delta = new Vector3(5, 1, -3);
    expect(controller.target.x).toBeCloseTo(targetBefore.x + delta.x, 6);
    expect(controller.target.y).toBeCloseTo(targetBefore.y + delta.y, 6);
    expect(controller.target.z).toBeCloseTo(targetBefore.z + delta.z, 6);
  });

  it('preserves spherical offset between camera and target across shifts', () => {
    const { camera, controller } = harness;
    const initialOffset = camera.position.clone().sub(controller.target);

    controller.syncTracking(399, new Vector3(20, 0, 0));
    controller.syncTracking(399, new Vector3(30, 5, -2));

    const newOffset = camera.position.clone().sub(controller.target);
    expect(newOffset.x).toBeCloseTo(initialOffset.x, 6);
    expect(newOffset.y).toBeCloseTo(initialOffset.y, 6);
    expect(newOffset.z).toBeCloseTo(initialOffset.z, 6);
  });

  it('changing tracked id re-baselines and does not apply a phantom delta', () => {
    const { controller } = harness;
    const targetBefore = controller.target.clone();

    // Track body A, a few frames of motion.
    controller.syncTracking(399, new Vector3(10, 0, 0));
    controller.syncTracking(399, new Vector3(12, 0, 0));
    // Switch to body B — new anchor; the (12 vs 30) delta must NOT apply.
    controller.syncTracking(499, new Vector3(30, 0, 0));

    // After only-2-frames of body A motion the target has moved by +2 in X.
    expect(controller.target.x).toBeCloseTo(targetBefore.x + 2, 6);

    // A subsequent body-B frame applies B's delta relative to B's own anchor.
    controller.syncTracking(499, new Vector3(31, 0, 0));
    expect(controller.target.x).toBeCloseTo(targetBefore.x + 2 + 1, 6);
    expect(controller.getTrackedId()).toBe(499);
  });

  it('passing null clears the anchor and reports no tracked id', () => {
    const { controller } = harness;
    controller.syncTracking(399, new Vector3(20, 0, 0));
    controller.syncTracking(null, null);
    expect(controller.getTrackedId()).toBeNull();

    // Re-enable with a different-looking position — no shift must fire
    // because the anchor was cleared.
    const targetBefore = controller.target.clone();
    controller.syncTracking(399, new Vector3(100, 100, 100));
    expect(controller.target.equals(targetBefore)).toBe(true);
  });

  it('during fly-to, anchor re-baselines but target is NOT shifted', () => {
    const { controller } = harness;
    const targetBefore = controller.target.clone();

    // Kick off a fly-to (fly-to owner) — tracking should be inert.
    controller.flyTo({
      endTarget: new Vector3(200, 0, 0),
      orbitDistance: 5,
      durationSec: 2,
    });
    expect(controller.isFlyingTo()).toBe(true);

    // Two tracking frames with 10u of motion — target must stay put.
    controller.syncTracking(399, new Vector3(20, 0, 0));
    controller.syncTracking(399, new Vector3(30, 0, 0));

    // Fly-to moves the target toward endTarget — but none of that movement
    // is driven by tracking.  We check that tracking did not add the +10
    // delta from the two syncTracking calls.
    expect(controller.target.x - targetBefore.x).toBeLessThan(10); // not +10 from tracking
    // Anchor should have re-baselined to (30,0,0), so when fly-to ends the
    // next tracking frame applies the delta from THAT anchor, not (20,0,0).
    // We advance past fly-to duration then assert next sync doesn't inject a 10u shift.
    for (let i = 0; i < 20; i++) controller.update(0.2);
    expect(controller.isFlyingTo()).toBe(false);

    const postFlyTarget = controller.target.clone();
    controller.syncTracking(399, new Vector3(31, 0, 0));
    expect(controller.target.x - postFlyTarget.x).toBeCloseTo(1, 6);
  });

  it('tiny deltas below the 1e-7 threshold are ignored', () => {
    const { controller } = harness;
    controller.syncTracking(399, new Vector3(10, 0, 0));
    const targetBefore = controller.target.clone();
    controller.syncTracking(399, new Vector3(10, 0, 0 + 1e-9));
    expect(controller.target.equals(targetBefore)).toBe(true);
  });
});
