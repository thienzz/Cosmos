import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Redis, { type RedisOptions } from 'ioredis';


export interface RedisPluginOptions {
  readonly url?: string;
  readonly db?: number;
}

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPluginImpl(app: FastifyInstance, opts: RedisPluginOptions): Promise<void> {
  const url = opts.url ?? process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is required for the redis plugin');
  const config: RedisOptions = {
    lazyConnect: false,
    enableAutoPipelining: true,
    maxRetriesPerRequest: 3,
  };
  if (typeof opts.db === 'number') config.db = opts.db;
  const client = new Redis(url, config);
  client.on('error', (err) => {
    app.log.error({ err }, 'redis error');
  });
  app.decorate('redis', client);
  app.addHook('onClose', async () => {
    await client.quit().catch(() => undefined);
  });
}

export const redisPlugin = fp(redisPluginImpl, {
  name: 'cosmos-redis',
  fastify: '4.x',
});
