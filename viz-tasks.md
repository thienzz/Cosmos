# viz-tasks.md — Detailed task breakdown

> **Companion to [viz.md](viz.md).** Every phase in viz.md expands into atomic tasks here. Each task = 1 branch = 1 PR. Estimates in hours assume a focused Claude Code working session.
> **Task ID scheme:** `T-<phase>-<nn>`. Phase letters match viz.md (A..J).
> **Convention:** commit scope `feat(<area>): T-X-NN <title>`. Example: `feat(api): T-B-05 /entities/ent/:ent_id endpoint`.
>
> **Legend:**
> - 🟢 safe — local-only, reversible in <1 min
> - 🟡 medium — needs DB migration or multi-service restart
> - 🔴 risky — irreversible or affects shared resources; get user confirmation first

---

## Phase A — Docker bring-up (7 tasks, ~12h)

### T-A-01 — Create `.env.example` 🟢 ✅ DONE c52d066 2026-04-21
**Depends:** —  **Est:** 30m
**Goal:** One canonical source of env vars for local dev.
**Files:** `.env.example`, `.gitignore` (add `.env`)
**Do:**
1. Write `.env.example` with `POSTGRES_PASSWORD`, `NASA_API_KEY`, `GAIA_DATA_DIR`, `SPICE_KERNEL_DIR`, `REDIS_URL`, `DATABASE_URL`, `ELASTICSEARCH_URL`, `LOG_LEVEL`.
2. Add inline comments explaining which services consume which.
3. Update `.gitignore` to exclude `.env` but keep `.env.example`.
4. Add `cp .env.example .env` to `README.md` "Getting Started".
**Verify:**
```bash
test -f .env.example && cat .env.example | grep -c '^[A-Z]' # ≥ 8 vars
grep -F '.env' .gitignore
```
**Done when:** File exists, `.env` gitignored, README mentions it.

---

### T-A-02 — Docker-compose healthchecks + volume mounts 🟢 ✅ DONE 5273d23 2026-04-21
**Depends:** T-A-01  **Est:** 1h
**Goal:** `docker compose up -d` starts all 6 services and they reach `healthy` status.
**Files:** `infra/docker/docker-compose.yml`
**Do:**
1. Confirm existing compose already has healthchecks for postgres/redis/elasticsearch (it does).
2. Add bind-mount for `./data/seed:/var/cosmos/seed:ro` to api + etl containers.
3. Add `env_file: ../../.env` to services that need secrets.
4. Set `restart: unless-stopped` on api/tile-server/ephemeris.
5. Fix the ephemeris volume path if needed (should be relative to compose file).
**Verify:**
```bash
cd infra/docker && docker compose config --quiet   # no warnings
```
**Done when:** `docker compose config` is warning-free.

---

### T-A-03 — Write initial Alembic migration 🟡 ✅ DONE 83b523b 2026-04-21
**Depends:** T-A-02  **Est:** 3h
**Goal:** `alembic upgrade head` creates all 8 entity tables + indexes from scratch.
**Files:**
- `apps/etl/migrations/versions/0001_initial_schema.py` (new)
- `apps/etl/alembic.ini` (verify sqlalchemy URL)
- `apps/etl/migrations/env.py` (verify target metadata)

**Do:**
1. Enable PostGIS extension: `op.execute('CREATE EXTENSION IF NOT EXISTS postgis;')`.
2. Create `entities` parent table: `ent_id TEXT PRIMARY KEY, name TEXT, kind TEXT, category TEXT, position GEOGRAPHY(POINT, 4326), distance_pc DOUBLE PRECISION, magnitude DOUBLE PRECISION, metadata JSONB, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()`.
3. Create `stars` table partitioned by magnitude buckets (10 partitions: ≤0, 0–4, 4–6, 6–8, 8–10, 10–12, 12–14, 14–16, 16–18, >18). See Doc 23 §6.4.
4. Create `galaxies`, `nebulae`, `small_bodies`, `exoplanets`, `clusters`, `lss_structures` with category-specific columns.
5. GIST index on `entities.position` for cone-search.
6. Btree index on `entities.ent_id`, `entities.kind`, `entities.category`.
7. Write reversible `downgrade()`.
**Verify:**
```bash
cd apps/etl
alembic upgrade head
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "\dt"
# Expect 8+ tables
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "SELECT postgis_version();"
```
**Done when:** All tables present, PostGIS version prints, `alembic downgrade base` also clean.

---

### T-A-04 — Fastify server scaffold + `/health` 🟢 ✅ DONE 33c6a22 2026-04-21
**Depends:** T-A-02  **Est:** 2h
**Goal:** Replace the 5-line stub with a real Fastify server. `/health` returns 200.
**Files:**
- `apps/api/src/server.ts` (new)
- `apps/api/src/index.ts` (replace stub → call `buildServer().listen()`)
- `apps/api/src/routes/health.ts` (new)
- `apps/api/package.json` — add `fastify`, `@fastify/cors`, `pino`, `zod`
- `apps/api/tsconfig.json` — verify compilation target

**Do:**
1. `pnpm --filter api add fastify @fastify/cors pino zod`.
2. `buildServer()` returns a configured Fastify instance with pino logger + CORS (origin `http://localhost:5173`).
3. `/health` returns `{ status: 'ok', uptime: process.uptime(), version: pkg.version }`.
4. Graceful shutdown on SIGTERM via `server.close()`.
5. `src/index.ts` reads `API_PORT` env, calls `server.listen({ host: '0.0.0.0', port })`.
**Verify:**
```bash
pnpm --filter api build && pnpm --filter api start &
sleep 1
curl -sf http://localhost:3010/health | jq .status    # "ok"
kill %1
pnpm --filter api typecheck
```
**Done when:** Health returns 200, server exits cleanly on SIGTERM, typecheck clean.

---

### T-A-05 — Dockerfile.api bundles real server 🟢 ✅ DONE a67c09a 2026-04-21
**Depends:** T-A-04  **Est:** 1h
**Goal:** `docker build -f infra/docker/Dockerfile.api .` produces a working image.
**Files:** `infra/docker/Dockerfile.api`, `.dockerignore`

