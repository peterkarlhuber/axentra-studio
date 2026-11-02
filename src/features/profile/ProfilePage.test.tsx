import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import type { Me } from '@/api/models';
import { jsonResponse, renderWithProviders } from '@/test/utils';
import { ProfilePage } from './ProfilePage';

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
});
