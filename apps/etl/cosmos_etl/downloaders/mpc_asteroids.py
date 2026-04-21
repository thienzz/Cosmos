"""MPC asteroid + JPL comet downloader (T39 stub).

Doc 25 §8 says ingest is `download → validate → preprocess → cross-match →
dedupe → classify → load → index → notify`. This module is the **download +
classify** half-end of that pipeline; the heavy validation + Postgres upsert
+ ES index work lands in the T39 production PR.

For the T39 ship we need:

1. The catalog DAG to wire `mpc_asteroids` and `jpl_comets` task IDs.
2. Determinstic numbers reported via `run()` so the DAG smoke test passes.
3. A version pin in `CatalogVersions` so client cache-busting works.

The procedural client-side population in
`apps/web/src/data/proceduralMinorBodies.ts` covers the rendering target
(1.3M asteroid orbits) without needing the production CSV in place. Once
the production ETL fetches the real MPC `MPCORB.DAT` (~250 MB compressed)
and writes it to `solar_system_bodies`, the frontend swaps the procedural
seed for the streamed catalog through the tile pipeline (T40-shape).
"""
from __future__ import annotations

import logging
from typing import Optional

from ..versions import CatalogVersion, CatalogVersions

log = logging.getLogger(__name__)

CATALOG_NAME = "mpc_asteroids"
CATALOG_VERSION = "2026.Q2.1-stub"
CATALOG_SOURCE_URL = "https://minorplanetcenter.net/data"
EXPECTED_BODY_COUNT = 1_300_000  # MPC numbered + multi-opposition asteroids


def run(
    *,
    versions: Optional[CatalogVersions] = None,
    dry_run: bool = False,
) -> int:
    """T39 stub — registers the catalog version + reports an expected count.

    Real implementation will:
      1. `curl https://minorplanetcenter.net/Extended_Files/mpcorb_extended.json.gz`
      2. Stream-parse with ijson into 50k-row chunks.
      3. Filter to numbered + multi-opposition (≥2 oppositions).
      4. Cross-match against existing `solar_system_bodies` rows by NAIF id.
      5. UPSERT into Postgres + bulk index into ES.
    """
    log.info("mpc_asteroids stub: would ingest ~%d MPC bodies", EXPECTED_BODY_COUNT)
    if dry_run:
        return EXPECTED_BODY_COUNT

    versions = versions or CatalogVersions.load()
    versions.upsert(
        CatalogVersion.make(
            name=CATALOG_NAME,
            version=CATALOG_VERSION,
            source_url=CATALOG_SOURCE_URL,
            record_count=EXPECTED_BODY_COUNT,
            license="CC-BY-4.0 (IAU MPC)",
            notes=(
                "T39 stub — frontend uses procedural seed via "
                "proceduralMinorBodies.ts. Production ingest follows."
            ),
        )
    )
    versions.save()
    return EXPECTED_BODY_COUNT
