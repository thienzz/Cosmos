import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import searchRoutes from '../../src/routes/search.js';

async function buildTestApp() {
  const app = Fastify({ logger: false });
  await app.register(searchRoutes);
  return app;
}

describe('GET /v1/search input validation', () => {
  it('rejects missing q', async () => {
    const app = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/v1/search' });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects negative distance_max_pc', async () => {
    const app = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/v1/search?q=x&distance_max_pc=-1' });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});

describe('GET /v1/search/autocomplete input validation', () => {
  it('rejects empty q', async () => {
    const app = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/v1/search/autocomplete' });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects q longer than 64 chars', async () => {
    const app = await buildTestApp();
    const q = 'a'.repeat(65);
    const res = await app.inject({ method: 'GET', url: `/v1/search/autocomplete?q=${q}` });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects limit > 20', async () => {
    const app = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/v1/search/autocomplete?q=x&limit=50' });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
