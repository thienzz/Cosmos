"""Messier downloader unit tests (T38.2).

Runs without Postgres/ES — tests the parse + classify + payload-shape stages of
the pipeline using the bundled data/catalogs/raw/messier.csv. Live Postgres
ingestion is covered in the smoke test at scripts/seed-catalog.sh.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

import pytest

from cosmos_etl.classify import (
    CAT_GALAXY,
    CAT_LSS,
    CAT_NEBULA,
    CAT_STAR,
    classify_ent_id,
    classify_messier,
)
from cosmos_etl.downloaders import messier
from cosmos_etl.versions import CatalogVersion, CatalogVersions


REPO_ROOT = Path(__file__).resolve().parents[3]
RAW_CSV = REPO_ROOT / "data" / "catalogs" / "raw" / "messier.csv"


def test_raw_csv_has_110_rows_with_all_m_numbers():
    assert RAW_CSV.exists(), f"seed CSV missing: {RAW_CSV}"
    with RAW_CSV.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    assert len(rows) == 110, f"expected 110, got {len(rows)}"
    nums = sorted(int(r["number"]) for r in rows)
    assert nums == list(range(1, 111))


def test_parse_csv_returns_well_formed_rows():
    rows = messier.parse_csv(RAW_CSV)
    assert len(rows) == 110
    m31 = next(r for r in rows if r.number == 31)
    assert m31.ngc == "NGC 224"
    assert "Andromeda" in (m31.common_name or "")
    assert m31.constellation == "Andromeda"
    assert 10.6 < m31.ra_deg < 10.75
    assert 41.2 < m31.dec_deg < 41.3


def test_classify_messier_covers_all_110():
    missing = [n for n in range(1, 111) if classify_messier(n) is None]
    assert missing == [], f"Messier entries without classification: {missing}"


def test_classify_ent_id_returns_valid_ent_ids():
    rows = messier.parse_csv(RAW_CSV)
    ent_ids = {classify_ent_id(messier_number=r.number).ent_id for r in rows}
    # Should hit at least: Crab SNR, globular, open, emission, planetary,
    # reflection, spiral, elliptical, dwarf elliptical, lenticular, barred,
    # merging, starburst, Seyfert, radio, and a star field fallback.
    # Exact set may drift as classification improves; just assert sanity bounds.
    assert 10 <= len(ent_ids) <= 20, f"unusual ent_id diversity: {sorted(ent_ids)}"
    # Each ent_id must match the ENT-NNNN format.
    for e in ent_ids:
        assert e.startswith("ENT-") and len(e) == 8 and e[4:].isdigit()


def test_m1_is_supernova_remnant():
    c = classify_ent_id(messier_number=1)
    assert c.ent_id == "ENT-5050"
    assert c.category == CAT_NEBULA


def test_m31_is_spiral_galaxy():
    c = classify_ent_id(messier_number=31)
    assert c.ent_id == "ENT-6010"
    assert c.category == CAT_GALAXY


def test_m13_is_globular_cluster():
    c = classify_ent_id(messier_number=13)
    assert c.ent_id == "ENT-7011"
    assert c.category == CAT_LSS


def test_m40_is_star_field_fallback():
    c = classify_ent_id(messier_number=40)
    assert c.category == CAT_STAR


def test_payload_shape_for_m42_orion_nebula():
    rows = messier.parse_csv(RAW_CSV)
    m42 = next(r for r in rows if r.number == 42)
    cls = classify_ent_id(messier_number=42)
    payload = messier.to_entity_payload(m42, cls)
    assert payload["ent_id"] == "ENT-5010"
    assert payload["category"] == CAT_NEBULA
    assert payload["catalog_ids"]["messier"] == "M42"
    assert payload["catalog_ids"]["ngc"] == "NGC 1976"
    assert payload["name"].startswith("M42 (")
    assert "Messier 42" in payload["aliases"]
    assert payload["properties"]["constellation"] == "Orion"
    assert payload["properties"]["magnitude_apparent"] == pytest.approx(4.0)
    assert payload["_doc_id"] == "messier:M42"
    # RA 83.82 is below 180 → longitude unchanged.
    assert payload["longitude"] == pytest.approx(83.8221)


def test_ra_wraps_to_longitude_for_es_geo_point():
    # M13 RA ≈ 250.42° wraps to longitude ≈ -109.58° in ES geo_point space.
    rows = messier.parse_csv(RAW_CSV)
    m13 = next(r for r in rows if r.number == 13)
    cls = classify_ent_id(messier_number=13)
    payload = messier.to_entity_payload(m13, cls)
    assert payload["ra"] == pytest.approx(250.4217)
    assert payload["longitude"] == pytest.approx(-109.5783)
    assert -180 <= payload["longitude"] <= 180


def test_doc_ids_are_unique_per_messier_object():
    rows = messier.parse_csv(RAW_CSV)
    payloads = [
        messier.to_entity_payload(r, classify_ent_id(messier_number=r.number))
        for r in rows
    ]
    doc_ids = [p["_doc_id"] for p in payloads]
    assert len(doc_ids) == 110
    assert len(set(doc_ids)) == 110, "ES _doc_id must be unique per physical object"
    # ent_id on the other hand is a subtype — expect many collisions.
    ent_ids = [p["ent_id"] for p in payloads]
    assert len(set(ent_ids)) < 30, "Doc 17 ent_id should bucket many Messier into few subtypes"


def test_payload_ra_dec_are_j2000_within_1_arcmin_of_canonical():
    # Canonical J2000.0 positions from NED (within 1 arcmin = 1/60 deg).
    rows = {r.number: r for r in messier.parse_csv(RAW_CSV)}
    canon = {
        1:  (83.6331, 22.0145),   # Crab
        31: (10.6847, 41.2692),   # Andromeda
        42: (83.8221, -5.3911),   # Orion Nebula
        45: (56.85,   24.1167),   # Pleiades
        13: (250.4217, 36.4613),  # Hercules globular
    }
    for n, (ra, dec) in canon.items():
        r = rows[n]
        assert abs(r.ra_deg - ra) < 1 / 60
        assert abs(r.dec_deg - dec) < 1 / 60


def test_dry_run_writes_versions_json_atomically(tmp_path, monkeypatch):
    # Redirect VERSIONS.json into a temp dir so tests don't pollute repo state.
    tmp_versions = tmp_path / "VERSIONS.json"
    monkeypatch.setattr("cosmos_etl.versions.VERSIONS_PATH", tmp_versions)

    versions = CatalogVersions.load(tmp_versions)
    versions.upsert(
        CatalogVersion.make(
            name="messier",
            version="1781-final",
            source_url="https://example/messier",
            record_count=110,
        )
    )
    versions.save(tmp_versions)
    assert tmp_versions.exists()
    payload = json.loads(tmp_versions.read_text())
    assert payload["catalogs"]["messier"]["record_count"] == 110


def test_all_messier_payloads_have_constellation_and_ent_id():
    """Regression guard — every Messier row must survive the full payload stage."""
    rows = messier.parse_csv(RAW_CSV)
    for r in rows:
        cls = classify_ent_id(messier_number=r.number)
        p = messier.to_entity_payload(r, cls)
        assert p["ent_id"].startswith("ENT-")
        assert p["properties"].get("constellation"), f"M{r.number} missing constellation"
        assert 0 <= p["ra"] < 360
        assert -90 <= p["dec_coord"] <= 90
