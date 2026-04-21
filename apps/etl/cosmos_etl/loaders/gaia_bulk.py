"""T-D-05 — Bulk-load Gaia DR3 entity payloads into Postgres via COPY.

Stream-based: each CSV chunk is transformed through
`gaia_to_entities.iter_entities_from_csv` and fed straight into
`COPY ... FROM STDIN` so we never hold more than one row in memory.
On a bright-subset chunk (~30k rows per HEALPix band), this finishes in
a few seconds on commodity hardware; across the full ~1.2M row subset
we target < 5 min (Doc 28 §ETL).

The target is the `stars` partitioned table. `entities.id` is the FK;
we insert the entity row via the same transaction so the stars row can
reference it. Batch size (default 2000) balances throughput vs memory
pressure on psycopg2's prepared-statement cache.

Idempotency: the natural key is `source_id_gaia`. Before loading a
chunk we delete any existing stars rows whose `source_id_gaia` appears
in the transformed set, then re-insert — so a second run is a
write-once overwrite, not a duplicate.

Run:
    python -m cosmos_etl.loaders.gaia_bulk                      # all chunks
    python -m cosmos_etl.loaders.gaia_bulk --only dr3_bright_mag10_band000.csv
"""
from __future__ import annotations

import argparse
import io
import json
import logging
import math
import os
import sys
import time
from pathlib import Path
from typing import Iterable, Iterator, Sequence

from ..transformers.gaia_to_entities import GaiaEntity, iter_entities_from_csv

log = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_CHUNK_DIR = REPO_ROOT / "data" / "raw" / "gaia"


