import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
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
 * Notifications against a real Axentra with `notify.provider = "local"`.
 *
 * - AXENTRA_E2E_API, AXENTRA_E2E_EMAIL, AXENTRA_E2E_PASSWORD: API and an existing platform admin.
 * - Delivery: with AXENTRA_E2E_WORKER=1 a `notify-dispatch --loop` is running
 *   (scripts/e2e-backend.sh --worker) and the test waits for it. Otherwise
 *   AXENTRA_E2E_NOTIFY_DISPATCH (optional) is a shell command that delivers queued
 *   notifications once, e.g. `axentra --config /path/axentra.toml notify-dispatch --once`.
 *   Without either the test stops after checking that the message is queued.
 * - Multi-product mode: a new product. Single-product mode: the server's one product, shared with
 *   the other specs and the other Playwright project, so the template key, its category and the
 *   sample name carry the per-run suffix (the mailbox and the preferences are product-wide).
 */
const dispatchLoop = process.env.AXENTRA_E2E_WORKER === '1';
const dispatch = process.env.AXENTRA_E2E_NOTIFY_DISPATCH;

test.skip(!api, 'AXENTRA_E2E_API is not set: start an Axentra API to run the notification tests.');
test.skip(
  !email || !password,
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing platform admin to run the notification tests.',
);