**Do:**
1. Multi-stage: builder (node:20-alpine + pnpm install + build) → runtime (node:20-alpine + only dist + production deps).
2. COPY order: pnpm workspace files → install → source → build.
3. HEALTHCHECK instruction: `CMD wget -qO- http://localhost:3000/health || exit 1` (container-internal — leave as 3000, not the host remap).
4. `.dockerignore` excludes `node_modules`, `dist`, `*.log`, `.env`, `coverage`.
**Verify:**
```bash
docker build -f infra/docker/Dockerfile.api -t cosmos-api:local .
docker run --rm -p 3000:3000 cosmos-api:local &
sleep 3
curl -sf http://localhost:3010/health | jq .status
docker stop $(docker ps -lq)
```
**Done when:** Build succeeds, container serves /health.

---

### T-A-06 — First `docker compose up -d` end-to-end 🟡 ✅ DONE 6890e99 2026-04-21
**Depends:** T-A-03, T-A-04, T-A-05  **Est:** 2h
**Goal:** Clean-slate `docker compose up -d` + migration → all services healthy.
**Files:** —
**Do:**
1. `docker compose down -v` (wipe any prior state).
2. `docker compose up -d postgres redis elasticsearch`.
3. Wait for all three healthy (`docker compose ps`).
4. Run `alembic upgrade head` from host (not in container yet).
5. `docker compose up -d api`.
**Verify:**
```bash
docker compose ps --format 'table {{.Service}}\t{{.Status}}' | grep -v Up | wc -l   # should print 1 (header only)
curl -sf http://localhost:3010/health | jq .status   # "ok"
```
**Done when:** 4 containers up + healthy + API reachable.

---

### T-A-07 — CI: run migrations + smoke test on PR 🟢 ✅ DONE 00ada7a 2026-04-21
**Depends:** T-A-06  **Est:** 2h
**Goal:** GitHub Actions workflow runs `docker compose up -d` + migrations + health check on every PR.
**Files:** `.github/workflows/ci-backend.yml` (new)

**Do:**
1. Workflow triggers on PRs touching `apps/api/**`, `apps/etl/migrations/**`, `infra/docker/**`.
2. Steps: checkout → setup-docker → compose up -d → wait for healthy → alembic upgrade head → curl health → compose down.
3. Timeout 10 min.
**Verify:** Push a no-op commit on a feature branch, CI goes green.
**Done when:** CI passes on a trivial change to `apps/api`.

---

## Phase B — API MVP (12 tasks, ~30h)

### T-B-01 — Install deps + base structure 🟢 ✅ DONE 61dfe49 2026-04-22
**Depends:** T-A-06  **Est:** 30m
**Goal:** All API deps present; folder structure ready.
**Do:**
1. `pnpm --filter api add pg @types/pg @elastic/elasticsearch ioredis @fastify/rate-limit @fastify/etag pino-pretty`.
2. Create empty dirs: `apps/api/src/{routes,db,es,middleware,schemas}`.
**Verify:** `pnpm --filter api typecheck` green.
**Done when:** Deps in package.json, folders exist.

---

### T-B-02 — `db/pool.ts` — Postgres pool + parameterized query helper 🟡 ✅ DONE b9d7125 2026-04-22
**Depends:** T-B-01  **Est:** 2h
**Goal:** Single source of DB connections; enforces parameterized queries.
**Files:** `apps/api/src/db/pool.ts`, `apps/api/tests/db.test.ts`

**Do:**
1. Create `pg.Pool` with size 20, idle timeout 30s.
2. Export `query<T>(text: string, params: unknown[]): Promise<T[]>` that throws if `text` contains `$` without matching `params.length`.
3. Graceful shutdown hook (`pool.end()` on SIGTERM).
4. Integration test with testcontainers: spin up Postgres, run `SELECT 1`, verify row.
**Verify:**
```bash
pnpm --filter api test src/db
```
**Done when:** Test green; TS forbids raw SQL string interpolation at type level.

---

### T-B-03 — `es/client.ts` + autocomplete index schema 🟡 ✅ DONE a39ec79 2026-04-22
**Depends:** T-B-01  **Est:** 3h
**Goal:** Elasticsearch client; `entities_autocomplete` index exists with `completion` field type.
**Files:**
- `apps/api/src/es/client.ts`
- `apps/api/src/es/schemas/entities_autocomplete.ts`
- `apps/api/scripts/bootstrap-es.ts` (idempotent index creation)

**Do:**
1. Client with `node: process.env.ELASTICSEARCH_URL`.
2. Index mapping:
   ```json
   {
     "properties": {
       "ent_id": { "type": "keyword" },
       "name": { "type": "completion", "analyzer": "simple" },
       "aliases": { "type": "completion" },
       "category": { "type": "keyword" },
       "magnitude": { "type": "float" }
     }
   }
   ```
3. Bootstrap script: create index if missing, idempotent.
4. Add `pnpm --filter api es:bootstrap` npm script.
**Verify:**
```bash
pnpm --filter api es:bootstrap
curl -sf http://localhost:9200/entities_autocomplete/_mapping | jq '.entities_autocomplete.mappings.properties.name.type'
# Expect: "completion"
```
**Done when:** Index exists, mapping correct, script is idempotent (second run no-ops).

---

### T-B-04 — Redis-backed rate-limit middleware 🟡 ✅ DONE b54ac22 2026-04-22
**Depends:** T-B-01  **Est:** 2h
**Goal:** `@fastify/rate-limit` with Redis store. 60/min anonymous, 300/min authenticated, per Doc 26 §13.
**Files:** `apps/api/src/middleware/rate-limit.ts`, `apps/api/src/plugins/redis.ts`

**Do:**
1. Fastify plugin that registers `@fastify/rate-limit` with `redis: ioRedisInstance`.
2. Key function: IP + auth token hash → distinct buckets.
3. Tier table: anonymous 60, registered 300, research 1000, internal ∞.
4. Tier detection via `Authorization: Bearer ...` JWT (placeholder for now, validate full token in Phase J).
**Verify:**
```bash
for i in {1..70}; do curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3010/v1/entities/ent/TEST; done | sort | uniq -c
# Expect: some 429s after ~60 requests
```
**Done when:** 429 returned when limit exceeded; `X-RateLimit-*` headers present on 2xx responses.

---

### T-B-05 — `GET /v1/entities/ent/:ent_id` 🟡 ✅ DONE 0542ba5 2026-04-22
**Depends:** T-B-02, T-B-04  **Est:** 2h
**Goal:** Fetch entity by string ent_id. Doc 26 §5.2 exact response schema.
**Files:**
- `apps/api/src/routes/entities.ts`
- `apps/api/src/schemas/entity.ts` (Zod)
- `apps/api/tests/routes/entities.test.ts`

