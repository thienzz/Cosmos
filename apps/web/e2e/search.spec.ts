import { expect, test } from '@playwright/test';

/**
 * P1 regression — the autocomplete response must include the fields the
 * SearchPanel needs to route to a fly-to path:
 *
 *   - `id` (numeric NAIF) for solar bodies → Path A (SolarSystemRenderer)
 *   - `ra` + `dec` for sky objects → Path B (flyToCelestialCoord)
 *
 * Before the fix, the response only carried `{text, ent_id, category,
 * kind, magnitude}` and every click landed in Path C (stub, no fly).
 */
test('autocomplete exposes NAIF id for solar bodies', async ({ request }) => {
  const r = await request.get('/v1/search/autocomplete?q=earth');
  expect(r.status()).toBe(200);
  const body = await r.json();
  const suggestions = body?.data?.suggestions as Array<Record<string, unknown>>;
  expect(Array.isArray(suggestions)).toBe(true);
  const earth = suggestions.find((s) => s.text === 'Earth');
  expect(earth, 'Earth missing from autocomplete results').toBeTruthy();
  expect(earth?.id, 'autocomplete must return numeric NAIF id for solar bodies').toBe(399);
});

test('autocomplete exposes ra/dec for catalogued stars', async ({ request }) => {
  const r = await request.get('/v1/search/autocomplete?q=sirius&limit=5');
  expect(r.status()).toBe(200);
  const body = await r.json();
  const suggestions = body?.data?.suggestions as Array<Record<string, unknown>>;
  // At least one Sirius doc in the index should carry coordinates. The
  // canonical ENT-1000 aggregate has nulls (by design, the ETL stores
  // coords on catalog-specific docs), so we look across the set.
  const withCoords = suggestions.find(
    (s) => typeof s.ra === 'number' && typeof s.dec === 'number',
  );
  expect(withCoords, 'at least one Sirius result must carry ra/dec').toBeTruthy();
});

test('search panel: Earth click → fly-to the NAIF-399 body', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const searchbox = page.getByRole('searchbox', { name: /search celestial objects/i });
  await expect(searchbox).toBeVisible({ timeout: 15_000 });
  await searchbox.click();
  await searchbox.fill('earth');

  // Target the FIRST row inside the dropdown listbox — SearchPanel renders
  // autocomplete suggestions before full-text results, so index 0 is the
  // suggestion carrying the NAIF id parsed from `ent_id: "NAIF-399"`.
  // Using a role-based name regex here races with the text-search Earth
  // result whose accessible name also starts with "Earth".
  // Scope to the listbox div — `getByRole('option')` alone also matches the
  // FilterChips' <select><option>All</option> which is hidden but blocks
  // `.first()`.
  // The search-dropdown div IS role=listbox; its children carry role=option.
  // Scoping with the test-id strips the FilterChips <select><option>All</option>
  // (hidden, but would otherwise win `.first()`).
  const firstRow = page
    .getByTestId('search-dropdown')
    .locator('> div[role="option"], div[role="option"]')
    .first();
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  await firstRow.click();

  await expect
    .poll(
      async () =>
        await page.evaluate(async () => {
          const sel = (await import('/src/stores/selectionStore.ts')) as {
            useSelectionStore: { getState(): { selectedEntityId: number | null } };
          };
          return sel.useSelectionStore.getState().selectedEntityId;
        }),
      { timeout: 10_000, intervals: [200, 500] },
    )
    .toBe(399);
});

test('search panel: Andromeda click routes to the galaxy shader (not the constellation stub)', async ({
  page,
}) => {
  // The topmost autocomplete hit for "Andromeda" is the constellation
  // centroid (ENT-7050, null ra/dec, no procedural shader). The richness
  // promotion in `activateRow` scans siblings and finds GAL-m31 — the
  // Andromeda Galaxy entry — which carries ra/dec/distance AND matches
  // `SearchTargetMarker`'s GAL- prefix so the galaxy shader renders at
  // the marker position. Before this fix the click produced a featureless
  // cyan orb 60 k units along the constellation centroid, which read as
  // "no visualization" to end users.
  await page.goto('/');
  await page.waitForLoadState('networkidle');

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

  // Wait for fly-to to settle, then verify the marker mounted the galaxy
  // procedural visual (== the promotion picked GAL-m31).
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

  const visualKind = await page.evaluate(() => {
    const e = (window as unknown as {
      __cosmosEngine?: { searchTargetMarker?: { entityVisual?: { kind: string } | null } | null };
    }).__cosmosEngine;
    return e?.searchTargetMarker?.entityVisual?.kind ?? null;
  });
  expect(visualKind, 'marker should mount the galaxy shader').toBe('galaxy');
});
