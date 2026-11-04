import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { jsonResponse, mockApi, resetApi } from '@/features/billing/test-helpers';
import { renderWithProviders, testMeta } from '@/test/utils';
import { HealthPage } from './HealthPage';
import { NotFoundPage } from './NotFoundPage';

function api({ live = true } = {}) {
  return mockApi((_request, url) => {
    if (url.pathname === '/v1/health/live')
      return live
        ? jsonResponse({ status: 'ok' })
        : jsonResponse({ status: 'down' }, { status: 503 });
    if (url.pathname === '/v1/health/ready')
      return jsonResponse({ status: 'ok', checks: { database: { status: 'ok' } } });
    return undefined;
  });
}

afterEach(resetApi);

describe('HealthPage', () => {
  it('shows liveness, readiness and the versions Studio and the server run', async () => {
    api();
    renderWithProviders(<HealthPage />);
    expect(await screen.findByRole('heading', { level: 1, name: 'System health' })).toBeVisible();
    const versions = screen.getByRole('heading', { name: 'Versions' }).closest('section');
    expect(versions).not.toBeNull();
    expect(
      within(versions as HTMLElement).getByText(`${testMeta.name} ${testMeta.version}`),
    ).toBeInTheDocument();
    expect(within(versions as HTMLElement).getByText(testMeta.environment)).toBeInTheDocument();
    const liveness = screen.getByRole('heading', { name: 'Liveness' }).closest('section');
    expect(await within(liveness as HTMLElement).findByText('OK')).toBeVisible();
  });

  it('reports a failing liveness check as down and reloads both checks on Refresh', async () => {
    const calls = api({ live: false });
    const user = userEvent.setup();
    renderWithProviders(<HealthPage />);
    const liveness = (await screen.findByRole('heading', { name: 'Liveness' })).closest('section');
    expect(await within(liveness as HTMLElement).findByText('Down')).toBeVisible();
    const before = calls.filter((call) => call.path.startsWith('/v1/health/')).length;
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await within(liveness as HTMLElement).findByText('Down');
    expect(calls.filter((call) => call.path.startsWith('/v1/health/')).length).toBeGreaterThan(
      before,
    );
  });
});

describe('NotFoundPage', () => {
  it('has a page heading and leads back to the start page', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to start page' })).toHaveAttribute('href', '/');
  });
});
