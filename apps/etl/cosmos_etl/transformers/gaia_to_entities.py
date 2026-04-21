"""T-D-02 / T-D-03 — Transform Gaia DR3 rows into entity-table payloads.

Every row from `gaiadr3.gaia_source` → one `entities` row + one
`stars` partition row. Conversions:

  distance_pc    = 1000 / parallax_mas           (parallax > 0 guard upstream)
  spectral_class = bp_rp colour bucket (Doc 23 §12.3 table)
  ra_j2000       = ra_j2016 - pmra * 16 yr / cos(dec_rad)      [T-D-03]
  dec_j2000      = dec_j2016 - pmdec * 16 yr
  healpix_order6 = source_id / 2**47  (Gaia source-id encoding)

These are pure functions — the loader in `cosmos_etl.loaders.gaia_bulk`
calls them from a streaming COPY FROM STDIN pipeline so we never hold
1.2M rows in memory at once.
"""
from __future__ import annotations

import csv
import logging
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, Mapping

log = logging.getLogger(__name__)

# Doc 23 §12.3 spectral-class table keyed on BP-RP colour.
SPECTRAL_BUCKETS: tuple[tuple[float, str], ...] = (
    (-0.3, "O"),
    (0.0, "B"),
    (0.3, "A"),
    (0.6, "F"),
    (0.9, "G"),
    (1.4, "K"),
    (math.inf, "M"),
)

# HEALPix order 6 key extractor: Gaia source-id encodes order-12 pixel in the
# upper bits (bits 35..58). Dropping four more orders yields order 6:
# order_6 = source_id / 2**(35+12) = source_id / 2**47.
HEALPIX_ORDER6_DIVISOR = 2**47
# Gaia catalog epoch.
GAIA_EPOCH_JYEAR = 2016.0
J2000_EPOCH_JYEAR = 2000.0
# arcseconds per degree × milliseconds-per-arcsecond → mas → deg conversion.
MAS_TO_DEG = 1.0 / (3600.0 * 1000.0)


@dataclass(frozen=True)
class GaiaRow:
    source_id: int
    ra_deg: float
    dec_deg: float
    pmra_mas_per_yr: float | None
    pmdec_mas_per_yr: float | None
    parallax_mas: float
    parallax_error_mas: float
    g_mag: float
    bp_rp: float | None
    ref_epoch_jyear: float

    @classmethod
    def from_csv_row(cls, row: Mapping[str, str]) -> "GaiaRow":
        return cls(
            source_id=int(row["source_id"]),
            ra_deg=float(row["ra"]),
            dec_deg=float(row["dec"]),
            pmra_mas_per_yr=_opt_float(row.get("pmra")),
            pmdec_mas_per_yr=_opt_float(row.get("pmdec")),
            parallax_mas=float(row["parallax"]),
            parallax_error_mas=float(row["parallax_error"]),
            g_mag=float(row["phot_g_mean_mag"]),
            bp_rp=_opt_float(row.get("bp_rp")),
            ref_epoch_jyear=_opt_float(row.get("ref_epoch")) or GAIA_EPOCH_JYEAR,
        )


def _opt_float(value: str | None) -> float | None:
    if value is None or value == "" or value.lower() in {"null", "nan", "none"}:
        return None
    try:
        result = float(value)
    except ValueError:
        return None
    return None if math.isnan(result) else result


def spectral_class_from_bp_rp(bp_rp: float | None) -> str:
    """Bucket a BP-RP colour index into an O/B/A/F/G/K/M spectral class.

    Falls back to 'G' (Sun-like) when bp_rp is null — this is only ~0.1 %
    of the bright subset and keeps the downstream shader colour
    deterministic.
    """
    if bp_rp is None or math.isnan(bp_rp):
        return "G"
    for cutoff, letter in SPECTRAL_BUCKETS:
        if bp_rp < cutoff:
            return letter
    return "M"


def distance_pc(parallax_mas: float) -> float:
    if parallax_mas <= 0.0:
        raise ValueError(f"parallax must be > 0 (got {parallax_mas})")
    return 1000.0 / parallax_mas


