import { expect, test } from '@playwright/test';
import {
  api,
  email,
  expectAccessibleInBothThemes,
  expectNoHorizontalScroll,
  login,
  password,
} from './notify-monitoring-support';

test.skip(!api, 'AXENTRA_E2E_API is not set: start an Axentra API to run the monitoring tests.');
test.skip(
  !email || !password,
  'Set AXENTRA_E2E_EMAIL and AXENTRA_E2E_PASSWORD to an existing platform admin to run the monitoring tests.',
);

test('the monitoring page shows health checks, metrics and retention settings', async ({
  page,
}) => {
  await login(page);
  await page.goto('/monitoring');
  await expect(page.getByRole('heading', { level: 1, name: 'Monitoring' })).toBeVisible();

  // Readiness lists each check of GET /v1/health/ready.
  const readiness = page.getByRole('region', { name: 'Readiness' });
  await expect(readiness.getByText('database')).toBeVisible();
  await expect(readiness.getByText('notify_provider')).toBeVisible();

  // Real values from GET /metrics.
  const metrics = page.getByRole('region', { name: 'Metrics' });
  await expect(metrics.getByText('HTTP requests', { exact: true })).toBeVisible();
  await expect(metrics.getByText('axentra_http_requests_total')).toBeVisible();
  await expect(metrics.getByRole('table', { name: /HTTP requests/ }).first()).toBeVisible();

  // Retention as reported by GET /v1/settings.
  await expect(page.getByText('Audit events')).toBeVisible();
  await expect(page.getByText('365 days')).toBeVisible();
  await expect(page.getByText('OpenTelemetry tracing')).toBeVisible();

  await expectNoHorizontalScroll(page);
  await expectAccessibleInBothThemes(page);
});
