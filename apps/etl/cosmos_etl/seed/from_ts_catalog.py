"""T-C-02 — ingest data/seed/entities.json into Postgres.

Input: the JSON produced by `pnpm seed:export` (T-C-01).
Output: rows in three tables:
  - `entities` (one row per record, keyed by BIGSERIAL id)
  - `solar_system_bodies` (one row per record with a `solar_system` sidecar)
  - `cross_identifications` (catalog='client_ent_id', catalog_ref=external_id)

Every statement is parameterized. Idempotent on re-run via ON CONFLICT.

Run locally:
    python -m cosmos_etl.seed.from_ts_catalog
    # or with a custom JSON path:
    python -m cosmos_etl.seed.from_ts_catalog /path/to/entities.json
"""
from __future__ import annotations

import json
import logging
import os
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import psycopg2
import psycopg2.extras

log = logging.getLogger("cosmos_etl.seed.from_ts_catalog")

DEFAULT_DATABASE_URL = "postgresql://cosmos:cosmos_dev@localhost:5432/cosmos"


def _repo_root() -> Path:
    # apps/etl/cosmos_etl/seed/from_ts_catalog.py → repo root is 4 parents up.
    return Path(__file__).resolve().parents[4]


def _default_seed_path() -> Path:
    return _repo_root() / "data" / "seed" / "entities.json"


def _connect() -> psycopg2.extensions.connection:
    url = os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
    return psycopg2.connect(url)


def _load_records(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise ValueError(f"{path}: expected JSON array")
    return data


# Map JSON category int → Postgres smallint (same values; keeps the mapping
# documented in one place).
_CATEGORY_ID = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}


def _upsert_entity(cur: psycopg2.extensions.cursor, rec: dict[str, Any]) -> int:
    """Insert the entity row and return entities.id.

    Because `entities.ent_id` is NOT UNIQUE (Doc 17 subtype), upserting by
    `(ent_id, external_id)` would require a composite constraint we don't
    have. Instead we look up by `cross_identifications(catalog='client_ent_id',
    catalog_ref=external_id)` first — if the sidecar maps the client id to
    an existing entity row, we update in place. Otherwise we insert and map.
    """
    external_id = rec["external_id"]
    category = rec["category"]
    if category not in _CATEGORY_ID:
        raise ValueError(f"category {category} not in Doc 17 range for {external_id}")

    cur.execute(
        """
        SELECT e.id
        FROM cross_identifications xid
        JOIN entities e ON e.id = xid.entity_id
        WHERE xid.catalog = 'client_ent_id' AND xid.catalog_ref = %s
        LIMIT 1
        """,
        (external_id,),
    )
    row = cur.fetchone()

    # Build props with JSON. Properties is the JSONB sidecar — keep it purely
    # what the catalog provides; the top-level columns carry ra/dec/distance.
    properties_json = psycopg2.extras.Json(rec.get("properties") or {})
    catalog_ids_json = psycopg2.extras.Json({"client_ent_id": external_id})

    if row is not None:
        entity_id = row[0]
        cur.execute(
            """
            UPDATE entities
            SET name = %s,
                aliases = %s,
                entity_type = %s,
                category = %s,
                ent_id = %s,
                ra = %s,
                dec_coord = %s,
                distance_pc = %s,
                properties = %s,
                catalog_ids = %s,
                data_source = 'client_seed',
                last_updated = NOW()
            WHERE id = %s
            """,
            (
                rec["name"],
                rec.get("aliases") or [],
                rec["entity_type"],
                rec["category"],
                rec["ent_id"],
                rec.get("ra_deg") or 0,
                rec.get("dec_deg") or 0,
                rec.get("distance_pc"),
                properties_json,
                catalog_ids_json,
                entity_id,
            ),
        )
        return entity_id

    cur.execute(
        """
        INSERT INTO entities(ent_id, entity_type, category, name, aliases,
                             ra, dec_coord, distance_pc, properties, catalog_ids,
                             data_source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'client_seed')
        RETURNING id
        """,
        (
            rec["ent_id"],
            rec["entity_type"],
            rec["category"],
            rec["name"],
            rec.get("aliases") or [],
            rec.get("ra_deg") or 0,
            rec.get("dec_deg") or 0,
            rec.get("distance_pc"),
            properties_json,
            catalog_ids_json,
        ),
    )
    (entity_id,) = cur.fetchone()
    return entity_id


