import { expect, test, type Browser, type Page } from '@playwright/test';
import { apiClient } from './notify-monitoring-support';
import {
  e2e,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  serverMode,
  signIn,
  SIGNED_OUT_CONSOLE_ALLOW,
  SKIP_NO_ADMIN,
  SKIP_NO_API,
  specProduct,
  trackConsoleErrors,
} from './support';

/**
 * The Phase-1 write flows through the real UI against a real backend: creating a product and a
 * tenant, suspending the tenant, custom roles (create, edit, delete), API keys (create with a
 * one-time secret, rotate with a grace period, revoke), and the own account (change the
 * password, sign out another session, sign out). Dialogs and confirmations are checked with axe
 * while they are open.
 */
test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);
test.describe.configure({ timeout: 150_000 });

const suffixFor = () =>
  `${test.info().project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9]/g, '');
const isMobile = () => test.info().project.name === 'mobile';

async function acknowledgeSecret(page: Page) {
  const secret = page.getByRole('dialog', { name: /Secret for/ });
  await expect(secret).toBeVisible();
  const done = secret.getByRole('button', { name: 'Done' });
  await expect(done).toBeDisabled();
  await secret.getByRole('checkbox', { name: 'I have stored the secret securely' }).click();
  await done.click();
  await expect(secret).toBeHidden();
}

test('create a product and a tenant, then suspend the tenant', async ({ page }) => {
  const server = await serverMode(page.request);
  await signIn(page);
  // The duplicate tenant is refused on purpose (the browser logs the 409).
  const console = trackConsoleErrors(page, [/status of 409/]);
  const suffix = suffixFor();
  let productId: string;

  if (server.mode === 'multi') {
    await page.goto('/products');
    await page.getByRole('button', { name: 'New product' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Create product' });
    await dialog.getByRole('textbox', { name: /^Name/ }).fill(`Write flows ${suffix}`);
    await expect(dialog.getByRole('textbox', { name: /^Slug/ })).toHaveValue(
      `write-flows-${suffix}`,
    );
    await expectNoA11yViolations(page);
    await dialog.getByRole('button', { name: 'Create product' }).click();
    await expect(
      page.getByText(`Product “Write flows ${suffix}” created`, { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/products\/prd_/);
    productId = decodeURIComponent(new URL(page.url()).pathname.split('/').pop() ?? '');
    await expect(
      page.getByRole('heading', { name: `Write flows ${suffix}`, level: 1 }),
    ).toBeVisible();
  } else {
    productId = server.product?.id ?? '';
  }

  // ---- Tenant: the create dialog survives a reload (?new=1) ----
  await page.goto(`/p/${productId}/tenants?new=1`);
  let dialog = page.getByRole('dialog', { name: 'Create tenant' });
  await expect(dialog).toBeVisible();
  await page.reload();
  dialog = page.getByRole('dialog', { name: 'Create tenant' });
  await expect(dialog).toBeVisible();
  const name = `Tenant ${suffix}`;
  await dialog.getByRole('textbox', { name: /^Name/ }).fill(name);
  await dialog.getByRole('button', { name: 'Create tenant' }).click();
  await expect(page.getByText(`Tenant “${name}” created`, { exact: true })).toBeVisible();
  // Studio opens the new tenant.
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  const tenantUrl = page.url();

  // ---- A duplicate slug is explained, the dialog stays open ----
  await page.goto(`/p/${productId}/tenants?new=1`);
  dialog = page.getByRole('dialog', { name: 'Create tenant' });
  await dialog.getByRole('textbox', { name: /^Name/ }).fill(name);
  await dialog.getByRole('button', { name: 'Create tenant' }).click();
  await expect(page.getByText(/already|exists|taken|conflict/i).first()).toBeVisible();
  await expect(dialog).toBeVisible();
  await expectNoA11yViolations(page);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();

  // ---- Suspend from the tenant page (confirmation names the tenant) ----
  await page.goto(tenantUrl);
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Suspend tenant' }).click();
  const confirm = page.getByRole('dialog', { name: 'Suspend tenant?' });
  await expect(confirm.getByText(new RegExp(`Members of “${name}”`))).toBeVisible();
  await expectNoA11yViolations(page);
  await confirm.getByRole('button', { name: 'Suspend tenant' }).click();
  await expect(page.getByText('Tenant suspended', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reactivate tenant' })).toBeVisible();
  await expectNoHorizontalScroll(page);
  console.assertNone();
});

test('custom roles: create, edit and delete', async ({ page }) => {
  await signIn(page);
  const console = trackConsoleErrors(page);
  const suffix = suffixFor();
  const { id: productId } = await specProduct(page.request, {
    name: `Roles e2e ${suffix}`,
    slug: `ro-${suffix}`.slice(0, 60),
  });
  const roleName = `Clerk ${suffix}`;
  await page.goto(`/p/${productId}/roles`);
  await page.getByRole('button', { name: 'New custom role' }).click();
  const editor = page.getByRole('dialog', { name: 'New custom role' });
  await editor.getByRole('textbox', { name: /^Name/ }).fill(roleName);
  await expect(editor.getByRole('textbox', { name: /^Key/ })).toHaveValue(`clerk_${suffix}`);
  await editor.getByRole('checkbox', { name: /^records:read/ }).click();
  await expectNoA11yViolations(page);
  await editor.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(`Role “${roleName}” created`, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: `Edit role ${roleName}` }).click();
  const edit = page.getByRole('dialog', { name: `Edit role ${roleName}` });
  await edit.getByRole('checkbox', { name: /^records:write/ }).click();
  await edit.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(`Role “${roleName}” saved`, { exact: true })).toBeVisible();
  const roles = (await (await page.request.get(`/v1/products/${productId}/roles`)).json()) as {
    name: string;
    permissions: string[];
  }[];
  expect(roles.find((role) => role.name === roleName)?.permissions.sort()).toEqual([
    'records:read',
    'records:write',
  ]);

  await page.getByRole('button', { name: `Delete role ${roleName}` }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete role?' });
  const remove = confirm.getByRole('button', { name: 'Delete role' });
  await expect(remove).toBeDisabled();
  await confirm.getByRole('textbox', { name: `Type ${roleName} to confirm` }).fill(roleName);
  await remove.click();
  await expect(page.getByText(`Role “${roleName}” deleted`, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: `Edit role ${roleName}` })).toHaveCount(0);
  console.assertNone();
});

test('API keys: create with a one-time secret, rotate with a grace period, revoke', async ({
  page,
}) => {
  await signIn(page);
  const console = trackConsoleErrors(page);
  const suffix = suffixFor();
  const { id: productId } = await specProduct(page.request, {
    name: `Key flows ${suffix}`,
    slug: `kf-${suffix}`.slice(0, 60),
  });
  const keyName = `export-${suffix}`;
  await page.goto(`/p/${productId}/api-keys`);
  await page.getByRole('button', { name: 'New API key' }).click();
  const dialog = page.getByRole('dialog', { name: 'New API key' });
  await dialog.getByRole('textbox', { name: /^Name/ }).fill(keyName);
  await dialog.getByRole('checkbox', { name: /^records:read/ }).click();
  await dialog.getByRole('button', { name: 'Create key' }).click();
  await expect(page.getByRole('dialog', { name: /Secret for/ })).toBeVisible();
  await expectNoA11yViolations(page);
  await acknowledgeSecret(page);

  // ---- Rotate with a 1 h grace period: the old key keeps working until then ----
  await page
    .getByRole('button', { name: `Actions for ${keyName}` })
    .first()
    .click();
  await expectNoA11yViolations(page); // the open row menu
  await page.getByRole('menuitem', { name: 'Rotate secret' }).click();
  const rotate = page.getByRole('dialog', { name: 'Rotate secret?' });
  await rotate.getByRole('combobox', { name: /Grace period/ }).selectOption('3600');
  await rotate.getByRole('button', { name: 'Rotate secret' }).click();
  await acknowledgeSecret(page);
  const keys = (await (await page.request.get(`/v1/products/${productId}/api-keys`)).json()) as {
    id: string;
    name: string;
    status: string;
    revoked_at: string | null;
    replaces: string | null;
  }[];
  const mine = keys.filter((key) => key.name === keyName);
  expect(mine).toHaveLength(2);
  const replacement = mine.find((key) => key.replaces);
  const old = mine.find((key) => !key.replaces);
  // The old key stays active until the end of the grace period, and the list says so.
  expect(old?.status).toBe('active');
  expect(Date.parse(old?.revoked_at ?? '')).toBeGreaterThan(Date.now() + 50 * 60_000);
  // Scoped to this key's rows: in single-product mode the other project's keys share the list.
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: keyName })
      .getByText(/Replaced, stops working/),
  ).toBeVisible();

  // ---- Revoke the replacement (typed confirmation) ----
  await page
    .getByRole('button', { name: `Actions for ${keyName}` })
    .first()
    .click();
  await page.getByRole('menuitem', { name: 'Revoke key' }).click();
  const revoke = page.getByRole('dialog', { name: 'Revoke API key?' });
  const confirm = revoke.getByRole('button', { name: 'Revoke key' });
  await expect(confirm).toBeDisabled();
  await revoke.getByRole('textbox', { name: `Type ${keyName} to confirm` }).fill(keyName);
  await expectNoA11yViolations(page);
  await confirm.click();
  await expect(page.getByText(`API key “${keyName}” revoked`, { exact: true })).toBeVisible();
  const after = (await (await page.request.get(`/v1/products/${productId}/api-keys`)).json()) as {
    id: string;
    status: string;
  }[];
  const revokedIds = new Set(after.filter((key) => key.status === 'revoked').map((key) => key.id));
  expect(revokedIds.has(replacement?.id ?? '') || revokedIds.has(old?.id ?? '')).toBe(true);
  if (!isMobile()) await expect(page.getByRole('cell', { name: 'Revoked' }).first()).toBeVisible();
  console.assertNone();
});

async function newAccount(page: Page, suffix: string) {
  const { id: productId } = await specProduct(page.request, {
    name: `Account e2e ${suffix}`,
    slug: `ac-${suffix}`.slice(0, 60),
  });
  const client = await apiClient(page);
  const account = { email: `account-${suffix}@example.com`, password: `pw-${suffix}-Secret-123` };
  const job = await client.post<{ id: string }>(`/v1/products/${productId}/jobs`, {
    kind: 'studio.e2e.create_user',
    payload: { ...account, name: `Account ${suffix}` },
  });
  await expect
    .poll(
      async () =>
        (await client.get<{ status: string }>(`/v1/products/${productId}/jobs/${job.id}`)).status,
      { timeout: 60_000, message: 'fixture job studio.e2e.create_user did not succeed' },
    )
    .toBe('succeeded');
  return account;
}

/** A second browser session for the account, so there is "another session" to sign out. */
async function secondSession(browser: Browser, account: { email: string; password: string }) {
  const context = await browser.newContext();
  const other = await context.newPage();
  await signIn(other, account);
  return context;
}

test('own account: change the password, sign out another session, sign out', async ({
  page,
  browser,
}) => {
  test.skip(
    process.env.AXENTRA_E2E_WORKER !== '1',
    'Needs the e2e worker (scripts/e2e-backend.sh --worker) to create a fresh account.',
  );
  await signIn(page);
  const suffix = suffixFor();
  const account = await newAccount(page, suffix);
  await page.context().clearCookies();
  await signIn(page, account);
  // Signed out at the end, the login page's session probe answers 401.
  // In single-product mode the account (no roles) opens the one product, whose endpoints answer
  // 404 to callers without access (Axentra hides what you cannot see).
  const console = trackConsoleErrors(page, [
    ...SIGNED_OUT_CONSOLE_ALLOW,
    ...(process.env.AXENTRA_E2E_MODE === 'single' ? [/status of 404/] : []),
  ]);
  const other = await secondSession(browser, account);

  await page.goto('/profile');
  const sessions = page.getByRole('table', { name: 'Your sessions' });
  await expect(sessions.getByRole('row')).toHaveCount(3); // header + two sessions
  // ---- Sign out the other session from its row ----
  await sessions.getByRole('button', { name: /^Revoke the session on/ }).click();
  await expect(page.getByText('Session revoked', { exact: true })).toBeVisible();
  await expect(sessions.getByRole('row')).toHaveCount(2);
  const [otherPage] = other.pages();
  const probe = await (otherPage ?? page).request.get('/v1/me');
  expect(probe.status()).toBe(401);
  await other.close();

  // ---- Change the password: a mismatch is explained at the field first ----
  const newPassword = `${account.password}-new`;
  await page.getByRole('textbox', { name: /^Current password/ }).fill(account.password);
  await page.getByRole('textbox', { name: /^New password/ }).fill(newPassword);
  await page.getByRole('textbox', { name: /^Repeat new password/ }).fill(`${newPassword}x`);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('The new passwords do not match.')).toBeVisible();
  await expectNoA11yViolations(page);
  await page.getByRole('textbox', { name: /^Repeat new password/ }).fill(newPassword);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Password changed', { exact: true })).toBeVisible();

  // ---- Sign out from the user menu, then sign in with the new password ----
  await page.getByRole('button', { name: 'Open user menu' }).click();
  await expectNoA11yViolations(page); // the open user menu
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login/);
  expect((await page.request.get('/v1/me')).status()).toBe(401);
  await signIn(page, { email: account.email, password: newPassword });
  await expect(page).not.toHaveURL(/\/login/);
  console.assertNone();
});
