import { z } from 'zod';

export const ENT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{1,63}$/;

export const entIdSchema = z
  .string()
  .regex(ENT_ID_PATTERN, 'ent_id must be 2-64 chars, start with a letter, [A-Za-z0-9_-] only');

export const entitySchema = z.object({
  ent_id: z.string(),
  name: z.string(),
  kind: z.string(),
  category: z.string(),
  ra_deg: z.number().nullable(),
  dec_deg: z.number().nullable(),
  distance_pc: z.number().nullable(),
  magnitude: z.number().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  _links: z.object({
    self: z.string(),
  }),
});

export type Entity = z.infer<typeof entitySchema>;

export interface EntityRow {
  ent_id: string;
  name: string;
  kind: string;
  category: string;
  ra_deg: number | null;
  dec_deg: number | null;
  distance_pc: number | null;
  magnitude: number | null;
  metadata: Record<string, unknown> | null;
}

export function rowToEntity(row: EntityRow): Entity {
  return {
    ent_id: row.ent_id,
    name: row.name,
    kind: row.kind,
    category: row.category,
    ra_deg: row.ra_deg,
    dec_deg: row.dec_deg,
    distance_pc: row.distance_pc,
    magnitude: row.magnitude,
    metadata: row.metadata,
    _links: {
      self: `/v1/entities/ent/${row.ent_id}`,
    },
  };
}
