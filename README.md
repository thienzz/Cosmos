<h1 align="center">Cosmos Explorer</h1>

<p align="center">
  <strong>An interactive 3D web visualization of the observable universe.</strong><br/>
  From individual moons to cosmic-web filaments — rendered by procedural GLSL on the GPU. No texture atlases. No shortcuts.
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black">
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-r184-000000?logo=three.js&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white">
  <img alt="Rust" src="https://img.shields.io/badge/Rust-1.86-DEA584?logo=rust&logoColor=white">
  <img alt="WebGL 2.0" src="https://img.shields.io/badge/WebGL-2.0-990000?logo=webgl&logoColor=white">
  <img alt="Status" src="https://img.shields.io/badge/status-active%20development-orange">
</p>

---

## The Scale

| Domain | Count | Source |
| --- | ---: | --- |
| Stars | **1.8 billion** | Gaia DR3 (~10M-star bright subset streamed via tile pyramid) |
| Galaxies | **4 million** | HyperLEDA + SDSS DR17 (HEALPix tiles) |
| Solar-system bodies | **1.3 million** | JPL DE441 + MPC + JPL comets + 293 moons |
| Confirmed exoplanets | **5,800** | NASA Exoplanet Archive |
| Nebulae | **15,000** | NGC/IC + Sharpless + Barnard + Lynds + Strasbourg PN |
| Star clusters | **3,000** | Harris globulars + Dias open clusters |
| Galaxy clusters | **7,500** | Abell + Planck SZ |
| Cosmic-web nodes | **500,000+** | IllustrisTNG mesh |
| **Entity subtypes** | **262** | Across 10 families |
| **Interactive toggles** | **~6,800** | ~26 per entity |

---

## What Makes It Different

- **Procedural everything.** 121+ GLSL shaders generate every visual on the GPU. Only three textures exist anywhere: the skybox, the Planck 2018 CMB sphere, and the SFD dust-extinction map. Every star, planet, moon, nebula, galaxy, quasar, gravastar, and cosmic filament is math.
- **Real data, real physics.** ICRS J2000.0 coordinates. JPL SPICE ephemerides via SpiceyPy. Bus-DeMeo asteroid taxonomy. White-dwarf cooling sequence (DA/DB/DC/DQ/DZ/DO). Logarithmic depth buffer that survives from AU to Gpc scale without z-fighting.
- **The two-loop problem, solved.** React's reconciliation loop and Three.js's `requestAnimationFrame` loop run side by side, bridged by Zustand stores with a hot/warm/cool/cold state-temperature model — the render loop reads camera and time via `getState()` with zero subscriptions and zero allocations.
- **Camera-relative rendering.** Every frame subtracts camera world position before submitting to the GPU. Float32 doesn't collapse 13.8 billion light-years away.
- **AETHER V4 design language.** Retro-futuristic terminal aesthetic — Press Start 2P headings, Space Mono body, IBM Plex Mono data, CRT scanlines, phosphor glow, neon accents on deep black.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  apps/web — React 18 + Three.js r184 + Zustand + Vite           │
│  ─────────────────────────────────────────────────              │
│  React UI  ←  getState()  →  Zustand stores  ←  getState()  →   │
│                                  ↕                          rAF │
│                          Web Workers (4–8)                      │
│                  tile parsing · octree · physics                │
└──────────────┬──────────────────────────────────────────────────┘
               │  HTTP/2 binary tiles + WebSocket (viewport / time)
