/** Shared helpers for the e2e specs (real backend, see scripts/e2e-backend.sh). */
import AxeBuilder from '@axe-core/playwright';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const e2e = {
  api: process.env.AXENTRA_E2E_API,
  email: process.env.AXENTRA_E2E_EMAIL,
  password: process.env.AXENTRA_E2E_PASSWORD,
  productId: process.env.AXENTRA_E2E_PRODUCT_ID,
  tenantId: process.env.AXENTRA_E2E_TENANT_ID,
  /** Fixtures for the a11y route sweep, created by scripts/e2e-backend.sh in that product. */
  jobId: process.env.AXENTRA_E2E_JOB_ID,
  webhookId: process.env.AXENTRA_E2E_WEBHOOK_ID,
  templateKey: process.env.AXENTRA_E2E_TEMPLATE_KEY,
};

export const SKIP_NO_API =
  'AXENTRA_E2E_API is not set: run `scripts/e2e-backend.sh run` (or start an Axentra API and set AXENTRA_E2E_API) to run the e2e tests.';
export const SKIP_NO_ADMIN =
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing admin account (scripts/e2e-backend.sh does) to run the signed-in checks.';

/**
 * Frames that can never run a script: notification previews (src/features/notify/RenderedView.tsx)
 * are `sandbox=""` on purpose, so axe cannot be injected into them and a frame-aware run waits
 * until the test times out. Their content is the template author's email HTML, not Studio UI.
 */
const SCRIPTLESS_FRAMES = 'iframe[sandbox]:not([sandbox~="allow-scripts"])';

/** WCAG 2.1 A/AA via axe-core; the message names rule, help and offending selectors. */
export async function expectNoA11yViolations(page: Page) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  if ((await page.locator(SCRIPTLESS_FRAMES).count()) > 0) {
    // Top document only (the frame element itself, e.g. its title, is still checked).
    builder = builder.setLegacyMode().options({ iframes: false });
  }
  const results = await builder.analyze();
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.help} [${violation.nodes
          .slice(0, 5)
          .map((node) => node.target.join(' '))
          .join(' | ')}]`,
    ),
  ).toEqual([]);
}

/** The page must not scroll horizontally (tables scroll inside their own container). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  expect(
    overflow.scrollWidth,
    `page scrolls horizontally (scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth})`,
  ).toBeLessThanOrEqual(overflow.clientWidth);
}

/**
 * Collects console errors and uncaught exceptions; call `.assertNone()` at the end of a test.
 * `allow` lists expected messages, e.g. the browser's own log line for the `401` that
 * `GET /v1/auth/session` answers while nobody is signed in.
 */
export function trackConsoleErrors(page: Page, allow: RegExp[] = []) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (allow.some((pattern) => pattern.test(text))) return;
    errors.push(`console: ${text.slice(0, 300)}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message.slice(0, 300)}`));
  return {
    errors,
    assertNone: () => expect(errors, 'console errors').toEqual([]),
  };
}

/** Signs in through the UI. */
export async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(e2e.email ?? '');
  await page.getByLabel(/password/i).fill(e2e.password ?? '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Signs in through the API (cookie only; Studio fetches the CSRF token at startup). */
export async function signInApi(request: APIRequestContext) {
  const response = await request.post('/v1/auth/login/password', {
    data: { email: e2e.email, password: e2e.password },
  });
  expect(response.ok(), `login failed: ${response.status()} ${await response.text()}`).toBe(true);
}

/** The browser logs every 401 response; signed out, that is the expected session probe. */
export const SIGNED_OUT_CONSOLE_ALLOW = [
  /^Failed to load resource: the server responded with a status of 401/,
];
