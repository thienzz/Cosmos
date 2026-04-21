"""Per-catalog download + parse + load modules.

Each module exposes a `run(db_url: str | None = None, versions: CatalogVersions | None = None)`
entrypoint that is idempotent + resumable. See `messier.py` as the reference
implementation; the full catalog list is at Doc 23 §6.1.
"""