┌──────────────┴──────────────────────────────────────────────────┐
│  API Gateway (Fastify)                                          │
│    → Tile Server (Rust, 50k req/s target)                       │
│    → Ephemeris (Python · FastAPI · SpiceyPy · DE441)            │
│    → Postgres 16 + PostGIS 3.4   Elasticsearch 8   Redis 7      │
│    → Airflow ETL (Gaia DR3 · SDSS DR18 · MPC · JPL)             │
└─────────────────────────────────────────────────────────────────┘
```

**Scale-regime state machine:** `Solar System ↔ Stellar ↔ Galactic ↔ Cosmic`, each transition gated by a hysteresis band that swaps LOD, tile sets, and ambient audio without flicker.

---

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | TypeScript 5.4 (`strict: true`), React 18, Three.js r184 (direct — no R3F, no drei), Zustand 4, Jotai 2 |
| Build | Vite 5, pnpm + Turborepo monorepo, GLSL ES 3.0 (WebGL 2.0) |
| Audio | Tone.js — procedural synthesis, no audio files |
| Client cache | Dexie.js over IndexedDB (500 MB LRU) |
| Backend | Fastify (Node.js), Rust tile server, FastAPI + SpiceyPy |
| Data | PostgreSQL 16 + PostGIS 3.4, Elasticsearch 8, Redis 7 |
| ETL | Apache Airflow |
| Testing | Vitest, Playwright, visual QA (ΔE2000 + SSIM + pHash) |

---

## Performance Budgets (hard limits)

| Metric | Target |
| --- | --- |
| FPS (mid-tier GPU) | **≥ 60** — adaptive quality degrades at < 55 |
| FPS (low-tier GPU) | ≥ 30 — degrades at < 25 |
| Max draw calls / frame | 500 (instancing + batching) |
| Max triangles / frame (mid) | 1.5 M |
| JS bundle (gzipped) | **< 500 KB** |
| FCP / LCP / TTI | < 1.5 s / 2.5 s / 3.5 s |
| Autocomplete latency P95 | **< 50 ms** |
| GPU VRAM budget (mid) | 192 MB |
| Tile fetch concurrency | 6 (HTTP/2 multiplex) |

---

## Quick Start

```bash
# 1. Copy the environment template.
cp .env.example .env

# 2. Install dependencies.
pnpm install

# 3. Start backend services (Postgres + PostGIS, Redis, Elasticsearch, API).
docker compose -f infra/docker/docker-compose.yml up -d

