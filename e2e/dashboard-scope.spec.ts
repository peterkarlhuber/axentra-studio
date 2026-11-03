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
 * The product dashboard for a plain tenant member, against a real backend: since Axentra AX2-05
 * (PR #38) `GET .../overview` answers `scope: "tenant"` with the counts of the caller's own
 * tenants and `null` for the product-wide counters. Studio hides those counters (not 0) and says
 * that the figures cover the member's tenants only.
 */
test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);
test.skip(
  !e2e.memberEmail || !e2e.userPassword,
  'Set AXENTRA_E2E_MEMBER_EMAIL and AXENTRA_E2E_USER_PASSWORD (scripts/e2e-backend.sh does).',
);
test.describe.configure({ timeout: 120_000 });

async function csrfHeaders(request: APIRequestContext) {
  const session = await request.get('/v1/auth/session');
  const { csrf_token: csrf } = (await session.json()) as { csrf_token: string };
  return { 'X-Axentra-CSRF': csrf };
}

test('a tenant member sees only the counters of their own tenants, with a note', async ({
  page,
  request,
}) => {
  await signInApi(request);
  const headers = await csrfHeaders(request);
  const suffix = `${test.info().project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9]/g, '');
  const { id: productId } = await specProduct(request, {
    name: `Scope e2e ${suffix}`,
    slug: `sc-${suffix}`.slice(0, 60),
  });
  const created = await request.post(`/v1/products/${productId}/tenants`, {
    headers,
    data: { slug: `m-${suffix}`.slice(0, 60), name: `Member tenant ${suffix}` },
  });
  expect(created.status(), await created.text()).toBe(201);
  const tenant = (await created.json()) as { id: string };
  const member = await request.post(`/v1/products/${productId}/tenants/${tenant.id}/members`, {
    headers,
    data: { email: e2e.memberEmail, role: 'member' },
  });
  expect([200, 201, 409], await member.text()).toContain(member.status());

  await signIn(page, { email: e2e.memberEmail, password: e2e.userPassword });
  const overview = (await (
    await page.request.get(`/v1/products/${productId}/overview`)
  ).json()) as {
    scope?: string;
    api_keys: number | null;
  };
  test.skip(overview.scope === undefined, 'The backend predates the overview scope (AX2-05).');
  expect(overview.scope).toBe('tenant');
  expect(overview.api_keys).toBeNull();

  const console = trackConsoleErrors(page, [/status of (403|404)/]);
  await page.goto(`/p/${productId}/dashboard`);
  const region = page.getByRole('region', { name: 'Overview' });
  await expect(region.getByText('Tenants', { exact: true })).toBeVisible();
  await expect(
    page.getByText('These figures cover only the tenants you belong to.', { exact: false }),
  ).toBeVisible();
  await expect(region.getByText('API keys', { exact: true })).toHaveCount(0);
  await expect(region.getByText(/Audit events/)).toHaveCount(0);
  await expect(region.getByText(/Denied requests/)).toHaveCount(0);
  await expectNoA11yViolations(page);
  await expectNoHorizontalScroll(page);
  console.assertNone();
});
