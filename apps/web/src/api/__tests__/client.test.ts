import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  apiConfig,
  apiGet,
  apiGetCollection,
  apiPost,
  clearEtagCache,
  getRateLimit,
} from '../index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  const status = init.status ?? 200;
  const headers = new Headers({ 'content-type': 'application/json', ...init.headers });
  return new Response(JSON.stringify(body), { status, headers });
}

function envelope<T>(data: T, extra: Record<string, unknown> = {}): unknown {
  return {
    data,
    meta: {
      request_id: 'req-test',
      data_version: '2026.Q1.0',
      timestamp: new Date().toISOString(),
    },
    ...extra,
  };
}

function errorEnvelope(code: string, status: number, extra: Record<string, unknown> = {}): unknown {
  return {
    error: {
      code,
      message: `${code} occurred`,
      status,
      request_id: 'req-err',
      ...extra,
    },
  };
}

describe('api/client', () => {
  beforeEach(() => {
    apiConfig.reset();
    apiConfig.setBaseUrl('https://api.test/v1');
    clearEtagCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    apiConfig.reset();
  });

  it('GET unwraps the Doc 26 §2.5 envelope', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope({ id: 42, name: 'x' })));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const data = await apiGet<{ id: number; name: string }>('/entities/42');
    expect(data).toEqual({ id: 42, name: 'x' });
    const call = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('https://api.test/v1/entities/42');
    expect(call[1]?.method).toBe('GET');
  });

  it('GET attaches Authorization header when apiKey is set', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope({ id: 1 })));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    apiConfig.setApiKey('ce_reg_foo');

    await apiGet('/entities/1');
    const headers = (fetchImpl.mock.calls[0] as [string, RequestInit])[1].headers as Record<
      string,
      string
    >;
    expect(headers.authorization).toBe('Bearer ce_reg_foo');
  });

  it('GET encodes query params correctly', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope(null)));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    await apiGet('/ephemeris/399', {
      query: { epoch: 2460000.5, frame: 'J2000', observer: 10, nothing: null },
    });
    const url = (fetchImpl.mock.calls[0] as [string])[0];
    expect(url).toContain('epoch=2460000.5');
    expect(url).toContain('frame=J2000');
    expect(url).toContain('observer=10');
    expect(url).not.toContain('nothing=');
  });

  it('throws ApiError with code + status on 404', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(errorEnvelope('ENTITY_NOT_FOUND', 404), { status: 404 }));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    await expect(apiGet('/entities/999')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'ENTITY_NOT_FOUND',
      status: 404,
    });
  });

  it('retries 503 up to maxRetries then gives up', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(errorEnvelope('SERVICE_UNAVAILABLE', 503), { status: 503 }));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    await expect(apiGet('/entities/1', { maxRetries: 1 })).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it('honours retry_after_seconds on 429 then succeeds on retry', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(errorEnvelope('RATE_LIMIT_EXCEEDED', 429, { retry_after_seconds: 0 }), {
          status: 429,
        }),
      )
      .mockResolvedValueOnce(jsonResponse(envelope({ id: 1 })));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const data = await apiGet<{ id: number }>('/entities/1', { maxRetries: 1 });
    expect(data).toEqual({ id: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('captures rate-limit headers into a snapshot', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(envelope({ id: 1 }), {
        headers: {
          'x-ratelimit-limit': '60',
          'x-ratelimit-remaining': '42',
          'x-ratelimit-reset': '1713528000',
          'x-data-version': '2026.Q1.3',
        },
      }),
    );
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    await apiGet('/entities/1');
    expect(getRateLimit()).toEqual({
      limit: 60,
      remaining: 42,
      resetUnix: 1713528000,
      dataVersion: '2026.Q1.3',
    });
  });

  it('stores + revalidates via ETag (304 serves cached body)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(envelope({ id: 1, name: 'Sirius' }), { headers: { etag: 'W/"v1"' } }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const first = await apiGet<{ id: number; name: string }>('/entities/42');
    const second = await apiGet<{ id: number; name: string }>('/entities/42');
    expect(first).toEqual({ id: 1, name: 'Sirius' });
    expect(second).toEqual(first);
    const secondHeaders = (fetchImpl.mock.calls[1] as [string, RequestInit])[1].headers as Record<
      string,
      string
    >;
    expect(secondHeaders['if-none-match']).toBe('W/"v1"');
  });

  it('bypasses cache when requested', async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse(envelope({ id: 1 }), { headers: { etag: 'W/"v1"' } })),
      );
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);
    await apiGet('/entities/1');
    await apiGet('/entities/1', { bypassCache: true });
    const secondHeaders = (fetchImpl.mock.calls[1] as [string, RequestInit])[1].headers as Record<
      string,
      string
    >;
    expect(secondHeaders['if-none-match']).toBeUndefined();
  });

  it('wraps network failures in a NETWORK_ERROR ApiError', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('boom'));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const err = await apiGet('/entities/1', { maxRetries: 0 }).catch((e) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('NETWORK_ERROR');
  });

  it('apiGetCollection returns items + pagination', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [{ naif_id: 399 }, { naif_id: 499 }],
        meta: { request_id: 'r', data_version: 'v', timestamp: 't' },
        pagination: { total: 2, limit: 50, offset: 0, has_more: false },
      }),
    );
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    const result = await apiGetCollection<{ naif_id: number }>('/solar-system/bodies');
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it('apiPost serialises JSON body and sets content-type', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope({ ok: true })));
    apiConfig.setFetchImpl(fetchImpl as unknown as typeof fetch);

    await apiPost('/ephemeris/batch', { naif_ids: [399], epochs: [2460000.5] });
    const init = (fetchImpl.mock.calls[0] as [string, RequestInit])[1];
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['content-type']).toContain('application/json');
    expect(init.body).toBe(JSON.stringify({ naif_ids: [399], epochs: [2460000.5] }));
  });
});
