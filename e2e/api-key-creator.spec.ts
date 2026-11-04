import { expect, test, type APIRequestContext } from '@playwright/test';
import { e2e, SKIP_NO_ADMIN, SKIP_NO_API, signIn, signInApi, specProduct } from './support';

/**
 * Axentra AX3-01 against a real backend: an API key acts only within its creator's current
 * permissions. A product owner (not a platform admin) creates a key in Studio, which tells them
 * that the key depends on them; once they are removed from the product the key is refused with
 * `403 api_key_creator_lost_access` naming the permission (the code Studio translates, see
 * src/lib/errors.test.ts), while the key list still shows it as Active.
 *
 * Multi-product mode only: it removes the operator from its own product, which in single mode
 * would be the product every spec shares.
 */
test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);
test.skip(
  !e2e.operatorEmail || !e2e.userPassword,
  'Set AXENTRA_E2E_OPERATOR_EMAIL and AXENTRA_E2E_USER_PASSWORD (scripts/e2e-backend.sh does).',
);
test.skip(process.env.AXENTRA_E2E_MODE === 'single', 'removes a product owner from the product');
test.describe.configure({ timeout: 120_000 });

async function csrfHeaders(request: APIRequestContext) {
  const session = await request.get('/v1/auth/session');
  const { csrf_token: csrf } = (await session.json()) as { csrf_token: string };
  return { 'X-Axentra-CSRF': csrf };
}

test('a key stops working when its creator leaves the product', async ({ page, request }) => {
  // As the platform admin: a product the operator owns.
  await signInApi(request);
  const headers = await csrfHeaders(request);
  const suffix = `${test.info().project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9]/g, '');
  const { id: productId } = await specProduct(request, {
    name: `Key creator e2e ${suffix}`,
    slug: `kc-${suffix}`.slice(0, 60),
  });
  const added = await request.post(`/v1/products/${productId}/members`, {
    headers,
    data: { email: e2e.operatorEmail, role: 'product_owner' },
  });
  expect(added.status(), await added.text()).toBe(201);
  const { user_id: operatorId } = (await added.json()) as { user_id: string };

  // As the operator, in Studio: the page explains the dependency; create a key.
  await signIn(page, { email: e2e.operatorEmail, password: e2e.userPassword });
  await page.goto(`/p/${productId}/api-keys`);
  await expect(
    page.getByText(
      /A key works only as long as the person who created it still holds the permissions it uses\./,
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New API key' }).click();
  const dialog = page.getByRole('dialog', { name: 'New API key' });
  await dialog.getByRole('textbox', { name: /^Name/ }).fill(`creator-${suffix}`);
  await dialog.getByRole('checkbox', { name: /^tenants:read/ }).click();
  await dialog.getByRole('button', { name: 'Create key' }).click();
  const reveal = page.getByRole('dialog', { name: /Secret for/ });
  const secret = await reveal.getByLabel('API key secret').inputValue();
  expect(secret).toMatch(/^axk_/);
  await reveal.getByRole('checkbox', { name: 'I have stored the secret securely' }).click();
  await reveal.getByRole('button', { name: 'Done' }).click();

  const withKey = { Authorization: `Bearer ${secret}` };
  const before = await request.get(`/v1/products/${productId}/tenants`, { headers: withKey });
  expect(before.status(), await before.text()).toBe(200);

  // The admin removes the operator; the key is not revoked, but refused.
  const removed = await request.delete(`/v1/products/${productId}/members/${operatorId}`, {
    headers,
  });
  expect(removed.ok(), await removed.text()).toBe(true);
  const after = await request.get(`/v1/products/${productId}/tenants`, { headers: withKey });
  expect(after.status()).toBe(403);
  const problem = (await after.json()) as { code: string; permission?: string };
  expect(problem.code).toBe('api_key_creator_lost_access');
  expect(problem.permission).toBe('tenants:read');

  // The admin's key list still shows the key as active (no effective-state field yet).
  const keys = await request.get(`/v1/products/${productId}/api-keys`);
  const listed = ((await keys.json()) as { name: string; status: string }[]).find(
    (key) => key.name === `creator-${suffix}`,
  );
  expect(listed?.status).toBe('active');
});
