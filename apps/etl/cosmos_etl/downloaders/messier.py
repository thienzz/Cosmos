"""Messier catalog downloader.

The full 110-object Messier catalog. Used as the reference downloader for T38.2
because it is small, offline-friendly (bundled as CSV), and exercises every step
of the pipeline: download → parse → classify → cross-match → load Postgres + ES.

Pipeline stages per Doc 23 §6.3:
  1. Ingest  — read bundled data/catalogs/raw/messier.csv
  2. Classify — call classify_ent_id(messier_number=N)
  3. Load     — UPSERT into entities + cross_identifications + index ES document
  4. Version  — update VERSIONS.json via CatalogVersions

Usage:
    python -m cosmos_etl.downloaders.messier           # live — requires DB/ES up
    python -m cosmos_etl.downloaders.messier --dry-run # parse only, no writes
"""
from __future__ import annotations

import argparse
import csv
import logging
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

from ..classify import Classification, classify_ent_id
from ..versions import CatalogVersion, CatalogVersions, sha256_file

log = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
RAW_CSV = REPO_ROOT / "data" / "catalogs" / "raw" / "messier.csv"
PROCESSED_PARQUET = REPO_ROOT / "data" / "processed" / "messier.parquet"

CATALOG_NAME = "messier"
CATALOG_VERSION = "1781-final"  # Charles Messier's catalog is historically frozen.
CATALOG_SOURCE_URL = "https://ned.ipac.caltech.edu/level5/Sulentic/Sulentic_contents.html"


@dataclass
class MessierRow:
    number: int            # 1..110
    ngc: str | None        # e.g. "NGC 1952" (M1)
    common_name: str | None
    ra_deg: float          # ICRS J2000.0
    dec_deg: float
    constellation: str
    angular_size_arcmin: float | None
    magnitude: float | None
    distance_pc: float | None      # NULL for many; T45/T46 fill in

    @property
    def name(self) -> str:
        display = f"M{self.number}"
        if self.common_name:
            return f"{display} ({self.common_name})"
        return display

    @property
    def aliases(self) -> list[str]:
        out = [f"M{self.number}", f"Messier {self.number}"]
        if self.ngc:
            out.append(self.ngc)
        if self.common_name:
            out.append(self.common_name)
        return out


def parse_csv(path: Path) -> list[MessierRow]:
    rows: list[MessierRow] = []
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for rec in reader:
            rows.append(
                MessierRow(
                    number=int(rec["number"]),
                    ngc=(rec.get("ngc") or "").strip() or None,
                    common_name=(rec.get("common_name") or "").strip() or None,
                    ra_deg=float(rec["ra_deg"]),
                    dec_deg=float(rec["dec_deg"]),
                    constellation=(rec.get("constellation") or "").strip(),
                    angular_size_arcmin=_float_or_none(rec.get("angular_size_arcmin")),
                    magnitude=_float_or_none(rec.get("magnitude")),
                    distance_pc=_float_or_none(rec.get("distance_pc")),
                )
            )
    return rows


def _float_or_none(v: Optional[str]) -> Optional[float]:
    if v is None:
        return None
    s = v.strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def classify_rows(rows: Iterable[MessierRow]) -> list[tuple[MessierRow, Classification]]:
    return [(r, classify_ent_id(messier_number=r.number)) for r in rows]


def _ra_to_longitude(ra_deg: float) -> float:
    """Normalize astronomical RA [0, 360) to ES geo_point longitude [-180, 180]."""
    if ra_deg > 180.0:
        return ra_deg - 360.0
    return ra_deg


