# viz.md — Full-Universe Visualization Backend Roadmap

> **Audience:** Claude Code working this repo autonomously.
> **Scope:** Take the project from "client-only seed catalog" (~600 entities) to "live backend serving the real observable universe" (~1.8B Gaia stars + 4M galaxies + 1.3M minor bodies, streamed via tile pyramids).
> **How to use this file:** each phase is independently shippable. Execute top-to-bottom. At the end of each phase, run the verification block — **do not advance to the next phase until verification passes**.

---

## 0. Orientation — where we are, where we're going

### 0.1 Current state (as of 2026-04-21)

- **Client** (`apps/web`) — complete. Renders ~600 named entities from client-bundled TS catalogs via procedural GLSL shaders. All 96 entity types from Doc 17 have shader coverage. Search works via in-memory index (`localSearchIndex.ts`). Fly-to + marker rendering verified for galaxies / nebulae / exotics / stars / clusters.
- **Backend** (`apps/api`, `apps/tile-server`, `apps/ephemeris`, `apps/etl`) — **scaffolded but not running**. `apps/api/src/index.ts` is a 5-line stub. Docker compose exists but `docker-compose up` has never been run against this checkout.
- **Data** — entity metadata lives in `apps/web/src/data/*.ts`. No Gaia DR3 ingested. No SDSS galaxies ingested. No SPICE kernels downloaded (Git LFS).
- **Shaders** — finished. `apps/web/src/shaders/*.{vert,frag}`. Not touched by this roadmap.

### 0.2 Target state

```
┌────────────────────────────────────────────────────────────────────┐
│                        BROWSER (unchanged)                         │
│   apps/web  →  Three.js r184 + 50 procedural shaders               │
│   Reads: ent metadata (kind, ra, dec, size) → picks shader         │
└──────────────┬─────────────────────────────────────────────────────┘
               │
      ┌────────┴─────────┐                ┌──────────────────────┐
      │  API Gateway     │                │  Tile Server         │
      │  (Fastify)       │                │  (Rust/axum)         │
      │  :3000           │                │  :3001               │
      │  /entities       │                │  /tiles/stars/...    │
      │  /search         │                │  /tiles/galaxies/... │
      │  /solar-system   │                │  Binary HEALPix      │
      └────────┬─────────┘                └──────────┬───────────┘
               │                                     │
               ↓                                     ↓
      ┌────────────────────────────────────────────────────────────┐
      │  Postgres 16 + PostGIS 3.4  ←──  Elasticsearch 8.x         │
      │  stars, galaxies, nebulae, small_bodies, exoplanets        │
      │  (magnitude partitioned)    Redis Cluster (rate limit)     │
      └────────────────────────────────────────────────────────────┘
               ↑
               │  Airflow DAGs
      ┌────────┴─────────────────────────────────────────────────┐
      │ ETL (Python)                                             │
      │   gaia_dr3.py    → 1.8B stars (HEALPix tiled)            │
      │   sdss_dr18.py   → 4M galaxies                           │
      │   mpc_asteroid.py → 1.3M small bodies                    │
      │   exoplanet_archive.py → 5.8K exoplanets                 │
      │   jpl_de441.py   → SPICE kernels                         │
      └──────────────────────────────────────────────────────────┘
```

### 0.3 What does NOT change

