import { createHash, randomUUID } from 'node:crypto';

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export interface EnvelopePluginOptions {
  readonly dataVersion?: string;
  readonly skipPaths?: readonly (string | RegExp)[];
}

const DEFAULT_SKIP: readonly RegExp[] = [
  /^\/health(?:\/|$)/,
  /^\/v1\/tiles(?:\/|$)/,
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && v.constructor === Object;
}

function isAlreadyEnveloped(v: Record<string, unknown>): boolean {
  return 'data' in v && 'meta' in v && isPlainObject(v.meta);
}

function isErrorEnvelope(v: Record<string, unknown>): boolean {
  return 'error' in v && isPlainObject(v.error);
}

function shouldSkip(url: string, skip: readonly (string | RegExp)[]): boolean {
  for (const pat of skip) {
    if (typeof pat === 'string' ? url.startsWith(pat) : pat.test(url)) return true;
  }
  return false;
}

function extractRequestId(req: FastifyRequest): string {
  const fromHeader = req.headers['x-request-id'];
  if (typeof fromHeader === 'string' && fromHeader.length > 0) return fromHeader;
  if (Array.isArray(fromHeader) && fromHeader[0]) return fromHeader[0];
  return randomUUID();
}

type PaginationLike = {
  total: unknown;
  limit: unknown;
  offset: unknown;
};

function looksLikePaginated(obj: Record<string, unknown>): obj is PaginationLike & {
  items: unknown[];
} {
  return (
    Array.isArray(obj.items) &&
    typeof obj.total === 'number' &&
    typeof obj.limit === 'number' &&
    typeof obj.offset === 'number'
  );
}

async function envelopePlugin(
  app: FastifyInstance,
  options: EnvelopePluginOptions,
): Promise<void> {
  const dataVersion = options.dataVersion ?? process.env.COSMOS_DATA_VERSION ?? 'dev';
  const skip = [...DEFAULT_SKIP, ...(options.skipPaths ?? [])];

  function stableEtag(data: unknown): string {
    // ETag must only depend on the response data — not meta.request_id or
    // meta.timestamp — otherwise the 304 revalidation path is dead.
    const hash = createHash('sha1').update(JSON.stringify(data)).digest('base64').slice(0, 22);
    return `W/"${hash}"`;
  }

  function setDeterministicEtag(reply: FastifyReply, data: unknown): void {
    // Only set when no handler-provided ETag; skip when @fastify/etag
    // already wrote one (never happens in preSerialization, but defensive).
    if (reply.hasHeader('etag')) return;
    reply.header('etag', stableEtag(data));
  }

  app.addHook('preSerialization', async (req, reply, payload) => {
    // Bypass by URL.
    if (shouldSkip(req.url, skip)) return payload;

    // Bypass non-2xx — error shapes are untouched.
    if (reply.statusCode < 200 || reply.statusCode >= 300) return payload;

    // Primitives / null → wrap verbatim as the `data` field.
    if (!isPlainObject(payload)) {
      setDeterministicEtag(reply, payload);
      return {
        data: payload,
        meta: {
          request_id: extractRequestId(req),
          data_version: dataVersion,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Already wrapped (rare — only if a handler opts in manually).
    if (isAlreadyEnveloped(payload) || isErrorEnvelope(payload)) return payload;

    const meta = {
      request_id: extractRequestId(req),
      data_version: dataVersion,
      timestamp: new Date().toISOString(),
    };

    // Collection detection: {items, total, limit, offset, ...} → Doc 26 §2.5
    // collection envelope with flat `data: items[]` + `pagination`.
    if (looksLikePaginated(payload)) {
      const { items, total, limit, offset } = payload as Record<string, unknown> & {
        items: unknown[];
        total: number;
        limit: number;
        offset: number;
      };
      const pagination = {
        total,
        limit,
        offset,
        has_more: offset + items.length < total,
      };
      setDeterministicEtag(reply, { data: items, pagination });
      return { data: items, meta, pagination };
    }

    // Single-item envelope.
    setDeterministicEtag(reply, payload);
    return { data: payload, meta };
  });
}

export default fp(envelopePlugin, {
  fastify: '4.x',
  name: 'cosmos-envelope',
});
