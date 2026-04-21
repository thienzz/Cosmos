import type { CatalogIds, Vec3 } from '../primitives.js';

/**
 * Shared fields for every catalogued celestial object.
 * Concrete entity interfaces (Star, Planet, etc.) extend this.
 */
export interface EntityBase {
  id: string;
  name: string;
  aliases?: string[];
  position: Vec3;
  catalog_ids?: CatalogIds;
}

export type ObjectType =
  | 'star'
  | 'planet'
  | 'moon'
  | 'galaxy'
  | 'nebula'
  | 'cluster'
  | 'asteroid'
  | 'comet';