**Do:**
1. Zod schema `EntityResponse`: `{ ent_id, name, kind, category, ra_deg, dec_deg, distance_pc, magnitude, metadata, _links }`.
2. Handler: SELECT by ent_id (parameterized). 404 if not found.
3. `_links.self` = `/v1/entities/ent/${ent_id}`.
4. ETag via `@fastify/etag`; 304 on matching If-None-Match.
5. Tests: 200 happy path, 404 missing, parameterized injection attempt returns 400 (malformed ent_id).
**Verify:**
```bash
# Seed
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "INSERT INTO entities(ent_id,name,kind,category,position,distance_pc,magnitude) VALUES('TEST-1','Test','spiral','galaxies',ST_SetSRID(ST_MakePoint(10,40)::geography,4326),1000,9.0);"
curl -sf http://localhost:3010/v1/entities/ent/TEST-1 | jq .ent_id   # "TEST-1"
curl -o /dev/null -w '%{http_code}\n' http://localhost:3010/v1/entities/ent/NONEXISTENT   # 404
```
**Done when:** All tests green, ETag works, SQL injection attempts don't leak.

---

### T-B-06 — `GET /v1/entities/:id` (numeric) 🟡
**Depends:** T-B-05  **Est:** 1h
**Goal:** Fetch by NAIF id or numeric catalog id.
**Files:** `apps/api/src/routes/entities.ts` (extend)
**Do:**
1. Route `/v1/entities/:id` where `:id` must be numeric (regex constraint).
2. Query: `SELECT * FROM entities WHERE (metadata->>'naif_id')::bigint = $1`.
3. 404 if missing; same ETag logic.
**Verify:** `curl -sf http://localhost:3010/v1/entities/399 | jq .name` (Earth, assuming seeded).
**Done when:** NAIF lookup works, string ids correctly routed to T-B-05.

---

### T-B-07 — `GET /v1/search/autocomplete` 🟡
**Depends:** T-B-03, T-B-04  **Est:** 3h
**Goal:** Typing-speed prefix suggestions via Elasticsearch completion suggester.
**Files:** `apps/api/src/routes/search.ts`, `apps/api/tests/routes/search.test.ts`

**Do:**
1. Query params: `q` (min 1 char), `category?`, `limit?` (default 10, max 20).
2. ES query: `suggest: { name_sug: { prefix: q, completion: { field: 'name' } } }`.
3. Response per Doc 26 §6.1: `{ suggestions: [{ text, ent_id, id?, category, category_name, magnitude, ... }], query, took_ms }`.
4. Cache in Redis 60s per `(q, category)` key.
5. Tests: empty q returns 400, known prefix returns hits, rate-limit engaged.
**Verify:**
```bash
# After seeding "Andromeda Galaxy" into ES
curl -sf 'http://localhost:3010/v1/search/autocomplete?q=androm' | jq '.suggestions[0].text'
# Expect: "Andromeda Galaxy"
# Latency
curl -sf 'http://localhost:3010/v1/search/autocomplete?q=androm' -w '%{time_total}\n' -o /dev/null
# Expect: < 0.1s P50
```
**Done when:** P95 latency < 50ms, cache hit on repeat, tests green.

---

### T-B-08 — `GET /v1/search` (full-text) 🟡
**Depends:** T-B-07  **Est:** 2h
**Goal:** Full-text entity search with filters.
**Files:** `apps/api/src/routes/search.ts` (extend)

**Do:**
1. Query params: `q`, `category?`, `magnitude_max?`, `distance_max_pc?`, `limit?`, `offset?`.
2. ES query with filters + pagination.
3. Response: `{ items, total, limit, offset, _links: { next?, prev? } }` per Doc 26 §6.2.
**Verify:**
```bash
curl -sf 'http://localhost:3010/v1/search?q=andromeda&category=galaxies' | jq '.items[0].name'
```
**Done when:** Filters narrow results correctly; pagination works.

---

### T-B-09 — `GET /v1/search/cone` 🟡
**Depends:** T-B-02  **Est:** 2h
**Goal:** Spatial cone search via PostGIS.
**Files:** `apps/api/src/routes/search.ts` (extend)

**Do:**
1. Query params: `ra`, `dec`, `radius_deg`, `max_distance_pc?`.
2. SQL: `SELECT * FROM entities WHERE ST_DWithin(position, ST_MakePoint($1, $2)::geography, $3 * 111320)` (deg → m). Include `max_distance_pc` filter.
3. Return sorted by angular distance.
**Verify:**
```bash
curl -sf 'http://localhost:3010/v1/search/cone?ra=101.2875&dec=-16.7161&radius_deg=5' | jq '.count'
# Expect: ≥ 1 (Sirius area)
```
**Done when:** Returns neighbors ordered by angular distance.

---

### T-B-10 — `GET /v1/solar-system/bodies` 🟡
**Depends:** T-B-05  **Est:** 2h
**Goal:** List solar system bodies + per-body details.
**Files:** `apps/api/src/routes/solar-system.ts`

**Do:**
1. `/v1/solar-system/bodies` returns array of sun/planets/dwarfs/moons with orbital elements.
2. `/v1/solar-system/bodies/:naifId` single body.
3. Per Doc 26 §9.
**Verify:**
```bash
curl -sf http://localhost:3010/v1/solar-system/bodies | jq 'length'    # ≥ 25
curl -sf http://localhost:3010/v1/solar-system/bodies/399 | jq '.name'  # "Earth"
```
**Done when:** Endpoints match Doc 26 §9 schema.

---

### T-B-11 — Client auto-fallback to localSearchIndex 🟢
**Depends:** T-B-07  **Est:** 2h
**Goal:** When API is down or returns 5xx, client transparently falls back to in-memory index.
**Files:** `apps/web/src/api/apiClient.ts`, `apps/web/src/api/search.ts`

