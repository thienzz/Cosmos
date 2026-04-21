import { beforeEach, describe, expect, it } from 'vitest';

import { CAMERA_DEFAULT_STATE, useCameraStore } from '../cameraStore.js';

describe('cameraStore', () => {
  beforeEach(() => {
    useCameraStore.getState().resetToDefault();
  });

  it('starts with the default ICRS camera state', () => {
    const state = useCameraStore.getState();
    expect(state.position).toEqual(CAMERA_DEFAULT_STATE.position);
    expect(state.rotation).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    expect(state.fov).toBe(60);
    expect(state.scaleRegime).toBe('solar_system');
    expect(state.isTransitioning).toBe(false);
    expect(state.targetEntityId).toBeNull();
  });

  it('setPosition / setRotation / setFov / setVelocity update hot state', () => {
    const store = useCameraStore.getState();
    store.setPosition({ x: 1, y: 2, z: 3 });
    store.setRotation({ x: 0.1, y: 0.2, z: 0.3, w: 0.924 });
    store.setFov(45);
    store.setVelocity({ x: 0.5, y: 0, z: 0 });
    const state = useCameraStore.getState();
    expect(state.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(state.rotation.w).toBeCloseTo(0.924, 3);
    expect(state.fov).toBe(45);
    expect(state.velocity.x).toBe(0.5);
  });

  it('setScaleRegime accepts all four regimes', () => {
    const { setScaleRegime } = useCameraStore.getState();
    for (const regime of ['solar_system', 'stellar', 'galactic', 'cosmic'] as const) {
      setScaleRegime(regime);
      expect(useCameraStore.getState().scaleRegime).toBe(regime);
    }
  });

  it('flyTo moves to target, flags transition, and clears entity focus', () => {
    const store = useCameraStore.getState();
    store.orbitAround(42, 1.5); // Pre-seed a focus to verify it clears.
    store.flyTo({ x: 10, y: 20, z: 30 }, 1500);
    const state = useCameraStore.getState();
    expect(state.position).toEqual({ x: 10, y: 20, z: 30 });
    expect(state.isTransitioning).toBe(true);
    expect(state.targetEntityId).toBeNull();
  });

  it('orbitAround stores focus entity and radius', () => {
    useCameraStore.getState().orbitAround(7, 2.5);
    const state = useCameraStore.getState();
    expect(state.targetEntityId).toBe(7);
    expect(state.targetDistance).toBe(2.5);
  });

  it('resetToDefault restores initial values after mutations', () => {
    const store = useCameraStore.getState();
    store.setPosition({ x: 999, y: 999, z: 999 });
    store.setFov(30);
    store.orbitAround(1, 1);
    store.resetToDefault();
    const state = useCameraStore.getState();
    expect(state.position).toEqual(CAMERA_DEFAULT_STATE.position);
    expect(state.fov).toBe(CAMERA_DEFAULT_STATE.fov);
    expect(state.targetEntityId).toBeNull();
    expect(state.trackedEntityId).toBeNull();
  });

  it('setTrackedEntity toggles the tracked NAIF id and resets to null', () => {
    const store = useCameraStore.getState();
    expect(useCameraStore.getState().trackedEntityId).toBeNull();

    store.setTrackedEntity(399);
    expect(useCameraStore.getState().trackedEntityId).toBe(399);

    store.setTrackedEntity(499);
    expect(useCameraStore.getState().trackedEntityId).toBe(499);

    store.setTrackedEntity(null);
    expect(useCameraStore.getState().trackedEntityId).toBeNull();
  });
});
