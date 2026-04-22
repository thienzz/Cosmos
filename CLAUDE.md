# Cosmos Explorer — Claude Code Context

> **Read this file first.** It is the single source of truth for AI-assisted development.
> For deeper specs, follow the doc references (`→ Doc XX §Y`).

## Project Overview

**Cosmos Explorer** is an interactive 3D web visualization of the observable universe — from individual moons to cosmic web filaments. It renders **262 entity types** across 10 categories (stars, rocky planets, gas giants, moons, nebulae, galaxies, small bodies, large-scale structure, exotic objects, transient phenomena) using **procedural GLSL shaders** — no texture atlases, everything generated on-GPU. Doc 17 lists **154 Tier A subtypes**; the viz-visuals.md roadmap adds **+108 Tier B extensions** (brown dwarfs, sub-dwarfs, carbon stars, pre-main-sequence, Bus-DeMeo asteroid taxonomy, Herbig-Haro objects, pillars, transients, WD cooling sequence, and more). Each entity carries **~26 interactive toggles** (Doc 22) — total **~6,800 user-facing features**.

**Scale (Doc 23 §6.4 census, total ~1.817B objects):**
- **1.8 billion stars** (Gaia DR3 full; client streams a ~10M-star bright subset via tile pyramid)
- **4 million galaxies** (HyperLEDA + SDSS DR17 spectroscopic via HEALPix tile pyramid)
- **1.3 million solar system bodies** (JPL DE441 + MPC asteroids 1.3M + JPL comets 4.6k + 293 moons)
- **15,000 nebulae** (NGC/IC + Sharpless + Barnard + Lynds + Strasbourg PN)
- **3,000 star clusters** (Harris globulars + Dias open clusters)
- **5,800 confirmed exoplanets** (NASA Exoplanet Archive) rendered around Gaia host stars
- **7,500 galaxy clusters** (Abell + Planck SZ)
- **500k+ cosmic web nodes** (IllustrisTNG mesh)
- **88 IAU constellations** + ~500 IAU-approved named stars
- **110 Messier objects** + 7,840 NGC + 5,386 IC + 109 Caldwell

**Design language:** AETHER V4 — retro-futuristic terminal aesthetic. Fonts: Press Start 2P (headings), Space Mono (body), IBM Plex Mono (data). CRT scanlines, phosphor glow, neon accents on dark backgrounds.

---

## Tech Stack (LOCKED — do not substitute)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | TypeScript | 5.4+ | `strict: true`, no `any` |
| UI | React | 18.3+ | Functional components only, concurrent features |
| 3D | Three.js | r184 | Direct usage, NOT React Three Fiber |
| State | Zustand | 4.4+ | Primary. `getState()` in render loop. NOT Redux |
| Derived | Jotai | 2.4+ | Computed values across stores |
| Build | Vite | 5.1+ | With Rollup 4.0+ |
| Monorepo | pnpm + Turborepo | 8.0+ | Workspace in `pnpm-workspace.yaml` |
| Testing | Vitest + Playwright | 1.0+ / 1.40+ | Unit+integration / E2E |
| Shaders | GLSL ES 3.0 | WebGL 2.0 | Custom pipeline, NOT postprocessing from three/examples |
| Audio | Tone.js | 14.8+ | Procedural synthesis, no audio files |
| DB (client) | Dexie.js | 4.0+ | IndexedDB wrapper for tile cache |
| Backend API | Node.js (Fastify) | — | `→ Doc 25, 26` |
| Tile Server | Rust | 1.75+ | 50K req/s target `→ Doc 25 §5` |
| Ephemeris | Python (FastAPI + SpiceyPy) | 3.11+ | JPL SPICE kernels `→ Doc 25 §9` |
| Database | PostgreSQL 16 + PostGIS 3.4 | — | Stars partitioned by magnitude |
| Search | Elasticsearch | 8.x | Autocomplete + cone search |
| Cache | Redis Cluster | 7.x | Rate limiting + tile cache |
| ETL | Apache Airflow | — | Gaia DR3, SDSS DR18 ingestion |

---

## Architecture — The Two-Loop Problem

The #1 architectural challenge: React's reconciliation loop and Three.js's `requestAnimationFrame` loop are **fundamentally different paradigms** running simultaneously.

