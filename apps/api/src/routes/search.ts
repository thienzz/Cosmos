import type { Client as EsClient } from '@elastic/elasticsearch';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type Redis from 'ioredis';
import type { Pool } from 'pg';

import { query as pgQuery } from '../db/pool.js';
import { ENTITIES_AUTOCOMPLETE_INDEX } from '../es/schemas/entities_autocomplete.js';

export interface SearchRoutesOptions {
  readonly pool: Pool;
  readonly es?: EsClient;
  readonly redis?: Redis;
  readonly autocompleteTtlSec?: number;
}

interface AutocompleteQuery {
  q: string;
  category?: string;
  limit?: string;
}

interface SearchSuggestion {
  text: string;
  ent_id: string;
  category: number | null;
  kind: number | null;
  magnitude: number | null;
}

interface AutocompleteResponse {
  suggestions: SearchSuggestion[];
  query: string;
  took_ms: number;
  source: 'cache' | 'es';
}

interface EsSuggestOption {
  text: string;
  _source?: {
    ent_id?: string;
    category?: number | string;
    kind?: number | string;
    magnitude?: number | string;
  };
}

const DEFAULT_AUTOCOMPLETE_TTL = 60;
const MAX_LIMIT = 20;

function clampLimit(raw: string | undefined): number {
  if (!raw) return 10;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 10;
  return Math.min(MAX_LIMIT, Math.floor(n));
}

function autocompleteCacheKey(q: string, category: string | undefined, limit: number): string {
  const cat = category ?? '*';
  return `ac:${cat}:${limit}:${q.toLowerCase()}`;
}

async function runAutocomplete(
  es: EsClient,
  q: string,
  category: string | undefined,
  limit: number
): Promise<SearchSuggestion[]> {
  const suggestBody = {
    name_sug: {
      prefix: q,
      completion: {
        field: 'name',
        size: limit,
        ...(category
          ? {
              contexts: { category: [category] },
            }
          : {}),
      },
    },
  };
  const result = await es.search({
    index: ENTITIES_AUTOCOMPLETE_INDEX,
    _source: ['ent_id', 'category', 'kind', 'magnitude'],
    suggest: suggestBody,
    size: 0,
  });
  const sugg = result.suggest?.['name_sug'];
  if (!sugg || sugg.length === 0) return [];
  const options = (sugg[0]?.options ?? []) as unknown as EsSuggestOption[];
  return options.map((opt) => {
    const src = opt._source ?? {};
    return {
      text: opt.text,
      ent_id: typeof src.ent_id === 'string' ? src.ent_id : '',
      category: src.category === undefined ? null : Number(src.category),
      kind: src.kind === undefined ? null : Number(src.kind),
      magnitude: src.magnitude === undefined ? null : Number(src.magnitude),
    };
  });
}

interface SearchFullQuery {
  q: string;
  category?: string;
  magnitude_max?: string;
  distance_max_pc?: string;
  limit?: string;
  offset?: string;
}

interface SearchResultItem {
  ent_id: string;
  id: number;
  name: string;
  category: number | null;
  entity_type: number | null;
  ra_deg: number;
  dec_deg: number;
  distance_pc: number | null;
  magnitude: number | null;
  _links: { self: string };
}

interface SearchResponse {
  items: SearchResultItem[];
  total: number;
  limit: number;
  offset: number;
  took_ms: number;
  _links: { next?: string; prev?: string };
}

interface ConeQuery {
  ra: string;
  dec: string;
  radius_deg: string;
  max_distance_pc?: string;
  limit?: string;
}

