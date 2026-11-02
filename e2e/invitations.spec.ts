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
 * Accepting an invitation from the link Axentra generates, against a real backend.
 *
 * The link is taken from `accept_url` of `POST .../invitations`. scripts/e2e-backend.sh sets
 * `notify.invitation_accept_url` to the Studio preview origin's `/accept-invitation` (the path of
 * Axentra's default link, which Studio serves as an alias of `/invitations/accept`). With an
 * older backend the link points to `<public_url>/accept-invitation` (the API origin); its path
 * and query are then opened on Studio, which is what a deployment serving Studio on the API
 * origin gets.
 *
 * The invited person is a fresh password account, created by the `studio.e2e.create_user` job
 * of e2e/fixtures/axentra_e2e_jobs.py (Axentra has no public API for that), so the worker must
 * run (`scripts/e2e-backend.sh up --worker`).
 */
const worker = process.env.AXENTRA_E2E_WORKER === '1';

test.skip(!api, 'AXENTRA_E2E_API is not set: start an Axentra API to run the invitation tests.');
test.skip(
  !email || !password,
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing platform admin to run the invitation tests.',
);
test.skip(!worker, 'The invited account is created by a fixture job: run the worker.');

interface Fixture {
  productId: string;
  productName: string;
  tenantId: string;
  tenantName: string;
  invitee: { email: string; password: string };
}

interface NewInvitation {
  token: string;
  accept_url: string | null;
  invitation: { id: string };
}

async function createFixture(page: Page, project: string): Promise<Fixture> {
  const suffix = `${Date.now().toString(36)}${project.slice(0, 3)}`;
  await login(page);
  const client = await apiClient(page);
  const productName = `Invite E2E ${suffix}`;
  const product = await specProduct(page.request, {
    name: productName,
    slug: `invite-e2e-${suffix}`,
  });
  const tenantName = `Invited tenant ${suffix}`;
  const tenant = await client.post<{ id: string }>(`/v1/products/${product.id}/tenants`, {
    name: tenantName,
    slug: `invited-${suffix}`,
  });
  const invitee = {
    email: `invitee-${suffix}@example.com`,
    password: `pw-${suffix}-Secret-123`,
  };
  const job = await client.post<{ id: string }>(`/v1/products/${product.id}/jobs`, {
    kind: 'studio.e2e.create_user',
    payload: { ...invitee, name: `Invitee ${suffix}` },
  });
  await expect
    .poll(
      async () =>
        (await client.get<{ status: string }>(`/v1/products/${product.id}/jobs/${job.id}`)).status,
      { timeout: 60_000, message: 'fixture job studio.e2e.create_user did not succeed' },
    )
    .toBe('succeeded');
  // In single-product mode the product is shared and keeps its server name.
  const named = await client.get<{ name: string }>(`/v1/products/${product.id}`);
  return {
    productId: product.id,
    productName: named.name,
    tenantId: tenant.id,
    tenantName,
    invitee,
  };
}

async function invite(page: Page, fixture: Fixture, to = fixture.invitee.email) {
  const client = await apiClient(page);
  return client.post<NewInvitation>(
    `/v1/products/${fixture.productId}/tenants/${fixture.tenantId}/invitations`,
    { email: to, role: 'viewer' },
  );
}

/** The link as Studio receives it: on Studio's origin (see the file comment). */
function studioLink(created: NewInvitation, baseURL: string): string {
  expect(created.accept_url, 'the notify module builds accept_url').toBeTruthy();
  const link = new URL(created.accept_url ?? '');
  const studio = new URL(baseURL);
  if (link.origin !== studio.origin) {
    expect(link.pathname, 'default link path').toBe('/accept-invitation');
  }
  expect(link.searchParams.get('token')).toBe(created.token);
  return `${link.pathname}${link.search}`;
}

async function signedOutPage(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({ baseURL, locale: 'en-US' });
  return { context, page: await context.newPage() };
}

async function signInOnLoginPage(page: Page, user: { email: string; password: string }) {
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
}

async function tenantIdsOf(page: Page): Promise<string[]> {
  const me = await (
    await apiClient(page)
  ).get<{
    products: { tenants: { tenant: { id: string } }[] }[];
  }>('/v1/me');
  return me.products.flatMap((product) => product.tenants.map((entry) => entry.tenant.id));
}

