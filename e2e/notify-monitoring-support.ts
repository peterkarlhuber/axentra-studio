/**
 * Shared helpers for e2e/notify.spec.ts and e2e/monitoring.spec.ts (real backend).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const api = process.env.AXENTRA_E2E_API;
export const email = process.env.AXENTRA_E2E_EMAIL;
export const password = process.env.AXENTRA_E2E_PASSWORD;

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    // Known shell issue outside these areas (reported to the foundation): the product switcher
    // trigger's aria-label does not contain its visible text (label-content-name-mismatch).
    .exclude('[aria-label="Switch product"]')
    // Notification previews are sandboxed frames without scripts: axe cannot run inside them
    // (and their content is the template author's email HTML, not Studio UI).
    // Legacy mode runs axe in the top document only, so it never waits on those frames.
    .setLegacyMode()
    .options({ iframes: false })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([]);
}

/** Axe in light and dark theme (the Studio follows the system preference by default). */
export async function expectAccessibleInBothThemes(page: Page) {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    await expectNoA11yViolations(page);
  }
  await page.emulateMedia({ colorScheme: 'light' });
}

/** No page-level horizontal scrolling (360 px requirement). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page
    .locator('html')
    .evaluate((root) => root.scrollWidth - root.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email ?? '');
  await page.getByLabel(/password/i).fill(password ?? '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** JSON API calls with the page's session cookie, CSRF token and Studio origin. */
export async function apiClient(page: Page) {
  const request: APIRequestContext = page.request;
  const origin = new URL(page.url()).origin;
  const session = (await (await request.get('/v1/auth/session')).json()) as {
    csrf_token: string;
  };
  const headers = { 'X-Axentra-CSRF': session.csrf_token, Origin: origin };
  const call = async <T>(method: 'GET' | 'POST', path: string, data?: unknown): Promise<T> => {
    const response = await request.fetch(path, { method, headers, data });
    expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBe(
      true,
    );
    return (await response.json()) as T;
  };
  return {
    get: <T>(path: string) => call<T>('GET', path),
    post: <T>(path: string, data: unknown) => call<T>('POST', path, data),
  };
}
