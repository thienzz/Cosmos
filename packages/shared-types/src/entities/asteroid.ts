import type { CatalogIds } from '../primitives.js';

import type { EntityBase } from './base.js';
import type { KeplerianElements } from './orbit.js';

/**
 * Asteroid / small solar-system body.
 * Source: Doc 11 §3.8.
 */
export interface Asteroid extends EntityBase {
  designation: string;
  aliases: string[];

  orbitalElements: KeplerianElements;
  /** Reference epoch (ISO date) */
  epoch: string;

  /** km */
  diameter?: number;
  /** Bond albedo (0-1) */
  albedo?: number;
  absolute_magnitude?: number;
  /** e.g., "C", "S", "M", "D" */
  taxonomic_type?: string;
  composition?: string;

  /** degrees/day */
  mean_motion?: number;
  ascending_node_longitude?: number;

  catalog_ids: AsteroidCatalogIds;

  discovery_date?: string;
  discoverer?: string;
}

export interface AsteroidCatalogIds extends CatalogIds {
  mpc?: number;
  jplsmd?: string;
}
