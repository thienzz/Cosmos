/**
 * Per-kind camera poses for visual regression capture (T-V-01).
 * Distance hints feed engine.flyToCelestialCoord; values derived from Doc 19
 * §Scale Regimes and Doc 30 TS-RENDER presets.
 *
 * Each kind defines an approach distance expressed as a multiplier over the
 * entity's characteristic size. The harness multiplies by the entity's
 * actual radius/extent (whatever the engine exposes via flyToCelestialCoord)
 * to land at a reproducible framing.
 */

export interface VisualPose {
  /** Multiplier over the entity's characteristic radius. */
  distanceMultiplier: number;
  /** Additional dwell time before capture (ms), allows animation to settle. */
  dwellMs: number;
}

export const VISUAL_POSES: Readonly<Record<string, VisualPose>> = Object.freeze(
  {
    // Stars: pull back far enough that the corona doesn't fill the frame.
    star: { distanceMultiplier: 8, dwellMs: 500 },

    // Planets: 3 body-radii per roadmap T-V-01.
    planet: { distanceMultiplier: 3, dwellMs: 500 },
    rocky_planet: { distanceMultiplier: 3, dwellMs: 500 },
    gas_giant: { distanceMultiplier: 3.5, dwellMs: 600 },
    extreme_planet: { distanceMultiplier: 3, dwellMs: 500 },

    // Moons: 2 body-radii.
    moon: { distanceMultiplier: 2, dwellMs: 500 },

    // Small bodies: closer, bodies are tiny.
    asteroid: { distanceMultiplier: 4, dwellMs: 400 },
    comet: { distanceMultiplier: 6, dwellMs: 600 },

    // Nebulae: 50 pc for emission, reflection, dark.
    nebula: { distanceMultiplier: 2, dwellMs: 800 },

    // Galaxies: 500 kpc for a full-galaxy framing.
    galaxy: { distanceMultiplier: 2.5, dwellMs: 800 },

    // Clusters: open cluster ~ radius × 4, globular cluster ~ radius × 3.
    cluster: { distanceMultiplier: 3.5, dwellMs: 600 },

    // Large-scale structure: 200 Mpc for filaments/voids.
    lss: { distanceMultiplier: 1.5, dwellMs: 1000 },
  },
);

/** Fallback used when a kind has no explicit pose. */
export const DEFAULT_POSE: VisualPose = {
  distanceMultiplier: 3,
  dwellMs: 500,
};

export function poseForKind(kind: string | undefined): VisualPose {
  if (!kind) return DEFAULT_POSE;
  return VISUAL_POSES[kind] ?? DEFAULT_POSE;
}
