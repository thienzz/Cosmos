/**
 * HTTP types mirroring Doc 26 (API Contract Specification).
 *
 * These are hand-rolled until the `@cosmos/api-client` OpenAPI generator lands.
 * Keep the shapes faithful to Doc 26 §2.5 (envelope), §5 (entities),
 * §8 (ephemeris), §9 (solar system), §15 (errors) — narrowing to only what
 * the web app currently consumes.
 */

import type { ObjectType } from '@cosmos/shared-types';

// ---------------------------------------------------------------------------
// Envelope (Doc 26 §2.5)
// ---------------------------------------------------------------------------

export interface ApiMeta {
  request_id: string;
  data_version: string;
  timestamp: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  next?: string;
}

export interface ApiCollectionEnvelope<T> extends ApiEnvelope<T[]> {
  pagination: ApiPagination;
}

// ---------------------------------------------------------------------------
// Error envelope (Doc 26 §15)
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | 'INVALID_PARAMETER'
  | 'INVALID_ID'
  | 'INVALID_CATALOG'
  | 'INVALID_TILE_ADDRESS'
  | 'INVALID_NAIF_ID'
  | 'EPOCH_OUT_OF_RANGE'
  | 'INVALID_FRAME'
  | 'INVALID_FILE_FORMAT'
  | 'INVALID_COLUMN_MAPPING'
  | 'BATCH_TOO_LARGE'
  | 'INVALID_FILTER'
  | 'UNAUTHORIZED'
  | 'INSUFFICIENT_TIER'
  | 'SESSION_MISMATCH'
  | 'ENTITY_NOT_FOUND'
  | 'CATALOG_ENTRY_NOT_FOUND'
  | 'TILE_NOT_FOUND'
  | 'JOB_NOT_FOUND'
  | 'JOB_ALREADY_EXISTS'
  | 'FILE_TOO_LARGE'
  | 'UNPROCESSABLE_ENTITY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'UPSTREAM_TIMEOUT'
  | 'SERVICE_UNAVAILABLE';

export interface ApiErrorBody {
  code: ApiErrorCode | string;
  message: string;
  status: number;
  request_id: string;
  details?: {
    fields?: Array<{ field: string; message: string; value: unknown }>;
  };
  documentation_url?: string;
  retry_after_seconds?: number;
  tier?: string;
  upgrade_url?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

// ---------------------------------------------------------------------------
// Entity (Doc 26 §5)
// ---------------------------------------------------------------------------

export interface ApiVec3 {
  x: number;
  y: number;
  z: number;
}

export interface ApiPosition {
  ra: number;
  dec: number;
  distance_pc: number;
  distance_ly?: number;
  galactic_l?: number;
  galactic_b?: number;
  cartesian?: ApiVec3;
}

export interface ApiCatalogIds {
  hipparcos?: number;
  gaia_dr3?: string;
  tycho2?: string;
  hd?: number;
  sao?: number;
  messier?: number;
  ngc?: number;
  ic?: number;
  pgc?: number;
  sdss?: string;
  mpc?: string;
  jplsmd?: string;
}

export type ApiDataSource =
  | 'gaia_dr3'
  | 'hipparcos2'
  | 'tycho2'
  | 'sdss_dr18'
  | 'illustris'
  | 'nasa_exoplanet_archive'
  | 'jpl_horizons'
  | 'mpc'
  | 'other';

export type ApiEntityCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface ApiEntity {
  id: number;
  ent_id: string;
  name: string;
  category: ApiEntityCategory;
  category_name: string;
  entity_type: number;
  type_name: string;
  aliases: string[];
  position: ApiPosition;
  properties: Record<string, unknown>;
  catalog_ids: ApiCatalogIds;
  data_source: ApiDataSource;
  data_quality: number;
  toggles: string[];
  _links: {
    self: string;
    tile?: string;
    neighbors?: string;
    parent?: string;
    browse?: string;
    [key: string]: string | undefined;
  };
}

// ---------------------------------------------------------------------------
// Ephemeris (Doc 26 §8)
// ---------------------------------------------------------------------------

export type ApiEphemerisFrame = 'ECLIPJ2000' | 'J2000' | 'GALACTIC';

export interface ApiEphemerisPoint {
  naif_id: number;
  name: string;
  epoch_jd: number;
  frame: ApiEphemerisFrame;
  observer: number;
  position_au: ApiVec3;
  velocity_au_day: ApiVec3;
  light_time_s: number;
}

export interface ApiEphemerisRange {
  naif_id: number;
  name: string;
  frame: string;
  observer: number;
  start_jd: number;
  end_jd: number;
  step_days: number;
  /** Flat `[x, y, z]` tuples, epoch at index i = `start_jd + i * step_days`. */
  positions: Array<[number, number, number]>;
  count: number;
}

// ---------------------------------------------------------------------------
// Solar System (Doc 26 §9)
// ---------------------------------------------------------------------------

export type ApiSolarSystemBodyType =
  | 'planet'
  | 'dwarf_planet'
  | 'moon'
  | 'asteroid'
  | 'comet';

export interface ApiKeplerianElements {
  a: number;      // AU
  e: number;
  i: number;      // deg
  Omega: number;  // deg
  omega: number;  // deg
  M: number;      // deg
  P?: number;     // days
}

export interface ApiPhysicalProperties {
  mass_kg: number;
  radius_km: number;
  density_kgm3: number;
  surface_gravity_ms2: number;
  rotation_period_hours: number;
  obliquity_deg: number;
  albedo: number;
  equilibrium_temperature_k: number;
}

export interface ApiAtmosphere {
  composition: Array<{ molecule: string; abundance: number }>;
  surface_pressure_pa: number;
  scale_height_km: number;
}

export interface ApiSolarSystemBody {
  naif_id: number;
  name: string;
  type: ApiSolarSystemBodyType;
  parent_naif_id: number;
  ent_id: string;
  orbital_elements: ApiKeplerianElements;
  epoch: string;
  physical: ApiPhysicalProperties;
  atmosphere: ApiAtmosphere | null;
  rings: unknown | null;
  moon_count: number;
  _links: {
    self: string;
    entity: string;
    moons: string;
    ephemeris: string;
  };
}

// ---------------------------------------------------------------------------
// Convenience re-exports used by the adapter layer
// ---------------------------------------------------------------------------

export type { ObjectType };
