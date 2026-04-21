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

const searchRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
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
