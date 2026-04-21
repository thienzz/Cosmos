import { createHash } from 'node:crypto';

import fastifyRateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';


export type RateLimitTier = 'anonymous' | 'registered' | 'research' | 'internal';

export interface RateLimitTierConfig {
  readonly anonymous: number;
  readonly registered: number;
  readonly research: number;
  readonly internal: number;
}

export const DEFAULT_TIER_LIMITS: RateLimitTierConfig = {
  anonymous: 60,
  registered: 300,
  research: 1000,
  internal: Number.MAX_SAFE_INTEGER,
};

const TIER_HEADER = 'x-cosmos-tier';

export interface ParsedAuth {
  readonly tier: RateLimitTier;
  readonly principalHash: string | null;
}

export function parseAuthHeader(req: FastifyRequest): ParsedAuth {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return { tier: 'anonymous', principalHash: null };
  }
  const token = header.slice(7).trim();
  if (!token) return { tier: 'anonymous', principalHash: null };

  const headerTier = req.headers[TIER_HEADER];
  const tierCandidate =
    typeof headerTier === 'string' ? headerTier.toLowerCase() : Array.isArray(headerTier) ? headerTier[0] : undefined;
  const tier: RateLimitTier =
    tierCandidate === 'research' || tierCandidate === 'internal' || tierCandidate === 'registered'
      ? tierCandidate
      : 'registered';

  const principalHash = createHash('sha256').update(token).digest('hex').slice(0, 16);
  return { tier, principalHash };
}

function clientIp(req: FastifyRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? req.ip;
  }
  return req.ip;
}

export function rateLimitKey(req: FastifyRequest): string {
  const { tier, principalHash } = parseAuthHeader(req);
  if (principalHash) return `t:${tier}:${principalHash}`;
  return `t:${tier}:ip:${clientIp(req)}`;
}

export function maxForRequest(
  limits: RateLimitTierConfig,
  req: FastifyRequest
): number {
  const { tier } = parseAuthHeader(req);
  return limits[tier];
}

export interface RegisterRateLimitOptions {
  readonly limits?: RateLimitTierConfig;
  readonly timeWindow?: number | string;
  readonly enabled?: boolean;
}

async function registerRateLimitImpl(
  app: FastifyInstance,
  opts: RegisterRateLimitOptions
): Promise<void> {
  if (opts.enabled === false) return;
  const limits = opts.limits ?? DEFAULT_TIER_LIMITS;
  const redis = app.hasDecorator('redis') ? app.redis : undefined;
  await app.register(fastifyRateLimit, {
    global: true,
    redis,
    timeWindow: opts.timeWindow ?? '1 minute',
    keyGenerator: rateLimitKey,
    max: (req) => maxForRequest(limits, req),
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });
}

export const rateLimitPlugin = fp(registerRateLimitImpl, {
  name: 'cosmos-rate-limit',
  dependencies: [],
  fastify: '4.x',
});
