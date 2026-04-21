import type { Vec3 } from '../primitives.js';

/**
 * Cosmic web node from N-body simulation (IllustrisTNG).
 * Source: Doc 11 §3.7.
 */
export interface CosmicWebNode {
  /** Cartesian position in Megaparsecs */
  position: Vec3;
  /** Normalized density (0-1) */
  density: number;
  type: CosmicWebStructure;

  /** ∇·v (1/Gyr) */
  velocity_divergence?: number;
  /** 3×3 tidal tensor (row-major) */
  tidal_tensor?: number[][];
}

export type CosmicWebStructure = 'filament' | 'void' | 'sheet' | 'knot' | 'unclassified';
