/**
 * Scene-scale conversions between physical astronomical units and world
 * (three.js scene) units.
 *
 * The Cosmos Explorer renders content across ~20 orders of magnitude
 * (AU → Gpc), which doesn't fit into a single float32 scale. Each
 * {@link ScaleRegime} uses its own "units per X" factor; callers pick the
 * right conversion based on the current regime or the physical unit they
 * already hold.
 *
 * Default factors match the existing engine conventions so this is a
 * drop-in for callers that previously hardcoded `12` (solar) or `500`
 * (stellar):
 *   - solar_system : 1 AU  → 12 units  (matches SolarSystemRenderer.orbitScale)
 *   - stellar      : 1 pc  → 500 units (matches StarTileRenderer.sceneUnitsPerPc)
 *   - galactic     : 1 kpc → 100 units (reserved for galaxy gallery + MW)
 *   - cosmic       : 1 Mpc → 10 units  (reserved for LSS + cosmic web)
 *
 * These are separate because the camera rebases to the new origin when the
 * scale regime changes (Doc 19 §Scale Transitions) — the same physical
 * distance can map to very different scene distances depending on which
 * regime is active.
 */
import { AU_PER_PARSEC } from './constants.js';
import { icrsToCartesian } from './icrs.js';
import type { Vec3D } from './primitives.js';

export interface SceneScaleConfig {
  /** Scene units per AU. Default 12. */
  unitsPerAU?: number;
  /** Scene units per parsec. Default 500. */
  unitsPerPc?: number;
  /** Scene units per kiloparsec. Default 100. */
  unitsPerKpc?: number;
  /** Scene units per megaparsec. Default 10. */
  unitsPerMpc?: number;
}

export const DEFAULT_SCENE_SCALE: Required<SceneScaleConfig> = Object.freeze({
  unitsPerAU: 12,
  unitsPerPc: 500,
  unitsPerKpc: 100,
  unitsPerMpc: 10,
});

/**
 * Resolve a partial SceneScale config against the defaults. Handy when an
 * API accepts "overrides only" and wants a fully-populated record.
 */
export function resolveSceneScale(
  overrides: SceneScaleConfig = {},
): Required<SceneScaleConfig> {
  return {
    unitsPerAU: overrides.unitsPerAU ?? DEFAULT_SCENE_SCALE.unitsPerAU,
    unitsPerPc: overrides.unitsPerPc ?? DEFAULT_SCENE_SCALE.unitsPerPc,
    unitsPerKpc: overrides.unitsPerKpc ?? DEFAULT_SCENE_SCALE.unitsPerKpc,
    unitsPerMpc: overrides.unitsPerMpc ?? DEFAULT_SCENE_SCALE.unitsPerMpc,
  };
}

// ---------------------------------------------------------------------------
// Scalar conversions
// ---------------------------------------------------------------------------

export function auToSceneUnits(au: number, scale: SceneScaleConfig = {}): number {
  return au * (scale.unitsPerAU ?? DEFAULT_SCENE_SCALE.unitsPerAU);
}

export function pcToSceneUnits(pc: number, scale: SceneScaleConfig = {}): number {
  return pc * (scale.unitsPerPc ?? DEFAULT_SCENE_SCALE.unitsPerPc);
}

export function kpcToSceneUnits(kpc: number, scale: SceneScaleConfig = {}): number {
  return kpc * (scale.unitsPerKpc ?? DEFAULT_SCENE_SCALE.unitsPerKpc);
}

export function mpcToSceneUnits(mpc: number, scale: SceneScaleConfig = {}): number {
  return mpc * (scale.unitsPerMpc ?? DEFAULT_SCENE_SCALE.unitsPerMpc);
}

/** Inverse: scene units back to parsecs under the stellar regime scale. */
export function sceneUnitsToPc(units: number, scale: SceneScaleConfig = {}): number {
  const factor = scale.unitsPerPc ?? DEFAULT_SCENE_SCALE.unitsPerPc;
  if (factor === 0) return 0;
  return units / factor;
}

/** Inverse: scene units back to AU under the solar regime scale. */
export function sceneUnitsToAu(units: number, scale: SceneScaleConfig = {}): number {
  const factor = scale.unitsPerAU ?? DEFAULT_SCENE_SCALE.unitsPerAU;
  if (factor === 0) return 0;
  return units / factor;
}

// ---------------------------------------------------------------------------
// Vector conversions
// ---------------------------------------------------------------------------

/**
 * Convert an ICRS (RA, Dec, distance) star catalog entry straight to scene
 * units under the stellar regime scale. Distance is interpreted as parsecs.
 *
 * Useful for grounding seed catalogues (Hipparcos bright subset, Gaia DR3
 * sample) in real 3D positions without the caller having to plumb
 * `unitsPerPc` through every layer.
 */
export function icrsToSceneUnitsPc(
  raDeg: number,
  decDeg: number,
  distPc: number,
  scale: SceneScaleConfig = {},
): Vec3D {
  const cartesianPc = icrsToCartesian(raDeg, decDeg, distPc);
  const factor = scale.unitsPerPc ?? DEFAULT_SCENE_SCALE.unitsPerPc;
  return {
    x: cartesianPc.x * factor,
    y: cartesianPc.y * factor,
    z: cartesianPc.z * factor,
  };
}

/**
 * Convert parallax (in milliarcseconds) to parsecs. Guards zero / negative
 * parallax (Gaia edge cases) by returning {@link fallbackPc} so callers
 * never see NaN propagate into geometry buffers. Hipparcos lists parallax
 * in mas; Gaia DR3 uses mas as well.
 */
export function parallaxMasToPc(
  parallaxMas: number,
  fallbackPc = Number.POSITIVE_INFINITY,
): number {
  if (!Number.isFinite(parallaxMas) || parallaxMas <= 0) return fallbackPc;
  return 1000 / parallaxMas;
}

/** Convert AU to parsec directly without routing through scene units. */
export function auToPc(au: number): number {
  return au / AU_PER_PARSEC;
}

/** Convert parsec to AU directly. */
export function pcToAu(pc: number): number {
  return pc * AU_PER_PARSEC;
}
