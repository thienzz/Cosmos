# Cosmos Explorer

Interactive 3D visualization of the observable universe — 96 entity types
rendered via procedural GLSL. Full context in [CLAUDE.md](CLAUDE.md).

## Getting Started

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

Open http://localhost:5173.

## Roadmap

- [viz.md](viz.md) — phased plan to take the backend from scaffold to the full
  1.8B-star universe.
- [viz-tasks.md](viz-tasks.md) — atomic task breakdown for each phase.
