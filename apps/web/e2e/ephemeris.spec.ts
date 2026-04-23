import { expect, test } from '@playwright/test';

/**
 * P0 regression — the Python ephemeris service must respond 200 with real
 * SPICE data for solar-system bodies covered by `de440s.bsp`.
 *
 * This test hits the endpoint through the same Vite proxy path the FE
 * uses in production (`/v1/ephemeris/...` → `localhost:3002`), proving
 * both the proxy wiring AND the underlying kernel mount.
 */
test('ephemeris /v1/ephemeris/range/399 (Earth) returns real positions', async ({ request }) => {
  const r = await request.get(
    '/v1/ephemeris/range/399?start=2451515&end=2451575&step=1&frame=ECLIPJ2000',
  );
  expect(r.status(), 'ephemeris call must succeed — SPICE kernels loaded?').toBe(200);
  const body = await r.json();
  const positions = body?.data?.positions;
  expect(Array.isArray(positions)).toBe(true);
  expect(positions.length).toBeGreaterThan(50);

  // Earth at JD 2451515 (2000-01-09) should be near ~1 AU from the Sun.
  const [x, y, z] = positions[0] as [number, number, number];
  const r_au = Math.sqrt(x * x + y * y + z * z);
  expect(r_au).toBeGreaterThan(0.95);
  expect(r_au).toBeLessThan(1.05);
});

test('ephemeris batch endpoint computes multiple epochs', async ({ request }) => {
  // Only Earth (399) — Mars (499) and outer bodies need their own kernels
  // (mar097.bsp, jup365.bsp, …) which the dev stack doesn't ship. de440s
  // covers planet barycenters and Earth specifically.
  const r = await request.post('/v1/ephemeris/batch', {
    data: { naif_ids: [399], epochs: [2460000.5, 2460001.5] },
  });
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body?.data?.count).toBe(2);
  expect(body?.data?.results).toHaveLength(2);
});
