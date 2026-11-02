import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Usage & Billing against a real Axentra API: a meter created in the UI, usage recorded through
 * the API, chart and data table; a plan created in the UI and a tenant subscribed to it. The
 * server must use the `manual` (or `fake`) billing provider; nothing here touches a real
 * payment provider.
 */
const api = process.env.AXENTRA_E2E_API;
const email = process.env.AXENTRA_E2E_EMAIL;
const password = process.env.AXENTRA_E2E_PASSWORD;

test.skip(
  !api || !email || !password,
  'Set AXENTRA_E2E_API, AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD (an existing platform admin) to run the usage & billing tests.',
);

// Each page is checked with axe in both themes, which takes longer than the default 30 s.
test.describe.configure({ timeout: 120_000 });

async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([]);
}

/** Both themes (via the system preference, the default), and no page-level horizontal scroll. */
async function checkPage(page: Page) {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    await expectNoA11yViolations(page);
  }
  await page.emulateMedia({ colorScheme: 'light' });
  // A string expression: the e2e TypeScript config has no DOM types.
  const overflow = await page.evaluate<number>(
    'document.documentElement.scrollWidth - document.documentElement.clientWidth',
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email ?? '');
  await page.getByLabel(/password/i).fill(password ?? '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** JSON call with the session cookie of the page and its CSRF token. */
async function call(
  request: APIRequestContext,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const session = await request.get('/v1/auth/session');
  const { csrf_token: csrf } = (await session.json()) as { csrf_token: string };
  const response = await request.fetch(path, {
    method,
    headers: { 'X-Axentra-CSRF': csrf, ...headers },
    data: body,
  });
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBe(
    true,
  );
  return response.json() as Promise<Record<string, unknown>>;
}

test('meters, recorded usage, chart and data table', async ({ page }, testInfo) => {
  await login(page);
  const suffix = `${testInfo.project.name}-${Date.now().toString(36)}`;
  const product = await call(page.request, 'POST', '/v1/products', {
    name: `Usage ${suffix}`,
    slug: `usage-${suffix}`,
  });
  const productId = String(product.id);
  const tenant = await call(page.request, 'POST', `/v1/products/${productId}/tenants`, {
    name: 'Acme',
    slug: 'acme',
  });
  const tenantId = String(tenant.id);

  // Create the meter in the UI.
  await page.goto(`/p/${productId}/usage?tab=meters`);
  await expect(page.getByRole('heading', { level: 1, name: 'Usage' })).toBeVisible();
  await page.getByRole('button', { name: 'New meter' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^Key/).fill('api_calls');
  await dialog.getByLabel(/^Name/).fill('API calls');
  await dialog.getByLabel(/^Unit/).fill('calls');
  await dialog.getByLabel(/^Default limit/).fill('100');
  await dialog.getByRole('button', { name: 'Create meter' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('cell', { name: /api_calls/ })).toBeVisible();
  await checkPage(page);

  // Record usage through the API (as the product backend would), idempotently.
  for (const [key, quantity] of [
    ['e2e-1', 5],
    ['e2e-2', 7],
  ] as const) {
    await call(
      page.request,
      'POST',
      `/v1/products/${productId}/tenants/${tenantId}/usage/events`,
      { meter: 'api_calls', quantity },
      { 'Idempotency-Key': `${suffix}-${key}` },
    );
  }

  // Product overview: chart, its data table and totals per tenant.
  await page.goto(`/p/${productId}/usage`);
  const chart = page.getByRole('img', { name: /API calls, all tenants: bar chart/ });
  await expect(chart).toBeVisible();
  await expect(chart).toHaveAttribute('aria-label', /Total 12 calls/);
  await page.getByText('Show data table').click();
  const table = page.getByRole('table', { name: /API calls, all tenants per day/ });
  await expect(table.getByRole('cell', { name: '12', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Acme' })).toBeVisible();
  await checkPage(page);

  // Tenant view: current period against the meter default limit, and the events.
  await page.getByRole('link', { name: 'Acme' }).click();
  await expect(page.getByText(/12 of 100 calls used/)).toBeVisible();
  const events = page.getByRole('region', { name: 'Usage events' });
  await expect(events.getByRole('cell', { name: '7', exact: true })).toBeVisible();
  await expect(events.getByText(`${suffix}-e2e-2`)).toHaveCount(1);
  await checkPage(page);
});

test('plans, subscribing a tenant and entitlements', async ({ page }, testInfo) => {
  await login(page);
  const settings = await call(page.request, 'GET', '/v1/settings');
  const provider = (settings.billing as { provider: string }).provider;
  test.skip(provider === 'stripe', 'Runs only with the manual or fake billing provider.');

  const suffix = `${testInfo.project.name}-${Date.now().toString(36)}`;
  const product = await call(page.request, 'POST', '/v1/products', {
    name: `Billing ${suffix}`,
    slug: `billing-${suffix}`,
  });
  const productId = String(product.id);
  const tenant = await call(page.request, 'POST', `/v1/products/${productId}/tenants`, {
    name: 'Globex',
    slug: 'globex',
  });
  const tenantId = String(tenant.id);

  await page.goto(`/p/${productId}/plans`);
  await expect(page.getByRole('heading', { level: 1, name: 'Plans' })).toBeVisible();
  await expect(page.getByText(/never asks for card or bank details/)).toBeVisible();
  await page.getByRole('button', { name: 'New plan' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^Name/).fill('Team');
  await dialog.getByLabel(/^Key/).fill('team');
  await dialog.getByLabel(/^Trial days/).fill('14');
  if (provider === 'manual') {
    await dialog.getByRole('button', { name: 'Add price' }).click();
    await dialog.getByLabel(/^Amount/).fill('19.90');
    await dialog.getByLabel(/^Currency/).fill('EUR');
    await expect(dialog.getByText(/Stored as 1990 minor units/)).toBeVisible();
  }
  await dialog.getByRole('button', { name: 'Add entitlement' }).click();
  await dialog.getByLabel(/^Feature name/).fill('sso');
  await dialog.getByRole('button', { name: 'Create plan' }).click();
  await expect(dialog).toBeHidden();
  if (provider === 'manual') await expect(page.getByText('€19.90 / month')).toBeVisible();
  await checkPage(page);

  // Subscribe the tenant.
  await page.goto(`/p/${productId}/subscriptions/${tenantId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Globex' })).toBeVisible();
  await expect(page.getByText('No subscription')).toBeVisible();
  await page.getByRole('button', { name: 'Subscribe to a plan' }).click();
  const subscribe = page.getByRole('dialog');
  await subscribe.getByLabel(/^Plan/).selectOption('team');
  await subscribe.getByRole('button', { name: 'Subscribe' }).click();
  await expect(subscribe).toBeHidden();
  await expect(page.getByText(/Trial ends in 14 days/)).toBeVisible();
  await expect(page.getByText('sso: on')).toBeVisible();
  await checkPage(page);

  // Cancel at the end of the period, then resume.
  await page.getByRole('button', { name: 'Cancel at period end' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel at period end' }).click();
  await expect(page.getByText(/Ends at the end of the period/)).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByText(/Ends at the end of the period/)).toBeHidden();

  // The product list shows the subscription; the dashboard summarizes it.
  await page.goto(`/p/${productId}/subscriptions`);
  await expect(page.getByRole('link', { name: 'Globex' })).toBeVisible();
  await checkPage(page);
  await page.goto(`/p/${productId}/dashboard`);
  await expect(page.getByRole('heading', { name: 'Billing', exact: true })).toBeVisible();
  await expect(page.getByText('1 active plan of 1')).toBeVisible();
  await checkPage(page);
});
