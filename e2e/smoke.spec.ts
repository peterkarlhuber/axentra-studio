import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const api = process.env.AXENTRA_E2E_API;
const email = process.env.AXENTRA_E2E_EMAIL;
const password = process.env.AXENTRA_E2E_PASSWORD;

test.skip(
  !api,
  'AXENTRA_E2E_API is not set: start an Axentra API and set AXENTRA_E2E_API=http://127.0.0.1:8080 to run the smoke tests.',
);

// Fail on Content-Security-Policy violations (relevant when testing the Docker image).
test.beforeEach(({ page }) => {
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) {
      throw new Error(`CSP violation: ${message.text().slice(0, 300)}`);
    }
  });
});

async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

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
  test.skip(
    !email || !password,
    'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing admin account to run the signed-in checks.',
  );

  test('login reaches the shell and the main pages are accessible', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email ?? '');
    await page.getByLabel(/password/i).fill(password ?? '');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});
