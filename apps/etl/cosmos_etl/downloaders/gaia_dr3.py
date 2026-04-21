"""T-D-01 — Gaia DR3 bright-subset downloader.

Pulls the Gaia DR3 source table for stars with apparent magnitude
≤ `magnitude_max` (default 10) and usable parallax. Writes one CSV
chunk per HEALPix-order-6 pixel bucket into `data/raw/gaia/` so the
ingest can be resumed without re-running the (slow) Gaia ADQL query.

Intentional simplifications for the bright subset:
  - Split by `source_id % chunk_count` instead of HEALPix — the
    chunking is purely to keep per-file size reasonable and allow
    parallel loads downstream. A HEALPix-based split matters for
    T-F-04 tile-pyramid generation, not here.
  - Re-running skips chunks already on disk. Deleting a chunk forces
    its re-download.

Usage:
    python -m cosmos_etl.downloaders.gaia_dr3 --magnitude-max 10 --chunks 16
    # dev / smoke: a tiny pull
    python -m cosmos_etl.downloaders.gaia_dr3 --magnitude-max 4 --chunks 2 --limit 500

Depends on `astroquery` (already in requirements.txt).
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

log = logging.getLogger("cosmos_etl.downloaders.gaia_dr3")


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def _default_output_dir() -> Path:
    override = os.environ.get("GAIA_DATA_DIR")
    if override:
        return Path(override)
    return _repo_root() / "data" / "raw" / "gaia"


def _chunk_path(output_dir: Path, chunk_id: int) -> Path:
    return output_dir / f"dr3_chunk_{chunk_id:04d}.csv"


def _build_adql(magnitude_max: float, chunk_id: int, chunk_count: int, limit: int | None) -> str:
    """Return the ADQL SELECT for one HEALPix-sharded chunk.

    Gaia source_id bit-packs HEALPix level-12 in the high 29 bits
    (``source_id / 2**35``). That means plain ``MOD(source_id, 16)``
    buckets stars by *instrument-scan sequence*, which correlates
    strongly with sky position — so a 16-way MOD split lands 95% of
    rows in a single chunk. Shifting out the low 35 bits first gives
    a uniform HEALPix-based shard.

    Filters:
      phot_g_mean_mag < magnitude_max — bright subset.
      parallax > 0, parallax_error / parallax < 0.2 — usable distance
      (Appendix A.2 in viz.md).
    """
    where = [
        f"phot_g_mean_mag < {magnitude_max}",
        "parallax > 0",
        "parallax_error / parallax < 0.2",
        # `source_id / 34359738368` == `source_id >> 35` (level-12 HEALPix).
        f"MOD(source_id / 34359738368, {chunk_count}) = {chunk_id}",
    ]
    cols = (
        "source_id, ra, dec, pmra, pmdec, parallax, parallax_error, "
        "phot_g_mean_mag, bp_rp"
    )
    select = f"SELECT {'TOP ' + str(limit) + ' ' if limit else ''}{cols} FROM gaiadr3.gaia_source"
    return f"{select} WHERE {' AND '.join(where)}"


def download_chunk(
    chunk_id: int,
    chunk_count: int,
    magnitude_max: float,
    output_dir: Path,
    limit: int | None = None,
    resume: bool = True,
    max_retries: int = 3,
    retry_backoff_seconds: float = 20.0,
) -> Path:
    """Download a single chunk via astroquery.gaia. Returns the csv path.

    Import astroquery lazily so callers that only want `_build_adql`
    (e.g. unit tests) don't pay the astropy import cost.

    Retries transient Gaia archive 500s with exponential backoff —
    the archive has documented intermittent availability windows.
    """
    import time  # noqa: PLC0415 — lazy to keep tests light

    out = _chunk_path(output_dir, chunk_id)
    # Skip if a fully-downloaded file is already on disk. A 75-byte
    # "header only" file from a prior 0-row response is treated as
    # incomplete so the next run re-attempts.
    if resume and out.exists() and out.stat().st_size > 1024:
        log.info("chunk %04d already present at %s — skipping", chunk_id, out)
        return out

    output_dir.mkdir(parents=True, exist_ok=True)

    from astroquery.gaia import Gaia  # pylint: disable=import-outside-toplevel

    adql = _build_adql(magnitude_max, chunk_id, chunk_count, limit)
    last_err: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            log.info("chunk %04d: launching job (attempt %d)", chunk_id, attempt + 1)
            job = Gaia.launch_job_async(adql, dump_to_file=False)
            table = job.get_results()
            log.info("chunk %04d: %d rows returned", chunk_id, len(table))

            # astropy.table.Table → csv; keep headers so the transformer has
            # column names to read.
            table.write(str(out), format="csv", overwrite=True)
            return out
        except Exception as err:  # broad except: astroquery wraps many ex types
            last_err = err
            if attempt == max_retries:
                log.error("chunk %04d: giving up after %d attempts", chunk_id, attempt + 1)
                raise
            delay = retry_backoff_seconds * (2**attempt)
            log.warning(
                "chunk %04d: attempt %d failed (%s); retrying in %.0fs",
                chunk_id, attempt + 1, err, delay,
            )
            time.sleep(delay)

    assert last_err is not None
    raise last_err  # unreachable, but satisfies the type checker


def run(
    magnitude_max: float = 10.0,
    chunks: int = 16,
    limit: int | None = None,
    output_dir: Path | None = None,
    resume: bool = True,
    chunk_ids: list[int] | None = None,
    continue_on_failure: bool = True,
    max_retries_per_chunk: int = 3,
) -> list[Path]:
    """Download all chunks, returning the paths that succeeded.

    With `continue_on_failure=True` (default), a chunk that exhausts
    its retries is logged and skipped — the run finishes whatever
    chunks it can reach. Run the downloader again later with
    `--resume` to pick up the holes once the Gaia archive recovers.
    """
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    out_dir = output_dir or _default_output_dir()
    ids = chunk_ids if chunk_ids is not None else list(range(chunks))
    paths: list[Path] = []
    failed: list[int] = []
    for cid in ids:
        try:
            path = download_chunk(
                cid,
                chunk_count=chunks,
                magnitude_max=magnitude_max,
                output_dir=out_dir,
                limit=limit,
                resume=resume,
                max_retries=max_retries_per_chunk,
            )
            paths.append(path)
        except Exception as err:  # noqa: BLE001
            if not continue_on_failure:
                raise
            log.error("chunk %04d: SKIPPED after retries — %s", cid, err)
            failed.append(cid)
    if failed:
        log.warning(
            "completed with %d failed chunks %s — re-run with --resume to retry",
            len(failed), failed,
        )
    log.info("done: %d succeeded, %d failed of %d total", len(paths), len(failed), len(ids))
    return paths


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Gaia DR3 bright-subset downloader (T-D-01)")
    parser.add_argument("--magnitude-max", type=float, default=10.0)
    parser.add_argument("--chunks", type=int, default=16)
    parser.add_argument("--limit", type=int, default=None, help="TOP N rows per chunk (dev smoke)")
    parser.add_argument("--chunk", type=int, action="append", help="Only download this chunk id (repeatable)")
    parser.add_argument("--no-resume", action="store_true", help="Re-download even if csv exists")
    parser.add_argument("--output-dir", type=Path, default=None)
    args = parser.parse_args(argv[1:])

    paths = run(
        magnitude_max=args.magnitude_max,
        chunks=args.chunks,
        limit=args.limit,
        output_dir=args.output_dir,
        resume=not args.no_resume,
        chunk_ids=args.chunk,
    )
    for p in paths:
        print(p)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
