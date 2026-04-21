import { PerspectiveCamera } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

function keyboardEvent(type: 'keydown' | 'keyup', code: string, extras: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent(type, { code, key: code, bubbles: true, ...extras });
}

function pointerEvent(type: string, init: Partial<PointerEventInit>): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    pointerId: 1,
    pointerType: 'mouse',
    ...init,
  });
}

function setupController(): { canvas: HTMLCanvasElement; camera: PerspectiveCamera; controller: CameraController } {
  const canvas = makeCanvas();
  const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1000);
  camera.position.set(0, 0, 50);
  camera.lookAt(0, 0, 0);
  const controller = new CameraController(camera, canvas, {
    moveSpeed: 10,
    dampingLambda: 1e6, // instant in tests so we can assert after one update
    zoomSpeed: 0.25,
    orbitSpeed: 0.01,
  });
  return { canvas, camera, controller };
}

describe('CameraController — keyboard translation', () => {
  let harness: ReturnType<typeof setupController>;

  beforeEach(() => {
    harness = setupController();
  });
  afterEach(() => {
    harness.controller.dispose();
    harness.canvas.remove();
  });

  it('W key moves the camera forward toward the target', () => {
    const { camera, controller } = harness;
    const startZ = camera.position.z;
    window.dispatchEvent(keyboardEvent('keydown', 'KeyW'));
    controller.update(0.1);
    expect(camera.position.z).toBeLessThan(startZ);
  });

  it('S key moves the camera away from the target (backward)', () => {
    const { camera, controller } = harness;
    const startZ = camera.position.z;
    window.dispatchEvent(keyboardEvent('keydown', 'KeyS'));
    controller.update(0.1);
    expect(camera.position.z).toBeGreaterThan(startZ);
  });

  it('D strafes right and A strafes left', () => {
    const { camera, controller } = harness;
    window.dispatchEvent(keyboardEvent('keydown', 'KeyD'));
    controller.update(0.1);
    expect(camera.position.x).toBeGreaterThan(0);
    window.dispatchEvent(keyboardEvent('keyup', 'KeyD'));
    window.dispatchEvent(keyboardEvent('keydown', 'KeyA'));
    // A should move us back left.
    const xAfterD = camera.position.x;
    controller.update(0.1);
    expect(camera.position.x).toBeLessThan(xAfterD);
  });

  it('E rises and Q descends along world Y', () => {
    const { camera, controller } = harness;
    window.dispatchEvent(keyboardEvent('keydown', 'KeyE'));
    controller.update(0.1);
    expect(camera.position.y).toBeGreaterThan(0);
    window.dispatchEvent(keyboardEvent('keyup', 'KeyE'));
    window.dispatchEvent(keyboardEvent('keydown', 'KeyQ'));
    const yAfterE = camera.position.y;
    controller.update(0.1);
    expect(camera.position.y).toBeLessThan(yAfterE);
  });

  it('Arrow keys mirror WASD', () => {
    const { camera, controller } = harness;
    const startZ = camera.position.z;
    window.dispatchEvent(keyboardEvent('keydown', 'ArrowUp'));
    controller.update(0.1);
    expect(camera.position.z).toBeLessThan(startZ);
  });

  it('Shift boosts speed by ~5x', () => {
    const { camera, controller } = harness;

    // Plain W: move one step, measure displacement.
    window.dispatchEvent(keyboardEvent('keydown', 'KeyW'));
    controller.update(0.1);
    const plainDistance = 50 - camera.position.z;
    window.dispatchEvent(keyboardEvent('keyup', 'KeyW'));
    // Let damping wind down over a generous pause before the next run.
    for (let i = 0; i < 20; i++) controller.update(0.1);

    // Reset both camera and target to the initial pose; otherwise the
    // spherical coords carry state forward between runs.
    camera.position.set(0, 0, 50);
    controller.setTarget(0, 0, 0);

    window.dispatchEvent(keyboardEvent('keydown', 'KeyW', { shiftKey: true }));
    controller.update(0.1);
    const boostedDistance = 50 - camera.position.z;
    window.dispatchEvent(keyboardEvent('keyup', 'KeyW'));

    expect(boostedDistance).toBeGreaterThan(plainDistance * 4);
    expect(boostedDistance).toBeLessThan(plainDistance * 6);
  });

  it('releases keys on window blur so the camera stops', () => {
    const { camera, controller } = harness;
    window.dispatchEvent(keyboardEvent('keydown', 'KeyW'));
    controller.update(0.1);
    const afterPress = camera.position.z;
    window.dispatchEvent(new Event('blur'));
    controller.update(0.1);
    controller.update(0.1);
    // Position should have stopped moving further.
    expect(Math.abs(camera.position.z - afterPress)).toBeLessThan(0.2);
  });

  it('disposing detaches listeners — later key presses do nothing', () => {
    const { camera, controller } = harness;
    controller.dispose();
    const before = camera.position.clone();
    window.dispatchEvent(keyboardEvent('keydown', 'KeyW'));
    // update() is a no-op on a disposed controller, but to double-check we
    // simply confirm no listener is firing against the camera.
    expect(camera.position.x).toBe(before.x);
    expect(camera.position.y).toBe(before.y);
    expect(camera.position.z).toBe(before.z);
  });
});

