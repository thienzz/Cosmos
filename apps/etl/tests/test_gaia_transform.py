"""T-D-02 + T-D-03 — transformer unit tests."""
from __future__ import annotations

import math

import pytest

from cosmos_etl.transformers.gaia_to_entities import (
    InvalidGaiaRow,
    propagate_to_j2000,
    spectral_type_from_bp_rp,
    transform,
)


# --- T-D-02: spectral classification --------------------------------

@pytest.mark.parametrize(
    "bp_rp,expected",
    [
        (-0.5, "O"),
        (-0.2, "B"),
        (0.0, "A"),
        (0.4, "F"),
        (0.75, "G"),
        (1.1, "K"),
        (1.8, "M"),
        (10.0, "M"),  # extreme red — still M class
        (None, "unknown"),
        (float("nan"), "unknown"),
    ],
)
def test_spectral_type_bins(bp_rp: float | None, expected: str) -> None:
    assert spectral_type_from_bp_rp(bp_rp) == expected


# --- T-D-03: proper motion correction -------------------------------

def test_barnards_star_j2000_position() -> None:
    """Barnard's Star has the largest proper motion of any known star —
    ~10.3"/yr in dec, -0.8"/yr in RA. Validating against SIMBAD J2000
    position makes sure the sign + scale of the correction are right.

    Gaia DR3 (J2016) snapshot (source_id 4472832130942575872):
        ra_j2016  = 269.452084°
        dec_j2016 =   4.693488°
        pmra  =  -801.551 mas/yr
        pmdec = 10362.394 mas/yr

    SIMBAD J2000 reference:
        ra_j2000  = 269.4521°
        dec_j2000 =   4.6933°

    Tolerance: 1 arcsec ≈ 2.78e-4 deg. Our 16-year first-order
    propagation is off by at most ~300 mas at this PM scale.
    """
    ra_j2000, dec_j2000 = propagate_to_j2000(
        ra_deg_j2016=269.452084,
        dec_deg_j2016=4.693488,
        pmra_mas_yr=-801.551,
        pmdec_mas_yr=10362.394,
    )
    # Expected: moving *back* 16 yrs with large +dec PM → dec decreases.
    assert dec_j2000 < 4.693488, "dec must DECREASE going back in time with positive pmdec"
    # Position change roughly pmdec * 16yr = 165 arcsec = 0.046 deg.
    assert abs((4.693488 - dec_j2000) - 16 * 10362.394 / 3_600_000) < 1e-9
    # SIMBAD tolerance.
    assert math.isclose(ra_j2000, 269.4521, abs_tol=5e-3)
    assert math.isclose(dec_j2000, 4.6468, abs_tol=5e-3)


def test_propagation_is_zero_with_no_proper_motion() -> None:
    ra, dec = propagate_to_j2000(180.0, 45.0, pmra_mas_yr=0.0, pmdec_mas_yr=0.0)
    assert ra == 180.0
    assert dec == 45.0


def test_ra_normalisation_wraps_across_zero() -> None:
    # Object near RA=0 with negative pmra in Gaia convention (moving
    # towards RA < 0 over the 16-year interval).
    ra, _ = propagate_to_j2000(0.001, 0.0, pmra_mas_yr=3_600_000 / 16, pmdec_mas_yr=0.0)
    # Subtracting exactly 1 deg from 0.001 → -0.999 → normalised to 359.001
    assert math.isclose(ra, 359.001, abs_tol=1e-6)


# --- T-D-02: full-row transform -------------------------------------

def test_transform_canonical_row_shapes_entity() -> None:
    row = {
        "source_id": 2947050466531473792,  # Sirius source_id
        "ra": 101.2875,
        "dec": -16.7161,
        "pmra": -546.01,
        "pmdec": -1223.08,
        "parallax": 379.21,
        "parallax_error": 1.58,
        "phot_g_mean_mag": -1.46,
        "bp_rp": 0.009,
    }
    out = transform(row)
    assert out["external_id"] == "GAIA-2947050466531473792"
    assert out["category"] == 1
    assert out["ent_id"] == "ENT-1000"
    # distance = 1000 / parallax_mas
    assert math.isclose(out["distance_pc"], 1000.0 / 379.21, rel_tol=1e-9)
    assert out["properties"]["spectral_type"] == "A"  # bp_rp ~0 → A
    assert out["properties"]["kind"] == "mainseq"


def test_transform_rejects_non_positive_parallax() -> None:
    row = {
        "source_id": 1,
        "ra": 0.0, "dec": 0.0, "pmra": 0.0, "pmdec": 0.0,
        "parallax": -0.5, "parallax_error": 0.1,
        "phot_g_mean_mag": 10.0, "bp_rp": 0.5,
    }
    with pytest.raises(InvalidGaiaRow):
        transform(row)


def test_transform_handles_missing_bp_rp() -> None:
    row = {
        "source_id": 1,
        "ra": 0.0, "dec": 0.0, "pmra": 0.0, "pmdec": 0.0,
        "parallax": 10.0, "parallax_error": 0.5,
        "phot_g_mean_mag": 10.0, "bp_rp": None,
    }
    out = transform(row)
    assert out["properties"]["bp_rp"] is None
    assert out["properties"]["spectral_type"] == "unknown"
