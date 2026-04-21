import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  apiConfig,
  clearEntityCache,
  clearEtagCache,
  getEntity,
  getEntityByEntId,
  peekEntityCache,
} from '../index';

function envelope<T>(data: T, extra: Record<string, unknown> = {}): unknown {
  return {
    data,
    meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
    ...extra,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers as object) },
  });
}

function fakeEntity(id: number, overrides: Partial<Record<string, unknown>> = {}): unknown {
  return {
    id,
    ent_id: `ENT-${1000 + id}`,
    name: `Entity ${id}`,
    category: 1,
    category_name: 'Stars',
    entity_type: 1001,
    type_name: 'Main Sequence Star',
    aliases: [],
    position: { ra: 0, dec: 0, distance_pc: 1 },
    properties: {},
    catalog_ids: {},
    data_source: 'gaia_dr3',
    data_quality: 1,
    toggles: [],
    _links: { self: `/v1/entities/${id}` },
    ...overrides,
  };
}

describe('api/entities', () => {
  beforeEach(() => {
    apiConfig.reset();
    apiConfig.setBaseUrl('https://api.test/v1');
    clearEntityCache();
    clearEtagCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    apiConfig.reset();
  });

  it('getEntity validates the id locally before the network hop', async () => {
    const fetchImpl = vi.fn();
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    await expect(getEntity(-1)).rejects.toMatchObject({ code: 'INVALID_ID' });
    await expect(getEntity(1.5)).rejects.toMatchObject({ code: 'INVALID_ID' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('getEntity caches by numeric id across calls (one network hit)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope(fakeEntity(42))));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const first = await getEntity(42);
    const second = await getEntity(42);
    expect(first).toBe(second); // same reference
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(peekEntityCache(42)?.name).toBe('Entity 42');
  });

  it('bypassCache forces a fresh GET', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(envelope(fakeEntity(42, { name: 'v1' }))))
      .mockResolvedValueOnce(jsonResponse(envelope(fakeEntity(42, { name: 'v2' }))));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const a = await getEntity(42);
    const b = await getEntity(42, { bypassCache: true });
    expect(a.name).toBe('v1');
    expect(b.name).toBe('v2');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('getEntityByEntId rejects malformed ids locally', async () => {
    await expect(getEntityByEntId('ent-1')).rejects.toMatchObject({ code: 'INVALID_ID' });
    await expect(getEntityByEntId('ENT-12345')).rejects.toMatchObject({ code: 'INVALID_ID' });
  });

  it('getEntityByEntId cross-indexes id and ent_id caches', async () => {
    const entity = fakeEntity(42, { ent_id: 'ENT-1042' });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope(entity)));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const byEnt = await getEntityByEntId('ent-1042');
    const byId = await getEntity(42);
    expect(byEnt).toBe(byId);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('appends the fields query param when provided', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope(fakeEntity(42))));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    await getEntity(42, { fields: ['id', 'name', 'position'] });
    expect((fetchImpl.mock.calls[0] as [string])[0]).toContain('fields=id%2Cname%2Cposition');
  });
});
