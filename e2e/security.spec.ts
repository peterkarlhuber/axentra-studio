import { expect, test, type Browser, type Page } from '@playwright/test';
import { specProduct } from './support';
import {
  api,
  apiClient,
  email,
  expectAccessibleInBothThemes,
  expectNoHorizontalScroll,
  login,
  password,
} from './notify-monitoring-support';

/**
 * Behaviour that follows the backend's security rules (Axentra 7511a37,
 * docs/architecture/SECURITY_MODEL.md rules 8, 9 and 12), against a real backend:
 *
 * - adding a user the caller cannot see answers 404, and Studio offers an invitation instead;
 * - the built-in `invitation` template is system-only: no "Send test";
 * - without `notify:send_external` the send-test dialog offers tenant members only;
 * - the role ceiling: roles above the caller's own grant are not offered.
 *
 * A second, non-admin account is created by the `studio.e2e.create_user` job of
 * e2e/fixtures/axentra_e2e_jobs.py (Axentra has no public API for that), so the worker must run
 * (`scripts/e2e-backend.sh run --worker`, AXENTRA_E2E_WORKER=1).
 *
 * Multi-product mode: a new product per test. Single-product mode: the server's one product
 * (shared), with a new tenant, template and custom role per test (keys carry the suffix).
 */
const worker = process.env.AXENTRA_E2E_WORKER === '1';

test.skip(!api, 'AXENTRA_E2E_API is not set: start an Axentra API to run the security tests.');
test.skip(
  !email || !password,
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing platform admin to run the security tests.',
);

/** A custom product role: may list templates and send to members, not to free addresses. */
const NOTIFIER_PERMISSIONS = [
  'product:read',
  'tenants:read',
  'roles:read',
  'notify:manage',
  'tenant:read',
  'members:read',
  'search:query',
  'members:manage',
  'notify:send',
  'records:read',
  'files:read',
  'usage:read',
  'billing:read',
];

interface Fixture {
  productId: string;
  tenantId: string;
  templateKey: string;
  templateName: string;
  adminId: string;
  adminEmail: string;
  suffix: string;
}

async function createFixture(page: Page, project: string): Promise<Fixture> {
  const suffix = `${Date.now().toString(36)}${project.slice(0, 3)}`;
  await login(page);
  const client = await apiClient(page);
  const me = await client.get<{ user: { id: string; email: string } }>('/v1/me');
  const product = await specProduct(page.request, {
    name: `Security E2E ${suffix}`,
    slug: `security-e2e-${suffix}`,
  });
  const tenant = await client.post<{ id: string }>(`/v1/products/${product.id}/tenants`, {
    name: `Tenant ${suffix}`,
    slug: `tenant-${suffix}`,
    owner_user_id: me.user.id,
  });
  const templateKey = `welcome.${suffix}`;
  const templateName = `Welcome ${suffix}`;
  await client.post(`/v1/products/${product.id}/notify/templates`, {
    key: templateKey,
    name: templateName,
    category: 'onboarding',
    variables: ['name'],
    sample_data: { name: 'Ada' },
    variants: { en: { subject: 'Hello {{ name }}', text: 'Hi {{ name }}.', html: null } },
  });
  return {
    productId: product.id,
    tenantId: tenant.id,
    templateKey,
    templateName,
    adminId: me.user.id,
    adminEmail: me.user.email,
    suffix,
  };
}

