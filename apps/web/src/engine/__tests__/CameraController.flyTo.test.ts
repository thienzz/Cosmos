import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CameraController } from '../CameraController';

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

describe('CameraController.flyTo', () => {
  let harness: ReturnType<typeof setup>;

  beforeEach(() => {
    harness = setup();
  });

  afterEach(() => {
    harness.controller.dispose();
    harness.canvas.remove();
  });

  it('isFlyingTo is false before flyTo is called', () => {
    expect(harness.controller.isFlyingTo()).toBe(false);
  });

  it('isFlyingTo becomes true after flyTo and false when finished', () => {
    const { controller } = harness;
    controller.flyTo({
      endTarget: new Vector3(100, 0, 0),
      orbitDistance: 5,
      durationSec: 1,
    });
    expect(controller.isFlyingTo()).toBe(true);

    // Advance past duration in a handful of frames.
    for (let i = 0; i < 10; i++) controller.update(0.2);
    expect(controller.isFlyingTo()).toBe(false);
  });

  it('camera ends near (endTarget + orbitDistance * approachDir)', () => {
    const { camera, controller } = harness;
    controller.flyTo({
      endTarget: new Vector3(100, 0, 0),
      orbitDistance: 5,
      durationSec: 1,
    });
    for (let i = 0; i < 10; i++) controller.update(0.2);
    const d = camera.position.distanceTo(new Vector3(100, 0, 0));
    expect(d).toBeCloseTo(5, 1);
  });

  it('target is updated to the new endTarget', () => {
    const { controller } = harness;
    controller.flyTo({
      endTarget: new Vector3(100, 0, 0),
      orbitDistance: 5,
      durationSec: 1,
    });
    for (let i = 0; i < 10; i++) controller.update(0.2);
    expect(controller.target.distanceTo(new Vector3(100, 0, 0))).toBeCloseTo(0, 3);
  });

  it('fires onComplete(true) when animation finishes', () => {
    const onComplete = vi.fn();
    harness.controller.flyTo(
      {
        endTarget: new Vector3(100, 0, 0),
        orbitDistance: 5,
        durationSec: 1,
      },
      onComplete,
    );
    for (let i = 0; i < 10; i++) harness.controller.update(0.2);
    expect(onComplete).toHaveBeenCalledWith(true);
  });

  it('cancelFlyTo halts the animation and fires onComplete(false)', () => {
    const onComplete = vi.fn();
    const { controller } = harness;
    controller.flyTo(
      {
        endTarget: new Vector3(100, 0, 0),
        orbitDistance: 5,
        durationSec: 5,
      },
      onComplete,
    );
    controller.update(0.2);
    controller.cancelFlyTo();
    expect(onComplete).toHaveBeenCalledWith(false);
    expect(controller.isFlyingTo()).toBe(false);
  });

  it('starting a new flyTo while one is in progress cancels the previous', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { controller } = harness;
    controller.flyTo(
      { endTarget: new Vector3(100, 0, 0), orbitDistance: 5, durationSec: 5 },
      first,
    );
    controller.update(0.1);
    controller.flyTo(
      { endTarget: new Vector3(-100, 0, 0), orbitDistance: 5, durationSec: 5 },
      second,
    );
    expect(first).toHaveBeenCalledWith(false);
    expect(second).not.toHaveBeenCalled();
  });

  it('computes duration automatically if omitted', () => {
    const { controller } = harness;
    controller.flyTo({
      endTarget: new Vector3(150, 0, 0),
      orbitDistance: 5,
    });
    // With default easing, reaching completion needs at least computeFlyDuration(150) ~2.5-3s.
    controller.update(1); // should still be animating
    expect(controller.isFlyingTo()).toBe(true);
    controller.update(5);
    expect(controller.isFlyingTo()).toBe(false);
  });

  // T33 — Doc 16 §Reduced Motion. When a fly-to is requested with
  // `durationSec=0` the animator arrives pre-finished; the controller
  // must (a) snap the camera to the approach point on the first update
  // tick, (b) fire `onComplete(true)`, and (c) drop the animator so
  // subsequent input isn't frozen in fly-to-sample mode.
  it('TS-A11Y-003: durationSec=0 snaps + completes on the first update tick', () => {
    const { controller, camera } = harness;
    const onComplete = vi.fn();
    controller.flyTo(
      {
        endTarget: new Vector3(100, 0, 0),
        orbitDistance: 5,
        durationSec: 0,
      },
      onComplete,
    );
    expect(controller.isFlyingTo()).toBe(false);
    controller.update(0.016);
    expect(onComplete).toHaveBeenCalledWith(true);
    expect(controller.isFlyingTo()).toBe(false);
    // Camera landed near the approach point (≈ endTarget + unit × orbitDistance).
    const d = camera.position.distanceTo(new Vector3(100, 0, 0));
    expect(d).toBeCloseTo(5, 1);
    // Animator has been dropped — a second update must NOT refire the callback.
    controller.update(0.016);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not advance via WASD / pointer input during the flight', () => {
    const { camera, controller } = harness;
    controller.flyTo({
      endTarget: new Vector3(0, 0, 0),
      orbitDistance: 10,
      durationSec: 10,
    });
    // Simulate a W key press; during flyTo the keyboard should be gated.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' }));
    const posBefore = camera.position.clone();
    controller.update(0.05);
    const posAfterSmall = camera.position.clone();
    // Movement should be smooth fly-to, not WASD burst. The delta is driven
    // purely by the Bezier sample and stays small over a 10 s duration.
    expect(posBefore.distanceTo(posAfterSmall)).toBeLessThan(1);
  });
});