def _format_csv_value(value: object) -> str:
    """Escape a single COPY CSV field."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return ""
        return repr(value)
    if isinstance(value, int):
        return str(value)
    s = str(value)
    # CSV escape: quote if it contains a comma, quote, newline.
    if any(c in s for c in (',', '"', '\n', '\r')):
        return '"' + s.replace('"', '""') + '"'
    return s


def entity_copy_line(entity: GaiaEntity) -> str:
    """Serialize one `entities` row as a COPY-CSV line (NO trailing newline)."""
    aliases_literal = "{" + ",".join(_postgres_array_escape(a) for a in entity.aliases) + "}"
    fields = [
        _format_csv_value(entity.ent_id),
        _format_csv_value(entity.entity_type),
        _format_csv_value(entity.category),
        _format_csv_value(entity.name),
        _format_csv_value(aliases_literal),
        _format_csv_value(json.dumps(entity.catalog_ids)),
        _format_csv_value(entity.ra_deg),
        _format_csv_value(entity.dec_coord_deg),
        _format_csv_value(entity.distance_pc),
        _format_csv_value(json.dumps(entity.properties, allow_nan=False)),
        _format_csv_value(entity.data_source),
        _format_csv_value(0.9),  # data_quality
    ]
    return ",".join(fields)


def _postgres_array_escape(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


ENTITY_COLUMNS = (
    "ent_id",
    "entity_type",
    "category",
    "name",
    "aliases",
    "catalog_ids",
    "ra",
    "dec_coord",
    "distance_pc",
    "properties",
    "data_source",
    "data_quality",
)

STARS_COLUMNS = (
    "entity_id",
    "source_id_gaia",
    "ra",
    "dec_coord",
    "parallax",
    "parallax_error",
    "pm_ra",
    "pm_dec",
    "mag_g",
    "bp_rp",
    "spectral_type",
    "healpix_order6",
)


def load_chunk(conn, entities: Iterable[GaiaEntity], batch_size: int = 2000) -> tuple[int, float]:
    """Load one chunk. Returns (rows_loaded, elapsed_seconds)."""
    start = time.monotonic()
    total = 0
    for batch in _chunked(entities, batch_size):
        batch_ids = [e.catalog_ids["gaia_dr3"] for e in batch]
        with conn.cursor() as cur:
            # Idempotent: wipe any prior rows with these source_ids so reruns
            # don't leave duplicates.
            cur.execute(
                "DELETE FROM stars WHERE source_id_gaia = ANY(%s);",
                (batch_ids,),
            )
            cur.execute(
                """
                DELETE FROM entities
                 WHERE (catalog_ids->>'gaia_dr3')::bigint = ANY(%s)
                   AND data_source = 'gaia_dr3';
                """,
                (batch_ids,),
            )
            # Stream the entities copy.
            buf = io.StringIO()
            for e in batch:
                buf.write(entity_copy_line(e))
                buf.write("\n")
            buf.seek(0)
            cols = ", ".join(ENTITY_COLUMNS)
            cur.copy_expert(
                f"COPY entities ({cols}) FROM STDIN WITH (FORMAT csv, NULL '', QUOTE '\"')",
                buf,
            )
            # Map source_id → new entity id for the stars join.
            cur.execute(
                """
                SELECT (catalog_ids->>'gaia_dr3')::bigint AS src, id
                  FROM entities
                 WHERE data_source = 'gaia_dr3'
                   AND (catalog_ids->>'gaia_dr3')::bigint = ANY(%s);
                """,
                (batch_ids,),
            )
            mapping: dict[int, int] = {row[0]: row[1] for row in cur.fetchall()}

            # Stream the stars copy.
            stars_buf = io.StringIO()
            for e in batch:
                src = int(e.catalog_ids["gaia_dr3"])  # type: ignore[arg-type]
                entity_id = mapping.get(src)
                line = [
                    _format_csv_value(entity_id),
                    _format_csv_value(src),
                    _format_csv_value(e.ra_deg),
                    _format_csv_value(e.dec_coord_deg),
                    _format_csv_value(e.properties.get("parallax_mas")),
                    _format_csv_value(e.properties.get("parallax_error_mas")),
                    _format_csv_value(e.properties.get("pmra_mas_per_yr")),
                    _format_csv_value(e.properties.get("pmdec_mas_per_yr")),
                    _format_csv_value(e.properties.get("magnitude_apparent")),
                    _format_csv_value(e.properties.get("bp_rp")),
                    _format_csv_value(e.properties.get("spectral_class")),
                    _format_csv_value(e.healpix_order6),
                ]
                stars_buf.write(",".join(line))
                stars_buf.write("\n")
            stars_buf.seek(0)
            cols = ", ".join(STARS_COLUMNS)
            cur.copy_expert(
                f"COPY stars ({cols}) FROM STDIN WITH (FORMAT csv, NULL '', QUOTE '\"')",
                stars_buf,
            )
        conn.commit()
        total += len(batch)
    return total, time.monotonic() - start


def _chunked(it: Iterable[GaiaEntity], n: int) -> Iterator[list[GaiaEntity]]:
    buf: list[GaiaEntity] = []
    for item in it:
        buf.append(item)
        if len(buf) >= n:
            yield buf
            buf = []
    if buf:
        yield buf


def load_directory(
    db_url: str,
    chunk_dir: Path,
    *,
    only: Sequence[str] | None = None,
    batch_size: int = 2000,
) -> int:
    import psycopg2  # lazy

    files = sorted(chunk_dir.glob("dr3_bright_*.csv"))
    if only:
        wanted = set(only)
        files = [f for f in files if f.name in wanted]
    if not files:
        log.warning("no chunk CSVs to load in %s", chunk_dir)
        return 0
    grand_total = 0
    t0 = time.monotonic()
    with psycopg2.connect(db_url) as conn:
        for f in files:
            entities = iter_entities_from_csv(f)
            count, elapsed = load_chunk(conn, entities, batch_size=batch_size)
            rate = count / elapsed if elapsed > 0 else float("inf")
            log.info("loaded %s: %d rows in %.2fs (%.0f rows/s)", f.name, count, elapsed, rate)
            grand_total += count
    elapsed_total = time.monotonic() - t0
    rate_total = grand_total / elapsed_total if elapsed_total > 0 else float("inf")
    log.info(
        "bulk load complete: %d rows in %.2fs (%.0f rows/s overall)",
        grand_total, elapsed_total, rate_total,
    )
    return grand_total


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Bulk-load Gaia CSV chunks into Postgres")
    parser.add_argument("--chunk-dir", type=Path, default=DEFAULT_CHUNK_DIR)
    parser.add_argument("--only", action="append", default=None, help="specific filenames to load")
    parser.add_argument("--batch-size", type=int, default=2000)
    parser.add_argument("--db-url", default=os.environ.get("DATABASE_URL"))
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args(argv)
    logging.basicConfig(
        level=args.log_level, format="%(asctime)s %(levelname)s %(name)s — %(message)s"
    )
    if not args.db_url:
        log.error("--db-url or $DATABASE_URL required")
        return 2
    load_directory(args.db_url, args.chunk_dir, only=args.only, batch_size=args.batch_size)
    return 0


if __name__ == "__main__":
    sys.exit(main())
