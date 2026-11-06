import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setCsrfToken } from '@/api/csrf';
import { queryKeys } from '@/api/queryKeys';
import { jsonResponse, makeMe, mockApi, resetApi } from '@/features/billing/test-helpers';
import { setLocale } from '@/i18n';
import { createTestQueryClient, renderWithProviders } from '@/test/utils';
import { SettingsPage } from './SettingsPage';

afterEach(async () => {
  resetApi();
  setCsrfToken(null);
  await setLocale('en');
  try {
    window.localStorage.clear();
  } catch {
    // Storage unavailable: nothing to reset.
  }
});

function render(settings: () => Response) {
  const calls = mockApi((request, url) => {
    if (url.pathname === '/v1/settings') return settings();
    if (url.pathname === '/v1/me' && request.method === 'PATCH') return jsonResponse({});
    return undefined;
  }, makeMe([]));
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(queryKeys.session, { csrf_token: 'csrf-1' });
  setCsrfToken('csrf-1');
  renderWithProviders(<SettingsPage />, { queryClient });
  return calls;
}

describe('SettingsPage', () => {
  it('shows the effective server configuration as a read-only tree', async () => {
    render(() =>
      jsonResponse({
        mode: 'multi',
        events: { default_max_attempts: 5, webhook_timeout_seconds: 10 },
        security: { allowed_origins: ['https://studio.example.com'] },
      }),
    );
    const tree = await screen.findByRole('list', { name: 'Server configuration' });
    expect(within(tree).getByText('events')).toBeInTheDocument();
    expect(within(tree).getByText('default_max_attempts')).toBeInTheDocument();
    expect(within(tree).getByText('5')).toBeInTheDocument();
    expect(within(tree).getByText('https://studio.example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'How to change them' })).toBeInTheDocument();
  });

  it('explains who may see the server configuration on a 403', async () => {
    render(() =>
      jsonResponse({ code: 'forbidden', status: 403, title: 'Forbidden' }, { status: 403 }),
    );
    expect(
      await screen.findByText(/shown to platform administrators and to product owners/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Server configuration' })).not.toBeInTheDocument();
  });

  it('offers a retry when the server configuration cannot be loaded', async () => {
    let fail = true;
    const calls = render(() =>
      fail
        ? jsonResponse({ code: 'internal', status: 500, title: 'Internal' }, { status: 500 })
        : jsonResponse({ mode: 'single' }),
    );
    const user = userEvent.setup();
    const retry = await screen.findByRole('button', { name: /Try again/ });
    fail = false;
    await user.click(retry);
    expect(await screen.findByText('single')).toBeInTheDocument();
    expect(calls.filter((call) => call.path === '/v1/settings')).toHaveLength(2);
  });

  it('says so when the server returns no settings', async () => {
    render(() => jsonResponse({}));
    expect(await screen.findByText('The server returned no settings.')).toBeInTheDocument();
  });

  it('saves the theme and the language in the account as well', async () => {
    const calls = render(() => jsonResponse({}));
    const user = userEvent.setup();
    await screen.findByText('The server returned no settings.');
    await user.click(screen.getByRole('radio', { name: /Dark/ }));
    expect(screen.getByRole('radio', { name: /Dark/ })).toBeChecked();
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.method === 'PATCH' &&
            JSON.stringify(call.body) === JSON.stringify({ preferences: { theme: 'dark' } }),
        ),
      ).toBe(true),
    );

    await user.selectOptions(screen.getByRole('combobox', { name: /Language/ }), 'de');
    expect(await screen.findByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible();
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.method === 'PATCH' &&
            JSON.stringify(call.body) === JSON.stringify({ locale: 'de' }),
        ),
      ).toBe(true),
    );
  });
});
