"""Unit tests for cosmos_etl.downloaders.gaia_dr3 (T-D-01).

No network: we only validate the ADQL builder + chunk-complete sentinel
(the actual download runs against the Gaia archive and is covered by the
Phase D verify block).
"""
from __future__ import annotations

from pathlib import Path

from cosmos_etl.downloaders import gaia_dr3


def test_chunk_filename_is_stable() -> None:
    assert gaia_dr3.chunk_filename(0, 10) == "dr3_bright_mag10_band000.csv"
    assert gaia_dr3.chunk_filename(47, 10.0) == "dr3_bright_mag10_band047.csv"
    assert gaia_dr3.chunk_filename(3, 12.5) == "dr3_bright_mag12.5_band003.csv"


def test_build_adql_filters_and_pagination() -> None:
    q = gaia_dr3.build_adql(band=0, magnitude_max=10)
    assert "phot_g_mean_mag <= 10" in q
    assert "parallax > 0" in q
    assert "parallax_error / parallax < 0.2" in q
    assert "BETWEEN 0 AND 1023" in q
    assert "SELECT source_id, ra, dec" in q


def test_build_adql_uses_top_when_limit_passed() -> None:
    q = gaia_dr3.build_adql(band=5, magnitude_max=6, limit=100)
    assert "SELECT TOP 100 " in q
    # Band 5 is pixels 5120..6143.
    assert "BETWEEN 5120 AND 6143" in q


def test_chunk_is_complete_detects_missing(tmp_path: Path) -> None:
    assert gaia_dr3.chunk_is_complete(tmp_path / "nope.csv") is False


def test_chunk_is_complete_detects_header(tmp_path: Path) -> None:
    good = tmp_path / "good.csv"
    good.write_text("source_id,ra,dec,parallax\n1234,10.0,-30.0,5.0\n", encoding="utf-8")
    assert gaia_dr3.chunk_is_complete(good)


def test_chunk_is_complete_rejects_wrong_header(tmp_path: Path) -> None:
    bad = tmp_path / "bad.csv"
    bad.write_text("nope,nope\n", encoding="utf-8")
    assert gaia_dr3.chunk_is_complete(bad) is False


def test_band_count_matches_healpix_order_6() -> None:
    # 48 bands × 1024 pixels = 49152 = 12 × 4096 = HEALPix order 6 pixel count.
    assert gaia_dr3.BAND_COUNT * gaia_dr3.BAND_SIZE == 49_152
