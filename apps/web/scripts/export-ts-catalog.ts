/**
 * T-C-01 — export every client-bundled TS catalog to a single JSON file
 * that the Python ETL (T-C-02) can ingest into Postgres.
 *
 * The source of truth is `@/data/localSearchIndex`, which already unifies
 * ~600 named entities (solar system + Messier/NGC galaxies + nebulae +
 * exotic objects + globular/open clusters + LSS + 88 IAU constellations
 * + IAU-named stars + notable exoplanets) into the same
 * {@link IndexDoc} shape the in-memory search uses. Every row carries
 * `ent_id`, `category`, `raDeg`, `decDeg`, `distancePc`, `aliases` —
 * enough to upsert into `entities` without losing fidelity.
 *
 * Run via `pnpm seed:export` (from repo root) or
 * `pnpm --filter web seed:export`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getLocalSearchIndex } from '@/data/localSearchIndex';

interface SeedRecord {
  ent_id: string;
  name: string;
  /** Doc 17 entity subtype numeric code (parsed from `ent_id` when it fits `ENT-NNNN`). */
  entity_type: number | null;
  /** Doc 26 §6.2 category id 1..10. */
  category: number;
  category_name: string;
  /** ICRS J2000.0 RA in degrees, nullable for constellations / category rollups. */
  ra_deg: number | null;
  dec_deg: number | null;
  distance_pc: number | null;
  magnitude: number | null;
  aliases: string[];
  /**
   * Free-form catalog ids. We don't have per-catalog shape here, so we
   * stash the source id as `{client_seed: <id>}` and let the Python side
   * fold in more on a future pass (T51 cross-IDs).
   */
  catalog_ids: Record<string, string | number>;
  /** `constellationAbbr` from constellation rows; otherwise unset. */
  constellation_abbr?: string;
  /** Source layer — always "ts-catalog" here. */
  data_source: string;
}

function entityTypeFromEntId(entId: string): number | null {
  const match = entId.match(/^ENT-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function toSeedRecord(doc: ReturnType<typeof getLocalSearchIndex>[number]): SeedRecord {
  const record: SeedRecord = {
    ent_id: doc.ent_id,
    name: doc.text,
    entity_type: entityTypeFromEntId(doc.ent_id),
    category: doc.category,
    category_name: doc.category_name,
    ra_deg: typeof doc.raDeg === 'number' ? doc.raDeg : null,
    dec_deg: typeof doc.decDeg === 'number' ? doc.decDeg : null,
    distance_pc:
      doc.distancePc === null || doc.distancePc === undefined
        ? null
        : doc.distancePc,
    magnitude: typeof doc.magnitude === 'number' ? doc.magnitude : null,
    aliases: [...doc.aliases],
    catalog_ids: { client_seed: doc.id },
    data_source: 'ts-catalog',
  };
  if (doc.constellationAbbr) record.constellation_abbr = doc.constellationAbbr;
  return record;
}

async function main(): Promise<void> {
  const index = getLocalSearchIndex();
  // De-dupe by ent_id. The local index ships some "synthetic" index rows
  // (category synonym pointers) that share ent_id stubs like
  // `__category_galaxies__` — exclude those from the DB seed.
  const seen = new Set<string>();
  const records: SeedRecord[] = [];
  for (const doc of index) {
    if (doc.ent_id.startsWith('__')) continue;
    if (seen.has(doc.ent_id)) continue;
    seen.add(doc.ent_id);
    records.push(toSeedRecord(doc));
  }

  const here = dirname(fileURLToPath(import.meta.url));
  // apps/web/scripts/.. → apps/web → .. → apps → .. → repo root
  const outDir = resolve(here, '..', '..', '..', 'data', 'seed');
  const outPath = resolve(outDir, 'entities.json');
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, `${JSON.stringify(records, null, 2)}\n`, 'utf-8');

  const byCategory = new Map<string, number>();
  for (const r of records) {
    byCategory.set(r.category_name, (byCategory.get(r.category_name) ?? 0) + 1);
  }

  // eslint-disable-next-line no-console
  console.log(`[export-ts-catalog] wrote ${records.length} records → ${outPath}`);
  for (const [cat, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    // eslint-disable-next-line no-console
    console.log(`  ${cat.padEnd(28)} ${count}`);
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[export-ts-catalog] failed', err);
  process.exit(1);
});
