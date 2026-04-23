import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the Cosmos Explorer FE.
 *
 * Tests assume the full backend stack is already running (docker compose
 * up in infra/docker). The Vite dev server is started as a managed
 * webServer below — CI and local runs reuse the same flow.
 *
 * Set `E2E_BASE_URL` to point at a running dev server (skipping the
 * webServer bootstrap).
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false, // one browser = one live backend, keep it serial
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only spawn a server if E2E_BASE_URL isn't set — otherwise the user is
  // pointing at an already-running dev instance (preferred during iter).
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'pnpm dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          timeout: 60_000,
          env: {
            VITE_DEV_API_TARGET: 'http://localhost:3010',
            COSMOS_DEV_SEARCH_ES_URL: '',
          },
        },
      }),
});