**Rule:** React owns all UI outside the `<canvas>`. Three.js owns everything inside it. They communicate through Zustand stores via `getState()` (zero overhead, no re-renders).

```
React UI (declarative, 60Hz) ←→ Zustand Stores ←→ Three.js rAF (imperative, 60Hz)
                                      ↑
                              Web Workers (4-8)
                              postMessage only
```

**State temperature model:**
- **Hot** (every frame): camera position, time — read via `getState()`, never `useStore()`
- **Warm** (on interaction): selection, search results — throttled subscriptions (100ms)
- **Cool** (on navigation): mode, scale regime — standard React subscriptions
- **Cold** (persisted): settings, bookmarks — IndexedDB via Zustand persist

`→ Doc 27 for full state architecture, 8 store definitions, tile streaming pipeline`

---

## Repository Structure

```
cosmos-explorer/
├── apps/
│   ├── web/                  # Frontend (React + Three.js)
│   │   ├── src/              # → Doc 27 §3.1 module map
│   │   │   ├── stores/       # 8 Zustand stores
│   │   │   ├── engine/       # Three.js rendering engine
│   │   │   ├── workers/      # Web Workers (tile parsing, octree, physics)
│   │   │   ├── ui/           # React components (AETHER V4)
│   │   │   ├── hooks/        # Custom hooks bridging stores↔UI
│   │   │   └── shaders/      # GLSL files (.vert/.frag/.glsl)
│   │   ├── tests/            # Vitest
│   │   └── e2e/              # Playwright
│   ├── api/                  # API Gateway (Fastify)
│   ├── tile-server/          # Rust tile server
│   ├── ephemeris/            # Python ephemeris (FastAPI + SPICE)
│   └── etl/                  # Airflow DAGs
├── packages/
│   ├── api-client/           # Generated from OpenAPI spec (Doc 26)
│   ├── tile-decoder/         # Binary tile format decoder
│   ├── coordinate-utils/     # RA/Dec ↔ Cartesian, ICRS J2000.0
│   └── shared-types/         # Cross-package TypeScript types
├── data/
│   ├── seeds/                # 10K stars, 1K galaxies, solar system
│   ├── spice/                # SPICE kernels (Git LFS, ~600MB)
│   └── fixtures/             # Test fixtures
├── infra/docker/             # Docker Compose for local dev
├── docs/                     # 33 docs + 3 core specs (this file's source)
└── CLAUDE.md                 # ← YOU ARE HERE
```

---

## Coding Conventions (MUST follow)

### TypeScript
- `strict: true` — no `any`, use `unknown` + narrow
- Interfaces over type aliases for object shapes
- Absolute imports via `@/` prefix
- `const enum` for compile-time, string unions for runtime

### React
- Functional components only, named exports (default for pages)
- Custom hooks for anything touching stores/API/effects
- `useMemo`/`useCallback` only when profiler shows need
- Error boundaries around each major UI section

### GLSL
- File extensions: `.vert`, `.frag`, `.glsl`
- GLSL ES 3.0 (`#version 300 es`)
- Prefix: `u_` uniforms, `v_` varyings, `a_` attributes
- `#ifdef QUALITY_HIGH/MID/LOW` guards for expensive ops
- Document each uniform with `// @param` comment

### Naming
- Files: `camelCase.ts`, `PascalCase.tsx`, `kebab-case.frag`, `camelCase.worker.ts`
- Variables: `camelCase`, Constants: `SCREAMING_SNAKE`
- Types: `PascalCase`, API routes: `kebab-case`, DB columns: `snake_case`

### Git
- Conventional commits: `feat(web):`, `fix(tile-server):`, `perf(web):`
- Scopes: `web`, `api`, `tile-server`, `ephemeris`, `etl`, `docs`, `infra`, `shared`
- Branch: `feat/COSMOS-123-description`, `fix/COSMOS-456-description`
- PR requires: CI green + 1 CODEOWNER approval

`→ Doc 28 for full setup, commands, workflow`

---

## Performance Budgets (HARD limits)

