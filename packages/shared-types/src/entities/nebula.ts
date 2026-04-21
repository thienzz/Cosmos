import type { CatalogIds } from '../primitives.js';

import type { EntityBase } from './base.js';

/**
 * Nebula entity (emission, reflection, dark, planetary, SNR, composite).
 * Source: Doc 11 §3.5.
 */
export interface Nebula extends EntityBase {
  aliases: string[];

  ra: number;
  dec: number;
  /** parsecs */
  distance: number;
  /** arcminutes */
  angular_size: number;

  type: NebulaType;
  morphology?: string;

  /** Kelvin */
  temperature?: number;
  /** particles/cm³ */
  density?: number;
  /** Solar masses */
  mass?: number;
  /** Associated ionising source (star ID) */
  ionizing_source?: string;

  emission_lines?: EmissionLine[];

  /** Embedded / associated star IDs */
  associated_stars: string[];
  /** Parent cluster ID if any */
  parent_cluster?: string;

  catalog_ids: NebulaCatalogIds;
  texture?: string;
}

export interface EmissionLine {
  wavelength_nm: number;
  /** e.g., "H-alpha", "[OIII]" */
  line_id: string;
  /** Relative intensity */
  intensity: number;
}

export interface NebulaCatalogIds extends CatalogIds {
  messier?: number;
  ngc?: number;
  ic?: number;
}

export type NebulaType =
  | 'emission'
  | 'reflection'
  | 'planetary'
  | 'supernova_remnant'
  | 'dark'
  | 'composite'
  | 'unknown';
