import { expect, test } from '@playwright/test';

/**
 * P2a regression — star-tile bootstrap must populate the sky regardless of
 * the active scale regime.
 *
 * Before the fix, `TileStreamingManager.enqueue()` dropped every hint when
 * `activeRegime === 'solar_system'` (the default parked pose), leaving
 * `loadedTiles` empty. We now flag bootstrap hints with
 * `bypassRegimeFilter: true`.
 */
test('star tiles load on bootstrap even in solar-system regime', async ({ page }) => {
  await page.goto('/');

  // Give the bootstrap pipeline a window to fetch + decode the 16-tile set.
  // Tiles are ~170 KB each, served from a local Rust tile-server over
  // loopback — well under a 15 s budget on any hardware.
  await expect
    .poll(
      async () =>
        await page.evaluate(async () => {
          const mod = (await import('/src/stores/tileStore.ts')) as {
            useTileStore: { getState(): { loadedTiles: Map<string, { status: string }> } };
          };
          const loaded = mod.useTileStore.getState().loadedTiles;
          let n = 0;
          for (const v of loaded.values()) if (v.status === 'loaded') n++;
          return n;
        }),
      { timeout: 20_000, intervals: [500, 1_000, 2_000] },
    )
    .toBeGreaterThanOrEqual(16);
});

test('boots into stellar regime with camera pulled back to 15k units', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect
    .poll(
      async () =>
        await page.evaluate(async () => {
          const engine = (window as unknown as {
            __cosmosEngine?: {
              camera: { position: { toArray(): number[] } };
              scaleRegime: { current: string };
            };
          }).__cosmosEngine;
          if (!engine) return null;
          return {
            regime: engine.scaleRegime.current,
            // Round to drop Three.js's float32 drift (e.g. 4000 → 3999.999…).
            position: engine.camera.position.toArray().map((n) => Math.round(n)),
          };
        }),
      { timeout: 15_000, intervals: [500, 1_000] },
    )
    .toEqual({ regime: 'stellar', position: [0, 4000, 15000] });
});

test('star tile meshes are mounted into the scene graph', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect
    .poll(
      async () =>
        await page.evaluate(async () => {
          const engine = (window as unknown as {
            __cosmosEngine?: { starTileField?: { group: { children: { length: number } } } };
          }).__cosmosEngine;
          return engine?.starTileField?.group.children.length ?? 0;
        }),
      { timeout: 20_000, intervals: [500, 1_000] },
    )
    .toBeGreaterThanOrEqual(16);
});