| Metric | Target | Enforce |
|--------|--------|---------|
| FPS (mid-tier GPU) | ≥60 | Adaptive quality degrades at <55 |
| FPS (low-tier GPU) | ≥30 | Further degrades at <25 |
| Max draw calls/frame | 500 | Use instancing + batching |
| Max triangles/frame (mid) | 1.5M | LOD system enforces |
| JS bundle (gzipped) | <500 KB | Lighthouse CI fails above |
| FCP | <1.5s | Core Web Vitals |
| LCP | <2.5s | Core Web Vitals |
| TTI | <3.5s | Core Web Vitals |
| GPU VRAM budget (mid) | 192 MB | Tile eviction at limit |
| RAM budget (mid) | 256 MB | — |
| IndexedDB budget | 500 MB | LRU eviction |
| Tile fetch concurrency | max 6 | HTTP/2 multiplexing |
| Autocomplete latency | <50ms P95 | Elasticsearch |

`→ Doc 12 for optimization strategies, Doc 27 §14 for full budget table`

---

## Key APIs

**Base URL:** `https://api.cosmosexplorer.app/v1`

| Endpoint Group | Pattern | Doc Reference |
|---------------|---------|---------------|
| Entities | `GET /entities/{id}`, `/entities/ent/{entId}` | Doc 26 §5 |
| Search | `GET /search`, `/search/autocomplete`, `/search/cone` | Doc 26 §6 |
| Tiles | `GET /tiles/stars/{level}/{x}/{y}/{z}`, `/tiles/galaxies/{order}/{pixel}` | Doc 26 §7 |
| Ephemeris | `GET /ephemeris/{naifId}`, `POST /ephemeris/batch` | Doc 26 §8 |
| Solar System | `GET /solar-system/bodies`, `/solar-system/bodies/{naifId}` | Doc 26 §9 |
| WebSocket | `ws://…/v1/ws` — viewport_update, time_update, tile_priority | Doc 26 §14 |

**Auth tiers:** Anonymous (60 req/min), Registered (300), Research (1000), Internal (unlimited)

**Binary tile formats:** Star tile (16B header + 16B/star), Galaxy tile (16B header + 24B/galaxy), Cosmic web mesh (20B header + vertices + indices). All little-endian.

`→ Doc 26 for complete OpenAPI spec, Doc 11 for TypeScript interfaces`

---

## Entity System

**262 entity subtypes** across 10 categories, each with a unique ENT ID
(ENT-1000 through ENT-9000). Resolved client-side by
`apps/web/src/engine/MaterialFactory.ts` — an entity's `render` block,
canonical ENT-ID, kind, or `object_type` selects a shader + `#define`
preset from `SHADER_REGISTRY` (121+ GLSL sources bundled by Vite).

- **Stars (51):** Main-sequence O/B/A/F/G/K/M, L/T/Y brown dwarfs,
  sub-dwarfs sdO/sdB, carbon C-R/C-N/C-J, pre-main-sequence (Herbig Ae/Be,
  T Tauri classical + weak-lined, FU Ori), variables (Cepheid, RR Lyrae,
  Mira, LBV, Be, AM CVn, eclipsing/cataclysmic/symbiotic binary), evolved
  (subgiant, RGB/SG, blue SG, AGB, post-AGB, horizontal-branch, RGB tip,
  extreme AGB, WR, carbon), remnants (WD + 6-class cooling sequence DA/DB/
  DC/DQ/DZ/DO, neutron/pulsar), hypergiant, blue straggler.
- **Planets (42):** Solar four (Mercury/Venus/Earth/Mars) + Jupiter/Saturn/
  Uranus/Neptune, exoplanet categories (Hot Jupiter, Super-Earth,
  Mini-Neptune, Hycean, Eyeball, Magma, Ocean, Carbon/Diamond, Iron,
  Desert, Rogue, Puffy, Protoplanet + 3 evolution stages, Tidally-Heated
  Io-type, Water, Helium + banded, Circumbinary, Synestia, Chthonian +
  severe stripping), Tier B composition + special variants.
- **Moons (25):** Io, Europa, Ganymede, Callisto, Titan, Enceladus, Luna,
  Phobos/Deimos irregular, Triton, Miranda, Hyperion, Shepherd, Trojan,
  Binary, Subsurface Ocean, Tier B orbital-type (co-orbital, quasi-
  satellite, horseshoe, sesquinary, binary pair, shepherd gap, captured
  retrograde, Laplace-resonant, chain resonant).