**Do:**
1. Wrap existing fetch helpers: on network error or status ≥ 500, call `localSearchIndex.search(...)`.
2. Add `source: 'api' | 'fallback'` to responses for UI debug (not shown by default).
3. `console.warn('[api] falling back to local seed')` — not `error`.
4. Unit test: mock fetch throws → assert fallback used.
**Verify (preview):**
```javascript
(async () => {
  // stop API externally first: docker compose stop api
  window.location.reload();
  await new Promise(r => setTimeout(r, 3500));
  const inp = document.querySelector('[data-testid="search-input"]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  inp.focus();
  setter.call(inp, 'Androm'); inp.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise(r => setTimeout(r, 600));
  const count = [...document.querySelectorAll('[role="option"]')].length;
  return { count };  // Expect: ≥ 1 (offline-fallback worked)
})()
```
**Done when:** Client works identically when API is stopped; unit test green.

---

### T-B-12 — Phase B full regression 🟢
**Depends:** T-B-11  **Est:** 1h
**Goal:** Run the Phase B verification block from viz.md §2 Phase B (checks B.1-B.6).
**Do:**
1. Run each command in order.
2. Document results in PR description.
**Done when:** B.1–B.6 all pass.

---

## Phase C — ETL seed from TS (5 tasks, ~10h)

### T-C-01 — `export-ts-catalog.ts` Node script 🟢
**Depends:** T-A-03  **Est:** 2h
**Goal:** One-shot script imports all `apps/web/src/data/*.ts` catalogs, writes JSON.
**Files:** `apps/etl/scripts/export-ts-catalog.ts`, `package.json` root script

**Do:**
1. Dynamic import each catalog (`galaxyCatalog`, `nebulaCatalog`, etc.).
2. Flatten into shape matching `entities` table: `{ent_id, name, kind, category, ra_deg, dec_deg, distance_pc, magnitude, metadata}`.
3. Write to `data/seed/entities.json` (create dir if missing).
4. Add root-level npm script `pnpm seed:export`.
**Verify:**
```bash
pnpm seed:export
jq 'length' data/seed/entities.json   # ≥ 600
jq '.[0] | keys' data/seed/entities.json
# Expect: ["category","dec_deg","distance_pc","ent_id","kind","magnitude","metadata","name","ra_deg"]
```
**Done when:** JSON has all 600+ entities with correct fields.

---

### T-C-02 — Python ingest from JSON → Postgres 🟡
**Depends:** T-C-01, T-A-03  **Est:** 3h
**Goal:** Python ETL upserts entities.json into Postgres.
**Files:** `apps/etl/cosmos_etl/seed/from_ts_catalog.py`, `apps/etl/tests/test_seed.py`

**Do:**
1. Read `data/seed/entities.json`.
2. For each record, build `INSERT ... ON CONFLICT (ent_id) DO UPDATE` with parameterized query.
3. Use `psycopg.connection.executemany` in batches of 500.
4. Log row count per category.
5. Pytest integration: testcontainer postgres, run ingest, assert row counts.
**Verify:**
```bash
cd apps/etl
python -m cosmos_etl.seed.from_ts_catalog
docker exec cosmos-postgres psql -U cosmos -d cosmos -c "SELECT category, count(*) FROM entities GROUP BY category;"
# Expect galaxies 38+, nebulae 40+, etc.
pytest tests/test_seed.py
```
**Done when:** Row counts match JSON counts per category; idempotent re-run doesn't duplicate.

---

### T-C-03 — Populate Elasticsearch autocomplete 🟡
**Depends:** T-C-02, T-B-03  **Est:** 2h
**Goal:** After Postgres load, bulk-index into ES autocomplete index.
**Files:** `apps/etl/cosmos_etl/seed/to_elasticsearch.py`

**Do:**
1. SELECT all entities from Postgres.
2. Bulk index with `_bulk` API; include aliases in completion suggestions.
3. Refresh index on completion.
**Verify:**
```bash
python -m cosmos_etl.seed.to_elasticsearch
curl -sf http://localhost:9200/entities_autocomplete/_count | jq .count   # ≥ 600
curl -sf 'http://localhost:3010/v1/search/autocomplete?q=m31' | jq '.suggestions[0].ent_id'
# Expect: "GAL-m31"
```
**Done when:** ES count matches Postgres; autocomplete hits work.

---

### T-C-04 — Airflow DAG `seed_from_ts` 🟢
**Depends:** T-C-02, T-C-03  **Est:** 2h
**Goal:** Wrap C-02 + C-03 in an idempotent Airflow DAG.
**Files:** `apps/etl/dags/seed_from_ts.py`

**Do:**
1. DAG with 2 tasks: `load_postgres` → `index_elasticsearch`.
2. Daily schedule, catchup=False.
3. Failure alerts via Airflow email stub.
**Verify:**
```bash
cd apps/etl
airflow dags test seed_from_ts $(date -u +%Y-%m-%d)
# Expect: SUCCESS
```
**Done when:** DAG runs green; re-run idempotent.

---

### T-C-05 — Preview smoke: client via API 🟢
**Depends:** T-C-04  **Est:** 1h
**Goal:** Run viz.md §2 Phase C preview block. All 5 search queries resolve via API.
**Do:** Run the `preview_eval` block from viz.md Phase C verify C.6.
**Done when:** `hits.length === 5` + `netHits ≥ 5` + client runs identically to client-only mode.

---

## Phase D — Gaia bright subset (8 tasks, ~30h)

### T-D-01 — Downloader: mag < 10 bright subset 🟡
**Depends:** T-C-04  **Est:** 4h
**Goal:** Download ~1.2M Gaia DR3 rows (mag ≤ 10), cache on disk.
**Files:** `apps/etl/cosmos_etl/downloaders/gaia_dr3.py`, `apps/etl/tests/test_gaia_download.py`

**Do:**
1. Use `astroquery.gaia.Gaia.launch_job_async` with ADQL:
   ```sql
   SELECT source_id, ra, dec, pmra, pmdec, parallax, parallax_error,
          phot_g_mean_mag, bp_rp
   FROM gaiadr3.gaia_source
   WHERE phot_g_mean_mag < 10 AND parallax > 0 AND parallax_error/parallax < 0.2
   ```
2. Paginate by HEALPix pixel (order 6) — 49152 pixels; chunk per 64 pixels.
3. Save each chunk as `data/raw/gaia/dr3_chunk_NNNN.csv`.
4. Resumable: skip chunks that already exist on disk.
**Verify:**
```bash
python -m cosmos_etl.downloaders.gaia_dr3 --magnitude-max 10
ls data/raw/gaia/*.csv | wc -l   # ≥ 1 (first chunk complete)
wc -l data/raw/gaia/dr3_chunk_0000.csv   # some rows
```
**Done when:** Downloader can resume after interrupt; test run with 1 chunk completes in <2min.

