import type { EntityBase } from './base.js';
import type { KeplerianElements } from './orbit.js';

/**
 * Planet entity (gas giant, rocky, ice giant, etc.).
 * Source: Doc 11 §3.2.
 */
export interface Planet extends EntityBase {
  /** Parent star ID */
  parentBody: string;
  aliases: string[];

  orbitalElements: KeplerianElements;
  /** Reference epoch (ISO date) */
  epoch: string;

  physicalProperties: PlanetPhysicalProperties;
  atmosphere?: Atmosphere;
  rings?: RingSystem[];
  /** Array of Moon IDs */
  moons: string[];

  texture?: string;
  discovery_date?: string;
  discovery_method?: string;

  /** Equilibrium temperature in Kelvin (mostly gaseous planets) */
  equilibrium_temperature?: number;
}

export interface PlanetPhysicalProperties {
  mass_earth_masses: number;
  radius_earth_radii: number;
  /** kg/m³ */
  density: number;
  /** m/s² */
  surface_gravity?: number;
  /** hours */
  rotation_period?: number;
  /** Axial tilt (degrees) */
  obliquity?: number;
}

export interface AtmosphereComponent {
  molecule: string;
  /** Relative abundance 0–1 */
  abundance: number;
}

export interface Atmosphere {
  composition: AtmosphereComponent[];
  /** km */
  scale_height: number;
  /** Pa */
  surface_pressure?: number;
}

export interface RingSystem {
  /** km */
  semi_major_axis: number;
  /** km */
  width: number;
  optical_depth: number;
  composition: string;
}
