/**
 * Accessibility of interactive states, which the route sweep (e2e/a11y.spec.ts) does not reach:
 * open dialogs and drawers, open menus, toggletips, the help side panel and form error states.
 * Each state is checked with axe (WCAG 2.1 A/AA) in the light and the dark theme, on the desktop
 * and the 360 px project, plus "no page-level horizontal scroll" and "focus is inside the open
 * layer". It only opens and validates forms, it never submits anything valid, so it does not
 * change data and can share the fixture product of the a11y sweep.
 */
import { expect, test, type Page } from '@playwright/test';
import {
  e2e,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  signInApi,
  SKIP_NO_ADMIN,
  SKIP_NO_API,
  trackConsoleErrors,
} from './support';

test.skip(!e2e.api, SKIP_NO_API);
test.skip(!e2e.email || !e2e.password || !e2e.productId, SKIP_NO_ADMIN);
test.describe.configure({ timeout: 90_000 });

const product = () => `/p/${encodeURIComponent(e2e.productId ?? '')}`;

/** The open layer (dialog or menu) holds the focus. */
async function expectFocusInside(page: Page, role: 'dialog' | 'menu') {
  await expect
    .poll(() =>
      page.evaluate((r) => Boolean(document.activeElement?.closest(`[role="${r}"]`)), role),
    )
    .toBe(true);
}

async function check(page: Page) {
  await expectNoA11yViolations(page);
  await expectNoHorizontalScroll(page);
}

interface Scenario {
  name: string;
  run: (page: Page) => Promise<void>;
}

const scenarios: Scenario[] = [
  {
    name: 'create-tenant dialog with a field error',
    run: async (page) => {
      await page.goto(`${product()}/tenants?new=1`);
      const dialog = page.getByRole('dialog', { name: 'Create tenant' });
      await expect(dialog).toBeVisible();
      await expectFocusInside(page, 'dialog');
      // A slug the server refuses: the error is shown at the field.
      await dialog.getByRole('textbox', { name: /^Name/ }).fill('A');
      await dialog.getByRole('textbox', { name: /^Slug/ }).fill('-');
      await dialog.getByRole('button', { name: 'Create tenant' }).click();
      await expect(dialog.locator('[aria-invalid="true"]').first()).toBeVisible();
      await check(page);
    },
  },
  {
    name: 'new API key dialog and its validation',
    run: async (page) => {
      await page.goto(`${product()}/api-keys?new=1`);
      const dialog = page.getByRole('dialog', { name: 'New API key' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('combobox', { name: /Expiry/ }).selectOption('custom');
      await dialog.getByRole('textbox', { name: /^Name/ }).fill('a11y');
      await dialog.getByRole('checkbox', { name: /^records:read/ }).click();
      await dialog.getByLabel(/Expiry date/).fill('2020-01-01');
      await dialog.getByRole('button', { name: 'Create key' }).click();
      await expect(dialog.getByText('Choose a date after today.')).toBeVisible();
      await check(page);
    },
  },
  {
    name: 'role editor dialog',
    run: async (page) => {
      await page.goto(`${product()}/roles`);
      await page.getByRole('button', { name: 'New custom role' }).click();
      await expect(page.getByRole('dialog', { name: 'New custom role' })).toBeVisible();
      await expectFocusInside(page, 'dialog');
      await check(page);
    },
  },
  {
    name: 'user menu',
    run: async (page) => {
      await page.goto(`${product()}/dashboard`);
      await page.getByRole('button', { name: 'Open user menu' }).click();
      await expect(page.getByRole('menu')).toBeVisible();
      await expectFocusInside(page, 'menu');
      await check(page);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu')).toBeHidden();
      await expect(page.getByRole('button', { name: 'Open user menu' })).toBeFocused();
    },
  },
  {
    name: 'product switcher menu',
    run: async (page) => {
      test.skip(process.env.AXENTRA_E2E_MODE === 'single', 'no product switcher in single mode');
      await page.goto(`${product()}/tenants`);
      await page.getByRole('button', { name: /Switch product/ }).click();
      await expect(page.getByRole('menu')).toBeVisible();
      await expectFocusInside(page, 'menu');
      await check(page);
    },
  },
  {
    name: 'page help side panel and an info tip',
    run: async (page) => {
      await page.goto(`${product()}/api-keys?new=1`);
      const dialog = page.getByRole('dialog', { name: 'New API key' });
      await dialog
        .getByRole('button', { name: /^About / })
        .first()
        .click();
      await expect(page.getByRole('dialog').last()).toBeVisible();
      await check(page);
      await page.keyboard.press('Escape');
      await page.goto(`${product()}/tenants`);
      await page.getByRole('button', { name: 'Help for this page' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await check(page);
    },
  },
  {
    name: 'profile password form with a mismatch error',
    run: async (page) => {
      await page.goto('/profile');
      await page.getByRole('textbox', { name: /^Current password/ }).fill('not-the-password');
      await page.getByRole('textbox', { name: /^New password/ }).fill('abcdefghijklmnop');
      await page.getByRole('textbox', { name: /^Repeat new password/ }).fill('abcdefghijklmnoq');
      await page.getByRole('button', { name: 'Change password' }).click();
      await expect(page.getByText('The new passwords do not match.')).toBeVisible();
      await check(page);
    },
  },
  {
    name: 'search form error state',
    run: async (page) => {
      test.skip(!(process.env.AXENTRA_E2E_MODULES ?? '').includes('search'), 'module search off');
      await page.goto(`${product()}/search?tenant=${encodeURIComponent(e2e.tenantId ?? '')}`);
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await expect(page.getByText('Enter at least one word.')).toBeVisible();
      await check(page);
    },
  },
];

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });
    for (const scenario of scenarios) {
      test(scenario.name, async ({ page }) => {
        await signInApi(page.request);
        const console = trackConsoleErrors(page, [/status of (409|422)/]);
        await scenario.run(page);
        console.assertNone();
      });
    }
  });
}