def healpix_order6(source_id: int) -> int:
    return source_id // HEALPIX_ORDER6_DIVISOR


def apply_proper_motion_to_j2000(row: GaiaRow) -> tuple[float, float]:
    """Return `(ra_j2000_deg, dec_j2000_deg)` for a Gaia row.

    Formula per viz.md Appendix A.1: assume pm components are in
    mas/yr *as catalogued* (pmra already includes cos(dec) per Gaia
    convention), so we divide by cos(dec) when converting back to
    celestial RA. Delta-t is the epoch offset in tropical years.

    Missing pm values are treated as zero — safe for bright stars
    near the catalogued epoch and harmless for viz-tier positional
    accuracy (sub-arcsec budget).
    """
    delta_years = J2000_EPOCH_JYEAR - row.ref_epoch_jyear  # -16 for DR3
    pmra = row.pmra_mas_per_yr or 0.0
    pmdec = row.pmdec_mas_per_yr or 0.0
    dec_rad = math.radians(row.dec_deg)
    cos_dec = math.cos(dec_rad) or 1.0  # poles → don't divide by zero
    ra_j2000 = row.ra_deg + (pmra * delta_years * MAS_TO_DEG) / cos_dec
    dec_j2000 = row.dec_deg + pmdec * delta_years * MAS_TO_DEG
    # Wrap RA into [0, 360).
    ra_j2000 %= 360.0
    if ra_j2000 < 0:
        ra_j2000 += 360.0
    # Clamp dec — proper motion shouldn't push us past the poles at
    # anything faster than ~arcseconds per 16 yr, but clamp anyway.
    dec_j2000 = max(-90.0, min(90.0, dec_j2000))
    return ra_j2000, dec_j2000


@dataclass(frozen=True)
class GaiaEntity:
    """A Gaia source transformed into an entity-table-ready record."""

    ent_id: str
    entity_type: int
    category: int
    name: str
    aliases: list[str]
    catalog_ids: dict[str, object]
    ra_deg: float
    dec_coord_deg: float
    distance_pc: float
    properties: dict[str, object]
    healpix_order6: int
    data_source: str = "gaia_dr3"


def gaia_row_to_entity(row: GaiaRow) -> GaiaEntity:
    ra_j2000, dec_j2000 = apply_proper_motion_to_j2000(row)
    dist = distance_pc(row.parallax_mas)
    spectral = spectral_class_from_bp_rp(row.bp_rp)
    hp = healpix_order6(row.source_id)
    return GaiaEntity(
        ent_id="ENT-1000",  # Doc 17: Main Sequence placeholder; refined in Phase F.
        entity_type=1000,
        category=1,  # Doc 26 §6.2 Stars
        name=f"Gaia DR3 {row.source_id}",
        aliases=[str(row.source_id)],
        catalog_ids={"gaia_dr3": row.source_id},
        ra_deg=ra_j2000,
        dec_coord_deg=dec_j2000,
        distance_pc=dist,
        properties={
            "spectral_class": spectral,
            "magnitude_apparent": row.g_mag,
            "bp_rp": row.bp_rp,
            "parallax_mas": row.parallax_mas,
            "parallax_error_mas": row.parallax_error_mas,
            "pmra_mas_per_yr": row.pmra_mas_per_yr,
            "pmdec_mas_per_yr": row.pmdec_mas_per_yr,
            "source_epoch_jyear": row.ref_epoch_jyear,
        },
        healpix_order6=hp,
    )


def iter_entities_from_csv(csv_path: Path) -> Iterator[GaiaEntity]:
    """Stream-transform one CSV chunk (no buffering)."""
    with csv_path.open("r", encoding="utf-8", newline="") as fp:
        reader = csv.DictReader(fp)
        for raw in reader:
            try:
                row = GaiaRow.from_csv_row(raw)
                yield gaia_row_to_entity(row)
            except (KeyError, ValueError) as exc:
                log.debug("skipping malformed row %s: %s", raw.get("source_id"), exc)
                continue
