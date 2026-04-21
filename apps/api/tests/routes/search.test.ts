import type { Client as EsClient } from '@elastic/elasticsearch';
import type Redis from 'ioredis';
import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';

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

function fakeEs(options: Array<{ text: string; source: Record<string, unknown> }>): EsClient {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    search: async () => ({
      suggest: {
        name_sug: [
          {
            options: options.map((o) => ({ text: o.text, _source: o.source })),
          },
        ],
      },
    }),
    // eslint-disable-next-line @typescript-eslint/require-await
    close: async () => undefined,
  } as unknown as EsClient;
}

function fakeRedis(): { client: Redis; store: Map<string, string> } {
  const store = new Map<string, string>();
  const client = {
    // eslint-disable-next-line @typescript-eslint/require-await
    get: async (k: string) => store.get(k) ?? null,
    // eslint-disable-next-line @typescript-eslint/require-await
    set: async (k: string, v: string) => {
      store.set(k, v);
      return 'OK' as const;
    },
  } as unknown as Redis;
  return { client, store };
}

describe('GET /v1/search/autocomplete', () => {
  it('returns ES suggestions on first hit', async () => {
    const es = fakeEs([
      {
        text: 'Andromeda Galaxy',
        source: { ent_id: 'GAL-m31', category: 3, kind: 4000, magnitude: 3.44 },
      },
    ]);
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([], []),
      es,
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/search/autocomplete?q=androm',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        data: { suggestions: Array<{ text: string; ent_id: string }>; source: string };
        meta: { request_id: string };
      };
      expect(body.meta.request_id).toBeTypeOf('string');
      expect(body.data.source).toBe('es');
      expect(body.data.suggestions[0]?.text).toBe('Andromeda Galaxy');
      expect(body.data.suggestions[0]?.ent_id).toBe('GAL-m31');
    } finally {
      await app.close();
    }
  });

  it('hits ES once and redis thereafter when cache warm', async () => {
    const es = fakeEs([
      { text: 'Sirius', source: { ent_id: 'STAR-sirius', category: 1 } },
    ]);
    const esSpy = vi.spyOn(es, 'search');
    const { client: redis, store } = fakeRedis();
    // Pre-warm cache so the first request takes the cache branch.
    store.set(
      'ac:*:10:sir',
      JSON.stringify([{ text: 'Sirius', ent_id: 'STAR-sirius', category: 1, kind: null, magnitude: null }])
    );
    const { searchRoutes } = await import('../../src/routes/search.js');
    const { buildServer } = await import('../../src/server.js');
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: false, // avoid default registration so we can wire our own
      logLevel: 'silent',
    });
    await app.register(searchRoutes, {
      pool: fakePool([], []),
      es,
      redis,
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/search/autocomplete?q=sir' });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { data: { source: string } };
      expect(body.data.source).toBe('cache');
      expect(esSpy).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('400 on empty q', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([], []),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/search/autocomplete?q=' });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it('503 when ES not configured', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([], []),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/search/autocomplete?q=abc' });
      expect(res.statusCode).toBe(503);
    } finally {
      await app.close();
    }
  });
});

describe('GET /v1/search', () => {
  it('returns paginated full-text results', async () => {
    const calls: PgCall[] = [];
    const rows = [
      {
        id: 1,
        ent_id: 'GAL-m31',
        entity_type: 4000,
        category: 3,
        name: 'Andromeda Galaxy',
        ra: 10.6847,
        dec_coord: 41.2688,
        distance_pc: 778000,
        properties: { magnitude_apparent: 3.44 },
        __total: 1,
      },
    ];
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool(rows, calls),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/search?q=andromeda&limit=5',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        data: unknown[];
        pagination: { total: number; limit: number; offset: number; has_more: boolean };
      };
      expect(body.pagination.total).toBe(1);
      expect(body.data).toHaveLength(1);
      expect(body.pagination.limit).toBe(5);
      expect(body.pagination.has_more).toBe(false);
      expect(calls[0]?.params[0]).toBe('andromeda');
    } finally {
      await app.close();
    }
  });

  it('400 on missing q', async () => {
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool([], []),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({ method: 'GET', url: '/v1/search' });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});

describe('GET /v1/search/cone', () => {
  it('runs parameterized PostGIS query', async () => {
    const calls: PgCall[] = [];
    const rows = [
      {
        id: 2,
        ent_id: 'STAR-sirius',
        entity_type: 1000,
        category: 1,
        name: 'Sirius',
        ra: 101.2875,
        dec_coord: -16.7161,
        distance_pc: 2.637,
        properties: { magnitude_apparent: -1.46 },
      },
    ];
    const app = await buildServer({
      enableRateLimit: false,
      enableRedis: false,
      enableDb: true,
      pool: fakePool(rows, calls),
      logLevel: 'silent',
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/search/cone?ra=101.2875&dec=-16.7161&radius_deg=5',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { data: { count: number; items: unknown[] } };
      expect(body.data.count).toBe(1);
      expect(calls[0]?.text).toContain('ST_DWithin');
      expect(calls[0]?.params.slice(0, 2)).toEqual([101.2875, -16.7161]);
    } finally {
      await app.close();
    }
  });

  it('rejects invalid RA/Dec ranges with 400', async () => {
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
        url: '/v1/search/cone?ra=400&dec=0&radius_deg=5',
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});
