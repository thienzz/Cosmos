import type { CatalogIds } from '../primitives.js';

import type { EntityBase } from './base.js';

/**
 * Star cluster (globular, open, association).
 * Source: Doc 11 §3.6.
 */
export interface Cluster extends EntityBase {
  aliases: string[];

  ra: number;
  dec: number;
  /** parsecs */
  distance: number;
  /** arcminutes */
  angular_size: number;

  type: ClusterType;
  /** Megayears */
  age?: number;
  /** [Fe/H] */
  metallicity?: number;

  member_count: number;
  /** Member star IDs (populated for small clusters only) */
  member_stars?: string[];
  /** parsecs */
  core_radius?: number;

  /** km/s */
  velocity_dispersion?: number;

  catalog_ids: ClusterCatalogIds;
}

export interface ClusterCatalogIds extends CatalogIds {
  messier?: number;
  ngc?: number;
}

export type ClusterType = 'globular' | 'open' | 'stellar_association' | 'unknown';
