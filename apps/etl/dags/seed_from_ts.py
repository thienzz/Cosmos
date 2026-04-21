"""Airflow DAG: seed_from_ts — T-C-04.

Daily pass that idempotently loads data/seed/entities.json (produced by
`pnpm seed:export`, T-C-01) into Postgres + Elasticsearch. Two linear
tasks so a failure at the ES layer doesn't force a Postgres re-ingest:

    export_seed  → load_postgres  → index_elasticsearch

The `export_seed` step shells out to `pnpm seed:export` so the JSON is
regenerated from the authoritative client catalogs on every run. On
dev laptops without pnpm on PATH we skip this step cleanly.

Catchup is disabled so Airflow doesn't backfill historical runs —
this DAG carries no per-run state.
"""
from __future__ import annotations

import subprocess
from datetime import datetime, timedelta
from pathlib import Path

from airflow import DAG
from airflow.operators.python import PythonOperator

from cosmos_etl.seed.from_ts_catalog import ingest as ingest_postgres
from cosmos_etl.seed.to_elasticsearch import reindex as reindex_es

DEFAULT_ARGS = {
    "owner": "cosmos-data",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=2),
    "execution_timeout": timedelta(minutes=15),
}


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def task_export_seed() -> str:
    """Regenerate data/seed/entities.json from TS catalogs.

    Soft-fail if pnpm isn't on PATH (e.g. inside a slim Airflow worker
    image). The subsequent load/index steps will still work against the
    last committed JSON.
    """
    cwd = _repo_root()
    try:
        subprocess.run(
            ["pnpm", "seed:export"],
            cwd=str(cwd),
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except FileNotFoundError:
        return "skipped: pnpm not on PATH — using committed entities.json"
    except subprocess.CalledProcessError as err:
        raise RuntimeError(f"pnpm seed:export failed: {err.stderr}") from err
    return "ok: data/seed/entities.json regenerated"


def task_load_postgres() -> dict[str, int]:
    summary = ingest_postgres()
    if summary["errors"] > 0:
        raise RuntimeError(f"ingest_postgres reported {summary['errors']} row errors")
    return summary


def task_index_elasticsearch() -> dict[str, int]:
    summary = reindex_es()
    if summary["errors"] > 0:
        raise RuntimeError(f"reindex_es reported {summary['errors']} errors")
    return summary


with DAG(
    dag_id="seed_from_ts",
    description="Daily seed of client TS catalogs → Postgres + Elasticsearch (T-C-04)",
    default_args=DEFAULT_ARGS,
    schedule="@daily",
    start_date=datetime(2026, 4, 22),
    catchup=False,
    max_active_runs=1,
    tags=["seed", "phase-c"],
) as dag:
    export_seed = PythonOperator(
        task_id="export_seed",
        python_callable=task_export_seed,
    )
    load_postgres = PythonOperator(
        task_id="load_postgres",
        python_callable=task_load_postgres,
    )
    index_elasticsearch = PythonOperator(
        task_id="index_elasticsearch",
        python_callable=task_index_elasticsearch,
    )

    export_seed >> load_postgres >> index_elasticsearch
