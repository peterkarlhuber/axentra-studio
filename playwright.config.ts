import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke tests against a real Axentra API.
 *
 * Set `AXENTRA_E2E_API` to the API origin (e.g. http://127.0.0.1:8080). Playwright then
 * builds the Studio and serves it with `vite preview`, which proxies `/v1` to that API.
 * Without the variable the tests are skipped with an explanatory message (in CI it is an error).
 * `scripts/e2e-backend.sh run` starts a complete backend and sets all AXENTRA_E2E_* variables.
 */
const api = process.env.AXENTRA_E2E_API;
if (!api && process.env.CI) {
  // In CI the e2e job starts a backend (scripts/e2e-backend.sh); skipping there would hide a failure.
  throw new Error(
    '[e2e] AXENTRA_E2E_API is not set in CI. Run Playwright via scripts/e2e-backend.sh run.',
  );
}
if (!api) {
  console.warn(
    '[e2e] AXENTRA_E2E_API is not set; the smoke tests will be skipped. Example: AXENTRA_E2E_API=http://127.0.0.1:8080 npm run e2e',
  );
}
const port = Number(process.env.AXENTRA_E2E_PORT ?? 4173);
const baseURL = process.env.AXENTRA_E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
// Optional override for environments with a preinstalled browser outside Playwright's cache.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 740 },
        launchOptions: { executablePath },
      },
    },
  ],
  webServer:
    api && !process.env.AXENTRA_E2E_BASE_URL
      ? {
          command: `npm run build && npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          env: { AXENTRA_API_URL: api },
        }
      : undefined,
});