# 4. Start the frontend dev server.
pnpm --filter web dev
```

Open <http://localhost:5173>.

**No backend?** Run the frontend in mock-API mode:

```bash
pnpm --filter web dev:mock
```

**Useful commands**

```bash
pnpm test                  # all tests
pnpm --filter web test:e2e # Playwright E2E
pnpm typecheck             # TS strict
pnpm lint                  # ESLint + Prettier
pnpm build                 # production build
```

---

## Repository Layout

```
cosmos-explorer/
├── apps/
│   ├── web/           # React + Three.js renderer — the main thing
│   ├── api/           # Fastify API gateway
│   ├── tile-server/   # Rust tile server (50k req/s target)
│   ├── ephemeris/     # Python ephemeris (FastAPI + SPICE)
│   └── etl/           # Airflow DAGs (Gaia DR3, SDSS DR18, MPC)
├── packages/
│   ├── api-client/        # Generated from OpenAPI
│   ├── tile-decoder/      # Binary tile format
│   ├── coordinate-utils/  # ICRS J2000.0 ↔ Cartesian
│   └── shared-types/
├── data/
│   ├── seeds/             # 10K stars, 1K galaxies, solar system
│   ├── spice/             # SPICE kernels (Git LFS, ~600 MB)
│   └── fixtures/
├── infra/docker/          # Local dev compose
└── docs/                  # 33 specs (architecture, shaders, test cases…)
```

---

## Entity Catalog — 262 Subtypes Across 10 Families

| Family | Count | Highlights |
| --- | ---: | --- |
| Stars | 51 | Main sequence O–M · brown dwarfs L/T/Y · carbon C-R/N/J · pre-MS (Herbig Ae/Be, T Tauri, FU Ori) · variables (Cepheid, RR Lyrae, Mira, LBV) · WR, AGB, post-AGB · WD 6-class cooling · neutron · pulsar · magnetar |
| Planets | 42 | Solar four + giants · hot Jupiter · super-Earth · hycean · eyeball · magma · carbon-diamond · iron · puffy · synestia · chthonian · rogue |
| Moons | 25 | Galilean · Titan / Enceladus · Triton · shepherd · Trojan · binary · sesquinary · Laplace-resonant chain |
| Small bodies | 44 | Bus-DeMeo taxonomy (20 classes A..Xk) · 4 comet families · KBOs · centaurs · MBCs · Neptune Trojans |
| Nebulae | 24 | HII / HI · planetary spherical/bipolar/irregular · reflection · dark + Bok · SNR shell/plerion · WR · Herbig-Haro · pillars |
| Galaxies | 29 | Spiral SA/SB · lenticular · elliptical · AGN family (Seyfert, Quasar, Radio, Blazar, LINER) · starburst · jellyfish · ring · ULIRG · UDG |
| Large-scale structure | 17 | Open / globular clusters · OB associations · supercluster · filament · void · Great Wall · CMB |
| Exotic | 25 | Quark · strange · preon · boson · gravastar · wormhole · cosmic string · DM halo · DE void · primordial BH · quasi-star · Planck star |
| Transients | 5 | GRB afterglow · FRB site · TDE · kilonova · X-ray burster |
| Special | — | 88 IAU constellations · 110 Messier · 7,840 NGC · 5,386 IC · 109 Caldwell |

Each entity carries a procedural shader (resolved by `apps/web/src/engine/MaterialFactory.ts`), ~26 interactive toggles, and dedicated test fixtures.

---

## Testing

**113 test cases across 16 suites** mapped to SRS requirements — see [`docs/30-test-cases.md`](docs/30-test-cases.md).

| Suite | Tests | Focus |
| --- | ---: | --- |
| TS-COORD | 10 | Coordinate conversions · Kepler solver · polar singularities |
| TS-RENDER | 10 | Spectral colors · PBR · volumetric nebulae · CRT effect |
| TS-NAV | 7 | WASD · orbit · fly-to · scale transitions |
| TS-SEARCH | 7 | Full-text · autocomplete < 50 ms · cone search |
| TS-TIME | 7 | Ephemeris vs. JPL Horizons · playback |
| TS-TILE | 6 | Binary decode · LRU eviction · IndexedDB |
| TS-PERF | 7 | FPS ≥ 55 mid-tier · FCP · TTI · bundle size |
| TS-VQA | 7 | ΔE2000 · SSIM > 0.65 · pHash regression |
| TS-A11Y | 5 | Keyboard nav · screen reader · reduced motion |

Visual QA thresholds: stars ΔE < 3.0, planets ΔE < 5.0, nebulae ΔE < 4.0, SSIM > 0.65, pHash Hamming ≤ 8.

---

## Documentation

The [`docs/`](docs/) folder has 33 numbered specs. The single source of truth for AI-assisted development is [`CLAUDE.md`](CLAUDE.md) at the repo root.

| Need | Doc |
| --- | --- |
| Product vision · PRD | Doc 01 · Doc 03 |
| UI / design system (AETHER V4) | Doc 24 |
| System architecture | Doc 09 · Doc 25 · Doc 27 |
| API contract (OpenAPI) | Doc 26 |
| Entity taxonomy · shaders · toggles | Doc 17 · Doc 18 · Doc 22 |
| Coordinates · spatial DB | Doc 19 · Doc 23 |
| Performance | Doc 10 · Doc 12 |
| Test cases (113) | Doc 30 |
| Observability · release | Doc 31 · Doc 32 |
| Data accuracy validation | Doc 33 |

---

## Roadmap

- [`viz.md`](viz.md) — phased plan to take the backend from scaffold to the full 1.8 B-star universe.
- [`viz-tasks.md`](viz-tasks.md) — atomic task breakdown per phase.

---

## The Nine Rules

1. **No texture atlases.** Procedural GLSL only. Exceptions: skybox, Planck 2018 CMB, SFD dust map.
2. **Zustand `getState()` in the render loop.** `useStore()` with selectors in React.
3. **Three.js r184 direct.** No React Three Fiber. No drei. No `postprocessing` from `three/examples`.
4. **Camera-relative rendering** every frame — never absolute coordinates on the GPU.
5. **ICRS J2000.0** for all astronomical coordinates.
6. **Logarithmic depth buffer**, always.
7. **Web Workers for data.** The main thread renders; it does not parse.
8. **Strict TypeScript.** No `any`. No `@ts-ignore`. No `as unknown as X`.
9. **60 fps on mid-tier GPU**, or it doesn't ship.

---

<p align="center">
  <sub>Built with TypeScript, Three.js, and a logarithmic depth buffer.</sub>
</p>
