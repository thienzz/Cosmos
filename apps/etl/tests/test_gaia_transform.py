"""Unit tests for cosmos_etl.transformers.gaia_to_entities (T-D-02 / T-D-03)."""
from __future__ import annotations

import csv
from pathlib import Path

import pytest

from cosmos_etl.transformers import gaia_to_entities as gx


def _row(**overrides: object) -> gx.GaiaRow:
    base: dict[str, object] = dict(
        source_id=30343944744320,
        ra_deg=45.09,
        dec_deg=0.48,
        pmra_mas_per_yr=19.35,
        pmdec_mas_per_yr=4.01,
        parallax_mas=1.12,
        parallax_error_mas=0.03,
        g_mag=9.899,
        bp_rp=-0.045,
        ref_epoch_jyear=2016.0,
    )
    base.update(overrides)
    return gx.GaiaRow(**base)  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# spectral_class_from_bp_rp
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "bp_rp,expected",
    [
        (-1.0, "O"),
        (-0.31, "O"),
        (-0.2, "B"),
        (0.1, "A"),
        (0.45, "F"),
        (0.75, "G"),
        (1.2, "K"),
        (2.5, "M"),
    ],
)
def test_spectral_class_from_bp_rp(bp_rp: float, expected: str) -> None:
    assert gx.spectral_class_from_bp_rp(bp_rp) == expected


def test_spectral_class_defaults_to_g_for_null() -> None:
    assert gx.spectral_class_from_bp_rp(None) == "G"


# ---------------------------------------------------------------------------
# distance_pc
# ---------------------------------------------------------------------------


def test_distance_pc_basic() -> None:
    # Sirius parallax ≈ 379.2 mas → 2.637 pc
    assert gx.distance_pc(379.2) == pytest.approx(2.637, abs=0.01)


def test_distance_pc_rejects_non_positive() -> None:
    with pytest.raises(ValueError):
        gx.distance_pc(0.0)
    with pytest.raises(ValueError):
        gx.distance_pc(-1.0)


# ---------------------------------------------------------------------------
# healpix_order6
# ---------------------------------------------------------------------------


def test_healpix_order6_zero_for_low_source_ids() -> None:
    assert gx.healpix_order6(100) == 0


def test_healpix_order6_is_in_valid_range() -> None:
    # Pick a mid-archive source id; result must land in [0, 49152).
    sample = 5_000_000_000_000_000_000
    hp = gx.healpix_order6(sample)
    assert 0 <= hp < 49_152


# ---------------------------------------------------------------------------
# apply_proper_motion_to_j2000
# ---------------------------------------------------------------------------


def test_pm_correction_no_motion_is_identity() -> None:
    row = _row(pmra_mas_per_yr=None, pmdec_mas_per_yr=None)
    ra, dec = gx.apply_proper_motion_to_j2000(row)
    assert ra == pytest.approx(row.ra_deg)
    assert dec == pytest.approx(row.dec_deg)


def test_pm_correction_shifts_position_by_delta_years() -> None:
    # 3600 mas/yr for 16 yr → 57.6 arcsec = 0.016 deg at dec=0 (cos=1).
    row = _row(
        ra_deg=100.0,
        dec_deg=0.0,
        pmra_mas_per_yr=3600.0,
        pmdec_mas_per_yr=0.0,
        ref_epoch_jyear=2016.0,
    )
    ra, dec = gx.apply_proper_motion_to_j2000(row)
    # J2000 - J2016 = -16 yr → RA moves BACK by -0.016 deg.
    assert ra == pytest.approx(100.0 - 0.016, abs=1e-5)
    assert dec == pytest.approx(0.0)


