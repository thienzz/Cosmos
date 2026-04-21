# Cosmos Explorer — Developer Setup & Contributing Guide

**Document:** 28 — Developer Setup & Contributing Guide  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  
**Depends On:** Doc 10 (Tech Specs), Doc 25 (Backend Architecture), Doc 27 (Frontend State)  
**Audience:** New and existing developers onboarding to the project

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Structure](#2-repository-structure)
3. [Frontend Setup](#3-frontend-setup)
4. [Backend Setup](#4-backend-setup)
5. [Data Pipeline Setup](#5-data-pipeline-setup)
6. [Environment Variables](#6-environment-variables)
7. [Development Workflow](#7-development-workflow)
8. [Code Style & Conventions](#8-code-style--conventions)
9. [Git Workflow & Branching](#9-git-workflow--branching)
10. [Testing Guide](#10-testing-guide)
11. [Debugging Tips](#11-debugging-tips)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [Contributing Process](#13-contributing-process)
14. [Architecture Decision Records](#14-architecture-decision-records)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Software

| Software | Version | Purpose | Install |
|----------|---------|---------|---------|
| Node.js | 18.17+ LTS | Frontend runtime | `nvm install 18` |
| pnpm | 8.0+ | Package manager | `npm install -g pnpm` |
| Python | 3.11+ | Backend services, ETL | `pyenv install 3.11` |
| Rust | 1.75+ (stable) | Tile server | `rustup install stable` |
| Docker | 24.0+ | Local databases, services | docker.com |
| Docker Compose | 2.20+ | Service orchestration | Included with Docker Desktop |
| PostgreSQL client | 16+ | Database access | `brew install postgresql@16` |
| Git | 2.40+ | Version control | `brew install git` |
| Git LFS | 3.0+ | Large file storage (shaders, test fixtures) | `brew install git-lfs` |

### 1.2 Recommended Tools

| Tool | Purpose |
|------|---------|
| VS Code + extensions | Primary IDE (see §1.3) |
| Spector.js (browser extension) | WebGL frame inspection |
| Redux DevTools (browser extension) | Zustand state inspection |
| pgAdmin 4 or DataGrip | PostgreSQL GUI |
| Postman or Bruno | API testing |
| Blender 3.6+ | 3D asset inspection (optional) |

### 1.3 VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "slevesque.shader",
    "ms-python.python",
    "rust-lang.rust-analyzer",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens",
    "streetsidesoftware.code-spell-checker",
    "yoavbls.pretty-ts-errors",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 1.4 Hardware Requirements (Development)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Quad-core 2.5 GHz | 8-core 3.5 GHz |
| RAM | 16 GB | 32 GB |
| GPU | Any with WebGL 2.0 | Dedicated GPU (RTX 3050+) |
| Storage | 50 GB free (SSD) | 100 GB free (NVMe SSD) |
| Display | 1920×1080 | 2560×1440 or higher |

---

## 2. Repository Structure

```
cosmos-explorer/
├── apps/
│   ├── web/                     # Frontend (React + Three.js)
│   │   ├── src/                 # Source code (see Doc 27 §3.1 for module map)
│   │   ├── public/              # Static assets
│   │   │   ├── shaders/         # GLSL shader files
│   │   │   └── textures/        # Reference textures, noise library
│   │   ├── tests/               # Vitest unit + integration tests
│   │   ├── e2e/                 # Playwright E2E tests
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── api/                     # API Gateway (Node.js/Express or Fastify)
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── tile-server/             # Rust tile server
│   │   ├── src/
│   │   ├── tests/
│   │   └── Cargo.toml
│   │
│   ├── ephemeris/               # Python ephemeris service
│   │   ├── ephemeris_service.py
│   │   ├── tests/
│   │   └── requirements.txt
│   │
│   └── etl/                     # Airflow ETL pipelines
│       ├── dags/
│       ├── plugins/
│       └── requirements.txt
│
├── packages/
│   ├── api-client/              # Generated TypeScript API client (Doc 26)
│   ├── tile-decoder/            # Binary tile decoder library
│   ├── coordinate-utils/        # RA/Dec ↔ Cartesian transforms
│   └── shared-types/            # Shared TypeScript types
│
├── data/
│   ├── seeds/                   # Seed data for local development
│   │   ├── stars_sample.sql     # 10,000 representative stars
│   │   ├── galaxies_sample.sql  # 1,000 galaxies
│   │   ├── solar_system.sql     # All solar system bodies
│   │   └── tiles_sample/        # ~100 pre-built tiles for testing
│   ├── spice/                   # SPICE kernel files (Git LFS)
│   │   ├── de440.bsp
│   │   ├── naif0012.tls
│   │   └── pck00011.tpc
│   └── fixtures/                # Test fixture data
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml   # Local dev stack
│   │   ├── docker-compose.test.yml
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.tile-server
│   │   ├── Dockerfile.ephemeris
│   │   └── Dockerfile.etl
│   ├── k8s/                     # Kubernetes manifests
│   └── terraform/               # Infrastructure as Code
│
├── docs/                        # Documentation suite (this directory)
│   ├── 00-documentation-index.md
│   ├── 01-product-vision-and-strategy.md
│   ├── ...
│   └── 33-data-accuracy-validation.md
│
├── scripts/
│   ├── setup.sh                 # One-command dev setup
│   ├── seed-db.sh               # Seed local database
│   ├── generate-api-client.sh   # Regenerate API client from OpenAPI spec
│   ├── build-tiles.sh           # Build sample tiles from seed data
│   └── download-spice.sh       # Download SPICE kernels
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # Test + lint on PR
│   │   ├── build.yml            # Build on merge to main
│   │   └── deploy.yml           # Deploy to staging/production
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│
├── .env.example                 # Environment variable template
├── pnpm-workspace.yaml          # Workspace configuration
├── turbo.json                   # Turborepo pipeline config
└── CLAUDE.md                    # AI assistant context
```

---

## 3. Frontend Setup

### 3.1 Quick Start

```bash
# Clone repository
git clone git@github.com:cosmos-explorer/cosmos-explorer.git
cd cosmos-explorer

# Initialize Git LFS (for SPICE kernels, test fixtures)
git lfs install
git lfs pull

# Install all dependencies
pnpm install

# Start local backend services (PostgreSQL, Redis, Elasticsearch)
docker compose -f infra/docker/docker-compose.yml up -d

# Seed the database with sample data
./scripts/seed-db.sh

# Start the frontend dev server
pnpm --filter web dev
```

The app will be available at `http://localhost:5173`.

### 3.2 Frontend Dev Server Options

```bash
# Standard development (hot reload, source maps)
pnpm --filter web dev

# Development with mock API (no backend needed)
pnpm --filter web dev:mock

# Development with HTTPS (required for SharedArrayBuffer)
pnpm --filter web dev:https

# Build production bundle
pnpm --filter web build

# Preview production build locally
pnpm --filter web preview

# Bundle analysis
pnpm --filter web build:analyze
```

### 3.3 Mock API Mode

For frontend-only development without running backend services, use mock mode. It serves pre-recorded API responses from `apps/web/tests/mocks/`:

```bash
pnpm --filter web dev:mock
```

Mock data includes 10,000 stars, 100 galaxies, the full solar system, and sample tiles. Sufficient for UI development and basic 3D rendering.

### 3.4 Shader Development

GLSL shaders live in `apps/web/public/shaders/`. The Vite dev server serves them as static assets with hot reload:

```bash
# Changes to .glsl / .vert / .frag files trigger automatic recompilation
# Shader compilation errors appear in the browser console and the AETHER V4 terminal overlay
```

Use Spector.js browser extension to inspect draw calls, shader programs, and GPU state.

---

## 4. Backend Setup

### 4.1 Docker Compose (Local Development)

The `docker-compose.yml` starts all backend dependencies:

```yaml
# infra/docker/docker-compose.yml
services:
  postgres:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: cosmos
      POSTGRES_USER: cosmos
      POSTGRES_PASSWORD: cosmos_dev
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  elasticsearch:
    image: elasticsearch:8.12.0
    ports: ["9200:9200"]
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"

  api:
    build: { context: ../.., dockerfile: infra/docker/Dockerfile.api }
    ports: ["3000:3000"]
    depends_on: [postgres, redis, elasticsearch]
    environment:
      - DATABASE_URL=postgresql://cosmos:cosmos_dev@postgres:5432/cosmos
      - REDIS_URL=redis://redis:6379
      - ELASTICSEARCH_URL=http://elasticsearch:9200

  tile-server:
    build: { context: ../.., dockerfile: infra/docker/Dockerfile.tile-server }
    ports: ["3001:3001"]
    depends_on: [redis]

  ephemeris:
    build: { context: ../.., dockerfile: infra/docker/Dockerfile.ephemeris }
    ports: ["3002:3002"]
    volumes:
      - ../../data/spice:/data/spice:ro

volumes:
  pgdata:
```

```bash
# Start all services
docker compose -f infra/docker/docker-compose.yml up -d

# Check service health
docker compose -f infra/docker/docker-compose.yml ps

# View logs
docker compose -f infra/docker/docker-compose.yml logs -f api

# Stop all services
docker compose -f infra/docker/docker-compose.yml down

# Reset (destroy volumes)
docker compose -f infra/docker/docker-compose.yml down -v
```

### 4.2 Running Backend Services Natively

For faster iteration when developing a specific backend service:

**API Gateway:**
```bash
cd apps/api
pnpm install
pnpm dev    # Starts on port 3000
```

**Tile Server (Rust):**
```bash
cd apps/tile-server
cargo run   # Starts on port 3001
```

**Ephemeris Service (Python):**
```bash
cd apps/ephemeris
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn ephemeris_service:app --port 3002 --reload
```

### 4.3 Database Setup

```bash
# Create database and install extensions
psql -U cosmos -d cosmos -h localhost <<EOF
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;
EOF

# Run migrations
pnpm --filter api migrate:up

# Seed with sample data
./scripts/seed-db.sh

# Verify seed data
psql -U cosmos -d cosmos -h localhost -c "SELECT category_name, COUNT(*) FROM entities GROUP BY category_name;"
```

---

## 5. Data Pipeline Setup

### 5.1 Sample Data

For local development, seed data provides a representative subset:

| Dataset | Records | Size | Source |
|---------|---------|------|--------|
| Stars (sample) | 10,000 | 5 MB | Brightest Hipparcos stars + random Gaia sample |
| Galaxies (sample) | 1,000 | 1 MB | Messier + NGC selection |
| Nebulae | 500 | 0.5 MB | Full Messier + IC selection |
| Solar System | 290 | 0.2 MB | All planets, major moons, named asteroids |
| Tiles (pre-built) | 100 | 15 MB | Star tiles covering solar neighborhood |

### 5.2 Full Data (CI/Staging)

Full datasets are too large for local development. They are built and stored in the staging environment:

| Dataset | Records | Size |
|---------|---------|------|
| Stars (full) | 1.8 billion | ~48 GB (tiles) |
| Galaxies (full) | 2 million | ~12 GB (tiles) |
| Cosmic web | 1 million nodes | ~1.3 GB (mesh) |

### 5.3 SPICE Kernels

Download SPICE kernels for ephemeris computation:

```bash
./scripts/download-spice.sh
# Downloads ~600 MB to data/spice/
# Files are tracked by Git LFS
```

---

## 6. Environment Variables

### 6.1 Frontend (.env)

```bash
# apps/web/.env.local (not committed)
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_WS_URL=ws://localhost:3000/v1/ws
VITE_TILE_SERVER_URL=http://localhost:3001/v1
VITE_EPHEMERIS_URL=http://localhost:3002/v1
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_DEVTOOLS=true
VITE_SENTRY_DSN=                    # Optional, for error tracking
VITE_ANALYTICS_ENDPOINT=            # Optional
```

### 6.2 Backend (.env)

```bash
# .env (root, not committed)
DATABASE_URL=postgresql://cosmos:cosmos_dev@localhost:5432/cosmos
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
SPICE_KERNEL_DIR=./data/spice
API_PORT=3000
TILE_SERVER_PORT=3001
EPHEMERIS_PORT=3002
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_ANONYMOUS=60
RATE_LIMIT_REGISTERED=300
```

### 6.3 Environment Variable Validation

The API server validates all required environment variables at startup using `envalid`:

```typescript
import { cleanEnv, str, port, url, num } from 'envalid';

const env = cleanEnv(process.env, {
  DATABASE_URL: url(),
  REDIS_URL: url(),
  ELASTICSEARCH_URL: url(),
  API_PORT: port({ default: 3000 }),
  LOG_LEVEL: str({ choices: ['debug', 'info', 'warn', 'error'], default: 'info' }),
  CORS_ORIGIN: str({ default: 'http://localhost:5173' }),
});
```

---

## 7. Development Workflow

### 7.1 Daily Development Cycle

```
1. Pull latest main          → git pull origin main
2. Start backend services    → docker compose up -d
3. Start frontend dev server → pnpm --filter web dev
4. Create feature branch     → git checkout -b feat/COSMOS-123-entity-detail
5. Make changes, test locally
6. Run linting + tests       → pnpm lint && pnpm test
7. Commit with conventional commits
8. Push and open PR           → git push -u origin feat/COSMOS-123-entity-detail
```

### 7.2 Turborepo Commands

```bash
# Run all tests across all packages
pnpm test

# Run tests for a specific package
pnpm --filter web test
pnpm --filter api test
pnpm --filter tile-decoder test

# Lint everything
pnpm lint

# Type-check everything
pnpm typecheck

# Build everything (respects dependency order)
pnpm build

# Clean all build artifacts
pnpm clean
```

### 7.3 Hot Module Replacement

The Vite dev server supports HMR for:
- React components (state-preserving hot reload)
- CSS/Tailwind changes
- GLSL shader files (recompiles affected programs)
- Zustand stores (preserves state across reloads)

Three.js engine changes typically require a full page reload (the WebGL context and scene graph cannot be hot-swapped).

---

## 8. Code Style & Conventions

### 8.1 TypeScript

- **Strict mode mandatory**: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- **No `any`**: Use `unknown` when type is truly unknown, then narrow
- **Interfaces over types** for object shapes (extensible, better error messages)
- **Enums**: Use `const enum` for compile-time only, or string unions for runtime values
- **Imports**: Absolute paths via `@/` prefix (configured in `tsconfig.json`)

### 8.2 React

- **Functional components only** (no class components)
- **Named exports** for components, default exports for pages/routes
- **Custom hooks** for any logic that touches stores, API, or side effects
- **Memoization**: `useMemo`/`useCallback` only when profiler shows re-render cost; do not premature-optimize
- **Error boundaries** around each major UI section (Doc 27 §15)

### 8.3 GLSL Shaders

- File extension: `.vert` (vertex), `.frag` (fragment), `.glsl` (shared)
- GLSL ES 3.0 (`#version 300 es`)
- Prefix all uniforms with `u_` (e.g., `u_time`, `u_cameraPosition`)
- Prefix all varyings with `v_` (e.g., `v_worldPosition`, `v_normal`)
- Prefix all attributes with `a_` (e.g., `a_position`, `a_color`)
- Document each uniform with `// @param` comments
- Include quality tier `#ifdef` guards for expensive operations

### 8.4 Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Files (TS/TSX) | camelCase | `cameraStore.ts`, `useEntity.ts` |
| Files (Component) | PascalCase | `InfoPanel.tsx`, `SearchBar.tsx` |
| Files (Worker) | camelCase.worker | `tileParser.worker.ts` |
| Files (GLSL) | kebab-case | `star-corona.frag` |
| Variables | camelCase | `selectedEntityId` |
| Constants | SCREAMING_SNAKE | `MAX_TILE_CACHE_SIZE` |
| Types/Interfaces | PascalCase | `CameraState`, `TileLoadState` |
| CSS classes | AETHER V4 tokens | (see Doc 24 §12) |
| API routes | kebab-case | `/solar-system/bodies` |
| Database columns | snake_case | `entity_type`, `distance_pc` |

### 8.5 ESLint + Prettier

Configuration is at the repo root. Key rules:

```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "react/prop-types": "off",
    "react-hooks/exhaustive-deps": "warn",
    "import/order": ["error", { "groups": ["builtin", "external", "internal"] }]
  }
}
```

Prettier: 2-space indent, single quotes, trailing commas, 100 char line width.

---

## 9. Git Workflow & Branching

### 9.1 Branch Strategy

```
main ────────────────────────────────────────────── (production-ready)
  │
  ├── develop ──────────────────────────────────── (integration branch)
  │     │
  │     ├── feat/COSMOS-123-entity-detail ──────── (feature work)
  │     ├── fix/COSMOS-456-tile-crash ──────────── (bug fixes)
  │     ├── chore/update-threejs-r185 ──────────── (maintenance)
  │     └── docs/api-contract-update ──────────── (documentation)
  │
  └── release/v1.0.0 ──────────────────────────── (release candidate)
```

### 9.2 Commit Message Convention

Follow Conventional Commits:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Scopes:** `web`, `api`, `tile-server`, `ephemeris`, `etl`, `docs`, `infra`, `shared`

Examples:
```
feat(web): add entity detail panel with AETHER V4 styling
fix(tile-server): prevent panic on malformed tile address
perf(web): reduce star field draw calls by 40% via instancing
docs: add API contract specification (Doc 26)
chore(infra): upgrade PostgreSQL to 16.2
```

### 9.3 Pull Request Requirements

Every PR must:
- Pass all CI checks (lint, typecheck, unit tests, integration tests)
- Have at least 1 approval from a code owner
- Include a description linking to the relevant ticket (e.g., `Closes COSMOS-123`)
- Not increase bundle size by >5 KB without justification
- Include tests for new functionality
- Update relevant documentation if behavior changes

### 9.4 Code Owners

```
# .github/CODEOWNERS
apps/web/src/engine/       @cosmos-explorer/rendering-team
apps/web/src/stores/       @cosmos-explorer/frontend-team
apps/web/public/shaders/   @cosmos-explorer/rendering-team
apps/tile-server/          @cosmos-explorer/backend-team
apps/ephemeris/            @cosmos-explorer/backend-team
apps/api/                  @cosmos-explorer/backend-team
docs/                      @cosmos-explorer/docs-team
infra/                     @cosmos-explorer/platform-team
```

---

## 10. Testing Guide

### 10.1 Test Structure

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm --filter web test src/stores/cameraStore.test.ts

# Run E2E tests (requires dev server running)
pnpm --filter web test:e2e

# Run visual regression tests
pnpm --filter web test:visual

# Run shader compilation tests
pnpm --filter web test:shaders
```

### 10.2 Unit Test Guidelines

- Test files co-located with source: `cameraStore.ts` → `cameraStore.test.ts`
- Use `vi.mock()` for external dependencies, not for internal modules
- Test behavior, not implementation details
- Avoid testing framework-level behavior (don't test that React renders)

### 10.3 Visual QA Tests

Per Doc 13 §4 (Visual QA Acceptance Criteria):

```bash
# Run color accuracy tests (CIE ΔE2000)
pnpm --filter web test:visual-qa -- --suite=color-accuracy

# Run structural similarity tests (SSIM)
pnpm --filter web test:visual-qa -- --suite=ssim

# Run perceptual hash regression tests
pnpm --filter web test:visual-qa -- --suite=phash-regression

# Run animation FPS tests
pnpm --filter web test:visual-qa -- --suite=animation-fps
```

### 10.4 API Contract Tests

Tests generated from the OpenAPI spec (Doc 26) ensure API responses match the contract:

```bash
pnpm --filter api test:contract
```

---

## 11. Debugging Tips

### 11.1 WebGL Debugging

- **Spector.js**: Capture frames, inspect draw calls, view shader programs, check texture bindings
- **Chrome DevTools → Performance tab**: Profile GPU time, identify bottleneck passes
- **`renderer.info`**: Log Three.js render info (draw calls, triangles, textures in memory)
- **Shader errors**: Check browser console; AETHER V4 terminal overlay also displays compilation errors

### 11.2 State Debugging

- **Redux DevTools**: Zustand stores are visible in Redux DevTools when `devtools` middleware is enabled
- **`window.__COSMOS_STORES__`**: In dev mode, all stores are exposed on `window` for console access
- **State snapshots**: `settingsStore.getState().exportSettings()` exports full settings as JSON

### 11.3 Performance Debugging

```typescript
// Enable built-in performance overlay
settingsStore.getState().setSetting('showPerformanceOverlay', true);

// Metrics shown:
// - FPS (current / average / min)
// - Draw calls
// - Triangles rendered
// - GPU memory used
// - Tiles loaded / pending / cached
// - JS heap size
// - Worker pool utilization
```

### 11.4 Network Debugging

- API requests: Browser DevTools → Network tab, filter by `api.cosmosexplorer.app`
- WebSocket: DevTools → Network → WS tab; messages are JSON-readable
- Tile loading: Tile store exposes `loadedTiles` map with timing data

---

## 12. CI/CD Pipeline

### 12.1 CI Workflow (on every PR)

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    - pnpm lint
    - pnpm typecheck

  test-frontend:
    - pnpm --filter web test --coverage
    - Upload coverage to Codecov

  test-api:
    - Start PostgreSQL, Redis, Elasticsearch (services)
    - pnpm --filter api test
    - pnpm --filter api test:contract

  test-tile-server:
    - cargo test (apps/tile-server)

  test-ephemeris:
    - pytest (apps/ephemeris/tests)

  build:
    - pnpm build
    - Assert bundle size < 500 KB (gzipped)
    - Archive build artifacts

  lighthouse:
    - Run Lighthouse CI on preview deployment
    - Fail if LCP > 2.5s or FPS < 45 on mid-tier
```

### 12.2 Deploy Workflow

```
PR merged to develop → Deploy to staging (automatic)
                     → Run E2E tests against staging
                     → Run visual regression tests

Release branch created → Deploy to production (manual approval)
                       → Tag release in Git
                       → Generate changelog
```

### 12.3 Required CI Status Checks

All of the following must pass before merge:
- `lint` — ESLint + Prettier
- `typecheck` — TypeScript strict compilation
- `test-frontend` — Vitest unit + integration
- `test-api` — API unit + contract tests
- `build` — Production build succeeds
- `bundle-size` — No regression beyond threshold

---

## 13. Contributing Process

### 13.1 First-Time Contributors

1. Read Doc 01 (Product Vision) and Doc 09 (System Architecture) for context
2. Set up dev environment per §3 and §4 above
3. Browse open issues labeled `good-first-issue`
4. Comment on the issue to claim it
5. Follow the branching (§9) and commit (§9.2) conventions
6. Open a PR with the template filled out

### 13.2 PR Review Checklist

Reviewers should verify:
- Code follows style conventions (§8)
- Tests cover the change adequately
- No regressions in bundle size or performance
- Documentation updated if public API or behavior changed
- GLSL changes include quality-tier `#ifdef` guards
- No hardcoded values that should be in settings/config
- Accessibility: new UI elements have ARIA labels and keyboard support
- Cross-references to documentation are correct

### 13.3 Release Process

1. Create release branch from `develop`: `release/v1.x.0`
2. Run full test suite including visual QA
3. Update version in `package.json` files
4. Generate changelog from conventional commits
5. Merge to `main` with merge commit
6. Tag: `git tag v1.x.0`
7. Deploy to production (manual approval in CI)
8. Create GitHub Release with changelog

---

## 14. Architecture Decision Records

Major technical decisions are documented as ADRs in `docs/adr/`:

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Zustand over Redux for state management | Accepted |
| ADR-002 | Rust for tile server over Node.js | Accepted |
| ADR-003 | Procedural PBR shaders over pre-baked NASA textures | Accepted |
| ADR-004 | Octree over BVH for star spatial indexing | Accepted |
| ADR-005 | HEALPix over octree for galaxy tiling | Accepted |
| ADR-006 | AETHER V4 retro-futuristic design over glassmorphism | Accepted |
| ADR-007 | WebGL 2.0 baseline with WebGPU progressive enhancement | Accepted |
| ADR-008 | Session-based bookmarks over account-required persistence | Accepted |

Template for new ADRs:

```markdown
# ADR-NNN: [Title]
**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Deciders:** [names]

## Context
[What is the issue we're deciding on?]

## Decision
[What is the change we're proposing?]

## Consequences
[What are the positive and negative outcomes?]
```

---

## 15. Troubleshooting

### 15.1 Common Issues

**"WebGL 2.0 not supported"**
- Ensure your browser supports WebGL 2.0 (check `chrome://gpu`)
- Update GPU drivers
- Disable hardware acceleration and re-enable

**Docker services fail to start**
- Check port conflicts: `lsof -i :5432` (PostgreSQL), `lsof -i :6379` (Redis)
- Ensure Docker has sufficient resources (4 GB RAM minimum)
- Run `docker compose down -v` and try again

**Tile server panics on startup**
- Ensure Redis is running and accessible
- Check Rust toolchain version: `rustup show`
- Run `cargo build` to check for compilation errors

**Ephemeris service "SPICE kernel not found"**
- Run `./scripts/download-spice.sh` to download kernels
- Verify `data/spice/de440.bsp` exists
- Check `SPICE_KERNEL_DIR` environment variable

**"SharedArrayBuffer is not defined"**
- SharedArrayBuffer requires `Cross-Origin-Isolation` headers
- Use `pnpm --filter web dev:https` which sets COOP/COEP headers
- Or use the fallback path (Transferable ArrayBuffers)

**pnpm install fails with peer dependency warnings**
- Use `pnpm install --no-strict-peer-dependencies` as a workaround
- Report the incompatibility as an issue

### 15.2 Performance Issues

**Low FPS in development**
- Dev mode has no minification or tree-shaking — FPS will be lower than production
- Disable React Strict Mode (double-renders) for performance testing
- Use `pnpm --filter web build && pnpm --filter web preview` for production-like performance

**Memory leaks**
- Check for un-disposed Three.js geometries/materials: `renderer.info.memory`
- Verify tile eviction is working: `tileStore.getState().tilesInMemory`
- Use Chrome DevTools → Memory → Heap snapshot

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | System | Initial developer setup and contributing guide |

---

*Document 28 of 33 — Cosmos Explorer Technical Documentation Suite*  
*Cross-references: Doc 10 (Tech Specs), Doc 25 (Backend Architecture), Doc 27 (Frontend State Management)*
