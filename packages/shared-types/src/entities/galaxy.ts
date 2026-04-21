import type { CatalogIds } from '../primitives.js';

import type { EntityBase } from './base.js';

/**
 * Galaxy entity (SDSS DR18, Illustris, or other source).
 * Source: Doc 11 §3.4.
 */
export interface Galaxy extends EntityBase {
  aliases: string[];

  ra: number;
  dec: number;
  redshift: number;
  /** Comoving distance in Megaparsecs */
  distance_mpc: number;
  distance_modulus?: number;

  type: GalaxyType;
  /** Extended Hubble sequence (e.g., "E5", "Sab") */
  hubble_classification?: string;
  morphology: GalaxyMorphology;

  magnitude: number;
  magnitude_absolute?: number;
  /** Effective radius in arcminutes */
  angular_size: number;

  stellar_mass?: number;
  star_formation_rate?: number;
  /** [Fe/H] relative to solar */
  metallicity?: number;
  /** Gyr */
  age?: number;

  velocity_dispersion?: number;
  rotation_velocity?: number;

  catalog_ids: GalaxyCatalogIds;
  data_source: GalaxyDataSource;
}

export interface GalaxyMorphology {
  /** b/a ratio (0-1) */
  axis_ratio: number;
  /** degrees */
  position_angle: number;
  /** Sérsic index (1=exponential, 4=de Vaucouleurs) */
  sersic_index?: number;
}

export interface GalaxyCatalogIds extends CatalogIds {
  messier?: number;
  ngc?: number;
  pgc?: number;
  sdss?: string;
}

export type GalaxyType = 'elliptical' | 'spiral' | 'lenticular' | 'irregular' | 'unknown';
export type GalaxyDataSource = 'sdss_dr18' | 'illustris' | 'other';
