import type { CatalogIds, RGB } from '../primitives.js';

import type { EntityBase } from './base.js';

/**
 * Star entity in ICRS J2000.0 reference frame.
 * Source: Doc 11 §3.1.
 */
export interface Star extends EntityBase {
  names: string[];
  catalog_ids?: StarCatalogIds;

  // Position & motion (ICRS, J2000.0)
  ra: number;
  dec: number;
  distance: number;
  parallax: number;
  parallax_error: number;
  proper_motion: ProperMotion;
  radial_velocity?: number;

  // Photometry & color
  magnitude: number;
  magnitude_absolute?: number;
  color: RGB;
  color_index_bp_rp?: number;

  // Physical properties
  spectral_type: string;
  temperature: number;
  luminosity: number;
  mass: number;
  radius: number;

  // Geometric
  constellation: string;
  surface_gravity?: number;

  // Provenance
  data_quality: StarDataQuality;
}

export interface StarCatalogIds extends CatalogIds {
  hipparcos?: number;
  gaia_dr3?: string;
  tycho2?: string;
  hipparcos_new?: number;
}

export interface ProperMotion {
  /** μ_α cos(δ) in mas/yr */
  ra: number;
  /** μ_δ in mas/yr */
  dec: number;
}

export type StarDataSource = 'gaia_dr3' | 'hipparcos2' | 'tycho2' | 'other';

export interface StarDataQuality {
  source: StarDataSource;
  parallax_snr?: number;
  astrometric_quality: number;
  /** ISO date */
  last_updated: string;
}

/** Gaia BP-RP color index bucket used by binary tile format (Doc 11 §4.1). */
export type SpectralTypeCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
