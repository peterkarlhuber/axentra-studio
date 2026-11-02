import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { getCsrfToken, setCsrfToken } from '@/api/csrf';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';
import { writePendingInvitation } from '@/features/tenants/invitationLink';
import { LoginPage } from './LoginPage';

const unauthenticated = () =>
  jsonResponse({ code: 'unauthenticated', status: 401 }, { status: 401 });

function setup(handler: (request: Request) => Response) {
  const calls: Request[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      calls.push(request);
      return handler(request);
    },
  });
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/audit" element={<p>audit page</p>} />
    </Routes>,
    { route: '/login?return_to=%2Faudit' },
  );
  return calls;
}

afterEach(() => {
  configureApi({ baseUrl: '' });
  setCsrfToken(null);
});

describe('LoginPage', () => {
  it('logs in, keeps the CSRF token in memory and returns to the original page', async () => {
    let loggedIn = false;
    const calls = setup((request) => {
      const path = new URL(request.url).pathname;
      if (path === '/v1/auth/login/password') {
        loggedIn = true;
        return jsonResponse({ csrf_token: 'tok-1' });
      }
      if (path === '/v1/auth/session') {
        // Answering 401 here proves the page uses the login response, not a cached probe.
        return loggedIn ? jsonResponse({ csrf_token: 'tok-stale' }) : unauthenticated();
      }
      return jsonResponse({});
    });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/Email/), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/), 'correct horse');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('audit page')).toBeInTheDocument();
    expect(getCsrfToken()).toBe('tok-1');
    expect(window.localStorage.length).toBe(0);
    const login = calls.find((call) => call.url.endsWith('/v1/auth/login/password'));
    expect(login?.method).toBe('POST');
  });

  it('shows a translated message for wrong credentials', async () => {
    setup(() => unauthenticated());
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/Email/), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByLabelText(/Password/)).toHaveValue(''));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('offers OIDC providers as links', async () => {
    configureApi({ baseUrl: 'http://axentra.test', fetch: async () => unauthenticated() });
    renderWithProviders(<LoginPage />, {
      route: '/login',
      meta: { ...testMeta, auth: { password: false, oidc: [{ id: 'corp', name: 'Corp SSO' }] } },
    });
    const link = await screen.findByRole('link', { name: /Corp SSO/ });
    expect(link).toHaveAttribute(
      'href',
      `http://axentra.test/v1/auth/oidc/corp/start?return_to=${encodeURIComponent(`${window.location.origin}/`)}`,
    );
  });

  it('explains a failed single sign-on from ?login_error', async () => {
    configureApi({ baseUrl: 'http://axentra.test', fetch: async () => unauthenticated() });
    renderWithProviders(<LoginPage />, { route: '/login?login_error=signup_disabled' });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/no account for you/i);
    expect(screen.queryByText(/continue where you left off/i)).not.toBeInTheDocument();
  });
  it('explains an invitation sign-in and keeps the token in return_to (password and OIDC)', async () => {
    const back = '/invitations/accept?token=axinv_abc';
    let loggedIn = false;
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        const path = new URL(request.url).pathname;
        if (path === '/v1/auth/login/password') {
          loggedIn = true;
          return jsonResponse({ csrf_token: 'tok-1' });
        }
        return loggedIn ? jsonResponse({}) : unauthenticated();
      },
    });
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invitations/accept" element={<p>accept page</p>} />
      </Routes>,
      {
        route: `/login?return_to=${encodeURIComponent(back)}`,
        meta: { ...testMeta, auth: { password: true, oidc: [{ id: 'corp', name: 'Corp SSO' }] } },
      },
    );
    expect(await screen.findByText('Sign in to accept your invitation')).toBeInTheDocument();
    expect(
      screen.getByText(/Sign in with single sign-on using the invited address/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/continue where you left off/i)).not.toBeInTheDocument();
    // OIDC: the API sends the browser back to the accept page with the token; the sign-in
    // itself does not accept (the user confirms on the page).
    const href = screen.getByRole('link', { name: /Corp SSO/ }).getAttribute('href') ?? '';
    const returnTo = new URL(href).searchParams.get('return_to');
    expect(returnTo).toBe(`${window.location.origin}${back}`);
    expect(new URL(href).searchParams.has('invitation')).toBe(false);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email/), 'kim@example.com');
    await user.type(screen.getByLabelText(/Password/), 'correct horse');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText('accept page')).toBeInTheDocument();
  });

  it('says truthfully that there is no sign-up without single sign-on', async () => {
    configureApi({ baseUrl: 'http://axentra.test', fetch: async () => unauthenticated() });
    renderWithProviders(<LoginPage />, {
      route: `/login?return_to=${encodeURIComponent('/invitations/accept?token=t')}`,
    });
    expect(await screen.findByText(/This server has no sign-up/)).toBeInTheDocument();
  });

  it('returns to a pending invitation after a failed single sign-on without return_to', async () => {
    window.sessionStorage.clear();
    writePendingInvitation('axinv_pending');
    configureApi({ baseUrl: 'http://axentra.test', fetch: async () => unauthenticated() });
    renderWithProviders(<LoginPage />, {
      route: '/login?login_error=access_denied',
      meta: { ...testMeta, auth: { password: false, oidc: [{ id: 'corp', name: 'Corp SSO' }] } },
    });
    const link = await screen.findByRole('link', { name: /Corp SSO/ });
    expect(new URL(link.getAttribute('href') ?? '').searchParams.get('return_to')).toBe(
      `${window.location.origin}/invitations/accept`,
    );
    window.sessionStorage.clear();
  });
});
