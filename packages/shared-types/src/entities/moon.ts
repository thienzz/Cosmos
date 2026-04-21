import type { EntityBase } from './base.js';
import type { KeplerianElements } from './orbit.js';

/**
 * Moon entity orbiting a parent planet.
 * Source: Doc 11 §3.3.
 */
export interface Moon extends EntityBase {
  /** Parent planet ID */
  parentPlanet: string;

  orbitalElements: KeplerianElements;
  /** Reference epoch (ISO date) */
  epoch: string;

  physicalProperties: MoonPhysicalProperties;

  /** Bond albedo (0-1) */
  albedo?: number;
  /** e.g., "silicate_rock", "water_ice" */
  composition: string;

  texture?: string;
  discovery_date?: string;
}

export interface MoonPhysicalProperties {
  mass_kg: number;
  radius_km: number;
  /** kg/m³ */
  density: number;
  /** m/s² */
  surface_gravity: number;
  /** km/s */
  escape_velocity: number;
  /** hours (sidereal day) */
  rotation_period: number;
  /** Kelvin */
  mean_surface_temperature?: number;
}
