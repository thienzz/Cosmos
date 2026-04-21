/**
 * Runtime type guards for the celestial-object discriminated union.
 * Keeps callers from writing ad-hoc `'radius' in obj` narrowing.
 */
import type { CelestialObject } from './entities/index.js';

type TypeOf<T extends CelestialObject['object_type']> = Extract<CelestialObject, { object_type: T }>;

function matches<T extends CelestialObject['object_type']>(
  obj: CelestialObject,
  type: T,
): obj is TypeOf<T> {
  return obj.object_type === type;
}

export const isStar = (obj: CelestialObject): obj is TypeOf<'star'> => matches(obj, 'star');
export const isPlanet = (obj: CelestialObject): obj is TypeOf<'planet'> => matches(obj, 'planet');
export const isMoon = (obj: CelestialObject): obj is TypeOf<'moon'> => matches(obj, 'moon');
export const isGalaxy = (obj: CelestialObject): obj is TypeOf<'galaxy'> => matches(obj, 'galaxy');
export const isNebula = (obj: CelestialObject): obj is TypeOf<'nebula'> => matches(obj, 'nebula');
export const isCluster = (obj: CelestialObject): obj is TypeOf<'cluster'> => matches(obj, 'cluster');
export const isAsteroid = (obj: CelestialObject): obj is TypeOf<'asteroid'> =>
  matches(obj, 'asteroid');
export const isComet = (obj: CelestialObject): obj is TypeOf<'comet'> => matches(obj, 'comet');
