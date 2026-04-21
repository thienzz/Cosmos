import { useCameraStore } from '@/stores/cameraStore';
import { useModeStore } from '@/stores/modeStore';

import { requestCancelFlyTo, requestFlyToEntity } from './engineBridge';
import { getTourById, type Tour } from './tourCatalog';

/**
 * Drives guided-tour playback (T32, Doc 27 §10).
 *
 * # Role in the pipeline
 *
 * React UI writes `modeStore` (activeMode, tourId, tourStep). TourEngine is
 * the *only* consumer that translates those writes into camera imperatives.
 * On each (tourId, tourStep) tick while `activeMode === 'guided_tour'`, it:
 *
 *   1. Resolves the waypoint at that step from {@link tourCatalog}.
 *   2. Calls {@link requestFlyToEntity} via the engine bridge (registered
 *      by {@link SceneManager}).
 *
 * The TourEngine never mutates camera state directly — it delegates to
 * FlyToAnimator via the existing bridge, so tour flights ride the same
 * Bezier/obstacle-avoidance path as user-initiated fly-tos (Doc 19 §4.2).
 *
 * # Lifecycle
 *
 * Constructed by {@link SceneManager}; receives the modeStore subscription
 * during construction and drops it in {@link dispose}. Safe to construct and
 * dispose repeatedly in tests (no module-level state).
 *
 * # Why a class, not a hook
 *
 * The tour needs to fire side effects regardless of whether a React tree is
 * mounted — e.g. programmatic tour starts in tests, or a URL flag that
 * auto-starts a tour before the React tree hydrates. A class + store
 * subscription works in all of those; a `useEffect` in a hook would skip
 * whenever the tree was absent.
 */

type UnsubFn = () => void;

export interface TourEngineOptions {
  /**
   * Override the fly-to dispatch. Default: {@link requestFlyToEntity}. Unit
   * tests inject a spy here so they don't need to register the bridge
   * themselves.
   */
  flyTo?: (naifId: number, opts: { durationSec?: number }) => boolean;
  /**
   * Override the cancel dispatch. Default: {@link requestCancelFlyTo}.
   * Tour exit mid-flight calls this so the camera doesn't keep flying to
   * the abandoned waypoint. Unit tests also inject spies here.
   */
  cancelFlyTo?: () => void;
}

export class TourEngine {
  private readonly flyTo: (naifId: number, opts: { durationSec?: number }) => boolean;
  private readonly cancelFlyTo: () => void;

  // Last (tourId, tourStep) we dispatched. Lets us dedupe re-subscriptions
  // that fire with identical state (e.g. other fields changing).
  private lastTourId: string | null = null;
  private lastTourStep: number = -1;
  // Whether the previous subscription tick had us inside guided_tour. Used
  // to detect the tour-exit edge (mode != guided_tour now, but was).
  private wasInTour: boolean = false;

  private unsubscribeMode: UnsubFn | null = null;
  private disposed = false;

  constructor(options: TourEngineOptions = {}) {
    this.flyTo = options.flyTo ?? requestFlyToEntity;
    this.cancelFlyTo = options.cancelFlyTo ?? requestCancelFlyTo;

    // Prime dedupe state from the current store snapshot so an engine
    // constructed *while* a tour is already active doesn't immediately fire
    // a fly-to for a step that wasn't changed.
    const snap = useModeStore.getState();
    this.lastTourId = snap.tourId;
    this.lastTourStep = snap.tourStep;
    this.wasInTour = snap.activeMode === 'guided_tour';

    this.unsubscribeMode = useModeStore.subscribe((state) => this.onModeChange(state));
  }

  /** Visible for tests — the current tour resolved from the store. */
  getCurrentTour(): Tour | null {
    const { tourId } = useModeStore.getState();
    return getTourById(tourId);
  }

  /**
   * Programmatic entry used when the user clicks a tour in the launcher.
   * Resets modeStore + seeds the engine dedupe state + triggers the first
   * fly-to. Equivalent to calling `useModeStore.getState().startTour(...)` +
   * letting the subscription handle step 0 — kept as an explicit method so
   * callers don't have to know the store contract.
   */
  start(tourId: string): boolean {
    if (this.disposed) return false;
    const tour = getTourById(tourId);
    if (tour === null) return false;
    useModeStore.getState().startTour(tour.id, tour.waypoints.length);
    // If the startTour transition was accepted, the subscription handler
    // will fire with the new state. No need to drive flyTo manually.
    return useModeStore.getState().activeMode === 'guided_tour';
  }

  /**
   * Same as `modeStore.exitTour()`. The mid-flight fly-to cancel runs inside
   * {@link onModeChange} on the exit edge, so both programmatic exit and
   * the End-Tour button (which writes the store directly) take the same
   * path. Kept as a method for test parity with `start/next/prev`.
   */
  exit(): void {
    if (this.disposed) return;
    useModeStore.getState().exitTour();
  }

  next(): void {
    if (this.disposed) return;
    useModeStore.getState().nextTourStep();
  }

  prev(): void {
    if (this.disposed) return;
    useModeStore.getState().prevTourStep();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeMode?.();
    this.unsubscribeMode = null;
  }

  private onModeChange(state: ReturnType<typeof useModeStore.getState>): void {
    if (this.disposed) return;

    const inTour = state.activeMode === 'guided_tour';

    // Exit edge: dropped out of guided_tour this tick. Clear dedupe state so
    // a re-entry into the same tour re-plays from step 0.
    //
    // Also cancel any in-flight fly-to so the camera freezes at its current
    // position rather than coasting to the abandoned waypoint. This matches
    // TS-MODE-004. We do it here (on the subscription edge) rather than in
    // `exit()` so the user-clicked End-Tour button — which writes
    // `modeStore.exitTour()` directly — takes the same cancel path as the
    // programmatic `engine.exit()`.
    if (this.wasInTour && !inTour) {
      this.wasInTour = false;
      this.lastTourId = null;
      this.lastTourStep = -1;
      if (useCameraStore.getState().isTransitioning) {
        this.cancelFlyTo();
      }
      return;
    }

    if (!inTour) return;

    // Entry edge: tour just started — always dispatch step 0 (even if
    // `tourStep === this.lastTourStep === 0` because `lastTourId` differs).
    const idChanged = state.tourId !== this.lastTourId;
    const stepChanged = state.tourStep !== this.lastTourStep;
    if (!idChanged && !stepChanged) {
      this.wasInTour = true;
      return;
    }

    const tour = getTourById(state.tourId);
    if (tour === null) {
      // Defensive: tour id doesn't exist in catalog. Mode store has no
      // validator, so guard here.
      this.wasInTour = true;
      this.lastTourId = state.tourId;
      this.lastTourStep = state.tourStep;
      return;
    }

    const waypoint = tour.waypoints[state.tourStep];
    if (waypoint !== undefined) {
      const opts: { durationSec?: number } =
        waypoint.durationSec !== undefined ? { durationSec: waypoint.durationSec } : {};
      this.flyTo(waypoint.naifId, opts);
    }

    this.lastTourId = state.tourId;
    this.lastTourStep = state.tourStep;
    this.wasInTour = true;
  }
}
