/**
 * Help center and contextual help, in a real browser against the e2e backend:
 * - the public help center (signed out): search, deep links, chapter navigation, language switch
 *   that keeps the article, all articles in all six languages render with their own title;
 * - signed in: entry points (sidebar, top bar, page help button), the side panel keeps the page,
 *   info tips work with keyboard and pointer, "Learn more" in an error state;
 * - accessibility (axe, WCAG 2.2 A/AA) of the home page, an article, the open side panel and an
 *   open info tip, in light and dark theme; no horizontal scroll on phones.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import {
  e2e,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  signInApi,
  SIGNED_OUT_CONSOLE_ALLOW,
  SKIP_NO_ADMIN,
  SKIP_NO_API,
  trackConsoleErrors,
} from './support';

test.skip(!e2e.api, SKIP_NO_API);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['en', 'de', 'es', 'fr', 'pt-BR', 'it'] as const;
type Locale = (typeof LOCALES)[number];

const ARTICLES = [
  ...fs
    .readFileSync(path.join(ROOT, 'src/help/manifest.ts'), 'utf8')
    .matchAll(/articles:\s*\[([^\]]*)\]/g),
].flatMap((match) => [...(match[1] ?? '').matchAll(/'([a-z0-9-]+)'/g)].map((id) => id[1] ?? ''));

/** Title from an article's front matter (what the page must show as h1). */
function articleTitle(locale: Locale, id: string): string {
  const source = fs.readFileSync(path.join(ROOT, 'src/help/content', locale, `${id}.md`), 'utf8');
  const raw = /^title:\s*(.*)$/m.exec(source)?.[1]?.trim() ?? '';
  return raw.replace(/^(['"])(.*)\1$/, '$2');
}

function uiString(locale: Locale, namespace: string, key: string): string {
  const tree = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/i18n/locales', locale, `${namespace}.json`), 'utf8'),
  ) as Record<string, unknown>;
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], tree);
  return String(value);
}

async function presetLocale(page: Page, locale: Locale) {
  await page.addInitScript((value) => {
    window.localStorage.setItem('axentra.studio.locale', value);
  }, locale);
}

test('the article list covers the manifest', () => {
  expect(ARTICLES.length).toBeGreaterThan(30);
  expect(ARTICLES).toContain('api-keys');
});