- **Small bodies (44):** Tholen C/S/M/V asteroids, binary + contact binary,
  rubble-pile, 4 comet families, 3 dwarf-planet subtypes (Pluto/Ceres/
  Eris), 3 KBO populations, centaur, Jupiter Trojan, meteoroid stream,
  Tier B Bus-DeMeo taxonomy (20 classes A..Xk) + active asteroid + MBC +
  damocloid + Neptune Trojan.
- **Nebulae (24):** HII giant/compact + HI, planetary spherical/bipolar/
  irregular, reflection, dark/MC + Bok globule, SNR shell + plerion,
  Wolf-Rayet, protoplanetary, superbubble, Tier B (Herbig-Haro ± bipolar,
  EGG, pillars, IRDC, cometary globule, H2O maser, GMC, SNR molecular
  shock).
- **Galaxies (29):** Spiral SA/SB, lenticular, elliptical + dwarf
  elliptical + dwarf spheroidal, irregular I/II, AGN Seyfert/Quasar/Radio/
  Blazar/LINER, starburst, ring, jellyfish, ULIRG, ultra-diffuse, merging,
  Tier B (Green Pea, polar ring, tidal dwarf, cD, BCG, chain edge-on,
  HyLIRG, UCD, UFD, BCD).
- **Large-scale structure (17):** Open cluster, globular cluster, OB
  association, cluster collision, Lyman-α blob, galaxy group/cluster/
  supercluster, cosmic filament, cosmic void, Great Wall, CMB (texture
  exception), Tier B Abell R0/R1/R2 + SZ-detected + X-ray selected.
- **Exotic (25):** Quark, strange, preon, boson, gravastar, white hole,
  wormhole, cosmic string, DM halo, DE void, magnetar, Thorne-Żytkow,
  primordial BH, quasi-star, Planck star, naked singularity, Tier B
  IMBH + wandering BH + CCO.
- **Transient (5, Tier B):** GRB afterglow, FRB site, TDE, kilonova,
  X-ray burster — new family introduced in viz-visuals.md §V14.

Each entity type has: procedural GLSL shader (via MaterialFactory or a
per-family *Material.ts builder), interactive toggles (Doc 22), info
panel data spec, and test cases (Doc 30). Tier A coverage is tracked in
`docs/17-coverage-checklist.md`; Tier B extensions are tracked in
`apps/web/tests/entCoverage.ts` fixture.

`→ Doc 17 for full Tier A taxonomy, Doc 18 for all shader specs, Doc 22 for toggle features, viz-visuals.md for Tier B roadmap`

---

## Coordinate System

**ICRS J2000.0** — the IAU standard. All positions stored as (RA, Dec, distance).

- **Stars:** RA/Dec in degrees, distance in parsecs
- **Solar system:** Heliocentric ecliptic, converted via SPICE
- **Rendering:** Camera-relative floating-origin (subtract camera pos every frame to avoid float32 precision loss at astronomical distances)
- **Depth buffer:** Logarithmic (`gl_FragDepth = log2(z) * coef`) — no z-fighting from AU to Gpc scale

`→ Doc 23 for spatial database, Doc 19 for navigation and scale transitions`

---

## Scale Regime State Machine

```
Solar System (< 0.1 ly) ↔ Stellar (0.1 – 500 ly) ↔ Galactic (500 ly – 100 kly) ↔ Cosmic (> 100 kly)
```

Each transition has a **hysteresis band** (prevents flicker at boundaries). Scale changes trigger: LOD recalculation, tile set swap, background music crossfade, UI mode adaptation.

`→ Doc 27 §9 for state machine, Doc 19 for full navigation spec`

---

## Testing

**113 test cases across 16 suites** mapped to SRS requirements:

