import type { FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TIER_LIMITS,
  maxForRequest,
  parseAuthHeader,
  rateLimitKey,
} from '../../src/middleware/rate-limit.js';

function fakeReq(headers: Record<string, string | string[]>, ip = '127.0.0.1'): FastifyRequest {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { headers, ip } as unknown as FastifyRequest;
}

describe('rate-limit tier detection', () => {
  it('defaults to anonymous without auth header', () => {
    const req = fakeReq({});
    expect(parseAuthHeader(req)).toEqual({ tier: 'anonymous', principalHash: null });
  });

  it('registered tier for plain Bearer token', () => {
    const req = fakeReq({ authorization: 'Bearer abc.def.ghi' });
    const parsed = parseAuthHeader(req);
    expect(parsed.tier).toBe('registered');
    expect(parsed.principalHash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('honours X-Cosmos-Tier: research / internal', () => {
    const research = parseAuthHeader(
      fakeReq({ authorization: 'Bearer tok', 'x-cosmos-tier': 'research' })
    );
    const internal = parseAuthHeader(
      fakeReq({ authorization: 'Bearer tok', 'x-cosmos-tier': 'internal' })
    );
    expect(research.tier).toBe('research');
    expect(internal.tier).toBe('internal');
  });

  it('reverts to registered for unknown tier value', () => {
    const parsed = parseAuthHeader(
      fakeReq({ authorization: 'Bearer tok', 'x-cosmos-tier': 'bogus' })
    );
    expect(parsed.tier).toBe('registered');
  });
});

describe('rate-limit key generation', () => {
  it('uses principal hash for authenticated requests', () => {
    const key = rateLimitKey(fakeReq({ authorization: 'Bearer abc' }));
    expect(key).toMatch(/^t:registered:[0-9a-f]{16}$/);
  });

  it('falls back to IP for anonymous', () => {
    const key = rateLimitKey(fakeReq({}, '10.0.0.5'));
    expect(key).toBe('t:anonymous:ip:10.0.0.5');
  });

  it('prefers x-forwarded-for first hop', () => {
    const key = rateLimitKey(
      fakeReq({ 'x-forwarded-for': '1.2.3.4, 10.0.0.5' }, '10.0.0.5')
    );
    expect(key).toBe('t:anonymous:ip:1.2.3.4');
  });
});

describe('rate-limit tier limits', () => {
  it('returns matching max per tier', () => {
    expect(maxForRequest(DEFAULT_TIER_LIMITS, fakeReq({}))).toBe(60);
    expect(
      maxForRequest(DEFAULT_TIER_LIMITS, fakeReq({ authorization: 'Bearer t' }))
    ).toBe(300);
    expect(
      maxForRequest(
        DEFAULT_TIER_LIMITS,
        fakeReq({ authorization: 'Bearer t', 'x-cosmos-tier': 'research' })
      )
    ).toBe(1000);
  });
});