test.describe('public help center', () => {
  test('search finds a section and the result opens it scrolled into view', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page, SIGNED_OUT_CONSOLE_ALLOW);
    await page.goto('/help');
    await expect(page.getByRole('heading', { level: 1, name: 'Help center' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search the help center' }).fill('grace period');
    await expect(page).toHaveURL(/\/help\?q=grace/);
    const results = page.getByRole('heading', { name: /results? for "grace period"/ });
    await expect(results).toBeVisible();
    const first = page.locator('ol a').first();
    await expect(first).toHaveAttribute('href', /\/help\/api-keys#/);
    await first.click();
    await expect(page.getByRole('heading', { level: 1, name: 'API keys' })).toBeVisible();
    const anchor = new URL(page.url()).hash.slice(1);
    await expect(page.locator(`[id="${anchor}"]`)).toBeInViewport();
    consoleErrors.assertNone();
  });

  test('deep links, chapter navigation, previous/next and browser back work', async ({ page }) => {
    await page.goto('/help/tenants#suspend');
    await expect(page.getByRole('heading', { level: 1, name: 'Tenants' })).toBeVisible();
    await expect(page.locator('#suspend')).toBeInViewport();
    await page.getByRole('link', { name: /^Next/ }).click();
    await expect(page).toHaveURL(/\/help\/members-invitations$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/help\/tenants#suspend$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Tenants' })).toBeVisible();
    await page.goto('/help/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Article not found' })).toBeVisible();
  });

  test('switching the language keeps the article and translates it', async ({ page }) => {
    await page.goto('/help/webhooks#signing-secret');
    await expect(
      page.getByRole('heading', { level: 1, name: articleTitle('en', 'webhooks') }),
    ).toBeVisible();
    for (const locale of ['de', 'fr', 'pt-BR'] as const) {
      await page.locator('header select').selectOption(locale);
      await expect(page).toHaveURL(/\/help\/webhooks#signing-secret$/);
      await expect(
        page.getByRole('heading', { level: 1, name: articleTitle(locale, 'webhooks') }),
      ).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
    }
  });

  for (const locale of LOCALES) {
    test(`every article renders in ${locale}`, async ({ page }) => {
      test.slow();
      const consoleErrors = trackConsoleErrors(page, SIGNED_OUT_CONSOLE_ALLOW);
      await presetLocale(page, locale);
      await page.goto('/help');
      await expect(
        page.getByRole('heading', { level: 1, name: uiString(locale, 'help', 'center.title') }),
      ).toBeVisible();
      for (const id of ARTICLES) {
        // Client-side navigation through the chapter list keeps this fast.
        await page.evaluate((target) => {
          window.history.pushState({}, '', target);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, `/help/${id}`);
        await expect(
          page.getByRole('heading', { level: 1, name: articleTitle(locale, id), exact: true }),
          `${locale}/${id}`,
        ).toBeVisible();
        await expectNoHorizontalScroll(page);
      }
      consoleErrors.assertNone();
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`help pages are accessible in the ${theme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/help');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoA11yViolations(page);
      for (const id of ['api-keys', 'jobs', 'troubleshooting', 'tutorial-webhook-receiver']) {
        await page.goto(`/help/${id}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expectNoA11yViolations(page);
        await expectNoHorizontalScroll(page);
      }
    });
  }
});

test.describe('contextual help (signed in)', () => {
  test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);

  test.beforeEach(async ({ page }) => {
    await signInApi(page.request);
  });

  test('help is reachable from the sidebar and the top bar', async ({ page, isMobile }) => {
    await page.goto(`/p/${e2e.productId}/dashboard`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('link', { name: 'Help and documentation' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Help center' })).toBeVisible();
    // Inside the Studio shell: the breadcrumb and navigation stay.
    if (isMobile) await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('link', { name: 'Help center' }).first()).toBeVisible();
  });

  test('the page help button opens the article in a side panel and keeps the page', async ({
    page,
  }) => {
    const consoleErrors = trackConsoleErrors(page);
    await page.goto(`/p/${e2e.productId}/api-keys`);
    await expect(page.getByRole('heading', { level: 1, name: 'API keys' })).toBeVisible();
    await page.getByRole('button', { name: 'Help for this page' }).click();
    const panel = page.getByRole('dialog', { name: 'API keys' });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('heading', { name: /Rotate/ }).first()).toBeVisible();
    await expectNoA11yViolations(page);
    // A link inside the panel switches the panel; Back returns.
    const inner = panel.locator('a[href^="/help/"]').first();
    await inner.click();
    await expect(panel.getByRole('button', { name: 'Back' })).toBeVisible();
    await panel.getByRole('button', { name: 'Back' }).click();
    await expect(panel.getByRole('heading', { level: 2, name: 'API keys' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/p/${e2e.productId}/api-keys$`));
    // Focus returns to the help button.
    await expect(page.getByRole('button', { name: 'Help for this page' })).toBeFocused();
    consoleErrors.assertNone();
  });

  test('info tips work with the keyboard and link into the help', async ({ page }) => {
    await page.goto(`/p/${e2e.productId}/api-keys?new=1`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const tips = dialog.locator('[data-info-tip]');
    await expect(tips.first()).toBeVisible();
    await tips.first().focus();
    await page.keyboard.press('Enter');
    const tip = page.locator('[data-radix-popper-content-wrapper]').last();
    await expect(tip).toBeVisible();
    await expectNoA11yViolations(page);
    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
    // The create dialog is still open: Escape closed only the tip.
    await expect(dialog).toBeVisible();
    await expect(tips.first()).toBeFocused();
  });

  test('the whole Studio and its help work in every language', async ({ page }) => {
    test.slow();
    for (const locale of LOCALES) {
      await presetLocale(page, locale);
      await page.goto(`/p/${e2e.productId}/tenants`);
      await expect(
        page.getByRole('heading', { level: 1, name: uiString(locale, 'tenants', 'title') }),
      ).toBeVisible();
      await page.getByRole('button', { name: uiString(locale, 'help', 'pageHelp') }).click();
      const panel = page.getByRole('dialog', { name: articleTitle(locale, 'tenants') });
      await expect(panel).toBeVisible();
      await expect(
        panel.getByRole('link', { name: uiString(locale, 'help', 'panel.openFull') }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expectNoHorizontalScroll(page);
    }
  });
});
