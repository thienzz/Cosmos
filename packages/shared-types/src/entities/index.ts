import type { Asteroid } from './asteroid.js';
import type { Cluster } from './cluster.js';
import type { Comet } from './comet.js';
import type { Galaxy } from './galaxy.js';
import type { Moon } from './moon.js';
import type { Nebula } from './nebula.js';
import type { Planet } from './planet.js';
import type { Star } from './star.js';

export * from './asteroid.js';
export * from './base.js';
export * from './cluster.js';
export * from './comet.js';
export * from './cosmic-web.js';
export * from './galaxy.js';
export * from './moon.js';
export * from './nebula.js';
export * from './orbit.js';
export * from './planet.js';
export * from './star.js';

/**
 * Discriminated union of every catalogued celestial object.
 * Used by CatalogService.getObject (Doc 11 §7.2).
 */
export type CelestialObject =
  | (Star & { object_type: 'star' })
  | (Planet & { object_type: 'planet' })
  | (Moon & { object_type: 'moon' })
  | (Galaxy & { object_type: 'galaxy' })
  | (Nebula & { object_type: 'nebula' })
  | (Cluster & { object_type: 'cluster' })
  | (Asteroid & { object_type: 'asteroid' })
  | (Comet & { object_type: 'comet' });
