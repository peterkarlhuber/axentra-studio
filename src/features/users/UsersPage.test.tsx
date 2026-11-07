import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Me } from '@/api/models';
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

  it('lists a user without an email address by name and id', async () => {
    mockApi(
      (_request, url) =>
        url.pathname === '/v1/users'
          ? jsonResponse({ items: [{ ...user('usr_x', 'Grace'), email: null }], next_cursor: null })
          : undefined,
      makeMe(['users:read']),
    );
    renderPage();
    expect(await screen.findByRole('link', { name: 'Grace' })).toBeInTheDocument();
    expect(screen.getByText('usr_x')).toBeInTheDocument();
  });
});

describe('Add single sign-on user', () => {
  /** `GET /v1/users` and `POST /v1/users/external`; `created` is the new user. */
  function externalApi(me: Me = makeMe(['users:read', 'users:manage'])) {
    return mockApi((request, url) => {
      if (url.pathname === '/v1/users') return jsonResponse({ items: everyone, next_cursor: null });
      if (url.pathname === '/v1/users/external' && request.method === 'POST') {
        return request.json().then((body: { subject: string; name: string }) =>
          body.subject === 'taken'
            ? jsonResponse(
                {
                  code: 'conflict',
                  status: 409,
                  detail: 'this external identity is already linked',
                },
                { status: 409 },
              )
            : jsonResponse({ ...user('usr_new', body.name), email: null }, { status: 201 }),
        );
      }
      return undefined;
    }, me);
  }

  it('creates a user without an email address and opens the new user', async () => {
    const calls = externalApi();
    const userEv = userEvent.setup();
    renderPage();
    await userEv.click(await screen.findByRole('button', { name: 'Add single sign-on user' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a single sign-on user' });
    const submit = within(dialog).getByRole('button', { name: 'Add user' });
    expect(submit).toBeDisabled();
    // "Verified" only makes sense with an address.
    expect(within(dialog).getByRole('checkbox', { name: /provider verified/ })).toBeDisabled();

    await userEv.type(
      within(dialog).getByRole('textbox', { name: /Provider \(issuer\)/ }),
      'https://login.example.com',
    );
    await userEv.type(within(dialog).getByRole('textbox', { name: /^Subject/ }), 'taken');
    await userEv.type(within(dialog).getByRole('textbox', { name: /^Name/ }), 'Grace');
    await userEv.click(submit);
    expect(await within(dialog).findByText(/already linked/)).toBeInTheDocument();

    const subject = within(dialog).getByRole('textbox', { name: /^Subject/ });
    await userEv.clear(subject);
    await userEv.type(subject, 'sub-1');
    await userEv.click(submit);
    expect(await screen.findByText('other page')).toBeInTheDocument();
    expect(screen.getByText('User added')).toBeInTheDocument();
    const posts = calls.filter((call) => call.path === '/v1/users/external');
    expect(posts.at(-1)?.body).toEqual({
      provider: 'https://login.example.com',
      subject: 'sub-1',
      name: 'Grace',
      email: null,
      email_verified: false,
    });
  });

  it('sends the email as verified only when ticked', async () => {
    const calls = externalApi();
    const userEv = userEvent.setup();
    renderPage();
    await userEv.click(await screen.findByRole('button', { name: 'Add single sign-on user' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a single sign-on user' });
    await userEv.type(
      within(dialog).getByRole('textbox', { name: /Provider \(issuer\)/ }),
      'https://login.example.com',
    );
    await userEv.type(within(dialog).getByRole('textbox', { name: /^Subject/ }), 'sub-2');
    await userEv.type(
      within(dialog).getByRole('textbox', { name: /Email address/ }),
      'grace@example.com',
    );
    await userEv.click(within(dialog).getByRole('checkbox', { name: /provider verified/ }));
    await userEv.click(within(dialog).getByRole('button', { name: 'Add user' }));
    await screen.findByText('other page');
    expect(calls.find((call) => call.path === '/v1/users/external')?.body).toMatchObject({
      email: 'grace@example.com',
      email_verified: true,
    });
  });

  it('is offered to platform administrators only', async () => {
    const viewer = { ...makeMe(['users:read']), platform_role: 'platform_viewer' } as Me;
    externalApi(viewer);
    renderPage();
    await screen.findByRole('link', { name: 'Ada Lovelace' });
    expect(
      screen.queryByRole('button', { name: 'Add single sign-on user' }),
    ).not.toBeInTheDocument();
  });
});
