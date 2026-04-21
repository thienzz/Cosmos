"""Ephemeris accuracy tests against JPL Horizons / authoritative sources.

Maps to SRS / Doc 30 test cases:

- TS-TIME-001 — Earth position at J2000.0 — ±0.001 AU per axis
- TS-TIME-002 — Jupiter (barycenter) position near opposition — ±0.01 AU per axis

Reference values come directly from JPL Horizons — the same DE440 that SPICE
integrates, so the two should agree to sub-metre precision. We intentionally
test **positions relative to the Sun in ECLIPJ2000** because that's the frame
the front-end TimeEngine consumes (Doc 27 §5.3 + §8 solar-system renderer).

DE440s covers 1849–2150, which is the only part of the 1550–2650 range we need
for these tests.
"""

from __future__ import annotations

import math

import pytest

from calculator import EphemerisCalculator

# JPL Horizons reference — Earth geocenter wrt Sun in ECLIPJ2000 at JD 2451545.0
# (https://ssd.jpl.nasa.gov/api/horizons.api, target=399, center=500@10)
EARTH_J2000_REF = (-0.17713510, 0.96724169, -4.09e-06)

# JPL Horizons reference — Jupiter barycenter (NAIF 5) wrt Sun in ECLIPJ2000
# at JD 2460251.5 (2023-11-03, close to 2023 Jupiter opposition). Earth-Jupiter
# opposition for that epoch puts Jupiter ~3.8 AU from the Sun in +X, +Y
# quadrant with a slight -Z due to its 1.3° orbital inclination.
JUPITER_2023_OPPOSITION_JD = 2_460_251.5
JUPITER_2023_OPPOSITION_REF = (3.801181, 3.207367, -0.098368)


class TestHorizonsAccuracy:
    """Sub-0.001 AU agreement with JPL Horizons for reference bodies / epochs."""

    def test_earth_at_j2000_within_tolerance(
        self, calculator: EphemerisCalculator
    ) -> None:
        state = calculator.state(naif_id=399, epoch_jd=2_451_545.0)
        for computed, reference in zip(state.position_au, EARTH_J2000_REF):
            assert math.isfinite(computed)
            assert computed == pytest.approx(reference, abs=1e-4)

    def test_jupiter_at_2023_opposition_within_tolerance(
        self, calculator: EphemerisCalculator
    ) -> None:
        # Use NAIF 5 (Jupiter barycenter) — DE440s doesn't include the Jupiter
        # centre (NAIF 599) directly. The barycenter–body offset is <0.005 AU
        # which is inside the TS-TIME-002 ±0.01 AU tolerance.
        state = calculator.state(
            naif_id=5, epoch_jd=JUPITER_2023_OPPOSITION_JD
        )
        for computed, reference in zip(
            state.position_au, JUPITER_2023_OPPOSITION_REF
        ):
            assert computed == pytest.approx(reference, abs=1e-3)

    def test_moon_geocentric_distance_plausible(
        self, calculator: EphemerisCalculator
    ) -> None:
        """Moon wrt Earth: distance should be ≈ 0.00257 AU (~384,400 km)."""
        state = calculator.state(
            naif_id=301, epoch_jd=2_451_545.0, observer=399
        )
        distance = math.sqrt(sum(x * x for x in state.position_au))
        # Moon's geocentric distance varies 0.00239–0.00271 AU (perigee/apogee).
        assert 0.0020 < distance < 0.0030

    def test_frame_sanity(self, calculator: EphemerisCalculator) -> None:
        """ECLIPJ2000 vs J2000: same body, same epoch should differ non-trivially
        because the ecliptic is tilted ~23.44° from the equator."""
        eclip = calculator.state(naif_id=399, epoch_jd=2_451_545.0, frame="ECLIPJ2000")
        equat = calculator.state(naif_id=399, epoch_jd=2_451_545.0, frame="J2000")

        # X axis coincides for both frames (vernal equinox). Y and Z swap via
        # a rotation around X by the mean obliquity. Distance from origin must
        # be identical.
        r_eclip = math.sqrt(sum(x * x for x in eclip.position_au))
        r_equat = math.sqrt(sum(x * x for x in equat.position_au))
        assert r_eclip == pytest.approx(r_equat, rel=1e-10)
        # X matches; Y differs meaningfully.
        assert eclip.position_au[0] == pytest.approx(equat.position_au[0], abs=1e-10)
        assert abs(eclip.position_au[1] - equat.position_au[1]) > 1e-4
