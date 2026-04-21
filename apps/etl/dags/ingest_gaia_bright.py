"""Airflow DAG: ingest_gaia_bright — T-D-07.

Pulls the Gaia DR3 bright subset (G < 10) through the full ETL:

    download_chunks → bulk_load → index_elasticsearch

Unlike the seed DAG (T-C-04), this one is NOT daily — the Gaia
archive only releases new data on formal data release cadence, and
the subset is stable in between. We still schedule @monthly so
`airflow dags pause` / `unpause` is the operational switch during
large backfills; `catchup=False` keeps historical runs from
stacking up.

Downloader retries are bounded (2 + retry_delay 15m) because the
Gaia ADQL service occasionally returns 503 under load. A long
`execution_timeout` lets a cold full pull finish; dev smoke passes
can shrink it via Airflow variable override.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

from cosmos_etl.downloaders.gaia_dr3 import run as download_run
from cosmos_etl.loaders.gaia_bulk import run as bulk_load_run
from cosmos_etl.seed.to_elasticsearch import reindex as reindex_es

DEFAULT_ARGS = {
    "owner": "cosmos-data",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=15),
    "execution_timeout": timedelta(hours=6),
}


def task_download_chunks() -> list[str]:
    paths = download_run(magnitude_max=10.0, chunks=16)
    return [str(p) for p in paths]


def task_bulk_load() -> list[dict[str, int]]:
    summaries = bulk_load_run()
    total_rows = sum(s.get("rows", 0) for s in summaries)
    total_errors = sum(s.get("errors", 0) for s in summaries)
    if total_errors > 0:
        raise RuntimeError(
            f"bulk_load finished with {total_errors} transform errors across {total_rows} rows"
        )
    return summaries


def task_index_elasticsearch() -> dict[str, int]:
    summary = reindex_es()
    if summary["errors"] > 0:
        raise RuntimeError(f"reindex_es reported {summary['errors']} errors")
    return summary


with DAG(
    dag_id="ingest_gaia_bright",
    description="Gaia DR3 G<10 bright subset ingest (T-D-07)",
    default_args=DEFAULT_ARGS,
    schedule="@monthly",
    start_date=datetime(2026, 4, 22),
    catchup=False,
    max_active_runs=1,
    tags=["gaia", "phase-d"],
) as dag:
    download_chunks = PythonOperator(
        task_id="download_chunks",
        python_callable=task_download_chunks,
    )
    bulk_load = PythonOperator(
        task_id="bulk_load",
        python_callable=task_bulk_load,
    )
    index_elasticsearch = PythonOperator(
        task_id="index_elasticsearch",
        python_callable=task_index_elasticsearch,
    )

    download_chunks >> bulk_load >> index_elasticsearch
