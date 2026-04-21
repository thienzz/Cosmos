# Cosmos Explorer — Implementation Tasks

> Làm theo thứ tự. Mỗi task xong → verify → commit → task tiếp.
> Claude Code đọc file này + CLAUDE.md là đủ context.

## Cách dùng

```bash
claude
> Đọc TASKS.md, làm task [số]. Đọc doc reference trước khi code.
> Xong thì chạy verify command. Pass hết thì commit.
```

---

## T01 — Scaffold monorepo

**Build:** pnpm-workspace.yaml, turbo.json, tất cả thư mục theo Doc 28 §2, .env.example theo Doc 28 §6, `infra/docker/docker-compose.yml` (PostgreSQL 16 + PostGIS 3.4, Redis 7.x, Elasticsearch 8.x, API gateway, ephemeris service), Dockerfiles cho từng service trong apps/
**Spec:** Doc 28 §2, §6, Doc 25 §2-§5 (backend services)
**Verify:**
```bash
ls apps/web apps/api apps/tile-server apps/ephemeris packages/shared-types
cat pnpm-workspace.yaml
docker compose -f infra/docker/docker-compose.yml config
```

## T02 — TypeScript + lint + build config

**Build:** tsconfig.json (strict:true, path aliases @/), ESLint config (no-any error), Prettier config, vite.config.ts với GLSL loader
**Spec:** Doc 28 §8, Doc 10 §2
**Verify:**
```bash
pnpm install && pnpm typecheck && pnpm lint
```

## T03 — Shared types package

**Build:** packages/shared-types — tất cả TypeScript interfaces: Star, Planet, Moon, Galaxy, Nebula, Asteroid, Comet, CosmicWebNode, KeplerianElements, TileHeader, EntityBase
**Spec:** Doc 11 (full document — all interfaces)
**Verify:**
```bash
pnpm --filter shared-types typecheck
```

## T04 — 8 Zustand stores

**Build:** apps/web/src/stores/ — cameraStore, selectionStore, timeStore, modeStore, searchStore, tileStore, settingsStore, uiStore. Mỗi store có TypeScript interface + actions + initial state.
**Spec:** Doc 27 §5 (all 8 store definitions)
**Verify:**
```bash
pnpm --filter web typecheck
# Viết test: mỗi store test initial state + mỗi action
pnpm --filter web test
```

## T05 — Three.js scene + renderer

**Build:** apps/web/src/engine/ — SceneManager class: WebGL 2.0 context, WebGLRenderer với logarithmic depth buffer, HDR render target (Float16), resize handler, adaptive quality (detect GPU tier, monitor frame time)
**Spec:** Doc 10 §3, Doc 27 §6, CLAUDE.md §Critical Rules #6
**Verify:**
```bash
pnpm --filter web dev
# Browser: canvas hiển thị, console không có WebGL error
# Spector.js: verify logarithmic depth enabled
```

## T06 — Camera system

**Build:** CameraController — orbit (mouse drag), pan (middle mouse), zoom (scroll), WASD+QE keyboard, camera store integration (write position mỗi frame via getState())
**Spec:** Doc 19 §Navigation Methods, Doc 27 §5.1 (CameraState)
**Verify:**
```bash
pnpm --filter web dev
# TS-NAV-001: WASD response < 16ms
# TS-NAV-002: Orbit smooth, no gimbal lock
```

## T07 — Star point shader

