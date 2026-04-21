"""Airflow DAG: stellar_ingest (T40).

Chains the T40 stellar-catalog pipeline end-to-end:

  ingest_hipparcos ─▶ build_star_tiles ─▶ notify_data_version_update

The Hipparcos downloader lands rows into `entities` + `stars` + Elasticsearch.
`build_star_tiles` runs the Node tile-pyramid writer that reads the raw
catalog CSV (short-term: filesystem; post-Gaia-ingest: Postgres `COPY TO`)
and emits binary tiles to `data/tiles-hipparcos/`, ready for the Rust
`FilesystemTileStore` (and later `PostgresTileStore`) to serve.

Gaia DR3 G<16, HD, WDS, SB9, GCVS downloaders hang off this DAG as they
land — they share the same bucket/manifest logic.

Spec: Doc 23 §6.1.2 (stellar catalogs), Doc 23 §17 (catalog integration),
Doc 25 §7.1 (tile server), Doc 11 §4.1 (tile format).
"""
from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
from airflow.operators.python import PythonOperator

DEFAULT_ARGS = {
    "owner": "cosmos-data",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=4),
}

REPO_ROOT = Path(__file__).resolve().parents[3]


def _run_hipparcos(**_) -> int:
    from cosmos_etl.downloaders import hipparcos

    n = hipparcos.run()
    if n == 0:
        raise RuntimeError("hipparcos downloader returned 0 rows")
    return n


def _notify_version(**_) -> bool:
    from cosmos_etl.versions import CatalogVersions
    from cosmos_etl.ws_notifier import notify_data_version_update

    versions = CatalogVersions.load()
    return notify_data_version_update(
        old_version="unknown",
        new_version=versions.global_version,
        message=f"Stellar ingest complete — global_version={versions.global_version}",
    )


with DAG(
    dag_id="stellar_ingest",
    default_args=DEFAULT_ARGS,
    description="T40 — Hipparcos + Gaia bright stellar ingest + tile pyramid build",
    schedule=None,  # Manual trigger; Gaia quarterly variant will set a cron.
    start_date=datetime(2026, 4, 20),
    catchup=False,
    tags=["cosmos", "etl", "t40", "stellar"],
) as dag:
    start = EmptyOperator(task_id="start")

    ingest_hipparcos = PythonOperator(
        task_id="ingest_hipparcos",
        python_callable=_run_hipparcos,
    )

    build_tiles = BashOperator(
        task_id="build_star_tiles",
        bash_command=(
            # Tile-pyramid writer is a Node script — Airflow calls it via bash
            # so the ETL Python env doesn't need Node deps.
            f"cd {REPO_ROOT} && node scripts/build-star-tiles.mjs "
            f"--out {REPO_ROOT / 'data' / 'tiles-hipparcos'}"
        ),
    )

    notify = PythonOperator(
        task_id="notify_data_version_update",
        python_callable=_notify_version,
    )

    end = EmptyOperator(task_id="end")

    start >> ingest_hipparcos >> build_tiles >> notify >> end
