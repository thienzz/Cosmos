import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PickingController } from '../PickingController';

/**
 * Picking tests don't run a WebGL context — they exercise the raycaster
 * math directly. We build a tiny scene (one mesh at origin) and dispatch
 * PointerEvents on a stub canvas that returns a fixed bounding rect.
 */

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // jsdom's getBoundingClientRect returns zeros by default; stub it.
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      width,
      height,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    }),
  });
  return canvas;
}

function cameraLookingAtOrigin(): THREE.PerspectiveCamera {
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  cam.position.set(0, 0, 5);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld(true);
  return cam;
}

function makeTaggedMesh(naifId: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshBasicMaterial(),
  );
  mesh.userData = { naifId, pickable: true };
  mesh.updateMatrixWorld(true);
  return mesh;
}

describe('PickingController', () => {
  let canvas: HTMLCanvasElement;
  let camera: THREE.PerspectiveCamera;
  let controller: PickingController;

  beforeEach(() => {
    canvas = makeCanvas(100, 100);
    camera = cameraLookingAtOrigin();
  });

  afterEach(() => {
    controller?.dispose();
  });

  it('pickAtClientXY returns naifId for the nearest tagged mesh', () => {
    const mesh = makeTaggedMesh(599);
    controller = new PickingController(camera, canvas);
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    // Center of the canvas → ray straight through origin → hits sphere at z=0.
    const { naifId, hit } = controller.pickAtClientXY(50, 50);
    expect(naifId).toBe(599);
    expect(hit).not.toBeNull();
  });

  it('pickAtClientXY returns null when the ray misses every mesh', () => {
    const mesh = makeTaggedMesh(599);
    mesh.position.set(50, 0, 0); // far away from where the ray points
    mesh.updateMatrixWorld(true);

    controller = new PickingController(camera, canvas);
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    const { naifId, hit } = controller.pickAtClientXY(50, 50);
    expect(naifId).toBeNull();
    expect(hit).toBeNull();
  });

  it('pickAtClientXY returns null when no owner is attached', () => {
    controller = new PickingController(camera, canvas);
    const { naifId } = controller.pickAtClientXY(50, 50);
    expect(naifId).toBeNull();
  });

  it('fires onPick when pointerup is within drag threshold', () => {
    const mesh = makeTaggedMesh(199); // Mercury
    const onPick = vi.fn();
    controller = new PickingController(camera, canvas, { onPick });
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 50, clientY: 50, button: 0 }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 51, clientY: 51, button: 0 }),
    );

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0]?.[0]).toBe(199);
  });

  it('suppresses onPick when pointer travel exceeds drag threshold (orbit drag)', () => {
    const mesh = makeTaggedMesh(199);
    const onPick = vi.fn();
    controller = new PickingController(camera, canvas, { onPick, dragThresholdPx: 4 });
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 50, clientY: 50, button: 0 }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 80, clientY: 80, button: 0 }),
    );

    expect(onPick).not.toHaveBeenCalled();
  });

  it('ignores non-primary buttons', () => {
    const mesh = makeTaggedMesh(199);
    const onPick = vi.fn();
    controller = new PickingController(camera, canvas, { onPick });
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 50, clientY: 50, button: 2 }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 50, clientY: 50, button: 2 }),
    );

    expect(onPick).not.toHaveBeenCalled();
  });

  it('fires onHover when pointer enters a mesh then null when it leaves', () => {
    const mesh = makeTaggedMesh(399); // Earth
    const onHover = vi.fn();
    controller = new PickingController(camera, canvas, {
      onHover,
      hoverThrottleMs: 0, // disable throttle for deterministic test
    });
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(onHover).toHaveBeenCalledWith(399, expect.anything());

    // Move pointer far away — still within canvas — ray misses the sphere.
    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 95, clientY: 5 }));
    expect(onHover).toHaveBeenLastCalledWith(null, null);
  });

  it('clears hover state on pointerleave', () => {
    const mesh = makeTaggedMesh(399);
    const onHover = vi.fn();
    controller = new PickingController(camera, canvas, { onHover, hoverThrottleMs: 0 });
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(onHover).toHaveBeenLastCalledWith(399, expect.anything());

    canvas.dispatchEvent(new PointerEvent('pointerleave', { clientX: 0, clientY: 0 }));
    expect(onHover).toHaveBeenLastCalledWith(null, null);
  });

  it('sets cursor to pointer over a pickable mesh', () => {
    const mesh = makeTaggedMesh(399);
    controller = new PickingController(camera, canvas, {
      onHover: () => {},
      hoverThrottleMs: 0,
    });
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
    expect(canvas.style.cursor).toBe('pointer');

    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 95, clientY: 5 }));
    expect(canvas.style.cursor).toBe('');
  });

  it('dispose() removes listeners and stops firing callbacks', () => {
    const mesh = makeTaggedMesh(399);
    const onPick = vi.fn();
    controller = new PickingController(camera, canvas, { onPick });
    controller.setPickableOwner({ getPickableMeshes: () => [mesh] });

    controller.dispose();

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 50, clientY: 50, button: 0 }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 50, clientY: 50, button: 0 }),
    );
    expect(onPick).not.toHaveBeenCalled();
  });
});
