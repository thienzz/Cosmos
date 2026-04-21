/**
 * Solar System endpoints (Doc 26 §9). Thin wrapper on top of the generic
 * client; the renderer and selection flow prefer `ApiSolarSystemBody` over
 * `ApiEntity` because the orbital + physical payloads are structured.
 */

import { apiGet, apiGetCollection, type CollectionResult } from './client';
import type { ApiSolarSystemBody, ApiSolarSystemBodyType } from './types';

export interface ListBodiesOptions {
  type?: ApiSolarSystemBodyType;
  /** NAIF id of the parent body — e.g. 599 for Jupiter's moons. */
  parent?: number;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export async function listSolarSystemBodies(
  opts: ListBodiesOptions = {},
): Promise<CollectionResult<ApiSolarSystemBody>> {
  return apiGetCollection<ApiSolarSystemBody>('/solar-system/bodies', {
    query: {
      type: opts.type,
      parent: opts.parent,
      limit: opts.limit,
      offset: opts.offset,
    },
    signal: opts.signal,
  });
}

export interface GetBodyOptions {
  bypassCache?: boolean;
  signal?: AbortSignal;
}

export async function getSolarSystemBody(
  naifId: number,
  opts: GetBodyOptions = {},
): Promise<ApiSolarSystemBody> {
  return apiGet<ApiSolarSystemBody>(`/solar-system/bodies/${naifId}`, {
    bypassCache: opts.bypassCache,
    signal: opts.signal,
  });
}
