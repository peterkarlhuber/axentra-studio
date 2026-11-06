import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import type { Me } from '@/api/models';
import { jsonResponse, renderWithProviders } from '@/test/utils';
import { ProfilePage } from './ProfilePage';
import { revokeOtherSessions } from './revoke-other-sessions';

const me = {
  user: {
    id: 'usr_sso',
    email: 'sso@example.com',
    name: 'Sam',
    status: 'active',
    locale: 'en',
    preferences: {},
    has_password: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  actor_kind: 'user',
  platform_role: null,
  platform_permissions: [],
  products: [],
} as unknown as Me;

function LoginProbe() {
  const location = useLocation();
  return <p>login page {location.search}</p>;
}

afterEach(() => configureApi({ baseUrl: '' }));

describe('ProfilePage', () => {
  it('asks to sign in again when a first password needs a recent sign-in', async () => {
    const calls: Request[] = [];
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        calls.push(request.clone());
        const url = new URL(request.url);
        if (url.pathname === '/v1/auth/session') return jsonResponse({ csrf_token: 'csrf' });
        if (url.pathname === '/v1/me') return jsonResponse(me);
        if (url.pathname === '/v1/auth/sessions') return jsonResponse([]);
        if (url.pathname === '/v1/me/password')
          return jsonResponse(
            {
              code: 'reauthentication_required',
              status: 403,
              detail: 'log in again to set a password',
            },
            { status: 403 },
          );
        if (url.pathname === '/v1/auth/logout') return new Response(null, { status: 204 });
        return jsonResponse({ code: 'not_found', status: 404 }, { status: 404 });
      },
    });
    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginProbe />} />
      </Routes>,
      { route: '/profile' },
    );
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Set a password' });
    await user.type(screen.getByLabelText(/^New password/), 'a-long-new-password-1');
    await user.type(screen.getByLabelText(/^Repeat new password/), 'a-long-new-password-1');
    await user.click(screen.getByRole('button', { name: 'Set password' }));

    const alert = await screen.findByText('Please sign in again');
    expect(
      within(alert.closest('[role="status"]') as HTMLElement).getByText(
        /shortly after you signed in/,
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign in again' }));
    await waitFor(() =>
      expect(calls.some((call) => call.url.endsWith('/v1/auth/logout'))).toBe(true),
    );
    expect(await screen.findByText('login page ?return_to=%2Fprofile')).toBeInTheDocument();
  });

  it('explains a password policy refusal at the new password field, without a toast', async () => {
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        const url = new URL(request.url);
        if (url.pathname === '/v1/auth/session') return jsonResponse({ csrf_token: 'csrf' });
        if (url.pathname === '/v1/me')
          return jsonResponse({ ...me, user: { ...me.user, has_password: true } });
        if (url.pathname === '/v1/auth/sessions') return jsonResponse([]);
        if (url.pathname === '/v1/me/password')
          return jsonResponse(
            {
              code: 'validation_failed',
              status: 422,
              detail: 'the password is too simple',
              reason: 'too_simple',
              min_length: 12,
              errors: [{ loc: ['body', 'new_password'], msg: 'the password is too simple' }],
            },
            { status: 422 },
          );
        return jsonResponse({ code: 'not_found', status: 404 }, { status: 404 });
      },
    });
    renderWithProviders(<ProfilePage />, { route: '/profile' });
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Change password' });
    await user.type(screen.getByLabelText(/^Current password/), 'the-old-password');
    await user.type(screen.getByLabelText(/^New password/), 'aaaaaaaaaaaaaaaa');
    await user.type(screen.getByLabelText(/^Repeat new password/), 'aaaaaaaaaaaaaaaa');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    const field = screen.getByLabelText(/^New password/);
    await waitFor(() =>
      expect(field).toHaveAccessibleDescription(/Use at least 4 different characters\./),
    );
    expect(screen.queryByText('the password is too simple')).not.toBeInTheDocument();
  });
});

function session(id: string, current = false) {
  return {
    id,
    current,
    auth_method: 'password',
    ip: '203.0.113.7',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0',
    created_at: '2026-11-01T08:00:00Z',
    last_seen_at: '2026-11-02T08:00:00Z',
    expires_at: '2026-11-02T20:00:00Z',
  };
}

const problem = (code: string, status: number) =>
  jsonResponse({ code, status, title: code, request_id: 'req-7' }, { status });

