/**
 * Geometric primitives and color types shared across all entities.
 * Source: Doc 11 §3.1.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface RGB {
  /** Red channel (0-1) */
  r: number;
  /** Green channel (0-1) */
  g: number;
  /** Blue channel (0-1) */
  b: number;
}

export interface RGBA extends RGB {
  /** Alpha channel (0-1) */
  a: number;
}

/**
 * Unit quaternion (x, y, z, w). Stored as a plain object to keep store state
 * structurally cloneable (Three.js `THREE.Quaternion` is not).
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface BoundingBox {
  min: Vec3;
  max: Vec3;
}

export interface BoundingSphere {
  center: Vec3;
  radius: number;
}

/**
 * Catalog identifiers shared across entity types. Every field is optional
 * because an entity may be present in a subset of catalogs.
 */
export interface CatalogIds {
  hipparcos?: number;
  hipparcos_new?: number;
  gaia_dr3?: string;
  tycho2?: string;
  messier?: number;
  ngc?: number;
  ic?: number;
  pgc?: number;
  sdss?: string;
  mpc?: number | string;
  jplsmd?: string;
  iau_designation?: string;
  exoplanet_archive?: string;
}