test('the emailed link survives sign-in, leaves the address bar and joins the tenant', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(180_000);
  const fixture = await createFixture(page, testInfo.project.name);
  const created = await invite(page, fixture);
  const link = studioLink(created, baseURL ?? '');

  const invitee = await signedOutPage(browser, baseURL);
  await invitee.page.goto(link);
  // Signed out: the sign-in page explains why and keeps the token in return_to.
  await expect(invitee.page).toHaveURL(/\/login\?return_to=/);
  const returnTo = new URL(invitee.page.url()).searchParams.get('return_to') ?? '';
  expect(returnTo).toBe(`/invitations/accept?token=${encodeURIComponent(created.token)}`);
  await expect(
    invitee.page.getByRole('status').filter({ hasText: 'Sign in to accept your invitation' }),
  ).toBeVisible();
  await expectNoHorizontalScroll(invitee.page);
  await signInOnLoginPage(invitee.page, fixture.invitee);

  // Back on the accept page; the token is gone from the address bar but filled in.
  await expect(invitee.page).toHaveURL(/\/invitations\/accept$/);
  expect(invitee.page.url()).not.toContain(created.token);
  await expect(invitee.page.getByLabel(/Invitation token/)).toHaveValue(created.token);
  await expect(invitee.page.getByTestId('accept-signed-in-as')).toContainText(
    fixture.invitee.email,
  );
  // Nothing happens before the person confirms.
  expect(await tenantIdsOf(invitee.page)).not.toContain(fixture.tenantId);
  await expectAccessibleInBothThemes(invitee.page);

  await invitee.page.getByRole('button', { name: 'Accept invitation' }).click();
  await expect(invitee.page.getByRole('heading', { name: 'Invitation accepted' })).toBeVisible();
  await expect(
    invitee.page.getByText(
      `You are now a member of ${fixture.tenantName} in ${fixture.productName} with the role viewer.`,
    ),
  ).toBeVisible();
  await expectNoHorizontalScroll(invitee.page);
  await expectAccessibleInBothThemes(invitee.page);

  // The membership exists, seen by the invitee and by the administrator.
  expect(await tenantIdsOf(invitee.page)).toContain(fixture.tenantId);
  const members = await (
    await apiClient(page)
  ).get<{ email: string | null; role: string }[]>(
    `/v1/products/${fixture.productId}/tenants/${fixture.tenantId}/members`,
  );
  expect(members).toContainEqual(
    expect.objectContaining({ email: fixture.invitee.email, role: 'viewer' }),
  );
  await invitee.page.getByRole('link', { name: 'Open the tenant' }).click();
  await expect(invitee.page).toHaveURL(
    new RegExp(`/p/${fixture.productId}/tenants/${fixture.tenantId}$`),
  );
  await expect(invitee.page.getByRole('heading', { name: fixture.tenantName })).toBeVisible();

  // The same link again: one explanation for used, expired, revoked and unknown.
  await invitee.page.goto(link);
  await expect(invitee.page).toHaveURL(/\/invitations\/accept$/);
  await invitee.page.getByRole('button', { name: 'Accept invitation' }).click();
  const used = invitee.page
    .getByRole('alert')
    .filter({ hasText: 'This invitation cannot be used' });
  await expect(used).toContainText('Ask the person who invited you for a new invitation.');
  await invitee.context.close();
});

test('unknown tokens and invitations for another address are explained', async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  test.setTimeout(180_000);
  const fixture = await createFixture(page, testInfo.project.name);

  // The administrator opens an invitation sent to someone else: 403, offer to switch accounts.
  const created = await invite(page, fixture);
  await page.goto(`/invitations/accept?token=${encodeURIComponent(created.token)}`);
  await expect(page).toHaveURL(/\/invitations\/accept$/);
  await page.getByRole('button', { name: 'Accept invitation' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Invitation for another email address' }),
  ).toContainText(email ?? '');
  await expectAccessibleInBothThemes(page);
  // Switching accounts signs out and comes back to the accept page with the token.
  await page.getByRole('button', { name: 'Sign out and use the invited address' }).click();
  await expect(page).toHaveURL(/\/login\?return_to=/);
  await signInOnLoginPage(page, fixture.invitee);
  await expect(page).toHaveURL(/\/invitations\/accept$/);
  await expect(page.getByLabel(/Invitation token/)).toHaveValue(created.token);
  await page.getByRole('button', { name: 'Accept invitation' }).click();
  await expect(page.getByRole('heading', { name: 'Invitation accepted' })).toBeVisible();

  // A made-up token.
  const other = await signedOutPage(browser, baseURL);
  await other.page.goto('/accept-invitation?token=axinv_not_a_real_token');
  await signInOnLoginPage(other.page, fixture.invitee);
  await expect(other.page).toHaveURL(/\/invitations\/accept$/);
  await other.page.getByRole('button', { name: 'Accept invitation' }).click();
  const invalid = other.page
    .getByRole('alert')
    .filter({ hasText: 'This invitation cannot be used' });
  await expect(invalid).toContainText('it has expired');
  await expect(invalid).toContainText('it was revoked');
  await expectNoHorizontalScroll(other.page);
  await expectAccessibleInBothThemes(other.page);
  await other.context.close();
});
