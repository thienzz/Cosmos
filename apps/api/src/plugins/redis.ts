import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    app.log.warn({ err }, 'redis: connection error');
  });

  try {
    await redis.connect();
  } catch (err) {
    app.log.warn({ err }, 'redis: initial connect failed — rate-limit will fall back to memory');
  }

  app.decorate('redis', redis);

  app.addHook('onClose', async () => {
    await redis.quit().catch(() => undefined);
  });
};

export default fp(redisPlugin, { name: 'redis' });
