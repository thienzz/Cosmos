"""Catalog version registry (data/catalogs/VERSIONS.json).

Mirrors the `catalog_registry` Postgres table. Writers update this file atomically,
then run the ETL which inserts/updates rows + fires data_version_update WS event
per Doc 26 §14.3.4.
"""
from __future__ import annotations

import hashlib
import json
import os
import tempfile
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

VERSIONS_PATH = Path(
    os.environ.get(
        "COSMOS_VERSIONS_JSON",
        Path(__file__).resolve().parents[3] / "data" / "catalogs" / "VERSIONS.json",
    )
)


@dataclass
class CatalogVersion:
    name: str                           # e.g. "messier", "ngc", "gaia_dr3_bright"
    version: str                        # e.g. "2026.Q1.3", or upstream tag "DR3"
    source_url: str
    record_count: Optional[int] = None
    sha256: Optional[str] = None        # Hash of the downloaded raw file
    ingested_at: Optional[str] = None   # ISO-8601 UTC
    license: Optional[str] = None
    notes: Optional[str] = None

    @classmethod
    def make(cls, name: str, version: str, source_url: str, **kwargs) -> "CatalogVersion":
        return cls(
            name=name,
            version=version,
            source_url=source_url,
            ingested_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            **kwargs,
        )


@dataclass
class CatalogVersions:
    """Top-level VERSIONS.json shape."""

    schema_version: int = 1
    global_version: str = "2026.Q1.3"   # Bumped on any catalog change — clients check this.
    catalogs: dict[str, CatalogVersion] = field(default_factory=dict)

    @classmethod
    def load(cls, path: Path | None = None) -> "CatalogVersions":
        p = path or VERSIONS_PATH
        if not p.exists():
            return cls()
        raw = json.loads(p.read_text(encoding="utf-8"))
        cats = {
            name: CatalogVersion(**meta) for name, meta in (raw.get("catalogs") or {}).items()
        }
        return cls(
            schema_version=raw.get("schema_version", 1),
            global_version=raw.get("global_version", "2026.Q1.3"),
            catalogs=cats,
        )

    def save(self, path: Path | None = None) -> Path:
        """Atomic write: tmp file + rename."""
        p = path or VERSIONS_PATH
        p.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "schema_version": self.schema_version,
            "global_version": self.global_version,
            "catalogs": {name: asdict(cv) for name, cv in self.catalogs.items()},
        }
        fd, tmp_path = tempfile.mkstemp(prefix=".versions.", suffix=".json", dir=str(p.parent))
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, sort_keys=True)
                f.write("\n")
            os.replace(tmp_path, p)
        except Exception:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise
        return p

    def upsert(self, cv: CatalogVersion) -> None:
        self.catalogs[cv.name] = cv

    def bump_global(self, new_version: str) -> None:
        self.global_version = new_version


def sha256_file(path: Path, chunk: int = 1 << 16) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(chunk), b""):
            h.update(block)
    return h.hexdigest()
