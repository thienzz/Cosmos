"""T-D-01 — Gaia DR3 bright-subset downloader.

Fetches `gaiadr3.gaia_source` rows with `phot_g_mean_mag <= magnitude_max`
(default 10), good parallax (`parallax > 0` and `parallax_error/parallax < 0.2`
per Appendix A.2 of viz.md), and saves the result as CSV chunks under
`data/raw/gaia/`.

Chunking: Gaia DR3 `source_id` encodes HEALPix order 12 in the top bits
(`source_id / 2**35` = healpix12_index). We derive an order-6 key from that
(`healpix12 / 4**6 = healpix12 / 4096`) and split the sky into 48 × 1024-pixel
bands — each band downloads independently so the pipeline is resumable and
parallelisable. 48 bands × ~ few-MB-each keeps the whole bright subset
under 1 GB and lets a single-chunk verify complete in <2 min.

Resumable: a chunk is "done" if its CSV file exists and passes a 1-line
header sanity check. `--resume` (default) skips done chunks; `--force`
re-downloads.

Usage:
    python -m cosmos_etl.downloaders.gaia_dr3 --magnitude-max 10
    python -m cosmos_etl.downloaders.gaia_dr3 --chunks 0           # one band
    python -m cosmos_etl.downloaders.gaia_dr3 --test-sample 100    # tiny smoke
"""
from __future__ import annotations

import argparse
import csv
import logging
import os
import sys
import time
from pathlib import Path
from typing import Iterable, Sequence

log = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUTPUT_DIR = REPO_ROOT / "data" / "raw" / "gaia"

# HEALPix NSIDE = 2^12 = 4096 for Gaia DR3 source-id encoding (top 59 bits).
# Dividing by 2**35 gives the order-12 pixel index; `/ 4096` drops to order 6
# (NSIDE=64, 49152 pixels total). 49152 / 1024 = 48 bands.
BAND_COUNT = 48
BAND_SIZE = 49_152 // BAND_COUNT  # = 1024 pixels per band

GAIA_COLUMNS = (
    "source_id",
    "ra",
    "dec",
    "pmra",
    "pmdec",
    "parallax",
    "parallax_error",
    "phot_g_mean_mag",
    "bp_rp",
    "ref_epoch",
)


def chunk_filename(band: int, magnitude_max: float) -> str:
    return f"dr3_bright_mag{magnitude_max:g}_band{band:03d}.csv"


def build_adql(band: int, magnitude_max: float, limit: int | None = None) -> str:
    """Build the ADQL query for a given band."""
    pixel_lo = band * BAND_SIZE
    pixel_hi = (band + 1) * BAND_SIZE
    # source_id / 2**35 → healpix order 12; / 4096 → order 6.
    where = (
        f"phot_g_mean_mag <= {magnitude_max:g} "
        f"AND parallax > 0 "
        f"AND parallax_error / parallax < 0.2 "
        f"AND source_id / 140737488355328 BETWEEN {pixel_lo} AND {pixel_hi - 1}"
    )
    cols = ", ".join(GAIA_COLUMNS)
    top = f"TOP {limit} " if limit else ""
    return f"SELECT {top}{cols} FROM gaiadr3.gaia_source WHERE {where}"


def chunk_is_complete(path: Path) -> bool:
    if not path.exists():
        return False
    try:
        with path.open("r", encoding="utf-8") as fp:
            first = fp.readline().strip()
        return first.startswith("source_id,")
    except OSError:
        return False


def run_gaia_query(adql: str, output_path: Path, dump_format: str = "csv") -> int:
    """Execute an ADQL query against the Gaia archive, save CSV to output_path.

    Returns row count (excludes header).
    """
    # Lazy import — astroquery does heavy network setup on import.
    from astroquery.gaia import Gaia  # type: ignore[import-untyped]

    # The archive occasionally 502s during heavy load; give ourselves a few tries.
    last_err: Exception | None = None
    for attempt in range(3):
        try:
            Gaia.ROW_LIMIT = -1  # no implicit cap
            job = Gaia.launch_job_async(
                adql,
                dump_to_file=True,
                output_file=str(output_path),
                output_format=dump_format,
                verbose=False,
            )
            _ = job.get_results()  # ensures local file is materialised
            # Count rows without re-reading (the file is on disk).
            with output_path.open("r", encoding="utf-8") as fp:
                count = sum(1 for _ in fp) - 1
            return max(0, count)
        except Exception as err:  # noqa: BLE001 — any ESA error is retryable
            last_err = err
            log.warning("gaia query attempt %d failed: %s", attempt + 1, err)
            time.sleep(5 * (attempt + 1))
    assert last_err is not None
    raise last_err


def download_band(
    band: int,
    magnitude_max: float,
    output_dir: Path,
    *,
    resume: bool,
    limit: int | None,
) -> tuple[int, Path]:
    """Download a single HEALPix band. Returns (row_count, csv_path)."""
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / chunk_filename(band, magnitude_max)
    if resume and chunk_is_complete(out_path):
        log.info("band %03d already done → %s", band, out_path.name)
        with out_path.open("r", encoding="utf-8") as fp:
            count = sum(1 for _ in fp) - 1
        return max(0, count), out_path
    adql = build_adql(band, magnitude_max, limit=limit)
    log.info("downloading band %03d | adql: %s", band, adql.replace("\n", " "))
    rows = run_gaia_query(adql, out_path)
    log.info("band %03d → %d rows", band, rows)
    return rows, out_path


def download_all(
    magnitude_max: float,
    output_dir: Path,
    bands: Sequence[int] | None = None,
    *,
    resume: bool = True,
    limit: int | None = None,
) -> int:
    """Download every band (or the passed subset). Returns total rows."""
    total = 0
    bands_iter: Iterable[int] = bands if bands is not None else range(BAND_COUNT)
    for b in bands_iter:
        count, _ = download_band(
            b, magnitude_max, output_dir, resume=resume, limit=limit
        )
        total += count
    return total


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Download Gaia DR3 bright subset")
    parser.add_argument(
        "--magnitude-max",
        type=float,
        default=10.0,
        help="upper G-band magnitude cutoff (default 10)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="where to write chunked CSVs",
    )
    parser.add_argument(
        "--chunks",
        type=str,
        default=None,
        help="comma-separated band indices (0..47). Default: all 48",
    )
    parser.add_argument("--force", action="store_true", help="re-download existing chunks")
    parser.add_argument(
        "--test-sample",
        type=int,
        default=None,
        help=(
            "if set, TOP-<N> the ADQL and bail after the first band — useful "
            "for smoke tests that complete in < 2 min."
        ),
    )
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args(argv)
    logging.basicConfig(
        level=args.log_level, format="%(asctime)s %(levelname)s %(name)s — %(message)s"
    )

    bands: list[int] | None
    if args.chunks is not None:
        bands = sorted({int(b) for b in args.chunks.split(",") if b.strip()})
    elif args.test_sample is not None:
        bands = [0]
    else:
        bands = None

    total = download_all(
        magnitude_max=args.magnitude_max,
        output_dir=args.output_dir,
        bands=bands,
        resume=not args.force,
        limit=args.test_sample,
    )
    log.info("download complete — %d rows across %s bands", total, len(bands) if bands else BAND_COUNT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
