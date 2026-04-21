import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { Redis } from 'ioredis';

export type AuthTier = 'anonymous' | 'registered' | 'research' | 'internal';

export interface TierConfig {
  readonly max: number | false;
  readonly timeWindow: string;
}

export const TIER_LIMITS: Record<AuthTier, TierConfig> = {
  anonymous: { max: 60, timeWindow: '1 minute' },
  registered: { max: 300, timeWindow: '1 minute' },
  research: { max: 1000, timeWindow: '1 minute' },
  internal: { max: false, timeWindow: '1 minute' },
};

function detectTier(req: FastifyRequest): AuthTier {
  const auth = req.headers.authorization;
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
    return 'anonymous';
  }
  const token = auth.slice('Bearer '.length);
  if (token === process.env.INTERNAL_API_KEY && token.length > 0) {
    return 'internal';
  }
  if (token.startsWith('research_')) {
    return 'research';
  }
  return 'registered';
}

function keyGenerator(req: FastifyRequest): string {
  const ip = req.ip;
  const auth = req.headers.authorization ?? '';
  return auth.length > 0 ? `ip:${ip}|auth:${hashToken(auth)}` : `ip:${ip}`;
}

function hashToken(token: string): string {
  let h = 0;
  for (let i = 0; i < token.length; i += 1) {
    h = (h * 31 + token.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

const rateLimitPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const redis =
    'redis' in app && app.redis !== undefined ? (app.redis as Redis) : undefined;

  await app.register(rateLimit, {
    global: true,
    max: (req: FastifyRequest) => {
      const tier = detectTier(req);
      const cfg = TIER_LIMITS[tier];
      return cfg.max === false ? Number.MAX_SAFE_INTEGER : cfg.max;
    },
    timeWindow: '1 minute',
    keyGenerator,
    redis,
    skipOnError: true,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });
};

export default fp(rateLimitPlugin, { name: 'rate-limit', dependencies: ['redis'] });
