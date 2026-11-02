import AxeBuilder from '@axe-core/playwright';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Events & Jobs against a real Axentra API (module `events`).
 *
 * Needs AXENTRA_E2E_API plus an admin (AXENTRA_E2E_EMAIL / AXENTRA_E2E_PASSWORD). The API must
 * allow plain-http, private webhook targets (development only):
 *   AXENTRA__EVENTS__WEBHOOK_ALLOW_HTTP=true AXENTRA__EVENTS__WEBHOOK_ALLOW_PRIVATE_TARGETS=true
 * Tests that need jobs to run also need a worker with the e2e handlers, signalled by
 * AXENTRA_E2E_WORKER=1:
 *   PYTHONPATH=e2e/fixtures axentra worker --load axentra_e2e_jobs
 * Webhook receivers are started by this spec on 127.0.0.1 (AXENTRA_E2E_RECEIVER_HOST overrides
 * the host the API should call).
 */
const api = process.env.AXENTRA_E2E_API;
const email = process.env.AXENTRA_E2E_EMAIL;
const password = process.env.AXENTRA_E2E_PASSWORD;
const worker = process.env.AXENTRA_E2E_WORKER === '1';
const receiverHost = process.env.AXENTRA_E2E_RECEIVER_HOST ?? '127.0.0.1';

test.skip(!api, 'AXENTRA_E2E_API is not set: start an Axentra API to run the Events & Jobs tests.');
test.skip(
  !email || !password,
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing platform admin.',
);

const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Shell, not this area: the product switcher's aria-label ("Switch product") does not
    // contain its visible text (the product name), which axe reports as
    // label-content-name-mismatch once a user can see more than one product.
    .exclude('[aria-label="Switch product"]')
    .analyze();
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([]);
}