**Build:** apps/web/src/shaders/star-point.vert + star-point.frag — point sprite, spectral type → color (B-V index to RGB), magnitude → size/brightness, corona glow for bright stars. Follow GLSL conventions (u_, v_, a_ prefixes, quality #ifdef)
**Spec:** Doc 18 §Star Main Sequence shader, CLAUDE.md §GLSL conventions
**Verify:**
```bash
# TS-RENDER-001: O type = blue-white, M type = red, G type = yellow
# TS-RENDER-002: magnitude brightness scaling correct
# TS-VQA-001: ΔE < 3.0 per spectral type
```

## T08 — Star instanced rendering

**Build:** StarFieldRenderer — InstancedBufferGeometry, load 5K Hipparcos stars from seed JSON, per-instance attributes (position, color, magnitude), frustum culling. Include WebGL context loss detection + recovery (rebuild scene, restore state).
**Spec:** Doc 10 §3 (max 500 draw calls), Doc 12 §Rendering, Doc 27 §15 (error recovery)
**Verify:**
```bash
pnpm --filter web dev
# 5K stars visible, correct colors
# TS-PERF-001: ≥ 60 FPS
# TS-RENDER-008: WebGL context loss → auto recovery
# TS-RENDER-009: draw calls < 500 (check Spector.js)
# TS-RENDER-010: LOD transitions no popping
```

## T09 — Skybox

**Build:** Cubemap skybox — deep space background. This is the ONE exception for textures (CLAUDE.md Critical Rule #1)
**Spec:** Doc 18 §Post-Processing (background)
**Verify:**
```bash
# Visual: seamless 360° background, no seams at edges
```

## T10 — Coordinate utils package

**Build:** packages/coordinate-utils — RA/Dec ↔ Cartesian (ICRS J2000.0), Galactic ↔ Equatorial, Ecliptic ↔ Equatorial, camera-relative transform (subtract camera pos), Kepler solver (Newton-Raphson, handle e=0, e=0.9, e→1), parallax ↔ distance, proper motion propagation
**Spec:** Doc 23 §2-4, CLAUDE.md §Coordinate System
**Verify:**
```bash
# TS-COORD-001: Sirius → galactic (l=227.23°, b=−8.89°, d=2.64pc)
# TS-COORD-002: round-trip error < 1e-10
# TS-COORD-003: polar singularity (Dec=±90°) no NaN
# TS-COORD-004/005/006: Kepler solver at e=0, e=0.9, e=0.999
# TS-COORD-007: Ecliptic ↔ Equatorial conversion
# TS-COORD-008: proper motion propagation
# TS-COORD-009: parallax to distance
# TS-COORD-010: batch conversion performance
pnpm --filter coordinate-utils test
```

## T11 — Time system

**Build:** TimeEngine — epoch (Julian Date), playback rate (1x → 100,000x), play/pause, date picker input, epoch boundary handling (BCE/CE). Integrate with timeStore. Main loop reads via getState(). WebSocket time_update push support.
**Spec:** Doc 27 §5 (TimeState), Doc 26 §8 (ephemeris API format), Doc 26 §14 (WebSocket)
**Verify:**
```bash
# TS-TIME-003: playback rates work
# TS-TIME-004: manual date input
# TS-TIME-005: epoch boundary (BCE/CE) no crash
# TS-TIME-006: batch ephemeris request
# TS-TIME-007: WebSocket ephemeris push
pnpm --filter web test
```

## T12 — Ephemeris service (Python)

**Build:** apps/ephemeris/ — FastAPI + SpiceyPy. Endpoints: GET /ephemeris/{naifId}, POST /ephemeris/batch (max 50 bodies × 1000 epochs), GET /ephemeris/range
**Spec:** Doc 25 §9, Doc 26 §8
**Verify:**
```bash
# TS-TIME-001: Earth position at J2000.0 matches JPL Horizons ±0.001 AU
# TS-TIME-002: Jupiter ±0.005 AU
cd apps/ephemeris && pytest
```

## T13 — Planet shaders (all 8)

**Build:** Per-planet GLSL shaders — Earth (atmosphere, clouds, night lights, ocean specular), Jupiter (banding, GRS), Saturn (banding + rings with Cassini division), Mars (rust, polar caps), Venus (thick atmosphere), Mercury, Uranus, Neptune. All procedural, no textures.
**Spec:** Doc 18 — each planet section
**Verify:**
```bash
# TS-RENDER-003: Earth PBR correct
# TS-RENDER-004: Jupiter banding + GRS
# TS-VQA-002: planet ΔE < 5.0
```

## T14 — Solar system renderer

**Build:** SolarSystemRenderer — render all planets at positions from ephemeris, orbital paths visualization, 20+ major moons with orbits around parents
**Spec:** Doc 23 §8 (solar system data), Doc 22 (Rocky Planets, Gas Giants, Moons toggles)
**Verify:**
```bash
pnpm --filter web dev
# TS-DATA-003: ≥ 290 solar system bodies
# Planets orbit correctly at accelerated time
```

## T15 — Entity selection + info panel

**Build:** Ray casting selection (click → intersect sphere), selectionStore integration, selection history (back/forward), InfoPanel React component with AETHER V4 styling (Press Start 2P heading, Space Mono body, phosphor glow border, CRT scanline overlay). Entity toggles UI (checkboxes/sliders per Doc 22). All 9 entity categories accessible via ENT ID system.
**Spec:** Doc 27 §5.2 (SelectionState), Doc 24 §InfoPanel, Doc 20, Doc 22 (toggle features)
**Verify:**
```bash
# TS-ENTITY-001: click planet → panel shows correct data
# TS-ENTITY-002: orbital elements display
# TS-ENTITY-003: toggle features work (enable/disable layers)
# TS-ENTITY-004: selection history back/forward
# TS-ENTITY-005: all 9 entity categories accessible via ENT IDs
```

## T16 — Fly-to animation

**Build:** Camera fly-to — smooth bezier curve transition to selected entity, 1-3 sec duration, ease-in-out. Near/far clipping auto-adjustment per scale.
**Spec:** Doc 19 §Fly-To, §Camera Clipping
**Verify:**
```bash
# TS-NAV-003: smooth animation, correct target framing
# TS-NAV-006: logarithmic depth, no z-fighting at any scale
# TS-NAV-007: near/far clipping correct
```

## T17 — Time controls UI

**Build:** TimeControlBar — play/pause button, speed slider, date display, epoch jump. AETHER V4 styling.
**Spec:** Doc 24, Doc 21 (time control screens)
**Verify:**
```bash
# Visual: controls render correctly, responsive to input
```

## T18 — API gateway (Fastify)

**Build:** apps/api/ — Fastify server with entity endpoints (GET /entities/{id}, /entities/ent/{entId}), rate limiting (4 tiers), CORS, error handling (22 error codes), health endpoint, pagination (offset + cursor), ETag caching, version endpoint
**Spec:** Doc 26 §5, §15, §16, §17
**Verify:**
```bash
# TS-API-001: response matches OpenAPI schema
# TS-API-002: unknown ID → 404
# TS-API-003: rate limiting works
# TS-API-004: pagination cursor correct
# TS-API-005: /health → 200
# TS-API-006: /version returns semver
# TS-API-007: CORS headers correct
# TS-API-008: ETag caching works
cd apps/api && pnpm test
```

## T19 — Database schema + seeds

**Build:** PostgreSQL schema — stars table (partitioned by magnitude), galaxies, solar_system_bodies, nebulae. PostGIS spatial index. Seed scripts (10K stars, 1K galaxies, solar system).
**Spec:** Doc 25 §4, Doc 28 §5
**Verify:**
```bash
docker compose up -d
./scripts/seed-db.sh
psql -c "SELECT count(*) FROM stars;"  # ≥ 10000
```

## T20 — Search service

**Build:** Elasticsearch integration — full-text search, autocomplete (< 50ms P95), catalog ID search (HD, HIP, NGC, Messier), cone search (RA/Dec + radius), advanced filters (JSONB, 10 operators)
**Spec:** Doc 25 §7, Doc 26 §6
**Verify:**
```bash
# TS-SEARCH-001: "Sirius" returns correct entity
# TS-SEARCH-002: "sir" partial match works
# TS-SEARCH-003: autocomplete < 50ms
# TS-SEARCH-004: "HD 48915" returns Sirius
# TS-SEARCH-005: cone search returns entities in sky region
# TS-SEARCH-006: advanced filter with multiple criteria
```

## T21 — Search UI

**Build:** SearchBar component — autocomplete dropdown, keyboard navigation (up/down/enter), recent searches, AETHER V4 styling. Integrate with searchStore.
**Spec:** Doc 24 §SearchBar, Doc 27 §5 (SearchState)
**Verify:**
```bash
# TS-SEARCH-007: empty results shows friendly state
# Visual: type "sirius" → dropdown appears < 50ms
```

## T22 — Tile decoder package

**Build:** packages/tile-decoder — decode binary star tiles (16B header + 16B/star), galaxy tiles (16B header + 24B/galaxy), cosmic web mesh (20B header + vertices + indices). All little-endian.
**Spec:** Doc 11 §Binary Tile Formats, Doc 26 §7
**Verify:**
```bash
# TS-TILE-002: star tile decode correct
# TS-TILE-006: galaxy tile decode correct
pnpm --filter tile-decoder test
```

## T23 — Tile streaming pipeline

**Build:** TileStreamingManager — camera update → frustum cull (worker) → LOD select → priority queue → fetch (max 6 concurrent) → decode (worker) → GPU upload. LRU eviction in IndexedDB via Dexie.js (500 MB budget).
**Spec:** Doc 27 §8 (full pipeline), Doc 12 §Memory
**Verify:**
```bash
# TS-TILE-001: manifest fetch + parse
# TS-TILE-003: LRU eviction at cache limit
# TS-TILE-004: IndexedDB cache hit/miss
# TS-TILE-005: 404 tile → graceful fallback
```

## T24 — Tile server (Rust)

**Build:** apps/tile-server/ — serve star octree tiles and galaxy HEALPix tiles from PostgreSQL, binary response format, CDN-friendly caching headers
**Spec:** Doc 25 §5, Doc 26 §7
**Verify:**
```bash
cd apps/tile-server && cargo test
# Request tile → correct binary response
```

## T25 — Scale regime state machine

**Build:** Scale transitions: Solar System ↔ Stellar ↔ Galactic ↔ Cosmic. Hysteresis bands at each boundary. On transition: LOD recalculation, tile set swap, UI mode adaptation.
**Spec:** Doc 27 §9, Doc 19 §Scale Transitions
**Verify:**
```bash
# TS-NAV-004: transitions work both directions
# TS-NAV-005: hysteresis prevents flicker
```

## T26 — 100K+ star field

**Build:** Load stars via tile streaming at Stellar scale, spectral colors, magnitude scaling, constellation lines + labels
**Spec:** Doc 23 §15 & §17 (stellar catalogs), Doc 18 §Star shaders
**Verify:**
```bash
# TS-DATA-001: Sirius position matches Gaia DR3
# TS-DATA-004: ≥ 100K stars loaded
# TS-PERF-001: ≥ 55 FPS with 100K stars
# TS-PERF-006: tile fetch < 200ms P95
```

## T27 — Nebula volumetric shaders

**Build:** 5 nebula shaders — Emission (Hα red, ray march), Reflection (blue scatter), Dark (absorption), Planetary (symmetric shells), Supernova Remnant (expanding shock). All volumetric ray marching.
**Spec:** Doc 18 §Nebulae (all 5 types), Doc 22 §Nebulae toggles
**Verify:**
```bash
# TS-RENDER-005: ray marching visible, depth correct
# TS-VQA-003: nebula ΔE < 4.0
```

## T28 — Black hole + exotic shaders

**Build:** Black hole (gravitational lensing, accretion disk, jets), Pulsar (beamed emission, rotation), Magnetar (extreme field lines)
**Spec:** Doc 18 §Exotic Objects, Doc 22 §Exotic toggles
**Verify:**
```bash
# TS-VQA-006: accretion disk animation ≥ 30 FPS
```

## T29 — Galaxy shaders + cosmic web

**Build:** Galaxy morphology shaders (spiral, elliptical, irregular, lenticular), galaxy LOD (point → billboard → 3D), cosmic web filament mesh, void regions, CMB boundary sphere
**Spec:** Doc 18 §Galaxy sections, Doc 22 §Galaxies + Large-Scale toggles
**Verify:**
```bash
# TS-VQA-004: galaxy ΔE < 8.0
# TS-VQA-005: SSIM structural similarity > 0.65
# TS-VQA-007: pHash regression Hamming ≤ 8
# TS-DATA-002: Andromeda distance ≈ 778 kpc ±5%
# TS-DATA-005: all 9 entity categories present
```

## T30 — Post-processing pipeline

**Build:** Multi-pass: HDR → Bloom → Lens flare → Tone mapping (ACES) → CRT scanlines + phosphor glow (AETHER V4) → FXAA. Quality tiers (#ifdef).
**Spec:** Doc 18 §Post-Processing, Doc 24 §CRT Effect
**Verify:**
```bash
# TS-RENDER-006: pipeline active, visual quality correct
# TS-RENDER-007: CRT scanline effect visible
```

## T31 — Audio engine

**Build:** Tone.js procedural ambient music — scale-dependent soundscape (solar=warm pad, stellar=ethereal, galactic=deep drone, cosmic=minimal). Volume/mute in settingsStore.
**Spec:** Doc 10 §Audio, Doc 22 §Audio
**Verify:**
```bash
# TS-AUDIO-001: AudioContext inits on user gesture
# TS-AUDIO-002/003: volume + mute work
# TS-AUDIO-004: soundscape changes with scale
```

## T32 — UI modes + guided tours

**Build:** 5 modes (Explorer, Educator, Creator, Casual, Research) — UI adapts per mode. Guided tour system with camera waypoints. Tour J1 (First Contact), J2 (Educator).
**Spec:** Doc 20 (all modes), Doc 27 §10, Doc 21 J1+J2
**Verify:**
```bash
# TS-MODE-001 through 005
# TS-E2E-001: J1 full journey
# TS-E2E-002: J2 full journey
```

## T33 — Accessibility

**Build:** Keyboard nav (tab order, focus indicators), ARIA labels + live regions, prefers-reduced-motion support, high contrast mode, skip links
**Spec:** Doc 16 (full), Doc 24 §Accessibility
**Verify:**
```bash
# TS-A11Y-001: full keyboard nav
# TS-A11Y-002: screen reader announces changes
# TS-A11Y-003: reduced motion respected
# TS-A11Y-004: contrast ≥ 4.5:1
# TS-A11Y-005: high contrast mode
```

## T34 — Security hardening

**Build:** CSP headers (no eval), HSTS, HTTPS redirect, SRI for scripts, DOMPurify for markdown, parameterized queries only, rate limit burst protection
**Spec:** Doc 29 (full)
**Verify:**
```bash
# TS-SEC-001: HTTP → HTTPS redirect
# TS-SEC-002: invalid API key → 401
# TS-SEC-003: SQL injection blocked
# TS-SEC-004: XSS sanitized
# TS-SEC-005: CORS blocks bad origin
# TS-SEC-006: rate burst → 429
```

## T35 — Observability

**Build:** Sentry (frontend errors, 14 custom metrics), Prometheus + Grafana (backend), structured JSON logging, OpenTelemetry tracing
**Spec:** Doc 31 (full)
**Verify:**
```bash
# TS-API-005: health endpoint includes version
# Sentry: test error captured
# Grafana: dashboard loads
```

## T36 — CI/CD + deploy pipeline

**Build:** GitHub Actions (lint, test, build, lighthouse), Docker builds with Trivy scan, K8s rolling update config, blue-green data deployment, release checklist automation
**Spec:** Doc 32 (full), Doc 28 §12
**Verify:**
```bash
# CI: push to branch → all checks pass
# Build: production bundle < 500 KB gzipped
# TS-PERF-002: FCP < 1.5s
# TS-PERF-003: TTI < 3.5s
```

## T37 — E2E tests + final QA

**Build:** Playwright E2E tests for all user journeys, cross-browser (Chrome, Firefox, Safari), memory leak test (10-min session), data accuracy validation (Doc 33 reference objects)
**Spec:** Doc 30 (TS-E2E, TS-PERF, TS-DATA suites), Doc 33
**Verify:**
```bash
pnpm --filter web test:e2e
# TS-E2E-003: Research workflow
# TS-E2E-004: Bookmark CRUD
# TS-E2E-005: cross-browser
# TS-PERF-005: no memory leak (< 50 MB growth in 10 min)
# TS-PERF-007: no long tasks > 100ms
# TS-DATA-006: all 110 Messier objects present
```

---

# Phase 2 — Universe Completeness (T38–T52)

> T01–T33 đã ship scaffold + khung rendering + các gallery demo rời rạc. T34–T37 là launch-prep (security / obs / CI / E2E).
> Phase này điền thịt vào spec: ingest toàn bộ catalog thực, dựng toàn bộ shader cho 96 entity types, dựng scene thống nhất.
>
> **Nguyên tắc:**
> - Mọi entity dữ liệu thực từ catalog authoritative (Doc 23 §6, Doc 33 §2). Không procedural-generate named entities.
> - Tile pyramid là bắt buộc cho 1.5B+ stars / 1.5M+ galaxies — tái dùng T23 pipeline, không load all-in-memory.
> - Mỗi shader family tối đa 5 base GLSL files; biến thể qua `#define` + uniform. Tránh shader blow-up.
> - Doc 22 §2.1 "Physical Realism First" — feature speculative phải label + default OFF.
>
> **Build order đề xuất:**
> ```
> T38 (ETL infra, absorbs T19+T20) → T39+T40 (solar + stellar data) → T41+T42+T43+T44 (shaders parallel)
>                                                                   → T45+T46+T46a+T47+T48 (deep-sky + MW-interior + shaders)
>                                                                   → T49 (constellations) → T50 (unified scene)
>                                                                   → T51+T52 (toggle UI + rich detail)
>                                                                   → T34–T37 (launch prep)
> ```
>
> **Gợi ý:** chạy T34–T37 song song với các task content-heavy (shaders chẳng liên quan tới CI/CD).
>
> **ENT-ID coverage checklist (pre-merge gate cho T41–T48):** Doc 17 liệt kê **152 named subtypes** gom thành **96 rendering categories** (CLAUDE.md). Trước khi đóng mỗi task shader, mở `docs/17-entity-taxonomy.md` và tick từng ENT-ID thuộc phạm vi task đó vào `docs/17-coverage-checklist.md` (tạo mới nếu chưa có). Mỗi row: `ENT-XXXX | subtype name | shader file | task | status`. Tổng cộng phải = 152 khi T48 đóng. Phản biện double-count (ví dụ Cataclysmic NS nằm cả `star-remnant` lẫn `star-variable`) phải có note lý do vật lý trong checklist. CI hook: `scripts/check-ent-coverage.mjs` fails nếu tổng ≠ 152 hoặc có ENT-ID bị bỏ sót.

---

## T38 — ETL infrastructure + catalog downloader (absorbs T19 + T20)

**Decision (2026-04-19):** T19 + T20 được **merge vào T38** thay vì block chờ. Rationale: cả hai chỉ ở mức scope chưa ship, ETL không thể kiểm thử nếu không có schema thực. Chia T38 thành 3 sub-phases nối tiếp trong cùng 1 task: **T38.1 schema + ES skeleton** (3d, former T19+T20) → **T38.2 ETL framework** (4d, Airflow + Python downloaders) → **T38.3 seed run** (3d, chạy full catalog ingest end-to-end). Total ~10 ngày.

**T38.1 Schema + Elasticsearch (former T19 + T20):**
- PostgreSQL 16 + PostGIS 3.4 tables per Doc 25 §4: `entities`, `stars` (partitioned by magnitude), `solar_system_bodies`, `binary_systems`, `variables`, `nebulae`, `galaxies`, `clusters`, `cosmic_web_nodes`, `catalog_registry`, `cross_identifications`.
- Spatial index: GiST trên cột `position_icrs` (PostGIS `geography`) + BRIN trên cột magnitude.
- Elasticsearch 8 service skeleton: `entities` index với analyzer cho Bayer/Flamsteed/Messier prefix + `autocomplete` edge-ngram.
- Migration framework: `apps/etl/migrations/` với Alembic.

**Build:** `apps/etl/` — Airflow DAG framework + Python downloader scripts cho mọi catalog Doc 23 §6. Idempotent + resumable (checksum-verified downloads, skip if cached). Master driver `scripts/seed-catalog.sh` chạy tuần tự: download → preprocess → cross-match via SIMBAD X-match service (1″ radius) → dedupe → classify to ENT-ID → load to PostgreSQL + Elasticsearch. Catalog-version registry ở `data/catalogs/VERSIONS.json`. Output tile-ready Parquet files ở `data/processed/`. On version bump, push `data_version_update` frame via WS (T22 already ships the dispatcher; ETL just needs to PUT to the version endpoint).

**Spec:** Doc 23 §6 (catalog sources), Doc 23 §6.3 (preprocessing pipeline), Doc 25 §10 (ETL), Doc 33 §10 (validation pipeline), Doc 26 §14 (WebSocket data_version_update)

**Catalogs scope:**
- Solar: JPL DE441 kernel + MPC 1.3M asteroids + JPL 4.6k comets + IAU planetary nomenclature
- Stellar: Gaia DR3 subset (G < 16 ≈ 10M stars) + Hipparcos 117,955 + HD 272,150 + HR/BS 9,110 + SIMBAD cross-ids
- Deep-sky: Messier 110 + NGC 7,840 + IC 5,386 + Caldwell 109 + Sharpless 313 + Barnard 366 + LBN 1,125 + LDN 1,802 + Harris GC 157 + Dias OC 2,700 + Strasbourg PN ~3,500 + Green SNR 303
- Extragalactic: HyperLEDA 4M + SDSS DR17 spectroscopic 4.7M + Local Group Census 80 + Abell 4,073 + Planck SZ 1,653 + Milliquas 900k
- Exoplanets: NASA Exoplanet Archive ~5,800 confirmed
- Exotic/transient: ATNF pulsar 3,400 + McGill magnetar 30 + GWTC-3 90 + TNS 150k + Fermi 4FGL 6,659

**Verify:**
```bash
# scripts/seed-catalog.sh --catalog messier   → 110 rows in postgres
# scripts/seed-catalog.sh --catalog gaia-bright → ~10M rows
# psql -c "SELECT COUNT(*) FROM catalog_registry;" → ≥ 20
# SIMBAD cross-match: Sirius has HD 48915 + HIP 32349 + Gaia DR3 id
cd apps/etl && pytest tests/test_ingest.py
# TS-DATA cross-catalog identity: Betelgeuse → {HR 2061, HD 39801, HIP 27989, Gaia DR3 3425614486485484160}
```

---

## T39 — Solar system complete (JPL DE441 + MPC 1.3M + IAU nomenclature)

**Build:** Upgrade T14 renderer để consume real ephemerides từ JPL DE441 kernel (coverage −13,200 → +17,191 yr, hiện đang stub ~1k yr). Ingest MPC 1.3M numbered asteroids + JPL 4,600 comets vào `solar_system_bodies` PostgreSQL table. Instanced rendering cho asteroid belt + Jupiter Trojans + Kuiper Belt (target ≥ 100k visible particles tại scale Solar System). IAU planetary nomenclature (15,000 surface features — craters, mountains) ingest nhưng render chỉ khi zoom đủ gần per-body. Replace T14's hardcoded 260 minor body stubs.

**Spec:** Doc 23 §6.1.1 (solar catalogs), Doc 23 §8 (solar system data), Doc 18 §Small Bodies, CLAUDE.md §Entity System

**Deliverables:**
- SPICE kernel mount via Git LFS (~600 MB DE441 + planet satellite SPKs)
- `SolarSystemRenderer.mountAsteroidField()` — 1.3M orbits, instanced points, LOD (far=points, near=sprites)
- Named asteroid fly-to (Ceres, Vesta, Pallas, Psyche, Eros, Itokawa, Bennu, Ryugu, Apophis)
- Comet tail rendering (T44 follows)
- Moon ephemeris SPKs cho tất cả 293 moons (T14 chỉ có 21 major)

**Verify:**
```bash
# TS-TIME-001: Earth J2000.0 within ±0.001 AU vs Horizons
# TS-TIME-002: Jupiter ±0.005 AU
# TS-DATA-003: ≥ 290 solar system bodies visible → NOW ≥ 1,300,000
# Fly-to "Bennu" → pan to OSIRIS-REx sample-return target
```

---

## T40 — Stellar catalog ingest + tile pyramid + entity-ID refactor

**Build:** Load Hipparcos 117,955 + Gaia DR3 bright subset (G < 16, ~10M) + HD 272,150 + **WDS 156,000 visual binaries** + 9th Spectroscopic Binary Orbit Catalogue ~4,500 + GCVS variable stars ~58,000 into PostgreSQL, cross-match via SIMBAD. Build octree tile pyramid covering the Milky Way local bubble (0 < d < 50 kpc) — level 0 = 1 tile (whole neighbourhood), level 8 = 262,144 tiles (each ~0.2 pc). Tile generator script writes binary tiles per Doc 11 §4.1 format (16B header + 16B/star). Elasticsearch index on every star với catalog IDs (HD/HIP/HR/Gaia/Bayer/Flamsteed/IAU name). Replace T26's Mulberry32 seed with real Hipparcos data for bright stars — streaming tile data trả về real positions.

**Scope-coupled refactors** (separate but *must* land with T40 to avoid follow-up churn):

- **Entity ID type refactor.** Current `cameraStore.trackedEntityId: number`, `selectionStore.selectedEntityId: number`, `engineBridge.requestFlyToEntity(id: number)`, API client routes `/entities/{id: number}` all assume a plain integer (NAIF for solar bodies). Real catalogs use: Gaia DR3 64-bit IDs (overflow JS Number), NGC strings ("NGC 224"), Messier ("M31"), WDS HJ-codes. Introduce canonical `EntityRef = {kind: 'naif'|'gaia'|'ngc'|'messier'|'wds'|..., id: string, surrogate: number}` — `surrogate` is a client-minted u32 for store/map keys, `id` is the catalog-native string. Refactor touches: `@cosmos/shared-types` (add `EntityRef`), all 8 stores, `engineBridge`, `api/*.ts`, InfoPanel, SearchPanel, TourEngine. ~30-40 file churn.
- **Tile server Postgres backend.** T24 ships `FilesystemTileStore` reading `<root>/stars/...bin`. T40 tile pyramid is > 10 GB (262k tiles × average 40 KB). Filesystem is fine for dev but prod needs a `PostgresTileStore` impl (existing trait — just new impl + Redis hot-cache per Doc 25 §7.1).
- **Web Worker tile decode.** Doc 27 §8.4 requires decode off main thread. Currently `decodeStarTileToBuffers` runs in `TileStreamingManager.handle`. Spin a `DecoderWorker` pool (4 workers) receiving `ArrayBuffer` via `postMessage` transfer (zero-copy), returning typed-array buffers. Avoids main-thread jank when 20 tiles decode concurrently.

**Spec:** Doc 23 §6.1.2 (stellar catalogs), Doc 23 §10 (binary/multiple systems), Doc 23 §15 (stellar population), Doc 23 §17 (catalog integration), Doc 25 §7.1 (tile server Redis), Doc 27 §8.4 (worker offload), Doc 33 §3.1 (position accuracy < 1 mas vs Hipparcos), Doc 11 §4.1 (tile format)

**Deliverables:**
- `apps/etl/dags/stellar_ingest.py` — downloads + parses VizieR VOTables for Hipparcos/Gaia/HD/WDS/GCVS
- `scripts/build-star-tiles.mjs` — octree writer, outputs to `data/tiles/stars/`
- PostgreSQL partitioned `stars` table (by magnitude per Doc 25 §4) + `binary_systems` table (WDS + SB) + `variables` table (GCVS)
- Elasticsearch `stars` index with ~10M docs + cross-reference table for WDS components
- `apps/tile-server/src/store/postgres.rs` — `PostgresTileStore` impl of `TileStore` trait
- `apps/web/src/workers/tileDecoder.worker.ts` + `DecoderWorkerPool` class
- `@cosmos/shared-types/src/entityRef.ts` — `EntityRef` type + surrogate-key registry
- Migration PR that swaps all `entityId: number` → `EntityRef` (tests updated)
- Real Sirius/Vega/Betelgeuse/Arcturus positions vs stub

**Verify:**
```bash
# TS-DATA-001: Sirius in DB matches Gaia DR3 RA=101.287°, Dec=−16.716°, d=2.637 pc
# TS-DATA-004: ≥ 1.5 million stars ingested
# TS-SEARCH-004: "HD 48915" returns Sirius entity
# WDS: Castor (α Gem) renders as 6-component binary system
# Fly to Vega → arrives at Gaia DR3 position (RA=279.23°, Dec=+38.78°, d=7.68 pc)
# Worker offload: main-thread tile-decode time = 0ms (confirmed via Performance.measure)
# Postgres tile: `GET /v1/tiles/stars/0/0/0/0` served from postgres in < 50ms P95
pnpm --filter etl test
pnpm --filter web test src/workers/__tests__/tileDecoder.worker.test.ts
```

---

## T41 — Star shader family (31 subtypes → 5 base shaders)

**Build:** Consolidate 31 Doc 17 star subtypes into 5 base GLSL fragment shaders + uniform-driven variants. Doc 18 §Star Rendering has the per-type visual spec. ENT-1021 "Main Sequence (general)" is a classification-only bucket — renders via `star-mainseq.frag` with `u_spectralClass` interpolated; no dedicated shader. ENT-1022 "Subgiant" folds into `star-evolved.frag` with `u_phase` near the MS → RGB boundary.

**Shader families:**
1. `star-mainseq.frag` — O/B/A/F/G/K/M (ENT-1010..1016) + L/T/Y brown dwarfs (ENT-1017..1019) + MS general (ENT-1021). `#define SPECTRAL_CLASS` + `u_temperature`. Granulation fbm, limb-darkening, corona tier. **11 types.**
2. `star-evolved.frag` — Subgiant (ENT-1022) + RGB (ENT-1023) + Red Supergiant + Blue Supergiant (ENT-1024) + AGB (ENT-1025) + HB (ENT-1026) + Wolf-Rayet (ENT-1027) + LBV (ENT-1028) + Carbon (ENT-1029) + Protostar (ENT-1020) + Hypergiant (ENT-1040). Extended envelope + variable opacity + mass-loss wisps. **11 types.**
3. `star-remnant.frag` — White Dwarf (ENT-1030) + Neutron Star/Pulsar (ENT-1031) + already-shipped Black Hole (ENT-1032 covered in T28). **3 types (2 new + 1 T28-shipped).**
4. `star-variable.frag` — Cepheid (ENT-1033) + RR Lyrae (ENT-1034) + Mira (ENT-1035) + Eclipsing (ENT-1036) + Cataclysmic (ENT-1037) + Symbiotic (ENT-1038) + Blue Straggler (ENT-1039). Time-based pulsation + binary-geometry modulation. **7 types.**
5. `star-binary.frag` — common-envelope + Roche-lobe overflow rendering cho interacting binaries. Applied as multiplicative overlay on top of (1)–(4). Scene-level, not one of the 31.

**Total:** 11 + 11 + 3 + 7 = 32 (double-count NS in 3+4 because Cataclysmic Variable IS a binary NS+companion; that's fine — classification overlap reflects physics).

**Spec:** Doc 17 §Stars (all ENT-101x/102x/103x/104x), Doc 18 §Star Rendering (O/B/A/F/G/K/M/RGB/RSG/WD/NS/WR specs + palettes), Doc 22 §4 Stars (interactive toggles for each), Doc 33 §4.2 (spectral→color mapping ΔE < 3.0)

**Verify:**
```bash
# TS-RENDER-001: per-subtype colour ΔE76 < 3.0 vs spectral→RGB reference table
# TS-VQA-001: pulsation period for Cepheid matches P-L relation ±5%
# Gallery route retired by T50 — verify via unified scene + fly-to:
#   fly-to δ Cep (Cepheid) → pulsation visible; fly-to Sirius B (WD) → compact remnant;
#   fly-to WR 124 (Wolf-Rayet) → mass-loss wisps; fly-to R136a1 (O-type) → extreme UV tier.
# All 31 ENT-IDs must appear in docs/17-coverage-checklist.md with status=shipped.
pnpm --filter web test src/engine/__tests__/StarMaterialFamily.test.ts
node scripts/check-ent-coverage.mjs --range 1010-1040
```

---

## T42 — Planet + exoplanet complete (27 subtypes + NASA Archive)

**Build:** Extend T13's 8 solar planets to full 27 subtypes per Doc 17 (IDs 2010-2013, 2020-2021, 2025-2026, 2030-2047, 2050). Build 4 base shader families with disjoint allocation — every ENT-ID owned by exactly one shader:
1. `planet-rocky.frag` (already exists, extend) — Mercury (2010) + Venus (2011) + Earth (2012) + Mars (2013) + Super-Earth (2031) + Magma/Lava (2035) + Ocean (2036) + Carbon (2037) + Iron (2038) + Desert (2039) + Rogue (2040) + Protoplanet (2042) + Water (2044) + Chthonian (2050). **14 variants** via `#define ROCKY_*`.
2. `planet-gas.frag` (already exists, extend) — Jupiter (2020) + Saturn (2021) + Uranus (2025) + Neptune (2026) + Hot Jupiter (2030) + Mini-Neptune (2032) + Puffy (2041) + Helium (2045) + Circumbinary (2046). **9 variants** via `#define GAS_*`.
3. `planet-extreme.frag` — Hycean (2033) + Eyeball tidally-locked (2034) + Tidally-Heated Io-type (2043) + Synestia post-impact (2047). **4 variants.** These are the ones with dramatic non-standard geometry (atmospheres skewed toward substellar point, torus-shaped rings of debris, etc.).
4. `exoplanet-host-marker.frag` — compact glyph + orbit trace rendered when zoom shows host star system context. Not one of the 27 — it's a scene-level UI layer.

**Coverage check:** 14 rocky + 9 gas + 4 extreme = 27 ✓ matches Doc 17.

**Data:** Ingest NASA Exoplanet Archive ~5,800 confirmed planets. Each exoplanet links to its Gaia host-star ID + orbital elements. Render planet at host-star-centric position at appropriate scale. Doc 23 §9 Exoplanetary Systems.

**Spec:** Doc 17 §Planets (ENT-201x/202x/203x/204x/205x), Doc 18 §Rocky Planets + §Gas Giants + §Exotic Planet Types (full list), Doc 22 §5 Rocky + §6 Gas Giants, Doc 33 §5.2 (planetary property accuracy)

**Verify:**
```bash
# TS-RENDER-003: Earth-type PBR + Jupiter banding + GRS
# TS-VQA-002: all 27 planet ΔE76 < 5.0
# Fly to "TRAPPIST-1e" → arrives at correct exoplanet host system
# Search "Proxima Centauri b" → renders eyeball-planet-type shader
# TS-DATA: ≥ 5,500 exoplanets loaded
```

---

## T43 — Moon complete (15 subtypes)

**Build:** Per-moon GLSL shaders ở mức chi tiết cao hơn rocky-planet generic. Doc 18 §Moon Types spec 4 chính (Io volcanic, Europa ice, Titan haze, Luna cratered); extend to full 15 per Doc 17 §3010..3024.

**Shader families:**
1. `moon-rocky.frag` — Luna (ENT-3013) + Ancient Surface Callisto-type (ENT-3016) + Irregular/Captured (ENT-3014). Crater-density fbm + regolith darkening.
2. `moon-volcanic.frag` — Io (ENT-3010) + tidally-heated (matches ENT-2043). Lava flows, SO₂ frost, plume renders.
3. `moon-icy.frag` — Europa (ENT-3011) + Enceladus (ENT-3015) + Ganymede (ENT-3017) + subsurface ocean generic (ENT-3024). Chaos terrain, tiger-stripe cracks, cryovolcanic plumes.
4. `moon-atmospheric.frag` — Titan (ENT-3012). Haze layers, methane lakes, limb glow.
5. `moon-extreme.frag` — Triton retrograde (ENT-3018) + Miranda patchwork (ENT-3019) + Hyperion sponge (ENT-3020). N₂ geysers, canyon systems, porous regolith.
6. `moon-minor.frag` — Shepherd (ENT-3021) + Trojan (ENT-3022) + Binary (ENT-3023). Small-body generic + orbital dance indicator.

**Spec:** Doc 17 §Moons (ENT-301x/302x), Doc 18 §Moon Types (full list), Doc 22 §7 Moons, Doc 23 §8 (293 natural satellites)

**Verify:**
```bash
# TS-RENDER: Io SO₂ plumes visible at close zoom
# TS-VQA: Titan haze layers match Cassini ΔE < 4
# Fly-to "Enceladus" → tiger stripes + south-pole geysers visible
# Fly-to "Miranda" → Verona Rupes cliff visible
```

---

## T44 — Small body complete (20 subtypes + 1.3M instanced rendering)

**Build:** Per Doc 17 §Small Bodies — **20 subtypes** (IDs 4010-4016, 4020-4023, 4030-4032, 4040-4042, 4050-4051, 4060) via shader family + instanced rendering of MPC asteroid catalog (1.3M orbits). Doc 18 §Small Bodies spec.

**Coverage check:** 4 asteroid + 2 binary + 1 rubble + 4 comet + 6 KBO/DP + 1 centaur + 1 trojan + 1 meteoroid = 20 ✓ matches Doc 17.

**Shader families:**
1. `smallbody-asteroid.frag` — C-type (ENT-4010) + S-type (ENT-4011) + M-type (ENT-4012) + V-type (ENT-4013) via spectral-albedo uniform. Irregular shape via displacement noise.
2. `smallbody-asteroid-binary.frag` — Binary (ENT-4014) + contact binary (ENT-4016). Two-lobe geometry.
3. `smallbody-rubble.frag` — Rubble-pile (ENT-4015). Porous aggregate lighting.
4. `smallbody-comet.frag` — Short-period (ENT-4020) + Long-period (ENT-4021) + Halley-type (ENT-4022) + Interstellar (ENT-4023). Nucleus + dust tail + ion tail (two-tail model), sun-angle-driven tail direction.
5. `smallbody-kbo.frag` — Classical (ENT-4040) + Resonant/Plutino (ENT-4041) + Scattered (ENT-4042) + Dwarf Planet Pluto-type (ENT-4030) + Ceres-type (ENT-4031) + Eris-type (ENT-4032). Methane-frost / water-ice / reddish-tholin palettes.
6. `smallbody-centaur.frag` — Centaurs (ENT-4050). Mixed cometary-asteroidal.
7. `smallbody-trojan.frag` — Jupiter Trojans (ENT-4051). L4/L5 stability indicator (optional educational toggle).
8. `meteoroid-stream.frag` — Meteoroid streams (ENT-4060). Dust cloud particle system along parent-comet orbit.

**Instancing:** `THREE.InstancedBufferGeometry` for 1.3M MPC asteroids — per-instance attributes: orbital elements 6 floats + type 1 byte. Client-side Kepler propagator (T10) per frame. Cull by distance + magnitude.

**Spec:** Doc 17 §Small Bodies (ENT-401x..406x), Doc 18 §Small Bodies + §Asteroid Types + §Comets, Doc 22 §11 Small Bodies, Doc 23 §6.1.1 (MPC 1.3M)

**Verify:**
```bash
# TS-DATA: ≥ 1,000,000 asteroids visible at Solar System scale
# Fly-to "C/2022 E3 (ZTF)" → recent comet with correct tail direction
# Fly-to "Halley" → periodic comet at current JD position
# Draw calls stay under 500 via instancing
```

---

## T45 — Nebula complete (14 subtypes + NGC/Sharpless/Barnard ingest)

**Build:** Extend T27's 5 nebulae to full 14 per Doc 17 §5010..5080. Ingest Sharpless 313 + Barnard 366 + Lynds LBN 1,125 + LDN 1,802 + Strasbourg PN ~3,500 + Green SNR 303 catalogs. Render real Orion M42 + Eagle M16 + Crab M1 + Cat's Eye NGC 6543 etc. at correct galactic positions.

**Shader families (extend T27 materials):**
1. `nebula-emission.frag` — HII Giant (ENT-5010) + Compact (ENT-5011) + HI Regions (ENT-5012). Already have; add HI variant (21cm line hint).
2. `nebula-planetary.frag` — Spherical (ENT-5020) + Bipolar (ENT-5021) + Irregular (ENT-5022). Already have; add irregular-shape hash variant.
3. `nebula-reflection.frag` — ENT-5030. Already shipped.
4. `nebula-dark.frag` — Molecular Clouds (ENT-5040) + Bok Globules (ENT-5041). Already have dark; add Bok sub-variant (smaller, denser silhouette).
5. `nebula-snr.frag` — Shell SNR (ENT-5050) + Plerion/PWN (ENT-5051). Already have shell; add plerion (centre-bright, Crab-like).
6. `nebula-wr.frag` — Wolf-Rayet nebulae (ENT-5060). Ring-shape bubble shader.
7. `nebula-protoplanetary.frag` — Protoplanetary disks (ENT-5070). Disk + cavity + gap rendering.
8. `nebula-superbubble.frag` — Superbubbles (ENT-5080). Low-density cavity + shell enclosure.

**Spec:** Doc 17 §Nebulae (ENT-501x..508x), Doc 18 §Nebula Rendering (all 5 + extensions), Doc 22 §8 Nebulae, Doc 23 §6.1.3 + §19 (nebulae + star clusters)

**Verify:**
```bash
# TS-DATA: ≥ 10,000 nebulae ingested
# Fly-to "M42" → Orion Nebula at RA=83.82°, Dec=−5.39°, correct HII emission
# Fly-to "Crab" → SNR with Plerion centre (Crab Pulsar visible)
# Fly-to "Barnard 68" → dark Bok globule silhouetted against star field
# Fly-to "HL Tau" → protoplanetary disk with ALMA-observed gaps
```

---

## T46 — Extragalactic ETL + galaxy shaders complete (19 subtypes)

**Build:** Ingest HyperLEDA 4M + SDSS DR17 spectroscopic 4.7M + Local Group Census 80 + Milliquas 900k. Extend T29's 4 galaxy shaders to full 19 subtypes per Doc 17 §6010..6055. Build HEALPix tile pyramid for 4M galaxies (similar to T40 octree but in sky coordinates).

**Shader families (extend T29):**
1. `galaxy-spiral.frag` — SA (ENT-6010) + SB Barred (ENT-6011). Already have SA; add barred variant (bar region uniform).
2. `galaxy-elliptical.frag` — Giant (ENT-6020) + Dwarf dE (ENT-6021) + dSph (ENT-6022). Already have; add 3 scale-grade variants.
3. `galaxy-lenticular.frag` — S0 (ENT-6012). Already shipped.
4. `galaxy-irregular.frag` — Irr I (ENT-6030) + Irr II (ENT-6031). Already have Irr I; add Irr II with dust-chaos uniform.
5. `galaxy-agn.frag` — Seyfert 1/2 (ENT-6040) + Quasar (ENT-6041) + Radio (ENT-6042) + Blazar (ENT-6043) + LINER (ENT-6044). Central point source + cone/jet + BLR hint.
6. `galaxy-starburst.frag` — Starburst (ENT-6050) + ULIRG (ENT-6053). Enhanced HII knot density.
7. `galaxy-morphology-special.frag` — Ring (ENT-6051) + Jellyfish (ENT-6052) + UDG (ENT-6054) + Merging (ENT-6055). Collision topology, RAM-pressure streaming tail, tidal bridges.

**Tile pyramid:** HEALPix Nside=2048 (50M pixels at top level), tiles serve galaxy list per sky cell. T23 TileStreamingManager already handles generic tile addresses — just needs a HEALPix address encoder. **Dependency:** `healpix.js` (MIT) or port `astropy.healpy` core to TypeScript. Install into `packages/tile-decoder` alongside octree helpers.

**Coverage check:** 2 spiral + 3 elliptical + 1 lenticular + 2 irregular + 5 AGN + 2 starburst + 4 special = 19 ✓ matches Doc 17.

**Spec:** Doc 17 §Galaxies (ENT-601x..605x), Doc 18 §Galaxy Rendering + §Active Galaxy + §Interacting, Doc 22 §9 (implicit — see gas-giants/nebulae-galaxies crossrefs), Doc 23 §6.1.4 (extragalactic catalogs) + §20 (external galaxies), Doc 33 §3.2 + §4.3 (galaxy positions + magnitudes)

**Verify:**
```bash
# TS-DATA-002: Andromeda 778 kpc ±5%
# TS-DATA: ≥ 1.5M galaxies
# Fly-to "NGC 1068" → Seyfert 2 with ionisation cone visible
# Fly-to "3C 273" → quasar with jet visible
# Fly-to "NGC 4038/39" → Antennae merging galaxies with tidal tails
# TS-VQA-004: all 19 galaxy subtypes ΔE76 < 8.0
```

---

## T46a — Milky Way interior view (from-Earth sky + dust lanes + zodiacal light)

**Build:** T46 render galaxies **từ ngoài** như các đối tượng Hubble. T50 mặc định camera đặt tại bề mặt Trái Đất. Nhưng không task nào render **Ngân hà nhìn từ bên trong** — tức dải Milky Way band trên bầu trời đêm + các vệt bụi (Great Rift, Coalsack) + zodiacal light dọc ecliptic. Đây là view-mode quan trọng nhất cho Observation persona nhưng hiện đang lỗ.

**Shader/renderer families:**
1. `mw-band.frag` — emissive additive sphere (inside-out billboard) với fbm noise biased về galactic plane (latitude dependence `exp(-|b|²/σ²)`). Core bulge brighter. Sagittarius direction = Galactic Centre glow hint. Tính từ ICRS J2000.0 → Galactic coordinates conversion (l, b).
2. `mw-dustlane.frag` — multiplicative overlay attenuating `mw-band` theo 2D dust map (Schlegel/SFD 1998 extinction map, downsampled 1024×512 ~1MB). **Texture exception đã được chốt tại T47** (CLAUDE.md Rule #1 update). Great Rift + Coalsack + Aquila Rift hiện ra.
3. `zodiacal-light.frag` — conical glow along ecliptic plane, đỉnh tại anti-solar point, falls off như `cos²(β)` (ecliptic latitude). Chỉ visible trong Observation mode + ở scale Solar System.
4. `gegenschein-spot.frag` — điểm sáng nhỏ tại anti-solar point, ~10° wide, educational toggle.

**Integration:**
- Đặt trong `MilkyWayInteriorComposer` mounted bởi T50 `DefaultSceneComposer` khi regime ∈ {Solar System, Stellar}.
- Khi zoom lên Galactic regime, composer dissolve sang galaxy-spiral.frag (T46) nhìn-từ-ngoài qua hysteresis 500 ly–1 kly band.
- Dust map: hosted ở `data/milkyway/sfd-dust-1024.png` (downsampled từ full Schlegel 1998 map 13MB→1MB). Texture exception đã được thêm vào CLAUDE.md Rule #1 cùng đợt với Planck 2018 CMB (xem T47 §10).

**Spec:** Doc 23 §15 (stellar population — MW structure), Doc 24 §Night Sky View, Doc 19 §Scale Transitions (hysteresis Stellar↔Galactic), Doc 17 — MW bản thân nó là ENT-6010 spiral nhưng cần render mode riêng khi viewer ở trong.

**Verify:**
```bash
# Load default scene → MW band arcing from Sagittarius (southern sky in July) across Cygnus, Perseus
# Fly to Australian outback (lat −30°, night) → Coalsack dark nebula visible as silhouette
# Switch Observation mode → zodiacal light cone visible ~2h after sunset along ecliptic
# Zoom out past 500 ly → MW band cross-fades to external-view spiral galaxy render
# Accuracy: Galactic Centre direction matches real Sgr A* RA=266.42°, Dec=−29.01°
```

---

## T47 — Large-scale structure complete (12 subtypes + IllustrisTNG mesh)

**Build:** Full Doc 17 §7010..7040 coverage. Ingest Harris GC 157 + Dias OC 2,700 + Abell 4,073 + Planck SZ 1,653 + 2MRS groups 24k + Pan et al. voids 1,000. Replace T29's hand-authored `DEFAULT_COSMIC_WEB` with real IllustrisTNG mesh (binary tile via T23 cosmic-web decoder).

**Shader/renderer families:**
1. `cluster-open.frag` — Open clusters (ENT-7010). Member-star list + nebulosity halo.
2. `cluster-globular.frag` — Globular (ENT-7011). Dense core + colour-magnitude envelope hint.
3. `cluster-ob.frag` — OB associations (ENT-7012). Loose young-star grouping + residual HII glow.
4. Galaxy Groups/Clusters/Superclusters (ENT-7020..7022) — extend T29 cluster node mesh with member-galaxy list overlay.
5. `cluster-collision.frag` — Colliding clusters (ENT-7023). Bullet-Cluster-style DM offset overlay (educational toggle).
6. Cosmic Filaments (ENT-7030) — real IllustrisTNG TubeGeometry (≥ 500k nodes per Doc 33 §8.1).
7. Cosmic Voids (ENT-7031) — Pan et al. catalog ≥ 1k void-sphere wireframes.
8. Great Walls (ENT-7032) — planar LineSegments for Sloan Great Wall + CfA2 Great Wall.
9. `lyman-alpha-blob.frag` — Lyα emitters (ENT-7033). Faint diffuse sphere.
10. CMB (ENT-7040) — already shipped in T29. **Decision (2026-04-19):** Planck 2018 CMB map **IS** một exception được phép cho Rule #1 (dọc theo skybox cubemap) vì (a) scientific accuracy không thể procedural tái tạo, (b) chỉ render 1 lần tại boundary sphere, không ảnh hưởng GPU shader pipeline. Cần update `CLAUDE.md` Rule #1 thành: *"No texture atlases — all visuals procedural GLSL. Exceptions: skybox cubemap, Planck 2018 CMB sphere, SFD dust-extinction map (T46a)."* Asset: `data/cosmology/planck-2018-smica-2048.png` ~8MB. Ship kèm T47.

**Spec:** Doc 17 §Large-Scale Structure (ENT-701x..704x), Doc 18 §Large-Scale Structures, Doc 23 §6.1.4 + §21 (LSS), Doc 33 §8.1 (cosmic web nodes ≥ 500k)

**Verify:**
```bash
# Fly-to "M13" → globular with bright core + red-blue CMD distribution
# Fly-to "Bullet Cluster" → two sub-clusters with offset DM halos
# Fly-to "Boötes Void" → 300 Mpc under-density sphere wireframe
# Cosmic web: ≥ 500k node mesh via T23 binary tile
```

---

## T48 — Exotic objects complete (16 subtypes, 3 ship'd + 13 new)

**Build:** Doc 17 §8010..8025 — extend T28's (Black Hole + Pulsar + Magnetar) to full 16. Several are speculative per Doc 22 §2.1 — label + default OFF.

**Prerequisite — Doc 18 shader spec expansion:** Doc 18 §Exotic Objects hiện chỉ có mô tả 1-dòng cho 13 loại mới. Trước khi code, **phải expand Doc 18** với full GLSL spec (uniform list, palette, animation rule, speculative disclaimer) tương đương mức chi tiết của §Star Rendering. Làm sub-task **T48.0** (1 ngày, doc-only PR): cho mỗi ENT-8010..8025, viết: (a) surface/volumetric rendering approach, (b) color ramp + HDR multiplier, (c) animation parameters (pulsation, accretion-swirl, Hawking glow, throat geometry), (d) speculative confidence tag (1-5 scale), (e) reference image if available (NASA/ESO). Block T48.1 shader coding cho đến khi T48.0 merged.

**Shader families:**
1. `exotic-compact.frag` — Quark (ENT-8010) + Strange (ENT-8011) + Preon (ENT-8012) + Boson (ENT-8013) + Gravastar (ENT-8014). Compact-star variants with exotic EOS colour palette; speculative.
2. `exotic-gr-extreme.frag` — White Hole (ENT-8015, speculative) + Wormhole (ENT-8016, speculative) + Naked Singularity (ENT-8025, speculative). Time-reversed accretion / throat geometry / exposed singularity visualisation.
3. `exotic-topology.frag` — Cosmic Strings (ENT-8017). 1D linear line defect with gravitational-lensing bend indicator.
4. `exotic-dark.frag` — Dark Matter Halos (ENT-8018) + Dark Energy Voids (ENT-8019). Weak-lensing-reconstructed isocontour (educational toggle).
5. Magnetars (ENT-8020) — already shipped in T28.
6. `exotic-tzo.frag` — Thorne-Żytkow Objects (ENT-8021). Red supergiant with NS core hint.
7. `exotic-primordial.frag` — Primordial BHs (ENT-8022, speculative). Hawking-evaporating tiny BH.
8. `exotic-quasi-star.frag` — Quasi-stars (ENT-8023, speculative). Massive stellar envelope around accreting central BH.
9. `exotic-planck.frag` — Planck Stars (ENT-8024, speculative). BH-rebound visualisation.

**Spec:** Doc 17 §Exotic (ENT-801x..802x), Doc 18 §Exotic Objects, Doc 22 §2.1 (speculative features default OFF + labelled)

**Verify:**
```bash
# Gallery route retired by T50 — verify via unified scene + search:
#   Search "SGR 1806-20" → fly-to real magnetar, field-line rendering visible
#   Search "SGR 1745-2900" → Galactic centre magnetar
#   Search "PSR B0531+21" → Crab Pulsar with rotating beam animation
#   Search "Sgr A*" → supermassive BH with accretion disk + photon ring
# Speculative entries (8015/8016/8022/8023/8024/8025) carry [SPECULATIVE] badge + default-OFF in InfoPanel
# Doc 18 §Exotic Objects expanded (T48.0 merged) — 13 full shader specs present
# ENT-ID coverage: docs/17-coverage-checklist.md shows 8010..8025 all status=shipped
node scripts/check-ent-coverage.mjs --range 8010-8025
```

---

## T49 — Constellation lines + IAU 88 + named entity labels

**Build:** 88 IAU constellations — boundary polygons + Hipparcos star-pair connection lines + IAU-approved star names. Render as additive `LineSegments` + `THREE.Sprite` labels. Doc 33 §8.3 mandates all named stars present with correct common names + Bayer/Flamsteed designations.

**Deliverables:**
- `data/constellations/iau-88-boundaries.json` — polygon per constellation (RA,Dec vertices, 988 edges total).
- `data/constellations/connection-lines.json` — Hipparcos star-pair joins per traditional asterism (~700 lines across 88 constellations).
- `data/names/iau-approved-star-names.json` — ~500 officially named stars from IAU WGSN.
- `engine/ConstellationRenderer.ts` — `LineSegments` + Sprite labels, toggleable via `uiStore.showConstellationLines`.
- Per-entity label overlay system — renders `THREE.CSS2DRenderer` text for any entity when camera within threshold distance. AETHER V4 styling.

**Spec:** Doc 23 §17 (Hipparcos), Doc 33 §8.3 (named stars), Doc 16 §Accessibility (labels live in a11y tree too), Doc 24 §Constellation Lines styling

**Verify:**
```bash
# ?constellations=on → 88 constellation outlines visible at Milky Way scale
# Search "Altair" → flies to Alpha Aquilae (Hipparcos 97649)
# Search "α UMa" → flies to Dubhe (Big Dipper pointer star)
# Label overlay for Sirius visible at d < 10 pc from star
# Bayer designation "α" shown as Greek letter in label
```

---

## T50 — Unified universe scene (drop `?demo=X` routes)

**Build:** Replace all `?demo=X` isolated galleries with ONE canonical scene that shows the entire universe, with scale regime (T25) driving LOD handoff. Default load: camera at Earth surface looking up at the sky; Tab/zoom transitions smoothly through scale regimes.

**Scene composition per regime (T25):**
- **Solar System** (< 500 AU): Full T14 renderer + asteroid belt + KBO + named comets. Moons at parent-relative scale. Exoplanet host-star markers visible when near.
- **Stellar** (500 AU – 1 kpc): T26 star tile pyramid streams ~1M local stars. Hipparcos bright stars at correct positions. Constellation lines visible (toggle).
- **Galactic** (1 kpc – 1 Mpc): Milky Way structure visible — bulge + disk + bar + spiral arms. Andromeda + Local Group members. Nebulae within MW render via T45 shaders.
- **Cosmic** (> 1 Mpc): Galaxy tile pyramid streams ~4M galaxies. Cosmic web nodes + filaments. CMB boundary sphere at 800u.

**Deliverables:**
- Remove `?demo=planets|solarsystem|starfield|nebulae|exotic|galaxies|cosmicweb|cmb` from `CosmosCanvas.tsx`.
- New `DefaultSceneComposer` that mounts T14 + T26 + T29 + T45 + T47 renderers conditionally via regime listener.
- Camera default: (Earth surface pose, looking at Sun at load time).
- Loading sequence per Doc 21 §1.1 — progressive content reveal as tiles stream.
- `SceneManager` options refactored: star tile streaming / nebula gallery / galaxy gallery / cosmic web / post-processing all default `true` (was opt-in). Test-only harness uses `attachXxx: false` to skip specific renderers.
- **Mode-aware content filter** — each of the 5 UI modes (T32) filters what's visible:
  - Exploration: everything on.
  - Education: curated subset (Messier + named stars + major exoplanets) to avoid overwhelming.
  - Observation: only objects visible from Earth at current date (cone-cull by Sun glare + horizon).
  - Research: everything + FITS overlay slots + data-overlay toggles.
  - Guided Tour: current waypoint + immediate neighbours only.

**Spec:** Doc 19 §Scale Transitions (all 4 regimes + hysteresis), Doc 27 §9 (regime state machine), Doc 21 §1.0–1.3 (loading + default view), Doc 22 §Camera (universal toggle), Doc 20 §Mode-Specific Content Filters (per-mode subset rules), Doc 10 §Performance Specifications (memory/VRAM budget verification)

**Verify:**
```bash
# Load app → Earth visible + Sun + stars overhead + constellation lines
# Zoom out: smooth transition solar → stellar → galactic → cosmic
# No ?demo= flags in URL
# All catalog entities reachable via search from the single scene
# TS-PERF-001: ≥ 55 FPS at every regime on mid-tier GPU
# TS-PERF-005 memory: 10-min idle session < 50 MB heap growth + VRAM never exceeds 192 MB
# Switch to Observation mode → Orion/Vega visible at midnight, Sun filtered out at noon
# Switch to Education mode → only Messier + named stars visible; 1.8B Gaia tiles NOT streamed
# Switch to Research mode → "Load FITS" panel renders (placeholder ok per Doc 25 §11 follow-up)
```

---

## T51 — Rich entity detail + catalog cross-IDs search

**Build:** Expand InfoPanel to Doc 24 S-3.1 Full variant. Show all catalog IDs cross-referenced via SIMBAD. Search bar (T21) queries Elasticsearch across all catalog IDs; recognise Bayer/Flamsteed/Messier/NGC/HD/HIP/Gaia/ATNF/SIMBAD prefixes. **This task must land before T52** — T52 embeds toggle UI inside the S-3.1 Full layout this task builds.

**Deliverables:**
- `ui/InfoPanelFull.tsx` — Doc 24 S-3.1 layout. Sections: Header + Cross-IDs table + Physical Params + Orbital Elements + Observational Info + Tags + **[reserved slot for T52 toggles]** + Actions. Must collapse gracefully to S-3.0 Compact when `window.innerWidth < 768`.
- `api/search.ts` extensions — accept catalog prefixes (`"HD 48915"`, `"α CMa"`, `"Messier 31"`, `"NGC 224"`, `"Gaia DR3 5072708..."`) and route to the right Elasticsearch query.
- **Search ranking** — cross-catalog popularity scoring. Same query may match millions of entries; ranking boost factors: (a) Messier + IAU-named + planet hosts at top, (b) magnitude (brighter = higher), (c) prior click-through frequency (telemetry tracked in T35). "Sirius" query must return α CMa (the star) rank-1, not "Sirius XM" satellite.
- `entity-detail/descriptions.md` — curated prose descriptions for ~500 most-searched entities (Doc 33 §8.3 manual-review pool).
- `data/images/` — optional thumbnail references (NASA image API links) for prose-enhanced entity pages.

**Spec:** Doc 24 S-3.1 Full, Doc 26 §5 entity endpoints (cross-IDs in payload), Doc 26 §6 search API (ranking fields), Doc 33 §9.1 (deduplication via cross-catalog matching), Doc 23 §6.2 (cross-identification hierarchy)

**Verify:**
```bash
# Search "α CMa" or "Dog Star" or "Sirius" or "HD 48915" or "HIP 32349" → all return same entity
# Info panel for Sirius lists: IAU Name, Bayer, Flamsteed, HD, HIP, HR, Gaia DR3, SAO
# Curated description visible for all 110 Messier objects
# Search "Sirius" → rank-1 result is α CMa (the star), not any homonym
# TS-SEARCH-004: "HD 48915" → Sirius (verified)
# TS-SEARCH extended: all 500+ named stars reachable by common name
```

---

## T52 — Doc 22 entity toggles UI (96 types × ~26 features = 2,477 toggles)

**Prerequisite:** T51 must have shipped the S-3.1 Full InfoPanel layout with a reserved toggle slot.

**Build:** Per-entity interactive toggle panel embedded in the reserved InfoPanel slot. Doc 22 §3 feature template: category header → feature name → toggle/slider → description. Toggles drive shader uniforms via new `entityToggleStore` (per-selected-entity mutable state).

**Architecture:**
- `scripts/generate-entity-toggles.mjs` — **Doc 22 markdown parser**. Reads `docs/22-interactive-toggle-features.md` + each `docs/22-<category>-feature-crossref.md` file. Extracts `### <Entity Display Name>` headers + toggle bullets → emits `@cosmos/shared-types/src/entityToggles.ts` (96 entries × ~26 features). Run on CI; fails if Doc 22 was edited but the generated TS file wasn't regenerated.
- `@cosmos/shared-types/src/entityToggles.ts` — declarative toggle spec per ENT-ID (generated; do not hand-edit).
- `stores/entityToggleStore.ts` — Zustand store, keyed by `EntityRef` (T40 refactor), hot state.
- `ui/EntityToggleSection.tsx` — renders toggle UI into InfoPanel S-3.1 (Full variant) based on entity type.
- Shader uniform wiring — each ShaderMaterial reads from toggle store via `getState()` in frame loop (Doc 27 §6.4 hot-path pattern).

**Feature categories per Doc 22:**
- Physical Realism (always-on essentials)
- Atmospheric Features (clouds, hazes, auroras)
- Surface Features (geology, volcanism, water)
- Magnetic Features (field lines, radiation belts) — educational default OFF
- Companion/Interaction (rings, moons, binary companion)
- Speculative (subsurface ocean glow, protoplanetary gap) — default OFF + labeled
- Educational overlays (labels, grids, coordinate rings) — default OFF
- Camera (Light Direction, Time Speed, Auto-Rotate) — universal

**Bulk-generation strategy:** 2,477 toggles hand-wiring is infeasible. Convention over configuration:
- Toggle name → shader uniform name: camel-case the toggle label (e.g. "Great Red Spot" → `u_greatRedSpot`).
- Toggle type → uniform type: boolean → `float 0.0/1.0`, slider → `float`, color-picker → `vec3`, dropdown → `int`.
- Missing uniform in shader → toggle is "educational-only" (no visual effect; warn in dev).
- 1 day to build the auto-wiring + parser, 2 days manual-review the 2,477 generated entries, 2 days polish + tests.

**Spec:** Doc 22 (complete — all 96 entity tables), Doc 22 §2 (design principles), Doc 22 §3 (template), Doc 24 S-3.1 (Full InfoPanel variant), Doc 22 §2.4 (shader uniform convention)

**Verify:**
```bash
# Select Jupiter → InfoPanel shows "Great Red Spot [on]" + "Cloud Bands [on]" + "Aurora [off]" etc.
# Toggle "Aurora" → Jupiter's poles glow with auroral emission uniform
# Select Io → "Volcanic Plumes [on]" + "SO₂ Frost [on]" + "Tidal Heating Visualization [off, Educational]"
# Generated 96 entity toggle specs, feature counts match Doc 22 §1.4 (±5 tolerance)
# Parser CI check: edit Doc 22 without regenerating → CI fails
pnpm --filter web test src/ui/__tests__/EntityToggleSection.test.tsx
node scripts/generate-entity-toggles.mjs --check
```

---

## T53 — Transients + gravitational wave sources (time-dependent entities)

**Build:** Ingest + render time-dependent astronomical events. Unlike Phase 2 catalog entities (which are roughly static at human timescales), transients live/die over weeks–years and must animate when the TimeEngine's epoch crosses them.

**Data:**
- **Transient Name Server (TNS)** — 150k supernovae / TDEs / novae / kilonovae. Each has discovery date + peak date + decay timeline.
- **Fermi 4FGL** — 6,659 gamma-ray sources (blazar flares + GRB remnants).
- **LIGO/Virgo/KAGRA GWTC-3** — ~90 gravitational wave merger events. Coalescence time + sky-localisation polygon + chirp mass.
- **Historical novae / supernovae** — SN 1054 (Crab progenitor), SN 1572 (Tycho), SN 1604 (Kepler), SN 1987A. Doc 23 §13.

**Renderer families:**
1. `transient-supernova.frag` — light curve-driven luminosity envelope. `u_daysSincePeak` uniform + per-type template (Ia/Ib/Ic/II-P/II-L). Fades visibly from Mag ~−17 to below detection over ~200 days. Historical SN remnants auto-pin: SN 1054 → Crab Nebula after 970 years.
2. `transient-kilonova.frag` — rapid red-to-blue colour evolution from neutron-star merger ejecta. ~14-day lifetime.
3. `transient-grb.frag` — gamma-ray burst localisation marker. Point source with 90% confidence ellipse overlay.
4. `gw-merger-marker.frag` — sky-localisation heatmap for GW events. Additive gaussian blob at peak probability, falls off at 90% contour. Chirp-mass-driven colour (heavier = redder).
5. `historical-event-overlay.tsx` — React layer showing historical SN dates + Chinese/Korean/Arabic observer notes as educational toggle.

**Time-dependent animation:**
- TimeEngine (T11) already tracks simulation epoch. New `TransientRegistry.update(jd)` iterates active transients, sets `u_daysSincePeak` per mesh.
- When playback speed is > 365×/s, skip per-transient evaluation (batch-update once per 10 sim-days).
- Epoch jump backwards: transients that were "faded" re-light up if jd is before their peak+decay window.

**Spec:** Doc 23 §13 (supernovae + transients), Doc 23 §14 (gravitational wave sources), Doc 17 — historical SN not explicitly typed but belong to SNR category (ENT-5050).

**Verify:**
```bash
# Jump time to 2017-08-17 → GW170817 kilonova visible (NGC 4993 host)
# Jump to 1054-07-04 → SN 1054 supernova visible as new ~ Mag -6 star at Crab Nebula position
# Jump to 2024 → SN 1054 has faded; remnant Crab Nebula (T45) visible instead
# GWTC-3 overlay renders 90% confidence ellipse for each event
# Fermi 4FGL: search "3C 454.3" → flaring blazar
# TS-TIME: at 1× speed, visible supernova brightens smoothly over hours
```

---

## T54 — Per-entity audio (Doc 18 §Sound Design Mapping)

**Build:** Per-entity spatial audio layer on top of T31's scale-regime ambient. Each entity type has a characteristic sound profile triggered on selection + on proximity. Doc 18 §Sound Design maps:
- **Stars** — subsonic hum (10-40 Hz) modulated by temperature (hot = higher pitch); pulsars emit audible clicks at rotation frequency.
- **Planets** — wind / ocean / volcanism loops depending on atmosphere + surface. Jupiter = deep storm rumble, Saturn = softer wind, Earth = familiar wind+ocean blend.
- **Nebulae** — ambient whoosh with per-kind harmonic stack (HII = warm major chord, SNR = dissonant shock-shell).
- **Galaxies** — low-frequency drone modulated by morphology (spiral = rotating pan, elliptical = static, AGN = high-frequency jitter for jets).
- **Exotic** — BH = deep gravitational-wave rumble (real LIGO inspiral audio); magnetar = crackling starquake.
- **Selection ping** — `Tone.PluckSynth` on entity select (AUD-003 per-entity trigger, deferred from T31).
- **Fly-to whoosh** — `Tone.NoiseSynth` ramped through `Tone.AutoFilter` tied to camera velocity.

**Architecture:**
- `audio/EntityAudioRegistry.ts` — keyed by `EntityRef.kind` (T40). Each kind defines `{ pickSound, ambientLoop, proximityTrigger }` via Tone.js synths (no audio files per CLAUDE.md — all procedural).
- `audio/ToneAudioBackend.ts` extended — add `playEntitySound(kind, ref)` + `setListenerPose(cameraPos, cameraFwd)`. Wire `Tone.Panner3D` per active entity loop + `Tone.Listener` driven by camera transform each frame.
- Ducking on UI interaction — Doc 10 §7 calls for −6 dB duck when search focus / dialog opens. AudioEngine gains already expose ramp interface from T31; just needs dispatch wiring.

**Spec:** Doc 18 §Sound Design Mapping (per-category), Doc 22 §15 AUD-001..006, Doc 10 §7 (audio spec), Doc 23 §28 (audio spatial integration)

**Verify:**
```bash
# Select Sirius → pluck ping in correct pan (stars to the right → right-channel heavy)
# Approach Jupiter within 10 AU → deep rumble fades in, pitches down as closer
# Select Crab Pulsar → audible click train at 30.2 Hz pulsar period
# Select GW170817 event → inspiral chirp plays (real LIGO audio, procedural regen)
# Open search focus → ambient music drops −6 dB (ducking works)
# TS-AUDIO-005 spatial: panning follows camera rotation within 1 frame
```

---

## T55 — Data accuracy validation pipeline (Doc 33 §10)

**Build:** Automated nightly validation harness that runs Doc 33's full reference-object suite + flags regressions. Covers every `TS-DATA-*` test case + cross-catalog consistency checks.

**Components:**
- `apps/validation/` — Python test suite. Nightly CI (via GitHub Actions cron) + on-demand local run.
- **Reference object suite** — Doc 33 §2.2 lists 20+ canonical objects. Script queries the running API + compares against ground truth (JPL Horizons for ephemeris, SIMBAD for stellar positions, NED for galaxy distances):
  - Sirius: position ±1 mas, spectral class A1V, distance 2.637 pc
  - Betelgeuse: HIP 27989, Mag variable 0.0–1.3
  - Andromeda: d = 778 ± 33 kpc, RA/Dec within 0.01°
  - Earth at J2000.0 ±0.001 AU vs DE441
  - Jupiter at J2000.0 ±0.005 AU
  - Halley's Comet: correct perihelion date 1986-02-09
  - Crab Nebula (M1): RA 83.63° ±0.01°
  - TRAPPIST-1 system: 7 planet count, correct masses
  - Proxima Centauri: d = 1.301 ± 0.002 pc, spectral M5.5V
  - Sgr A*: mass 4.3 × 10⁶ M☉
- **Cross-catalog checks** (Doc 33 §9.1) — Sirius cross-references {HD 48915, HIP 32349, HR 2491, Gaia DR3 5072708048013507072} all resolve to the same entity.
- **Messier completeness** (Doc 33 §8.2) — all 110 Messier objects present, correctly classified, position within 0.01°.
- **Named star completeness** (Doc 33 §8.3) — all 500 IAU-WGSN names resolvable.
- **Visual regression** — capture screenshots at 10 canonical camera poses; run ΔE76 + SSIM + pHash (per Doc 30 TS-VQA suite); flag drift.
- **Perf budget regression** — Lighthouse CI score ≥ 90, bundle size < 500 KB gz, FCP < 1.5 s.

**CI integration:**
- `.github/workflows/validation.yml` — runs nightly on main branch. Posts Slack alert on regression.
- `apps/validation/report.html` — tabular dashboard with green/yellow/red status per reference object. Published to Grafana (T35) as a histogram.

**Spec:** Doc 33 (complete — §1 through §10), Doc 30 TS-DATA suite, Doc 30 TS-VQA suite, Doc 30 TS-PERF suite

**Verify:**
```bash
# Run full validation suite locally
apps/validation/run.sh --full
# Expected: all 20 reference objects pass, Messier 110/110, named stars 500/500
# Drift alert: change Sirius position +10 mas → validation fails with clear diff
# CI: nightly runs green for 7 consecutive days before launch
```

---

# Task Dependency Summary

```
T38 (absorbs T19 DB schema + T20 ES skeleton) ── all catalog ingestion
                    ├── T39 Solar system (JPL DE441 + MPC 1.3M)
                    ├── T40 Stellar + WDS + entity-ID refactor + Postgres tile server + Worker
                    ├── T45 Nebula data (NGC/Sharpless/Barnard)
                    ├── T46 Extragalactic data (HyperLEDA/SDSS + HEALPix lib)
                    ├── T47 LSS data (Harris/Dias/Abell/IllustrisTNG)
                    └── T53 Transient data (TNS/GWTC-3/Fermi)

T48.0 Doc 18 exotic spec expansion ──── T48.1 shader coding (blocks)

T41 Star shaders ─────┐
T42 Planet+exo shaders│
T43 Moon shaders      ├──┐
T44 Small body shaders│  │
T45 Nebula shaders    │  │
T46 Galaxy shaders    │  │
T46a MW interior view │  ├── T50 Unified scene
T47 LSS shaders       │  │   (needs all content layers +
T48 Exotic shaders ───┘  │    mode-aware content filter +
                         │    default star tiles ON +
T40 → T49 Constellations ┘    memory budget verify)

T53 Transients+GW ────────── T50 (time-dependent layer)

T50 Unified scene → T51 Rich detail S-3.1 Full → T52 Toggle UI (fills T51 slot)

T31 Audio ─── T54 Per-entity audio (extends T31 backend)

T38..T52 ─── T55 Validation pipeline (validates everything)

T34–T37 (security/obs/CI/E2E) runs in parallel, lands with T55.
```

**Estimated time:** T38 (10 d — absorbs former T19/T20) + T39 (3 d) + T40 (2 wk — includes entity-ID refactor + Worker + Postgres store) + T41 (5 d) + T42 (5 d) + T43 (4 d) + T44 (5 d) + T45 (4 d) + T46 (7 d) + T46a (3 d — MW band + dust + zodiacal) + T47 (5 d) + T48.0 (1 d — Doc 18 expansion) + T48.1 (4 d — 13 shaders) + T49 (3 d) + T50 (1 wk — includes mode-aware filter + memory validation) + T51 (4 d) + T52 (5 d — parser + 2,477 generated toggles + polish) + T53 (4 d) + T54 (5 d) + T55 (1 wk) ≈ **15–16 tuần full-time** cho một kỹ sư đơn lẻ (tăng ~4 d do T46a + T48.0).

**Parallel opportunities:**
- After T38 lands, T39/T40/T45/T46/T47/T53 can all ingest in parallel (independent catalogs).
- Shader tasks T41–T48 are independent once their data source is ingested.
- T54 (audio) is independent of the visual pipeline — can ship anytime after T31.
- T34–T37 (launch prep) runs fully in parallel.

With 2–3 engineers pipelined, Phase 2 (T38–T55) lands in ~6–7 weeks.
