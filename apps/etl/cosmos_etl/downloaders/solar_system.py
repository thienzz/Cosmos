"""Solar system bodies downloader.

T38 reference ingest for the 11 major solar-system bodies (Sun + 8 planets +
Moon + Pluto). Each body carries a NAIF id that the frontend `SolarSystemRenderer`
already meshes, so ingesting them makes search results click-through to
`flyToEntity(naifId)` on the existing solar-system pipeline (no Messier-style
flyToCelestialCoord dance needed).

Scope kept minimal — T39 brings the full JPL DE441 + MPC + moons catalog.
This module exists so the search UI demo is useful *right now*.

Pipeline:
  1. In-memory catalog (below) — no network fetch needed.
  2. Classify via Doc 17 ENT-ID table.
  3. UPSERT entities + cross_identifications.
  4. Bulk index ES with `naif_id` + numeric id so search hits land in
     `SolarSystemRenderer.flyToEntity()` cleanly.
"""
from __future__ import annotations

import logging
import os
import sys
from dataclasses import dataclass
from typing import Optional

from ..versions import CatalogVersion, CatalogVersions

log = logging.getLogger(__name__)

CATALOG_NAME = "solar_system_major"
CATALOG_VERSION = "2026.Q2.1"
CATALOG_SOURCE_URL = "https://ssd.jpl.nasa.gov/planets/approx_pos.html"


@dataclass
class SolarBody:
    naif_id: int
    name: str
    ent_id: str              # Doc 17 subtype
    category: int            # entities.category
    body_type: str           # solar_system_bodies.body_type
    parent_naif_id: int
    radius_km: float
    aliases: tuple[str, ...] = ()


# 11 major bodies — mirror apps/web/src/data/solarSystemCatalog.ts NAIF ids.
# ent_id choices keyed off Doc 17 subtype definitions (ENT-1014 G-type for
# the Sun, ENT-2010..2026 per-planet analogues, ENT-3013 cratered rocky moon
# for Luna, ENT-4030 Pluto-type dwarf planet).
BODIES: list[SolarBody] = [
    SolarBody(10,  "Sun",     "ENT-1014", 1, "star",         -1,  695_700.0, aliases=("Sol",)),
    SolarBody(199, "Mercury", "ENT-2010", 2, "planet",       10,    2_439.7),
    SolarBody(299, "Venus",   "ENT-2011", 2, "planet",       10,    6_051.8),
    SolarBody(399, "Earth",   "ENT-2012", 2, "planet",       10,    6_371.0, aliases=("Terra", "Gaia")),
    SolarBody(301, "Moon",    "ENT-3013", 3, "moon",        399,    1_737.4, aliases=("Luna",)),
    SolarBody(499, "Mars",    "ENT-2013", 2, "planet",       10,    3_389.5, aliases=("Red Planet",)),
    SolarBody(599, "Jupiter", "ENT-2020", 2, "planet",       10,   69_911.0),
    SolarBody(699, "Saturn",  "ENT-2021", 2, "planet",       10,   58_232.0),
    SolarBody(799, "Uranus",  "ENT-2025", 2, "planet",       10,   25_362.0),
    SolarBody(899, "Neptune", "ENT-2026", 2, "planet",       10,   24_622.0),
    SolarBody(999, "Pluto",   "ENT-4030", 4, "dwarf_planet", 10,    1_188.3, aliases=("134340 Pluto",)),
]


def _build_payload(body: SolarBody) -> dict:
    """Shape a SolarBody for entities + ES ingest.

    Note: RA/Dec are intentionally set to null — solar-system bodies move
    relative to the celestial sphere (they orbit), so a frozen ICRS position
    would be misleading. The frontend's SolarSystemRenderer carries live
    positions; search only needs the NAIF id to kick `flyToEntity`.
    """
    return {
        "_doc_id": f"naif:{body.naif_id}",
        "ent_id": body.ent_id,
        "entity_type": int(body.ent_id.split("-")[1]),
        "category": body.category,
        "name": body.name,
        "aliases": list(body.aliases),
        "catalog_ids": {"naif": body.naif_id},
        "ra": None,
        "dec_coord": None,
        "distance_pc": None,
        "properties": {
            "body_type": body.body_type,
            "radius_km": body.radius_km,
            "parent_naif_id": body.parent_naif_id,
        },
        "data_source": "solar_system_major",
        "data_quality": 1.0,
    }


