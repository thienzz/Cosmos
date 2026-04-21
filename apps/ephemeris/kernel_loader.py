"""Kernel furnishing with graceful fallback.

At boot, we look for the kernel set listed in `DEFAULT_KERNEL_FILENAMES` under
`$SPICE_KERNEL_DIR` (defaults to `/data/spice`). Any that are present get
`spice.furnsh`'d; any that are missing are logged and skipped. The service
still boots — queries for bodies whose kernels are absent will surface as
`INVALID_NAIF_ID` from SPICE, which the FastAPI layer maps to an HTTP 400.

Why graceful? Doc 25 §9 plans for kernels mounted from `/data/spice`, but in
local-dev and CI we ship only the minimal set (DE440s + leap seconds + PCK)
so we can run the test suite without dragging 2 GB of outer-planet kernels.
The calculator still reports `kernels_loaded=True` once at least one SPK has
been furnished.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Sequence

import spiceypy as spice

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

#: Env var that points at the kernel directory (see Dockerfile.ephemeris).
KERNEL_DIR_ENV: str = "SPICE_KERNEL_DIR"

#: Env var the test harness sets to point at the committed `data/spice/` dir.
KERNEL_DIR_DEFAULT: str = "/data/spice"

#: The union of kernels Doc 25 §9.1 calls out. Missing files are skipped —
#: which lets dev environments ship only the small DE440s set.
#:
#: T39 adds DE441 (parts 1+2, ~3 GB combined) for the full ±13,200 yr
#: validity window Doc 23 §3.1.4 calls for. Local dev still ships only
#: DE440s; DE441 + the satellite SPKs are pulled by
#: `scripts/download-spice-kernels.sh --full` and tracked via Git LFS in CI.
DEFAULT_KERNEL_FILENAMES: tuple[str, ...] = (
    "naif0012.tls",         # Leap seconds (small)
    "pck00011.tpc",         # Planetary constants (small)
    "de440s.bsp",           # Small DE440, 1849–2150 (~32 MB)
    "de440.bsp",            # Full DE440, 1550–2650 (~114 MB)
    "de441_part-1.bsp",     # DE441 part 1, −13200 to +1969 (~1.5 GB)
    "de441_part-2.bsp",     # DE441 part 2, +1969 to +17191 (~1.5 GB)
    "jup365.bsp",           # Jupiter system
    "sat441.bsp",           # Saturn system
    "ura111.bsp",           # Uranus system
    "nep097.bsp",           # Neptune system
    "plu058.bsp",           # Pluto system
    "mar097.bsp",           # Mars system (Phobos / Deimos high-precision)
    # MPC asteroid SPKs are fetched on-demand per-body via JPL Horizons
    # (T39 ETL pipeline). Keeping them out of the boot loader keeps the
    # process resident set ~constant regardless of catalog size.
)


# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class KernelLoadResult:
    loaded: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)
    directory: str = ""

    @property
    def ok(self) -> bool:
        """True iff at least one SPK (binary `.bsp`) was furnished."""
        return any(path.endswith(".bsp") for path in self.loaded)

    @property
    def has_de441(self) -> bool:
        """True iff *any* DE441 part is loaded — extends the epoch window."""
        return any("de441" in path.lower() for path in self.loaded)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def resolve_kernel_dir() -> Path:
    return Path(os.environ.get(KERNEL_DIR_ENV, KERNEL_DIR_DEFAULT)).resolve()


def load_kernels(
    directory: Path | None = None,
    filenames: Sequence[str] = DEFAULT_KERNEL_FILENAMES,
) -> KernelLoadResult:
    """Furnish every kernel in `filenames` that exists under `directory`.

    Idempotent: SPICE tolerates `furnsh` on an already-loaded kernel (it just
    increments an internal reference count), so callers can invoke us on the
    test startup fixture as well.
    """
    kernel_dir = directory if directory is not None else resolve_kernel_dir()
    result = KernelLoadResult(directory=str(kernel_dir))
    for name in filenames:
        path = kernel_dir / name
        if not path.is_file():
            result.missing.append(name)
            continue
        spice.furnsh(str(path))
        result.loaded.append(name)

    logger.info(
        "SPICE kernels furnished from %s (loaded=%d, missing=%d)",
        kernel_dir,
        len(result.loaded),
        len(result.missing),
    )
    if result.missing:
        logger.warning("SPICE kernels not found: %s", ", ".join(result.missing))
    return result


def clear_kernels() -> None:
    """Drop every furnished kernel. Useful for tests that need a clean pool."""
    spice.kclear()