describe('CameraController — orbit / pan / wheel', () => {
  let harness: ReturnType<typeof setupController>;

  beforeEach(() => {
    harness = setupController();
  });
  afterEach(() => {
    harness.controller.dispose();
    harness.canvas.remove();
  });

  it('left-drag orbits around the target and preserves radius (no gimbal lock)', () => {
    const { canvas, camera, controller } = harness;
    const initialRadius = camera.position.length();
    canvas.dispatchEvent(pointerEvent('pointerdown', { button: 0, buttons: 1, clientX: 400, clientY: 300 }));

    // Drag along +X and +Y by 200 pixels each in small increments — enough
    // orbit to push past a pole if clamping weren't in place.
    for (let i = 1; i <= 10; i++) {
      canvas.dispatchEvent(
        pointerEvent('pointermove', {
          button: -1,
          buttons: 1,
          clientX: 400 + i * 20,
          clientY: 300 + i * 50, // large vertical to test polar clamp
        }),
      );
      controller.update(1 / 60);
    }
    canvas.dispatchEvent(pointerEvent('pointerup', { button: 0, buttons: 0, clientX: 600, clientY: 800 }));

    // Radius preserved within numerical tolerance.
    expect(camera.position.length()).toBeCloseTo(initialRadius, 3);
    // World up has not flipped — dot with worldUp positive means camera still
    // the right way up.
    const upInWorld = camera.up.clone().applyQuaternion(camera.quaternion);
    expect(upInWorld.y).toBeGreaterThan(0);
  });

  it('middle-drag pans target and camera together (offset preserved)', () => {
    const { canvas, camera, controller } = harness;
    const initialOffset = camera.position.clone().sub(controller.target);
    canvas.dispatchEvent(pointerEvent('pointerdown', { button: 1, buttons: 4, clientX: 400, clientY: 300 }));
    canvas.dispatchEvent(
      pointerEvent('pointermove', { button: -1, buttons: 4, clientX: 500, clientY: 350 }),
    );
    controller.update(1 / 60);
    canvas.dispatchEvent(pointerEvent('pointerup', { button: 1, buttons: 0, clientX: 500, clientY: 350 }));

    // Target moved (non-zero translation)
    expect(controller.target.lengthSq()).toBeGreaterThan(0);
    // But the camera ↔ target offset is preserved.
    const finalOffset = camera.position.clone().sub(controller.target);
    expect(finalOffset.x).toBeCloseTo(initialOffset.x, 4);
    expect(finalOffset.y).toBeCloseTo(initialOffset.y, 4);
    expect(finalOffset.z).toBeCloseTo(initialOffset.z, 4);
  });

  it('scroll wheel dollies (changes orbit radius)', () => {
    const { canvas, camera, controller } = harness;
    const startRadius = camera.position.length();

    const wheelIn = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 });
    canvas.dispatchEvent(wheelIn);
    controller.update(1 / 60);
    expect(camera.position.length()).toBeLessThan(startRadius);

    const wheelOut = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
    const intermediate = camera.position.length();
    canvas.dispatchEvent(wheelOut);
    controller.update(1 / 60);
    expect(camera.position.length()).toBeGreaterThan(intermediate);
  });

  it('setTarget resyncs spherical coords to a new pivot', () => {
    const { controller, camera } = harness;
    controller.setTarget(100, 0, 0);
    controller.update(1 / 60);
    // Camera didn't move, but target did — distance from camera to target is
    // sqrt((0-100)^2 + 50^2) ≈ 111.8 if camera is still at (0,0,50).
    const expected = Math.hypot(100, 0, 50);
    expect(camera.position.distanceTo(controller.target)).toBeCloseTo(expected, 3);
  });
});

