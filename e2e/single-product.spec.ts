/**
 * Deployment models (Axentra docs/architecture/DEPLOYMENT_MODELS.md) against a real backend.
 *
 * Single-product mode (`scripts/e2e-backend.sh run --mode single`): the backend creates its one
 * product from `[product]` and refuses creating, archiving and restoring products with
 * `409 mode_not_supported`. Studio opens in that product, shows no product switcher and no
 * product creation or archiving, explains why, and every area of the navigation is reachable.
 *
 * Multi-product mode (the default): the counterpart checks that the switcher and product creation
 * are offered to the platform admin. Each describe block runs only against its mode and says so.
 */
import { expect, test, type Page } from '@playwright/test';
import {
  e2e,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  serverMode,
  signIn,
  SKIP_NO_ADMIN,
  SKIP_NO_API,
  trackConsoleErrors,
} from './support';

test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);

async function csrf(page: Page): Promise<string> {
  const session = await page.request.get('/v1/auth/session');
  return ((await session.json()) as { csrf_token: string }).csrf_token;
}

/** Both themes (the Studio follows the system preference) and no page-level horizontal scroll. */
async function checkPage(page: Page) {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    await expectNoA11yViolations(page);
  }
  await page.emulateMedia({ colorScheme: 'light' });
  await expectNoHorizontalScroll(page);
}

/** Hrefs of the main navigation (on narrow screens it lives in the drawer). */
async function navigationHrefs(page: Page): Promise<string[]> {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const menu = page.getByRole('button', { name: 'Open navigation' });
  const drawer = await menu.isVisible();
  if (drawer) await menu.click();
  const links = page.locator('nav[aria-label="Main navigation"] a[href]');
  await expect(links.first()).toBeAttached();
  const hrefs = await links.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('href') ?? ''),
  );
  if (drawer) await page.keyboard.press('Escape');
  return [...new Set(hrefs.filter((href) => href.startsWith('/') && href !== '/'))];
}

test.describe('single-product mode', () => {
  test.beforeEach(async ({ request }) => {
    const server = await serverMode(request);
    test.skip(
      server.mode !== 'single',
      'The backend runs in multi-product mode; start it with `scripts/e2e-backend.sh run --mode single` for these checks.',
    );
  });

  test('the API reports the one product and refuses product creation and archiving', async ({
    page,
  }) => {
    await signIn(page);
    const server = await serverMode(page.request);
    expect(server.product?.id).toBe(e2e.productId);
    const headers = { 'X-Axentra-CSRF': await csrf(page) };

    const create = await page.request.post('/v1/products', {
      headers,
      data: { name: 'Second product', slug: `second-${Date.now().toString(36)}` },
    });
    expect(create.status()).toBe(409);
    expect(((await create.json()) as { code: string }).code).toBe('mode_not_supported');

    const archive = await page.request.post(`/v1/products/${e2e.productId}/archive`, { headers });
    expect(archive.status()).toBe(409);
    expect(((await archive.json()) as { code: string }).code).toBe('mode_not_supported');

    // Still exactly one product, still active.
    const products = (await (await page.request.get('/v1/products')).json()) as {
      id: string;
      status: string;
    }[];
    expect(products.map((product) => [product.id, product.status])).toEqual([
      [e2e.productId, 'active'],
    ]);
  });

  test('Studio opens in the product and shows no product switcher', async ({ page }, testInfo) => {
    await signIn(page);
    // After sign-in: signed out, the browser logs the expected 401 of the session probe.
    const consoleErrors = trackConsoleErrors(page);
    await page.goto('/');
    await expect(page).toHaveURL(new RegExp(`/p/${e2e.productId}/dashboard$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Switch product/ })).toHaveCount(0);
    await expect(page.getByText('All products')).toHaveCount(0);
    if (testInfo.project.name !== 'mobile') {
      // The static product label is hidden below 600 px, like the switcher's text.
      await expect(page.getByTestId('single-product-label')).toContainText('Studio e2e');
    }
    await expect(page.getByText('Single product', { exact: true })).toBeVisible();
    await checkPage(page);
    consoleErrors.assertNone();
  });

  test('the product list is read-only and explains the mode', async ({ page }) => {
    await signIn(page);
    await page.goto('/products');
    await expect(page.getByRole('heading', { level: 1, name: 'Products' })).toBeVisible();
    await expect(page.getByText('Single-product mode', { exact: true })).toBeVisible();
    await expect(page.getByText(/Products cannot be created, archived or restored/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'New product' })).toHaveCount(0);
    const table = page.getByRole('table', { name: 'Products' });
    await expect(table.getByRole('link', { name: 'Studio e2e', exact: true })).toBeVisible();
    await checkPage(page);

    await table.getByRole('link', { name: 'Studio e2e', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Studio e2e' })).toBeVisible();
    await expect(page.getByText(/so this product cannot be archived/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Archive' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Restore' })).toHaveCount(0);
    await checkPage(page);
  });

  test('an unknown product id leads to the same section of the one product', async ({ page }) => {
    await signIn(page);
    await page.goto('/p/prd_e2e_unknown/tenants');
    await expect(page).toHaveURL(new RegExp(`/p/${e2e.productId}/tenants$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Tenants' })).toBeVisible();
  });

  test('every area of the navigation is reachable', async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page);
    const consoleErrors = trackConsoleErrors(page);
    await page.goto(`/p/${e2e.productId}/dashboard`);
    const hrefs = await navigationHrefs(page);
    expect(hrefs.length).toBeGreaterThan(10);
    for (const href of hrefs) {
      if (href.startsWith('/p/')) expect(href).toContain(`/p/${e2e.productId}/`);
      await page.goto(href);
      await expect(page, href).not.toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { level: 1 }), href).toBeVisible();
      // Every module is enabled in the e2e backend: no "not enabled" or error page.
      await expect(
        page.getByText(/not enabled on this server|Not yet available in Studio/i),
        href,
      ).toHaveCount(0);
      await expect(page.getByRole('alert').filter({ hasText: /Request ID/ }), href).toHaveCount(0);
    }
    consoleErrors.assertNone();
  });
});

test.describe('multi-product mode', () => {
  test.beforeEach(async ({ request }) => {
    const server = await serverMode(request);
    test.skip(
      server.mode !== 'multi',
      'The backend runs in single-product mode; these checks need `scripts/e2e-backend.sh run --mode multi`.',
    );
  });

  test('the product switcher and product creation are offered to the platform admin', async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`/p/${e2e.productId}/dashboard`);
    await expect(page.getByRole('button', { name: /Switch product/ })).toBeVisible();
    await expect(page.getByText('Multi product', { exact: true })).toBeVisible();
    await page.goto('/products');
    await expect(page.getByRole('button', { name: 'New product' })).toBeVisible();
    await expect(page.getByText('Single-product mode', { exact: true })).toHaveCount(0);
  });
});