/** axe in light and dark, and no page-level horizontal scrolling (360 px project). */
async function checkPage(page: Page) {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    await expectNoA11yViolations(page);
  }
  await page.emulateMedia({ colorScheme: 'light' });
  const overflow = await page
    .locator('html')
    .evaluate((html) => html.scrollWidth - html.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email ?? '');
  await page.getByLabel(/password/i).fill(password ?? '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Authenticated JSON calls with the page's session cookie and CSRF token. */
async function apiClient(page: Page, baseURL: string) {
  const request: APIRequestContext = page.request;
  const session = (await (await request.get('/v1/auth/session')).json()) as { csrf_token: string };
  const headers = { 'X-Axentra-CSRF': session.csrf_token, Origin: baseURL };
  const call = async <T>(method: 'POST' | 'PATCH', path: string, data: unknown): Promise<T> => {
    const response = await request.fetch(path, { method, headers, data });
    expect(response.ok(), `${method} ${path}: ${await response.text()}`).toBe(true);
    return (await response.json()) as T;
  };
  return { post: <T>(path: string, data: unknown) => call<T>('POST', path, data) };
}

interface Receiver {
  url: string;
  hits: { headers: IncomingMessage['headers']; body: string }[];
  close: () => Promise<void>;
}

async function startReceiver(status: number): Promise<Receiver> {
  const hits: Receiver['hits'] = [];
  const server: Server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => {
      hits.push({ headers: req.headers, body });
      res.writeHead(status, { 'Content-Type': 'text/plain' });
      res.end(status < 300 ? 'ok from studio e2e' : 'receiver refuses on purpose');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '0.0.0.0', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://${receiverHost}:${port}/hook`,
    hits,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

let productId = '';
let tenantId = '';

test.beforeEach(async ({ page, baseURL }, testInfo) => {
  await login(page);
  if (!productId) {
    const client = await apiClient(page, baseURL ?? '');
    const product = await client.post<{ id: string }>('/v1/products', {
      name: `E2E events ${run}`,
      slug: `e2e-events-${run}`,
    });
    productId = product.id;
    const tenant = await client.post<{ id: string }>(`/v1/products/${productId}/tenants`, {
      name: 'Acme',
      slug: `acme-${run}`,
    });
    tenantId = tenant.id;
  }
  testInfo.annotations.push({ type: 'product', description: productId });
});

test('schedules: create a cron schedule, see its next run, disable and delete it', async ({
  page,
}, testInfo) => {
  const name = `Digest ${testInfo.project.name} ${run}`;
  await page.goto(`/p/${productId}/schedules`);
  await expect(page.getByRole('heading', { level: 1, name: 'Schedules' })).toBeVisible();
  await checkPage(page);

  await page.getByRole('button', { name: 'New schedule' }).click();
  const dialog = page.getByRole('dialog', { name: 'New schedule' });
  await dialog.getByLabel(/^Name/).fill(name);
  await dialog.getByLabel(/^Kind/).fill('studio.e2e.ok');
  await dialog.getByRole('radio', { name: 'Cron expression' }).check();
  const cron = dialog.getByRole('textbox', { name: /^Cron expression/ });
  await cron.fill('61 * * * *');
  await expect(dialog.getByText(/minute field must be between 0 and 59/)).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Create schedule' })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Weekdays at 09:00' }).click();
  await expectNoA11yViolations(page);
  await dialog.getByRole('button', { name: 'Create schedule' }).click();
  await expect(dialog).toBeHidden();

  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toContainText('0 9 * * 1-5');
  await expect(
    row
      .getByRole('cell')
      .filter({ has: page.locator('time') })
      .first(),
  ).toBeVisible();

  await row.getByRole('button', { name: `Actions for schedule ${name}` }).click();
  await page.getByRole('menuitem', { name: 'Disable' }).click();
  await expect(row).toContainText('Disabled');

  await row.getByRole('button', { name: `Actions for schedule ${name}` }).click();
  await page.getByRole('menuitem', { name: 'Delete schedule' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete schedule' });
  await confirm.getByRole('button', { name: 'Delete schedule' }).click();
  await expect(page.getByRole('row', { name: new RegExp(name) })).toHaveCount(0);
});

test('jobs: a failed job is retried from Studio and then succeeds', async ({ page }, testInfo) => {
  test.skip(
    !worker,
    'Set AXENTRA_E2E_WORKER=1 with a worker running e2e/fixtures/axentra_e2e_jobs.',
  );
  await page.goto(`/p/${productId}/jobs`);
  await expect(page.getByRole('heading', { level: 1, name: 'Jobs' })).toBeVisible();

  await page.getByRole('button', { name: 'Enqueue job' }).click();
  const dialog = page.getByRole('dialog', { name: 'Enqueue job' });
  await dialog.getByLabel(/^Kind/).fill('studio.e2e.flaky');
  await dialog
    .getByLabel('Payload')
    .fill(`{"run": "${run}", "project": "${testInfo.project.name}"}`);
  await dialog.getByRole('button', { name: 'Enqueue' }).click();

  // The job page polls unfinished jobs; the handler fails its first attempt permanently.
  await expect(page).toHaveURL(/\/jobs\/job_/);
  await expect(page.getByRole('heading', { level: 1, name: 'studio.e2e.flaky' })).toBeVisible();
  await expect(page.getByText('e2e: first attempt fails on purpose')).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await checkPage(page);

  await page.getByRole('button', { name: 'Retry' }).click();
  await page
    .getByRole('dialog', { name: 'Retry job' })
    .getByRole('button', { name: 'Retry' })
    .click();
  await expect(page.getByRole('region', { name: 'Result' })).toContainText('"retried": true', {
    timeout: 20_000,
  });

  await page.goto(`/p/${productId}/jobs?status=succeeded&kind=studio.e2e.flaky`);
  await expect(page.getByRole('link', { name: 'studio.e2e.flaky' }).first()).toBeVisible();
  await checkPage(page);
});

test('jobs: a queued job can be cancelled', async ({ page }) => {
  await page.goto(`/p/${productId}/jobs`);
  await page.getByRole('button', { name: 'Enqueue job' }).click();
  const dialog = page.getByRole('dialog', { name: 'Enqueue job' });
  await dialog.getByLabel(/^Kind/).fill('studio.e2e.ok');
  await dialog.getByLabel(/^Delay/).fill('3600');
  await dialog.getByRole('button', { name: 'Enqueue' }).click();
  await expect(page).toHaveURL(/\/jobs\/job_/);
  await page.getByRole('button', { name: 'Cancel job' }).click();
  await page
    .getByRole('dialog', { name: 'Cancel job' })
    .getByRole('button', { name: 'Cancel job' })
    .click();
  await expect(page.getByText('Cancelled').first()).toBeVisible();
});

test('webhooks: endpoint with a one-time secret, test ping, failing deliveries and redelivery', async ({
  page,
  baseURL,
}) => {
  const ok = await startReceiver(200);
  const failing = await startReceiver(500);
  try {
    await page.goto(`/p/${productId}/webhooks`);
    await expect(page.getByRole('heading', { level: 1, name: 'Webhooks' })).toBeVisible();
    await checkPage(page);

    // A working receiver: the signing secret is shown once, the test ping is signed.
    await page.getByRole('button', { name: 'New endpoint' }).click();
    let dialog = page.getByRole('dialog', { name: 'New endpoint' });
    await dialog.getByLabel(/^URL/).fill('ftp://example.com');
    await expect(dialog.getByText(/Only https:\/\//)).toBeVisible();
    await dialog.getByLabel(/^URL/).fill(ok.url);
    await dialog.getByRole('combobox', { name: /^Event types/ }).fill('e2e.*');
    await dialog.getByRole('button', { name: 'Add type' }).click();
    await expectNoA11yViolations(page);
    await dialog.getByRole('button', { name: 'Create endpoint' }).click();
    const secret = page.getByRole('dialog', { name: 'Signing secret' });
    await expect(secret).toBeVisible();
    await expect(secret.getByRole('button', { name: 'Done' })).toBeDisabled();
    await secret.getByRole('checkbox').check();
    await secret.getByRole('button', { name: 'Done' }).click();
    await expect(page).toHaveURL(/\/webhooks\/whk_/);

    await page.getByRole('button', { name: 'Send test ping' }).click();
    await expect(page.getByText(/Test ping delivered \(HTTP 200\)/).first()).toBeVisible();
    expect(ok.hits.at(-1)?.headers['axentra-signature']).toMatch(/^t=\d+,v1=[0-9a-f]{64}/);
    const drawer = page.getByRole('dialog', { name: 'axentra.ping' });
    await expect(drawer.getByRole('region', { name: /Response body/ })).toContainText(
      'ok from studio e2e',
    );
    await checkPage(page);
    await page.keyboard.press('Escape');

    // A failing receiver: the test ping reports the status code honestly.
    await page.goto(`/p/${productId}/webhooks?new=1`);
    dialog = page.getByRole('dialog', { name: 'New endpoint' });
    await dialog.getByLabel(/^URL/).fill(failing.url);
    await dialog.getByRole('combobox', { name: /^Event types/ }).fill('e2e.*');
    await dialog.getByRole('button', { name: 'Add type' }).click();
    await dialog.getByRole('button', { name: 'Create endpoint' }).click();
    await page.getByRole('dialog', { name: 'Signing secret' }).getByRole('checkbox').check();
    await page
      .getByRole('dialog', { name: 'Signing secret' })
      .getByRole('button', { name: 'Done' })
      .click();
    await expect(page).toHaveURL(/\/webhooks\/whk_/);
    await page.getByRole('button', { name: 'Send test ping' }).click();
    await expect(page.getByText('The endpoint answered with HTTP 500.').first()).toBeVisible();
    await page.keyboard.press('Escape');

    if (!worker) return;
    // A real event fans out to the failing endpoint through the worker and ends as dead.
    const client = await apiClient(page, baseURL ?? '');
    await client.post(`/v1/products/${productId}/tenants/${tenantId}/events`, {
      type: 'e2e.order.created',
      data: { run },
    });
    const row = page.getByRole('row', { name: /e2e\.order\.created/ });
    await expect(async () => {
      await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(row).toContainText('Dead', { timeout: 2_000 });
    }).toPass({ timeout: 40_000 });
    await expect(row).toContainText('500');
    await checkPage(page);

    const before = failing.hits.length;
    await row.getByRole('button', { name: /Show delivery/ }).click();
    const delivery = page.getByRole('dialog', { name: 'e2e.order.created' });
    await delivery.getByRole('button', { name: 'Redeliver' }).click();
    await expect(page.getByText('Delivery queued again').first()).toBeVisible();
    await expect.poll(() => failing.hits.length, { timeout: 20_000 }).toBeGreaterThan(before);
  } finally {
    await ok.close();
    await failing.close();
  }
});

test('events: the live view shows an event published while it is open', async ({
  page,
  baseURL,
}) => {
  await page.goto(`/p/${productId}/events?view=live`);
  await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /^Live$/ })).toBeVisible({
    timeout: 15_000,
  });

  const type = `e2e.live.${run}`;
  const client = await apiClient(page, baseURL ?? '');
  await client.post(`/v1/products/${productId}/tenants/${tenantId}/events`, {
    type,
    data: { hello: 'studio' },
  });
  const received = page.getByRole('list', { name: 'Received events' });
  await expect(received.getByText(type, { exact: true })).toBeVisible({ timeout: 15_000 });
  await checkPage(page);

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('Live, paused')).toBeVisible();
  await client.post(`/v1/products/${productId}/tenants/${tenantId}/events`, {
    type: `${type}.paused`,
    data: {},
  });
  await expect(page.getByRole('button', { name: 'Resume (1 new event)' })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Resume (1 new event)' }).click();
  await expect(received.getByText(`${type}.paused`, { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Event log' }).click();
  await expect(page.getByRole('rowheader', { name: type, exact: true })).toBeVisible();
  await checkPage(page);
});
