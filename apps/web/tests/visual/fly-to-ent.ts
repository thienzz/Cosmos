/**
 * Browser-side helper (evaluated via preview_eval or Playwright page.evaluate)
 * that flies the camera to a given ENT-ID using the live engine bridge.
 *
 * Not imported by any Node-side test — the function is stringified and sent
 * across the wire at capture time. Keeping it as a standalone export means
 * T-V-61's capture driver can ship one copy of this logic to all 262 poses.
 */

import type { VisualPose } from './poses';

export interface FlyToEntArgs {
  /** Canonical entity ID (e.g. `ENT-1007`, `ENT-2011`). */
  entId: string;
  /** Camera pose hint; caller usually derives this from entity kind. */
  pose: VisualPose;
}

/**
 * Returns a promise that resolves once the camera has settled at the pose.
 * Expects the page to expose `window.__cosmosEngine.flyToCelestialCoord`.
 */
export async function flyToEnt(args: FlyToEntArgs): Promise<void> {
  type EngineBridge = {
    flyToCelestialCoord: (
      ra: number,
      dec: number,
      distance: number,
      opts: { entId: string; durationSec: number },
    ) => void | Promise<void>;
  };
  const bridge = (window as unknown as { __cosmosEngine?: EngineBridge })
    .__cosmosEngine;
  if (!bridge?.flyToCelestialCoord) {
    throw new Error(
      'flyToEnt: window.__cosmosEngine.flyToCelestialCoord not available',
    );
  }
  // The engine resolves the ENT-ID itself — our RA/Dec/distance args are
  // hints. Pass distanceMultiplier=0.001 as a near-pose sentinel; the engine
  // uses the entity's own size to scale.
  await bridge.flyToCelestialCoord(0, 0, args.pose.distanceMultiplier, {
    entId: args.entId,
    durationSec: 0,
  });
  await new Promise<void>((r) => setTimeout(r, args.pose.dwellMs));
}

/** Serialised form suitable for page.evaluate / preview_eval. */
export function flyToEntAsEvalString(args: FlyToEntArgs): string {
  const argsJson = JSON.stringify(args);
  return `(${flyToEnt.toString()})(${argsJson})`;
}