export async function searchRoutes(
  app: FastifyInstance,
  opts: SearchRoutesOptions
): Promise<void> {
  const { pool, es, redis } = opts;
  const ttl = opts.autocompleteTtlSec ?? DEFAULT_AUTOCOMPLETE_TTL;

  app.get<{ Querystring: AutocompleteQuery }>(
    '/v1/search/autocomplete',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['q'],
          properties: {
            q: { type: 'string', minLength: 1, maxLength: 64 },
            category: { type: 'string', maxLength: 32 },
            limit: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Querystring: AutocompleteQuery }>,
      reply: FastifyReply
    ): Promise<AutocompleteResponse | undefined> => {
      const started = Date.now();
      const q = req.query.q.trim();
      if (!q) {
        await reply.code(400).send({ error: 'bad_request', message: 'q must not be empty' });
        return undefined;
      }
      const limit = clampLimit(req.query.limit);
      const cacheKey = autocompleteCacheKey(q, req.query.category, limit);

      if (redis) {
        const cached = await redis.get(cacheKey).catch(() => null);
        if (cached) {
          const payload = JSON.parse(cached) as SearchSuggestion[];
          return {
            suggestions: payload,
            query: q,
            took_ms: Date.now() - started,
            source: 'cache',
          };
        }
      }

      if (!es) {
        await reply.code(503).send({
          error: 'service_unavailable',
          message: 'autocomplete requires elasticsearch to be configured',
        });
        return undefined;
      }

      const suggestions = await runAutocomplete(es, q, req.query.category, limit);
      if (redis) {
        await redis
          .set(cacheKey, JSON.stringify(suggestions), 'EX', ttl)
          .catch((err) => {
            app.log.warn({ err }, 'autocomplete cache write failed');
          });
      }
      return {
        suggestions,
        query: q,
        took_ms: Date.now() - started,
        source: 'es',
      };
    }
  );

  app.get<{ Querystring: SearchFullQuery }>(
    '/v1/search',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['q'],
          properties: {
            q: { type: 'string', minLength: 1, maxLength: 256 },
            category: { type: 'string', pattern: '^[0-9]+$' },
            magnitude_max: { type: 'string', pattern: '^-?[0-9]+(\\.[0-9]+)?$' },
            distance_max_pc: { type: 'string', pattern: '^[0-9]+(\\.[0-9]+)?$' },
            limit: { type: 'string', pattern: '^[0-9]+$' },
            offset: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Querystring: SearchFullQuery }>,
      _reply: FastifyReply
    ): Promise<SearchResponse> => {
      const started = Date.now();
      const q = req.query.q.trim();
      const limit = clampLimit(req.query.limit);
      const offset = Number(req.query.offset ?? 0) || 0;

      const where: string[] = [`search_vector @@ plainto_tsquery('simple', $1)`];
      const params: unknown[] = [q];
      if (req.query.category !== undefined) {
        params.push(Number(req.query.category));
        where.push(`category = $${params.length}`);
      }
      if (req.query.magnitude_max !== undefined) {
        params.push(Number(req.query.magnitude_max));
        where.push(`(properties->>'magnitude_apparent')::real <= $${params.length}`);
      }
      if (req.query.distance_max_pc !== undefined) {
        params.push(Number(req.query.distance_max_pc));
        where.push(`(distance_pc IS NULL OR distance_pc <= $${params.length})`);
      }

      params.push(limit);
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const whereClause = where.join(' AND ');
      const sql = `
        SELECT id, ent_id, entity_type, category, name,
               ra, dec_coord, distance_pc, properties,
               count(*) OVER () AS __total
          FROM entities
         WHERE ${whereClause}
         ORDER BY ts_rank(search_vector, plainto_tsquery('simple', $1)) DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const rows = await pgQuery<
        {
          id: number | string;
          ent_id: string;
          entity_type: number | null;
          category: number | null;
          name: string;
          ra: number | string;
          dec_coord: number | string;
          distance_pc: number | string | null;
          properties: Record<string, unknown> | null;
          __total: string | number;
        }
      >(pool, sql, params);

      const total = rows[0] ? Number(rows[0].__total) : 0;
      const items: SearchResultItem[] = rows.map((row) => ({
        ent_id: row.ent_id,
        id: Number(row.id),
        name: row.name,
        category: row.category,
        entity_type: row.entity_type,
        ra_deg: Number(row.ra),
        dec_deg: Number(row.dec_coord),
        distance_pc: row.distance_pc === null ? null : Number(row.distance_pc),
        magnitude:
          row.properties && typeof row.properties['magnitude_apparent'] !== 'undefined'
            ? Number(row.properties['magnitude_apparent'])
            : null,
        _links: { self: `/v1/entities/ent/${row.ent_id}` },
      }));

      const links: SearchResponse['_links'] = {};
      if (offset + limit < total) {
        links.next = `/v1/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset + limit}`;
      }
      if (offset > 0) {
        const prevOffset = Math.max(0, offset - limit);
        links.prev = `/v1/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${prevOffset}`;
      }

      return {
        items,
        total,
        limit,
        offset,
        took_ms: Date.now() - started,
        _links: links,
      };
    }
  );

  app.get<{ Querystring: ConeQuery }>(
    '/v1/search/cone',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['ra', 'dec', 'radius_deg'],
          properties: {
            ra: { type: 'string', pattern: '^-?[0-9]+(\\.[0-9]+)?$' },
            dec: { type: 'string', pattern: '^-?[0-9]+(\\.[0-9]+)?$' },
            radius_deg: { type: 'string', pattern: '^[0-9]+(\\.[0-9]+)?$' },
            max_distance_pc: { type: 'string', pattern: '^[0-9]+(\\.[0-9]+)?$' },
            limit: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Querystring: ConeQuery }>,
      reply: FastifyReply
    ): Promise<{ count: number; items: SearchResultItem[]; took_ms: number } | undefined> => {
      const started = Date.now();
      const ra = Number(req.query.ra);
      const dec = Number(req.query.dec);
      const radius = Number(req.query.radius_deg);
      if (ra < 0 || ra >= 360 || dec < -90 || dec > 90 || radius <= 0 || radius > 180) {
        await reply.code(400).send({
          error: 'bad_request',
          message: 'ra ∈ [0,360), dec ∈ [-90,90], radius_deg ∈ (0,180]',
        });
        return undefined;
      }
      const limit = clampLimit(req.query.limit);
      const meters = radius * 111_320; // deg-at-equator → m on a sphere proxy

      const params: unknown[] = [ra, dec, meters];
      const where: string[] = [
        `ST_DWithin(position_3d::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`,
      ];
      if (req.query.max_distance_pc !== undefined) {
        params.push(Number(req.query.max_distance_pc));
        where.push(`(distance_pc IS NULL OR distance_pc <= $${params.length})`);
      }
      params.push(limit);

      const sql = `
        SELECT id, ent_id, entity_type, category, name,
               ra, dec_coord, distance_pc, properties,
               ST_Distance(position_3d::geography,
                           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS __ang_m
          FROM entities
         WHERE ${where.join(' AND ')}
         ORDER BY __ang_m ASC
         LIMIT $${params.length}
      `;
      const rows = await pgQuery<
        {
          id: number | string;
          ent_id: string;
          entity_type: number | null;
          category: number | null;
          name: string;
          ra: number | string;
          dec_coord: number | string;
          distance_pc: number | string | null;
          properties: Record<string, unknown> | null;
        }
      >(pool, sql, params);

      const items: SearchResultItem[] = rows.map((row) => ({
        ent_id: row.ent_id,
        id: Number(row.id),
        name: row.name,
        category: row.category,
        entity_type: row.entity_type,
        ra_deg: Number(row.ra),
        dec_deg: Number(row.dec_coord),
        distance_pc: row.distance_pc === null ? null : Number(row.distance_pc),
        magnitude:
          row.properties && typeof row.properties['magnitude_apparent'] !== 'undefined'
            ? Number(row.properties['magnitude_apparent'])
            : null,
        _links: { self: `/v1/entities/ent/${row.ent_id}` },
      }));

      return { count: items.length, items, took_ms: Date.now() - started };
    }
  );
}
