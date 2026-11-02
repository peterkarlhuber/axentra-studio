/**
 * Accessibility and responsive harness: every route registered in src/app/router.tsx (read by
 * e2e/routes.ts, so pages added later are picked up without editing this file) is visited in
 * the light and the dark theme, on the desktop and the 360 px project (playwright.config.ts).
 * Each visit must have no axe-core WCAG 2.1 A/AA violations, no page-level horizontal scroll and
 * no console errors or uncaught exceptions.
 *
 * Route parameters are filled from the e2e backend fixtures (scripts/e2e-backend.sh). A route
 * with a parameter that has no fixture is skipped with its name, so the gap is visible.
 */
import { expect, request as playwrightRequest, test } from '@playwright/test';
import { discoverRoutes, type DiscoveredRoute } from './routes';
import {
  e2e,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  signInApi,
  SKIP_NO_ADMIN,
  SIGNED_OUT_CONSOLE_ALLOW,
  SKIP_NO_API,
  trackConsoleErrors,
} from './support';

test.skip(!e2e.api, SKIP_NO_API);

const ROUTES = discoverRoutes();
const THEMES = ['light', 'dark'] as const;
const NOT_FOUND_PATH = '/e2e-route-that-does-not-exist';

/** Parameter values for the fixtures the e2e backend creates. */
const params: Record<string, string | undefined> = {
  productId: e2e.productId,
  tenantId: e2e.tenantId,
  userId: undefined, // filled from GET /v1/me in beforeAll
};

function toUrl(route: DiscoveredRoute): { url: string } | { missing: string[] } {
  if (route.pattern.endsWith('*')) return { url: NOT_FOUND_PATH };
  const missing: string[] = [];
  const url = route.pattern.replace(/:([A-Za-z0-9_]+)\??/g, (_, name: string) => {
    const value = params[name];
    if (!value) missing.push(name);
    return encodeURIComponent(value ?? '');
  });
  return missing.length ? { missing } : { url };
}

test('the route table was discovered', () => {
  expect(ROUTES.length).toBeGreaterThan(10);
  expect(ROUTES.map((route) => route.pattern)).toEqual(
    expect.arrayContaining(['/login', '/products', '/p/:productId/dashboard', '/settings']),
  );
});

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    test.describe('signed out', () => {
      for (const route of ROUTES.filter((candidate) => !candidate.requiresAuth)) {
        test(`${route.pattern}`, async ({ page }) => {
          const target = toUrl(route);
          test.skip(
            'missing' in target,
            `no fixture for :${'missing' in target ? target.missing.join(', :') : ''}`,
          );
          if (!('url' in target)) return;
          const consoleErrors = trackConsoleErrors(page, SIGNED_OUT_CONSOLE_ALLOW);
          await page.goto(target.url);
          await page.waitForLoadState('networkidle');
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          await expectNoA11yViolations(page);
          await expectNoHorizontalScroll(page);
          consoleErrors.assertNone();
        });
      }
    });

    test.describe('signed in', () => {
      test.skip(!e2e.email || !e2e.password, SKIP_NO_ADMIN);

      test.beforeAll(async ({ baseURL }) => {
        const context = await playwrightRequest.newContext({ baseURL });
        await signInApi(context);
        const me = (await (await context.get('/v1/me')).json()) as {
          user?: { id?: string } | null;
        };
        params.userId = me.user?.id ?? undefined;
        await context.dispose();
      });

      for (const route of ROUTES.filter((candidate) => candidate.requiresAuth)) {
        test(`${route.pattern}`, async ({ page }) => {
          const target = toUrl(route);
          test.skip(
            'missing' in target,
            `no fixture for :${'missing' in target ? target.missing.join(', :') : ''}`,
          );
          if (!('url' in target)) return;
          // The browser context shares cookies with page.request: one session per test.
          await signInApi(page.request);
          const consoleErrors = trackConsoleErrors(page);
          await page.goto(target.url);
          await page.waitForLoadState('networkidle');
          await expect(page).not.toHaveURL(/\/login/);
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          await expectNoA11yViolations(page);
          await expectNoHorizontalScroll(page);
          consoleErrors.assertNone();
        });
      }
    });
  });
}
