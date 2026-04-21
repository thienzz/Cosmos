"""JPL comets downloader (T39 stub).

Mirror of `mpc_asteroids.py` for the JPL Small-Body Database comet
catalog (~4,600 entries per Doc 23 §8.9). Same staged approach: register
catalog version + expected count now, real ETL lands in T39 follow-on.
"""
from __future__ import annotations

import logging
from typing import Optional

from ..versions import CatalogVersion, CatalogVersions

log = logging.getLogger(__name__)

CATALOG_NAME = "jpl_comets"
CATALOG_VERSION = "2026.Q2.1-stub"
CATALOG_SOURCE_URL = "https://ssd-api.jpl.nasa.gov/sbdb_query.api"
EXPECTED_BODY_COUNT = 4_600


def run(
    *,
    versions: Optional[CatalogVersions] = None,
    dry_run: bool = False,
) -> int:
    log.info("jpl_comets stub: would ingest ~%d JPL comets", EXPECTED_BODY_COUNT)
    if dry_run:
        return EXPECTED_BODY_COUNT
    versions = versions or CatalogVersions.load()
    versions.upsert(
        CatalogVersion.make(
            name=CATALOG_NAME,
            version=CATALOG_VERSION,
            source_url=CATALOG_SOURCE_URL,
            record_count=EXPECTED_BODY_COUNT,
            license="NASA/JPL public domain",
            notes="T39 stub — frontend uses procedural comet seed.",
        )
    )
    versions.save()
    return EXPECTED_BODY_COUNT