---

### T-D-02 — Transformer: Gaia row → entity record 🟡
**Depends:** T-D-01  **Est:** 3h
**Goal:** Python function `gaia_to_entity(row) → dict` producing `entities` row.
**Files:** `apps/etl/cosmos_etl/transformers/gaia_to_entities.py`

**Do:**
1. `distance_pc = 1000 / parallax_mas`.
2. `spectral_class` from `bp_rp`: O < -0.3, B -0.3..0, A 0..0.3, F 0.3..0.6, G 0.6..0.9, K 0.9..1.4, M > 1.4. Table in Doc 23 §12.3.
3. `kind = 'mainseq'` (default — HR-diagram classifier later).
4. `ent_id = f"GAIA-{source_id}"`, `category = 'stars'`.
5. Apply proper motion correction J2016 → J2000 (per Appendix A.1 in viz.md).
**Verify:**
```bash
pytest apps/etl/tests/test_gaia_transform.py
```
**Done when:** Unit tests cover all spectral buckets + proper-motion edge case.

---

### T-D-03 — J2016 → J2000 proper motion correction 🟡
**Depends:** T-D-02  **Est:** 2h
**Goal:** Accurate position epoch normalization (CLAUDE.md #5: ICRS J2000.0).
**Files:** `apps/etl/cosmos_etl/transformers/gaia_to_entities.py` (extend)

**Do:**
1. Formula: `ra_j2000 = ra_j2016 - pmra_mas_per_yr * 16 / (3600 * 1000 * cos(dec_rad))`.
2. `dec_j2000 = dec_j2016 - pmdec * 16 / (3600 * 1000)`.
3. Validate against a known high-PM star (Barnard's Star: HIP 87937, pmra=-798.58, pmdec=10328.12).
**Verify:**
```bash
pytest apps/etl/tests/test_gaia_transform.py::test_barnards_star_j2000_position
```
**Done when:** Barnard's Star RA/Dec J2000 matches SIMBAD within 1 arcsec.

---

### T-D-04 — HEALPix pixel column 🟡
**Depends:** T-A-03  **Est:** 2h
**Goal:** Every star has `healpix_order6 BIGINT` column indexed for fast tile lookups.
**Files:** `apps/etl/migrations/versions/0002_add_healpix_column.py`

**Do:**
1. New Alembic migration: add `healpix_order6 BIGINT NOT NULL DEFAULT 0` to stars partitions.
2. Btree index on `healpix_order6`.
3. Generated column fallback if PostgreSQL 16 has `healpix_point()` (unlikely); else compute in transformer.
**Verify:** `\d stars` shows column + index.
**Done when:** Column populated for seeded rows (update statement), index exists.

---

### T-D-05 — Bulk loader via `COPY FROM STDIN` 🟡
**Depends:** T-D-02, T-D-04  **Est:** 3h
**Goal:** Ingest 1.2M rows in < 5 min (vs hours for row-by-row INSERT).
**Files:** `apps/etl/cosmos_etl/loaders/gaia_bulk.py`

**Do:**
1. Stream transformer output through `psycopg.connection.cursor().copy(...)` with CSV.
2. Split by magnitude bucket for per-partition speed.
3. Log rows/sec.
**Verify:**
```bash
time python -m cosmos_etl.loaders.gaia_bulk
# Expect: < 5 min for mag<10 subset
```
**Done when:** 1.2M rows in Postgres, loader doesn't leak connections.

---

### T-D-06 — Cross-validate famous stars 🟡
**Depends:** T-D-05  **Est:** 2h
**Goal:** Sirius/Vega/Betelgeuse in Gaia match SIMBAD within Doc 33 tolerance.
**Files:** `apps/etl/tests/test_gaia_accuracy.py`

**Do:**
1. Fetch by `source_id` (Sirius = 2947050466531473792).
2. Assert: RA within 1e-5 deg, Dec within 1e-5 deg, distance within ±5%.
3. Cover 20 bright IAU-named stars.
**Verify:** `pytest apps/etl/tests/test_gaia_accuracy.py`
**Done when:** All 20 stars pass; failures print discrepancy magnitudes.

---

### T-D-07 — Airflow DAG `ingest_gaia_bright` 🟢
**Depends:** T-D-05  **Est:** 2h
**Goal:** DAG orchestrates download → transform → load → index.
**Files:** `apps/etl/dags/ingest_gaia_bright.py`

**Do:** 4 tasks in series: `download_chunks` → `transform_to_entities` → `bulk_load` → `index_to_es`.
**Verify:** `airflow dags test ingest_gaia_bright $(date -u +%Y-%m-%d)` → SUCCESS.
**Done when:** DAG green; retries on transient failures.

---

### T-D-08 — Cone search + preview verification 🟢
**Depends:** T-D-05  **Est:** 1h
**Goal:** Verify Phase D via viz.md verify blocks D.2 + D.3 + D.4.
**Do:** Run the 3 verify blocks; take before/after screenshot of Orion region for visual diff.
**Done when:** All 3 pass; screenshots archived at `tests/visual/orion-{pre,post}-gaia.jpg`.

---

## Phase E — Rust tile server (9 tasks, ~40h)

### T-E-01 — `healpix.rs` — pixel → RA/Dec bounds 🟢
**Depends:** T-A-06  **Est:** 3h
**Goal:** Given HEALPix `(order, pixel)`, return the RA/Dec bounding box.
**Files:** `apps/tile-server/src/healpix.rs`, `apps/tile-server/Cargo.toml` (add `healpix` crate)

**Do:**
1. Use `cdshealpix` crate.
2. `fn pixel_bounds(order: u8, pixel: u64) -> BoundingBox` where BB has ra_min/max, dec_min/max (deg).
3. Unit test: order=1 pixel=0 → known bounds.
**Verify:** `cargo test healpix`
**Done when:** Unit tests green for orders 0..10.

---

### T-E-02 — `encoding.rs` — binary tile format 🟢
**Depends:** T-E-01  **Est:** 4h
**Goal:** Encode star tile per Doc 26 §7.1 (16 B header + 16 B/star, little-endian).
**Files:** `apps/tile-server/src/encoding.rs`

**Do:**
1. Header: 4 B magic `STRT` + 4 B version u32 + 4 B star_count u32 + 4 B reserved.
2. Per-star: x_f32, y_f32, z_f32, rgba_u32 = 16 B.
3. Use `byteorder::LittleEndian`.
4. Round-trip test with `packages/tile-decoder` — encode in Rust, decode in TS (via pnpm workspace import).
**Verify:** `cargo test encoding` + `pnpm --filter @cosmos/tile-decoder test`.
**Done when:** Round-trip test green across 10 random inputs.

---

### T-E-03 — `cache.rs` — Redis + in-memory LRU 🟡
**Depends:** T-E-02  **Est:** 3h
**Goal:** Cache tile bytes: check in-memory first, then Redis, then compute + store both.
**Files:** `apps/tile-server/src/cache.rs`

**Do:**
1. `moka` crate for in-memory LRU (1000 tiles, ~20 MB).
2. `redis` crate for distributed cache (TTL 86400).
3. `async fn get_or_compute<F>(key, F) -> Bytes` helper.
**Verify:** unit test — warm cache hit < 1ms, cold miss triggers F.
**Done when:** Test shows 3-tier cache behavior correctly.

---

### T-E-04 — `routes/star_tiles.rs` handler 🟡
**Depends:** T-E-02, T-E-03  **Est:** 4h
**Goal:** `GET /tiles/stars/{order}/{pixel}` returns binary tile bytes.
**Files:** `apps/tile-server/src/routes/star_tiles.rs`, `apps/tile-server/src/main.rs` (wire up)

**Do:**
1. axum handler; extract `(order, pixel)`.
2. Use cache wrapper (T-E-03). If miss: query Postgres `SELECT ra, dec, distance_pc, bp_rp FROM stars WHERE healpix_order6 = pixel` (when order > 6, recompute pixel via ancestry).
3. Encode via T-E-02.
4. Response: `Content-Type: application/octet-stream`, `Cache-Control: public, max-age=86400`, `ETag`.
**Verify:**
```bash
curl -sf 'http://localhost:3001/tiles/stars/6/12345' -o /tmp/tile.bin
xxd /tmp/tile.bin | head -1
# Expect: "STRT" magic
```
**Done when:** Magic + version + star_count valid; ETag returns 304 on If-None-Match.

---

### T-E-05 — Encoding round-trip integration test 🟢
**Depends:** T-E-04  **Est:** 1h
**Goal:** End-to-end: request tile via HTTP → decode via packages/tile-decoder → assert star positions match Postgres.
**Files:** `apps/tile-server/tests/e2e_star_tile.rs`
**Do:** Insert 5 stars at known positions, GET tile, decode, compare.
**Done when:** e2e test green.

---

### T-E-06 — wrk benchmark → 50k req/s 🟡
**Depends:** T-E-05  **Est:** 2h
**Goal:** Meet Doc 25 §5 throughput target.
**Do:**
1. `wrk -t4 -c100 -d30s http://localhost:3001/tiles/stars/6/12345`.
2. If < 50k req/s: enable `tower::limit::RateLimitLayer`, tune tokio workers, check Postgres connection count.
**Done when:** `Requests/sec ≥ 50000`.

---

### T-E-07 — Add pgbouncer to docker-compose 🟡
**Depends:** T-E-06  **Est:** 2h
**Goal:** Prevent Postgres connection exhaustion at tile-server scale.
**Files:** `infra/docker/docker-compose.yml`, `infra/docker/pgbouncer.ini`

**Do:**
1. Add `bitnami/pgbouncer:1.22` service.
2. Configure transaction pooling, max_client_conn=1000, default_pool_size=25.
3. Point tile-server's `DATABASE_URL` at pgbouncer:6432 instead of postgres:5432.
**Verify:**
```bash
docker compose logs pgbouncer | grep "SHOW STATS"
```
**Done when:** wrk from T-E-06 still passes; Postgres shows ≤ 25 backend connections.

---

### T-E-08 — Wire `TileStreamingManager.ts` to new endpoint 🟢
**Depends:** T-E-04  **Est:** 3h
**Goal:** Client fetches real tiles.
**Files:** `apps/web/src/engine/TileStreamingManager.ts`

**Do:**
1. Set base URL `VITE_TILE_SERVER_URL` defaulting to `http://localhost:3001`.
2. Verify decoder path handles new header version.
3. Logging: fetch time, cache hit rate (from `x-cache` header).
**Verify (preview):** inspect network tab — should see `/tiles/stars/6/*` requests resolving with 200.

---

### T-E-09 — Preview verification 🟢
**Depends:** T-E-08  **Est:** 1h
**Goal:** Run viz.md Phase E verify block E.4.
**Do:** Execute `preview_eval` from viz.md. Expect `tileRequests ≥ 12`, `tilesMounted ≥ 10`.
**Done when:** Assertion passes + screenshot shows denser star field.

---

## Phase F — Full Gaia DR3 ingestion (6 tasks, ~80h including waits)

### T-F-01 — Remove mag filter, resumable download 🟡
**Depends:** T-D-07  **Est:** 4h
**Goal:** Extend downloader to fetch all 1.8B rows. Resume on interrupt.
**Files:** `apps/etl/cosmos_etl/downloaders/gaia_dr3.py` (extend)

**Do:**
1. Remove `WHERE phot_g_mean_mag < 10`.
2. Save progress to `data/raw/gaia/.checkpoint.json` — last completed healpix pixel.
3. Add `--resume` flag that skips completed chunks.
4. Expected size: ~120 GB total.
**Verify:** Test with small HEALPix range, ctrl-C mid-run, resume → continues from checkpoint.
**Done when:** Can resume across restarts.

---

### T-F-02 — Disk management + chunk pruning 🟡
**Depends:** T-F-01  **Est:** 2h
**Goal:** Delete chunks after successful Postgres load to stay under disk budget.
**Files:** `apps/etl/cosmos_etl/pipelines/gaia_cleanup.py`

**Do:**
1. After each chunk successfully loads, `unlink()` the CSV.
2. Track deletion in `.checkpoint.json`.
**Done when:** During long ingest, disk usage plateaus at ~5 GB (buffer).

---

### T-F-03 — HR-diagram-driven star kind classifier 🟡
**Depends:** T-D-02  **Est:** 4h
**Goal:** Refine `kind` field beyond default 'mainseq' using BP-RP + absolute magnitude.
**Files:** `apps/etl/cosmos_etl/transformers/star_kind.py`

**Do:**
1. Compute absolute mag `M_G = G - 5*log10(parallax/100)`.
2. Classifier: protostar / mainseq / subgiant / redgiant / bluesupergiant / agb / whitedwarf — per Doc 23 §12.5 HR regions.
3. Unit test 50 annotated stars.
**Done when:** ≥90% classification accuracy vs reference.

---

### T-F-04 — Tile pyramid generator (orders 0-10) 🟡
**Depends:** T-E-02, T-F-01  **Est:** 6h
**Goal:** Pre-compute all tile orders 0-10 for smooth zoom transitions.
**Files:** `apps/etl/cosmos_etl/pipelines/generate_tile_pyramid.py`

**Do:**
1. For each order 0..10: group stars into HEALPix pixels at that order.
2. Downsample: keep top-N by magnitude per pixel (N increases with order).
3. Write binary tiles to `data/tiles/stars/{order}/{pixel}.bin`.
4. Optional: upload to S3 for CDN.
**Done when:** Tile hierarchy exists; tile-server can serve from disk fallback if DB slow.

---

### T-F-05 — Run full ingest 🔴
**Depends:** T-F-01, T-F-02, T-F-03  **Est:** 48-72h runtime
**Goal:** Complete the 1.8B row ingest.
**Do:**
1. Start Airflow DAG `ingest_gaia_full`.
2. Monitor hourly: disk, Postgres row count, Airflow task status.
3. **ESCALATE if:** network fails repeatedly, disk fills, Postgres errors.
**Done when:** `SELECT count(*) FROM stars` ≥ 1.8e9.

---

### T-F-06 — Regression + preview 🟢
**Depends:** T-F-05  **Est:** 2h
**Goal:** Verify no performance regression; preview shows real universe density.
**Do:**
1. Run 130 unit tests + wrk benchmark (should still hit 50k req/s).
2. Preview: fly to random sky direction, verify stars visible.
3. Preview: fly to Orion, Pleiades, Andromeda — tile-driven density 10-100x higher than seed.
**Done when:** All regression checks green + visual QA satisfied.

---

## Phase G — SDSS galaxies (5 tasks, ~25h)

### T-G-01 — SDSS + HyperLEDA downloaders 🟡
**Depends:** T-C-04  **Est:** 4h
**Files:** `apps/etl/cosmos_etl/downloaders/sdss_dr18.py`, `hyperleda.py`
**Do:** Download via CAS/CasJobs (SDSS) and HyperLEDA HTTP dump. Target ~4M galaxies total.
**Done when:** CSV dumps in `data/raw/galaxies/`.

---

### T-G-02 — Galaxy kind classifier from Hubble type 🟡
**Depends:** T-G-01  **Est:** 3h
**Files:** `apps/etl/cosmos_etl/transformers/galaxy_kind.py`
**Do:** Parse Hubble de Vaucouleurs type → 7 shader kinds (spiral/elliptical/irregular/lenticular/agn/starburst/morphology-special).
**Done when:** Unit tests cover each kind; >90% match expected classification.

---

### T-G-03 — Galaxy tile endpoint (Rust) 🟡
**Depends:** T-E-04, T-G-02  **Est:** 4h
**Files:** `apps/tile-server/src/routes/galaxy_tiles.rs`
**Do:** New `GET /tiles/galaxies/{order}/{pixel}` handler per Doc 26 §7.2 format (24 B/galaxy: pos + size + kind + flags).
**Done when:** Endpoint returns valid binary; round-trip test green.

---

### T-G-04 — Client galaxy tile decoder 🟢
**Depends:** T-G-03  **Est:** 3h
**Files:** `packages/tile-decoder/src/galaxy.ts`, `apps/web/src/engine/GalaxyLOD.ts`
**Do:** Extend decoder + hook GalaxyLOD.ts to consume tile-streamed data.
**Done when:** Tiles stream in at galactic regime.

---

### T-G-05 — Preview: Virgo Cluster fly-to 🟢
**Depends:** T-G-04  **Est:** 1h
**Goal:** Fly to Virgo Cluster (RA=187.7, Dec=12.3) — see 100+ galaxies around M87.
**Do:** `preview_eval` counting galaxy meshes in scene after fly-to.
**Done when:** ≥100 galaxy meshes visible within 5 Mpc scene units of marker.

---

## Phase H — SPICE ephemeris (5 tasks, ~15h)

### T-H-01 — Download DE441 kernel to Git LFS 🟡
**Depends:** pre-flight §1.2 LFS installed  **Est:** 2h
**Files:** `data/spice/de441.bsp`, `data/spice/naif0012.tls`, `.gitattributes`
**Do:**
1. Download from `https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de441.bsp` (~3 GB).
2. `git lfs track "data/spice/*.bsp"`.
3. Commit via `git lfs push`.
**Done when:** `git lfs ls-files` shows the bsp.

---

### T-H-02 — FastAPI `/ephemeris/{naifId}` endpoint 🟢
**Depends:** T-H-01  **Est:** 3h
**Files:** `apps/ephemeris/ephemeris_service.py`, `calculator.py` (verify)
**Do:**
1. Route `GET /ephemeris/{naif_id}?jd=<float>`.
2. Call `spiceypy.spkezr(target, et, 'J2000', 'NONE', 'SSB')`.
3. Response: `{ position: [x, y, z] km, velocity: [vx, vy, vz] km/s, light_time }`.
**Verify:** curl Earth at JD 2460800.5 → cross-check JPL Horizons.
**Done when:** Output matches Horizons within 1e-6 AU.

---

### T-H-03 — `/ephemeris/batch` endpoint 🟢
**Depends:** T-H-02  **Est:** 2h
**Goal:** Accept array of NAIF ids + single JD, return all positions.
**Done when:** 8 planets returned in single call < 200ms.

---

### T-H-04 — TS-TIME-007 cross-validation 🟢
**Depends:** T-H-02  **Est:** 2h
**Files:** `apps/ephemeris/tests/test_accuracy.py`
**Do:** Script that generates 10 random JDs for each planet, compares with Horizons API; asserts < 1e-6 AU.
**Done when:** Test runs green daily in CI.

---

### T-H-05 — EphemerisSampler WebSocket push 🟢
**Depends:** T-H-03  **Est:** 3h
**Files:** `apps/api/src/plugins/websocket.ts`, `apps/web/src/engine/EphemerisSampler.ts`
**Do:** When user scrubs time slider, server pushes updated positions over WS (Doc 26 §14).
**Done when:** Preview scrub test shows planets move in real-time.

---

## Phase I — Exoplanet archive sync (3 tasks, ~8h)

### T-I-01 — Downloader for NASA Exoplanet Archive 🟢
**Depends:** T-C-04  **Est:** 3h
**Files:** `apps/etl/cosmos_etl/downloaders/exoplanet_archive.py`
**Do:** TAP query `SELECT * FROM ps WHERE default_flag = 1`. Expected ~5800 rows.
**Done when:** CSV saved; count matches NASA dashboard.

---

### T-I-02 — Daily Airflow DAG 🟢
**Depends:** T-I-01  **Est:** 3h
**Files:** `apps/etl/dags/exoplanet_daily.py`
**Do:** Daily at 06:00 UTC. Tasks: download → transform → upsert → reindex ES.
**Done when:** DAG runs green; changes since yesterday logged.

---

### T-I-03 — Preview: Proxima b + TRAPPIST-1 system 🟢
**Depends:** T-I-02  **Est:** 1h
**Goal:** Both famous systems searchable via API.
**Do:** Preview search queries via `preview_eval` — assert both return correct host distances.
**Done when:** Both hits resolve, data matches NASA archive.

---

## Phase J — Production deploy (8 tasks, ~80h)

> **🔴 BLOCKED on user decision — see viz.md §4.**

### T-J-01 — Terraform: VPC + subnets + RDS + ElastiCache 🔴
**Depends:** user approval of cloud provider  **Est:** 8h
**Files:** `infra/terraform/modules/{vpc,rds,elasticache}/`
**Do:** Modules for network, managed Postgres, managed Redis per chosen cloud.
**Done when:** `terraform plan` shows clean apply.

### T-J-02 — Helm charts for api/tile-server/ephemeris 🔴
**Depends:** T-J-01  **Est:** 8h
**Done when:** `helm install --dry-run` green for all 3 charts.

### T-J-03 — Staging cluster deploy 🔴
**Depends:** T-J-01, T-J-02  **Est:** 8h
**Done when:** Staging URL serves `/health` via public IP.

### T-J-04 — DNS + TLS via cert-manager 🔴
**Depends:** T-J-03  **Est:** 4h
**Done when:** `curl https://staging.cosmos.example.com/health` returns 200 with valid cert.

### T-J-05 — CDN in front of tile-server 🔴
**Depends:** T-J-03  **Est:** 8h
**Done when:** Tile fetch has `x-cache: HIT` header on edge hits.

### T-J-06 — Grafana Cloud integration + 4 dashboards 🔴
**Depends:** T-J-03  **Est:** 8h
**Done when:** Dashboards live: API p95 latency, tile req/s, Postgres connection pool, Redis memory.

### T-J-07 — pg_dump backup + weekly restore test 🔴
**Depends:** T-J-01  **Est:** 6h
**Done when:** Daily backup landed in S3; weekly test-restore green.

### T-J-08 — Production cutover 🔴
**Depends:** T-J-07  **Est:** 4h
**Done when:** Prod URL live; Playwright e2e smoke pass; rollback script tested.

---

## Quick reference — task dependency graph

```
T-A-01 ──┬─► T-A-02 ─► T-A-06 ─► T-A-07
         └─► T-A-03 ┐
             T-A-04 ┼──► T-A-05 ─► T-A-06
             T-A-05 ┘

T-A-06 ─► T-B-01 ─┬─► T-B-02 ─┬─► T-B-05 ─► T-B-06
                  │           └─► T-B-09
                  ├─► T-B-03 ─► T-B-07 ─► T-B-08
                  └─► T-B-04 ─► T-B-05
              T-B-05 ─► T-B-10
              T-B-07 ─► T-B-11 ─► T-B-12

T-B-12 ─► T-C-01 ─► T-C-02 ─► T-C-03 ─► T-C-04 ─► T-C-05

T-C-04 ─┬─► T-D-01 ─► T-D-02 ─► T-D-03
        │                      └─► T-D-05 ─► T-D-06
        │                T-D-04 ┘
        │   T-D-05 ─► T-D-07 ─► T-D-08
        │
        ├─► T-G-01 ─► T-G-02 ──┐
        │                      ├─► T-G-03 ─► T-G-04 ─► T-G-05
        │   T-E-04 ────────────┘
        │
        └─► T-I-01 ─► T-I-02 ─► T-I-03

T-A-06 ─► T-E-01 ─► T-E-02 ─► T-E-03 ─► T-E-04 ─► T-E-05 ─► T-E-06 ─► T-E-07
                                                           T-E-04 ─► T-E-08 ─► T-E-09

T-D-07 ─► T-F-01 ─┬─► T-F-02
                  ├─► T-F-03
                  └─► T-F-05 ─► T-F-06
         T-E-02 + T-F-01 ─► T-F-04

T-H-01 ─► T-H-02 ─► T-H-03 ─► T-H-05
         T-H-02 ─► T-H-04

<user decision> ─► T-J-01 ─► T-J-02 ─► T-J-03 ─┬─► T-J-04
                                                ├─► T-J-05
                                                ├─► T-J-06
                                                └─► T-J-07 ─► T-J-08
```

---

## Task count summary

| Phase | Tasks | Total hours |
|-------|-------|-------------|
| A | 7 | ~12 |
| B | 12 | ~30 |
| C | 5 | ~10 |
| D | 8 | ~30 |
| E | 9 | ~40 |
| F | 6 | ~80 (mostly wait) |
| G | 5 | ~25 |
| H | 5 | ~15 |
| I | 3 | ~8 |
| J | 8 | ~80 |
| **Total** | **68 tasks** | **~330 h (~8-10 weeks serial)** |

---

## How Claude Code picks the next task

1. Find lowest-numbered task without a `✅ DONE` note (added after PR merge).
2. Check `Depends:` — all deps must be done.
3. Check the `🔴` flag — if present, stop and ask user.
4. Start work; open branch `feat/T-X-NN-<slug>`.
5. On completion: run `Verify:` block, then append `✅ DONE <sha> <date>` line after the title.

---

## Report template (paste after task completion)

```
Task T-X-NN done.
  Branch: feat/T-X-NN-<slug>
  PR: #<num>
  Files changed: <list>
  Verify output:
    <paste command outputs>
  Screenshots: <paths if visual>
  Next: T-<next>
```

---

**End of viz-tasks.md.** Start at T-A-01.