def test_pm_correction_barnards_star() -> None:
    """Barnard's Star: the canonical high-PM sanity check.

    SIMBAD values: pmra=-798.58 mas/yr (note: already * cos(dec)), pmdec=10328.12.
    Gaia DR3 reports ra≈269.448502 dec=+4.668288 at J2016. Expect
    the J2000 position to be ~0.046 deg further south in dec and
    ~0.004 deg lower in RA (after cos-dec correction).
    """
    row = _row(
        source_id=4472832130942575872,
        ra_deg=269.448502,
        dec_deg=4.668288,
        pmra_mas_per_yr=-798.58,
        pmdec_mas_per_yr=10328.12,
        parallax_mas=547.45,
        parallax_error_mas=0.29,
        g_mag=8.19,
        bp_rp=2.01,
        ref_epoch_jyear=2016.0,
    )
    ra_j2000, dec_j2000 = gx.apply_proper_motion_to_j2000(row)
    # dec at J2000 ≈ dec_j2016 - 10328 mas/yr * 16 yr = dec - 0.0459°.
    assert dec_j2000 == pytest.approx(row.dec_deg - 0.04590, abs=1e-4)
    # ra moves via +pmra * delta_t / cos_dec where delta_t=-16yr.
    import math as _m
    cos_dec = _m.cos(_m.radians(row.dec_deg))
    expected_ra = row.ra_deg + (-798.58 * -16.0 / (3600.0 * 1000.0)) / cos_dec
    assert ra_j2000 == pytest.approx(expected_ra, abs=1e-4)


def test_pm_correction_wraps_ra_at_360() -> None:
    row = _row(
        ra_deg=359.999,
        dec_deg=0.0,
        pmra_mas_per_yr=3_600_000.0,  # 3600 arcsec/yr — contrived
        pmdec_mas_per_yr=0.0,
    )
    ra, _ = gx.apply_proper_motion_to_j2000(row)
    assert 0.0 <= ra < 360.0


# ---------------------------------------------------------------------------
# gaia_row_to_entity
# ---------------------------------------------------------------------------


def test_gaia_row_to_entity_populates_all_fields() -> None:
    row = _row()
    ent = gx.gaia_row_to_entity(row)
    assert ent.ent_id == "ENT-1000"
    assert ent.category == 1
    assert ent.entity_type == 1000
    assert ent.name == f"Gaia DR3 {row.source_id}"
    assert ent.catalog_ids == {"gaia_dr3": row.source_id}
    assert ent.distance_pc == pytest.approx(1000.0 / row.parallax_mas)
    assert ent.properties["spectral_class"] == "B"  # bp_rp=-0.045 → B bucket
    assert ent.properties["magnitude_apparent"] == pytest.approx(row.g_mag)
    assert ent.healpix_order6 == row.source_id // 2**47


# ---------------------------------------------------------------------------
# iter_entities_from_csv
# ---------------------------------------------------------------------------


def test_iter_entities_from_csv(tmp_path: Path) -> None:
    csv_path = tmp_path / "mini.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as fp:
        writer = csv.DictWriter(
            fp,
            fieldnames=[
                "source_id",
                "ra",
                "dec",
                "pmra",
                "pmdec",
                "parallax",
                "parallax_error",
                "phot_g_mean_mag",
                "bp_rp",
                "ref_epoch",
            ],
        )
        writer.writeheader()
        writer.writerow(
            {
                "source_id": "12345",
                "ra": "10.0",
                "dec": "30.0",
                "pmra": "1.0",
                "pmdec": "2.0",
                "parallax": "5.0",
                "parallax_error": "0.1",
                "phot_g_mean_mag": "6.5",
                "bp_rp": "0.5",
                "ref_epoch": "2016.0",
            }
        )
        writer.writerow(
            {
                "source_id": "67890",
                "ra": "20.0",
                "dec": "-15.0",
                "pmra": "",
                "pmdec": "",
                "parallax": "10.0",
                "parallax_error": "0.2",
                "phot_g_mean_mag": "8.0",
                "bp_rp": "1.0",
                "ref_epoch": "2016.0",
            }
        )
    entities = list(gx.iter_entities_from_csv(csv_path))
    assert len(entities) == 2
    assert entities[0].name == "Gaia DR3 12345"
    assert entities[1].catalog_ids["gaia_dr3"] == 67890


def test_iter_entities_from_csv_skips_malformed(tmp_path: Path) -> None:
    csv_path = tmp_path / "bad.csv"
    csv_path.write_text(
        "source_id,ra,dec,pmra,pmdec,parallax,parallax_error,phot_g_mean_mag,bp_rp,ref_epoch\n"
        "bogus,10.0,0,0,0,1.0,0.1,8.0,0.5,2016.0\n"
        "12345,10.0,0,0,0,5.0,0.1,7.0,0.5,2016.0\n",
        encoding="utf-8",
    )
    entities = list(gx.iter_entities_from_csv(csv_path))
    assert [e.catalog_ids["gaia_dr3"] for e in entities] == [12345]
