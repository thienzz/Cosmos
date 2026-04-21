import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

import { query } from '../db/pool.js';
import { ENT_ID_PATTERN, type EntityRow, rowToEntity } from '../schemas/entity.js';

const ENTITY_SELECT = `
  SELECT
    e.ent_id                                     AS ent_id,
    e.name                                       AS name,
    e.entity_type::text                          AS kind,
    e.category::text                             AS category,
    e.ra                                         AS ra_deg,
    e.dec_coord                                  AS dec_deg,
    e.distance_pc                                AS distance_pc,
    NULLIF((e.properties->>'magnitude')::float8, 'NaN'::float8) AS magnitude,
    e.properties                                 AS metadata
  FROM entities e
`;

const entitiesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get<{ Params: { ent_id: string } }>(
    '/v1/entities/ent/:ent_id',
    async (req, reply) => {
      const raw = req.params.ent_id;

      if (!ENT_ID_PATTERN.test(raw)) {
        return reply.code(400).send({
          error: 'bad_request',
          message: 'ent_id must match [A-Za-z][A-Za-z0-9_-]{1,63}',
        });
      }

      const rows = await query<EntityRow>(
        `${ENTITY_SELECT}
         LEFT JOIN cross_identifications xid
           ON xid.entity_id = e.id AND xid.catalog = 'client_ent_id'
         WHERE e.ent_id = $1 OR xid.catalog_ref = $1
         ORDER BY e.id
         LIMIT 1`,
        [raw],
      );

      if (rows.length === 0) {
        return reply.code(404).send({
          error: 'not_found',
          message: `no entity with ent_id="${raw}"`,
        });
      }

      return reply.send(rowToEntity(rows[0]));
    },
  );
};

export default entitiesRoutes;
