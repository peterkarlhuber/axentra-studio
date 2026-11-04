import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  jsonResponse,
  makeMe,
  mockApi,
  PRODUCT_ID,
  renderProductPage,
  resetApi,
} from '@/features/billing/test-helpers';
import { UsersPage } from './UsersPage';

const user = (id: string, name: string, status = 'active') => ({
  id,
  email: `${id}@example.com`,
  name,
  status,
  locale: 'en',
  preferences: {},
  platform_role: null,
  has_password: true,
  last_login_at: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
});
const everyone = [user('ada', 'Ada Lovelace'), user('bob', 'Bob Byte', 'disabled')];

/** A fake `GET /v1/users` that filters like the server (q on name/email, status). */
function api() {
  return mockApi(
    (_request, url) => {
      if (url.pathname !== '/v1/users') return undefined;
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const status = url.searchParams.get('status');
      const items = everyone.filter(
        (candidate) =>
          (!q || `${candidate.name} ${candidate.email}`.toLowerCase().includes(q)) &&
          (!status || candidate.status === status),
      );
      return jsonResponse({ items, next_cursor: null });
    },
    makeMe(['users:read']),
  );
}

const renderPage = () =>
  renderProductPage(<UsersPage />, {
    route: `/p/${PRODUCT_ID}/users`,
    path: '/p/:productId/users',
  });

const listCalls = (calls: { path: string; url: URL }[]) =>
  calls.filter((call) => call.path === '/v1/users').map((call) => call.url.searchParams);

afterEach(resetApi);

describe('UsersPage', () => {
  it('lists the users of the product with links to their pages', async () => {
    const calls = api();
    renderPage();
    expect(await screen.findByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      `/p/${PRODUCT_ID}/users/ada`,
    );
    expect(screen.getByRole('link', { name: 'Bob Byte' })).toBeInTheDocument();
    expect(listCalls(calls)[0]?.get('product_id')).toBe(PRODUCT_ID);
  });

  it('searches on the server and filters by status', async () => {
    const calls = api();
    const userEv = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Ada Lovelace' });

    await userEv.type(screen.getByRole('searchbox', { name: 'Search users' }), 'ada');
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Bob Byte' })).not.toBeInTheDocument(),
    );
    expect(listCalls(calls).at(-1)?.get('q')).toBe('ada');

    await userEv.clear(screen.getByRole('searchbox', { name: 'Search users' }));
    await userEv.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'disabled');
    expect(await screen.findByRole('link', { name: 'Bob Byte' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Ada Lovelace' })).not.toBeInTheDocument(),
    );
    expect(listCalls(calls).at(-1)?.get('status')).toBe('disabled');
  });

  it('says when no user matches the filters', async () => {
    api();
    const userEv = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Ada Lovelace' });
    await userEv.type(screen.getByRole('searchbox', { name: 'Search users' }), 'nobody');
    expect(await screen.findByText('No matching users')).toBeInTheDocument();
    expect(screen.getByText('Try a different search or status filter.')).toBeInTheDocument();
  });
});
