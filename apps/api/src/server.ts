import type { Client as EsClient } from '@elastic/elasticsearch';
import cors from '@fastify/cors';
import etag from '@fastify/etag';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Pool } from 'pg';

import { getPool } from './db/pool.js';
import { getEsClient } from './es/client.js';
import { rateLimitPlugin, type RateLimitTierConfig } from './middleware/rate-limit.js';
import envelopePlugin from './plugins/envelope.js';
import { redisPlugin } from './plugins/redis.js';
import { entityRoutes } from './routes/entities.js';
import { healthRoutes } from './routes/health.js';
import { searchRoutes } from './routes/search.js';
import { solarSystemRoutes } from './routes/solar-system.js';
import { websocketRoutes } from './routes/websocket.js';

export interface BuildServerOptions {
  readonly logLevel?: string;
  readonly corsOrigin?: string;
  readonly enableRedis?: boolean;
  readonly enableRateLimit?: boolean;
  readonly rateLimitTiers?: RateLimitTierConfig;
  readonly pool?: Pool;
  readonly enableDb?: boolean;
  readonly es?: EsClient;
  readonly enableEs?: boolean;
  readonly enableSearch?: boolean;
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

  await app.register(etag, { algorithm: 'sha1' });

  // Doc 26 §2.5 — wrap all non-error, non-binary 2xx responses in the
  // `{ data, meta, [pagination] }` envelope the client expects. Applied as
  // a `preSerialization` hook so handlers can keep returning their natural
  // shape unchanged.
  await app.register(envelopePlugin, {
    dataVersion: process.env.COSMOS_DATA_VERSION ?? '0.1.0',
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

  // T-H-06 — WebSocket transport for real-time push messages (Doc 26 §14).
  // Registered early so its upgrade handler is in place before any route
  // that might read a ws-only decorator.
  await app.register(websocket, {
    options: {
      // FE reconnect loop treats a closed socket as a hiccup, so we don't
      // need server-side backpressure tuning yet. The default max payload
      // (1 MB) is plenty for JSON control frames.
      maxPayload: 1_048_576,
    },
  });
  await app.register(websocketRoutes);

  const dbConfigured = Boolean(process.env.DATABASE_URL);
  const useDb = opts.enableDb ?? dbConfigured;
  let pool: Pool | undefined;
  if (useDb) {
    pool = opts.pool ?? getPool();
    await app.register(entityRoutes, { pool });
    await app.register(solarSystemRoutes, { pool });
  }

  const esConfigured = Boolean(process.env.ELASTICSEARCH_URL);
  const useEs = opts.enableEs ?? (opts.es !== undefined || esConfigured);
  let es: EsClient | undefined;
  if (useEs) {
    es = opts.es ?? getEsClient();
  }

  const useSearch = opts.enableSearch ?? useDb;
  if (useSearch && pool) {
    const redis = app.hasDecorator('redis') ? app.redis : undefined;
    await app.register(searchRoutes, {
      pool,
      ...(es ? { es } : {}),
      ...(redis ? { redis } : {}),
    });
  }

  return app;
}
