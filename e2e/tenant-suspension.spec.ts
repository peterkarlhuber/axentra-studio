import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  e2e,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  signIn,
  signInApi,
  SKIP_NO_ADMIN,
  SKIP_NO_API,
  specProduct,
  trackConsoleErrors,
} from './support';

/**
 * Suspending and reactivating a tenant as a product owner who is NOT a platform admin, against a
 * real backend: the owner opens the suspended tenant (its record is product administration
 * metadata), sees the banner and reactivates it after a confirmation; its data stays closed
 * meanwhile (Studio shows one explanation instead of failing requests). A member of the tenant is
 * refused and is offered no reactivation.
 *
 * The users come from scripts/e2e-backend.sh (AXENTRA_E2E_OPERATOR_EMAIL, _MEMBER_EMAIL,
 * _USER_PASSWORD); this spec gives them their roles through the API as the platform admin.
 */
test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);
test.skip(
  !e2e.operatorEmail || !e2e.memberEmail || !e2e.userPassword,
  'Set AXENTRA_E2E_OPERATOR_EMAIL, AXENTRA_E2E_MEMBER_EMAIL and AXENTRA_E2E_USER_PASSWORD (scripts/e2e-backend.sh does).',
);
test.describe.configure({ timeout: 120_000 });

async function csrfHeaders(request: APIRequestContext) {
  const session = await request.get('/v1/auth/session');
  const { csrf_token: csrf } = (await session.json()) as { csrf_token: string };
  return { 'X-Axentra-CSRF': csrf };
}

/** As the platform admin (`request`): a product the operator owns, with a suspended tenant whose owner is the member. */
async function suspendedTenantFixture(request: APIRequestContext) {
  await signInApi(request);
  const headers = await csrfHeaders(request);
  const suffix = `${test.info().project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9]/g, '');
  const { id: productId } = await specProduct(request, {
    name: `Suspension e2e ${suffix}`,
    slug: `su-${suffix}`.slice(0, 60),
  });
  const owner = await request.post(`/v1/products/${productId}/members`, {
    headers,
    data: { email: e2e.operatorEmail, role: 'product_owner' },
  });
  // Single-product mode shares the product: the operator may already own it.
  expect([200, 201, 409], await owner.text()).toContain(owner.status());
  const created = await request.post(`/v1/products/${productId}/tenants`, {
    headers,
    data: { slug: `t-${suffix}`.slice(0, 60), name: `Suspended ${suffix}` },
  });
  expect(created.status(), await created.text()).toBe(201);
  const tenant = (await created.json()) as { id: string; name: string };
  const member = await request.post(`/v1/products/${productId}/tenants/${tenant.id}/members`, {
    headers,
    data: { email: e2e.memberEmail, role: 'tenant_owner' },
  });
  expect(member.status(), await member.text()).toBe(201);
  const suspended = await request.patch(`/v1/products/${productId}/tenants/${tenant.id}`, {
    headers,
    data: { status: 'suspended' },
  });
  expect(suspended.status(), await suspended.text()).toBe(200);
  return { productId, tenant };
}

test('a product owner (not a platform admin) reactivates a suspended tenant', async ({
  page,
  request,
}) => {
  const { productId, tenant } = await suspendedTenantFixture(request);
  await signIn(page, { email: e2e.operatorEmail, password: e2e.userPassword });
  // Signed in from here: any failed request (e.g. a 403 for the tenant's data) is a console error.
  const console = trackConsoleErrors(page);
  const me = (await (await page.request.get('/v1/me')).json()) as { platform_role: string | null };
  expect(me.platform_role).toBeNull();

  await page.goto(`/p/${productId}/tenants/${tenant.id}`);
  await expect(page.getByRole('heading', { name: tenant.name, level: 1 })).toBeVisible();
  await expect(page.getByText('This tenant is suspended')).toBeVisible();
  await expect(page.getByText(/Reactivate the tenant to restore access\./)).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoA11yViolations(page);

  // The tenant's data stays closed: one explanation, no failing requests.
  await page.getByRole('tab', { name: 'Members' }).click();
  await expect(
    page.getByRole('heading', { name: 'Not available while the tenant is suspended' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Details' }).click();

  // Other screens with the tenant's data explain the suspension the same way and link back to
  // the tenant page, instead of "Not permitted" (and without a refused request).
  for (const path of [
    `/p/${productId}/subscriptions/${tenant.id}`,
    `/p/${productId}/invitations?tenant=${tenant.id}`,
    `/p/${productId}/usage?tab=tenant&tenant=${tenant.id}`,
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: 'Not available while the tenant is suspended' }),
    ).toBeVisible();
    await expect(page.getByText(/Reactivate the tenant on its page/)).toBeVisible();
    await expect(page.getByText('Not permitted')).toHaveCount(0);
  }
  await expectNoA11yViolations(page);
  await page.getByRole('link', { name: 'Open the tenant' }).click();
  await expect(page).toHaveURL(new RegExp(`/p/${productId}/tenants/${tenant.id}$`));
  await expect(page.getByRole('heading', { name: tenant.name, level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Reactivate tenant' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reactivate tenant?' });
  await expect(dialog.getByText(/regain access immediately/)).toBeVisible();
  await expectNoA11yViolations(page);
  await dialog.getByRole('button', { name: 'Reactivate tenant' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Tenant reactivated').first()).toBeVisible();
  await expect(page.getByText('This tenant is suspended')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Suspend tenant' })).toBeVisible();

  // The server agrees, and the tenant's data is open again.
  const after = await request.get(`/v1/products/${productId}/tenants/${tenant.id}`);
  expect(((await after.json()) as { status: string }).status).toBe('active');
  await page.getByRole('tab', { name: 'Members' }).click();
  await expect(page.getByRole('table', { name: 'Members' })).toBeVisible();
  await expect(
    page.getByRole('table', { name: 'Members' }).getByText(e2e.memberEmail ?? ''),
  ).toBeVisible();
  console.assertNone();
});

test('a member of the suspended tenant is refused and offered no reactivation', async ({
  page,
  request,
}) => {
  const { productId, tenant } = await suspendedTenantFixture(request);
  await signIn(page, { email: e2e.memberEmail, password: e2e.userPassword });
  const refused = await page.request.get(`/v1/products/${productId}/tenants/${tenant.id}`);
  expect(refused.status()).toBe(403);
  const patch = await page.request.patch(`/v1/products/${productId}/tenants/${tenant.id}`, {
    headers: await csrfHeaders(page.request),
    data: { status: 'active' },
  });
  expect([403, 404]).toContain(patch.status());

  await page.goto(`/p/${productId}/tenants/${tenant.id}`);
  await expect(page.getByText(/Not permitted|not found/i).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reactivate tenant' })).toHaveCount(0);
  await expect(page.getByText('This tenant is suspended')).toHaveCount(0);

  const still = await request.get(`/v1/products/${productId}/tenants/${tenant.id}`);
  expect(((await still.json()) as { status: string }).status).toBe('suspended');
});
