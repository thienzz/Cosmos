import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';

import { query } from '../db/pool.js';
import {
  ENT_ID_PATTERN,
  rowToEntityResponse,
  type EntityResponse,
  type EntityRow,
} from '../schemas/entity.js';

const ENTITY_SELECT_COLUMNS = `
  id, ent_id, entity_type, category, name, aliases,
  catalog_ids, ra, dec_coord, distance_pc,
  properties, data_source
`;

async function fetchByEntId(pool: Pool, entId: string): Promise<EntityRow | null> {
  const rows = await query<EntityRow>(
    pool,
    `SELECT ${ENTITY_SELECT_COLUMNS}
       FROM entities
      WHERE ent_id = $1
      ORDER BY id ASC
      LIMIT 1`,
    [entId]
  );
  return rows[0] ?? null;
}

async function fetchById(pool: Pool, id: number): Promise<EntityRow | null> {
  const rows = await query<EntityRow>(
    pool,
    `SELECT ${ENTITY_SELECT_COLUMNS}
       FROM entities
      WHERE id = $1
      LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export interface EntityRoutesOptions {
  readonly pool: Pool;
}

export async function entityRoutes(
  app: FastifyInstance,
  opts: EntityRoutesOptions
): Promise<void> {
  const { pool } = opts;

  app.get<{ Params: { ent_id: string } }>(
    '/v1/entities/ent/:ent_id',
    async (
      req: FastifyRequest<{ Params: { ent_id: string } }>,
      reply: FastifyReply
    ): Promise<EntityResponse | undefined> => {
      const { ent_id } = req.params;
      if (!ENT_ID_PATTERN.test(ent_id)) {
        await reply.code(400).send({
          error: 'bad_request',
          message: 'ent_id must match /^[A-Za-z0-9_.-]{1,32}$/',
        });
        return undefined;
      }
      const row = await fetchByEntId(pool, ent_id);
      if (!row) {
        await reply.code(404).send({ error: 'not_found', ent_id });
        return undefined;
      }
      return rowToEntityResponse(row);
    }
  );

  app.get<{ Params: { id: string } }>(
    '/v1/entities/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ): Promise<EntityResponse | undefined> => {
      const numericId = Number(req.params.id);
      if (!Number.isSafeInteger(numericId) || numericId < 0) {
        await reply.code(400).send({ error: 'bad_request', message: 'id must be a non-negative integer' });
        return undefined;
      }
      const row = await fetchById(pool, numericId);
      if (!row) {
        await reply.code(404).send({ error: 'not_found', id: numericId });
        return undefined;
      }
      return rowToEntityResponse(row);
    }
  );
}
