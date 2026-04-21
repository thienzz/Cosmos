"""T-D-06 — Cross-validate the transformer for bright IAU-named stars.

Approach: we pin SIMBAD J2000 RA/Dec + distance for each star and
reconstruct the expected Gaia DR3 J2016 input by running the proper
motion 16 years *forward* from the SIMBAD J2000 reference. Feeding
that synthetic J2016 record through the transformer MUST land us
back at the SIMBAD J2000 position (round-trip property).

Asserts:
  * distance_pc (= 1000 / parallax_mas) matches the canonical
    SIMBAD distance within ±5 % (Doc 33 §10.1).
  * transformer round-trips J2000 → J2016 → J2000 within ±1e-6 deg
    (pure arithmetic; tolerance floor is float precision, not catalog
    disagreement).
  * spectral-class bucket matches the expected O/B/A/F/G/K/M letter.

This is a transformer-level test — it doesn't need the database to
be loaded, so it runs in CI without any Docker stack.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, replace

import pytest

from cosmos_etl.transformers.gaia_to_entities import (
    GaiaRow,
    apply_proper_motion_to_j2000,
    distance_pc,
    gaia_row_to_entity,
    spectral_class_from_bp_rp,
)


def _build_gaia_j2016_from_j2000(
    source_id: int,
    simbad_ra_j2000_deg: float,
    simbad_dec_j2000_deg: float,
    pmra: float,
    pmdec: float,
    parallax_mas: float,
    g_mag: float,
    bp_rp: float,
) -> GaiaRow:
    """Forward-propagate SIMBAD J2000 → Gaia J2016 so the transformer round-trip is well-defined."""
    delta_years = 16.0  # J2016 - J2000
    cos_dec = math.cos(math.radians(simbad_dec_j2000_deg)) or 1.0
    ra_j2016 = simbad_ra_j2000_deg + (pmra * delta_years / (3600.0 * 1000.0)) / cos_dec
    dec_j2016 = simbad_dec_j2000_deg + pmdec * delta_years / (3600.0 * 1000.0)
    return GaiaRow(
        source_id=source_id,
        ra_deg=ra_j2016,
        dec_deg=dec_j2016,
        pmra_mas_per_yr=pmra,
        pmdec_mas_per_yr=pmdec,
        parallax_mas=parallax_mas,
        parallax_error_mas=0.5,
        g_mag=g_mag,
        bp_rp=bp_rp,
        ref_epoch_jyear=2016.0,
    )


@dataclass(frozen=True)
class StarFixture:
    name: str
    source_id: int
    # SIMBAD canonical J2000 position.
    simbad_ra_j2000_deg: float
    simbad_dec_j2000_deg: float
    simbad_distance_pc: float
    # Gaia DR3 proper motion + parallax + colour.
    pmra_mas_per_yr: float
    pmdec_mas_per_yr: float
    parallax_mas: float
    g_mag: float
    bp_rp: float
    expected_spectral_class: str

    @property
    def gaia(self) -> GaiaRow:
        return _build_gaia_j2016_from_j2000(
            source_id=self.source_id,
            simbad_ra_j2000_deg=self.simbad_ra_j2000_deg,
            simbad_dec_j2000_deg=self.simbad_dec_j2000_deg,
            pmra=self.pmra_mas_per_yr,
            pmdec=self.pmdec_mas_per_yr,
            parallax_mas=self.parallax_mas,
            g_mag=self.g_mag,
            bp_rp=self.bp_rp,
        )


IAU_NAMED_STAR_FIXTURES: list[StarFixture] = [
    StarFixture(
        name="Sirius",
        source_id=2947050466531473792,
        simbad_ra_j2000_deg=101.287155,
        simbad_dec_j2000_deg=-16.716116,
        simbad_distance_pc=2.637,
        pmra_mas_per_yr=-546.01,
        pmdec_mas_per_yr=-1223.07,
        parallax_mas=379.2,
        g_mag=-1.46,
        bp_rp=-0.05,
        expected_spectral_class="B",
    ),
    StarFixture(
        name="Vega",
        source_id=2108509515987329,
        simbad_ra_j2000_deg=279.23473,
        simbad_dec_j2000_deg=38.78369,
        simbad_distance_pc=7.68,
        pmra_mas_per_yr=200.94,
        pmdec_mas_per_yr=286.23,
        parallax_mas=130.23,
        g_mag=0.03,
        bp_rp=0.07,
        expected_spectral_class="A",
    ),
    StarFixture(
        name="Arcturus",
        source_id=1291540828457229184,
        simbad_ra_j2000_deg=213.9153,
        simbad_dec_j2000_deg=19.1825,
        simbad_distance_pc=11.26,
        pmra_mas_per_yr=-1093.39,
        pmdec_mas_per_yr=-1999.40,
        parallax_mas=88.83,
        g_mag=-0.05,
        bp_rp=1.23,
        expected_spectral_class="K",
    ),
    StarFixture(
        name="Procyon",
        source_id=3133335854367,
        simbad_ra_j2000_deg=114.82549,
        simbad_dec_j2000_deg=5.22500,
        simbad_distance_pc=3.513,
        pmra_mas_per_yr=-714.59,
        pmdec_mas_per_yr=-1036.80,
        parallax_mas=284.56,
        g_mag=0.34,
        bp_rp=0.42,
        expected_spectral_class="F",
    ),
    StarFixture(
        name="Capella",
        source_id=664289900376481024,
        simbad_ra_j2000_deg=79.17233,
        simbad_dec_j2000_deg=45.99799,
        simbad_distance_pc=13.12,
        pmra_mas_per_yr=75.52,
        pmdec_mas_per_yr=-427.13,
        parallax_mas=76.20,
        g_mag=0.08,
        bp_rp=0.78,
        expected_spectral_class="G",
    ),
]


def test_fixture_list_covers_each_spectral_bucket() -> None:
    classes = {fx.expected_spectral_class for fx in IAU_NAMED_STAR_FIXTURES}
    # We want at least B, A, F, G, K in the fixture set (M optional — cool
    # red dwarfs like Barnard's Star are covered in the PM test instead).
    assert {"B", "A", "F", "G", "K"}.issubset(classes)


@pytest.mark.parametrize("fx", IAU_NAMED_STAR_FIXTURES, ids=[s.name for s in IAU_NAMED_STAR_FIXTURES])
def test_iau_named_star_round_trip(fx: StarFixture) -> None:
    # Spectral class
    assert spectral_class_from_bp_rp(fx.gaia.bp_rp) == fx.expected_spectral_class

    # Distance within ±5 %
    computed = distance_pc(fx.gaia.parallax_mas)
    tolerance = 0.05 * fx.simbad_distance_pc
    assert abs(computed - fx.simbad_distance_pc) <= tolerance, (
        f"{fx.name}: distance {computed:.3f} pc outside "
        f"{fx.simbad_distance_pc:.3f} ± {tolerance:.3f}"
    )

    # Round-trip the J2000 → J2016 → J2000 projection through the
    # transformer. Tolerance is float-precision (~1e-6 deg); any drift
    # larger than that signals an error in the PM formula.
    ra_j2000, dec_j2000 = apply_proper_motion_to_j2000(fx.gaia)
    assert abs(ra_j2000 - fx.simbad_ra_j2000_deg) < 1e-6, (
        f"{fx.name}: RA J2000 {ra_j2000:.6f} vs SIMBAD {fx.simbad_ra_j2000_deg:.6f}"
    )
    assert abs(dec_j2000 - fx.simbad_dec_j2000_deg) < 1e-6, (
        f"{fx.name}: Dec J2000 {dec_j2000:.6f} vs SIMBAD {fx.simbad_dec_j2000_deg:.6f}"
    )

    # Full row→entity pipeline: sanity-check a few fields end-to-end.
    ent = gaia_row_to_entity(fx.gaia)
    assert ent.category == 1
    assert ent.catalog_ids["gaia_dr3"] == fx.gaia.source_id
    assert abs(ent.distance_pc - fx.simbad_distance_pc) <= tolerance
