"""T-D-04 — add stars.healpix_order6 for tile lookups.

Why order 6: 12 * 4^6 = 49,152 pixels over the full sphere →
~1.3 arcmin per pixel. With ~1.8B Gaia stars, that lands ≈ 36k
stars per pixel (full DR3) or ≈ 25 per pixel for the mag<10 bright
subset — a good granularity for tile queries via the tile-server
(Phase E) without exhausting pg_indexes.

The column defaults to 0 on existing rows; the downloader/bulk
loader (T-D-05) will populate it during insert. A downstream
backfill will need to recompute for rows inserted before this
migration but we don't have any yet (stars_* partitions are empty
today).

Revision ID: 0002_add_healpix_column
Create Date: 2026-04-22
"""
from __future__ import annotations

from alembic import op

revision = "0002_stars_healpix_column"
down_revision = "0001_init_core_schema"
branch_labels = None
depends_on = None


_PARTITIONS = ("bright", "naked_eye", "binocular", "telescope", "faint")


def upgrade() -> None:
    # Postgres 16's ATTACH PARTITION + ALTER on the parent adds the
    # column to every partition in one shot. The BIGINT choice is
    # deliberate — HEALPix order-13 (the deepest the client will
    # ever request) produces pixel ids up to 800 million which
    # fits in INTEGER, but future-proofing against nside > 8192 is
    # free with BIGINT.
    op.execute(
        "ALTER TABLE stars ADD COLUMN IF NOT EXISTS healpix_order6 BIGINT NOT NULL DEFAULT 0;"
    )
    for part in _PARTITIONS:
        # Per-partition btree — composite with mag_g keeps the
        # partition-pruning planner happy on tile-range queries.
        op.execute(
            f"CREATE INDEX IF NOT EXISTS idx_stars_{part}_healpix6 "
            f"ON stars_{part} (healpix_order6);"
        )


def downgrade() -> None:
    for part in _PARTITIONS:
        op.execute(f"DROP INDEX IF EXISTS idx_stars_{part}_healpix6;")
    op.execute("ALTER TABLE stars DROP COLUMN IF EXISTS healpix_order6;")
