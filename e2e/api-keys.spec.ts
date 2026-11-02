import { expect, test } from '@playwright/test';
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
 * API key expiry against a real backend: the create dialog offers presets and a date, refuses a
 * day that is not in the future, sends `expires_at`, and the list shows the expiry.
 */
test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);
test.describe.configure({ timeout: 120_000 });

interface ListedKey {
  name: string;
  expires_at: string | null;
}

test('create API keys with an expiry date and a preset; the list shows the expiry', async ({
  page,
}) => {
  await signIn(page);
  const suffix = `${test.info().project.name}-${Date.now().toString(36)}`.replace(/[^a-z0-9]/g, '');
  const { id: productId } = await specProduct(page.request, {
    name: `API keys e2e ${suffix}`,
    slug: `ak-${suffix}`.slice(0, 60),
  });
  const mobile = test.info().project.name === 'mobile';

  async function createKey(name: string, choose: () => Promise<void>) {
    await page.getByRole('button', { name: 'New API key' }).click();
    const dialog = page.getByRole('dialog', { name: 'New API key' });
    await dialog.getByRole('textbox', { name: /^Name/ }).fill(name);
    await dialog.getByRole('checkbox', { name: /^records:read/ }).click();
    await choose();
    await dialog.getByRole('button', { name: 'Create key' }).click();
    const secret = page.getByRole('dialog', { name: /Secret for/ });
    await expect(secret).toBeVisible();
    await secret.getByRole('checkbox', { name: 'I have stored the secret securely' }).click();
    await secret.getByRole('button', { name: 'Done' }).click();
    await expect(secret).toBeHidden();
  }

  await page.goto(`/p/${productId}/api-keys`);
  await expect(page.getByRole('heading', { name: 'API keys', level: 1 })).toBeVisible();

  // ---- A chosen date: today is refused, the end of a later day is sent ----
  const dated = `dated-${suffix}`;
  await createKey(dated, async () => {
    const dialog = page.getByRole('dialog', { name: 'New API key' });
    await dialog.getByRole('combobox', { name: /Expiry/ }).selectOption('custom');
    const date = dialog.getByLabel(/Expiry date/);
    const today = await page.evaluate(() => {
      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    });
    await date.fill(today);
    await dialog.getByRole('button', { name: 'Create key' }).click();
    await expect(dialog.getByText('Choose a date after today.')).toBeVisible();
    await expectNoA11yViolations(page);
    await expectNoHorizontalScroll(page);
    await date.fill('2099-12-31');
  });

  // ---- A preset ----
  const preset = `preset-${suffix}`;
  const before = Date.now();
  await createKey(preset, async () => {
    await page
      .getByRole('dialog', { name: 'New API key' })
      .getByRole('combobox', { name: /Expiry/ })
      .selectOption('30');
  });

  const keys = (await (
    await page.request.get(`/v1/products/${productId}/api-keys`)
  ).json()) as ListedKey[];
  const datedKey = keys.find((key) => key.name === dated);
  const presetKey = keys.find((key) => key.name === preset);
  // End of 31 Dec 2099 in the browser's time zone.
  expect(new Date(datedKey?.expires_at ?? '').getUTCFullYear()).toBeGreaterThanOrEqual(2099);
  const presetMs = Date.parse(presetKey?.expires_at ?? '');
  expect(presetMs).toBeGreaterThan(before + 29.9 * 86_400_000);
  expect(presetMs).toBeLessThan(Date.now() + 30.1 * 86_400_000);

  // The list shows the expiry (the column is hidden at phone width).
  if (!mobile) {
    for (const key of [datedKey, presetKey]) {
      const row = page.getByRole('row', { name: new RegExp(key?.name ?? '') });
      await expect(row.locator(`time[datetime="${key?.expires_at}"]`)).toBeVisible();
    }
  }
  await expectNoHorizontalScroll(page);
});
