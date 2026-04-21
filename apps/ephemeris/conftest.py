"""Shared test fixtures for the ephemeris service.

Kernel strategy
---------------
The monorepo ships a minimal SPICE kernel set under `data/spice/`:

    data/spice/
    ├── naif0012.tls       leap seconds (~5 KB)
    ├── pck00011.tpc       planetary constants (~128 KB)
    └── de440s.bsp         small DE440, 1849–2150 CE (~32 MB)

That's enough to cover every NAIF id Appendix A lists for the planet-level
tests. The session-scoped `spice_kernels` fixture furnishes them once per
pytest run, and the app's lifespan honours the pre-loaded pool because
`spice.furnsh` is idempotent.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Ensure `import ephemeris_service` works when pytest is invoked from either
# the service dir or the repo root.
SERVICE_DIR = Path(__file__).resolve().parent
if str(SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICE_DIR))

# Repo root: apps/ephemeris/ → apps/ → repo root.
REPO_ROOT = SERVICE_DIR.parent.parent
KERNEL_DIR = REPO_ROOT / "data" / "spice"

# Point the loader at our committed kernel set before the app's lifespan fires.
os.environ.setdefault("SPICE_KERNEL_DIR", str(KERNEL_DIR))


@pytest.fixture(scope="session")
def kernel_dir() -> Path:
    return KERNEL_DIR


@pytest.fixture(scope="session")
def spice_kernels(kernel_dir: Path):
    """Furnish the committed kernel set for the whole test session."""
    from kernel_loader import clear_kernels, load_kernels

    clear_kernels()
    result = load_kernels(directory=kernel_dir)
    if not result.ok:
        pytest.skip(
            f"SPICE kernels missing from {kernel_dir}; run "
            f"`scripts/download-spice-kernels.sh` before running accuracy tests."
        )
    yield result
    clear_kernels()


@pytest.fixture()
def client(spice_kernels):
    """FastAPI TestClient with kernels already in the pool."""
    from fastapi.testclient import TestClient

    import ephemeris_service

    # The app's lifespan calls `load_kernels` again, which is a no-op once the
    # session fixture has already furnished everything.
    with TestClient(ephemeris_service.app) as tc:
        yield tc


@pytest.fixture()
def calculator(spice_kernels):
    """A standalone EphemerisCalculator for unit-level tests."""
    from calculator import EphemerisCalculator

    calc = EphemerisCalculator(kernels_loaded=True)
    return calc
