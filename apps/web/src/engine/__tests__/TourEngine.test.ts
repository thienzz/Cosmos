import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { useCameraStore } from '@/stores/cameraStore';
import { useModeStore } from '@/stores/modeStore';

import { TOUR_J1, TOUR_J2 } from '../tourCatalog';
import { TourEngine } from '../TourEngine';

describe('TourEngine', () => {
  beforeEach(() => {
    useModeStore.getState().resetToDefault();
    useCameraStore.getState().resetToDefault();
  });

  afterEach(() => {
    useModeStore.getState().resetToDefault();
    useCameraStore.getState().resetToDefault();
  });

  function makeEngine(): {
    engine: TourEngine;
    flyTo: ReturnType<typeof vi.fn>;
    cancelFlyTo: ReturnType<typeof vi.fn>;
  } {
    // Note: `ReturnType<typeof vi.fn>` is `Mock<any[], unknown>` which is
    // stricter than the inferred `Mock<[], boolean>` from `vi.fn(() => true)`.
    // Cast explicitly so recent Vitest versions don't trip the covariance
    // check on the return type.
    const flyTo = vi.fn(() => true) as unknown as ReturnType<typeof vi.fn>;
    const cancelFlyTo = vi.fn();
    const engine = new TourEngine({
      flyTo: flyTo as unknown as (
        naifId: number,
        opts: { durationSec?: number },
      ) => boolean,
      cancelFlyTo,
    });
    return { engine, flyTo, cancelFlyTo };
  }

  it('constructing the engine does not dispatch any fly-to', () => {
    const { flyTo, engine } = makeEngine();
    expect(flyTo).not.toHaveBeenCalled();
    engine.dispose();
  });

  it('start(tourId) transitions to guided_tour and dispatches step 0 (TS-MODE-003)', () => {
    const { engine, flyTo } = makeEngine();
    try {
      const ok = engine.start('J2');
      expect(ok).toBe(true);
      expect(useModeStore.getState().activeMode).toBe('guided_tour');
      expect(useModeStore.getState().tourId).toBe('J2');
      expect(useModeStore.getState().tourTotalSteps).toBe(TOUR_J2.waypoints.length);
      expect(flyTo).toHaveBeenCalledTimes(1);
      // J2 step 0 is the Sun (NAIF 10) with an explicit 4-s duration.
      expect(flyTo).toHaveBeenLastCalledWith(10, { durationSec: 4 });
    } finally {
      engine.dispose();
    }
  });

  it('start() rejects unknown tour ids', () => {
    const { engine, flyTo } = makeEngine();
    try {
      const ok = engine.start('NOT-A-TOUR');
      expect(ok).toBe(false);
      expect(flyTo).not.toHaveBeenCalled();
      expect(useModeStore.getState().activeMode).toBe('exploration');
    } finally {
      engine.dispose();
    }
  });

  it('start() is blocked from modes that are not exploration or education', () => {
    const { engine, flyTo } = makeEngine();
    try {
      useModeStore.getState().setMode('research');
      const ok = engine.start('J2');
      // modeStore enforces the Doc 27 §10 gate — the engine forwards the
      // result of the store's acceptance check.
      expect(ok).toBe(false);
      expect(flyTo).not.toHaveBeenCalled();
      expect(useModeStore.getState().activeMode).toBe('research');
    } finally {
      engine.dispose();
    }
  });

  it('next()/prev() advance waypoints and dispatch corresponding fly-tos', () => {
    const { engine, flyTo } = makeEngine();
    try {
      engine.start('J2');
      flyTo.mockClear();

      engine.next();
      expect(useModeStore.getState().tourStep).toBe(1);
      // Mercury (199), no duration override → default fly-to.
      expect(flyTo).toHaveBeenLastCalledWith(199, {});

      engine.next();
      expect(useModeStore.getState().tourStep).toBe(2);
      expect(flyTo).toHaveBeenLastCalledWith(299, {}); // Venus

      engine.prev();
      expect(useModeStore.getState().tourStep).toBe(1);
      expect(flyTo).toHaveBeenLastCalledWith(199, {}); // back to Mercury
    } finally {
      engine.dispose();
    }
  });

  it('next() at the last step is a no-op (store guard + no extra fly-to)', () => {
    const { engine, flyTo } = makeEngine();
    try {
      engine.start('J2');
      for (let i = 0; i < TOUR_J2.waypoints.length + 3; i++) {
        engine.next();
      }
      expect(useModeStore.getState().tourStep).toBe(TOUR_J2.waypoints.length - 1);
      // 1 start + 4 advances = 5 unique fly-tos, no more.
      expect(flyTo).toHaveBeenCalledTimes(TOUR_J2.waypoints.length);
    } finally {
      engine.dispose();
    }
  });

  it('exit() exits the tour without cancelling fly-to when camera is idle', () => {
    const { engine, cancelFlyTo } = makeEngine();
    try {
      engine.start('J1');
      // Camera idle (isTransitioning=false by default in the test setup).
      engine.exit();
      expect(useModeStore.getState().activeMode).toBe('exploration');
      expect(useModeStore.getState().tourId).toBeNull();
      expect(cancelFlyTo).not.toHaveBeenCalled();
    } finally {
      engine.dispose();
    }
  });

  it('exit() cancels an in-flight fly-to so the camera freezes (TS-MODE-004)', () => {
    const { engine, cancelFlyTo } = makeEngine();
    try {
      engine.start('J1');
      // Simulate the animator flagging a transition mid-flight.
      useCameraStore.setState({ isTransitioning: true });
      engine.exit();
      expect(cancelFlyTo).toHaveBeenCalledTimes(1);
    } finally {
      engine.dispose();
    }
  });

  it('switching mode away from guided_tour clears tour state without dispatching', () => {
    const { engine, flyTo } = makeEngine();
    try {
      engine.start('J1');
      flyTo.mockClear();
      useModeStore.getState().setMode('research');
      // Mode-store wipes tour state on exit; TourEngine should not fire
      // any more fly-tos after the transition.
      expect(useModeStore.getState().activeMode).toBe('research');
      expect(useModeStore.getState().tourId).toBeNull();
      expect(flyTo).not.toHaveBeenCalled();
    } finally {
      engine.dispose();
    }
  });

  it('re-entering the same tour after exit replays step 0', () => {
    const { engine, flyTo } = makeEngine();
    try {
      engine.start('J1');
      engine.exit();
      flyTo.mockClear();
      engine.start('J1');
      expect(flyTo).toHaveBeenCalledTimes(1);
      // J1 step 0 is Earth (NAIF 399), no duration override.
      expect(flyTo).toHaveBeenLastCalledWith(399, {});
    } finally {
      engine.dispose();
    }
  });

  it('dispose() drops the subscription so later writes do not dispatch', () => {
    const { engine, flyTo } = makeEngine();
    engine.start('J1');
    flyTo.mockClear();
    engine.dispose();
    useModeStore.getState().nextTourStep();
    expect(flyTo).not.toHaveBeenCalled();
  });

  it('constructing mid-tour does not retrigger a fly-to for the current step', () => {
    // Scenario: SceneManager is torn down + recreated while a tour is
    // active (e.g. context restore). The new engine must *not* bounce the
    // camera by refiring flyTo for the current tourStep.
    useModeStore.getState().startTour('J1', TOUR_J1.waypoints.length);
    useModeStore.getState().nextTourStep(); // step 1

    const flyTo = vi.fn(() => true);
    const engine = new TourEngine({ flyTo });
    try {
      expect(flyTo).not.toHaveBeenCalled();
      // But a new step change still fires.
      useModeStore.getState().nextTourStep();
      expect(flyTo).toHaveBeenCalledTimes(1);
      expect(flyTo).toHaveBeenLastCalledWith(499, {}); // Mars
    } finally {
      engine.dispose();
    }
  });
});