- **Shaders** — 50 GLSL files in `apps/web/src/shaders/`. Procedural-only rule (CLAUDE.md #1) stays. No textures downloaded from backend.
- **Client fallback** — client-bundled TS catalogs stay as the "first paint" + offline fallback. 600 famous entities remain in `apps/web/src/data/*.ts`.
- **Typecheck** — `pnpm typecheck` must stay green after every commit.
- **Test budget** — 130+ client catalog tests must stay green. New backend tests add; they don't replace.

---

## 1. Pre-flight checks

Run these **once** before starting Phase A. Abort if any fails.

### 1.1 Toolchain present

```bash
node --version       # ≥ 20
pnpm --version       # ≥ 8
docker --version     # ≥ 24
docker compose version   # ≥ 2.24
rustc --version      # ≥ 1.75
python --version     # ≥ 3.11
```

On Windows: Docker Desktop must be running with WSL2 backend. Verify:

```bash
docker run --rm hello-world
```

If this fails, stop and ask user to start Docker Desktop.

### 1.2 Git LFS

SPICE kernels (~600 MB) live in Git LFS per CLAUDE.md §Repository Structure.

```bash
git lfs install
git lfs ls-files | head -5
```

If LFS not installed → `winget install -e --id GitHub.GitLFS` (Windows) or `brew install git-lfs` (mac).

### 1.3 Disk budget

Reserve on primary disk:

| Artifact | Size |
|----------|------|
| Postgres `pgdata` volume | 200 GB (full Gaia) |
| Elasticsearch index | 40 GB |
| Gaia DR3 raw CSVs (during ingest) | 120 GB (deletable after) |
| SPICE kernels (LFS) | 0.6 GB |
| Tile pyramid (generated) | 40 GB |

For dev bring-up through Phase D, **20 GB is enough**. Full production (Phase F+) needs the 200 GB.

### 1.4 Port conflicts

Verify nothing is listening on the ports we'll grab:

```bash
# Windows
netstat -ano | findstr "5432 6379 9200 3010 3001 3002 5173"
# Unix
lsof -iTCP -sTCP:LISTEN -n -P | egrep ':5432|:6379|:9200|:3010|:3001|:3002|:5173'
```

Expected output: only the Vite dev server on `:5173` (that's ours). Anything else → free the port first.

### 1.4.1 Port conventions — host vs container

The API service runs on container port **3000** but is published on host port
**3010** by `infra/docker/docker-compose.yml`. The remap exists because host
port 3000 is routinely held by other local dev servers on this workstation
(an unrelated WSL-attached Vite instance). Keeping container ports on their
native values means inter-service URLs inside the compose network stay
unchanged (`http://api:3000`, etc.); only **host-side verify commands** need
3010.

| Service | Container port | Host port | Host URL used by verify commands |
|---|---|---|---|
| postgres | 5432 | 5432 | `postgresql://cosmos:…@localhost:5432/cosmos` |
| redis | 6379 | 6379 | `redis://localhost:6379` |
| elasticsearch | 9200 | 9200 | `http://localhost:9200` |
| **api** | **3000** | **3010** | `http://localhost:3010/…` |
| tile-server | 3001 | 3001 | `http://localhost:3001/…` |
| ephemeris | 3002 | 3002 | `http://localhost:3002/…` |

All subsequent `curl http://localhost:3000/…` references in this file and
`viz-tasks.md` have been rewritten to **3010** on the host side. If you see
bare `3000` inside a `Dockerfile` HEALTHCHECK or inside a container-to-container
URL, it's correct — that's container-internal.

### 1.5 References

Claude Code should read these docs lazily (only when the current phase references them):

| Phase | Required doc |
|-------|-------------|
| A, B, J | `docs/25-backend-architecture.md`, `docs/32-release-and-deployment.md` |
| B | `docs/26-api-contract-specification.md` |
| C, D, F, G, I | `docs/23-spatial-universe-database.md`, `docs/33-data-accuracy-and-validation.md` |
| E | `docs/26-api-contract-specification.md` §7, `docs/12-performance-and-optimization.md` |
| H | `docs/25-backend-architecture.md` §9 |
| All | `docs/29-security-specification.md` |

---

## 2. Phases

Each phase has:
- **Goal** — what "done" looks like
- **Files touched** — absolute paths
- **Steps** — imperative commands
- **Verify** — exact preview / curl / bash checks
- **Success criteria** — binary pass/fail
- **Rollback** — how to undo if the phase breaks prod

### Conventions

- **`P_` prefix** for phase ids (`P_BE_A`, `P_DATA_GAIA`).
- **Commit convention** per CLAUDE.md: `feat(api): P_BE_B initial /search/autocomplete endpoint`.
- **Branch per phase**: `feat/viz-P_BE_A-docker-up`. PR at end of phase. Green CI + 1 CODEOWNER before merge.
- **One phase = one PR** unless the phase explicitly splits.

---

### Phase A — Docker bring-up + Postgres schema (P_BE_A)

**Goal:** `docker compose up -d` on a clean checkout starts Postgres 16 + PostGIS 3.4 + Redis 7 + Elasticsearch 8 + api stub + tile-server stub + ephemeris stub. Schemas created. `curl localhost:3010/health` returns 200.

**Files touched:**
- `infra/docker/docker-compose.yml` — add healthchecks, volume mounts, `.env` support
- `apps/etl/migrations/versions/0001_initial_schema.py` — create entity tables
- `apps/api/src/server.ts` + `apps/api/src/routes/health.ts` — minimal Fastify with /health
- `apps/api/package.json` — add `fastify`, `pg`, `@elastic/elasticsearch`, `ioredis`
- `.env.example` — document DATABASE_URL, REDIS_URL, ELASTICSEARCH_URL, NASA_API_KEY, etc.

**Steps:**

1. Pick up existing compose; add a `.env.example` at repo root:
   ```env
   POSTGRES_PASSWORD=cosmos_dev_changeme
   NASA_API_KEY=DEMO_KEY
   GAIA_DATA_DIR=./data/raw/gaia
   SPICE_KERNEL_DIR=./data/spice
   ```
2. Create initial migration `apps/etl/migrations/versions/0001_initial_schema.py`. Schema per Doc 23 §6:
   - `entities(ent_id, name, kind, category, position GEOGRAPHY, distance_pc, magnitude, metadata JSONB, created_at, updated_at)` — unified entity table with PostGIS `GEOGRAPHY(Point)` for cone-search.
   - `stars` — inherits entities; partitioned by magnitude bucket (Doc 23 §6.4). 10 partitions: mag ≤ 0, 0..4, 4..6, 6..8, 8..10, 10..12, 12..14, 14..16, 16..18, > 18.
   - `galaxies`, `nebulae`, `small_bodies`, `exoplanets`, `clusters`, `lss_structures` — per-category tables.
   - Indexes: `CREATE INDEX entities_position_gist ON entities USING GIST(position);` + btree on `ent_id`, `kind`.
3. Write `apps/api/src/server.ts` with:
   - Fastify instance
   - `/health` returning `{ status: 'ok', uptime, version }`
   - CORS for `localhost:5173`
   - Graceful shutdown on SIGTERM
4. Update `infra/docker/Dockerfile.api` to build the real TS server:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
   COPY apps/api ./apps/api
   COPY packages ./packages
   RUN corepack enable && pnpm install --frozen-lockfile --filter api...
   CMD ["pnpm", "--filter", "api", "start"]
   ```
5. Run it:
   ```bash
   cd infra/docker
   docker compose up -d postgres redis elasticsearch
   # Wait for healthy
   docker compose ps
   # Run migration
   cd apps/etl
   pip install -r requirements.txt
   alembic upgrade head
   # Bring up API
   cd ../../infra/docker
   docker compose up -d api
   ```

**Verify** (run all; all must pass):

```bash
# A.1 Postgres reachable + PostGIS enabled
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "SELECT postgis_version();"
# Expect: "3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1"

# A.2 Entities table exists with PostGIS geom column
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "\d entities"
# Expect: position column typed `geography(Point,4326)`

# A.3 Redis reachable
docker exec cosmos-redis redis-cli PING   # PONG

# A.4 Elasticsearch reachable
curl -sf http://localhost:9200/_cluster/health | jq '.status'
# Expect: "green" or "yellow"

# A.5 API health
curl -sf http://localhost:3010/health | jq
# Expect: { "status": "ok", "uptime": <number>, "version": "0.1.0" }

# A.6 Typecheck still clean
pnpm typecheck
```

**Preview verification:** N/A — backend-only at this phase, no client change.

**Success criteria:** all 6 checks return expected output. `docker compose ps` shows `Up (healthy)` for postgres/redis/elasticsearch/api.

**Rollback:**
```bash
docker compose down -v      # remove volumes too (reset pgdata)
git revert <phase-a-sha>
```

**Estimated effort:** 1-2 days.

---

### Phase B — API Gateway MVP (P_BE_B)

**Goal:** `/entities/ent/{ent_id}` and `/search/autocomplete` work against Postgres + Elasticsearch. Client can toggle `VITE_API_BASE_URL=http://localhost:3010/v1` and search/lookups hit the backend instead of TS fallback. Client fallback path still works when backend is down.

**Files touched:**
- `apps/api/src/routes/entities.ts` — GET /entities/ent/:ent_id, GET /entities/:id
- `apps/api/src/routes/search.ts` — GET /search, /search/autocomplete, /search/cone
- `apps/api/src/routes/solar-system.ts` — GET /solar-system/bodies
- `apps/api/src/db/pool.ts` — pg pool, parameterized queries only (Doc 29 §SQLi)
- `apps/api/src/es/client.ts` — Elasticsearch client
- `apps/api/src/middleware/rate-limit.ts` — Redis-backed token bucket (Doc 26 §13)
- `apps/api/tests/*.test.ts` — integration tests with testcontainers
- `apps/web/src/api/apiClient.ts` — already exists; add automatic fallback to `localSearchIndex` on 5xx / network error
- `apps/web/.env.development` — `VITE_API_BASE_URL=http://localhost:3010/v1`

**Steps:**

1. Implement schema per Doc 26 §5, §6, §9 — **exact field names matter** for the generated client (`packages/api-client`).
2. For `/search/autocomplete`:
   - Query Elasticsearch index `entities_autocomplete` with `completion suggester` on `name` field.
   - Rate-limited: 60 req/min anonymous, 300 registered (Doc 26 §13).
   - Response cached in Redis 60s per query key.
3. For `/entities/ent/{ent_id}`:
   - Single Postgres SELECT by `ent_id`. Parameterized — NEVER string concat (Doc 29 §SQL).
   - Response ETag'd so client can revalidate cheaply.
4. Client-side fallback (`apps/web/src/api/apiClient.ts`):
   - If fetch throws or status ≥ 500, fall through to `localSearchIndex` with `source: 'fallback'` flag.
   - Log via `console.warn('[api] falling back to local seed')` — not an error.

**Verify:**

```bash
# B.1 Seed a test entity
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "
INSERT INTO entities(ent_id, name, kind, category, position, distance_pc, magnitude)
VALUES('TEST-andromeda', 'Andromeda Galaxy', 'spiral', 'galaxies',
       ST_SetSRID(ST_MakePoint(10.6847, 41.2688)::geography, 4326),
       778000, 3.44);
"

# B.2 Fetch it via API
curl -sf http://localhost:3010/v1/entities/ent/TEST-andromeda | jq
# Expect: { ent_id: 'TEST-andromeda', name: 'Andromeda Galaxy', kind: 'spiral', ... }

# B.3 Autocomplete hits Elasticsearch
curl -sf 'http://localhost:3010/v1/search/autocomplete?q=androm' | jq '.suggestions[0]'
# Expect: { text: 'Andromeda Galaxy', ent_id: 'TEST-andromeda', ... }

# B.4 Rate limiting
for i in {1..100}; do curl -so /dev/null -w "%{http_code}\n" http://localhost:3010/v1/search/autocomplete?q=x; done | sort | uniq -c
# Expect: some 429s once you pass 60/min
```

**Preview verification:**

```javascript
// B.5 — inside preview_eval. Client should route via API and succeed.
(async () => {
  // Flip to real API
  localStorage.setItem('VITE_API_BASE_URL_OVERRIDE', 'http://localhost:3010/v1');
  window.location.reload();
  await new Promise(r => setTimeout(r, 3500));
  // Now perform a search
  const inp = document.querySelector('[data-testid="search-input"]');
  inp.focus(); inp.click();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(inp, 'Androm'); inp.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 600));
  const opts = [...document.querySelectorAll('[role="option"]')];
  // Verify at least one result came from network, not localSearchIndex fallback.
  const netReqs = performance.getEntriesByType('resource').filter(r => r.name.includes('/v1/search/autocomplete'));
  return {
    resultCount: opts.length,
    networkHits: netReqs.length,
    lastStatus: netReqs.at(-1)?.responseStatus,
  };
})()
// Expect: resultCount ≥ 1, networkHits ≥ 1, lastStatus = 200
```

```javascript
// B.6 — fallback path: stop API, verify client still works.
// Run externally: `docker compose stop api`
// Then:
(async () => {
  window.location.reload();
  await new Promise(r => setTimeout(r, 3500));
  const inp = document.querySelector('[data-testid="search-input"]');
  inp.focus(); inp.click();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(inp, 'Androm'); inp.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 600));
  const opts = [...document.querySelectorAll('[role="option"]')];
  return { resultCount: opts.length, msg: 'should still show Andromeda from local seed' };
})()
// Expect: resultCount ≥ 1 — fallback must kick in transparently.
```

**Success criteria:**
- B.1–B.4 all pass.
- B.5 shows network hit with 200 status.
- B.6 shows client still works with backend down (fallback transparency preserved).
- `pnpm --filter api test` green (integration tests with testcontainers).
- Client typecheck green.

**Rollback:**
```bash
docker compose stop api
# Remove VITE_API_BASE_URL override in localStorage
# Client falls back to seed automatically.
```

**Estimated effort:** 3-4 days.

---

### Phase C — ETL seed from client TS catalogs (P_ETL_SEED)

**Goal:** One-shot ETL job reads `apps/web/src/data/*.ts` catalogs and upserts into Postgres. After this phase, the DB mirrors everything the client currently has in TS. Source of truth shifts to DB for entities that exist in both places; client TS stays as offline fallback.

**Files touched:**
- `apps/etl/cosmos_etl/seed/from_ts_catalog.py` — load + transform + upsert
- `apps/etl/cosmos_etl/seed/ts_parser.py` — parse TS AST (use `esprima` or run through tsc → JSON)
- `apps/etl/dags/seed_from_ts.py` — Airflow DAG wrapping the script
- `apps/etl/tests/test_seed.py` — integration test

**Steps:**

1. Simplest path: add a one-off Node script `apps/etl/scripts/export-ts-catalog.ts` that imports all TS catalogs and writes JSON to `data/seed/entities.json`. Python reads the JSON (no TS parsing in Python).
2. Python ETL:
   - Reads `entities.json`.
   - For each record, compute `position = ST_MakePoint(ra, dec)::geography`.
   - Upsert by `ent_id` (ON CONFLICT DO UPDATE).
   - Index into Elasticsearch `entities_autocomplete` with `name` + `aliases`.
3. Airflow DAG: daily schedule, idempotent.

**Verify:**

```bash
# C.1 Run the export
pnpm --filter etl export:ts-catalog
ls -la data/seed/entities.json
# Expect: JSON file with ~600 records

# C.2 Run the ETL
cd apps/etl
python -m cosmos_etl.seed.from_ts_catalog

# C.3 Count in Postgres
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "
SELECT category, count(*) FROM entities GROUP BY category ORDER BY 2 DESC;
"
# Expect: galaxies 38+, nebulae 40+, stars 180+, exotic 18+, small_bodies 20+, etc.

# C.4 Andromeda via API matches TS values
curl -sf http://localhost:3010/v1/entities/ent/GAL-m31 | jq '{ra_deg, dec_deg, distance_pc}'
# Expect: { ra_deg: 10.6847, dec_deg: 41.2688, distance_pc: 778000 }

# C.5 Elasticsearch index populated
curl -sf http://localhost:9200/entities_autocomplete/_count | jq
# Expect: count ≥ 600
```

**Preview verification:**

```javascript
// C.6 — same search should now hit backend (not fallback) and return identical results.
(async () => {
  // Ensure API is the source
  localStorage.setItem('VITE_API_BASE_URL_OVERRIDE', 'http://localhost:3010/v1');
  window.location.reload();
  await new Promise(r => setTimeout(r, 3500));

  // Test 5 entities from different categories that exist in both TS and DB.
  const queries = ['Andromeda', 'Orion Nebula', 'Sgr A', 'Pleiades', 'Vesta'];
  const hits = [];
  const inp = document.querySelector('[data-testid="search-input"]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  inp.focus();
  for (const q of queries) {
    setter.call(inp, ''); inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 100));
    setter.call(inp, q); inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const firstResult = [...document.querySelectorAll('[role="option"]')]
      .find(o => !o.textContent.includes('⌕'));
    hits.push({ q, found: !!firstResult, text: firstResult?.textContent.slice(0, 50) });
  }
  const netHits = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('/v1/')).length;
  return { hits, netHits };
})()
// Expect: all 5 found, netHits ≥ 5
```

**Success criteria:**
- DB entity count ≥ current TS catalog total.
- `/entities/ent/GAL-m31` returns Andromeda with exact TS values (regression-proof).
- Client preview works identically to Phase 0 (same 5 entity searches succeed).
- Airflow DAG runs green.

**Rollback:** DB row count is the test. Drop tables and re-run migration:
```bash
alembic downgrade base && alembic upgrade head
```

**Estimated effort:** 2 days.

---

### Phase D — Gaia DR3 bright subset (P_DATA_GAIA_SUBSET)

**Goal:** Load the brightest 1M Gaia DR3 stars (mag ≤ 10) into Postgres. Client tile pyramid for star tiles now has real data at HEALPix order ≤ 5 (coarse tiles). Visible improvement: zooming into Orion constellation region shows real Gaia stars instead of just the 180 IAU-named anchors.

**Files touched:**
- `apps/etl/cosmos_etl/downloaders/gaia_dr3.py` — download + chunk
- `apps/etl/cosmos_etl/transformers/gaia_to_entities.py` — convert (RA, Dec, parallax, mag, color) → entity row
- `apps/etl/dags/ingest_gaia_bright.py`

**Steps:**

1. Subset query from Gaia ESA Archive:
   ```sql
   SELECT source_id, ra, dec, parallax, phot_g_mean_mag, bp_rp
   FROM gaiadr3.gaia_source
   WHERE phot_g_mean_mag < 10
     AND parallax > 0
   ```
   Result: ~1.2M rows, ~400 MB CSV.
2. Download via `astroquery.gaia` (Python). Split by HEALPix pixel (order 6) for tile-friendly grouping.
3. Transform:
   - `distance_pc = 1000 / parallax_mas`
   - `spectral_class` from `bp_rp` color index (hot→cool: O/B/A/F/G/K/M)
   - `kind = 'mainseq'` (or protostar/giant/etc. later via HR diagram regression)
4. Upsert into `stars_mag_0_4` / `stars_mag_4_6` / `stars_mag_6_8` / `stars_mag_8_10` partitions.

**Verify:**

```bash
# D.1 Row count per partition
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "
SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE relname LIKE 'stars_mag_%' ORDER BY relname;
"
# Expect: ~1.2M total distributed across 4 partitions (mag 0-4: ~500; 4-6: ~10k; 6-8: ~200k; 8-10: ~1M)

# D.2 Famous stars present
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "
SELECT ent_id, name, distance_pc FROM entities WHERE name IN ('Sirius', 'Vega', 'Betelgeuse');
"
# Expect: 3 rows with values close to the existing TS catalog (Doc 33 tolerance ±5%).

# D.3 Cone search returns neighbors of Sirius within 5 pc
curl -sf 'http://localhost:3010/v1/search/cone?ra=101.2875&dec=-16.7161&radius_deg=10&max_distance_pc=5' | jq '.count, .items[0]'
# Expect: count ≥ 5 (Procyon, Ross 614, etc.)
```

**Preview verification:**

```javascript
// D.4 — zoom to Sirius and confirm more nearby stars render than before.
(async () => {
  const e = window.__cosmosEngine;
  // Fly to Sirius sky direction
  e.flyToCelestialCoord(101.2875, -16.7161, 2.637, { durationSec: 0, entId: 'HIP-32349', label: 'Sirius' });
  await new Promise(r => setTimeout(r, 2000));

  // Count star-point meshes in the scene that are within 1000 scene units
  // of the camera (sub-5pc neighborhood at stellar scale).
  let count = 0;
  const camPos = e.camera.position.clone();
  e.scene.traverse(obj => {
    if (obj.isPoints && obj.name.includes('star')) {
      const geom = obj.geometry;
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const d = Math.hypot(pos.getX(i) - camPos.x, pos.getY(i) - camPos.y, pos.getZ(i) - camPos.z);
        if (d < 1000) count++;
      }
    }
  });
  return { nearbyStarCount: count };
})()
// Expect: nearbyStarCount ≥ 50 (was < 10 pre-Gaia).
```

**Screenshot QA:** take `preview_screenshot` before/after Gaia ingest pointing at Orion constellation. Visual diff should show 10x more visible stars. Save to `tests/visual/orion-pre-gaia.jpg` and `orion-post-gaia.jpg`.

**Success criteria:**
- 1M+ rows in `stars_mag_*` tables.
- Famous star cross-validation (D.2) within Doc 33 tolerance.
- Preview scene shows real Gaia star density increase.

**Rollback:**
```bash
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "TRUNCATE stars CASCADE;"
```

**Estimated effort:** 4-5 days (bulk of time is download + ingest runtime, not code).

---

### Phase E — Rust tile server + star tile streaming (P_TILES)

**Goal:** Tile-server serves binary star tiles at `/tiles/stars/{order}/{pixel}` per Doc 26 §7 format. Client's `TileStreamingManager` fetches tiles as camera moves. At stellar regime, 500k–1M stars visible.

**Files touched:**
- `apps/tile-server/src/routes/star_tiles.rs`
- `apps/tile-server/src/healpix.rs` — healpix pixel → Postgres query plan
- `apps/tile-server/src/encoding.rs` — binary tile encoder (16-byte header + 16 bytes/star, little-endian, Doc 26 §7)
- `apps/tile-server/src/cache.rs` — Redis + in-memory LRU
- `apps/web/src/engine/TileStreamingManager.ts` — already exists; verify it reads the real tile format

**Steps:**

1. Rust handler:
   - Query `stars` table by HEALPix pixel index (pre-computed column).
   - Build binary buffer per Doc 26 §7.1: header (4 magic + 4 version + 4 star_count + 4 reserved) + per-star payload (x_f32, y_f32, z_f32, rgba_u32).
   - Return with `Cache-Control: public, max-age=86400` + ETag.
2. Redis caching — first request computes tile, subsequent requests return cached bytes.
3. Verify client decoder matches: `packages/tile-decoder/src/decoder.ts` already has the spec. Run the round-trip test.

**Verify:**

```bash
# E.1 Tile endpoint returns correct magic + version
curl -sf 'http://localhost:3001/tiles/stars/3/42' -o /tmp/tile.bin
xxd /tmp/tile.bin | head -2
# Expect: first 4 bytes = "STRT" (0x53 0x54 0x52 0x54), next 4 bytes = version uint32

# E.2 Redis cache hit
curl -sf 'http://localhost:3001/tiles/stars/3/42' -w '%{time_total}s\n' -o /dev/null
curl -sf 'http://localhost:3001/tiles/stars/3/42' -w '%{time_total}s\n' -o /dev/null
# Expect: 2nd request ≤ 10ms (cache hit)

# E.3 Load test (target: 50K req/s per Doc 25 §5)
wrk -t4 -c100 -d10s 'http://localhost:3001/tiles/stars/3/42'
# Expect: ≥ 50000 Requests/sec
```

**Preview verification:**

```javascript
// E.4 — activate stellar regime, verify tiles stream in.
(async () => {
  const e = window.__cosmosEngine;
  // Zoom out to stellar regime (distance ~10 pc → 5000 units)
  e.flyToCelestialCoord(180, 0, 50, { durationSec: 0, label: 'star_field' });
  await new Promise(r => setTimeout(r, 3000));

  const tileReqs = performance.getEntriesByType('resource')
    .filter(r => r.name.includes('/tiles/stars/'));
  const tileFieldVisible = e.starTileField?.group?.visible;
  return {
    tileRequests: tileReqs.length,
    avgTileFetchMs: tileReqs.reduce((a, r) => a + r.duration, 0) / Math.max(1, tileReqs.length),
    tileFieldVisible,
    tilesMounted: e.tileStreaming?.mountedTileCount ?? null,
  };
})()
// Expect: tileRequests ≥ 12 (viewport frustum), avgTileFetchMs < 100, tilesMounted ≥ 10
```

**Success criteria:**
- Tile magic/version correct.
- Cache latency < 10ms on repeat.
- wrk benchmark ≥ 50K req/s.
- Preview shows tile-driven star field in stellar regime.

**Rollback:** client's existing fallback (client-only star seed) activates automatically on tile-server 5xx.

**Estimated effort:** 5-6 days.

---

### Phase F — Full Gaia DR3 ingestion (P_DATA_GAIA_FULL)

**Goal:** All 1.8B Gaia DR3 rows in Postgres. Tile pyramid regenerated at orders 0-10. Client can navigate to any sky direction and see real star density.

**Scope warning:** This is the biggest phase. 120 GB of CSV downloads, 200 GB Postgres storage, ~48 h ingest runtime on a single node. Consider running on an EC2 c6i.2xlarge or equivalent.

**Files touched:**
- `apps/etl/cosmos_etl/downloaders/gaia_dr3.py` — remove mag < 10 filter, add chunked resumable downloader
- `apps/etl/cosmos_etl/loaders/gaia_bulk.py` — `COPY FROM STDIN` bulk loader (Postgres native, ~10x faster than INSERT)
- `apps/etl/cosmos_etl/pipelines/generate_tile_pyramid.py` — per-tile aggregation for orders 0-5 (downsample to magnitude-prioritized subset)

**Verify:** same as Phase D but with larger expected counts. Particular check: total row count ≥ 1.8e9.

**Preview verification:** same E.4 scenario but at Coma cluster sky direction — expect galaxy tiles AND dense star tiles together.

**Success criteria:** Doc 23 §6.4 census matches. Tile pyramid regenerated across orders 0-10. Client fps ≥ 55 at mid-tier GPU (Doc 12).

**Estimated effort:** 2 weeks (mostly runtime-waiting).

---

### Phase G — SDSS DR18 / HyperLEDA galaxies (P_DATA_GALAXY)

**Goal:** 4M galaxies ingested. Galaxy tile pyramid at HEALPix orders 4-8 (Doc 23 §17). Client's galaxy tile streaming works.

**Files touched:**
- `apps/etl/cosmos_etl/downloaders/sdss_dr18.py`
- `apps/etl/cosmos_etl/downloaders/hyperleda.py`
- `apps/tile-server/src/routes/galaxy_tiles.rs`

**Verify:** galaxy count 4M+. Cone search at Virgo Cluster center returns 500+ members.

**Preview verification:** fly-to Virgo Cluster → visible galaxy field around cluster core.

**Estimated effort:** 1 week.

---

### Phase H — SPICE ephemeris service (P_EPHEM)

**Goal:** `/ephemeris/{naifId}?jd=...` returns real-time heliocentric state vector from JPL DE441 kernels. Solar system Time slider at arbitrary date → planets in correct positions (Doc 26 §8).

**Files touched:**
- `apps/ephemeris/calculator.py` — already scaffolded; verify it wraps SpiceyPy correctly
- `data/spice/` — download DE441 + planetary constants kernels (Git LFS)
- `apps/ephemeris/ephemeris_service.py` — FastAPI /ephemeris + /ephemeris/batch
- `apps/web/src/engine/EphemerisSampler.ts` — already exists; verify WebSocket push works

**Verify:**

```bash
# H.1 Earth position today vs JPL Horizons reference
curl -sf 'http://localhost:3002/ephemeris/399?jd=2460800.5' | jq
# Cross-check manually against https://ssd.jpl.nasa.gov/horizons/app.html#/
# Expect: position agreement within 1e-6 AU (Doc 33 tolerance)

# H.2 Batch request for all 8 planets
curl -sf -X POST http://localhost:3002/ephemeris/batch \
  -H 'content-type: application/json' \
  -d '{"naif_ids":[199,299,399,499,599,699,799,899],"jd":2460800.5}' \
  | jq '.bodies | length'
# Expect: 8
```

**Preview verification:** scrub time slider forward 6 months, verify Earth + Mars positions change accordingly (observation mode).

**Estimated effort:** 3-4 days.

---

### Phase I — NASA Exoplanet Archive sync (P_DATA_EXO)

**Goal:** Client's 5.8K exoplanets come from daily archive sync, not hand-curated TS.

**Files touched:**
- `apps/etl/cosmos_etl/downloaders/exoplanet_archive.py`
- `apps/etl/dags/exoplanet_daily.py` — Airflow daily schedule

**Verify:** Proxima b, TRAPPIST-1e, Kepler-186f all present with correct host distances.

**Estimated effort:** 2 days.

---

### Phase J — Production deploy (P_DEPLOY)

**Goal:** Staging environment reachable from the internet. HTTPS. CDN fronting tile-server. Monitoring dashboards live.

**Files touched:**
- `infra/terraform/` — AWS or GCP (per Doc 32 choice)
- `infra/k8s/` — Helm charts per service
- `docs/32-release-and-deployment.md` — update with actual infra choices

**Blocking:** requires user decision on cloud provider + budget. **Ask before starting.**

**Estimated effort:** 2-3 weeks.

---

## 3. Testing framework — how Claude Code verifies each phase

### 3.1 Preview MCP setup

The Vite dev server must be running. Check and start if needed:

```javascript
// In Claude Code conversation:
// 1. Check if preview is running
// preview_list — look for name: "web-dev", status: "running"
// 2. If not running:
// preview_start({ name: "web-dev" })
```

If `.claude/launch.json` doesn't exist, create it:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "web-dev", "runtimeExecutable": "pnpm", "runtimeArgs": ["--filter", "web", "dev"], "port": 5173 }
  ]
}
```

### 3.2 The four verification modes

| Mode | Tool | When to use |
|------|------|-------------|
| **Text assertion** | `preview_eval` → return JSON | Counts, names, booleans (fast, reliable) |
| **Structural snapshot** | `preview_snapshot` | Accessibility tree, element presence |
| **Visual proof** | `preview_screenshot` | Show user the working feature |
| **Runtime debug** | `preview_console_logs`, `preview_network` | Diagnose shader errors, failed fetches |

**Default to text assertion.** Screenshot only to share proof with user. Never rely on screenshots for pass/fail — `preview_eval` returns JSON that's cheap and deterministic.

### 3.3 Standard test prologue

Every Phase's preview test should start with:

```javascript
(async () => {
  // 1. Reload to pick up latest source
  window.location.reload();
  await new Promise(r => setTimeout(r, 3500));
  // 2. Check for runtime errors before continuing
  // (Run preview_console_logs({ level: 'error' }) separately — abort if any)
})()
```

### 3.4 Determinism hazards

- **Debounce races** — search debounces 150ms. Tests that rapidly fire search queries must wait ≥ 500ms between queries, not chain reads against the previous setter.
- **Fly-to animation** — defaults to `~12 s` for extragalactic targets. Pass `{ durationSec: 0 }` in tests to skip animation.
- **Tile streaming** — async. Wait 2-3s after a regime change before asserting tile count.
- **reduced-motion** — `useSettingsStore.getState().reducedMotion` affects animation paths. Tests should set it explicitly.

### 3.5 Regression suite (run before every PR)

```bash
# 1. Unit + integration
pnpm test
# 2. Typecheck
pnpm typecheck
# 3. Lint
pnpm lint
# 4. E2E smoke (Playwright)
pnpm --filter web test:e2e
# 5. Preview-based visual smoke — run the test block below
```

```javascript
// Preview smoke suite — runs all 5 known-good entity flights + asserts each renders.
// Put this in apps/web/e2e/smoke.spec.ts as a Playwright test or
// run manually via preview_eval.
(async () => {
  const e = window.__cosmosEngine;
  const cases = [
    { entId: 'GAL-m31',           expectKind: 'galaxy' },
    { entId: 'NEB-m42',           expectKind: 'nebula' },
    { entId: 'EXO-sgr-a-star',    expectKind: 'exotic' },
    { entId: 'OC-oc-pleiades',    expectKind: 'galaxy' }, // dsph proxy
    { entId: 'GAL-m104',          expectKind: 'galaxy' },
  ];
  const results = [];
  for (const c of cases) {
    e.flyToCelestialCoord(100, 0, 100, { entId: c.entId, label: c.entId, durationSec: 0 });
    const marker = e.scene.children.find(o => o.name === 'SearchTargetMarker');
    const mesh = marker?.children.find(o => o.name === `SearchTargetMarker:${c.expectKind}`);
    results.push({ entId: c.entId, pass: !!mesh });
  }
  e.clearSearchTargetMarker();
  const failing = results.filter(r => !r.pass);
  return { passed: results.length - failing.length, total: results.length, failing };
})()
// Expect: { passed: 5, total: 5, failing: [] }
```

---

## 4. Decision points — ask user before committing to any

| Question | When | Default if user doesn't respond |
|----------|------|---------------------------------|
| **Cloud provider** (AWS / GCP / Hetzner)? | Before Phase J | Pause — don't default |
| **Full Gaia ingest on dev machine or dedicated box?** | Before Phase F | Dedicated box (c6i.2xlarge) |
| **CDN for tiles** (CloudFront / Cloudflare)? | Phase J | Cloudflare (lower cost) |
| **Elasticsearch self-hosted or OpenSearch?** | Phase B | Self-hosted OSS |
| **Redis** single-node or cluster? | Phase B (dev) / Phase J (prod) | Single-node for dev, cluster for prod |
| **SPICE kernel version** (DE441 full / DE440 light)? | Phase H | DE441 (covers 1550-2650) |
| **Telemetry** (OTel / Datadog / Grafana Cloud)? | Phase J | Grafana Cloud (free tier) |
| **Backup cadence**? | Phase J | Daily pg_dump + weekly snapshot |

---

## 5. Risk register + rollback strategy

### 5.1 Phase-level risk rating

| Phase | Risk | Rollback cost |
|-------|------|--------------|
| A | Low | < 1 min (docker down) |
| B | Medium | 5 min (revert commit, restart stub) |
| C | Low | DB truncate + re-run |
| D | Medium | Hours (re-download if corrupt) |
| E | Medium | Client fallback auto-activates |
| F | **High** | Days (120 GB re-download) |
| G | Medium | Hours |
| H | Low | Re-copy SPICE kernels |
| I | Low | Daily DAG re-runs |
| J | **High** | Infra-level — DNS, TLS, DB restore from backup |

### 5.2 Cross-phase invariants that must NEVER break

1. **Client offline mode** — `apps/web` must always bundle a working seed (600 entities). Verify via `docker compose stop api && <search test>`.
2. **Shader count** — number of GLSL files in `apps/web/src/shaders/` must not decrease. `ls apps/web/src/shaders/ | wc -l` before + after each phase.
3. **Existing tests green** — 130 client catalog tests + preview smoke suite must stay green.
4. **Procedural-only rule** (CLAUDE.md #1) — no textures added. `find apps/web/public -name '*.png' -o -name '*.jpg'` count ≤ 3 (CMB, SFD dust, skybox).
5. **Performance budget** — FPS ≥ 55 mid-tier (Doc 12). Measure via `PerformanceMonitor.getSnapshot()` in preview after each tile-streaming change.

### 5.3 Fail-safe patterns

- **Dual-read:** during Phase C, client queries API first; falls back to TS on error. Flip env var `VITE_FORCE_LOCAL_FALLBACK=true` to reverse instantly.
- **Feature flag for tile streaming:** `useSettingsStore.tileStreamingEnabled` — user can disable remote tiles and run client-seed-only.
- **Freeze window** for large ingests: pause Airflow DAGs during preview sessions so data doesn't shift mid-test.

---

## 6. Timeline estimate

| Phase | Effort | Who blocks who |
|-------|--------|----------------|
| A — Docker + schema | 1-2 days | Blocks B |
| B — API MVP | 3-4 days | Blocks C |
| C — ETL seed from TS | 2 days | Unblocks D, G, I in parallel |
| D — Gaia bright subset | 4-5 days | Sequential |
| E — Tile server | 5-6 days | Unblocks F |
| F — Full Gaia | 2 weeks (most is waiting) | — |
| G — SDSS galaxies | 1 week | Parallel with F |
| H — SPICE ephemeris | 3-4 days | Independent |
| I — Exoplanet sync | 2 days | Independent |
| J — Production deploy | 2-3 weeks | Requires A-I done |

**Total serial:** ~8-10 weeks of engineering if one person works sequentially.
**Parallelizable floor:** ~5 weeks if C/D/E run sequentially but G/H/I run parallel once C is done.

---

## 7. Claude Code daily workflow

### 7.1 Resume after interruption

1. Read `git log --oneline main..HEAD` — see where we left off.
2. Read this file's "Phase" section matching the latest commit scope (`feat(api): P_BE_B...`).
3. Re-run that phase's **verify** block. If it passes → phase is done, move to next. If it fails → resume work on that phase.
4. If verify passes but tests fail → fix tests first, don't advance.

### 7.2 Reporting progress to user

After each **phase** (not each commit):

```
Phase <X> complete.
  DB rows: <count>   API p95: <ms>   Client fps: <fps>
  Verify: <pass/pass/pass/pass>
  Screenshots: <paths or MCP ids>
  Blocked-on: <decision-point ref or 'none'>
  Next: Phase <X+1>
