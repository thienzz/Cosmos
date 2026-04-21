/**
 * Small pub-sub bridge between React UI and the Three.js engine.
 *
 * Problem: React components (InfoPanel, HUD buttons) need to trigger engine
 * imperatives like "fly to this entity" without threading a ref through
 * every wrapper. Doc 27 §6 keeps heavy state in Zustand; ephemeral one-shot
 * commands are a poor fit for stores because they have no steady-state
 * representation — "fly-to just fired" is a transient signal, not a value
 * to read.
 *
 * Solution: a module-scope registry keyed by action name. The engine
 * registers a handler on mount; UI imports a thin `requestFlyTo(...)` wrapper
 * that forwards to the current handler (or no-ops if no engine is mounted —
 * e.g. SSR / unit test without the canvas).
 *
 * We namespace handlers by action name and keep the surface tiny — other
 * tasks (T17 time controls, T18 entity fetch) can register their own.
 */

export interface EngineBridge {
  flyToEntity?: (naifId: number, opts?: { durationSec?: number }) => boolean;
  /**
   * T38 — fly to an arbitrary ICRS J2000.0 sky direction (RA, Dec, distance).
   * Used by search activation when the clicked row is a deep-sky object
   * (Messier, NGC, galaxy, nebula) without a NAIF id. The engine converts to
   * a direction unit vector and places the fly-to target at a scale-regime-
   * appropriate marker distance so the camera rotates to look at the object.
   * Returns `true` on success, `false` if no engine is mounted.
   */
  flyToCelestialCoord?: (
    raDeg: number,
    decDeg: number,
    distancePc: number | null,
    opts?: {
      durationSec?: number;
      label?: string;
      markerColor?: string;
      /**
       * P2F — search-result entity id (e.g. `GAL-m31`, `NEB-m42`, `EXO-sgr-a-star`).
       * When resolvable, the landing-marker renders the entity's procedural
       * shader so the destination frame isn't an empty orb.
       */
      entId?: string;
    },
  ) => boolean;
  cancelFlyTo?: () => void;
  /**
   * T20 — toggle camera tracking on a body (null = disable). Returns `true`
   * if the engine accepted the request (body is in scene or tracking was
   * disabled), `false` if the body isn't known.
   */
  setTrackedEntity?: (naifId: number | null) => boolean;
}

let activeBridge: EngineBridge = {};

/**
 * Install engine-side handlers. Returns an unregister function — the engine
 * should call it from its own `dispose()` to avoid stale references in
 * tests that remount the canvas.
 */
export function registerEngineBridge(bridge: EngineBridge): () => void {
  activeBridge = { ...activeBridge, ...bridge };
  return () => {
    for (const key of Object.keys(bridge) as Array<keyof EngineBridge>) {
      if (activeBridge[key] === bridge[key]) {
        delete activeBridge[key];
      }
    }
  };
}

/** Clear every handler. Useful between tests. */
export function resetEngineBridge(): void {
  activeBridge = {};
}

export function requestFlyToEntity(
  naifId: number,
  opts: { durationSec?: number } = {},
): boolean {
  return activeBridge.flyToEntity?.(naifId, opts) ?? false;
}

export function requestFlyToCelestialCoord(
  raDeg: number,
  decDeg: number,
  distancePc: number | null,
  opts: {
    durationSec?: number;
    label?: string;
    markerColor?: string;
    entId?: string;
  } = {},
): boolean {
  return activeBridge.flyToCelestialCoord?.(raDeg, decDeg, distancePc, opts) ?? false;
}

export function requestCancelFlyTo(): void {
  activeBridge.cancelFlyTo?.();
}

/** T20 — enable or disable tracking on the given body. Null disables. */
export function requestSetTrackedEntity(naifId: number | null): boolean {
  return activeBridge.setTrackedEntity?.(naifId) ?? false;
}

/** Test-only: read the current bridge for assertions. */
export function _getEngineBridge(): EngineBridge {
  return activeBridge;
}
