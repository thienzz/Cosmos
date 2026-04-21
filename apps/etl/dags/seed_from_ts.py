"""Airflow DAG: seed_from_ts (T-C-04).

Daily job that mirrors the client-bundled TS catalogs into Postgres + ES so
backend search and entity lookups always have a consistent base layer to
fall back on while richer ingest pipelines (Gaia, SDSS, MPC) are catching up.

Tasks (run sequentially; the second depends on the first):
    1. load_postgres   — `cosmos_etl.seed.from_ts_catalog.main()`
    2. index_elasticsearch — `cosmos_etl.seed.to_elasticsearch.main()`

Both task callables are pure-Python wrappers around the CLIs so we can run
them from `airflow dags test` without any subprocess plumbing. Both are
idempotent — re-running the DAG against an already-loaded DB is a no-op
data-wise.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

from cosmos_etl.seed import from_ts_catalog, to_elasticsearch

DEFAULT_ARGS = {
    "owner": "cosmos-data",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=2),
    "execution_timeout": timedelta(minutes=20),
}


def _load_postgres_task() -> None:
    rc = from_ts_catalog.main([])
    if rc != 0:
        raise RuntimeError(f"from_ts_catalog.main returned non-zero exit code {rc}")


def _index_elasticsearch_task() -> None:
    rc = to_elasticsearch.main([])
    if rc != 0:
        raise RuntimeError(f"to_elasticsearch.main returned non-zero exit code {rc}")


with DAG(
    dag_id="seed_from_ts",
    description="Mirror client TS catalogs into Postgres + ES (Phase C).",
    schedule="@daily",
    start_date=datetime(2026, 4, 21),  # UTC — Appendix A.9 (no local tz)
    catchup=False,
    default_args=DEFAULT_ARGS,
    tags=["seed", "phase-c"],
) as dag:
    load_postgres = PythonOperator(
        task_id="load_postgres",
        python_callable=_load_postgres_task,
    )
    index_elasticsearch = PythonOperator(
        task_id="index_elasticsearch",
        python_callable=_index_elasticsearch_task,
    )

    load_postgres >> index_elasticsearch