```

After each **commit** inside a phase: nothing (commit message is enough).

### 7.3 When to ESCALATE (ask user, don't decide)

- Any item in §4 (decision points).
- Any rollback that affects uncommitted work.
- Any cost-implication decision (cloud spend, managed DB upgrade).
- Any security-impacting choice (secrets rotation, TLS renewal, CORS change).
- Any data mutation on production once Phase J lands.

### 7.4 Commit-message scopes

Per CLAUDE.md §Git and the phase-prefix convention:

- `feat(api): P_BE_B /entities/ent/:id route + tests`
- `feat(etl): P_DATA_GAIA ingest mag ≤ 10 bright subset`
- `feat(tile-server): P_TILES /tiles/stars handler with redis cache`
- `chore(infra): P_BE_A postgres healthcheck tune`
- `perf(api): P_BE_B ETag + 304 response for /entities/:id`
- `docs(viz): update viz.md Phase C success criteria`

---

## 8. Files this roadmap creates/modifies — final list

| Phase | Path | Action |
|-------|------|--------|
| A | `infra/docker/docker-compose.yml` | edit |
| A | `apps/api/src/server.ts` | new |
| A | `apps/api/src/routes/health.ts` | new |
| A | `apps/etl/migrations/versions/0001_initial_schema.py` | new |
| A | `.env.example` | new |
| B | `apps/api/src/routes/entities.ts` | new |
| B | `apps/api/src/routes/search.ts` | new |
| B | `apps/api/src/routes/solar-system.ts` | new |
| B | `apps/api/src/db/pool.ts` | new |
| B | `apps/api/src/es/client.ts` | new |
| B | `apps/api/src/middleware/rate-limit.ts` | new |
| B | `apps/web/src/api/apiClient.ts` | edit (fallback) |
| C | `apps/etl/cosmos_etl/seed/from_ts_catalog.py` | new |
| C | `apps/etl/scripts/export-ts-catalog.ts` | new |
| C | `apps/etl/dags/seed_from_ts.py` | new |
| D | `apps/etl/cosmos_etl/downloaders/gaia_dr3.py` | new |
| D | `apps/etl/cosmos_etl/transformers/gaia_to_entities.py` | new |
| E | `apps/tile-server/src/routes/star_tiles.rs` | new |
| E | `apps/tile-server/src/healpix.rs` | new |
| E | `apps/tile-server/src/encoding.rs` | new |
| E | `apps/tile-server/src/cache.rs` | new |
| F | `apps/etl/cosmos_etl/loaders/gaia_bulk.py` | new |
| F | `apps/etl/cosmos_etl/pipelines/generate_tile_pyramid.py` | new |
| G | `apps/etl/cosmos_etl/downloaders/sdss_dr18.py` | new |
| G | `apps/etl/cosmos_etl/downloaders/hyperleda.py` | new |
| G | `apps/tile-server/src/routes/galaxy_tiles.rs` | new |
| H | `apps/ephemeris/ephemeris_service.py` | edit |
| H | `data/spice/de441.bsp` | LFS add |
| I | `apps/etl/cosmos_etl/downloaders/exoplanet_archive.py` | new |
| I | `apps/etl/dags/exoplanet_daily.py` | new |
| J | `infra/terraform/` | new tree |
| J | `infra/k8s/` | new tree |

---

## 9. End-state checklist

When every phase is done, this file should show all checkboxes ticked:

- [ ] A — `docker compose up -d` starts everything healthy
- [ ] B — `/entities` + `/search/autocomplete` return real data
- [ ] C — Postgres mirrors client TS catalog (600+ entities)
- [ ] D — Gaia bright subset (1.2M stars) queryable
- [ ] E — Tile server serves binary tiles < 10ms cached
- [ ] F — Full 1.8B Gaia DR3 ingested
- [ ] G — 4M SDSS/HyperLEDA galaxies ingested
- [ ] H — Ephemeris matches JPL Horizons within 1e-6 AU
- [ ] I — NASA Exoplanet Archive syncing daily
- [ ] J — Staging URL reachable over HTTPS with CDN + monitoring

At end-state, the client seed catalog becomes what it was always meant to be: a thin offline-first cache, not the source of truth.

---

## Appendix A — Common gotchas Claude Code should watch for

1. **ICRS epoch drift**: Gaia is J2016.0 natively; database stores J2000.0 per CLAUDE.md. ETL must apply proper motion correction: `ra_j2000 = ra_j2016 - pmra * 16yr / cos(dec)`.
2. **parallax < 0**: Gaia reports negative parallax for sources with noise >> signal. Filter `parallax > 0 AND parallax_error / parallax < 0.2` before computing distance.
3. **Camera-relative rendering** (CLAUDE.md #4): tiles ship absolute positions but render subtracts camera world pos every frame. Tile payload stays absolute; don't bake in the camera offset.
4. **Log depth buffer** (CLAUDE.md #6): every new shader must use `gl_FragDepth = log2(z) * coef`. No standard depth writes.
5. **No `any` in TS**: per CLAUDE.md conventions. If backend returns unknown JSON, parse with Zod first.
6. **Redis eviction**: tile cache uses `allkeys-lru` policy. Don't put critical data in the same Redis as tile cache — use a separate DB index.
7. **Postgres connection count**: pg default is 100 connections. Tile server at 50K req/s will blow this. Use pgbouncer in transaction-pooling mode before Phase E.
8. **Elasticsearch mapping changes**: `PUT /index/_mapping` is append-only. Field type changes require reindex. Pin schema before Phase B goes to production.
9. **Airflow timezone**: DAG `start_date` must be UTC. Mixing local time breaks backfills.
10. **Git LFS quotas**: GitHub LFS free tier is 1 GB storage + 1 GB/mo bandwidth. DE441 kernels (~600 MB) + pattern of frequent re-checkout can exhaust this quickly. Consider GCS/S3 instead for production.

## Appendix B — Reference commands (paste as-is)

```bash
# Quick state check
docker compose ps
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "SELECT count(*) FROM entities;"
curl -sf http://localhost:3010/health
curl -sf http://localhost:3001/health
curl -sf http://localhost:9200/_cluster/health

# Kill everything, start over
docker compose down -v
docker compose up -d

# Tail logs for a specific service
docker compose logs -f api
docker compose logs -f tile-server

# Connect to Postgres interactively
docker exec -it cosmos-postgres psql -U cosmos -d cosmos

# Run a single Airflow DAG locally
cd apps/etl
airflow dags test seed_from_ts $(date -u +%Y-%m-%d)
```

---

**End of viz.md.** Execute Phase A to begin.
