"""T-D-02 + T-D-03 — Gaia DR3 row → entities row.

Pure-function transformer: no database, no network. Takes the columns
returned by `cosmos_etl.downloaders.gaia_dr3` and returns a dict
shaped for `cosmos_etl.loaders.gaia_bulk` (which writes via COPY
FROM STDIN).

Computes:
  distance_pc   — `1000 / parallax_mas`
  spectral_type — BP-RP photometric index → O/B/A/F/G/K/M (Doc 23 §12.3)
  ent_id        — Doc 17 main-sequence default (`ENT-1000`); later
                  phases (T-F-03 HR diagram classifier) refine it.
  ra_j2000 /    — J2016.0 → J2000.0 proper-motion correction per
  dec_j2000       viz.md Appendix A.1.

Proper-motion correction (from J2016 back to J2000 — **16 years**
earlier):
  dec_j2000 = dec_j2016 - pmdec_mas_yr * 16 / 3600000
  ra_j2000  = ra_j2016  - pmra_mas_yr  * 16 / (3600000 * cos(dec_rad))

where pmra is the sky-projected proper motion (already contains the
cos(dec) factor per Gaia convention) — see T-D-03 test coverage for
Barnard's Star.
"""
from __future__ import annotations

import math
from typing import Any


# --- Spectral classification boundaries (Doc 23 §12.3) -------------
# bp_rp photometric color index → spectral class. Thresholds are
# the consensus bins from Pecaut & Mamajek 2013 + Jao 2020; good
# enough for first-pass taxonomy without photometric calibration.
_SPECTRAL_BINS: list[tuple[float, str]] = [
    (-0.30, "O"),
    (0.00, "B"),
    (0.30, "A"),
    (0.60, "F"),
    (0.90, "G"),
    (1.40, "K"),
    (float("inf"), "M"),
]


def spectral_type_from_bp_rp(bp_rp: float | None) -> str:
    """Map BP-RP to the 7-class spectral taxonomy."""
    if bp_rp is None or not math.isfinite(bp_rp):
        return "unknown"
    for threshold, cls in _SPECTRAL_BINS:
        if bp_rp < threshold:
            return cls
    return "M"


# --- Proper motion correction --------------------------------------

GAIA_EPOCH_YR = 2016.0  # Gaia DR3 native epoch.
J2000_EPOCH_YR = 2000.0
_DT_YEARS = GAIA_EPOCH_YR - J2000_EPOCH_YR  # +16 years forward
_MAS_PER_DEG = 3_600_000.0


def propagate_to_j2000(
    ra_deg_j2016: float,
    dec_deg_j2016: float,
    pmra_mas_yr: float,
    pmdec_mas_yr: float,
) -> tuple[float, float]:
    """Subtract 16 years of proper motion to reach J2000.0.

    pmra is the sky-projected motion (Gaia convention), so the cos(dec)
    factor is already baked in — we divide back out to get the pure
    ra increment in degrees.
    """
    dec_rad = math.radians(dec_deg_j2016)
    cos_dec = math.cos(dec_rad) or 1e-12  # avoid div-by-zero at pole
    dec_j2000 = dec_deg_j2016 - (pmdec_mas_yr * _DT_YEARS) / _MAS_PER_DEG
    ra_j2000 = ra_deg_j2016 - (pmra_mas_yr * _DT_YEARS) / (_MAS_PER_DEG * cos_dec)
    # Normalise RA into [0, 360).
    ra_j2000 = ra_j2000 % 360.0
    return ra_j2000, dec_j2000


# --- Row transformer ------------------------------------------------

class InvalidGaiaRow(ValueError):
    """Raised when a row can't be transformed (e.g. non-positive parallax)."""


def transform(row: dict[str, Any]) -> dict[str, Any]:
    """Return the entity row dict for a single Gaia source.

    Required keys on `row` (whatever astroquery/pandas gives us):
      source_id, ra, dec, pmra, pmdec, parallax, parallax_error,
      phot_g_mean_mag, bp_rp

    Output dict mirrors the T-C-01 EntityRow shape so downstream
    loaders (T-D-05) can treat Gaia + TS seed rows uniformly.
    """
    source_id = int(row["source_id"])
    parallax_mas = float(row["parallax"])
    if parallax_mas <= 0 or not math.isfinite(parallax_mas):
        raise InvalidGaiaRow(f"non-positive parallax on source_id={source_id}")

    ra_j2016 = float(row["ra"])
    dec_j2016 = float(row["dec"])
    pmra = float(row.get("pmra") or 0.0)
    pmdec = float(row.get("pmdec") or 0.0)
    ra_j2000, dec_j2000 = propagate_to_j2000(ra_j2016, dec_j2016, pmra, pmdec)

    distance_pc = 1000.0 / parallax_mas

    bp_rp_raw = row.get("bp_rp")
    bp_rp = float(bp_rp_raw) if bp_rp_raw is not None and not _is_missing(bp_rp_raw) else None
    spectral = spectral_type_from_bp_rp(bp_rp)

    magnitude = float(row["phot_g_mean_mag"])

    return {
        "ent_id": "ENT-1000",
        "external_id": f"GAIA-{source_id}",
        "name": f"Gaia DR3 {source_id}",
        "aliases": [f"GAIA DR3 {source_id}"],
        "entity_type": 1000,
        "category": 1,  # Doc 17 star.
        "ra_deg": ra_j2000,
        "dec_deg": dec_j2000,
        "distance_pc": distance_pc,
        "properties": {
            "source_id": source_id,
            "parallax_mas": parallax_mas,
            "pmra_mas_yr": pmra,
            "pmdec_mas_yr": pmdec,
            "bp_rp": bp_rp,
            "magnitude_apparent": magnitude,
            "spectral_type": spectral,
            "kind": "mainseq",
        },
    }


def _is_missing(value: Any) -> bool:
    """`pandas.NA` / numpy masked values present as NaN — treat as None."""
    try:
        f = float(value)
    except (TypeError, ValueError):
        return True
    return not math.isfinite(f)
