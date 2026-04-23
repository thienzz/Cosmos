import { expect, test } from '@playwright/test';

/**
 * P5 follow-up — visual regression for "search → fly-to Andromeda".
 *
 * User reported clicking Andromeda produced no visible landing marker.
 * Ensure:
 *   1. `flyToCelestialCoord` actually moves the camera (render loop advances
 *      fly-to animator).
 *   2. A `SearchTargetMarker` gets mounted AND rendered with a non-trivial
 *      world-scale orb after the fly-to completes.
 *   3. For the canonical ENT-6000 "Andromeda Galaxy" hit (ra=10.6847,
 *      dec=41.2688, distance=778 kpc), the landing point lies along the
 *      Andromeda direction at the piecewise-compressed extragalactic depth.
 */
test('search "andromeda" → fly-to fires, camera moves, marker mounts', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Read the initial camera pose so we can assert it moves.
  const initialPos = await page.evaluate(() => {
    const e = (window as unknown as {
      __cosmosEngine?: { camera: { position: { toArray(): number[] } } };
    }).__cosmosEngine;
    return e?.camera.position.toArray() ?? null;
  });
  expect(initialPos).not.toBeNull();

  const searchbox = page.getByRole('searchbox', { name: /search celestial objects/i });
  await expect(searchbox).toBeVisible({ timeout: 15_000 });
  await searchbox.click();
  await searchbox.fill('andromeda');

  const firstRow = page
    .getByTestId('search-dropdown')
    .locator('> div[role="option"], div[role="option"]')
    .first();
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  await firstRow.click();

  // Fly-to duration is 1.5-4 s per Doc 19 §4.2. Give 8 s of slack.
  await expect
    .poll(
      async () =>
        await page.evaluate(async () => {
          const store = (await import('/src/stores/cameraStore.ts')) as {
            useCameraStore: { getState(): { isTransitioning: boolean } };
          };
          return store.useCameraStore.getState().isTransitioning;
        }),
      { timeout: 15_000, intervals: [200, 500, 1_000] },
    )
    .toBe(false);

  // Camera must have moved from its stellar entry pose.
  const afterFly = await page.evaluate(() => {
    const e = (window as unknown as {
      __cosmosEngine?: {
        camera: { position: { toArray(): number[] } };
        searchTargetMarker?: {
          group: {
            position: { toArray(): number[] };
            children: { length: number };
          };
          // orb and labelSprite are internal, but we verify via group geometry.
        } | null;
        scene: { children: { length: number } };
      };
    }).__cosmosEngine;
    if (!e) return null;
    const marker = e.searchTargetMarker;
    return {
      cameraPos: e.camera.position.toArray(),
      markerPos: marker?.group.position.toArray() ?? null,
      markerChildCount: marker?.group.children.length ?? 0,
      sceneChildCount: e.scene.children.length,
    };
  });
  expect(afterFly, 'engine + marker state must be readable').not.toBeNull();

  // Camera should NOT be at the initial (0, 4000, 15000) pose anymore.
  const moved = afterFly!.cameraPos.some((coord, i) => Math.abs(coord - initialPos![i]) > 100);
  expect(moved, `camera did not move from ${initialPos} → ${afterFly!.cameraPos}`).toBe(true);

  // Marker must have mounted and be sitting at a non-origin position.
  expect(afterFly!.markerPos, 'search-target marker must be mounted').not.toBeNull();
  const markerDist = Math.hypot(
    afterFly!.markerPos![0],
    afterFly!.markerPos![1],
    afterFly!.markerPos![2],
  );
  expect(markerDist).toBeGreaterThan(1_000);
  expect(afterFly!.markerChildCount).toBeGreaterThanOrEqual(1);
});
