import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import type { Me } from '@/api/models';
import { jsonResponse, makeMe, mockApi, resetApi } from '@/features/billing/test-helpers';
import { renderWithProviders } from '@/test/utils';
import { parseIssuers } from './oidc-providers';
import { UserDetailPage } from './UserDetailPage';

const USER_ID = 'usr_grace';
const userUrl = `/v1/users/${USER_ID}`;
const ISSUER = 'https://login.example.com';
const grace = {
  id: USER_ID,
  email: null,
  email_verified: false,
  name: 'Grace Hopper',
  status: 'active',
  locale: 'en',
  preferences: {},
  platform_role: null,
  has_password: false,
  last_login_at: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};
const identity = {
  provider: ISSUER,
  subject: 'sub-123',
  email: 'grace@corp.example',
  created_at: '2026-10-02T00:00:00Z',
};

/** Platform admin unless `me` says otherwise; `unlink` answers DELETE .../identities. */
function api({
  me = makeMe(['users:read', 'users:manage', 'platform:settings']),
  identities = [identity],
  unlink = () => jsonResponse({ revoked: 2 }),
}: {
  me?: Me;
  identities?: (typeof identity)[];
  unlink?: () => Response;
} = {}) {
  let linked = [...identities];
  return mockApi((request, url) => {
    if (url.pathname === '/v1/auth/session')
      return jsonResponse({ csrf_token: 'csrf-1', user: { id: 'usr_1' } });
    if (url.pathname === userUrl && request.method === 'GET') return jsonResponse(grace);
    if (url.pathname === `${userUrl}/sessions`) return jsonResponse([]);
    if (url.pathname === `${userUrl}/memberships`)
      return jsonResponse({ products: [], tenants: [] });
    if (url.pathname === '/v1/settings') {
      return jsonResponse({
        oidc_providers: [{ id: 'corp', name: 'Corp SSO', issuer: ISSUER }],
      });
    }
    if (url.pathname === `${userUrl}/identities`) {
      if (request.method === 'GET') return jsonResponse(linked);
      if (request.method === 'POST') {
        return request.json().then((body: { provider: string; subject: string }) => {
          if (linked.some((row) => row.subject === body.subject)) {
            return jsonResponse(
              { code: 'conflict', status: 409, detail: 'this external identity is already linked' },
              { status: 409 },
            );
          }
          const row = { ...body, email: '', created_at: '2026-11-07T00:00:00Z' };
          linked = [...linked, row];
          return jsonResponse(row, { status: 201 });
        });
      }
      if (request.method === 'DELETE') {
        const answer = unlink();
        if (answer.ok) linked = [];
        return answer;
      }
    }
    return undefined;
  }, me);
}

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/users/:userId" element={<UserDetailPage />} />
    </Routes>,
    { route: `/users/${USER_ID}` },
  );

const card = async () =>
  (await screen.findByRole('heading', { name: 'Single sign-on identities' })).closest('section')!;

afterEach(resetApi);

