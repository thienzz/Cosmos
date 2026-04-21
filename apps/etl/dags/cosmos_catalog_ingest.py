"""Airflow DAG: cosmos_catalog_ingest (T38).

Orchestrates per-catalog downloaders in parallel after T38.1 schema + ES are in
place. Per Doc 25 §8.1 the pipeline phases are:
    download → validate → preprocess → cross-match → dedupe → classify → load → index → notify.

This DAG is the *framework* — each catalog task group invokes its downloader
module. Messier is the only fully-wired reference implementation at T38.2 ship;
others are stubs that log a TODO and return success so the DAG shape can be
verified end-to-end.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator

DEFAULT_ARGS = {
    "owner": "cosmos-data",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(hours=2),
}

CATALOG_MODULES = [
    ("messier", "cosmos_etl.downloaders.messier"),
    ("solar_system", "cosmos_etl.downloaders.solar_system"),
    # T39 — solar-system completion (MPC asteroids + JPL comets stubs).
    ("mpc_asteroids", "cosmos_etl.downloaders.mpc_asteroids"),
    ("jpl_comets",    "cosmos_etl.downloaders.jpl_comets"),
    # T40 — stellar catalog ingest. Hipparcos bright subset (~70 rows) lands
    # first as the reference; full Gaia DR3 G<16 (~10M) + HD + WDS + GCVS
    # follow as each downloader lands.
    ("hipparcos",     "cosmos_etl.downloaders.hipparcos"),
    # Phase 2 additions (T40–T48) wire up as follows — stubs for now:
    # ("ngc",           "cosmos_etl.downloaders.ngc"),
    # ("ic",            "cosmos_etl.downloaders.ic"),
    # ("caldwell",      "cosmos_etl.downloaders.caldwell"),
    # ("sharpless",     "cosmos_etl.downloaders.sharpless"),
    # ("barnard",       "cosmos_etl.downloaders.barnard"),
    # ("lbn",           "cosmos_etl.downloaders.lbn"),
    # ("ldn",           "cosmos_etl.downloaders.ldn"),
    # ("strasbourg_pn", "cosmos_etl.downloaders.strasbourg_pn"),
    # ("green_snr",     "cosmos_etl.downloaders.green_snr"),
    # ("harris_gc",     "cosmos_etl.downloaders.harris_gc"),
    # ("dias_oc",       "cosmos_etl.downloaders.dias_oc"),
    # ("hd_catalog",    "cosmos_etl.downloaders.hd"),
    # ("gaia_dr3_bright", "cosmos_etl.downloaders.gaia_dr3"),
    # ("wds",           "cosmos_etl.downloaders.wds"),
    # ("gcvs",          "cosmos_etl.downloaders.gcvs"),
    # ("hyperleda",     "cosmos_etl.downloaders.hyperleda"),
    # ("sdss_dr17",     "cosmos_etl.downloaders.sdss"),
    # ("milliquas",     "cosmos_etl.downloaders.milliquas"),
    # ("abell",         "cosmos_etl.downloaders.abell"),
    # ("planck_sz",     "cosmos_etl.downloaders.planck_sz"),
    # ("nasa_exoplanet_archive", "cosmos_etl.downloaders.exoplanets"),
    # ("atnf_pulsar",   "cosmos_etl.downloaders.atnf_pulsar"),
    # ("mcgill_magnetar", "cosmos_etl.downloaders.mcgill_magnetar"),
    # ("tns",           "cosmos_etl.downloaders.tns"),
    # ("fermi_4fgl",    "cosmos_etl.downloaders.fermi_4fgl"),
    # ("gwtc3",         "cosmos_etl.downloaders.gwtc3"),
]


def _invoke_downloader(module_path: str, catalog_name: str, **_) -> int:
    """Airflow task callable — imports module + runs its `run()` entrypoint."""
    import importlib
    import logging

    log = logging.getLogger(f"cosmos.etl.{catalog_name}")
    try:
        mod = importlib.import_module(module_path)
    except ImportError:
        log.warning("module %s not implemented yet (T39–T48 follow-up); skipping", module_path)
        return 0
    if not hasattr(mod, "run"):
        raise AttributeError(f"{module_path} lacks run() entrypoint")
    n = mod.run()
    log.info("%s: ingested %d rows", catalog_name, n)
    return n


def _notify_version(**_) -> bool:
    """Fire WS data_version_update after all catalog tasks succeed."""
    from cosmos_etl.versions import CatalogVersions
    from cosmos_etl.ws_notifier import notify_data_version_update

    versions = CatalogVersions.load()
    new_version = versions.global_version
    return notify_data_version_update(
        old_version="unknown",
        new_version=new_version,
        message=f"Catalog ingest complete — global_version={new_version}",
    )


with DAG(
    dag_id="cosmos_catalog_ingest",
    default_args=DEFAULT_ARGS,
    description="Run all Cosmos catalog downloaders + notify clients",
    schedule=None,  # Manual-trigger; scheduled variants (Gaia quarterly, etc.) split later.
    start_date=datetime(2026, 4, 19),
    catchup=False,
    tags=["cosmos", "etl", "t38"],
) as dag:
    start = EmptyOperator(task_id="start")
    end = EmptyOperator(task_id="end")
    notify = PythonOperator(
        task_id="notify_data_version_update",
        python_callable=_notify_version,
    )

    prev_parallel = start
    ingest_tasks = []
    for catalog_name, module_path in CATALOG_MODULES:
        t = PythonOperator(
            task_id=f"ingest_{catalog_name}",
            python_callable=_invoke_downloader,
            op_kwargs={"module_path": module_path, "catalog_name": catalog_name},
        )
        ingest_tasks.append(t)
        start >> t >> notify

    notify >> end
