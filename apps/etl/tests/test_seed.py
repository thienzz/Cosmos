"""T-C-02 — integration tests for the seed ingester.

Run standalone (hits the live docker-compose Postgres):
    pytest apps/etl/tests/test_seed.py

Tests are skipped automatically when no reachable Postgres is on
`DATABASE_URL` (keeps CI stages that don't bring up the compose stack
from failing).
"""
from __future__ import annotations

import os
import socket
from pathlib import Path

import pytest

from cosmos_etl.seed.from_ts_catalog import _default_seed_path, ingest


def _postgres_reachable() -> bool:
    url = os.environ.get(
        "DATABASE_URL", "postgresql://cosmos:cosmos_dev@localhost:5432/cosmos"
    )
    # Crude host:port probe so we don't pull psycopg2 into test collection.
    try:
        from urllib.parse import urlparse

        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except OSError:
        return False


pytestmark = pytest.mark.skipif(
    not _postgres_reachable(),
    reason="Postgres not reachable on DATABASE_URL — run `docker compose up -d postgres`.",
)


def test_seed_json_exists_and_has_rows() -> None:
    path = _default_seed_path()
    assert path.exists(), f"run `pnpm seed:export` first; missing {path}"
    assert path.stat().st_size > 1000


def test_ingest_is_idempotent() -> None:
    """Two consecutive ingest runs must converge on the same counts."""
    first = ingest()
    second = ingest()
    assert first["errors"] == 0
    assert second["errors"] == 0
    # Same record set → same category counts.
    for key in first:
        assert first[key] == second[key], f"{key} drifted: {first[key]} -> {second[key]}"


def test_ingest_populates_solar_system_sidecar() -> None:
    """Verify the solar_system_bodies table gets populated."""
    import psycopg2

    url = os.environ.get(
        "DATABASE_URL", "postgresql://cosmos:cosmos_dev@localhost:5432/cosmos"
    )
    ingest()
    with psycopg2.connect(url) as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM solar_system_bodies WHERE body_type='planet'")
        (planet_count,) = cur.fetchone()
        cur.execute("SELECT count(*) FROM solar_system_bodies WHERE naif_id=399")
        (earth_count,) = cur.fetchone()
    assert planet_count >= 8, f"expected ≥ 8 planets (got {planet_count})"
    assert earth_count == 1, "Earth (NAIF 399) must be present exactly once"
