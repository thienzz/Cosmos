"""SPICE-backed ephemeris calculator.

Wraps SpiceyPy `spkez` so the FastAPI layer stays framework-free. Consumers
construct one calculator at service startup (after kernels are loaded) and hold
onto it for the process lifetime — SPICE's kernel pool is process-global, so
the calculator is effectively a thin façade.

Design notes
------------
* All outputs are in **AU** and **AU/day**, per Doc 26 §8.1 response schema.
* `light_time_s` is the one-way Newtonian light-time (SPICE returns it for free).
* We split `InvalidNaifIdError` from `EpochOutOfRangeError` so the FastAPI layer
  can map them to the right `INVALID_NAIF_ID` / `EPOCH_OUT_OF_RANGE` codes from
  Doc 26 §15.2. SpiceyPy throws a family of `SpiceyError`s; the mapping lives in
  `calculator._classify_spice_error`.
* Real frame-name validation happens through SPICE (any name it doesn't
  recognise raises `SpiceUNKNOWNFRAME`). We still expose `SUPPORTED_FRAMES` so
  the schema layer can reject obviously wrong inputs before burning an SPK call.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import spiceypy as spice
from spiceypy.utils.exceptions import SpiceyError

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

#: Kilometres in one astronomical unit (IAU 2012 resolution B2).
AU_KM: float = 149_597_870.7

#: Seconds in one day.
SECONDS_PER_DAY: float = 86_400.0

#: Frames Doc 26 §8.1 lists as supported query values.
SUPPORTED_FRAMES: frozenset[str] = frozenset({"ECLIPJ2000", "J2000", "GALACTIC"})

#: Doc 26 §8.1 baseline coverage (DE440 1550–2650 CE).
MIN_JD: float = 2_287_184.5
MAX_JD: float = 2_688_976.5

#: T39 / Doc 23 §3.1.4 — extended coverage when DE441 is furnished
#: (−13,200 to +17,191 CE, the full 30,000-year window).
MIN_JD_DE441: float = -1_513_175.5  # JD of −13,200-01-01 12:00 TDB
MAX_JD_DE441: float = 7_555_900.5   # JD of +17,191-12-31 12:00 TDB


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


class EphemerisError(Exception):
    """Base for calculator-level errors surfaced to the API layer."""


class InvalidNaifIdError(EphemerisError):
    """Raised when SPICE has no data for the requested NAIF body."""


class InvalidFrameError(EphemerisError):
    """Raised when the supplied reference frame is not recognised by SPICE."""


class EpochOutOfRangeError(EphemerisError):
    """Raised when the epoch falls outside loaded kernel coverage."""


class KernelsNotLoadedError(EphemerisError):
    """Raised when the calculator is asked to compute before kernels are furnished."""


# ---------------------------------------------------------------------------
# Value object
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class EphemerisState:
    """Position + velocity of one body at one epoch, in AU-based units."""

    position_au: tuple[float, float, float]
    velocity_au_day: tuple[float, float, float]
    light_time_s: float


# ---------------------------------------------------------------------------
# Calculator
# ---------------------------------------------------------------------------


class EphemerisCalculator:
    """Thin wrapper around `spiceypy.spkez` with normalised error mapping."""

    def __init__(self, *, kernels_loaded: bool = True, has_de441: bool = False) -> None:
        self._kernels_loaded = kernels_loaded
        self._has_de441 = has_de441

    @property
    def kernels_loaded(self) -> bool:
        return self._kernels_loaded

    @property
    def has_de441(self) -> bool:
        """T39 — when True the supported epoch range expands to DE441's
        full ±13,200-year window per Doc 23 §3.1.4."""
        return self._has_de441

    def mark_kernels_loaded(self, loaded: bool) -> None:
        self._kernels_loaded = loaded

    def mark_de441_loaded(self, loaded: bool) -> None:
        self._has_de441 = loaded

    def epoch_window(self) -> tuple[float, float]:
        """Currently-supported [min_jd, max_jd] window."""
        if self._has_de441:
            return (MIN_JD_DE441, MAX_JD_DE441)
        return (MIN_JD, MAX_JD)

    def _guard_epoch(self, jd: float) -> None:
        """Instance-level guard — widens to DE441 when that kernel is loaded."""
        lo, hi = self.epoch_window()
        if not (lo <= jd <= hi):
            raise EpochOutOfRangeError(
                f"Epoch JD={jd} is outside SPICE kernel coverage "
                f"(valid: {lo}–{hi}, DE441={self._has_de441})"
            )

    # ------------------------------------------------------------------
    # Single-body query
    # ------------------------------------------------------------------

    def state(
        self,
        *,
        naif_id: int,
        epoch_jd: float,
        frame: str = "ECLIPJ2000",
        observer: int = 10,
    ) -> EphemerisState:
        """Compute state of `naif_id` at `epoch_jd` (JD, TDB) relative to `observer`."""
        if not self._kernels_loaded:
            raise KernelsNotLoadedError("SPICE kernels have not been furnished")
        self._guard_epoch(epoch_jd)
        _guard_frame(frame)

        try:
            et = spice.unitim(epoch_jd, "JED", "ET")
            state, lt = spice.spkez(naif_id, et, frame, "NONE", observer)
        except SpiceyError as exc:  # pragma: no cover — translated below
            raise _classify_spice_error(exc) from exc

        pos_au = (state[0] / AU_KM, state[1] / AU_KM, state[2] / AU_KM)
        # spkez returns velocity in km/s; convert to AU/day.
        km_s_to_au_day = SECONDS_PER_DAY / AU_KM
        vel_au_day = (
            state[3] * km_s_to_au_day,
            state[4] * km_s_to_au_day,
            state[5] * km_s_to_au_day,
        )
        return EphemerisState(
            position_au=pos_au,
            velocity_au_day=vel_au_day,
            light_time_s=float(lt),
        )

    # ------------------------------------------------------------------
    # Batch query — Doc 26 §8.2
    # ------------------------------------------------------------------

    def batch(
        self,
        *,
        naif_ids: Iterable[int],
        epochs: Iterable[float],
        frame: str = "ECLIPJ2000",
        observer: int = 10,
    ) -> list[tuple[int, float, EphemerisState]]:
        """Compute positions for the cartesian product (naif_ids × epochs)."""
        if not self._kernels_loaded:
            raise KernelsNotLoadedError("SPICE kernels have not been furnished")
        _guard_frame(frame)

        epoch_list = list(epochs)
        for jd in epoch_list:
            self._guard_epoch(jd)

        out: list[tuple[int, float, EphemerisState]] = []
        for body in naif_ids:
            for jd in epoch_list:
                out.append((body, jd, self.state(
                    naif_id=body, epoch_jd=jd, frame=frame, observer=observer,
                )))
        return out

    # ------------------------------------------------------------------
    # Range query — Doc 26 §8.3
    # ------------------------------------------------------------------

    def range(
        self,
        *,
        naif_id: int,
        start_jd: float,
        end_jd: float,
        step_days: float,
        frame: str = "ECLIPJ2000",
        observer: int = 10,
    ) -> tuple[list[tuple[float, float, float]], int]:
        """Compute a dense time series. Returns `(positions, count)`.

        The returned positions are the compact `[x, y, z]` tuples that Doc 26
        §8.3 prescribes; velocities and light time are dropped to save ~60%
        bandwidth on the wire.
        """
        if not self._kernels_loaded:
            raise KernelsNotLoadedError("SPICE kernels have not been furnished")
        self._guard_epoch(start_jd)
        self._guard_epoch(end_jd)
        _guard_frame(frame)

        positions: list[tuple[float, float, float]] = []
        # Inclusive of the start; extend as long as we stay on or under `end_jd`
        # (with a tiny epsilon to absorb floating-point drift on the last step).
        epoch = start_jd
        eps = step_days * 1e-9
        while epoch <= end_jd + eps:
            state = self.state(
                naif_id=naif_id, epoch_jd=epoch, frame=frame, observer=observer,
            )
            positions.append(state.position_au)
            epoch += step_days
        return positions, len(positions)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _guard_epoch(jd: float) -> None:
    """Module-level guard kept for backward compatibility — assumes DE440."""
    if not (MIN_JD <= jd <= MAX_JD):
        raise EpochOutOfRangeError(
            f"Epoch JD={jd} is outside SPICE kernel coverage "
            f"(valid: {MIN_JD}–{MAX_JD})"
        )


def _guard_frame(frame: str) -> None:
    if frame not in SUPPORTED_FRAMES:
        raise InvalidFrameError(
            f"Unknown frame '{frame}' (supported: {sorted(SUPPORTED_FRAMES)})"
        )


def _classify_spice_error(exc: SpiceyError) -> EphemerisError:
    """Map SPICE's short-name family onto the API's error taxonomy."""
    short = getattr(exc, "short", "") or str(exc)
    # Body-identity errors → INVALID_NAIF_ID
    if any(
        needle in short
        for needle in ("SPKINSUFFDATA", "SPKDOESNTEXIST", "BODYIDNOTFOUND", "BODYNAMENOTFOUND")
    ):
        return InvalidNaifIdError(str(exc))
    # Frame errors → INVALID_FRAME
    if any(needle in short for needle in ("UNKNOWNFRAME", "INVALIDFRAME", "BADFRAME")):
        return InvalidFrameError(str(exc))
    # Epoch errors → EPOCH_OUT_OF_RANGE
    if any(needle in short for needle in ("TIMEOUTOFBOUNDS", "YEAROUTOFRANGE")):
        return EpochOutOfRangeError(str(exc))
    # Anything else we treat as an opaque upstream failure.
    return EphemerisError(str(exc))
