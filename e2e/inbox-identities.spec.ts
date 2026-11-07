import { expect, test, type Page } from '@playwright/test';
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
 * The views for Axentra's TODO round 4 additions against a real backend: the caller's in-app
 * inbox (`.../notify/inbox/me`) and the single sign-on identities of users
 * (`POST /v1/users/external`, `.../identities`), as the platform admin of scripts/e2e-backend.sh.
 * Both work in multi- and single-product mode: names carry a per-run, per-project suffix, and
 * the inbox is filtered to a tenant this spec creates.
 */
test.skip(!api, 'AXENTRA_E2E_API is not set: start an Axentra API to run these tests.');
test.skip(
  !email || !password,
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing platform admin to run these tests.',
);

const runSuffix = (projectName: string) => `${Date.now().toString(36)}${projectName.slice(0, 3)}`;

/** POST with the page's session (CSRF, Origin) and optional extra headers; returns the response. */
async function post(page: Page, path: string, data: unknown, headers: Record<string, string> = {}) {
  const session = (await (await page.request.get('/v1/auth/session')).json()) as {
    csrf_token: string;
  };
  return page.request.post(path, {
    headers: {
      'X-Axentra-CSRF': session.csrf_token,
      Origin: new URL(page.url()).origin,
      ...headers,
    },
    data,
  });
}

test('the inbox lists, opens and marks in-app notifications as read', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const suffix = runSuffix(testInfo.project.name);
  await login(page);
  const client = await apiClient(page);
  const me = await client.get<{ user: { id: string } }>('/v1/me');
  const product = await specProduct(page.request, {
    name: `Inbox E2E ${suffix}`,
    slug: `inbox-e2e-${suffix}`,
  });
  const tenant = await client.post<{ id: string; name: string }>(
    `/v1/products/${product.id}/tenants`,
    { name: `Inbox tenant ${suffix}`, slug: `inbox-${suffix}`, owner_user_id: me.user.id },
  );
  const key = `inbox.${suffix}`;
  await client.post(`/v1/products/${product.id}/notify/templates`, {
    key,
    channel: 'inbox',
    category: 'product',
    name: `Inbox ${suffix}`,
    variables: ['n'],
    variants: { en: { subject: `Report {{ n }} ${suffix}`, text: 'Report {{ n }} is ready.' } },
  });
  for (const n of ['one', 'two']) {
    const response = await post(
      page,
      `/v1/products/${product.id}/tenants/${tenant.id}/notify/send`,
      { template_key: key, to: { user_id: me.user.id }, variables: { n } },
      { 'Idempotency-Key': `inbox-${suffix}-${n}` },
    );
    expect(response.ok(), `send ${n}: ${response.status()} ${await response.text()}`).toBe(true);
  }

  await page.goto(`/p/${product.id}/inbox`);
  await expect(page.getByRole('heading', { level: 1, name: 'Inbox' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Tenant' }).selectOption({ label: tenant.name });
  const table = page.getByRole('table', { name: 'Inbox' });
  await expect(table.getByText(`Report one ${suffix}`)).toBeVisible();
  await expect(table.getByText(`Report two ${suffix}`)).toBeVisible();
  await expect(page.getByText('2 unread', { exact: true })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessibleInBothThemes(page);

  // Opening shows the text and marks the notification as read.
  await page.getByRole('button', { name: `Open “Report one ${suffix}”` }).click();
  const drawer = page.getByRole('dialog', { name: `Report one ${suffix}` });
  await expect(drawer.getByText('Report one is ready.')).toBeVisible();
  await expectAccessibleInBothThemes(page);
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(page.getByText('1 unread', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(page.getByText('1 notification marked as read', { exact: true })).toBeVisible();
  await expect(page.getByText('0 unread', { exact: true })).toBeVisible();
  await page.getByRole('switch', { name: 'Only unread' }).click();
  await expect(page.getByText('No unread notifications')).toBeVisible();
});

test('a platform admin adds a single sign-on user and links and unlinks identities', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const suffix = runSuffix(testInfo.project.name);
  const issuer = `https://idp-${suffix}.example`;
  await login(page);
  const product = await specProduct(page.request, {
    name: `Identities E2E ${suffix}`,
    slug: `identities-e2e-${suffix}`,
  });

  await page.goto(`/p/${product.id}/users`);
  await page.getByRole('button', { name: 'Add single sign-on user' }).click();
  const create = page.getByRole('dialog', { name: 'Add a single sign-on user' });
  await create.getByRole('textbox', { name: /Provider \(issuer\)/ }).fill(issuer);
  await create.getByRole('textbox', { name: /^Subject/ }).fill(`first-${suffix}`);
  await create.getByRole('textbox', { name: /^Name/ }).fill(`SSO user ${suffix}`);
  await expectAccessibleInBothThemes(page);
  await create.getByRole('button', { name: 'Add user' }).click();

  // The new user's page: no email address, no password, one identity.
  await expect(page.getByRole('heading', { level: 1, name: `SSO user ${suffix}` })).toBeVisible();
  await expect(page.getByText('No email address', { exact: true })).toBeVisible();
  const identities = page.getByRole('table', { name: 'Single sign-on identities' });
  await expect(identities.getByText(`first-${suffix}`)).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessibleInBothThemes(page);

  // A second identity, then unlink the first one (the second still signs in).
  await page.getByRole('button', { name: 'Link identity' }).click();
  const link = page.getByRole('dialog', { name: 'Link a single sign-on identity' });
  await link.getByRole('textbox', { name: /Provider \(issuer\)/ }).fill(issuer);
  await link.getByRole('textbox', { name: /^Subject/ }).fill(`second-${suffix}`);
  await link.getByRole('button', { name: 'Link identity' }).click();
  await expect(page.getByText('Identity linked', { exact: true })).toBeVisible();
  await expect(identities.getByText(`second-${suffix}`)).toBeVisible();

  const unlinkButtons = page.getByRole('button', { name: `Unlink the identity at ${issuer}` });
  await unlinkButtons.first().click();
  const confirm = page.getByRole('dialog', { name: 'Unlink identity?' });
  await confirm.getByRole('button', { name: 'Unlink identity' }).click();
  await expect(
    page.getByText('Identity unlinked, 0 sessions ended', { exact: true }),
  ).toBeVisible();
  await expect(identities.getByRole('row')).toHaveCount(2); // header + one identity

  // The last way to sign in is refused, and the dialog says why.
  await unlinkButtons.first().click();
  await confirm.getByRole('button', { name: 'Unlink identity' }).click();
  await expect(confirm.getByText("The user's last way to sign in", { exact: true })).toBeVisible();
  await expectAccessibleInBothThemes(page);
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(identities.getByRole('row')).toHaveCount(2);
});
