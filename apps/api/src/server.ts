import cors from '@fastify/cors';
import etag from '@fastify/etag';
import Fastify, { type FastifyInstance } from 'fastify';

import rateLimitPlugin from './middleware/rate-limit.js';
import redisPlugin from './plugins/redis.js';
import entitiesRoutes from './routes/entities.js';
import { healthRoutes } from './routes/health.js';
import searchRoutes from './routes/search.js';

export interface BuildServerOptions {
  readonly logLevel?: string;
  readonly corsOrigin?: string;
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

  await app.register(etag);
  await app.register(redisPlugin);
  await app.register(rateLimitPlugin);

  await app.register(healthRoutes);
  await app.register(entitiesRoutes);
  await app.register(searchRoutes);

  return app;
}
