import { expect, test } from '@playwright/test';
import { e2e, expectNoA11yViolations, signIn, SKIP_NO_ADMIN, SKIP_NO_API } from './support';

const api = e2e.api;
const email = e2e.email;
const password = e2e.password;

test.skip(!api, SKIP_NO_API);

// Fail on Content-Security-Policy violations (relevant when testing the Docker image).
test.beforeEach(({ page }) => {
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) {
      throw new Error(`CSP violation: ${message.text().slice(0, 300)}`);
    }
  });
});

test('the API is reachable through the Studio origin and reports a compatible version', async ({
  request,
}) => {
  const response = await request.get('/v1/meta');
  expect(response.ok()).toBe(true);
  const meta = (await response.json()) as { api_version: { major: number; minor: number } };
  expect(meta.api_version.major).toBe(1);
});

test('the entry page renders without accessibility violations', async ({ page }) => {
  await page.goto('/');
  // A fresh server shows the setup page, otherwise the login page (or the app if a session exists).
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  await expect(page).toHaveURL(/\/(setup|login|products|p\/[^/]+\/dashboard)/);
  await expectNoA11yViolations(page);
});

test('the theme is applied before first paint', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
});

test.describe('signed in', () => {
  test.skip(!email || !password, SKIP_NO_ADMIN);

  test('login reaches the shell and the main pages are accessible', async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
