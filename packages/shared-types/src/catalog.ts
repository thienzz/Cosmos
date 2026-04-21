/**
 * Search & lookup shapes exposed by the CatalogService (Doc 11 §7.2).
 */
import type { ObjectType } from './entities/base.js';
import type { Vec3 } from './primitives.js';

export interface SearchFilter {
  type?: ObjectType;
  ra?: Range;
  dec?: Range;
  distance?: Range;
  magnitude?: Range;
}

export interface Range {
  min: number;
  max: number;
}

export interface SearchResult {
  objectId: string;
  objectType: ObjectType;
  displayName: string;
  /** Search relevance (0-1) */
  score: number;
  position: Vec3;
  /** parsecs */
  distance: number;
}

/**
 * Wrapped object-details envelope. Exactly one entity-specific field is
 * populated on the server side based on the target object's type.
 */
export interface ObjectDetails {
  objectId: string;
  objectType: ObjectType;
  /** Fully-typed payload; consumers should narrow on `objectType`. */
  payload: unknown;
}
