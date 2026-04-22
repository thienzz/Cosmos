import type { CatalogIds, Vec3 } from '../primitives.js';
import type { EntityRenderBlock } from '../render.js';

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
  /**
   * Optional per-entity render override (T-V-00). When present, MaterialFactory
   * uses this block instead of deriving a shader from `object_type`/kind.
   */
  render?: EntityRenderBlock;
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
