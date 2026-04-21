import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';

import { query } from '../db/pool.js';

export interface SolarSystemRoutesOptions {
  readonly pool: Pool;
}

interface BodyRow {
  id: number | string;
  entity_id: number | string | null;
  naif_id: number | null;
  mpc_number: number | null;
  body_type: string | null;
  parent_naif_id: number | null;
  semi_major_au: number | string | null;
  eccentricity: number | string | null;
  inclination: number | string | null;
  lon_asc_node: number | string | null;
  arg_periapsis: number | string | null;
  mean_anomaly: number | string | null;
  epoch_jd: number | string | null;
  mass_kg: number | string | null;
  radius_km: number | string | null;
  density: number | string | null;
  albedo: number | string | null;
  rotation_period: number | string | null;
  axial_tilt: number | string | null;
  atmosphere: Record<string, unknown> | null;
  surface_comp: Record<string, unknown> | null;
  ring_system: Record<string, unknown> | null;
  moon_count: number | null;
  entity_name: string | null;
  entity_ent_id: string | null;
}

interface BodyResponse {
  id: number;
  naif_id: number | null;
  mpc_number: number | null;
  body_type: string | null;
  parent_naif_id: number | null;
  name: string | null;
  ent_id: string | null;
  orbital_elements: {
    semi_major_au: number | null;
    eccentricity: number | null;
    inclination_deg: number | null;
    lon_asc_node_deg: number | null;
    arg_periapsis_deg: number | null;
    mean_anomaly_deg: number | null;
    epoch_jd: number | null;
  };
  physical: {
    mass_kg: number | null;
    radius_km: number | null;
    density: number | null;
    albedo: number | null;
    rotation_period_hours: number | null;
    axial_tilt_deg: number | null;
  };
  atmosphere: Record<string, unknown> | null;
  surface_comp: Record<string, unknown> | null;
  ring_system: Record<string, unknown> | null;
  moon_count: number;
  _links: { self: string; parent?: string };
}

const BODY_COLUMNS = `
  b.id, b.entity_id, b.naif_id, b.mpc_number, b.body_type, b.parent_naif_id,
  b.semi_major_au, b.eccentricity, b.inclination, b.lon_asc_node,
  b.arg_periapsis, b.mean_anomaly, b.epoch_jd,
  b.mass_kg, b.radius_km, b.density, b.albedo, b.rotation_period, b.axial_tilt,
  b.atmosphere, b.surface_comp, b.ring_system, b.moon_count,
  e.name AS entity_name, e.ent_id AS entity_ent_id
`;

function toNum(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function rowToBody(row: BodyRow): BodyResponse {
  const out: BodyResponse = {
    id: Number(row.id),
    naif_id: row.naif_id,
    mpc_number: row.mpc_number,
    body_type: row.body_type,
    parent_naif_id: row.parent_naif_id,
    name: row.entity_name,
    ent_id: row.entity_ent_id,
    orbital_elements: {
      semi_major_au: toNum(row.semi_major_au),
      eccentricity: toNum(row.eccentricity),
      inclination_deg: toNum(row.inclination),
      lon_asc_node_deg: toNum(row.lon_asc_node),
      arg_periapsis_deg: toNum(row.arg_periapsis),
      mean_anomaly_deg: toNum(row.mean_anomaly),
      epoch_jd: toNum(row.epoch_jd),
    },
    physical: {
      mass_kg: toNum(row.mass_kg),
      radius_km: toNum(row.radius_km),
      density: toNum(row.density),
      albedo: toNum(row.albedo),
      rotation_period_hours: toNum(row.rotation_period),
      axial_tilt_deg: toNum(row.axial_tilt),
    },
    atmosphere: row.atmosphere,
    surface_comp: row.surface_comp,
    ring_system: row.ring_system,
    moon_count: row.moon_count ?? 0,
    _links: {
      self: row.naif_id
        ? `/v1/solar-system/bodies/${row.naif_id}`
        : `/v1/solar-system/bodies/_/${row.id}`,
    },
  };
  if (row.parent_naif_id !== null) {
    out._links.parent = `/v1/solar-system/bodies/${row.parent_naif_id}`;
  }
  return out;
}

export async function solarSystemRoutes(
  app: FastifyInstance,
  opts: SolarSystemRoutesOptions
): Promise<void> {
  const { pool } = opts;

  app.get<{ Querystring: { body_type?: string; parent?: string; limit?: string } }>(
    '/v1/solar-system/bodies',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            body_type: { type: 'string', maxLength: 24 },
            parent: { type: 'string', pattern: '^[0-9]+$' },
            limit: { type: 'string', pattern: '^[0-9]+$' },
          },
        },
      },
    },
    async (req): Promise<{ items: BodyResponse[]; count: number }> => {
      const where: string[] = [];
      const params: unknown[] = [];
      if (req.query.body_type !== undefined) {
        params.push(req.query.body_type);
        where.push(`b.body_type = $${params.length}`);
      }
      if (req.query.parent !== undefined) {
        params.push(Number(req.query.parent));
        where.push(`b.parent_naif_id = $${params.length}`);
      }
      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const limit = Math.min(1000, Number(req.query.limit ?? 500) || 500);
      params.push(limit);
      const sql = `
        SELECT ${BODY_COLUMNS}
          FROM solar_system_bodies b
          LEFT JOIN entities e ON e.id = b.entity_id
        ${whereClause}
         ORDER BY b.parent_naif_id NULLS FIRST, b.naif_id ASC
         LIMIT $${params.length}
      `;
      const rows = await query<BodyRow>(pool, sql, params);
      return { items: rows.map(rowToBody), count: rows.length };
    }
  );

  app.get<{ Params: { naifId: string } }>(
    '/v1/solar-system/bodies/:naifId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['naifId'],
          properties: { naifId: { type: 'string', pattern: '^[0-9]+$' } },
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { naifId: string } }>,
      reply: FastifyReply
    ): Promise<BodyResponse | undefined> => {
      const naif = Number(req.params.naifId);
      const rows = await query<BodyRow>(
        pool,
        `SELECT ${BODY_COLUMNS}
           FROM solar_system_bodies b
           LEFT JOIN entities e ON e.id = b.entity_id
          WHERE b.naif_id = $1
          LIMIT 1`,
        [naif]
      );
      const row = rows[0];
      if (!row) {
        await reply.code(404).send({ error: 'not_found', naif_id: naif });
        return undefined;
      }
      return rowToBody(row);
    }
  );
}
