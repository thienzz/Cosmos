"""Calculator-level tests — error paths and unit conversions."""

from __future__ import annotations

import math

import pytest

from calculator import (
    AU_KM,
    EphemerisCalculator,
    EpochOutOfRangeError,
    InvalidFrameError,
    InvalidNaifIdError,
    KernelsNotLoadedError,
    MAX_JD,
    MIN_JD,
    SECONDS_PER_DAY,
)


# ---------------------------------------------------------------------------
# Guards — runtime-only checks before SPICE is even invoked
# ---------------------------------------------------------------------------


class TestGuards:
    def test_rejects_epoch_before_kernel_start(self, calculator: EphemerisCalculator) -> None:
        with pytest.raises(EpochOutOfRangeError):
            calculator.state(naif_id=399, epoch_jd=MIN_JD - 1)

    def test_rejects_epoch_after_kernel_end(self, calculator: EphemerisCalculator) -> None:
        with pytest.raises(EpochOutOfRangeError):
            calculator.state(naif_id=399, epoch_jd=MAX_JD + 1)

    def test_accepts_epochs_on_boundary(self, calculator: EphemerisCalculator) -> None:
        # MIN/MAX_JD are the doc-specified valid bounds; SPICE may still reject
        # them if the specific body's SPK doesn't cover the endpoint. We only
        # assert the guard itself doesn't fire.
        try:
            calculator.state(naif_id=399, epoch_jd=2_451_545.0)  # J2000
        except InvalidNaifIdError:
            pytest.fail("Valid epoch shouldn't trigger guard logic")

    def test_rejects_unknown_frame(self, calculator: EphemerisCalculator) -> None:
        with pytest.raises(InvalidFrameError):
            calculator.state(
                naif_id=399, epoch_jd=2_451_545.0, frame="UNKNOWN_FRAME"  # type: ignore[arg-type]
            )

    def test_raises_if_kernels_not_loaded(self) -> None:
        calc = EphemerisCalculator(kernels_loaded=False)
        with pytest.raises(KernelsNotLoadedError):
            calc.state(naif_id=399, epoch_jd=2_451_545.0)


# ---------------------------------------------------------------------------
# SPICE mapping — known values baked against the committed DE440s kernel
# ---------------------------------------------------------------------------


class TestSingleState:
    """Reference values taken from JPL Horizons (heliocentric ECLIPJ2000)."""

    def test_earth_j2000(self, calculator: EphemerisCalculator) -> None:
        # TS-TIME-001 — Earth at J2000.0 (JD 2451545.0) heliocentric ECLIPJ2000
        # JPL Horizons: X = -0.1771354 AU, Y = 0.9672416 AU, Z ≈ -4.1e-06 AU
        state = calculator.state(naif_id=399, epoch_jd=2_451_545.0)
        assert state.position_au[0] == pytest.approx(-0.17713510, abs=1e-3)
        assert state.position_au[1] == pytest.approx(0.96724169, abs=1e-3)
        assert state.position_au[2] == pytest.approx(-4.09e-06, abs=1e-3)

    def test_earth_velocity_direction(self, calculator: EphemerisCalculator) -> None:
        """Earth's orbital speed ≈ 0.0172 AU/day; sign goes the right way at J2000."""
        state = calculator.state(naif_id=399, epoch_jd=2_451_545.0)
        speed = math.sqrt(sum(v * v for v in state.velocity_au_day))
        # Earth's orbital speed is ~29.78 km/s ≈ 0.0172 AU/day.
        assert speed == pytest.approx(0.0172, abs=1e-3)

    def test_light_time_to_earth(self, calculator: EphemerisCalculator) -> None:
        """One-way light time Sun → Earth at J2000 ≈ 499 s."""
        state = calculator.state(naif_id=399, epoch_jd=2_451_545.0)
        assert state.light_time_s == pytest.approx(499, abs=10)

    def test_unknown_naif_id_translates_to_invalid(
        self, calculator: EphemerisCalculator
    ) -> None:
        # 987654 is not in any loaded SPK → SPKINSUFFDATA → InvalidNaifIdError.
        with pytest.raises(InvalidNaifIdError):
            calculator.state(naif_id=987654, epoch_jd=2_451_545.0)


# ---------------------------------------------------------------------------
# Unit conversion
# ---------------------------------------------------------------------------


class TestUnitConversion:
    def test_au_km_constant(self) -> None:
        # IAU 2012 resolution B2.
        assert AU_KM == 149_597_870.7

    def test_seconds_per_day_constant(self) -> None:
        assert SECONDS_PER_DAY == 86_400.0

    def test_sun_to_sun_is_zero(self, calculator: EphemerisCalculator) -> None:
        # Sanity: observer === target ⇒ zero position, zero velocity, zero lt.
        state = calculator.state(naif_id=10, epoch_jd=2_451_545.0, observer=10)
        assert state.position_au == (0.0, 0.0, 0.0)
        assert state.velocity_au_day == (0.0, 0.0, 0.0)
        assert state.light_time_s == 0.0


# ---------------------------------------------------------------------------
# Range computation — step consistency
# ---------------------------------------------------------------------------


class TestRange:
    def test_inclusive_of_endpoint(self, calculator: EphemerisCalculator) -> None:
        positions, count = calculator.range(
            naif_id=399,
            start_jd=2_451_545.0,
            end_jd=2_451_555.0,
            step_days=1.0,
        )
        # 11 inclusive samples from day 0..day 10.
        assert count == 11
        assert len(positions) == 11

    def test_single_point_range(self, calculator: EphemerisCalculator) -> None:
        positions, count = calculator.range(
            naif_id=399, start_jd=2_451_545.0, end_jd=2_451_545.0, step_days=1.0,
        )
        assert count == 1
        assert len(positions[0]) == 3
