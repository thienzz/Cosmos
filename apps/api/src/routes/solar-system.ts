import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { query as pgQuery } from '../db/pool.js';

const SOLAR_SELECT = `
  SELECT
    ssb.naif_id                 AS naif_id,
    ssb.body_type               AS body_type,
    ssb.parent_naif_id          AS parent_naif_id,
    e.ent_id                    AS ent_id,
    e.name                      AS name,
    ssb.semi_major_au           AS semi_major_au,
    ssb.eccentricity            AS eccentricity,
    ssb.inclination             AS inclination_deg,
    ssb.lon_asc_node            AS lon_asc_node_deg,
    ssb.arg_periapsis           AS arg_periapsis_deg,
    ssb.mean_anomaly            AS mean_anomaly_deg,
    ssb.epoch_jd                AS epoch_jd,
    ssb.mass_kg                 AS mass_kg,
    ssb.radius_km               AS radius_km,
    ssb.density                 AS density_g_cm3,
    ssb.albedo                  AS albedo,
    ssb.rotation_period         AS rotation_period_hours,
    ssb.axial_tilt              AS axial_tilt_deg,
    ssb.atmosphere              AS atmosphere,
    ssb.ring_system             AS ring_system,
    ssb.moon_count              AS moon_count
  FROM solar_system_bodies ssb
  LEFT JOIN entities e ON e.id = ssb.entity_id
`;

const bodyTypeFilter = z.object({
  body_type: z.string().max(24).optional(),
  parent_naif_id: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(1000),
});

const solarSystemRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/v1/solar-system/bodies', async (req, reply) => {
    const parsed = bodyTypeFilter.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'bad_request', issues: parsed.error.issues });
    }
    const { body_type, parent_naif_id, limit } = parsed.data;

    const params: unknown[] = [];
    const conds: string[] = [];
    if (body_type !== undefined) {
      params.push(body_type);
      conds.push(`ssb.body_type = $${params.length}`);
    }
    if (parent_naif_id !== undefined) {
      params.push(parent_naif_id);
      conds.push(`ssb.parent_naif_id = $${params.length}`);
    }
    params.push(limit);
    const limitIdx = params.length;
    const where = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '';

    const rows = await pgQuery(
      `${SOLAR_SELECT}
       ${where}
       ORDER BY COALESCE(ssb.parent_naif_id, 0), ssb.naif_id
       LIMIT $${limitIdx}`,
      params,
    );

    return reply.send(rows);
  });

  app.get<{ Params: { naifId: string } }>(
    '/v1/solar-system/bodies/:naifId(\\d+)',
    async (req, reply) => {
      const naif = Number(req.params.naifId);
      const rows = await pgQuery(
        `${SOLAR_SELECT} WHERE ssb.naif_id = $1 LIMIT 1`,
        [naif],
      );
      if (rows.length === 0) {
        return reply.code(404).send({
          error: 'not_found',
          message: `no solar-system body with naif_id=${naif}`,
        });
      }
      return reply.send(rows[0]);
    },
  );
};

export default solarSystemRoutes;