| Suite | Tests | Key Checks |
|-------|-------|------------|
| TS-COORD | 10 | Coordinate conversions, Kepler solver, polar singularities |
| TS-RENDER | 10 | Spectral colors, PBR, volumetric nebulae, CRT effect, WebGL loss |
| TS-NAV | 7 | WASD, orbit, fly-to, scale transitions, z-fighting |
| TS-SEARCH | 7 | Full-text, autocomplete <50ms, cone search, advanced filters |
| TS-TIME | 7 | Ephemeris vs JPL Horizons, playback, epoch boundaries |
| TS-TILE | 6 | Binary decode, LRU eviction, IndexedDB cache, error handling |
| TS-API | 8 | Schema validation, rate limiting, pagination, CORS, ETag |
| TS-PERF | 7 | FPS ≥55 mid-tier, FCP, TTI, bundle size, memory leak, long tasks |
| TS-VQA | 7 | Color accuracy (ΔE2000), SSIM >0.65, pHash regression |
| TS-DATA | 6 | Cross-validate Sirius/Andromeda/planets vs authoritative sources |
| TS-SEC | 6 | HTTPS, auth, SQL injection, XSS, CORS, rate burst |
| TS-A11Y | 5 | Keyboard nav, screen reader, reduced motion, contrast |
| TS-E2E | 5 | Full user journeys (First Contact, Educator, Research) |

**Visual QA thresholds:** Stars ΔE < 3.0, Planets ΔE < 5.0, Nebulae ΔE < 4.0, SSIM > 0.65, pHash Hamming ≤ 8.

`→ Doc 30 for all 113 test cases with steps and expected results`
`→ Doc 33 for data accuracy validation pipeline`

---

## Development Commands

```bash
# Setup
pnpm install                          # Install all deps
docker compose -f infra/docker/docker-compose.yml up -d  # Start backend
./scripts/seed-db.sh                  # Seed database

# Frontend
pnpm --filter web dev                 # Dev server (localhost:5173)
pnpm --filter web dev:mock            # Mock API mode (no backend)
pnpm --filter web dev:https           # HTTPS (for SharedArrayBuffer)

# Testing
pnpm test                             # All tests
pnpm --filter web test                # Frontend unit tests
pnpm --filter web test:e2e            # Playwright E2E
pnpm lint                             # ESLint + Prettier check
pnpm typecheck                        # TypeScript strict check

# Build
pnpm build                            # Full production build
pnpm --filter web build:analyze       # Bundle analysis
```

---

## Documentation Map (33 docs)

When Claude Code needs detailed specs, reference these:

| Need | Read |
|------|------|
| What to build (features) | Doc 03 (PRD), SRS, DFS |
| UI design specs | Doc 24 (AETHER V4), Doc 20 (per-persona), Doc 21 (screens) |
| System architecture | Doc 09 (overview), Doc 25 (backend), Doc 27 (frontend state) |
| API endpoints | Doc 26 (OpenAPI contract) |
| Entity data & shaders | Doc 17 (catalog), Doc 18 (shaders), Doc 22 (toggles) |
| Spatial data & coordinates | Doc 23 (spatial DB), Doc 19 (navigation) |
| TypeScript types | Doc 11 (data model) |
| Performance | Doc 12 (optimization), Doc 10 (specs) |
| Testing | Doc 30 (113 test cases), Doc 13 (strategy), Doc 33 (data accuracy) |
| Security | Doc 29 |
| Deployment | Doc 32 (release), Doc 31 (observability) |
| Dev setup & git workflow | Doc 28 |
| Accessibility & i18n | Doc 16 |

---

## Critical Rules

1. **No texture atlases** — all visuals are procedural GLSL. Exceptions: skybox cubemap, Planck 2018 CMB sphere (T47 ENT-7040, `data/cosmology/planck-2018-smica-2048.png`), SFD dust-extinction map (T46a Milky Way interior view, `data/milkyway/sfd-dust-1024.png`). All other entities — including every ENT-ID in Doc 17 — MUST render via procedural GLSL.
2. **Zustand, not Redux** — `getState()` in the render loop, `useStore()` with selectors in React.
3. **Three.js r184 direct** — no React Three Fiber, no drei, no postprocessing from examples.
4. **Camera-relative rendering** — subtract camera world position every frame. Never use absolute coordinates in GPU.
5. **ICRS J2000.0** — all astronomical coordinates in this epoch. No exceptions.
6. **Logarithmic depth buffer** — required at all times. No standard depth.
7. **Web Workers for data** — tile parsing, octree queries, physics computations. Never block the main thread.
8. **AETHER V4 styling** — Press Start 2P headings, CRT scanlines, phosphor glow. See Doc 24.
9. **Strict TypeScript** — no `any`, no `// @ts-ignore`, no `as unknown as X`.
10. **Performance first** — if a feature can't maintain 60fps on mid-tier, add quality tiers or don't ship it.
