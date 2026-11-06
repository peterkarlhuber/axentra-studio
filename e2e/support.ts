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
  /** A second endpoint with one (failed) test delivery, for the delivery drawer. */
  deliveryWebhookId: process.env.AXENTRA_E2E_DELIVERY_WEBHOOK_ID,
  templateKey: process.env.AXENTRA_E2E_TEMPLATE_KEY,
  /** Plain users without any role (scripts/e2e-backend.sh); specs give them product or tenant roles. */
  operatorEmail: process.env.AXENTRA_E2E_OPERATOR_EMAIL,
  memberEmail: process.env.AXENTRA_E2E_MEMBER_EMAIL,
  userPassword: process.env.AXENTRA_E2E_USER_PASSWORD,
};

export const SKIP_NO_API =
  'AXENTRA_E2E_API is not set: run `scripts/e2e-backend.sh run` (or start an Axentra API and set AXENTRA_E2E_API) to run the e2e tests.';
export const SKIP_NO_ADMIN =
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing admin account (scripts/e2e-backend.sh does) to run the signed-in checks.';

/**
 * Studio's only frames are notification previews (src/features/notify/RenderedView.tsx). They are
 * `sandbox=""` on purpose, so axe cannot be injected into them: a frame-aware run then waits until
 * the test times out, and Chromium logs "Blocked script execution in 'about:srcdoc'". The preview
 * frame can appear after a debounced request, so checking for it first is racy. axe therefore
 * always runs on the top document only (the frame element itself, e.g. its title, is still
 * checked); the frame content is the template author's email HTML, not Studio UI.
 */
/**
 * Waits until finite CSS animations (toasts sliding in or fading out, dialogs opening) are done.
 * axe measures colour contrast on the rendered pixels' styles, so a toast at half opacity during
 * its fade-out is reported as a contrast violation although the settled UI passes. Infinite
 * animations (spinners, skeleton shimmer) are ignored. A string expression: the e2e TypeScript
 * config has no DOM types.
 */
export async function settleAnimations(page: Page) {
  await page.waitForFunction(
    `document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity)`,
    undefined,
    { timeout: 5_000 },
  );
}

/** WCAG 2.1 A/AA via axe-core; the message names rule, help and offending selectors. */
export async function expectNoA11yViolations(page: Page) {
  await settleAnimations(page);
  // `options()` replaces all run options, so it must come before `withTags()`.
  const results = await new AxeBuilder({ page })
    .setLegacyMode()
    .options({ iframes: false })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
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
/**
 * axe-core (also in legacy mode) evaluates its source in every frame of the page. For the
 * deliberately script-less notification preview (`sandbox=""`, `srcdoc`) Chromium refuses that and
 * logs this line. It is caused by the test tooling, not by Studio, and proves the sandbox works.
 */
const AXE_INJECTION_INTO_SANDBOXED_PREVIEW =
  /^Blocked script execution in 'about:srcdoc' because the document's frame is sandboxed and the 'allow-scripts' permission is not set\.$/;

export function trackConsoleErrors(page: Page, allow: RegExp[] = []) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (AXE_INJECTION_INTO_SANDBOXED_PREVIEW.test(text)) return;
    if (allow.some((pattern) => pattern.test(text))) return;
    errors.push(`console: ${text.slice(0, 300)}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message.slice(0, 300)}`));
  return {
    errors,
    assertNone: () => expect(errors, 'console errors').toEqual([]),
  };
}

/** Signs in through the UI, as the platform admin unless other credentials are given. */
export async function signIn(
  page: Page,
  credentials: { email?: string; password?: string } = { email: e2e.email, password: e2e.password },
) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(credentials.email ?? '');
  await page.getByLabel(/password/i).fill(credentials.password ?? '');
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

/**
 * Deployment model of the e2e backend (`scripts/e2e-backend.sh --mode`). The specs read the
 * actual mode from `GET /v1/meta`; this variable only says which one the run was started with.
 */
export const e2eMode = process.env.AXENTRA_E2E_MODE === 'single' ? 'single' : 'multi';

export interface ServerMode {
  mode: 'single' | 'multi';
  /** Single-product mode: the one product (`meta.product`); null in multi-product mode. */
  product: { id: string; name: string; slug: string } | null;
}

export async function serverMode(request: APIRequestContext): Promise<ServerMode> {
  const response = await request.get('/v1/meta');
  expect(response.ok(), `GET /v1/meta: ${response.status()}`).toBe(true);
  const meta = (await response.json()) as ServerMode;
  return { mode: meta.mode, product: meta.product ?? null };
}

/**
 * The product a spec works in, with the signed-in session of `request`.
 *
 * - Multi-product mode: a new product (`POST /v1/products`), so the spec starts from an empty one.
 * - Single-product mode: Axentra refuses `POST /v1/products` (409 `mode_not_supported`); the spec
 *   works in the server's one product. Everything a spec creates there is shared with the other
 *   specs and with the other Playwright project, so names and keys must be unique per run, and
 *   product-wide counts must not assume an empty product (`shared` is then true).
 */
export async function specProduct(
  request: APIRequestContext,
  data: { name: string; slug: string; description?: string },
): Promise<{ id: string; shared: boolean }> {
  const server = await serverMode(request);
  if (server.mode === 'single') {
    expect(server.product, 'single-product mode without meta.product').not.toBeNull();
    return { id: server.product?.id ?? '', shared: true };
  }
  const session = await request.get('/v1/auth/session');
  const { csrf_token: csrf } = (await session.json()) as { csrf_token: string };
  const response = await request.post('/v1/products', {
    headers: { 'X-Axentra-CSRF': csrf },
    data: { description: '', ...data },
  });
  expect(response.status(), `POST /v1/products: ${await response.text()}`).toBe(201);
  const { id } = (await response.json()) as { id: string };
  return { id, shared: false };
}
