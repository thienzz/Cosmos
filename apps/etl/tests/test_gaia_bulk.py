"""T-D-05 — bulk loader unit + live integration."""
from __future__ import annotations

import csv
import os
import socket
import tempfile
from pathlib import Path

import pytest

from cosmos_etl.loaders.gaia_bulk import _rows_for_copy, healpix_pixel, load_file


def _postgres_reachable() -> bool:
    from urllib.parse import urlparse

    url = os.environ.get(
        "DATABASE_URL", "postgresql://cosmos:cosmos_dev@localhost:5432/cosmos"
    )
    try:
        parsed = urlparse(url)
        with socket.create_connection((parsed.hostname, parsed.port or 5432), timeout=0.5):
            return True
    except OSError:
        return False


def _sirius_row() -> dict[str, str]:
    """Gaia-shaped row for Sirius (source_id 2947050466531473792).

    Column names match the CSV the T-D-01 downloader produces.
    """
    return {
        "source_id": "2947050466531473792",
        "ra": "101.2875",
        "dec": "-16.7161",
        "pmra": "-546.01",
        "pmdec": "-1223.08",
        "parallax": "379.21",
        "parallax_error": "1.58",
        "phot_g_mean_mag": "-1.46",
        "bp_rp": "0.009",
    }


def test_healpix_pixel_is_within_total_sphere() -> None:
    # Order 6 → 12 * 4^6 = 49,152 pixels.
    pix = healpix_pixel(101.2875, -16.7161)
    assert 0 <= pix < 12 * 4**6


def test_healpix_pixel_varies_with_direction() -> None:
    p1 = healpix_pixel(0.0, 0.0)
    p2 = healpix_pixel(180.0, 45.0)
    assert p1 != p2


def test_rows_for_copy_emits_csv_row_per_valid_record() -> None:
    csv_text, stats = _rows_for_copy([_sirius_row()])
    assert stats == {"rows": 1, "errors": 0}
    # Basic CSV sanity — first column must be the source_id.
    first_col = csv_text.split(",", 1)[0]
    assert first_col == "2947050466531473792"


def test_rows_for_copy_skips_bad_parallax() -> None:
    bad = _sirius_row()
    bad["parallax"] = "-1.0"  # invalid
    csv_text, stats = _rows_for_copy([bad, _sirius_row()])
    assert stats == {"rows": 1, "errors": 1}
    assert csv_text.count("\n") == 1  # only the valid row


@pytest.mark.skipif(
    not _postgres_reachable(),
    reason="Postgres not reachable on DATABASE_URL",
)
def test_load_file_roundtrip() -> None:
    """End-to-end: write one Sirius row to a CSV, load it, verify entities + stars rows appear."""
    import psycopg2

    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "dr3_chunk_9999.csv"
        with path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(
                fh,
                fieldnames=[
                    "source_id", "ra", "dec", "pmra", "pmdec",
                    "parallax", "parallax_error", "phot_g_mean_mag", "bp_rp",
                ],
            )
            writer.writeheader()
            writer.writerow(_sirius_row())

        url = os.environ.get(
            "DATABASE_URL", "postgresql://cosmos:cosmos_dev@localhost:5432/cosmos"
        )
        conn = psycopg2.connect(url)
        try:
            stats = load_file(path, conn)
        finally:
            conn.close()

        assert stats["rows"] == 1, stats
        assert stats["errors"] == 0

        conn = psycopg2.connect(url)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM entities WHERE (catalog_ids->>'gaia_source_id')::BIGINT = %s",
                    (2947050466531473792,),
                )
                rows = cur.fetchall()
                assert len(rows) == 1, f"expected 1 entity, got {rows}"
                (entity_id,) = rows[0]

                cur.execute(
                    "SELECT mag_g, healpix_order6 FROM stars WHERE source_id_gaia = %s",
                    (2947050466531473792,),
                )
                stars = cur.fetchall()
                assert len(stars) == 1
                (mag_g, pix) = stars[0]
                assert abs(mag_g - (-1.46)) < 1e-3
                assert pix >= 0
                # Clean up our test row so subsequent runs start clean.
                cur.execute(
                    "DELETE FROM stars WHERE source_id_gaia = %s",
                    (2947050466531473792,),
                )
                cur.execute(
                    "DELETE FROM cross_identifications "
                    "WHERE catalog='client_ent_id' AND catalog_ref = 'GAIA-2947050466531473792'",
                )
                cur.execute("DELETE FROM entities WHERE id = %s", (entity_id,))
            conn.commit()
        finally:
            conn.close()
