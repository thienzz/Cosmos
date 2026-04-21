"""Airflow DAG: ingest_gaia_bright (T-D-07).

Four-task pipeline for the Gaia DR3 bright subset (G<=10):

    download_chunks   → cosmos_etl.downloaders.gaia_dr3.main()
    transform_load    → cosmos_etl.loaders.gaia_bulk.main()
    index_elasticsearch → cosmos_etl.seed.to_elasticsearch.main()
    refresh_healpix   → no-op placeholder for the tile-pyramid build step
                        that lands in T-F-04; keeps the DAG shape stable
                        so later phases just slot in.

download_chunks and transform_load are both resumable/idempotent, so
DAG retries don't leave duplicate rows. The index step reuses the
T-C-03 bulk-indexer so Gaia stars appear in the autocomplete index
alongside the client-seed catalog.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

from cosmos_etl.downloaders import gaia_dr3
from cosmos_etl.loaders import gaia_bulk
from cosmos_etl.seed import to_elasticsearch

DEFAULT_ARGS = {
    "owner": "cosmos-data",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=10),
    "execution_timeout": timedelta(hours=6),
}


def _download_chunks_task() -> None:
    rc = gaia_dr3.main([])
    if rc != 0:
        raise RuntimeError(f"gaia_dr3.main returned {rc}")


def _transform_load_task() -> None:
    rc = gaia_bulk.main([])
    if rc != 0:
        raise RuntimeError(f"gaia_bulk.main returned {rc}")


def _index_elasticsearch_task() -> None:
    rc = to_elasticsearch.main([])
    if rc != 0:
        raise RuntimeError(f"to_elasticsearch.main returned {rc}")


def _refresh_healpix_task() -> None:
    # Placeholder — the COPY loader already sets healpix_order6 per-row.
    # Future T-F-04 will use this slot to rebuild the tile pyramid
    # (orders 0..10 aggregates).
    return None


with DAG(
    dag_id="ingest_gaia_bright",
    description="Download + transform + load Gaia DR3 G<=10 bright subset (Phase D).",
    schedule=None,  # triggered manually; heavy job with external dep on Gaia archive
    start_date=datetime(2026, 4, 22),  # UTC
    catchup=False,
    default_args=DEFAULT_ARGS,
    tags=["gaia", "phase-d"],
) as dag:
    download_chunks = PythonOperator(task_id="download_chunks", python_callable=_download_chunks_task)
    transform_load = PythonOperator(task_id="transform_load", python_callable=_transform_load_task)
    index_elasticsearch = PythonOperator(task_id="index_elasticsearch", python_callable=_index_elasticsearch_task)
    refresh_healpix = PythonOperator(task_id="refresh_healpix", python_callable=_refresh_healpix_task)

    download_chunks >> transform_load >> index_elasticsearch >> refresh_healpix
