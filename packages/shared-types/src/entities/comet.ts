import type { CatalogIds } from '../primitives.js';

import type { EntityBase } from './base.js';
import type { KeplerianElements } from './orbit.js';

/**
 * Comet entity with orbital + activity parameters.
 * Source: Doc 11 §3.9.
 */
export interface Comet extends EntityBase {
  designation: string;

  orbitalElements: KeplerianElements;
  /** AU */
  perihelion_distance: number;
  /** ISO date */
  perihelion_date: string;
  /** AU */
  aphelion_distance?: number;

  /** Absolute magnitude (H parameter) */
  magnitude: number;
  /** Activity exponent k where mag ∝ r^(-k) */
  activity_parameter?: number;
  /** km (when active) */
  coma_diameter?: number;
  /** km (at discovery / apparition) */
  tail_length?: number;

  composition: CometComposition;

  catalog_ids: CometCatalogIds;

  number_of_apparitions?: number;
  /** ISO date */
  last_perihelion?: string;
  /** Predicted ISO date */
  next_perihelion?: string;
}

export interface CometComposition {
  /** Volatile species, e.g. ["H2O", "CO2", "CO"] */
  volatile: string[];
  /** kg/s at 1 AU */
  dust_production?: number;
}

export interface CometCatalogIds extends CatalogIds {
  mpc?: string;
  iau_designation?: string;
}