/** Creates a password user through the fixture job and makes it an operator with a custom role. */
async function createNotifier(page: Page, fixture: Fixture) {
  const client = await apiClient(page);
  const userEmail = `notifier-${fixture.suffix}@example.com`;
  const userPassword = `pw-${fixture.suffix}-Secret-123`;
  const job = await client.post<{ id: string }>(`/v1/products/${fixture.productId}/jobs`, {
    kind: 'studio.e2e.create_user',
    payload: { email: userEmail, password: userPassword, name: `Notifier ${fixture.suffix}` },
  });
  let result: { status: string; result?: { user_id?: string } | null } = { status: 'queued' };
  await expect
    .poll(
      async () => {
        result = await client.get(`/v1/products/${fixture.productId}/jobs/${job.id}`);
        return result.status;
      },
      { timeout: 60_000, message: 'fixture job studio.e2e.create_user did not succeed' },
    )
    .toBe('succeeded');
  const userId = result.result?.user_id ?? '';
  const roleKey = `e2e_notifier_${fixture.suffix}`;
  await client.post(`/v1/products/${fixture.productId}/roles`, {
    key: roleKey,
    name: `E2E notifier ${fixture.suffix}`,
    scope: 'product',
    description: 'notify:send without notify:send_external',
    permissions: NOTIFIER_PERMISSIONS,
  });
  await client.post(`/v1/products/${fixture.productId}/members`, {
    user_id: userId,
    role: roleKey,
  });
  return { email: userEmail, password: userPassword };
}

async function signInAs(
  browser: Browser,
  baseURL: string | undefined,
  user: { email: string; password: string },
) {
  const context = await browser.newContext({ baseURL, locale: 'en-US' });
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
  return { context, page };
}

test('adding an unknown user offers an invitation instead (tenant) and explains it (product)', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const fixture = await createFixture(page, testInfo.project.name);
  const stranger = `stranger-${fixture.suffix}@example.com`;

  await page.goto(`/p/${fixture.productId}/tenants/${fixture.tenantId}`);
  await page.getByRole('tab', { name: 'Members' }).click();
  await page.getByRole('button', { name: 'Add member' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: /Email address/ }).fill(stranger);
  await dialog.getByRole('combobox', { name: /Role/ }).selectOption('viewer');
  await dialog.getByRole('button', { name: 'Add member' }).click();
  await expect(dialog.getByText('User not found')).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessibleInBothThemes(page);
  await dialog.getByRole('button', { name: 'Send invitation instead' }).click();
  await expect(dialog.getByRole('heading', { name: 'Invitation created' })).toBeVisible();
  await expect(dialog.getByText('Shown only once')).toBeVisible();
  await dialog.getByRole('button', { name: 'Done' }).click();

  await page.getByRole('tab', { name: 'Invitations' }).click();
  const row = page.getByRole('row').filter({ hasText: stranger });
  await expect(row).toBeVisible();
  await expect(row.getByText('viewer')).toBeVisible();

  // Product members: no invitations exist for operators, so the 404 is explained.
  await page.goto(`/products/${fixture.productId}`);
  await page.getByRole('tab', { name: 'Members' }).click();
  await page.getByRole('button', { name: 'Add member' }).click();
  const productDialog = page.getByRole('dialog');
  await productDialog.getByRole('textbox', { name: /Email address/ }).fill(stranger);
  await productDialog.getByRole('combobox', { name: /Role/ }).selectOption('product_viewer');
  await productDialog.getByRole('button', { name: 'Add member' }).click();
  await expect(
    productDialog.getByText(/Product members must already have an account/),
  ).toBeVisible();
  await expect(productDialog.getByRole('button', { name: 'Send invitation instead' })).toHaveCount(
    0,
  );
});

test('the system-only invitation template offers no "Send test"; admins may send to any address', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const fixture = await createFixture(page, testInfo.project.name);

  await page.goto(`/p/${fixture.productId}/notifications`);
  const invitationRow = page
    .getByRole('row')
    .filter({ hasText: 'invitation' })
    .filter({
      has: page.getByText('System only'),
    });
  await expect(invitationRow).toBeVisible();
  await expect(invitationRow.getByRole('button', { name: /Send test notification/ })).toHaveCount(
    0,
  );
  await expect(page.getByText(/cannot be sent as a test/)).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessibleInBothThemes(page);

  await page.goto(`/p/${fixture.productId}/notifications/templates/invitation`);
  await expect(page.getByText(/Axentra sends this template itself/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send test' })).toHaveCount(0);

  // A platform admin holds notify:send_external: free-form addresses are offered.
  await page.goto(`/p/${fixture.productId}/notifications`);
  await page
    .getByRole('button', { name: `Send test notification from ${fixture.templateName}` })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('combobox', { name: 'Send to' })).toBeVisible();
  await dialog.getByRole('combobox', { name: 'Send to' }).selectOption('email');
  await expect(dialog.getByRole('textbox', { name: /^Email address/ })).toBeVisible();
});