describe('revokeOtherSessions', () => {
  const ok = () => Promise.resolve();

  it('never revokes the current session and counts an already ended one as done', async () => {
    const revoked: string[] = [];
    const result = await revokeOtherSessions(
      async () => [session('ses_me', true), session('ses_a'), session('ses_b')] as never,
      async (id) => {
        revoked.push(id);
        if (id === 'ses_b') {
          const { ApiError } = await import('@/api/errors');
          throw new ApiError({ status: 404, code: 'not_found' });
        }
      },
    );
    expect(revoked.sort()).toEqual(['ses_a', 'ses_b']);
    expect(result).toEqual({ revoked: 2, failed: 0, errors: [] });
  });

  it('keeps going after a failure and counts it', async () => {
    const boom = new Error('rate limited');
    const result = await revokeOtherSessions(
      async () => [session('a'), session('me', true), session('b'), session('c')] as never,
      async (id) => {
        if (id === 'b') throw boom;
      },
    );
    expect(result).toEqual({ revoked: 2, failed: 1, errors: [boom] });
  });

  it('revokes nothing when the server marks no session as current', async () => {
    let calls = 0;
    await expect(
      revokeOtherSessions(
        async () => [session('a'), session('b')] as never,
        async () => {
          calls += 1;
          return ok();
        },
      ),
    ).rejects.toThrow(/current session/);
    expect(calls).toBe(0);
  });
});

describe('ProfilePage: sign out all other sessions', () => {
  function setup(fail: string[]) {
    let active = [session('ses_me', true), session('ses_a'), session('ses_b'), session('ses_c')];
    const deletes: string[] = [];
    let lists = 0;
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        const url = new URL(request.url);
        if (url.pathname === '/v1/auth/session') return jsonResponse({ csrf_token: 'csrf' });
        if (url.pathname === '/v1/me') return jsonResponse(me);
        if (url.pathname === '/v1/auth/sessions') {
          lists += 1;
          return jsonResponse(active);
        }
        const match = /^\/v1\/auth\/sessions\/(.+)$/.exec(url.pathname);
        if (match && request.method === 'DELETE') {
          const id = match[1] ?? '';
          deletes.push(id);
          if (fail.includes(id)) return problem('rate_limited', 429);
          active = active.filter((entry) => entry.id !== id);
          return new Response(null, { status: 204 });
        }
        return problem('not_found', 404);
      },
    });
    renderWithProviders(<ProfilePage />, { route: '/profile' });
    return { deletes, lists: () => lists };
  }

  async function confirmOthers(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: 'Sign out all other sessions' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sign out all other sessions?' });
    expect(dialog).toHaveTextContent('3 other sessions end. This browser stays signed in.');
    await user.click(within(dialog).getByRole('button', { name: 'Sign out all other sessions' }));
  }

  it('asks before signing out the others and does nothing on cancel', async () => {
    const api = setup([]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Sign out all other sessions' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sign out all other sessions?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(api.deletes).toEqual([]);
  });

  it('asks before revoking one session and names its device', async () => {
    const api = setup([]);
    const user = userEvent.setup();
    const buttons = await screen.findAllByRole('button', { name: /^Revoke the session on/ });
    await user.click(buttons[0] as HTMLElement);
    const dialog = await screen.findByRole('dialog', { name: 'Revoke this session?' });
    expect(dialog).toHaveTextContent(/Firefox.*is signed out with its next request/);
    expect(api.deletes).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: 'Revoke session' }));
    await waitFor(() => expect(api.deletes).toHaveLength(1));
    expect(await screen.findByText('Session revoked')).toBeInTheDocument();
  });

  it('signs out the others, reports success and reloads the list', async () => {
    const api = setup([]);
    const user = userEvent.setup();
    await confirmOthers(user);
    expect(await screen.findByText('3 other sessions signed out')).toBeInTheDocument();
    expect(api.deletes.sort()).toEqual(['ses_a', 'ses_b', 'ses_c']);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Sign out all other sessions' }),
      ).not.toBeInTheDocument(),
    );
    expect(api.lists()).toBeGreaterThanOrEqual(3); // page load, fresh read, reload
  });

  it('reports how many could not be signed out and keeps them listed', async () => {
    const api = setup(['ses_b']);
    const user = userEvent.setup();
    await confirmOthers(user);
    expect(
      await screen.findByText('1 of 3 other sessions could not be signed out'),
    ).toBeInTheDocument();
    // Anchored: Radix also copies the toast text into its aria-live announcer ("Notification …")
    // once the toast has been shown for a moment, which a slow run reaches before this line.
    expect(screen.getByText(/^Too many requests/)).toBeInTheDocument();
    expect(api.deletes).not.toContain('ses_me');
    // The reloaded list still offers the button for the remaining session.
    await waitFor(() => expect(api.lists()).toBeGreaterThanOrEqual(3));
    expect(screen.getByRole('button', { name: 'Sign out all other sessions' })).toBeInTheDocument();
  });
});
