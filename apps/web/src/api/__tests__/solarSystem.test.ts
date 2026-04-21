import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  apiConfig,
  getSolarSystemBody,
  listSolarSystemBodies,
} from '../index';

function envelope<T>(data: T, extra: Record<string, unknown> = {}): unknown {
  return { data, meta: { request_id: 'r', data_version: 'v', timestamp: 't' }, ...extra };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function fakeBody(naifId: number, type: 'planet' | 'moon' = 'planet'): unknown {
  return {
    naif_id: naifId,
    name: `Body ${naifId}`,
    type,
    parent_naif_id: type === 'moon' ? 399 : 10,
    ent_id: `ENT-2${naifId.toString().padStart(3, '0')}`,
    orbital_elements: { a: 1, e: 0, i: 0, Omega: 0, omega: 0, M: 0, P: 365 },
    epoch: 'J2000.0',
    physical: {
      mass_kg: 1,
      radius_km: 1,
      density_kgm3: 1,
      surface_gravity_ms2: 1,
      rotation_period_hours: 24,
      obliquity_deg: 0,
      albedo: 0.3,
      equilibrium_temperature_k: 280,
    },
    atmosphere: null,
    rings: null,
    moon_count: 0,
    _links: {
      self: `/v1/solar-system/bodies/${naifId}`,
      entity: `/v1/entities/${naifId}`,
      moons: '',
      ephemeris: `/v1/ephemeris/${naifId}`,
    },
  };
}

describe('api/solarSystem', () => {
  beforeEach(() => {
    apiConfig.reset();
    apiConfig.setBaseUrl('https://api.test/v1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    apiConfig.reset();
  });

  it('getSolarSystemBody returns the parsed body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope(fakeBody(399))));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    const body = await getSolarSystemBody(399);
    expect(body.naif_id).toBe(399);
    expect((fetchImpl.mock.calls[0] as [string])[0]).toBe(
      'https://api.test/v1/solar-system/bodies/399',
    );
  });

  it('listSolarSystemBodies unwraps pagination + items', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [fakeBody(399), fakeBody(499)],
        meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
        pagination: { total: 2, limit: 10, offset: 0, has_more: false },
      }),
    );
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    const result = await listSolarSystemBodies({ type: 'planet', limit: 10 });
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    const url = (fetchImpl.mock.calls[0] as [string])[0];
    expect(url).toContain('type=planet');
    expect(url).toContain('limit=10');
  });
});