def _upsert_cross_id(
    cur: psycopg2.extensions.cursor, entity_id: int, external_id: str
) -> None:
    cur.execute(
        """
        INSERT INTO cross_identifications(entity_id, catalog, catalog_ref, is_primary)
        VALUES (%s, 'client_ent_id', %s, TRUE)
        ON CONFLICT (entity_id, catalog, catalog_ref) DO NOTHING
        """,
        (entity_id, external_id),
    )


def _upsert_solar_system(
    cur: psycopg2.extensions.cursor, entity_id: int, ss: dict[str, Any]
) -> None:
    cur.execute(
        """
        INSERT INTO solar_system_bodies(
            entity_id, naif_id, body_type, parent_naif_id,
            semi_major_au, eccentricity, inclination,
            lon_asc_node, arg_periapsis, mean_anomaly, epoch_jd,
            radius_km, axial_tilt)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (naif_id) DO UPDATE SET
            entity_id = EXCLUDED.entity_id,
            body_type = EXCLUDED.body_type,
            parent_naif_id = EXCLUDED.parent_naif_id,
            semi_major_au = EXCLUDED.semi_major_au,
            eccentricity = EXCLUDED.eccentricity,
            inclination = EXCLUDED.inclination,
            lon_asc_node = EXCLUDED.lon_asc_node,
            arg_periapsis = EXCLUDED.arg_periapsis,
            mean_anomaly = EXCLUDED.mean_anomaly,
            epoch_jd = EXCLUDED.epoch_jd,
            radius_km = EXCLUDED.radius_km,
            axial_tilt = EXCLUDED.axial_tilt
        """,
        (
            entity_id,
            ss["naif_id"],
            ss.get("body_type"),
            ss.get("parent_naif_id"),
            ss.get("semi_major_au"),
            ss.get("eccentricity"),
            ss.get("inclination_deg"),
            ss.get("lon_asc_node_deg"),
            ss.get("arg_periapsis_deg"),
            ss.get("mean_anomaly_deg"),
            ss.get("epoch_jd"),
            ss.get("radius_km"),
            ss.get("axial_tilt_deg"),
        ),
    )


def ingest(seed_path: Path | None = None) -> dict[str, int]:
    """Run the full ingest. Returns counters so callers can assert."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    path = seed_path or _default_seed_path()
    log.info("loading %s", path)
    records = _load_records(path)
    log.info("loaded %d records", len(records))

    cat_counter: Counter[int] = Counter()
    ss_count = 0
    errors = 0
    conn = _connect()
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            for rec in records:
                try:
                    entity_id = _upsert_entity(cur, rec)
                    _upsert_cross_id(cur, entity_id, rec["external_id"])
                    if rec.get("solar_system"):
                        _upsert_solar_system(cur, entity_id, rec["solar_system"])
                        ss_count += 1
                    cat_counter[rec["category"]] += 1
                except Exception:
                    errors += 1
                    log.exception("failed record %r", rec.get("external_id"))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    summary = {
        "total": sum(cat_counter.values()),
        "errors": errors,
        "solar_system": ss_count,
        **{f"category_{c}": n for c, n in sorted(cat_counter.items())},
    }
    log.info("ingest summary: %s", summary)
    return summary


def main(argv: list[str]) -> int:
    seed = Path(argv[1]) if len(argv) > 1 else None
    summary = ingest(seed)
    return 0 if summary["errors"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
