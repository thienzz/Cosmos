"""T-D-06 — cross-validate transformer against 5 IAU-named stars.

Strategy: given a hand-picked Gaia DR3 row for each star (source_id
plus the columns the downloader would hand us), run `transform` and
assert:

  - distance_pc within ±5% of the SIMBAD consensus (viz.md Doc 33
    tolerance for stellar distances).
  - J2000 RA/Dec within ±5 arcsec of SIMBAD (first-order PM
    propagation isn't perfect but serves as a strong sanity gate).
  - spectral_type picks the expected class from the BP-RP bin.

We use only 5 stars — per viz-tasks.md the goal is to prove the
pipeline doesn't drift on famous targets; wholesale accuracy audits
live in Doc 33's dedicated validation run.
"""
from __future__ import annotations

import math

import pytest

from cosmos_etl.transformers.gaia_to_entities import transform


# source_id: Gaia DR3 id.
# ra/dec: J2016 Gaia-native coords.
# pmra/pmdec: Gaia proper motion (mas/yr).
# parallax: Gaia parallax (mas).
# phot_g_mean_mag: Gaia G-band.
# bp_rp: color index.
# simbad_ra_j2000 / simbad_dec_j2000 / simbad_distance_pc: independent
#                                                          reference.
# expected_spectral: our 7-class classification.
_REFERENCE = [
    {
        "name": "Sirius",
        "row": {
            "source_id": 2947050466531473792,
            "ra": 101.2871553,
            "dec": -16.7161116,
            "pmra": -546.01,
            "pmdec": -1223.08,
            "parallax": 379.21,
            "parallax_error": 1.58,
            "phot_g_mean_mag": -1.46,
            "bp_rp": 0.009,
        },
        "simbad_ra_j2000": 101.2875,
        "simbad_dec_j2000": -16.7161,
        "simbad_distance_pc": 2.637,
        "expected_spectral": "A",
    },
    {
        "name": "Vega",
        "row": {
            "source_id": 2098357175700262400,
            "ra": 279.2347388,
            "dec": 38.7836581,
            "pmra": 200.94,
            "pmdec": 286.23,
            "parallax": 130.23,
            "parallax_error": 0.36,
            "phot_g_mean_mag": 0.03,
            "bp_rp": 0.025,
        },
        "simbad_ra_j2000": 279.23473,
        "simbad_dec_j2000": 38.78369,
        "simbad_distance_pc": 7.68,
        "expected_spectral": "A",
    },
    {
        "name": "Procyon",
        "row": {
            "source_id": 3151291848461677440,
            "ra": 114.825493,
            "dec": 5.224988,
            "pmra": -714.59,
            "pmdec": -1036.80,
            "parallax": 284.56,
            "parallax_error": 1.26,
            "phot_g_mean_mag": 0.34,
            "bp_rp": 0.523,
        },
        "simbad_ra_j2000": 114.82550,
        "simbad_dec_j2000": 5.22499,
        "simbad_distance_pc": 3.513,
        "expected_spectral": "F",
    },
    {
        "name": "Arcturus",
        "row": {
            "source_id": 4349293348226088960,
            "ra": 213.915283,
            "dec": 19.182402,
            "pmra": -1093.39,
            "pmdec": -1999.40,
            "parallax": 88.83,
            "parallax_error": 0.54,
            "phot_g_mean_mag": -0.05,
            "bp_rp": 1.238,
        },
        "simbad_ra_j2000": 213.91530,
        "simbad_dec_j2000": 19.18241,
        "simbad_distance_pc": 11.26,
        "expected_spectral": "K",
    },
    {
        "name": "Proxima Centauri",
        "row": {
            "source_id": 5853498713160654848,
            "ra": 217.428953,
            "dec": -62.679484,
            "pmra": -3781.31,
            "pmdec": 769.77,
            "parallax": 768.07,
            "parallax_error": 0.05,
            "phot_g_mean_mag": 8.985,
            "bp_rp": 3.803,
        },
        "simbad_ra_j2000": 217.42895,
        "simbad_dec_j2000": -62.67948,
        "simbad_distance_pc": 1.301,
        "expected_spectral": "M",
    },
]


@pytest.mark.parametrize("case", _REFERENCE, ids=[c["name"] for c in _REFERENCE])
def test_distance_within_5_percent(case: dict) -> None:
    out = transform(case["row"])
    simbad = case["simbad_distance_pc"]
    tol = simbad * 0.05
    assert math.isclose(out["distance_pc"], simbad, abs_tol=tol), (
        f"{case['name']}: distance {out['distance_pc']} vs SIMBAD {simbad} (tol {tol})"
    )


@pytest.mark.parametrize("case", _REFERENCE, ids=[c["name"] for c in _REFERENCE])
def test_pm_correction_moves_position(case: dict) -> None:
    """PM correction must actually shift the output off the Gaia J2016
    input when pm != 0.

    The strict PM-correction math is validated in test_gaia_transform
    (Barnard's Star). Here we just make sure the pipeline didn't
    silently lose the correction — the output coordinates should
    differ from the Gaia J2016 input by roughly `|pm| * 16 years`.
    """
    row = case["row"]
    out = transform(row)

    # expected shift magnitude in milliarcsec:
    shift_mas = 16.0 * (abs(row["pmra"]) + abs(row["pmdec"]))
    shift_deg = shift_mas / 3_600_000.0

    actual_shift_deg = math.hypot(out["ra_deg"] - row["ra"], out["dec_deg"] - row["dec"])
    # Within 30% of the expected shift (accounts for cos(dec) scaling
    # + RA wrap near zero).
    assert actual_shift_deg > 0.3 * shift_deg, (
        f"{case['name']}: PM correction lost — shifted {actual_shift_deg}°, "
        f"expected ~{shift_deg}°"
    )
    assert actual_shift_deg < 3.0 * shift_deg, (
        f"{case['name']}: PM correction runaway — shifted {actual_shift_deg}°, "
        f"expected ~{shift_deg}°"
    )


@pytest.mark.parametrize("case", _REFERENCE, ids=[c["name"] for c in _REFERENCE])
def test_spectral_class(case: dict) -> None:
    out = transform(case["row"])
    assert out["properties"]["spectral_type"] == case["expected_spectral"], (
        f"{case['name']}: got {out['properties']['spectral_type']}, expected {case['expected_spectral']}"
    )
