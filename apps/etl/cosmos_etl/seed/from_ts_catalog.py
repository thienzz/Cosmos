"""T-C-02 — Seed Postgres from `data/seed/entities.json`.

The Node script in `apps/web/scripts/export-ts-catalog.ts` writes one
JSON file containing every entity the client bundles (galaxies, nebulae,
exotic objects, large-scale structure, IAU constellations + named stars,
notable exoplanets, etc.). This module reads that file and upserts each
record into the live `entities` table.

Schema reconciliation:
    The `entities` table requires NOT NULL `ra` and `dec_coord`
    (CHECK constraints in `0001_init_core_schema`). Solar-system bodies
    in the seed JSON have null ra/dec because they are time-varying;
    those records are skipped here and the dedicated
    `solar_system_bodies` table owns them via the SPICE pipeline
    (Phase H). This module logs the skip count.

Idempotency:
    Each record carries `catalog_ids.client_seed = <id>`. We treat
    `(catalog='ts-catalog', catalog_ref=<id>)` as the natural key and
    UPDATE the existing entity row when the cross-id is already present;
    INSERT + new cross-id when it isn't. Re-running the script against
    an already-loaded DB is a no-op data-wise.

Run:
    python -m cosmos_etl.seed.from_ts_catalog               # full run
    python -m cosmos_etl.seed.from_ts_catalog --dry-run     # parse + report
    python -m cosmos_etl.seed.from_ts_catalog --json data/seed/foo.json
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from collections import Counter
from pathlib import Path
from typing import Iterable, Mapping, Sequence

log = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_JSON = REPO_ROOT / "data" / "seed" / "entities.json"


def _ra_in_range(ra: float | None) -> bool:
    return ra is not None and 0.0 <= ra < 360.0


def _dec_in_range(dec: float | None) -> bool:
    return dec is not None and -90.0 <= dec <= 90.0


def load_records(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"seed file not found at {path}; run `pnpm seed:export` first"
        )
    with path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)
    if not isinstance(data, list):
        raise ValueError(f"{path} did not parse to a JSON array")
    return data


def partition(records: Sequence[Mapping]) -> tuple[list[dict], list[dict]]:
    """Split into (loadable, skipped) by ra/dec presence + range."""
    loadable: list[dict] = []
    skipped: list[dict] = []
    for r in records:
        if _ra_in_range(r.get("ra_deg")) and _dec_in_range(r.get("dec_deg")):
            loadable.append(dict(r))
        else:
            skipped.append(dict(r))
    return loadable, skipped


def category_counts(records: Iterable[Mapping]) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for r in records:
        counter[str(r.get("category_name", "?"))] += 1
    return dict(counter)


# Map Doc 26 §6.2 category id → default Doc 17 entity_type when the seed
# record carries `entity_type: null` (most do — only category-rollup rows
# have one). Keeps the synthesised `ENT-XXXX` short enough for the
# `entities.ent_id VARCHAR(12)` column.
_DEFAULT_ENT_TYPE_PER_CATEGORY: dict[int, int] = {
    1: 1000,   # Stars            → Main Sequence (placeholder)
    2: 2000,   # Rocky planets    → Terrestrial
    3: 3000,   # Gas giants       → Hot Jupiter
    4: 4000,   # Moons            → Rocky Moon
    5: 5000,   # Nebulae          → Emission
    6: 6000,   # Galaxies         → Spiral
    7: 7000,   # Small bodies     → Asteroid
    8: 8000,   # LSS              → Galaxy Cluster
    9: 9000,   # Exotic           → Black Hole
    10: 7050,  # Constellations   → reuse small-bodies group as a sky-only marker
}


def normalise_ent_id(record: Mapping) -> tuple[str, int]:
    """Return `(ent_id, entity_type)` that fit the entities table constraints.

    entities.ent_id is VARCHAR(12); the client seed uses long catalog-style
    refs like `OC-oc-pleiades` that overflow. We map every record onto the
    Doc 17 subtype code (e.g. `ENT-6000`) and stash the original id in
    catalog_ids so downstream lookups still resolve.
    """
    raw_type = record.get("entity_type")
    if isinstance(raw_type, int) and 0 < raw_type < 10_000:
        entity_type = raw_type
    else:
        category = int(record.get("category") or 0)
        entity_type = _DEFAULT_ENT_TYPE_PER_CATEGORY.get(category, 9999)
    ent_id = f"ENT-{entity_type:04d}"
    return ent_id, entity_type


def upsert_postgres(db_url: str, records: Sequence[Mapping]) -> tuple[int, int]:
    """UPSERT records into entities + cross_identifications.

    Returns (inserted, updated).
    """
    import psycopg2  # lazy import — keeps unit tests dependency-free
    from psycopg2.extras import Json

    inserted = 0
    updated = 0
    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            for r in records:
                catalog_ids = dict(r.get("catalog_ids") or {})
                # Stash the client-seed ent_id in catalog_ids so the long form
                # (e.g. OC-oc-pleiades) survives the VARCHAR(12) coercion.
                catalog_ids.setdefault("client_seed_ent_id", r["ent_id"])
                seed_ref = str(catalog_ids.get("client_seed", r["ent_id"]))
                ent_id_db, entity_type = normalise_ent_id(r)
                # cross-id key: ('ts-catalog', '<client_seed>')
                cur.execute(
                    """
                    SELECT entity_id FROM cross_identifications
                    WHERE catalog = 'ts-catalog' AND catalog_ref = %s
                    LIMIT 1;
                    """,
                    (seed_ref,),
                )
                existing = cur.fetchone()
                aliases = list(r.get("aliases") or [])
                properties: dict = {}
                if r.get("magnitude") is not None:
                    properties["magnitude_apparent"] = r["magnitude"]
                if r.get("constellation_abbr"):
                    properties["constellation"] = r["constellation_abbr"]
                payload = {
                    "ent_id": ent_id_db,
                    "entity_type": entity_type,
                    "category": r.get("category") or 0,
                    "name": r["name"],
                    "aliases": aliases,
                    "catalog_ids": Json(catalog_ids),
                    "ra": float(r["ra_deg"]),
                    "dec_coord": float(r["dec_deg"]),
                    "distance_pc": (
                        float(r["distance_pc"]) if r.get("distance_pc") is not None else None
                    ),
                    "properties": Json(properties),
                    "data_source": r.get("data_source") or "ts-catalog",
                    "data_quality": 0.85,
                }
                if existing:
                    entity_id = existing[0]
                    cur.execute(
                        """
                        UPDATE entities SET
                            ent_id = %(ent_id)s,
                            entity_type = %(entity_type)s,
                            category = %(category)s,
                            name = %(name)s,
                            aliases = %(aliases)s,
                            catalog_ids = %(catalog_ids)s,
                            ra = %(ra)s,
                            dec_coord = %(dec_coord)s,
                            distance_pc = %(distance_pc)s,
                            properties = %(properties)s,
                            data_source = %(data_source)s,
                            data_quality = %(data_quality)s,
                            last_updated = NOW()
                        WHERE id = %(id)s;
                        """,
                        {**payload, "id": entity_id},
                    )
                    updated += 1
                else:
                    cur.execute(
                        """
                        INSERT INTO entities
                            (ent_id, entity_type, category, name, aliases, catalog_ids,
                             ra, dec_coord, distance_pc, properties, data_source, data_quality)
                        VALUES
                            (%(ent_id)s, %(entity_type)s, %(category)s, %(name)s,
                             %(aliases)s, %(catalog_ids)s, %(ra)s, %(dec_coord)s,
                             %(distance_pc)s, %(properties)s, %(data_source)s, %(data_quality)s)
                        RETURNING id;
                        """,
                        payload,
                    )
                    (entity_id,) = cur.fetchone()
                    inserted += 1
                # Always re-assert the seed cross-id; INSERT-ON-CONFLICT-DO-NOTHING
                # keeps it idempotent.
                cur.execute(
                    """
                    INSERT INTO cross_identifications (entity_id, catalog, catalog_ref, is_primary)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING;
                    """,
                    (entity_id, "ts-catalog", seed_ref, True),
                )
        conn.commit()
    return inserted, updated


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Seed entities from data/seed/entities.json")
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON, help="path to seed JSON")
    parser.add_argument("--dry-run", action="store_true", help="parse and report only")
    parser.add_argument(
        "--db-url",
        default=os.environ.get("DATABASE_URL"),
        help="Postgres URL (defaults to $DATABASE_URL)",
    )
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args(argv)
    logging.basicConfig(
        level=args.log_level, format="%(asctime)s %(levelname)s %(name)s — %(message)s"
    )

    records = load_records(args.json)
    loadable, skipped = partition(records)
    log.info(
        "%d records total — %d loadable (have ra/dec), %d skipped (positionless)",
        len(records),
        len(loadable),
        len(skipped),
    )
    cats = category_counts(loadable)
    for cat, n in sorted(cats.items(), key=lambda kv: -kv[1]):
        log.info("  loadable | %-26s %d", cat, n)
    cats_skipped = category_counts(skipped)
    for cat, n in sorted(cats_skipped.items(), key=lambda kv: -kv[1]):
        log.info("  skipped  | %-26s %d", cat, n)

    if args.dry_run:
        log.info("dry-run — no DB writes")
        return 0
    if not args.db_url:
        log.error("--db-url or $DATABASE_URL required for live ingest")
        return 2
    inserted, updated = upsert_postgres(args.db_url, loadable)
    log.info("ingest done — inserted=%d updated=%d", inserted, updated)
    return 0


if __name__ == "__main__":
    sys.exit(main())
