/**
 * Binary tile & index formats served by the Rust tile-server.
 * All multi-byte fields are little-endian. Source: Doc 11 §4.
 */

/** Star tile header (16 bytes). Doc 11 §4.1. */
export interface StarTileHeader {
  tile_id: number;
  star_count: number;
  /** parsecs */
  min_distance: number;
  /** parsecs */
  max_distance: number;
}

export const STAR_TILE_HEADER_BYTES = 16;
export const STAR_TILE_RECORD_BYTES = 16;

/**
 * Per-star record inside a star tile (16 bytes packed). Coordinates are
 * quantised to 0.01 pc relative to the tile centre (Float16).
 */
export interface StarTileRecord {
  /** parsecs, relative to tile centre */
  x: number;
  y: number;
  z: number;
  /** G magnitude packed 0..255 → [-5, 21] linear */
  magnitude: number;
  /** BP-RP colour packed 0..255 → [-0.5, 3.5] linear */
  color_index: number;
  /** 0=O, 1=B, 2=A, 3=F, 4=G, 5=K, 6=M, 7=Unknown */
  spectral_type: number;
  /** Bit 0: has_velocity, 1: has_temp, 2..7: reserved */
  flags: number;
  /** Index into companion metadata JSON */
  catalog_index: number;
}

/** Bit layout for StarTileRecord.flags. */
export const STAR_FLAG_HAS_VELOCITY = 0x01;
export const STAR_FLAG_HAS_TEMP = 0x02;

/** Galaxy catalog tile header (16 bytes). Doc 11 §4.2. */
export interface GalaxyTileHeader {
  galaxy_count: number;
  /** Mpc */
  distance_min: number;
  /** Mpc */
  distance_max: number;
  /** Reserved bit flags */
  flags: number;
}

export const GALAXY_TILE_HEADER_BYTES = 16;
export const GALAXY_TILE_RECORD_BYTES = 24;

export interface GalaxyTileRecord {
  /** degrees, 0-360 */
  ra: number;
  /** degrees, -90..+90 */
  dec: number;
  redshift: number;
  /** Apparent magnitude, 0.1 mag precision (Float16) */
  magnitude: number;
  /** arcminutes, 0.01 precision (Float16) */
  angular_size: number;
  /** 0=E, 1=S0, 2=Sa, ..., 10=Irr */
  morphology_type: number;
  flags: number;
  metadata_index: number;
}

/** Cosmic web mesh header (20 bytes). Doc 11 §4.3. */
export interface CosmicWebMeshHeader {
  vertex_count: number;
  index_count: number;
  /** Normalisation factor for density values */
  density_scale: number;
  /** Format version (currently 1) */
  version: number;
  /** Bit 0: indices are uint32 (else uint16) */
  flags: number;
}

export const COSMIC_WEB_HEADER_BYTES = 20;
export const COSMIC_WEB_FLAG_U32_INDICES = 0x01;

export interface CosmicWebVertex {
  /** Mpc */
  x: number;
  y: number;
  z: number;
  /** Normalised density (0-1) relative to header.density_scale */
  density: number;
}

/** Octree index header (20 bytes). Doc 11 §4.4. */
export interface OctreeIndexHeader {
  num_nodes: number;
  /** parsecs */
  root_x_min: number;
  /** parsecs */
  root_x_max: number;
  /** Typically 8 */
  max_depth: number;
  /** Total stars across all tiles */
  star_count_total: number;
}

export const OCTREE_INDEX_HEADER_BYTES = 20;
export const OCTREE_NODE_BYTES = 12;

export interface OctreeNode {
  /** File offset of the corresponding .bin tile; 0 means no tile */
  tile_offset: number;
  /** Size of the tile in bytes */
  tile_size: number;
  /** Bit i = 1 if child i exists */
  child_mask: number;
  /** 0=root, 8=leaf */
  depth: number;
  flags: number;
}

/**
 * Discriminated union covering all tile envelopes served by the tile server.
 * Consumers narrow on `kind` before accessing payload-specific fields.
 */
export type TileHeader =
  | ({ kind: 'star' } & StarTileHeader)
  | ({ kind: 'galaxy' } & GalaxyTileHeader)
  | ({ kind: 'cosmic_web' } & CosmicWebMeshHeader)
  | ({ kind: 'octree_index' } & OctreeIndexHeader);

export type TileKind = TileHeader['kind'];
