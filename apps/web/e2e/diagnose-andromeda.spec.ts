import { expect, test } from '@playwright/test';

/**
 * Diagnostic — capture screenshots before/after clicking Andromeda so we
 * can see exactly what lands on screen. Not a gate; this test always
 * passes but leaves artefacts under `test-results/` for inspection.
 */
test('diagnose: render frames before + after andromeda click', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Give the star-tile stream + sky plate a beat to settle.
  await page.waitForTimeout(2_500);

  await page.screenshot({ path: 'test-results/andromeda-01-stellar-entry.png', fullPage: false });

  const searchbox = page.getByRole('searchbox', { name: /search celestial objects/i });
  await searchbox.click();
  await searchbox.fill('andromeda');

  const firstRow = page
    .getByTestId('search-dropdown')
    .locator('> div[role="option"], div[role="option"]')
    .first();
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  const firstRowText = (await firstRow.textContent()) ?? '';
  await page.screenshot({ path: 'test-results/andromeda-02-dropdown.png', fullPage: false });

  await firstRow.click();
  // Wait until the fly-to settles.
  await expect
    .poll(
      async () =>
        await page.evaluate(async () => {
          const store = (await import('/src/stores/cameraStore.ts')) as {
            useCameraStore: { getState(): { isTransitioning: boolean } };
          };
          return store.useCameraStore.getState().isTransitioning;
        }),
      { timeout: 15_000, intervals: [200, 500] },
    )
    .toBe(false);
  // Let a couple of frames render at the destination.
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/andromeda-03-destination.png', fullPage: false });

  const finalState = await page.evaluate(() => {
    const e = (window as unknown as {
      __cosmosEngine?: {
        camera: { position: { toArray(): number[] } };
        controls: { target: { toArray(): number[] } };
        searchTargetMarker?: {
          group: {
            position: { toArray(): number[] };
            children: { length: number };
          };
          entityVisual?: { kind: string } | null;
        } | null;
      };
    }).__cosmosEngine;
    const m = e?.searchTargetMarker;
    return {
      cameraPos: e?.camera.position.toArray(),
      controlsTarget: e?.controls.target.toArray(),
      markerPos: m?.group.position.toArray() ?? null,
      markerChildren: m?.group.children.length ?? 0,
      entityVisualKind: m?.entityVisual?.kind ?? null,
    };
  });

  console.log('andromeda diagnosis', { firstRowText, finalState });
});
