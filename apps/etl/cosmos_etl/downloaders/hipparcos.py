"""Hipparcos bright-star downloader (T40 stellar ingest — foothold).

The full T40 scope includes Hipparcos 117,955 + Gaia DR3 bright subset (~10M
G<16) + HD 272,150 + WDS 156,000 + SB9 4,500 + GCVS 58,000 — ingested via
VizieR VOTables in production. For a dev-friendly foothold we bundle a
~70-row bright subset (V < 4) that exercises every step of the pipeline:

  1. Ingest — read bundled data/catalogs/raw/hipparcos_bright.csv
  2. Classify — call classify_star_by_spectral() → ENT-10XX
  3. Load — UPSERT into entities + stars + cross_identifications
  4. Version — update VERSIONS.json via CatalogVersions

The star is identified by HIP number; HD + Bayer designation land in
`cross_identifications`. Octree tile generation is a separate step
(`scripts/build-star-tiles.mjs`) that consumes the loaded `stars` table.

Spec: Doc 23 §6.1.2 (stellar catalogs), Doc 23 §17 (catalog integration),
Doc 25 §4.1 (stars partitioned table), Doc 33 §3.1 (< 1 mas vs Hipparcos).

Usage:
    python -m cosmos_etl.downloaders.hipparcos          # live — requires DB/ES
    python -m cosmos_etl.downloaders.hipparcos --dry-run
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

from ..classify import Classification, classify_star_by_spectral
from ..versions import CatalogVersion, CatalogVersions, sha256_file

log = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
RAW_CSV = REPO_ROOT / "data" / "catalogs" / "raw" / "hipparcos_bright.csv"

CATALOG_NAME = "hipparcos_bright"
CATALOG_VERSION = "v2007-reduction-bright-v1"
CATALOG_SOURCE_URL = "https://cdsarc.cds.unistra.fr/viz-bin/cat/I/311"


@dataclass
class HipparcosRow:
    hip: int
    name: Optional[str]
    bayer: Optional[str]
    ra_deg: float
    dec_deg: float
    parallax_mas: Optional[float]
    pm_ra_mas_yr: Optional[float]
    pm_dec_mas_yr: Optional[float]
    mag_v: Optional[float]
    bp_rp: Optional[float]
    spectral_type: Optional[str]
    radial_velocity_kms: Optional[float]
    hd: Optional[int]

    @property
    def distance_pc(self) -> Optional[float]:
        """Plx-inverted distance. Valid only for positive parallax with small
        relative error — we clamp to |parallax| > 1 mas which gives d < 1 kpc,
        consistent with the Hipparcos bright-star regime."""
        if self.parallax_mas is None or self.parallax_mas <= 1.0:
            return None
        return 1000.0 / self.parallax_mas

    @property
    def display_name(self) -> str:
        if self.name:
            return self.name
        if self.bayer:
            return self.bayer
        return f"HIP {self.hip}"

    @property
    def aliases(self) -> list[str]:
        out: list[str] = [f"HIP {self.hip}"]
        if self.name:
            out.append(self.name)
        if self.bayer:
            out.append(self.bayer)
        if self.hd:
            out.append(f"HD {self.hd}")
        return out


def parse_csv(path: Path) -> list[HipparcosRow]:
    rows: list[HipparcosRow] = []
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for rec in reader:
            rows.append(
                HipparcosRow(
                    hip=int(rec["hip"]),
                    name=(rec.get("name") or "").strip() or None,
                    bayer=(rec.get("bayer") or "").strip() or None,
                    ra_deg=float(rec["ra_deg"]),
                    dec_deg=float(rec["dec_deg"]),
                    parallax_mas=_float_or_none(rec.get("parallax_mas")),
                    pm_ra_mas_yr=_float_or_none(rec.get("pm_ra_mas_yr")),
                    pm_dec_mas_yr=_float_or_none(rec.get("pm_dec_mas_yr")),
                    mag_v=_float_or_none(rec.get("mag_v")),
                    bp_rp=_float_or_none(rec.get("bp_rp")),
                    spectral_type=(rec.get("spectral_type") or "").strip() or None,
                    radial_velocity_kms=_float_or_none(rec.get("radial_velocity_kms")),
                    hd=_int_or_none(rec.get("hd")),
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


def _int_or_none(v: Optional[str]) -> Optional[int]:
    if v is None:
        return None
    s = v.strip()
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return None


def classify_rows(rows: Iterable[HipparcosRow]) -> list[tuple[HipparcosRow, Classification]]:
    return [(r, classify_star_by_spectral(r.spectral_type)) for r in rows]


def _ra_to_longitude(ra_deg: float) -> float:
    if ra_deg > 180.0:
        return ra_deg - 360.0
    return ra_deg


def to_entity_payload(row: HipparcosRow, cls: Classification) -> dict:
    """Shape the row for the `entities` + `stars` Postgres insert."""
    catalog_ids: dict[str, object] = {"hipparcos": row.hip}
    if row.hd:
        catalog_ids["hd"] = row.hd
    if row.bayer:
        catalog_ids["bayer"] = row.bayer
    if row.name:
        catalog_ids["iau"] = row.name

    distance_pc = row.distance_pc
    properties: dict[str, object] = {}
    if row.mag_v is not None:
        properties["magnitude_apparent"] = row.mag_v
    if row.spectral_type:
        properties["spectral_type"] = row.spectral_type
    if row.bp_rp is not None:
        properties["bp_rp"] = row.bp_rp
    if row.radial_velocity_kms is not None:
        properties["radial_velocity_kms"] = row.radial_velocity_kms
    if distance_pc is not None:
        properties["distance_pc"] = distance_pc

    return {
        "_doc_id": f"hipparcos:HIP-{row.hip}",
        "ent_id": cls.ent_id,
        "entity_type": int(cls.ent_id.split("-")[1]),
        "category": cls.category,
        "name": row.display_name,
        "aliases": row.aliases,
        "catalog_ids": catalog_ids,
        "ra": row.ra_deg,
        "longitude": _ra_to_longitude(row.ra_deg),
        "dec_coord": row.dec_deg,
        "distance_pc": distance_pc,
        "properties": properties,
        "data_source": "hipparcos",
        "data_quality": 0.92,
        # Star-row specific — consumed by _load_postgres to fill the `stars`
        # partition in addition to the `entities` row.
        "star_row": {
            "hip": row.hip,
            "hd": row.hd,
            "bayer": row.bayer,
            "iau": row.name,
            "ra": row.ra_deg,
            "dec_coord": row.dec_deg,
            "parallax": row.parallax_mas,
            "pm_ra": row.pm_ra_mas_yr,
            "pm_dec": row.pm_dec_mas_yr,
            "radial_velocity": row.radial_velocity_kms,
            "mag_g": row.mag_v,  # Hipparcos V as proxy for Gaia G — close enough for bright subset
            "bp_rp": row.bp_rp,
            "spectral_type": row.spectral_type,
            "distance_pc": distance_pc,
        },
    }


def run(
    *,
    db_url: Optional[str] = None,
    versions: Optional[CatalogVersions] = None,
    dry_run: bool = False,
) -> int:
    """Execute the Hipparcos bright ingest. Returns row count on success."""
    if not RAW_CSV.exists():
        log.error("hipparcos raw CSV missing: %s", RAW_CSV)
        return 0
    rows = parse_csv(RAW_CSV)
    log.info("parsed %d Hipparcos bright rows from %s", len(rows), RAW_CSV)

    classified = classify_rows(rows)
    payloads = [to_entity_payload(r, c) for r, c in classified]
    log.info(
        "classified %d rows; unique ENT-IDs: %d",
        len(classified),
        len({c.ent_id for _, c in classified}),
    )

    if dry_run:
        for row, cls in classified[:5]:
            log.info("  HIP %d %s → %s (%s)", row.hip, row.display_name, cls.ent_id, cls.subtype_note)
        log.info("dry run — no writes")
    else:
        db_url = db_url or os.environ.get("DATABASE_URL")
        if not db_url:
            log.error("DATABASE_URL not set; cannot run live ingest")
            return 0
        _load_postgres(db_url, payloads)
        _load_elasticsearch(payloads)

    versions = versions or CatalogVersions.load()
    versions.upsert(
        CatalogVersion.make(
            name=CATALOG_NAME,
            version=CATALOG_VERSION,
            source_url=CATALOG_SOURCE_URL,
            record_count=len(rows),
            sha256=sha256_file(RAW_CSV),
            license="Public domain (ESA Hipparcos mission)",
            notes=(
                "Bundled bright subset (V < 4) for T40 ETL foothold. Production "
                "ingest replaces this with the full VizieR I/311 table (117,955 rows)."
            ),
        )
    )
    versions.save()
    return len(rows)


def _load_postgres(db_url: str, payloads: list[dict]) -> None:
    """UPSERT entities + stars + cross_identifications for bright HIP rows."""
    import psycopg2
    from psycopg2.extras import Json

    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            for p in payloads:
                hip_ref = str(p["catalog_ids"]["hipparcos"])
                cur.execute(
                    """
                    SELECT entity_id FROM cross_identifications
                    WHERE catalog = 'hipparcos' AND catalog_ref = %s LIMIT 1;
                    """,
                    (hip_ref,),
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

                # Cross identifications (hipparcos is primary; HD/Bayer/IAU are aliases).
                for catalog, ref in p["catalog_ids"].items():
                    cur.execute(
                        """
                        INSERT INTO cross_identifications (entity_id, catalog, catalog_ref, is_primary)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT DO NOTHING;
                        """,
                        (entity_id, catalog, str(ref), catalog == "hipparcos"),
                    )

                # Stars partition — magnitude-keyed. Skip rows without mag_g
                # because the partitioned table REQUIRES it.
                star = p["star_row"]
                if star.get("mag_g") is None:
                    continue
                cur.execute(
                    """
                    INSERT INTO stars
                        (entity_id, source_id_gaia, ra, dec_coord, parallax,
                         pm_ra, pm_dec, radial_velocity, mag_g, bp_rp, spectral_type)
                    VALUES
                        (%s, NULL, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        entity_id,
                        star["ra"],
                        star["dec_coord"],
                        star["parallax"],
                        star["pm_ra"],
                        star["pm_dec"],
                        star["radial_velocity"],
                        star["mag_g"],
                        star["bp_rp"],
                        star["spectral_type"],
                    ),
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
                "_id": p["_doc_id"],
                "_source": {
                    "ent_id": p["ent_id"],
                    "entity_type": p["entity_type"],
                    "category": p["category"],
                    "name": p["name"],
                    "aliases": p["aliases"],
                    "catalog_ids": p["catalog_ids"],
                    "ra": p["ra"],
                    "dec": p["dec_coord"],
                    "distance_pc": p["distance_pc"],
                    "position_geo": {"lat": p["dec_coord"], "lon": p["longitude"]},
                    "magnitude": p["properties"].get("magnitude_apparent"),
                    "spectral_type": p["properties"].get("spectral_type"),
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
    ap = argparse.ArgumentParser(description="Ingest Hipparcos bright stars into Cosmos DB + ES")
    ap.add_argument("--dry-run", action="store_true", help="parse + classify without writes")
    ap.add_argument("--db-url", default=None, help="override DATABASE_URL env")
    return ap


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    args = _build_argparser().parse_args(argv)
    n = run(db_url=args.db_url, dry_run=args.dry_run)
    log.info("hipparcos ingest done: %d rows", n)
    return 0 if n > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
