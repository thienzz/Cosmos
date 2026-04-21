"""T-C-03 — Bulk-index seeded entities into Elasticsearch.

Reads every row out of `entities` that was loaded by the T-C-02 ingest
(filter on `cross_identifications.catalog = 'ts-catalog'`) and bulk-loads
them into the `entities_autocomplete` index defined by the API in
`apps/api/src/es/schemas/entities_autocomplete.ts`.

Idempotent — uses Elasticsearch's `_id = entity_id` so re-runs overwrite
in place without ballooning the index. The bootstrap script
(`pnpm --filter api es:bootstrap`) creates the index when missing; this
script also creates it if it isn't there yet, so the DAG can run in any
order.

Run:
    python -m cosmos_etl.seed.to_elasticsearch                # full run
    python -m cosmos_etl.seed.to_elasticsearch --dry-run      # parse only
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from typing import Iterable, Sequence

log = logging.getLogger(__name__)

INDEX_NAME = "entities_autocomplete"

INDEX_MAPPING: dict = {
    "properties": {
        "ent_id": {"type": "keyword"},
        "name": {
            "type": "completion",
            "analyzer": "simple",
            "preserve_separators": True,
            "preserve_position_increments": True,
            "max_input_length": 100,
        },
        "aliases": {
            "type": "completion",
            "analyzer": "simple",
            "max_input_length": 100,
        },
        "category": {"type": "keyword"},
        "kind": {"type": "keyword"},
        "magnitude": {"type": "float"},
    }
}


def fetch_records(db_url: str) -> list[dict]:
    """Pull every ts-catalog-tagged entity out of Postgres."""
    import psycopg2  # lazy

    rows: list[dict] = []
    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT e.id, e.ent_id, e.entity_type, e.category, e.name,
                       e.aliases, e.properties
                  FROM entities e
                 WHERE EXISTS (
                       SELECT 1 FROM cross_identifications x
                        WHERE x.entity_id = e.id AND x.catalog = 'ts-catalog'
                       )
                """
            )
            for entity_id, ent_id, entity_type, category, name, aliases, props in cur:
                magnitude = None
                if isinstance(props, dict) and "magnitude_apparent" in props:
                    try:
                        magnitude = float(props["magnitude_apparent"])
                    except (TypeError, ValueError):
                        magnitude = None
                rows.append(
                    {
                        "_id": int(entity_id),
                        "ent_id": ent_id,
                        "entity_type": entity_type,
                        "category": str(category) if category is not None else None,
                        "kind": str(entity_type) if entity_type is not None else None,
                        "name": name,
                        "aliases": list(aliases or []),
                        "magnitude": magnitude,
                    }
                )
    return rows


def ensure_index(client) -> None:
    if not client.indices.exists(index=INDEX_NAME):
        client.indices.create(
            index=INDEX_NAME,
            mappings=INDEX_MAPPING,
            settings={"number_of_shards": 1, "number_of_replicas": 0},
        )
        log.info("created index %s", INDEX_NAME)


def bulk_index(es_url: str, rows: Sequence[dict]) -> int:
    from elasticsearch import Elasticsearch, helpers

    client = Elasticsearch(es_url)
    ensure_index(client)

    def actions() -> Iterable[dict]:
        for r in rows:
            yield {
                "_op_type": "index",
                "_index": INDEX_NAME,
                "_id": r["_id"],
                "_source": {
                    "ent_id": r["ent_id"],
                    "name": {"input": [r["name"], *r["aliases"]]},
                    "aliases": {"input": r["aliases"]} if r["aliases"] else None,
                    "category": r["category"],
                    "kind": r["kind"],
                    "magnitude": r["magnitude"],
                },
            }

    success, errors = helpers.bulk(client, actions(), refresh=True)
    if errors:
        log.warning("bulk index returned errors: %s", errors)
    return success


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Bulk-index seeded entities into ES")
    parser.add_argument("--db-url", default=os.environ.get("DATABASE_URL"))
    parser.add_argument(
        "--es-url", default=os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args(argv)
    logging.basicConfig(
        level=args.log_level, format="%(asctime)s %(levelname)s %(name)s — %(message)s"
    )

    if not args.db_url:
        log.error("--db-url or $DATABASE_URL required")
        return 2
    rows = fetch_records(args.db_url)
    log.info("fetched %d ts-catalog rows from Postgres", len(rows))
    if args.dry_run:
        log.info("dry-run — no ES writes")
        return 0
    indexed = bulk_index(args.es_url, rows)
    log.info("indexed %d documents into %s", indexed, INDEX_NAME)
    return 0


if __name__ == "__main__":
    sys.exit(main())
