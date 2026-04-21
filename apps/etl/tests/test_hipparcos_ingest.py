"""Hipparcos downloader unit tests (T40 stellar foothold).

Runs without Postgres/ES — exercises parse + classify + payload shape on the
bundled data/catalogs/raw/hipparcos_bright.csv. Live ingest is covered by the
smoke test in `scripts/seed-catalog.sh` after T40 wires the DAG.
"""
from __future__ import annotations

import csv
from pathlib import Path

import pytest

from cosmos_etl.classify import CAT_STAR, classify_star_by_spectral
from cosmos_etl.downloaders import hipparcos


REPO_ROOT = Path(__file__).resolve().parents[3]
RAW_CSV = REPO_ROOT / "data" / "catalogs" / "raw" / "hipparcos_bright.csv"


def test_raw_csv_exists_and_parses():
    assert RAW_CSV.exists(), f"seed CSV missing: {RAW_CSV}"
    with RAW_CSV.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    assert len(rows) >= 50, f"expected at least 50 bright rows, got {len(rows)}"


def test_parse_csv_returns_structured_rows():
    rows = hipparcos.parse_csv(RAW_CSV)
    assert len(rows) >= 50

    # Sirius — Doc 33 §3.1 accuracy spot-check.
    sirius = next(r for r in rows if r.name == "Sirius")
    assert sirius.hip == 32349
    assert abs(sirius.ra_deg - 101.287) < 0.01
    assert abs(sirius.dec_deg - (-16.716)) < 0.01
    assert sirius.hd == 48915
    # Sirius distance ≈ 2.637 pc — inverse parallax.
    assert sirius.distance_pc is not None
    assert 2.5 < sirius.distance_pc < 2.8


def test_distance_pc_is_none_for_missing_parallax():
    row = hipparcos.HipparcosRow(
        hip=0, name=None, bayer=None, ra_deg=0, dec_deg=0,
        parallax_mas=None, pm_ra_mas_yr=None, pm_dec_mas_yr=None,
        mag_v=None, bp_rp=None, spectral_type=None,
        radial_velocity_kms=None, hd=None,
    )
    assert row.distance_pc is None


def test_classify_covers_all_rows_as_stars():
    rows = hipparcos.parse_csv(RAW_CSV)
    classifications = hipparcos.classify_rows(rows)
    for _, cls in classifications:
        assert cls.category == CAT_STAR, f"row classified as non-star: {cls}"
        assert cls.ent_id.startswith("ENT-10"), f"ent_id outside stellar range: {cls.ent_id}"


@pytest.mark.parametrize(
    "spectral,expected_prefix",
    [
        ("G2V", "ENT-1014"),  # Sun-like → G-type main sequence
        ("M1-2Ia-Iab", "ENT-1023"),  # Betelgeuse — RSG
        ("B8Ia", "ENT-1024"),  # Rigel — blue supergiant
        ("A1V", "ENT-1012"),  # Sirius — A-type MS
        ("K1.5III", "ENT-1023"),  # Arcturus — K-giant → RGB/RSG bucket
    ],
)
def test_spectral_classification_maps_to_expected_ent_ids(spectral, expected_prefix):
    cls = classify_star_by_spectral(spectral)
    assert cls.ent_id == expected_prefix, cls


def test_to_entity_payload_shape():
    rows = hipparcos.parse_csv(RAW_CSV)
    sirius = next(r for r in rows if r.name == "Sirius")
    cls = classify_star_by_spectral(sirius.spectral_type)
    payload = hipparcos.to_entity_payload(sirius, cls)

    assert payload["_doc_id"] == "hipparcos:HIP-32349"
    assert payload["ent_id"].startswith("ENT-10")
    assert payload["category"] == CAT_STAR
    assert payload["name"] == "Sirius"
    # Alias set must carry both HIP + HD + Bayer + IAU name
    assert "HIP 32349" in payload["aliases"]
    assert "HD 48915" in payload["aliases"]
    assert "α CMa" in payload["aliases"]
    assert payload["catalog_ids"]["hipparcos"] == 32349
    assert payload["catalog_ids"]["hd"] == 48915
    # Star row matches what the `stars` partition expects
    star_row = payload["star_row"]
    assert star_row["hip"] == 32349
    assert star_row["mag_g"] == -1.46
    assert star_row["spectral_type"] == "A1V"


def test_run_dry_run_without_writes(tmp_path):
    """run(dry_run=True) must touch neither Postgres nor Elasticsearch."""
    from cosmos_etl.versions import CatalogVersions

    # Isolate the catalog-versions registry — the test passes its own instance
    # and writes it to a tmpfile so the bundled VERSIONS.json isn't mutated.
    tmp_versions = tmp_path / "VERSIONS.json"
    versions = CatalogVersions()
    n = hipparcos.run(dry_run=True, versions=versions)
    versions.save(tmp_versions)

    assert n >= 50
    text = tmp_versions.read_text(encoding="utf-8")
    assert "hipparcos_bright" in text
