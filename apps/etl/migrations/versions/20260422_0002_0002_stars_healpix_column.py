"""Add healpix_order6 column + index to stars partitions (T-D-04).

The tile-server routes `/tiles/stars/{order}/{pixel}` query by HEALPix
pixel; we precompute the order-6 key from `source_id` at ingest time
so the query is a simple equality scan instead of a geospatial search.

Default 0 is a placeholder; the Gaia bulk loader (T-D-05) overwrites
with the real computed value from `gaia_to_entities.healpix_order6`.
Existing rows (Messier, Hipparcos) pick up 0 too — that's fine, their
tiles are addressed via the galaxy / deep-sky paths, not via stars.

Revision ID: 0002_stars_healpix_column
Create Date: 2026-04-22
"""
from __future__ import annotations

from alembic import op

revision = "0002_stars_healpix_column"
down_revision = "0001_init_core_schema"
branch_labels = None
depends_on = None

STAR_PARTITIONS = (
    "stars_bright",
    "stars_naked_eye",
    "stars_binocular",
    "stars_telescope",
    "stars_faint",
)


def upgrade() -> None:
    # Add to the parent table; partitions inherit the column.
    op.execute(
        "ALTER TABLE stars ADD COLUMN IF NOT EXISTS healpix_order6 BIGINT NOT NULL DEFAULT 0;"
    )
    # btree index per partition — Postgres 16 propagates partitioned-index
    # creation but only when the parent table has the matching declarative
    # index; doing it per-partition keeps Alembic forward-compatible.
    for part in STAR_PARTITIONS:
        op.execute(
            f"CREATE INDEX IF NOT EXISTS idx_{part}_healpix_order6 "
            f"ON {part} (healpix_order6);"
        )


def downgrade() -> None:
    for part in STAR_PARTITIONS:
        op.execute(f"DROP INDEX IF EXISTS idx_{part}_healpix_order6;")
    op.execute("ALTER TABLE stars DROP COLUMN IF EXISTS healpix_order6;")
