# Visual regression harness (T-V-01)

Detects unintended shader changes by comparing per-ENT-ID screenshots against
committed baselines. Non-blocking for default `pnpm test` — opt-in only.

## Layout

| Path | Purpose |
|---|---|
| `poses.ts` | Camera-pose table keyed by entity kind. |
| `fly-to-ent.ts` | Browser-evaluated helper that flies to a given ENT-ID. |
| `metrics.ts` | Pure-TS ΔE2000 + SSIM + pHash diff primitives. |
| `metrics.test.ts` | Node-side unit tests (run via `pnpm --filter @cosmos/web test`). |
| `runner.ts` | Node-side orchestrator — decode PNG, run diff, return pass/fail. |
| `capture.ts` | Playwright driver that writes baselines to `baseline/`. |
| `baseline/` | 261 committed reference PNGs (seeded by T-V-61; ENT-7040 CMB is inline, excluded). |

## Running

```bash
# Unit tests (pure TS, fast — runs in default test suite):
pnpm --filter @cosmos/web test tests/visual/metrics

# Capture a single baseline (dev server required on :5183):
pnpm --filter @cosmos/web exec vite --port 5183 --strictPort &   # in another shell
pnpm --filter @cosmos/web test:visual:capture ENT-1010

# Capture all baselines (T-V-61 bulk run, ~5–6 min with 4-way concurrency):
pnpm --filter @cosmos/web test:visual:capture-all

# Diff current renders against baselines (CI-friendly):
pnpm --filter @cosmos/web test:visual
```

The capture harness ships its own lightweight page at
[visual-capture.html](../../visual-capture.html) + entry
[src/visualCaptureEntry.ts](../../src/visualCaptureEntry.ts). Each run
navigates once per ENT-ID with `?entId=ENT-NNNN&shader=<key>`, lets the
shader settle for 400 ms, pins `u_time` to a deterministic value, and
screenshots the canvas to `baseline/<family>/<ENT-ID>.png`.

Materials are routed through [src/testHarness/visualCaptureRegistry.ts](../../src/testHarness/visualCaptureRegistry.ts)
which calls the dedicated per-family builders (`createStarMaterial`,
`createPlanetMaterial`, …) so palette + parameter uniforms are
Doc-accurate. Tier B `#define` overlays from
`MaterialFactory.ENT_ID_TO_RENDER` are merged on top so variants
like `CARBON_CR` / `BD_L` render distinctly.

## Thresholds (Doc 33 §Visual QA)

| Metric | Floor | Notes |
|---|---|---|
| ΔE2000 | ≤ 5.0 | Per-family tightening: stars ≤ 3.0, nebulae ≤ 4.0 |
| SSIM | ≥ 0.65 | Luminance-only 8×8 block average |
| pHash Hamming | ≤ 8 | 64-bit DCT-less block hash |

## Status

- [x] Metrics + pose table + fly-to helper — T-V-01 (this scaffold).
- [x] 261 committed baseline PNGs — T-V-61 (bulk capture).
- [ ] Runner loading PNG baselines from disk — T-V-62 (CI integration).
- [ ] GitHub Actions workflow — T-V-62.