test('without notify:send_external only members are offered, and roles above the caller are not', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.skip(
    !worker,
    'Needs the e2e worker (scripts/e2e-backend.sh run --worker) for the second account.',
  );
  test.setTimeout(240_000);
  const fixture = await createFixture(page, testInfo.project.name);
  const notifier = await createNotifier(page, fixture);
  const { context, page: other } = await signInAs(browser, baseURL, notifier);
  try {
    await other.setViewportSize(page.viewportSize() ?? { width: 1280, height: 720 });

    // ---- Send test: members only, with the explanation ----
    await other.goto(`/p/${fixture.productId}/notifications`);
    await other
      .getByRole('button', { name: `Send test notification from ${fixture.templateName}` })
      .click();
    const dialog = other.getByRole('dialog');
    await expect(
      dialog.getByText(/needs the product permission notify:send_external/),
    ).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Send to' })).toHaveCount(0);
    await dialog.getByLabel('Tenant').selectOption(fixture.tenantId);
    await expect(
      dialog
        .getByRole('combobox', { name: /^Member/ })
        .locator('option', { hasText: fixture.adminEmail }),
    ).toHaveCount(1);
    await expectAccessibleInBothThemes(other);
    await dialog.getByRole('combobox', { name: /^Member/ }).selectOption(fixture.adminId);
    await dialog.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(dialog.getByText('Notification accepted', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).first().click();

    // ---- Role ceiling: the custom role holds viewer permissions only ----
    await other.goto(`/p/${fixture.productId}/tenants/${fixture.tenantId}`);
    await other.getByRole('tab', { name: 'Members' }).click();
    const ownerRow = other.getByRole('row').filter({ hasText: fixture.adminEmail });
    await expect(ownerRow.getByText(/Above your own role/)).toBeVisible();
    await expect(ownerRow.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
    await other.getByRole('button', { name: 'Add member' }).click();
    const add = other.getByRole('dialog');
    const roles = add.getByRole('combobox', { name: /Role/ });
    await expect(roles.locator('option', { hasText: /^Owner \(above/ })).toBeDisabled();
    await expect(roles.locator('option', { hasText: /^Member \(above/ })).toBeDisabled();
    await expect(roles.locator('option', { hasText: /^Viewer$/ })).toBeEnabled();
    await expect(add.getByText(/cannot be assigned/)).toBeVisible();
    await expectNoHorizontalScroll(other);
    await expectAccessibleInBothThemes(other);
  } finally {
    await context.close();
  }
});

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
  return hrefs;
}

test('the sidebar hides the audit log without an audit permission; a direct link explains it', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.skip(
    !worker,
    'Needs the e2e worker (scripts/e2e-backend.sh run --worker) for the second account.',
  );
  test.setTimeout(240_000);
  const fixture = await createFixture(page, testInfo.project.name);
  // The platform admin sees it.
  await page.goto(`/p/${fixture.productId}/dashboard`);
  expect(await navigationHrefs(page)).toContain('/audit');

  const notifier = await createNotifier(page, fixture); // no audit:read, no platform role
  const { context, page: other } = await signInAs(browser, baseURL, notifier);
  try {
    await other.setViewportSize(page.viewportSize() ?? { width: 1280, height: 720 });
    await other.goto(`/p/${fixture.productId}/dashboard`);
    const hrefs = await navigationHrefs(other);
    expect(hrefs).not.toContain('/audit');
    // Preferences and the public health checks stay reachable for everyone.
    expect(hrefs).toEqual(expect.arrayContaining(['/settings', '/health', '/monitoring']));

    await other.goto('/audit');
    await expect(other.getByRole('heading', { name: 'Audit log', level: 1 })).toBeVisible();
    await expect(other.getByText('Not permitted').first()).toBeVisible();
    await expectNoHorizontalScroll(other);
  } finally {
    await context.close();
  }
});