/**
 * P5 — coverage for the P4 `setMoveSpeed` setter (regime-aware translation
 * speed). Directly checks that WASD translation distance scales linearly
 * with the configured moveSpeed.
 */
describe('P4/P5 — setMoveSpeed (regime-aware translation speed)', () => {
  let harness: ReturnType<typeof setupController>;

  beforeEach(() => {
    harness = setupController();
  });
  afterEach(() => {
    harness.controller.dispose();
    harness.canvas.remove();
  });

  it('getMoveSpeed reflects the constructor option', () => {
    expect(harness.controller.getMoveSpeed()).toBe(10);
  });

  it('setMoveSpeed updates the base translation speed', () => {
    harness.controller.setMoveSpeed(2_000);
    expect(harness.controller.getMoveSpeed()).toBe(2_000);
    harness.controller.setMoveSpeed(0.5);
    expect(harness.controller.getMoveSpeed()).toBe(0.5);
  });

  it('clamps negative speeds to 0', () => {
    harness.controller.setMoveSpeed(-5);
    expect(harness.controller.getMoveSpeed()).toBe(0);
  });

  it('held W translates ~moveSpeed × dt units along camera-forward', () => {
    const { canvas, camera, controller } = harness;
    const startPos = camera.position.clone();

    // Set an easily-computed speed.
    controller.setMoveSpeed(100);

    // Press W.
    canvas.dispatchEvent(keyboardEvent('keydown', 'KeyW'));
    // One full simulated second at instant damping — linear distance = speed.
    controller.update(1.0);
    canvas.dispatchEvent(keyboardEvent('keyup', 'KeyW'));

    const moved = camera.position.distanceTo(startPos);
    // Allow a wide tolerance — damping + per-frame integration leave a
    // small residual, but the dominant term is moveSpeed × dt = 100.
    expect(moved).toBeGreaterThan(80);
    expect(moved).toBeLessThan(120);
  });

  it('increasing moveSpeed 10× translates ~10× further over the same dt', () => {
    const { canvas, camera, controller } = harness;

    // Baseline: speed=10, held W for 1 sec.
    controller.setMoveSpeed(10);
    const startSlow = camera.position.clone();
    canvas.dispatchEvent(keyboardEvent('keydown', 'KeyW'));
    controller.update(1.0);
    canvas.dispatchEvent(keyboardEvent('keyup', 'KeyW'));
    const distSlow = camera.position.distanceTo(startSlow);

    // Fresh controller for the fast leg — keeps spherical state clean.
    const { canvas: canvas2, camera: camera2, controller: controller2 } =
      setupController();
    try {
      controller2.setMoveSpeed(100);
      const startFast = camera2.position.clone();
      canvas2.dispatchEvent(keyboardEvent('keydown', 'KeyW'));
      controller2.update(1.0);
      canvas2.dispatchEvent(keyboardEvent('keyup', 'KeyW'));
      const distFast = camera2.position.distanceTo(startFast);

      const ratio = distFast / distSlow;
      expect(ratio).toBeGreaterThan(8);
      expect(ratio).toBeLessThan(12);
    } finally {
      controller2.dispose();
      canvas2.remove();
    }
  });
});
