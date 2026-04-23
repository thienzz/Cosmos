import { expect, test } from '@playwright/test';

/**
 * P3 regression — BE now owns `/v1/ws` (previously a 404).
 *
 * The FE `CosmosWebSocket` class expects a `connected` hello frame once
 * the upgrade lands. Without this the client would reconnect-loop
 * forever.
 */
test('WebSocket /v1/ws accepts upgrades and sends connected hello', async ({ page }) => {
  await page.goto('/');

  const first = await page.evaluate(
    () =>
      new Promise<{ ok: boolean; msg?: string; err?: string }>((resolve) => {
        const ws = new WebSocket('ws://localhost:3010/v1/ws');
        const to = setTimeout(() => {
          ws.close();
          resolve({ ok: false, err: 'timeout' });
        }, 5_000);
        ws.onmessage = (e) => {
          clearTimeout(to);
          const msg = typeof e.data === 'string' ? e.data : '';
          ws.close();
          resolve({ ok: true, msg });
        };
        ws.onerror = () => {
          clearTimeout(to);
          resolve({ ok: false, err: 'error' });
        };
      }),
  );

  expect(first.ok, `WS handshake failed: ${first.err}`).toBe(true);
  const parsed = JSON.parse(first.msg ?? '{}');
  expect(parsed.type).toBe('connected');
  expect(typeof parsed.session_id).toBe('string');
  expect(['anonymous', 'registered', 'research', 'internal']).toContain(parsed.tier);
});

test('WebSocket ping → pong round-trips within 2 s', async ({ page }) => {
  await page.goto('/');

  const roundTrip = await page.evaluate(
    () =>
      new Promise<{ ok: boolean; pong?: unknown; err?: string }>((resolve) => {
        const ws = new WebSocket('ws://localhost:3010/v1/ws');
        const to = setTimeout(() => {
          ws.close();
          resolve({ ok: false, err: 'timeout' });
        }, 2_000);
        let seenHello = false;
        ws.onmessage = (e) => {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : null;
          if (!seenHello) {
            seenHello = true;
            ws.send(JSON.stringify({ type: 'ping' }));
            return;
          }
          if (data?.type === 'pong') {
            clearTimeout(to);
            ws.close();
            resolve({ ok: true, pong: data });
          }
        };
        ws.onerror = () => {
          clearTimeout(to);
          resolve({ ok: false, err: 'error' });
        };
      }),
  );

  expect(roundTrip.ok).toBe(true);
});