test('create a template, preview it, send it to a member and find it in the log and mailbox', async ({
  page,
}, testInfo) => {
  test.setTimeout(300_000);
  const suffix = `${Date.now().toString(36)}${testInfo.project.name.slice(0, 3)}`;
  await login(page);
  const client = await apiClient(page);
  const me = await client.get<{ user: { id: string; email: string } }>('/v1/me');
  const product = await specProduct(page.request, {
    name: `Notify E2E ${suffix}`,
    slug: `notify-e2e-${suffix}`,
  });
  const category = `onboarding_${suffix}`;
  const sample = `Ada ${suffix}`;
  const tenant = await client.post<{ id: string; name: string }>(
    `/v1/products/${product.id}/tenants`,
    { name: `Tenant ${suffix}`, slug: `tenant-${suffix}`, owner_user_id: me.user.id },
  );

  // ---- Templates list (built-in defaults are listed) ----
  await page.goto(`/p/${product.id}/notifications`);
  await expect(page.getByRole('heading', { level: 1, name: 'Notifications' })).toBeVisible();
  await expect(page.getByRole('link', { name: /invitation/i }).first()).toBeVisible();
  await expect(page.getByText('Delivery statistics')).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessibleInBothThemes(page);

  // ---- Create a template with a German variant ----
  await page.getByRole('link', { name: 'New template' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New template' })).toBeVisible();
  const key = `welcome.${suffix}`;
  await page.getByRole('textbox', { name: /^Template key/ }).fill(key);
  await page.getByLabel('Name', { exact: true }).fill(`Welcome ${suffix}`);
  await page.getByLabel('Category').fill(category);
  await page.getByRole('textbox', { name: /^Subject/ }).fill('Welcome {{ name }}');
  await page.getByRole('textbox', { name: /^Text/ }).fill('Hi {{ name }}, welcome aboard.');
  await page
    .getByLabel('HTML', { exact: true })
    .fill(
      '<p>Hello <strong>{{ name }}</strong></p><script>parent.document.title = "pwned"</script>',
    );
  // The preview reports the undeclared placeholder; declare it from the suggestion.
  await page.getByRole('button', { name: /Declare used placeholders: name/ }).click();
  await page.getByLabel('Sample value').fill(sample);

  const frame = page.frameLocator('iframe[title="HTML preview of the template"]');
  await expect(frame.getByText('Hello Ada')).toBeVisible();
  await expect(page.getByText('Welcome Ada')).toBeVisible();
  // Scripts never run in the sandboxed preview.
  expect(await page.title()).not.toContain('pwned');

  await page.getByLabel('Add language').fill('de');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('textbox', { name: /^Subject/ }).fill('Willkommen {{ name }}');
  await page.getByRole('textbox', { name: /^Text/ }).fill('Hallo {{ name }}!');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
  await expect(page.getByText('Willkommen Ada')).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessibleInBothThemes(page);

  await page.getByRole('button', { name: 'Create template' }).click();
  await expect(page).toHaveURL(new RegExp(`/notifications/templates/${key.replace('.', '\\.')}$`));
  await expect(page.getByText('Version 1', { exact: true })).toBeVisible();

  // ---- Edit -> version 2 (If-Match) ----
  await page.getByLabel('Description').fill('Sent after sign-up');
  await page.getByRole('button', { name: 'Save new version' }).click();
  await expect(page.getByText('Version 2', { exact: true })).toBeVisible();

  // ---- Reopen the saved template: the preview follows language and text changes ----
  await page.reload();
  await expect(page.getByText('Version 2', { exact: true })).toBeVisible();
  await expect(page.getByText('Welcome Ada')).toBeVisible();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
  await expect(page.getByText('Willkommen Ada')).toBeVisible();
  await page.getByRole('tab', { name: 'de', exact: true }).click();
  await page.getByRole('textbox', { name: /^Subject/ }).fill('Servus {{ name }}');
  await expect(page.getByText('Servus Ada')).toBeVisible();
  await page.getByRole('textbox', { name: /^Subject/ }).fill('Willkommen {{ name }}');
  await expect(page.getByText('Willkommen Ada')).toBeVisible();

  // ---- Send a test notification to a tenant member ----
  await page.getByRole('button', { name: 'Send test' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tenant').selectOption(tenant.id);
  await dialog.getByRole('combobox', { name: /^Member/ }).selectOption(me.user.id);
  await dialog.getByRole('button', { name: 'Preview' }).click();
  await expect(dialog.getByText('Welcome Ada')).toBeVisible();
  await dialog.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(dialog.getByText('Notification accepted', { exact: true })).toBeVisible();
  await expectAccessibleInBothThemes(page);
  await dialog.getByRole('button', { name: 'Close' }).first().click();

  // ---- Message log ----
  await page.goto(`/p/${product.id}/notifications?tab=messages`);
  const row = page.getByRole('row').filter({ hasText: key });
  await expect(row).toBeVisible();
  // A running dispatcher may already have delivered it.
  await expect(row.getByText(dispatchLoop ? /^(Queued|Sending|Sent)$/ : 'Queued')).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessibleInBothThemes(page);

  if (!dispatchLoop && !dispatch) {
    testInfo.annotations.push({
      type: 'skipped-part',
      description:
        'Neither AXENTRA_E2E_WORKER=1 nor AXENTRA_E2E_NOTIFY_DISPATCH set: delivery and mailbox not checked.',
    });
    return;
  }
  if (!dispatchLoop && dispatch) execSync(dispatch, { stdio: 'pipe', timeout: 60_000 });

  await expect(async () => {
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: key }).getByText('Sent')).toBeVisible({
      timeout: 2_000,
    });
  }).toPass({ timeout: 30_000 });
  await page
    .getByRole('row')
    .filter({ hasText: key })
    .getByRole('button', { name: /Show details/ })
    .click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText(me.user.email).first()).toBeVisible();
  await expect(drawer.getByText('No delivery error.')).toBeVisible();
  await expect(drawer.frameLocator('iframe').getByText('Hello Ada')).toBeVisible();
  await page.keyboard.press('Escape');

  // ---- Local mailbox ----
  await page.getByRole('tab', { name: 'Mailbox' }).click();
  const entry = page.getByRole('row').filter({ hasText: `Welcome ${sample}` });
  await expect(entry).toBeVisible();
  await entry.getByRole('button', { name: /Open message/ }).click();
  await expect(page.getByRole('dialog').getByText(me.user.email).first()).toBeVisible();
  await expectAccessibleInBothThemes(page);
  await page.keyboard.press('Escape');
  await expectNoHorizontalScroll(page);

  // ---- Preferences: locked categories cannot be turned off ----
  await page.getByRole('tab', { name: 'My preferences' }).click();
  // Tenant-scoped, so parallel projects sharing one product (single mode) never race on the
  // same preference record and its If-Match version.
  await page.getByLabel('Applies to').selectOption(tenant.id);
  await expect(page.getByRole('checkbox', { name: /transactional/ })).toBeDisabled();
  const onboarding = page.getByRole('checkbox', { name: category, exact: true });
  await expect(onboarding).toBeChecked();
  await onboarding.click();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  // exact: the live region also announces it, prefixed with the toast's context.
  await expect(page.getByText('Preferences saved.', { exact: true })).toBeVisible();
  await expectAccessibleInBothThemes(page);
});
