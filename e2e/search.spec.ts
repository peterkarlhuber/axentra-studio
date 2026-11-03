import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  e2e,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  serverMode,
  signIn,
  SKIP_NO_ADMIN,
  SKIP_NO_API,
  specProduct,
  trackConsoleErrors,
} from './support';

/**
 * Full-text search (module `search`) against a real backend: the spec indexes documents through
 * the API as the platform admin (Studio itself never indexes), then searches them in Studio with a
 * phrase, an exclusion and a kind filter, checks that matches are highlighted and markup in
 * indexed text stays text, opens a document and removes it from the index.
 */
test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);
test.describe.configure({ timeout: 120_000 });

async function csrfHeaders(request: APIRequestContext) {
  const session = await request.get('/v1/auth/session');
  const { csrf_token: csrf } = (await session.json()) as { csrf_token: string };
  return { 'X-Axentra-CSRF': csrf };
}

test('search a tenant, filter by kind, open a document and remove it from the index', async ({
  page,
}) => {
  const meta = (await (await page.request.get('/v1/meta')).json()) as { modules: string[] };
  test.skip(
    !meta.modules.includes('search'),
    'The backend runs without the module `search` (scripts/e2e-backend.sh enables it).',
  );
  await serverMode(page.request);
  await signIn(page);
  // Reading the removed document afterwards answers 404 (the browser logs it).
  const console = trackConsoleErrors(page, [/status of 404/]);
  const suffix = `${test.info().project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9]/g, '');
  const { id: productId } = await specProduct(page.request, {
    name: `Search e2e ${suffix}`,
    slug: `se-${suffix}`.slice(0, 60),
  });
  const headers = await csrfHeaders(page.request);
  const created = await page.request.post(`/v1/products/${productId}/tenants`, {
    headers,
    data: { slug: `s-${suffix}`.slice(0, 60), name: `Search ${suffix}` },
  });
  expect(created.status(), await created.text()).toBe(201);
  const tenant = (await created.json()) as { id: string; name: string };
  const base = `/v1/products/${productId}/tenants/${tenant.id}/search/documents`;
  const docs = [
    {
      kind: 'invoice',
      ref: 'inv-1',
      title: 'Invoice 1 for Acme',
      body: 'Late payment reminder <b>now</b> for Acme Corp. Smith & Sons.',
    },
    { kind: 'invoice', ref: 'inv-2', title: 'Invoice 2 for Acme', body: 'Draft, not sent yet.' },
    { kind: 'note', ref: 'note-1', title: 'Call notes', body: 'Acme asked about late payment.' },
  ];
  for (const doc of docs) {
    const put = await page.request.put(`${base}/${doc.kind}/${doc.ref}`, {
      headers,
      data: { title: doc.title, body: doc.body, metadata: { source: 'e2e' } },
    });
    expect(put.status(), await put.text()).toBe(201);
  }

  // ---- Entry point: the sidebar (drawer on phones) leads to the page ----
  await page.goto(`/p/${productId}/dashboard`);
  if (test.info().project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open navigation' }).click();
  }
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', {
      name: 'Search',
    })
    .click();
  await expect(page.getByRole('heading', { name: 'Search', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Choose a tenant' })).toBeVisible();

  await page.getByLabel(/^Tenant/).selectOption(tenant.id);
  await expect(page.getByRole('heading', { name: 'Enter a search' })).toBeVisible();
  await expectNoA11yViolations(page);

  // ---- An empty search is refused at the field ----
  const searchBox = page.getByRole('searchbox', { name: 'Search for' });
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('Enter at least one word.')).toBeVisible();
  await expectNoA11yViolations(page);

  // ---- Phrase and exclusion: the draft invoice is left out ----
  await searchBox.fill('acme -draft');
  await searchBox.press('Enter');
  const results = page.getByRole('region', { name: /Results for acme -draft/ });
  const first = page.getByRole('button', { name: 'Invoice 1 for Acme' });
  await expect(first).toBeVisible();
  await expect(first.locator('mark')).toHaveText('Acme');
  await expect(page.getByRole('button', { name: 'Call notes' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invoice 2 for Acme' })).toHaveCount(0);
  // Escaped characters come back as text; markup in indexed text never becomes elements.
  await expect(results.getByText(/Smith & Sons/)).toBeVisible();
  await expect(results.locator('b, script')).toHaveCount(0);
  await expect(page.getByText('2 results')).toBeVisible();
  expect(page.url()).toContain('q=acme+-draft');
  await expectNoA11yViolations(page);
  await expectNoHorizontalScroll(page);

  // ---- Kind filter ----
  await page.getByLabel(/^Kinds/).fill('note');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Call notes' })).toBeVisible();
  await expect(first).toHaveCount(0);
  await expect(page.getByText('1 result', { exact: true })).toBeVisible();

  // ---- No matches explains what to try ----
  await page.getByLabel(/^Kinds/).fill('');
  await searchBox.fill('zebra');
  await searchBox.press('Enter');
  await expect(page.getByRole('heading', { name: 'No matches' })).toBeVisible();

  // ---- Reload keeps the search (it is in the address) ----
  await searchBox.fill('"late payment"');
  await searchBox.press('Enter');
  await expect(first).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Invoice 1 for Acme' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search for' })).toHaveValue('"late payment"');

  // ---- Open a document and remove it from the index ----
  await page.getByRole('button', { name: 'Invoice 1 for Acme' }).click();
  const drawer = page.getByRole('dialog', { name: 'Invoice 1 for Acme' });
  await expect(drawer.getByText(/Late payment reminder/)).toBeVisible();
  await expect(drawer.getByText('inv-1', { exact: true })).toBeVisible();
  await expectNoA11yViolations(page);
  await drawer.getByRole('button', { name: 'Remove from index' }).click();
  const confirm = page.getByRole('dialog', { name: 'Remove from the search index?' });
  await expect(confirm).toBeVisible();
  await expectNoA11yViolations(page);
  await confirm.getByRole('button', { name: 'Remove from index' }).click();
  await expect(
    page.getByText('inv-1 removed from the search index', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invoice 1 for Acme' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Call notes' })).toBeVisible();
  const gone = await page.request.get(`${base}/invoice/inv-1`);
  expect(gone.status()).toBe(404);
  console.assertNone();
});
