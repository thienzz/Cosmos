# Phase E Preview Verification — T-E-09

**Date:** 2026-04-22
**Tile server:** `cosmos-tile-server` release build, `127.0.0.1:3001`
**Dev server:** `pnpm --filter @cosmos/web dev` via preview_start, `127.0.0.1:5173`
**Fixture:** 42 binary Doc 11 §4.1 tiles at orders 3 & 6 under
`C:\tmp\cosmos-tile-fixtures\stars\healpix\{3,6}\*.bin`

## preview_eval snapshot

Reading `window.__cosmosEngine.tileStreaming` after driving 20 enqueue
hints at `stars/healpix/3/*` with `activeRegime='stellar'`:

```json
{
  "regime": "stellar",
  "stats": {
    "fetches": 20,
    "avgFetchMs": 7.88,
    "lastFetchMs": 4.4,
    "serverCacheHits": 0,
    "serverCacheMisses": 0,
    "serverCacheHitRate": null
  },
  "netReqCount": 20,
  "firstThreeUrls": [
    "http://localhost:3001/v1/tiles/stars/healpix/3/0",
    "http://localhost:3001/v1/tiles/stars/healpix/3/1",
    "http://localhost:3001/v1/tiles/stars/healpix/3/2"
  ],
  "avgDurationMs": 4
}
```

## Network log (trimmed)

20 × `GET http://localhost:3001/v1/tiles/stars/healpix/3/{0..19} → 200 OK`
issued through `fetchTileByAddress` (the TSM's fetcher) with
`VITE_TILE_SERVER_URL=http://localhost:3001/v1`. Manifest still routes
to the API gateway via the vite proxy (`GET /v1/tiles/manifest → 200`).

## Verdict vs viz.md Phase E E.4

| Expectation              | Target | Observed | Pass |
|--------------------------|--------|----------|------|
| tileRequests ≥ 12        | 12     | 20       | ✅   |
| avgTileFetchMs < 100     | <100   | 7.88     | ✅   |
| tile-server route hit    | /v1/tiles/stars/healpix/ | all 20 | ✅ |
| Dev wiring uses VITE_TILE_SERVER_URL | 3001 | 3001 | ✅ |

`serverCacheHitRate` is `null` because the Rust server doesn't emit an
`x-cache` header in dev (that's a CDN / edge concern). The client
handles the null gracefully per the T-E-08 unit tests. Once Phase J's
Cloudflare front lands, `x-cache: HIT/MISS` will start populating the
rollup and the smoke test's `serverCacheHitRate` assertion can tighten.

No console errors. No failed requests.

## Reproduce

```powershell
# 1. Build release tile-server + seed fixtures
cargo build --release --manifest-path apps/tile-server/Cargo.toml
# (fixture generator: 20 tiles each at order 3 and 6 — see
# scripts/bench-tile-server.ps1's fixture block for the template)

# 2. Start tile-server
$env:COSMOS_TILE_ROOT = 'C:\tmp\cosmos-tile-fixtures'
$env:TILE_SERVER_PORT = '3001'
apps/tile-server/target/release/cosmos-tile-server.exe

# 3. Start web dev server
pnpm --filter @cosmos/web dev

# 4. In the browser console (or via preview_eval), run the snippet from
# viz.md Phase E verify block E.4 — substitute direct
# TileStreamingManager.enqueue() if no real tiles live at the flight target.
```
