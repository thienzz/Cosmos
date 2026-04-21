#!/usr/bin/env bash
# scripts/seed-catalog.sh — T38.3 master driver.
#
# Runs the full ETL seed pipeline end-to-end in a fresh environment:
#   1. Apply Alembic migrations (creates Doc 25 §4 schema)
#   2. Apply Elasticsearch index template + create index
#   3. Run each catalog downloader in dependency order
#   4. Fire data_version_update WebSocket event via the API
#
# Usage:
#   scripts/seed-catalog.sh                    # run everything
#   scripts/seed-catalog.sh --catalog messier  # single catalog
#   scripts/seed-catalog.sh --dry-run          # parse/validate, no DB/ES writes
#   scripts/seed-catalog.sh --skip-migrate     # assume schema already up
#   scripts/seed-catalog.sh --notify           # fire WS event without re-ingesting
#
# Env vars:
#   DATABASE_URL           postgresql://cosmos:cosmos_dev@localhost:5432/cosmos
#   ELASTICSEARCH_URL      http://localhost:9200
#   API_BASE_URL           http://localhost:3000
#   ETL_INTERNAL_SECRET    shared secret for /v1/internal/data-version-update
#
# Doc references:
#   Doc 25 §4 (schema), Doc 25 §8 (ETL), Doc 23 §6 (catalogs),
#   Doc 26 §14.3.4 (data_version_update), Doc 33 §10 (validation).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ETL_DIR="$REPO_ROOT/apps/etl"

CATALOG=""
DRY_RUN=0
SKIP_MIGRATE=0
NOTIFY_ONLY=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --catalog)
            CATALOG="$2"; shift 2 ;;
        --dry-run)
            DRY_RUN=1; shift ;;
        --skip-migrate)
            SKIP_MIGRATE=1; shift ;;
        --notify)
            NOTIFY_ONLY=1; shift ;;
        -h|--help)
            sed -n '2,25p' "$0"; exit 0 ;;
        *)
            echo "unknown flag: $1" >&2; exit 2 ;;
    esac
done

: "${DATABASE_URL:=postgresql://cosmos:cosmos_dev@localhost:5432/cosmos}"
: "${ELASTICSEARCH_URL:=http://localhost:9200}"

export DATABASE_URL ELASTICSEARCH_URL

log() { printf '[seed-catalog] %s\n' "$*"; }

if [[ "$NOTIFY_ONLY" -eq 1 ]]; then
    log "notify-only mode — firing data_version_update"
    cd "$ETL_DIR"
    python -c "
from cosmos_etl.versions import CatalogVersions
from cosmos_etl.ws_notifier import notify_data_version_update
v = CatalogVersions.load()
ok = notify_data_version_update(old_version='manual', new_version=v.global_version, message='Manual notify')
print('notify result:', ok)
"
    exit 0
fi

if [[ "$SKIP_MIGRATE" -eq 0 ]]; then
    log "applying Alembic migrations to $DATABASE_URL"
    cd "$ETL_DIR"
    alembic upgrade head
fi

log "applying Elasticsearch index template at $ELASTICSEARCH_URL"
python "$ETL_DIR/elasticsearch/apply_template.py"

cd "$ETL_DIR"
CATALOGS=(messier)
# Future catalogs land here as T39–T48 wire them up (ngc ic caldwell sharpless
# barnard lbn ldn strasbourg_pn green_snr harris_gc dias_oc hipparcos hd
# gaia_dr3_bright wds gcvs hyperleda sdss_dr17 milliquas abell planck_sz
# mpc_asteroids jpl_comets nasa_exoplanet_archive atnf_pulsar mcgill_magnetar
# tns fermi_4fgl gwtc3).

if [[ -n "$CATALOG" ]]; then
    CATALOGS=("$CATALOG")
fi

DRY_FLAG=""
if [[ "$DRY_RUN" -eq 1 ]]; then
    DRY_FLAG="--dry-run"
fi

for cat in "${CATALOGS[@]}"; do
    log "ingest $cat ($DRY_FLAG)"
    python -m "cosmos_etl.downloaders.$cat" $DRY_FLAG
done

if [[ "$DRY_RUN" -eq 0 ]]; then
    log "firing data_version_update"
    python -c "
from cosmos_etl.versions import CatalogVersions
from cosmos_etl.ws_notifier import notify_data_version_update
v = CatalogVersions.load()
ok = notify_data_version_update(
    old_version='unknown',
    new_version=v.global_version,
    message=f'Seed catalog ingest complete — global_version={v.global_version}',
)
print('notify result:', ok)
"
fi

log "done"
