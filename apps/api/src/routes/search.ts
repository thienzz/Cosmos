import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { query as pgQuery } from '../db/pool.js';
import { getEsClient } from '../es/client.js';
import { ENTITIES_AUTOCOMPLETE_INDEX } from '../es/schemas/entities_autocomplete.js';

const AUTOCOMPLETE_TTL_SECONDS = 60;
const CACHE_PREFIX = 'cosmos:search:ac';

const autocompleteQuerySchema = z.object({
  q: z.string().min(1, 'q is required').max(64),
  category: z.string().max(32).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

interface SuggestionDoc {
  ent_id?: string;
  category?: string;
  kind?: string;
  magnitude?: number | null;
  ra_deg?: number | null;
  dec_deg?: number | null;
  distance_pc?: number | null;
}

interface CompletionSuggestOption {
  text: string;
  _source?: SuggestionDoc;
}

interface CompletionSuggestEntry {
  options: readonly CompletionSuggestOption[];
}

const coneQuerySchema = z.object({
  ra: z.coerce.number().min(0).max(360),
  dec: z.coerce.number().min(-90).max(90),
  radius_deg: z.coerce.number().positive().max(180),
  max_distance_pc: z.coerce.number().positive().optional(),
  category: z.string().max(32).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

const fullTextQuerySchema = z.object({
  q: z.string().min(1).max(128),
  category: z.string().max(32).optional(),
  magnitude_max: z.coerce.number().optional(),
  distance_max_pc: z.coerce.number().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const searchRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/v1/search/cone', async (req, reply) => {
    const parsed = coneQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'bad_request', issues: parsed.error.issues });
    }
    const { ra, dec, radius_deg, max_distance_pc, category, limit } = parsed.data;

    const params: unknown[] = [ra, dec, radius_deg];
    const conds: string[] = [
      // spherical law of cosines — angular distance in degrees
      `degrees(acos(
         LEAST(1.0, GREATEST(-1.0,
           sin(radians($2)) * sin(radians(e.dec_coord)) +
           cos(radians($2)) * cos(radians(e.dec_coord)) * cos(radians($1 - e.ra))
         ))
       )) <= $3`,
    ];

    if (max_distance_pc !== undefined) {
      params.push(max_distance_pc);
      conds.push(`e.distance_pc IS NOT NULL AND e.distance_pc <= $${params.length}`);
    }
    if (category !== undefined) {
      params.push(category);
      conds.push(`e.category::text = $${params.length}`);
    }

    params.push(limit);
    const limitIdx = params.length;

    const rows = await pgQuery<{
      ent_id: string;
      name: string;
      category: string | null;
      ra_deg: number;
      dec_deg: number;
      distance_pc: number | null;
      magnitude: number | null;
      angular_sep_deg: number;
    }>(
      `SELECT e.ent_id,
              e.name,
              e.category::text AS category,
              e.ra AS ra_deg,
              e.dec_coord AS dec_deg,
              e.distance_pc,
              NULLIF((e.properties->>'magnitude')::float8, 'NaN'::float8) AS magnitude,
              degrees(acos(
                LEAST(1.0, GREATEST(-1.0,
                  sin(radians($2)) * sin(radians(e.dec_coord)) +
                  cos(radians($2)) * cos(radians(e.dec_coord)) * cos(radians($1 - e.ra))
                ))
              )) AS angular_sep_deg
       FROM entities e
       WHERE ${conds.join(' AND ')}
       ORDER BY angular_sep_deg ASC
       LIMIT $${limitIdx}`,
      params,
    );

    return reply.send({
      center: { ra, dec },
      radius_deg,
      count: rows.length,
      items: rows,
    });
  });

  app.get('/v1/search', async (req, reply) => {
    const parsed = fullTextQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'bad_request', issues: parsed.error.issues });
    }
    const { q, category, magnitude_max, distance_max_pc, limit, offset } = parsed.data;

    const params: unknown[] = [q];
    const conds: string[] = [
      `(e.search_vector @@ plainto_tsquery('simple', $1) OR e.name ILIKE '%' || $1 || '%')`,
    ];

    if (category !== undefined) {
      params.push(category);
      conds.push(`e.category::text = $${params.length}`);
    }
    if (magnitude_max !== undefined) {
      params.push(magnitude_max);
      conds.push(`(e.properties->>'magnitude')::float8 <= $${params.length}`);
    }
    if (distance_max_pc !== undefined) {
      params.push(distance_max_pc);
      conds.push(`e.distance_pc <= $${params.length}`);
    }

    const where = conds.join(' AND ');
    const countParams = params.slice();
    const totalRows = await pgQuery<{ total: string }>(
      `SELECT count(*)::text AS total FROM entities e WHERE ${where}`,
      countParams,
    );
    const total = Number(totalRows[0]?.total ?? '0');

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const rows = await pgQuery<{
      ent_id: string;
      name: string;
      category: string | null;
      entity_type: string | null;
      ra_deg: number | null;
      dec_deg: number | null;
      distance_pc: number | null;
      magnitude: number | null;
    }>(
      `SELECT e.ent_id,
              e.name,
              e.category::text AS category,
              e.entity_type::text AS entity_type,
              e.ra AS ra_deg,
              e.dec_coord AS dec_deg,
              e.distance_pc,
              NULLIF((e.properties->>'magnitude')::float8, 'NaN'::float8) AS magnitude
       FROM entities e
       WHERE ${where}
       ORDER BY ts_rank(e.search_vector, plainto_tsquery('simple', $1)) DESC, e.name ASC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    );

    const baseUrl = new URL(req.raw.url ?? '/v1/search', 'http://placeholder');
    const buildLink = (newOffset: number): string => {
      const u = new URL(baseUrl);
      u.searchParams.set('offset', String(newOffset));
      return `${u.pathname}${u.search}`;
    };

    const items = rows.map((r) => ({
      ent_id: r.ent_id,
      name: r.name,
      category: r.category,
      kind: r.entity_type,
      ra_deg: r.ra_deg,
      dec_deg: r.dec_deg,
      distance_pc: r.distance_pc,
      magnitude: r.magnitude,
    }));

    return reply.send({
      query: q,
      total,
      limit,
      offset,
      items,
      _links: {
        next: offset + limit < total ? buildLink(offset + limit) : null,
        prev: offset > 0 ? buildLink(Math.max(0, offset - limit)) : null,
      },
    });
  });

  app.get('/v1/search/autocomplete', async (req, reply) => {
    const parsed = autocompleteQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'bad_request', issues: parsed.error.issues });
    }
    const { q, category, limit } = parsed.data;
    const start = performance.now();

    const cacheKey = `${CACHE_PREFIX}:${limit}:${category ?? '*'}:${q.toLowerCase()}`;
    const redis = 'redis' in app ? app.redis : undefined;
    if (redis !== undefined) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached !== null) {
          return reply.header('x-cache', 'HIT').send(JSON.parse(cached));
        }
      } catch (err) {
        app.log.warn({ err }, 'autocomplete: redis GET failed, continuing to ES');
      }
    }

    const es = getEsClient();
    let suggestions: Array<{
      text: string;
      ent_id: string | null;
      category: string | null;
      kind: string | null;
      magnitude: number | null;
    }> = [];

    try {
      const result = await es.search<SuggestionDoc>({
        index: ENTITIES_AUTOCOMPLETE_INDEX,
        _source: ['ent_id', 'category', 'kind', 'magnitude'],
        suggest: {
          name_sug: {
            prefix: q,
            completion: {
              field: 'name',
              size: limit,
              ...(category !== undefined
                ? { contexts: { category: [category] } }
                : {}),
            },
          },
        },
      });

      const entries = (result.suggest?.name_sug ?? []) as unknown as CompletionSuggestEntry[];
      const options = entries.flatMap((e) => e.options);
      suggestions = options.map((opt) => ({
        text: opt.text,
        ent_id: opt._source?.ent_id ?? null,
        category: opt._source?.category ?? null,
        kind: opt._source?.kind ?? null,
        magnitude: opt._source?.magnitude ?? null,
      }));
    } catch (err) {
      // ES not ready or index missing — fall back to Postgres ILIKE prefix match
      app.log.warn({ err }, 'autocomplete: ES suggest failed, falling back to pg ILIKE');
      const rows = await pgQuery<{
        ent_id: string;
        name: string;
        category: string | null;
        entity_type: string | null;
        magnitude: number | null;
      }>(
        `SELECT e.ent_id,
                e.name,
                e.category::text AS category,
                e.entity_type::text AS entity_type,
                NULLIF((e.properties->>'magnitude')::float8, 'NaN'::float8) AS magnitude
         FROM entities e
         WHERE e.name ILIKE $1 || '%'
         ORDER BY e.name
         LIMIT $2`,
        [q, limit],
      );
      suggestions = rows.map((r) => ({
        text: r.name,
        ent_id: r.ent_id,
        category: r.category,
        kind: r.entity_type,
        magnitude: r.magnitude,
      }));
    }

    const body = {
      query: q,
      took_ms: Math.round(performance.now() - start),
      suggestions,
    };

    if (redis !== undefined) {
      redis.set(cacheKey, JSON.stringify(body), 'EX', AUTOCOMPLETE_TTL_SECONDS).catch((err: unknown) => {
        app.log.warn({ err }, 'autocomplete: redis SET failed');
      });
    }

    return reply.header('x-cache', 'MISS').send(body);
  });
};

export default searchRoutes;
