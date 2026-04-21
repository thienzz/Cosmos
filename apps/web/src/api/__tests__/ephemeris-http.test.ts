import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  apiConfig,
  getEphemeris,
  getEphemerisRange,
  postEphemerisBatch,
} from '../index';

function envelope<T>(data: T): unknown {
  return { data, meta: { request_id: 'r', data_version: 'v', timestamp: 't' } };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api/ephemeris HTTP', () => {
  beforeEach(() => {
    apiConfig.reset();
    apiConfig.setBaseUrl('https://api.test/v1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    apiConfig.reset();
  });

  it('getEphemeris rejects negative NAIF ids without a network call', async () => {
    const fetchImpl = vi.fn();
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    await expect(
      getEphemeris(-5, { epochJD: 2_460_000.5 }),
    ).rejects.toMatchObject({ code: 'INVALID_NAIF_ID' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('getEphemeris rejects epochs outside the supported range', async () => {
    const fetchImpl = vi.fn();
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    await expect(
      getEphemeris(399, { epochJD: 1_000_000 }),
    ).rejects.toMatchObject({ code: 'EPOCH_OUT_OF_RANGE' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('getEphemeris forwards epoch, frame, observer as query params', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        envelope({
          naif_id: 399,
          name: 'Earth',
          epoch_jd: 2_460_000.5,
          frame: 'ECLIPJ2000',
          observer: 10,
          position_au: { x: 1, y: 0, z: 0 },
          velocity_au_day: { x: 0, y: 0.017, z: 0 },
          light_time_s: 499,
        }),
      ),
    );
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const data = await getEphemeris(399, {
      epochJD: 2_460_000.5,
      frame: 'J2000',
      observer: 10,
    });
    expect(data.name).toBe('Earth');
    const url = (fetchImpl.mock.calls[0] as [string])[0];
    expect(url).toContain('/ephemeris/399');
    expect(url).toContain('epoch=2460000.5');
    expect(url).toContain('frame=J2000');
    expect(url).toContain('observer=10');
  });

  it('getEphemerisRange validates both endpoints', async () => {
    await expect(
      getEphemerisRange(399, { startJD: 1_000_000, endJD: 2_460_000.5 }),
    ).rejects.toMatchObject({ code: 'EPOCH_OUT_OF_RANGE' });
  });

  it('postEphemerisBatch validates first, then posts the normalised body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(envelope({ results: [], count: 0 })),
    );
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    await postEphemerisBatch({ naif_ids: [399], epochs: [2_460_000.5] });
    const init = (fetchImpl.mock.calls[0] as [string, RequestInit])[1];
    expect(init.method).toBe('POST');
    const body = JSON.parse((init.body as string) ?? '{}') as Record<string, unknown>;
    expect(body.frame).toBe('ECLIPJ2000');
    expect(body.observer).toBe(10);
  });

  it('postEphemerisBatch propagates validator errors without touching fetch', async () => {
    const fetchImpl = vi.fn();
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    await expect(postEphemerisBatch({ naif_ids: [], epochs: [] })).rejects.toThrow(
      /EMPTY_REQUEST|≥1/i,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
