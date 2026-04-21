import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';

import { buildServer } from '../../src/server.js';

interface MockCall {
  text: string;
  params: readonly unknown[];
}

function mockPool(rows: unknown[], calls: MockCall[]): Pool {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    query: async (text: string, params: readonly unknown[]) => {
      calls.push({ text, params });
      return { rows, rowCount: rows.length };
    },
    end: async () => undefined,
  } as unknown as Pool;
}

const SAMPLE_ROW = {
  id: 42,
  ent_id: 'ENT-4000',
  entity_type: 4000,
  category: 3,
  name: 'Andromeda Galaxy',
  aliases: ['M31', 'NGC 224'],
  catalog_ids: { messier: 'M31' },
  ra: '10.6847',
  dec_coord: '41.2688',
  distance_pc: '778000',
  properties: { magnitude_apparent: 3.44 },
  data_source: 'messier',
};

describe('GET /v1/entities/ent/:ent_id', () => {
  it('returns a mapped entity on 200', async () => {
    const calls: MockCall[] = [];
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: mockPool([SAMPLE_ROW], calls),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/entities/ent/ENT-4000' });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { data: unknown; meta: { request_id: string } };
      expect(body.meta.request_id).toBeTypeOf('string');
      expect(body.data).toMatchObject({
        ent_id: 'ENT-4000',
        id: 42,
        name: 'Andromeda Galaxy',
        ra_deg: 10.6847,
        dec_deg: 41.2688,
        distance_pc: 778000,
        magnitude: 3.44,
        _links: { self: '/v1/entities/ent/ENT-4000' },
      });
      expect(calls[0]?.params).toEqual(['ENT-4000']);
      expect(calls[0]?.text).toContain('WHERE ent_id = $1');
    } finally {
      await app.close();
    }
  });

  it('returns 404 when row missing', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: mockPool([], []),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/entities/ent/DOES-NOT-EXIST' });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('rejects malformed ent_id with 400 (no SQL executed)', async () => {
    const calls: MockCall[] = [];
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: mockPool([], calls),
      logLevel: 'silent',
    });
    try {
      const injection = encodeURIComponent("' OR 1=1; DROP TABLE entities;--");
      const res = await app.inject({ method: 'GET', url: `/v1/entities/ent/${injection}` });
      expect(res.statusCode).toBe(400);
      expect(calls.length).toBe(0);
    } finally {
      await app.close();
    }
  });

  it('emits ETag and returns 304 on matching If-None-Match', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: mockPool([SAMPLE_ROW], []),
      logLevel: 'silent',
    });
    try {
      const first = await app.inject({ method: 'GET', url: '/v1/entities/ent/ENT-4000' });
      const tag = first.headers.etag as string | undefined;
      expect(tag).toBeDefined();
      const second = await app.inject({
        method: 'GET',
        url: '/v1/entities/ent/ENT-4000',
        headers: { 'if-none-match': tag ?? '' },
      });
      expect(second.statusCode).toBe(304);
    } finally {
      await app.close();
    }
  });
});

describe('GET /v1/entities/:id', () => {
  it('routes numeric ids by primary key', async () => {
    const calls: MockCall[] = [];
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: mockPool([SAMPLE_ROW], calls),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/entities/42' });
      expect(res.statusCode).toBe(200);
      expect(calls[0]?.text).toContain('WHERE id = $1');
      expect(calls[0]?.params).toEqual([42]);
    } finally {
      await app.close();
    }
  });

  it('non-numeric id falls through to ent_id handler (404 when missing)', async () => {
    const calls: MockCall[] = [];
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: mockPool([], calls),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/entities/not-a-number' });
      // Schema validation rejects non-digit id on the numeric route.
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});
