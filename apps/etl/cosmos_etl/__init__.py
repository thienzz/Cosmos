"""Cosmos Explorer ETL package (T38).

Orchestrates catalog ingestion per Doc 23 §6 + Doc 25 §8. Modules:
  classify       — Doc 17 ENT-ID assignment rules (entity type + category)
  crossmatch     — SIMBAD 1″ positional cross-match utility
  versions       — data/catalogs/VERSIONS.json reader + writer
  ws_notifier    — POST data_version_update per Doc 26 §14.3.4
  downloaders.*  — per-catalog download + parse + load
"""
from .versions import CatalogVersions
from .classify import classify_ent_id
from .crossmatch import SimbadCrossMatcher

__all__ = ["CatalogVersions", "classify_ent_id", "SimbadCrossMatcher"]
