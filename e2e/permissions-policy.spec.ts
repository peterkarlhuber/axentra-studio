import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  e2e,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  SKIP_NO_ADMIN,
  SKIP_NO_API,
  signIn,
  specProduct,
} from './support';

/**
 * Product-defined permissions and the per-product storage content-type policy against a real
 * backend:
 *
 * - a permission the product declares (here over the API) appears in the read-only Permissions
 *   page and, grouped and marked as a product permission, in the role and API key editors; a
 *   custom role can grant it;
 * - the product detail's Files tab edits the content-type policy, and the server applies it.
 *
 * Single-product mode works in the server's one product (shared with other specs): the policy is
 * changed only for unique made-up extensions and restored at the end.
 */
test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);
test.describe.configure({ timeout: 120_000 });

async function csrfHeaders(request: APIRequestContext) {
  const session = await request.get('/v1/auth/session');
  const { csrf_token: csrf } = (await session.json()) as { csrf_token: string };
  return { 'X-Axentra-CSRF': csrf };
}

test('product permissions: catalog page, role and key editors', async ({ page }) => {
  await signIn(page);
  const suffix = `${test.info().project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9]/g, '');
  const { id: productId } = await specProduct(page.request, {
    name: `Permissions e2e ${suffix}`,
    slug: `pe-${suffix}`.slice(0, 60),
  });
  const headers = await csrfHeaders(page.request);
  const permission = `e2e.r${suffix}:approve`;
  const declared = await page.request.put(
    `/v1/products/${productId}/permissions/${encodeURIComponent(permission)}`,
    {
      headers,
      data: { scope: 'tenant', description: 'Approve e2e reports', default_roles: ['member'] },
    },
  );
  expect(declared.status(), await declared.text()).toBe(200);

  // Read-only catalog.
  await page.goto(`/p/${productId}/permissions`);
  await expect(page.getByRole('heading', { name: 'Permissions', level: 1 })).toBeVisible();
  const own = page.getByRole('table', { name: 'Product permissions' });
  const row = own.getByRole('row', { name: new RegExp(permission.replace(/[.:]/g, '\\$&')) });
  await expect(row).toBeVisible();
  await expect(row.getByText('Approve e2e reports')).toBeVisible();
  if (test.info().project.name !== 'mobile') {
    // Columns hidden at phone width.
    await expect(row.getByText('member', { exact: true })).toBeVisible();
    await expect(row.getByText('API', { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('table', { name: 'Built-in permissions' })).toContainText(
    'records:read',
  );
  await expectNoHorizontalScroll(page);
  await expectNoA11yViolations(page);

  // Role editor: the product permission is offered in its own, marked group.
  await page.goto(`/p/${productId}/roles`);
  await page.getByRole('button', { name: 'New custom role' }).click();
  const dialog = page.getByRole('dialog', { name: 'New custom role' });
  const key = `approver_${suffix}`.slice(0, 40);
  await dialog.getByRole('textbox', { name: 'Name (required)' }).fill(`Approver ${suffix}`);
  await dialog.getByRole('textbox', { name: 'Key (required)' }).fill(key);
  // The product's group is marked as such ("<resource> Product").
  await expect(dialog.getByRole('checkbox', { name: `e2e.r${suffix} Product` })).toBeVisible();
  await dialog
    .getByRole('checkbox', { name: new RegExp(permission.replace(/[.:]/g, '\\$&')) })
    .click();
  await expectNoA11yViolations(page);
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).toBeHidden();
  const roles = (await (await page.request.get(`/v1/products/${productId}/roles`)).json()) as {
    key: string;
    permissions: string[];
  }[];
  expect(roles.find((role) => role.key === key)?.permissions).toEqual([permission]);
  // The built-in member role holds it through default_roles.
  expect(roles.find((role) => role.key === 'member')?.permissions).toContain(permission);

  // API key editor offers it as well.
  await page.goto(`/p/${productId}/api-keys`);
  await page.getByRole('button', { name: 'New API key' }).click();
  const keyDialog = page.getByRole('dialog', { name: 'New API key' });
  await expect(
    keyDialog.getByRole('checkbox', { name: new RegExp(permission.replace(/[.:]/g, '\\$&')) }),
  ).toBeVisible();
  await keyDialog.getByRole('button', { name: 'Cancel' }).click();
});

test('storage content-type policy: edit in the product detail and enforced on upload', async ({
  page,
}) => {
  await signIn(page);
  const suffix = `${test.info().project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9]/g, '');
  const { id: productId, shared } = await specProduct(page.request, {
    name: `Policy e2e ${suffix}`,
    slug: `po-${suffix}`.slice(0, 60),
  });
  const headers = await csrfHeaders(page.request);
  const blockedExt = `x${suffix}`.slice(0, 16);
  try {
    await page.goto(`/products/${productId}`);
    await page.getByRole('tab', { name: 'Files' }).click();
    const form = page.getByRole('form', { name: 'File content-type policy' });
    await expect(form.getByRole('combobox', { name: 'Blocked file types' })).toHaveValue('inherit');
    if (!shared) {
      await form.getByRole('combobox', { name: 'Blocked file types' }).selectOption('store_inert');
    }
    await form.getByRole('textbox', { name: 'Additionally blocked extensions' }).fill(blockedExt);
    await expectNoA11yViolations(page);
    await form.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Content-type policy saved').first()).toBeVisible();

    const policy = (await (
      await page.request.get(`/v1/products/${productId}/storage/policy`)
    ).json()) as { blocked_types: string; blocked_extensions: string[] };
    expect(policy.blocked_extensions).toEqual([blockedExt]);
    expect(policy.blocked_types).toBe(shared ? 'refuse' : 'store_inert');

    // The server applies the policy to this product's uploads.
    const tenant = await page.request.post(`/v1/products/${productId}/tenants`, {
      headers,
      data: { slug: `t-${suffix}`.slice(0, 60), name: `Tenant ${suffix}` },
    });
    expect(tenant.status(), await tenant.text()).toBe(201);
    const tenantId = ((await tenant.json()) as { id: string }).id;
    const files = `/v1/products/${productId}/tenants/${tenantId}/files`;
    const upload = (name: string, mimeType: string, body: string) =>
      page.request.post(files, {
        headers,
        multipart: { file: { name, mimeType, buffer: Buffer.from(body) } },
      });
    const extra = await upload(`data.${blockedExt}`, 'text/plain', 'hello');
    if (shared) {
      expect(extra.status()).toBe(415);
    } else {
      expect(extra.status(), await extra.text()).toBe(201);
      const html = await upload('page.html', 'text/html', '<!doctype html><script>1</script>');
      expect(html.status(), await html.text()).toBe(201);
      const info = (await html.json()) as {
        id: string;
        stored_inert: boolean;
        content_type: string;
        original_content_type: string;
      };
      expect(info).toMatchObject({
        stored_inert: true,
        content_type: 'application/octet-stream',
        original_content_type: 'text/html',
      });
      const download = await page.request.get(`${files}/${info.id}/content`);
      expect(download.headers()['content-type']).toBe('application/octet-stream');
      expect(download.headers()['content-disposition']).toMatch(/^attachment/);

      // The file drawer shows that the file was stored inert.
      await page.goto(`/p/${productId}/files?tenant=${tenantId}&file=${info.id}`);
      const drawer = page.getByRole('dialog', { name: 'page.html' });
      await expect(drawer.getByText('Yes, uploaded as text/html')).toBeVisible();
      await expectNoA11yViolations(page);
    }
  } finally {
    if (shared) {
      await page.request.put(`/v1/products/${productId}/storage/policy`, { headers, data: {} });
    }
  }
});
