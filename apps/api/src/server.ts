import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { rateLimitPlugin, type RateLimitTierConfig } from './middleware/rate-limit.js';
import { redisPlugin } from './plugins/redis.js';
import { healthRoutes } from './routes/health.js';

export interface BuildServerOptions {
  readonly logLevel?: string;
  readonly corsOrigin?: string;
  readonly enableRedis?: boolean;
  readonly enableRateLimit?: boolean;
  readonly rateLimitTiers?: RateLimitTierConfig;
}

export async function buildServer(opts: BuildServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: opts.logLevel ?? process.env.LOG_LEVEL ?? 'info',
    },
    disableRequestLogging: false,
  });

  await app.register(cors, {
    origin: opts.corsOrigin ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  });

  const redisConfigured = Boolean(process.env.REDIS_URL);
  const useRedis = opts.enableRedis ?? redisConfigured;
  if (useRedis) {
    await app.register(redisPlugin, {});
  }

  const rateLimitEnabled = opts.enableRateLimit ?? true;
  await app.register(rateLimitPlugin, {
    enabled: rateLimitEnabled,
    ...(opts.rateLimitTiers ? { limits: opts.rateLimitTiers } : {}),
  });

  await app.register(healthRoutes);

  return app;
}
