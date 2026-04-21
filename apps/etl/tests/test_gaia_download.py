"""T-D-01 — downloader unit tests (network-free)."""
from __future__ import annotations

from cosmos_etl.downloaders.gaia_dr3 import _build_adql


def test_adql_has_bright_magnitude_cut() -> None:
    sql = _build_adql(magnitude_max=10.0, chunk_id=0, chunk_count=16, limit=None)
    assert "phot_g_mean_mag < 10.0" in sql
    assert "parallax > 0" in sql
    # Usable-parallax filter (viz.md Appendix A.2).
    assert "parallax_error / parallax < 0.2" in sql


def test_adql_modulo_shards_by_source_id() -> None:
    sql = _build_adql(magnitude_max=10.0, chunk_id=3, chunk_count=16, limit=None)
    assert "MOD(source_id, 16) = 3" in sql


def test_adql_injects_top_n_for_dev_smoke() -> None:
    sql = _build_adql(magnitude_max=4.0, chunk_id=0, chunk_count=2, limit=250)
    assert "TOP 250" in sql
    assert sql.index("TOP 250") < sql.index("FROM")


def test_adql_without_limit_emits_no_top_clause() -> None:
    sql = _build_adql(magnitude_max=10.0, chunk_id=0, chunk_count=16, limit=None)
    assert "TOP" not in sql


def test_adql_selects_the_five_classifier_columns() -> None:
    sql = _build_adql(magnitude_max=10.0, chunk_id=0, chunk_count=16, limit=None)
    for col in ("source_id", "ra", "dec", "pmra", "pmdec", "parallax", "phot_g_mean_mag", "bp_rp"):
        assert col in sql
