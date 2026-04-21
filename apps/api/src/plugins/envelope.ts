import { randomUUID } from 'node:crypto';

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const DATA_VERSION = process.env.COSMOS_DATA_VERSION ?? 'dev-0';

function isWrapped(body: unknown): boolean {
  if (body === null || typeof body !== 'object') return false;
  return 'data' in (body as Record<string, unknown>) || 'error' in (body as Record<string, unknown>);
}

function isCollectionPayload(body: Record<string, unknown>): body is {
  items: unknown[];
  total: number;
  limit: number;
  offset: number;
  _links?: Record<string, string | null>;
} {
  return (
    Array.isArray(body.items) &&
    typeof body.total === 'number' &&
    typeof body.limit === 'number' &&
    typeof body.offset === 'number'
  );
}

const envelopePlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('onSend', async (req, reply, payload) => {
    const ctype = reply.getHeader('content-type');
    if (typeof ctype !== 'string' || !ctype.includes('application/json')) {
      return payload;
    }
    // Bypass unversioned probes (health, metrics) — they're consumed by
    // infrastructure (docker HEALTHCHECK, CI smoke) that expects bare JSON.
    const routerPath = req.routeOptions?.url ?? req.url;
    if (typeof routerPath === 'string' && (routerPath === '/health' || routerPath.startsWith('/metrics'))) {
      return payload;
    }
    // Only JSON bodies we emitted — bypass for pre-wrapped, errors, and binary.
    if (typeof payload !== 'string') return payload;
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return payload;
    }
    if (isWrapped(parsed)) {
      return payload;
    }

    const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    const meta = {
      request_id: requestId,
      data_version: DATA_VERSION,
      timestamp: new Date().toISOString(),
    };

    // Error status — rewrap to the Doc 26 §15 error envelope.
    if (reply.statusCode >= 400) {
      const body = (parsed ?? {}) as Record<string, unknown>;
      const message = (body.message as string | undefined) ?? `HTTP ${reply.statusCode}`;
      const code =
        (body.error as string | undefined)?.toUpperCase()?.replace(/[^A-Z0-9_]/g, '_') ??
        (reply.statusCode === 404 ? 'NOT_FOUND' : reply.statusCode === 400 ? 'INVALID_PARAMETER' : 'INTERNAL_ERROR');
      return JSON.stringify({
        error: {
          code,
          message,
          status: reply.statusCode,
          request_id: requestId,
          ...(body.issues !== undefined ? { details: { issues: body.issues } } : {}),
        },
      });
    }

    if (parsed !== null && typeof parsed === 'object' && isCollectionPayload(parsed as Record<string, unknown>)) {
      const c = parsed as {
        items: unknown[];
        total: number;
        limit: number;
        offset: number;
        _links?: Record<string, string | null>;
      };
      const pagination = {
        total: c.total,
        limit: c.limit,
        offset: c.offset,
        has_more: c.offset + c.limit < c.total,
        ...(c._links?.next ? { next: c._links.next } : {}),
      };
      return JSON.stringify({ data: c.items, meta, pagination });
    }

    if (Array.isArray(parsed)) {
      return JSON.stringify({
        data: parsed,
        meta,
        pagination: { total: parsed.length, limit: parsed.length, offset: 0, has_more: false },
      });
    }

    return JSON.stringify({ data: parsed, meta });
  });
};

export default fp(envelopePlugin, { name: 'envelope' });