def run(
    *,
    db_url: Optional[str] = None,
    versions: Optional[CatalogVersions] = None,
    dry_run: bool = False,
) -> int:
    log.info("solar_system: %d major bodies to ingest", len(BODIES))
    payloads = [_build_payload(b) for b in BODIES]

    if dry_run:
        for b, p in zip(BODIES, payloads, strict=True):
            log.info("  NAIF %-4d  %s  → %s (%s)", b.naif_id, b.name, p["ent_id"], b.body_type)
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
            record_count=len(BODIES),
            license="NASA/JPL public domain",
            notes=(
                "Minimal T38 seed — Sun + 8 planets + Moon + Pluto. "
                "Procedural client-side population (~1.3M asteroids, 4.6k "
                "comets, 293 moons) ships via T39 frontend renderer; "
                "production MPC/JPL ingest tracked via mpc_asteroids + "
                "jpl_comets downloaders."
            ),
        )
    )
    versions.save()
    return len(BODIES)


def _load_postgres(db_url: str, payloads: list[dict]) -> None:
    """UPSERT keyed on (catalog='naif', catalog_ref=<NAIF>).

    NAIF id is globally unique per body, so the cross-ID is the natural key.
    """
    import psycopg2
    from psycopg2.extras import Json

    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            for p in payloads:
                naif_ref = str(p["catalog_ids"]["naif"])
                cur.execute(
                    """
                    SELECT entity_id FROM cross_identifications
                    WHERE catalog = 'naif' AND catalog_ref = %s LIMIT 1;
                    """,
                    (naif_ref,),
                )
                existing = cur.fetchone()
                cols = {
                    "ent_id": p["ent_id"],
                    "entity_type": p["entity_type"],
                    "category": p["category"],
                    "name": p["name"],
                    "aliases": p["aliases"],
                    "catalog_ids": Json(p["catalog_ids"]),
                    # Postgres entities.ra is NOT NULL. Solar bodies don't have
                    # a static ICRS position (they orbit), but the table demands
                    # a value — write 0 with a note in properties so the row
                    # still satisfies the CHECK constraint. Clients must use
                    # the live SolarSystemRenderer position instead.
                    "ra": 0.0,
                    "dec_coord": 0.0,
                    "distance_pc": None,
                    "properties": Json({
                        **p["properties"],
                        "ra_note": "orbital body — use SolarSystemRenderer for live position",
                    }),
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
                cur.execute(
                    """
                    INSERT INTO cross_identifications (entity_id, catalog, catalog_ref, is_primary)
                    VALUES (%s, 'naif', %s, TRUE)
                    ON CONFLICT DO NOTHING;
                    """,
                    (entity_id, naif_ref),
                )
        conn.commit()


def _load_elasticsearch(payloads: list[dict]) -> None:
    from elasticsearch import Elasticsearch, helpers

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
                    "aliases": list(p["aliases"]),
                    "constellation": None,
                    "catalog_ids": p["catalog_ids"],
                    # RA/Dec/position omitted intentionally — solar bodies orbit.
                    # distance_pc: null.
                    "distance_pc": None,
                    "data_source": p["data_source"],
                    "data_quality": p["data_quality"],
                    "suggest": {
                        "input": [p["name"], *p["aliases"]],
                        "contexts": {"category": [str(p["category"])]},
                    },
                },
            }

    helpers.bulk(client, actions(), raise_on_error=True)


def main(argv: list[str] | None = None) -> int:
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    ap = argparse.ArgumentParser(description="Ingest major solar-system bodies")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--db-url", default=None)
    args = ap.parse_args(argv)
    n = run(db_url=args.db_url, dry_run=args.dry_run)
    log.info("solar_system ingest done: %d rows", n)
    return 0 if n > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
