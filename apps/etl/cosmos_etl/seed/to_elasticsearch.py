"""T-C-03 — bulk-index seeded entities into Elasticsearch.

Reads `entities` + `cross_identifications(catalog='client_ent_id')` out of
Postgres, transforms each row into an autocomplete document, and ships
them to Elasticsearch via the _bulk API.

The target index is `entities_autocomplete` with the mapping declared in
`apps/api/src/es/schemas/entities_autocomplete.ts`. If the index is
missing we create it inline so this script can bootstrap a clean
environment without the Node companion.

Run:
    python -m cosmos_etl.seed.to_elasticsearch
"""
from __future__ import annotations

import logging
import os
import sys
from typing import Any, Iterator

import psycopg2
import psycopg2.extras
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

log = logging.getLogger("cosmos_etl.seed.to_elasticsearch")

DEFAULT_DATABASE_URL = "postgresql://cosmos:cosmos_dev@localhost:5432/cosmos"
DEFAULT_ES_URL = "http://localhost:9200"
INDEX = "entities_autocomplete"

_INDEX_MAPPING: dict[str, Any] = {
    "settings": {"number_of_shards": 1, "number_of_replicas": 0},
    "mappings": {
        "properties": {
            "ent_id": {"type": "keyword"},
            "name": {
                "type": "completion",
                "analyzer": "simple",
                "preserve_separators": True,
                "preserve_position_increments": True,
                "max_input_length": 50,
            },
            "aliases": {"type": "completion", "analyzer": "simple"},
            "category": {"type": "keyword"},
            "kind": {"type": "keyword"},
            "magnitude": {"type": "float"},
            "distance_pc": {"type": "double"},
            "ra_deg": {"type": "double"},
            "dec_deg": {"type": "double"},
        }
    },
}


def _ensure_index(es: Elasticsearch) -> None:
    if es.indices.exists(index=INDEX):
        return
    log.info("creating index %s", INDEX)
    es.indices.create(index=INDEX, **_INDEX_MAPPING)


def _load_docs(conn: psycopg2.extensions.connection) -> Iterator[dict[str, Any]]:
    """Yield one ES _bulk action + doc pair per entity row.

    Uses the external_id from cross_identifications as the ES _id so the
    doc id matches what the client passes in.
    """
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT
                e.id                                 AS entity_id,
                e.ent_id                             AS ent_id,
                e.entity_type                        AS entity_type,
                e.category                           AS category,
                e.name                               AS name,
                COALESCE(e.aliases, '{}'::text[])    AS aliases,
                e.ra                                 AS ra_deg,
                e.dec_coord                          AS dec_deg,
                e.distance_pc                        AS distance_pc,
                NULLIF((e.properties->>'magnitude_apparent')::float8, 'NaN'::float8) AS magnitude,
                xid.catalog_ref                      AS external_id
            FROM entities e
            LEFT JOIN cross_identifications xid
              ON xid.entity_id = e.id AND xid.catalog = 'client_ent_id'
            """
        )
        for row in cur:
            external_id = row["external_id"] or f"E-{row['entity_id']}"
            doc: dict[str, Any] = {
                "_op_type": "index",
                "_index": INDEX,
                "_id": external_id,
                "_source": {
                    "ent_id": external_id,
                    "name": {"input": [row["name"], *row["aliases"]]},
                    "aliases": {"input": row["aliases"]} if row["aliases"] else {"input": []},
                    "category": str(row["category"]),
                    "kind": str(row["entity_type"]),
                    "magnitude": row["magnitude"],
                    "distance_pc": row["distance_pc"],
                    "ra_deg": row["ra_deg"],
                    "dec_deg": row["dec_deg"],
                },
            }
            yield doc


def reindex() -> dict[str, int]:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    es = Elasticsearch(os.environ.get("ELASTICSEARCH_URL", DEFAULT_ES_URL))
    _ensure_index(es)
    conn = psycopg2.connect(os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL))
    try:
        success, errors_list = bulk(es, _load_docs(conn), raise_on_error=False)
    finally:
        conn.close()
    errors = 0 if isinstance(errors_list, int) else len(errors_list)
    es.indices.refresh(index=INDEX)
    count = es.count(index=INDEX)["count"]
    summary = {"indexed": success, "errors": errors, "total_in_index": count}
    log.info("reindex summary: %s", summary)
    return summary


def main() -> int:
    summary = reindex()
    return 0 if summary["errors"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
