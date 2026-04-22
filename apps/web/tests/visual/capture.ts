/**
 * Baseline capture driver (T-V-01 scaffold, populated by T-V-61).
 *
 * Intended workflow:
 *   1. Launch the dev server (or Playwright-launched build preview).
 *   2. For each ENT-ID in the target list, call `flyToEnt` via page.evaluate.
 *   3. Wait for the configured dwell time and take a page screenshot.
 *   4. Write the PNG to `tests/visual/baseline/<family>/<ENT-ID>.png`.
 *
 * T-V-61 will populate the full 262-entity loop. Today's stub only documents
 * the CLI contract so the `test:visual:capture*` package.json scripts point
 * somewhere meaningful.
 */

const argv = process.argv.slice(2);

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Cosmos Explorer — visual baseline capture (T-V-61 will finish wiring this).

Usage:
  pnpm --filter @cosmos/web test:visual:capture ENT-1007
  pnpm --filter @cosmos/web test:visual:capture-all

Current status: scaffold only. Per viz-visuals.md §V16:
  - T-V-61 populates 262 baseline PNGs under tests/visual/baseline/.
  - T-V-62 wires the CI workflow that diffs current renders vs baseline.

Arguments received: ${JSON.stringify(argv)}
`);
}

printUsage();
process.exit(argv.includes('--strict') ? 1 : 0);
