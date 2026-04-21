import type { Quaternion, Vec3 } from '@cosmos/shared-types';
import { create } from 'zustand';

import type { ScaleRegime } from './types.js';

/**
 * Hot state: read via `useCameraStore.getState()` in the render loop and
 * written by the engine every frame. React consumers should subscribe with a
 * 100ms throttle or a custom equality function (Doc 27 §6.3).
 *
 * Source: Doc 27 §5.1.
 */
export interface CameraState {
  /** ICRS Cartesian. Units depend on scale regime (AU ≤ parsecs ≤ Mpc). */
  position: Vec3;
  rotation: Quaternion;
  /** Field of view in degrees (perspective camera). */
  fov: number;
  /** Distance to the focal target in the active regime's unit. */
  targetDistance: number;
  /** Focal entity ID; null when the camera is free-flying. */
  targetEntityId: number | null;
  /**
   * T20 — entity the camera is actively tracking (keeps relative orbit pose
   * as the body moves in time). `null` when tracking is disabled. Doc 19
   * §3.3 "Track selected object option". Distinct from `targetEntityId`
   * which is only set during a fly-to animation.
   */
  trackedEntityId: number | null;
  scaleRegime: ScaleRegime;
  /** Camera velocity in world units per simulation second. */
  velocity: Vec3;
  /** True during a fly-to animation. */
  isTransitioning: boolean;

  // Actions
  setPosition: (pos: Vec3) => void;
  setRotation: (rot: Quaternion) => void;
  setFov: (fov: number) => void;
  setVelocity: (velocity: Vec3) => void;
  setScaleRegime: (regime: ScaleRegime) => void;
  flyTo: (target: Vec3, duration: number) => void;
  orbitAround: (entityId: number, radius: number) => void;
  /** Enable tracking a body by NAIF id, or `null` to stop tracking. */
  setTrackedEntity: (entityId: number | null) => void;
  resetToDefault: () => void;
}

const IDENTITY_QUAT: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
const ZERO_VEC3: Vec3 = { x: 0, y: 0, z: 0 };

/** Default camera: looking at Sun from ~50 AU (Doc 27 §15.4). */
export const CAMERA_DEFAULT_STATE: Omit<
  CameraState,
  | 'setPosition'
  | 'setRotation'
  | 'setFov'
  | 'setVelocity'
  | 'setScaleRegime'
  | 'flyTo'
  | 'orbitAround'
  | 'setTrackedEntity'
  | 'resetToDefault'
> = {
  position: { x: 0, y: 0, z: 50 },
  rotation: IDENTITY_QUAT,
  fov: 60,
  targetDistance: 50,
  targetEntityId: null,
  trackedEntityId: null,
  scaleRegime: 'solar_system',
  velocity: ZERO_VEC3,
  isTransitioning: false,
};

export const useCameraStore = create<CameraState>()((set) => ({
  ...CAMERA_DEFAULT_STATE,

  setPosition: (position) => set({ position }),
  setRotation: (rotation) => set({ rotation }),
  setFov: (fov) => set({ fov }),
  setVelocity: (velocity) => set({ velocity }),
  setScaleRegime: (scaleRegime) => set({ scaleRegime }),

  flyTo: (target, _duration) =>
    set({
      position: target,
      isTransitioning: true,
      targetEntityId: null,
    }),

  orbitAround: (entityId, radius) =>
    set({
      targetEntityId: entityId,
      targetDistance: radius,
    }),

  setTrackedEntity: (entityId) => set({ trackedEntityId: entityId }),

  resetToDefault: () => set(CAMERA_DEFAULT_STATE),
}));