describe('IdentitiesCard', () => {
  it('lists the identities with the configured provider name', async () => {
    api();
    renderPage();
    const table = await screen.findByRole('table', { name: 'Single sign-on identities' });
    expect(await within(table).findByText('Corp SSO')).toBeInTheDocument();
    expect(within(table).getByText(ISSUER)).toBeInTheDocument();
    expect(within(table).getByText('sub-123')).toBeInTheDocument();
    expect(within(table).getByText('grace@corp.example')).toBeInTheDocument();
    // A user without an email address still has a name to show.
    expect(screen.getByRole('heading', { level: 1, name: 'Grace Hopper' })).toBeInTheDocument();
  });

  it('links an identity and shows a conflict in the dialog', async () => {
    const calls = api();
    const user = userEvent.setup();
    renderPage();
    await user.click(within(await card()).getByRole('button', { name: 'Link identity' }));
    const dialog = await screen.findByRole('dialog', { name: 'Link a single sign-on identity' });
    const submit = within(dialog).getByRole('button', { name: 'Link identity' });
    expect(submit).toBeDisabled();

    // With configured providers the field offers them as suggestions (a combobox).
    const provider = await within(dialog).findByRole('combobox', { name: /Provider \(issuer\)/ });
    expect(dialog.querySelector('datalist option')).toHaveAttribute('value', ISSUER);
    await user.type(provider, ISSUER);
    await user.type(within(dialog).getByRole('textbox', { name: /^Subject/ }), 'sub-123');
    await user.click(submit);
    expect(await within(dialog).findByText('Conflict')).toBeInTheDocument();
    expect(within(dialog).getByText(/already linked/)).toBeInTheDocument();

    const subject = within(dialog).getByRole('textbox', { name: /^Subject/ });
    await user.clear(subject);
    await user.type(subject, ' sub-456 ');
    await user.click(submit);
    expect(await screen.findByText('Identity linked')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Link a single/ })).not.toBeInTheDocument(),
    );
    const posts = calls.filter(
      (call) => call.method === 'POST' && call.path.endsWith('/identities'),
    );
    expect(posts.at(-1)?.body).toEqual({ provider: ISSUER, subject: 'sub-456' });
    expect(await screen.findByText('sub-456')).toBeInTheDocument();
  });

  it('unlinks after a confirmation and reports the ended sessions', async () => {
    const calls = api();
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: 'Unlink the identity at Corp SSO' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Unlink identity?' });
    expect(
      within(dialog).getByText(/all of the user's sessions end immediately/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Unlink identity' }));
    expect(await screen.findByText('Identity unlinked, 2 sessions ended')).toBeInTheDocument();
    const remove = calls.find((call) => call.method === 'DELETE');
    expect(remove?.path).toBe(`${userUrl}/identities`);
    expect(remove?.url.searchParams.get('provider')).toBe(ISSUER);
    expect(remove?.url.searchParams.get('subject')).toBe('sub-123');
    expect(await screen.findByText('No single sign-on identities')).toBeInTheDocument();
  });

  it("explains the refusal to unlink the user's last way to sign in", async () => {
    api({
      unlink: () =>
        jsonResponse(
          {
            code: 'conflict',
            status: 409,
            detail: "this is the user's only way to sign in; disable the user instead",
            reason: 'last_sign_in_method',
          },
          { status: 409 },
        ),
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: 'Unlink the identity at Corp SSO' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Unlink identity?' });
    await user.click(within(dialog).getByRole('button', { name: 'Unlink identity' }));
    expect(await within(dialog).findByText("The user's last way to sign in")).toBeInTheDocument();
    expect(within(dialog).getByText(/Link another identity first/)).toBeInTheDocument();
    // The dialog stays open for another decision.
    expect(screen.getByRole('dialog', { name: 'Unlink identity?' })).toBeInTheDocument();
  });

  it('is read-only for users:manage without the platform admin role', async () => {
    const manager = {
      ...makeMe(['users:read', 'users:manage']),
      platform_role: 'platform_viewer',
    } as Me;
    const calls = api({ me: manager });
    renderPage();
    const table = await screen.findByRole('table', { name: 'Single sign-on identities' });
    expect(await within(table).findByText('sub-123')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Link identity' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Unlink the identity/ })).not.toBeInTheDocument();
    // The issuer names come from the settings, which only the editors need.
    expect(calls.some((call) => call.path === '/v1/settings')).toBe(false);
  });

  it('is not shown without users:manage', async () => {
    const reader = { ...makeMe(['users:read']), platform_role: 'platform_viewer' } as Me;
    const calls = api({ me: reader });
    renderPage();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Grace Hopper' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Single sign-on identities')).not.toBeInTheDocument();
    expect(calls.some((call) => call.path.endsWith('/identities'))).toBe(false);
  });
});

describe('parseIssuers', () => {
  it('keeps one entry per issuer and falls back to the id for the name', () => {
    expect(
      parseIssuers([
        { id: 'a', name: 'A', issuer: 'https://a.example' },
        { id: 'a2', name: 'A again', issuer: 'https://a.example' },
        { id: 'b', name: '', issuer: 'https://b.example' },
        { id: 'c' },
      ]),
    ).toEqual([
      { issuer: 'https://a.example', name: 'A' },
      { issuer: 'https://b.example', name: 'b' },
    ]);
    expect(parseIssuers(undefined)).toEqual([]);
  });
});
