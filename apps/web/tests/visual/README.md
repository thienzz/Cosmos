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
| `baseline/` | 262 committed reference PNGs (seeded by T-V-61). |

## Running

```bash
# Unit tests (pure TS, fast — runs in default test suite):
pnpm --filter @cosmos/web test tests/visual/metrics

# Capture a single baseline (Playwright + preview server required):
pnpm --filter @cosmos/web test:visual:capture ENT-1007

# Capture all baselines (T-V-61 bulk run, ~10 min):
pnpm --filter @cosmos/web test:visual:capture-all

# Diff current renders against baselines (CI-friendly):
pnpm --filter @cosmos/web test:visual
```

## Thresholds (Doc 33 §Visual QA)

| Metric | Floor | Notes |
|---|---|---|
| ΔE2000 | ≤ 5.0 | Per-family tightening: stars ≤ 3.0, nebulae ≤ 4.0 |
| SSIM | ≥ 0.65 | Luminance-only 8×8 block average |
| pHash Hamming | ≤ 8 | 64-bit DCT-less block hash |

## Status

- [x] Metrics + pose table + fly-to helper — T-V-01 (this scaffold).
- [ ] Runner loading PNG baselines from disk — T-V-62 (CI integration).
- [ ] 262 committed baseline PNGs — T-V-61 (bulk capture).
- [ ] GitHub Actions workflow — T-V-62.
