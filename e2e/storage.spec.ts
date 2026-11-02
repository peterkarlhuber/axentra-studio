import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settleAnimations, specProduct } from './support';

/**
 * Data & Storage against a real Axentra API: upload, list, download and delete a file, a
 * refused file type, record create/edit/delete, and axe on every page in both themes. The
 * `mobile` project runs the same flow at 360 px.
 */
const api = process.env.AXENTRA_E2E_API;
const email = process.env.AXENTRA_E2E_EMAIL;
const password = process.env.AXENTRA_E2E_PASSWORD;

test.skip(
  !api,
  'AXENTRA_E2E_API is not set: start an Axentra API and set AXENTRA_E2E_API=http://127.0.0.1:8080 to run the storage tests.',
);
test.skip(
  !email || !password,
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing platform admin to run the storage tests.',
);

// axe runs in both themes on several screens; that takes longer than the default 30 s.
test.describe.configure({ timeout: 120_000 });

async function expectNoA11yViolations(page: Page) {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    await settleAnimations(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map(
        (violation) =>
          `${colorScheme} ${violation.id}: ${violation.help} (${violation.nodes
            .map((node) => node.target.join(' '))
            .join(', ')})`,
      ),
    ).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: 'light' });
}

async function expectNoHorizontalScroll(page: Page) {
  // A string expression: the e2e tsconfig has no DOM types.
  const overflow = await page.evaluate<number>(
    'document.documentElement.scrollWidth - document.documentElement.clientWidth',
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Toasts render their text twice (visible and in a live region); match the visible one. */
const toast = (page: Page, text: string | RegExp) => page.getByText(text).first();

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email ?? '');
  await page.getByLabel(/password/i).fill(password ?? '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/**
 * A fresh tenant per test run (files and records are tenant-scoped), in a fresh product in
 * multi-product mode or in the server's one product in single-product mode (see specProduct).
 */
async function createProductAndTenant(page: Page, label: string) {
  const session = await page.request.get('/v1/auth/session');
  const { csrf_token: csrf } = (await session.json()) as { csrf_token: string };
  const headers = { 'X-Axentra-CSRF': csrf };
  const suffix = `${label}-${Date.now().toString(36)}`;
  const { id: productId } = await specProduct(page.request, {
    name: `Storage e2e ${suffix}`,
    slug: `st-${suffix}`,
  });
  const tenantName = `Tenant ${suffix}`;
  const tenant = await page.request.post(`/v1/products/${productId}/tenants`, {
    headers,
    data: { name: tenantName, slug: `t-${suffix}` },
  });
  expect(tenant.status()).toBe(201);
  const { id: tenantId } = (await tenant.json()) as { id: string };
  return { productId, tenantId, tenantName };
}

test('files: upload, list, download, refuse a blocked type and delete', async ({
  page,
}, testInfo) => {
  await login(page);
  const { productId, tenantId } = await createProductAndTenant(page, testInfo.project.name);

  await page.goto(`/p/${productId}/files?tenant=${tenantId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Files' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No files match' })).toBeVisible();
  await expect(page.getByText('0 B used')).toBeVisible();
  await expectNoA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // Upload a small text file with a label.
  await page.getByRole('button', { name: 'Upload file' }).click();
  const dialog = page.getByRole('dialog', { name: 'Upload file' });
  await expect(dialog.getByText(/At most 1 MiB per file/)).toBeVisible();
  await dialog.getByLabel(/^File/).setInputFiles({
    name: 'hello-e2e.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello from the storage e2e test\n'),
  });
  await dialog.getByLabel('Labels (metadata)').fill('{"kind": "e2e"}');
  await expectNoA11yViolations(page);
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(toast(page, 'hello-e2e.txt uploaded')).toBeVisible();
  await expect(dialog).toBeHidden();

  const table = page.getByRole('table', { name: 'Files of the selected tenant' });
  await expect(table.getByRole('button', { name: 'hello-e2e.txt', exact: true })).toBeVisible();
  await expect(page.getByText('1 of')).toHaveCount(0); // files quota is unlimited by default
  await expect(page.getByText('32 B used')).toBeVisible();

  // Label filter is applied by the server.
  await page.getByLabel('Label', { exact: true }).fill('kind');
  await page.getByLabel('Equals').fill('other');
  await page.getByRole('button', { name: 'Add label filter' }).click();
  await expect(page.getByRole('heading', { name: 'No files match' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove filter on kind' }).click();
  await expect(table.getByRole('button', { name: 'hello-e2e.txt', exact: true })).toBeVisible();

  // Download through the signed URL.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Actions for hello-e2e.txt' }).click();
  await page.getByRole('menuitem', { name: 'Download' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('hello-e2e.txt');
  expect(download.url()).toContain('/v1/files/download/');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  expect(Buffer.concat(chunks).toString('utf8')).toBe('hello from the storage e2e test\n');

  // Detail drawer with metadata.
  await table.getByRole('button', { name: 'hello-e2e.txt', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'hello-e2e.txt', exact: true });
  await expect(drawer.getByText('text/plain')).toBeVisible();
  await expect(drawer.getByText('"e2e"')).toBeVisible();
  await expectNoA11yViolations(page);
  await drawer.getByRole('button', { name: 'Close' }).click();

  // A blocked type is refused by the server with an explanation.
  await page.getByRole('button', { name: 'Upload file' }).click();
  await dialog.getByLabel(/^File/).setInputFiles({
    name: 'page.html',
    mimeType: 'text/html',
    buffer: Buffer.from('<!doctype html><script>alert(1)</script>'),
  });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  const alert = dialog.getByRole('alert');
  await expect(alert).toContainText('File type not accepted');
  await expect(alert).toContainText('Request ID');
  await expectNoA11yViolations(page);
  await dialog.getByRole('button', { name: 'Cancel' }).click();

  // Delete with confirmation.
  await page.getByRole('button', { name: 'Actions for hello-e2e.txt' }).click();
  await page.getByRole('menuitem', { name: 'Delete file' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete file?' });
  await expect(confirm).toContainText('hello-e2e.txt');
  await confirm.getByRole('button', { name: 'Delete file' }).click();
  await expect(toast(page, 'hello-e2e.txt deleted')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No files match' })).toBeVisible();
  await expect(page.getByText('0 B used')).toBeVisible();
});

test('records: create, edit and delete; data overview', async ({ page }, testInfo) => {
  await login(page);
  const { productId, tenantId, tenantName } = await createProductAndTenant(
    page,
    `r${testInfo.project.name}`,
  );

  await page.goto(`/p/${productId}/records?tenant=${tenantId}`);
  await page.getByRole('button', { name: 'New record' }).click();
  const create = page.getByRole('dialog', { name: 'New record' });
  await create.getByLabel(/Collection/).fill('e2e_notes');
  await create.getByLabel(/Data/).fill('{"text": "first"}');
  await expectNoA11yViolations(page);
  await create.getByRole('button', { name: 'Create record' }).click();
  await expect(toast(page, /Record rec_\w+ created/)).toBeVisible();
  const table = page.getByRole('table', { name: 'Records in e2e_notes' });
  await expect(table.getByText('{"text":"first"}')).toBeVisible();

  await table.getByRole('button', { name: /View record/ }).click();
  const drawer = page.getByRole('dialog', { name: 'Record' });
  await drawer.getByRole('button', { name: 'Edit' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit record' });
  await edit.getByLabel(/Data/).fill('{"text": "second"}');
  await edit.getByRole('button', { name: 'Save changes' }).click();
  await expect(toast(page, /Record rec_\w+ saved/)).toBeVisible();
  await expect(drawer.getByText('"second"')).toBeVisible();

  await drawer.getByRole('button', { name: 'Delete record' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete record?' });
  await confirm.getByRole('button', { name: 'Delete record' }).click();
  await expect(toast(page, /Record rec_\w+ deleted/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No records match' })).toBeVisible();
  await expectNoHorizontalScroll(page);

  // A second record keeps the collection visible in the overview.
  await page.getByRole('button', { name: 'New record' }).click();
  await create.getByLabel(/Data/).fill('{"text": "kept"}');
  await create.getByRole('button', { name: 'Create record' }).click();
  await expect(toast(page, /Record rec_\w+ created/)).toBeVisible();

  await page.goto(`/p/${productId}/data`);
  await expect(page.getByRole('heading', { level: 1, name: 'Data overview' })).toBeVisible();
  const collections = page.getByRole('table', { name: 'Record collections' });
  await expect(collections.getByRole('link', { name: 'e2e_notes' })).toBeVisible();
  const storage = page.getByRole('table', { name: 'Storage usage per tenant' });
  // By name: in single-product mode other specs' tenants share the product.
  await expect(storage.getByRole('link', { name: tenantName, exact: true })).toBeVisible();
  await expect(page.getByText('Maximum file size')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Backups are not reported' })).toBeVisible();
  await expectNoA11yViolations(page);
  await expectNoHorizontalScroll(page);
});
