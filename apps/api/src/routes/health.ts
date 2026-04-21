import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { FastifyInstance } from 'fastify';

interface PackageJson {
  readonly version: string;
}

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf-8')
) as PackageJson;

interface HealthResponse {
  readonly status: 'ok';
  readonly uptime: number;
  readonly version: string;
}

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (): Promise<HealthResponse> => ({
    status: 'ok',
    uptime: process.uptime(),
    version: pkg.version,
  }));
}
