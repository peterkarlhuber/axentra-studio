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
 * Email verification and password reset against a real backend, through the emails Axentra
 * sends: the links are read from the local mailbox (notify provider `local`, which
 * scripts/e2e-backend.sh configures) by the platform admin, who alone may see them there.
 *
 * The account is a fresh password account created by the `studio.e2e.create_user` fixture job
 * (the worker must run), and a member of a tenant, so its product can send the emails.
 */
const worker = process.env.AXENTRA_E2E_WORKER === '1';

test.skip(!api, 'AXENTRA_E2E_API is not set: start an Axentra API to run these tests.');
test.skip(
  !email || !password,
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to a platform admin.',
);
test.skip(!worker, 'The account is created by a fixture job: run the worker.');

interface Account {
  productId: string;
  email: string;
  password: string;
}

async function createAccount(page: Page, project: string): Promise<Account> {
  const suffix = `${Date.now().toString(36)}${project.slice(0, 3)}`;
  await login(page);
  const client = await apiClient(page);
  const product = await specProduct(page.request, {
    name: `Recovery E2E ${suffix}`,
    slug: `recovery-e2e-${suffix}`,
  });
  const tenant = await client.post<{ id: string }>(`/v1/products/${product.id}/tenants`, {
    name: `Recovery ${suffix}`,
    slug: `recovery-${suffix}`,
  });
  const account = { email: `recover-${suffix}@example.com`, password: `pw-${suffix}-Secret-123` };
  const job = await client.post<{ id: string }>(`/v1/products/${product.id}/jobs`, {
    kind: 'studio.e2e.create_user',
    payload: { ...account, name: `Recover ${suffix}` },
  });
  await expect
    .poll(
      async () =>
        (await client.get<{ status: string }>(`/v1/products/${product.id}/jobs/${job.id}`)).status,
      { timeout: 60_000, message: 'fixture job studio.e2e.create_user did not succeed' },
    )
    .toBe('succeeded');
  await client.post(`/v1/products/${product.id}/tenants/${tenant.id}/members`, {
    email: account.email,
    role: 'viewer',
  });
  return { productId: product.id, ...account };
}

/** The path and query of the newest `path` link in `account`'s mailbox (read by the admin). */
async function linkFromMailbox(admin: Page, account: Account, path: string): Promise<string> {
  const client = await apiClient(admin);
  let link = '';
  await expect
    .poll(
      async () => {
        const box = await client.get<{ items: { text: string }[] }>(
          `/v1/products/${account.productId}/notify/mailbox?recipient=${encodeURIComponent(account.email)}`,
        );
        const pattern = new RegExp(`https?://[^\\s]+${path}\\?token=[A-Za-z0-9_%-]+`);
        const found = box.items.map((item) => pattern.exec(item.text)?.[0]).find(Boolean);
        link = found ?? '';
        return Boolean(found);
      },
      { timeout: 30_000, message: `no ${path} link in the mailbox` },
    )
    .toBe(true);
  const url = new URL(link);
  return `${url.pathname}${url.search}`;
}

async function freshPage(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({ baseURL, locale: 'en-US' });
  return { context, page: await context.newPage() };
}

async function signInAs(page: Page, account: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(account.email);
  await page.getByLabel(/^password/i).fill(account.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test('verify the address, then reset the forgotten password', async ({
  page,
  browser,
  baseURL,
}, info) => {
  test.setTimeout(120_000);
  const account = await createAccount(page, info.project.name);

  // 1. Signed in, the account asks for a verification email from its profile.
  const user = await freshPage(browser, baseURL);
  await signInAs(user.page, account);
  await user.page.goto('/profile');
  await expect(user.page.getByText('Not verified')).toBeVisible();
  await user.page.getByRole('button', { name: 'Send verification email' }).click();
  await expect(user.page.getByText('Verification email sent').first()).toBeVisible();

  // 2. The link works in another browser, without a session, and only on a click.
  const verifyPath = await linkFromMailbox(page, account, '/verify-email');
  const other = await freshPage(browser, baseURL);
  await other.page.goto(verifyPath);
  await expect(other.page).toHaveURL(/\/verify-email$/); // the token left the address bar
  await expectAccessibleInBothThemes(other.page);
  await other.page.getByRole('button', { name: 'Confirm email address' }).click();
  await expect(other.page.getByText('Email address confirmed')).toBeVisible();
  await user.page.reload();
  await expect(user.page.getByText('Verified', { exact: true })).toBeVisible();

  // 3. Signed out: "Forgot your password?" sends a reset link.
  await other.page.goto('/login');
  await other.page.getByLabel(/email/i).fill(account.email);
  await other.page.getByRole('link', { name: 'Forgot your password?' }).click();
  await expect(other.page.getByLabel(/email/i)).toHaveValue(account.email);
  await expectNoHorizontalScroll(other.page);
  await other.page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(other.page.getByText('Check your inbox')).toBeVisible();

  // 4. The reset page sets the new password and ends every session (also the first browser's).
  const resetPath = await linkFromMailbox(page, account, '/reset-password');
  await other.page.goto(resetPath);
  await expect(other.page).toHaveURL(/\/reset-password$/);
  await expectAccessibleInBothThemes(other.page);
  const next = `${account.password}-new`;
  await other.page.getByLabel(/^new password/i).fill(next);
  await other.page.getByLabel(/^repeat password/i).fill(next);
  await other.page.getByRole('button', { name: 'Save new password' }).click();
  await expect(other.page).toHaveURL(/\/login/);
  const ended = await user.page.request.get('/v1/auth/session');
  expect(ended.status()).toBe(401);
  await signInAs(other.page, { email: account.email, password: next });

  // 5. The link was used up.
  await other.page.goto(resetPath);
  await other.page.getByLabel(/^new password/i).fill(`${next}-again`);
  await other.page.getByLabel(/^repeat password/i).fill(`${next}-again`);
  await other.page.getByRole('button', { name: 'Save new password' }).click();
  await expect(other.page.getByText('This link cannot be used')).toBeVisible();

  await user.context.close();
  await other.context.close();
});
