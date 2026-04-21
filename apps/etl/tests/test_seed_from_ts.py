"""Unit tests for `cosmos_etl.seed.from_ts_catalog` partition + reporting.

Pure-function coverage; the live `upsert_postgres` path is exercised by
the Phase C verify block (viz.md §2 Phase C C.2/C.3) against a real DB.
"""
from __future__ import annotations

import json
from pathlib import Path

from cosmos_etl.seed import from_ts_catalog as seed


def test_partition_separates_positionless_records() -> None:
    records = [
        {"ent_id": "GAL-1", "name": "g", "ra_deg": 10.0, "dec_deg": 30.0, "category_name": "Galaxies"},
        {"ent_id": "NAIF-10", "name": "Sun", "ra_deg": None, "dec_deg": None, "category_name": "Stars"},
        {"ent_id": "BAD-RA", "name": "x", "ra_deg": 360.0, "dec_deg": 0.0, "category_name": "Stars"},
        {"ent_id": "BAD-DEC", "name": "y", "ra_deg": 10.0, "dec_deg": 100.0, "category_name": "Stars"},
        {"ent_id": "OK", "name": "z", "ra_deg": 0.0, "dec_deg": -90.0, "category_name": "Galaxies"},
    ]
    loadable, skipped = seed.partition(records)
    assert {r["ent_id"] for r in loadable} == {"GAL-1", "OK"}
    assert {r["ent_id"] for r in skipped} == {"NAIF-10", "BAD-RA", "BAD-DEC"}


def test_category_counts_aggregates() -> None:
    records = [
        {"category_name": "Galaxies"},
        {"category_name": "Galaxies"},
        {"category_name": "Stars"},
        {"category_name": "Nebulae"},
    ]
    counts = seed.category_counts(records)
    assert counts == {"Galaxies": 2, "Stars": 1, "Nebulae": 1}


def test_load_records_validates_array(tmp_path: Path) -> None:
    p = tmp_path / "bad.json"
    p.write_text(json.dumps({"not": "an array"}))
    try:
        seed.load_records(p)
    except ValueError as e:
        assert "JSON array" in str(e)
    else:
        raise AssertionError("expected ValueError")


def test_load_records_missing_path(tmp_path: Path) -> None:
    try:
        seed.load_records(tmp_path / "nope.json")
    except FileNotFoundError as e:
        assert "pnpm seed:export" in str(e)
    else:
        raise AssertionError("expected FileNotFoundError")


def test_dry_run_main_does_not_touch_db(tmp_path: Path) -> None:
    fixture = [
        {
            "ent_id": "GAL-1",
            "name": "Test Galaxy",
            "entity_type": 6011,
            "category": 6,
            "category_name": "Galaxies",
            "ra_deg": 10.0,
            "dec_deg": 30.0,
            "distance_pc": 1000.0,
            "magnitude": 9.0,
            "aliases": ["TG"],
            "catalog_ids": {"client_seed": "g1"},
            "data_source": "ts-catalog",
        }
    ]
    seed_path = tmp_path / "entities.json"
    seed_path.write_text(json.dumps(fixture))
    rc = seed.main(["--json", str(seed_path), "--dry-run", "--log-level", "WARNING"])
    assert rc == 0