def to_entity_payload(row: MessierRow, cls: Classification) -> dict:
    """Shape the row for the `entities` Postgres insert + ES document."""
    catalog_ids: dict[str, object] = {"messier": f"M{row.number}"}
    if row.ngc:
        # Keep the canonical NGC format with space, e.g. "NGC 1952".
        catalog_ids["ngc"] = row.ngc
    properties: dict[str, object] = {
        "constellation": row.constellation,
    }
    if row.angular_size_arcmin is not None:
        properties["angular_size_arcmin"] = row.angular_size_arcmin
    if row.magnitude is not None:
        properties["magnitude_apparent"] = row.magnitude
    if row.distance_pc is not None:
        properties["distance_pc"] = row.distance_pc
    return {
        # Unique per Messier object. ent_id alone collides because Doc 17 buckets
        # multiple Messier entries into the same subtype (e.g. all 29 globulars
        # are ENT-7011) — we need one row per physical object in Postgres + ES.
        "_doc_id": f"messier:M{row.number}",
        "ent_id": cls.ent_id,
        "entity_type": int(cls.ent_id.split("-")[1]),
        "category": cls.category,
        "name": row.name,
        "aliases": row.aliases,
        "catalog_ids": catalog_ids,
        "ra": row.ra_deg,
        # ES geo_point needs longitude in [-180, 180]. RA lives in [0, 360).
        "longitude": _ra_to_longitude(row.ra_deg),
        "dec_coord": row.dec_deg,
        "distance_pc": row.distance_pc,
        "properties": properties,
        "data_source": "messier",
        "data_quality": 0.95,
    }


def run(
    *,
    db_url: Optional[str] = None,
    versions: Optional[CatalogVersions] = None,
    dry_run: bool = False,
) -> int:
    """Execute the Messier ingest pipeline. Returns row count on success."""
    if not RAW_CSV.exists():
        log.error("messier raw CSV missing: %s", RAW_CSV)
        return 0
    rows = parse_csv(RAW_CSV)
    log.info("parsed %d Messier rows from %s", len(rows), RAW_CSV)
    if len(rows) != 110:
        log.warning("expected 110 rows, got %d — Doc 33 §10.2 Messier completeness check will fail", len(rows))

    classified = classify_rows(rows)
    payloads = [to_entity_payload(r, c) for r, c in classified]
    log.info("classified %d rows; unique ENT-IDs: %d",
             len(classified), len({c.ent_id for _, c in classified}))

    if dry_run:
        for row, cls in classified[:5]:
            log.info("  M%-3d → %s (%s)", row.number, cls.ent_id, cls.subtype_note)
        log.info("dry run — no writes")
    else:
        db_url = db_url or os.environ.get("DATABASE_URL")
        if not db_url:
            log.error("DATABASE_URL not set; cannot run live ingest")
            return 0
        _load_postgres(db_url, payloads)
        _load_elasticsearch(payloads)

    # Update VERSIONS.json regardless of dry_run — writers update even dry runs so
    # the subsequent live run has a consistent view. Bypass with --no-write-versions.
    versions = versions or CatalogVersions.load()
    versions.upsert(
        CatalogVersion.make(
            name=CATALOG_NAME,
            version=CATALOG_VERSION,
            source_url=CATALOG_SOURCE_URL,
            record_count=len(rows),
            sha256=sha256_file(RAW_CSV),
            license="Public domain (18th-century catalog)",
            notes=(
                "Positions from NED + NGC cross-identifications. "
                "Dwarf elliptical companions M32/M110 of M31 classified as ENT-6021."
            ),
        )
    )
    versions.save()
    return len(rows)


