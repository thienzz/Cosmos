import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';

import { buildServer } from '../../src/server.js';

interface PgCall {
  text: string;
  params: readonly unknown[];
}

function fakePool(rows: unknown[], calls: PgCall[]): Pool {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    query: async (text: string, params: readonly unknown[]) => {
      calls.push({ text, params });
      return { rows, rowCount: rows.length };
    },
    end: async () => undefined,
  } as unknown as Pool;
}

const EARTH = {
  id: 3,
  entity_id: 103,
  naif_id: 399,
  mpc_number: null,
  body_type: 'planet',
  parent_naif_id: 10,
  semi_major_au: '1.0',
  eccentricity: '0.0167',
  inclination: '0.00005',
  lon_asc_node: '-11.26064',
  arg_periapsis: '114.20783',
  mean_anomaly: '358.617',
  epoch_jd: '2451545.0',
  mass_kg: '5.972e24',
  radius_km: '6371',
  density: 5.514,
  albedo: 0.367,
  rotation_period: 23.934,
  axial_tilt: 23.44,
  atmosphere: { N2: 0.78, O2: 0.21 },
  surface_comp: { water: 0.71 },
  ring_system: null,
  moon_count: 1,
  entity_name: 'Earth',
  entity_ent_id: 'ENT-1001',
};

describe('GET /v1/solar-system/bodies', () => {
  it('returns list mapped to Doc 26 shape', async () => {
    const calls: PgCall[] = [];
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([EARTH], calls),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/solar-system/bodies' });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        data: { items: Array<Record<string, unknown>>; count: number };
        meta: { request_id: string };
      };
      expect(body.meta.request_id).toBeTypeOf('string');
      expect(body.data.count).toBe(1);
      const earth = body.data.items[0] as {
        name: string;
        naif_id: number;
        orbital_elements: { semi_major_au: number };
        physical: { mass_kg: number };
        _links: { self: string; parent?: string };
      };
      expect(earth.name).toBe('Earth');
      expect(earth.naif_id).toBe(399);
      expect(earth.orbital_elements.semi_major_au).toBeCloseTo(1.0);
      expect(earth.physical.mass_kg).toBeGreaterThan(1e24);
      expect(earth._links.self).toBe('/v1/solar-system/bodies/399');
      expect(earth._links.parent).toBe('/v1/solar-system/bodies/10');
    } finally {
      await app.close();
    }
  });

  it('400 on malformed parent query', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([], []),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/solar-system/bodies?parent=abc',
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});

describe('GET /v1/solar-system/bodies/:naifId', () => {
  it('returns single body', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([EARTH], []),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/solar-system/bodies/399',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { data: { name: string }; meta: { request_id: string } };
      expect(body.meta.request_id).toBeTypeOf('string');
      expect(body.data.name).toBe('Earth');
    } finally {
      await app.close();
    }
  });

  it('404 when naif missing', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([], []),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/solar-system/bodies/999999',
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('rejects non-numeric naif id', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([], []),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/solar-system/bodies/abc',
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});
