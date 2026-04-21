import { z } from 'zod';

export const ENT_ID_PATTERN = /^[A-Za-z0-9_.-]{1,32}$/;

export const entIdSchema = z
  .string()
  .regex(ENT_ID_PATTERN, 'ent_id must match /^[A-Za-z0-9_.-]{1,32}$/');

export const entityLinksSchema = z.object({
  self: z.string(),
});

export const entityResponseSchema = z.object({
  ent_id: z.string(),
  id: z.number().int(),
  entity_type: z.number().int().nullable(),
  category: z.number().int().nullable(),
  name: z.string(),
  aliases: z.array(z.string()).nullable(),
  ra_deg: z.number(),
  dec_deg: z.number(),
  distance_pc: z.number().nullable(),
  magnitude: z.number().nullable(),
  properties: z.record(z.string(), z.unknown()).nullable(),
  catalog_ids: z.record(z.string(), z.unknown()).nullable(),
  data_source: z.string().nullable(),
  _links: entityLinksSchema,
});

export type EntityResponse = z.infer<typeof entityResponseSchema>;

export interface EntityRow {
  id: string | number;
  ent_id: string;
  entity_type: number | null;
  category: number | null;
  name: string;
  aliases: string[] | null;
  ra: number | string;
  dec_coord: number | string;
  distance_pc: number | string | null;
  properties: Record<string, unknown> | null;
  catalog_ids: Record<string, unknown> | null;
  data_source: string | null;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function rowToEntityResponse(row: EntityRow): EntityResponse {
  const magnitude =
    row.properties && typeof row.properties['magnitude_apparent'] !== 'undefined'
      ? toNumber(row.properties['magnitude_apparent'] as string | number | null)
      : null;
  return {
    ent_id: row.ent_id,
    id: typeof row.id === 'number' ? row.id : Number(row.id),
    entity_type: row.entity_type,
    category: row.category,
    name: row.name,
    aliases: row.aliases,
    ra_deg: toNumber(row.ra) ?? 0,
    dec_deg: toNumber(row.dec_coord) ?? 0,
    distance_pc: toNumber(row.distance_pc),
    magnitude,
    properties: row.properties,
    catalog_ids: row.catalog_ids,
    data_source: row.data_source,
    _links: { self: `/v1/entities/ent/${row.ent_id}` },
  };
}