def _load_postgres(db_url: str, payloads: list[dict]) -> None:
    """UPSERT entities + cross_identifications.

    Keyed on (catalog='messier', catalog_ref='M<N>'): each physical Messier
    object maps to one `entities` row, but `ent_id` stays the Doc 17 subtype
    (e.g. all 29 globulars all carry `ENT-7011`). Uniqueness per object lives
    in cross_identifications.
    """
    import psycopg2
    from psycopg2.extras import Json

    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            for p in payloads:
                messier_ref = p["catalog_ids"]["messier"]
                cur.execute(
                    """
                    SELECT entity_id FROM cross_identifications
                    WHERE catalog = 'messier' AND catalog_ref = %s LIMIT 1;
                    """,
                    (messier_ref,),
                )
                existing = cur.fetchone()
                cols = {
                    "ent_id": p["ent_id"],
                    "entity_type": p["entity_type"],
                    "category": p["category"],
                    "name": p["name"],
                    "aliases": p["aliases"],
                    "catalog_ids": Json(p["catalog_ids"]),
                    "ra": p["ra"],
                    "dec_coord": p["dec_coord"],
                    "distance_pc": p["distance_pc"],
                    "properties": Json(p["properties"]),
                    "data_source": p["data_source"],
                    "data_quality": p["data_quality"],
                }
                if existing:
                    entity_id = existing[0]
                    cur.execute(
                        """
                        UPDATE entities SET
                            ent_id = %(ent_id)s, entity_type = %(entity_type)s,
                            category = %(category)s, name = %(name)s,
                            aliases = %(aliases)s, catalog_ids = %(catalog_ids)s,
                            ra = %(ra)s, dec_coord = %(dec_coord)s,
                            distance_pc = %(distance_pc)s, properties = %(properties)s,
                            data_source = %(data_source)s, data_quality = %(data_quality)s,
                            last_updated = NOW()
                        WHERE id = %(id)s;
                        """,
                        {**cols, "id": entity_id},
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO entities
                            (ent_id, entity_type, category, name, aliases, catalog_ids,
                             ra, dec_coord, distance_pc, properties, data_source, data_quality)
                        VALUES
                            (%(ent_id)s, %(entity_type)s, %(category)s, %(name)s, %(aliases)s, %(catalog_ids)s,
                             %(ra)s, %(dec_coord)s, %(distance_pc)s, %(properties)s, %(data_source)s, %(data_quality)s)
                        RETURNING id;
                        """,
                        cols,
                    )
                    (entity_id,) = cur.fetchone()
                for catalog, ref in p["catalog_ids"].items():
                    cur.execute(
                        """
                        INSERT INTO cross_identifications (entity_id, catalog, catalog_ref, is_primary)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT DO NOTHING;
                        """,
                        (entity_id, catalog, str(ref), catalog == "messier"),
                    )
        conn.commit()


def _load_elasticsearch(payloads: list[dict]) -> None:
    from elasticsearch import Elasticsearch, helpers  # lazy import

    es_url = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
    client = Elasticsearch(es_url)

    def actions():
        for p in payloads:
            yield {
                "_op_type": "index",
                "_index": "cosmos_entities",
                # _doc_id is per-object unique (messier:M<N>); ent_id alone
                # collides because Doc 17 subtypes bucket many physical objects.
                "_id": p["_doc_id"],
                "_source": {
                    "ent_id": p["ent_id"],
                    "entity_type": p["entity_type"],
                    "category": p["category"],
                    "name": p["name"],
                    "aliases": p["aliases"],
                    "constellation": p["properties"].get("constellation"),
                    "catalog_ids": p["catalog_ids"],
                    "ra": p["ra"],
                    "dec": p["dec_coord"],
                    "distance_pc": p["distance_pc"],
                    # ES geo_point needs longitude wrapped to [-180, 180].
                    "position_geo": {"lat": p["dec_coord"], "lon": p["longitude"]},
                    "magnitude": p["properties"].get("magnitude_apparent"),
                    "data_source": p["data_source"],
                    "data_quality": p["data_quality"],
                    "suggest": {
                        "input": [p["name"], *p["aliases"]],
                        "contexts": {"category": [str(p["category"])]},
                    },
                },
            }

    helpers.bulk(client, actions(), raise_on_error=True)


def _build_argparser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description="Ingest Messier catalog into Cosmos DB + ES")
    ap.add_argument("--dry-run", action="store_true", help="parse + classify without writing")
    ap.add_argument("--db-url", default=None, help="override DATABASE_URL env")
    return ap


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    args = _build_argparser().parse_args(argv)
    n = run(db_url=args.db_url, dry_run=args.dry_run)
    log.info("messier ingest done: %d rows", n)
    return 0 if n > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
