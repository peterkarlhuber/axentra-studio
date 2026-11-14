import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApi } from '@/api/client';
import { getCsrfToken, setCsrfToken } from '@/api/csrf';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';
import {
  invitationSentWithSso,
  readPendingInvitation,
  writePendingInvitation,
} from '@/features/tenants/invitationLink';
import { browserNavigation } from '@/lib/browser';
import { LoginPage } from './LoginPage';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}${location.hash}`}</p>;
}

/** Signed out; the POST start answers the identity provider. Returns the requests (cloned). */
function startCalls(): Request[] {
  const calls: Request[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      calls.push(request.clone());
      if (request.method === 'POST' && new URL(request.url).pathname.includes('/oidc/')) {
        return jsonResponse({ redirect_url: 'https://idp.example/authorize' });
      }
      return unauthenticated();
    },
  });
  return calls;
}

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
    // Keyboard users land in the cleared password field, not on <body>.
    expect(screen.getByLabelText(/Password/)).toHaveFocus();
  });

  it('offers OIDC providers as links', async () => {
    configureApi({ baseUrl: 'http://axentra.test', fetch: async () => unauthenticated() });
    renderWithProviders(<LoginPage />, {
      route: '/login',
      meta: {
        ...testMeta,
        auth: { ...testMeta.auth, password: false, oidc: [{ id: 'corp', name: 'Corp SSO' }] },
      },
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

  it('explains a single sign-on that needs an explicit identity link (I5)', async () => {
    configureApi({ baseUrl: 'http://axentra.test', fetch: async () => unauthenticated() });
    renderWithProviders(<LoginPage />, { route: '/login?login_error=explicit_link_required' });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/not linked to your account yet/i);
    expect(alert).toHaveTextContent(/ask a platform administrator to link your sign-in method/i);
    expect(alert).not.toHaveTextContent(/explicit_link_required/);
  });

  it('keeps the deep link that Axentra returns with a failed single sign-on', async () => {
    let loggedIn = false;
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        const path = new URL(request.url).pathname;
        if (path === '/v1/auth/login/password') {
          loggedIn = true;
          return jsonResponse({ csrf_token: 'tok-1' });
        }
        if (path === '/v1/auth/session') return loggedIn ? jsonResponse({}) : unauthenticated();
        return jsonResponse({});
      },
    });
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/audit" element={<p>audit page</p>} />
      </Routes>,
      // Axentra adds the original return_to to the error redirect (same origin, relative).
      { route: '/login?login_error=access_denied&return_to=%2Faudit%3Fq%3Dx' },
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email/), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/), 'correct horse');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('audit page')).toBeInTheDocument();
  });

  it('explains a refused invitation on the GET single sign-on start (R4-1)', async () => {
    configureApi({ baseUrl: 'http://axentra.test', fetch: async () => unauthenticated() });
    renderWithProviders(<LoginPage />, { route: '/login?login_error=invitation_requires_post' });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/only accepts from this sign-in page/i);
    expect(alert).not.toHaveTextContent(/invitation_requires_post/);
  });

  it('explains an invitation sign-in; the token leaves the address bar and goes only in the POST start body', async () => {
    window.sessionStorage.clear();
    const assign = vi.spyOn(browserNavigation, 'assign').mockImplementation(() => {});
    const back = '/invitations/accept?token=axinv_abc';
    let loggedIn = false;
    const calls: Request[] = [];
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        calls.push(request.clone());
        const path = new URL(request.url).pathname;
        if (path === '/v1/auth/login/password') {
          loggedIn = true;
          return jsonResponse({ csrf_token: 'tok-1' });
        }
        if (path === '/v1/auth/oidc/corp/start' && request.method === 'POST') {
          return jsonResponse({ redirect_url: 'https://idp.example/authorize?state=s' });
        }
        return loggedIn ? jsonResponse({}) : unauthenticated();
      },
    });
    renderWithProviders(
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invitations/accept" element={<p>accept page</p>} />
        </Routes>
        <Where />
      </>,
      {
        route: `/login?return_to=${encodeURIComponent(back)}`,
        meta: {
          ...testMeta,
          auth: { ...testMeta.auth, password: true, oidc: [{ id: 'corp', name: 'Corp SSO' }] },
        },
      },
    );
    expect(await screen.findByText('Sign in to accept your invitation')).toBeInTheDocument();
    expect(
      screen.getByText(/Sign in with single sign-on using the invited address/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/continue where you left off/i)).not.toBeInTheDocument();
    // The token is kept for the tab and replaced out of the address bar at once.
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent(
        `/login?return_to=${encodeURIComponent('/invitations/accept')}`,
      ),
    );
    expect(readPendingInvitation()).toBe('axinv_abc');
    // The link itself carries no token (plain GET start, used without JavaScript).
    const link = screen.getByRole('link', { name: /Corp SSO/ });
    const href = link.getAttribute('href') ?? '';
    const start = new URL(href);
    expect(start.pathname).toBe('/v1/auth/oidc/corp/start');
    expect([...start.searchParams.keys()]).toEqual(['return_to']);
    expect(start.searchParams.get('return_to')).toBe(
      `${window.location.origin}/invitations/accept`,
    );
    expect(href).not.toContain('axinv_abc');
    // Both sign-in paths are described: password confirms on the next page, SSO accepts.
    expect(
      screen.getByText(/with single sign-on, it is accepted as soon as you are signed in/),
    ).toBeInTheDocument();
    // Following the SSO link POSTs the token in the body and marks the tab, so the accept
    // page trusts the server's outcome; then the browser goes to the identity provider.
    expect(invitationSentWithSso()).toBe(false);
    await userEvent.setup().click(link);
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://idp.example/authorize?state=s'),
    );
    const post = calls.find((call) => call.method === 'POST' && call.url.includes('/oidc/'));
    expect(post?.url).toBe('http://axentra.test/v1/auth/oidc/corp/start');
    expect(await post?.json()).toEqual({
      return_to: `${window.location.origin}/invitations/accept`,
      invitation: 'axinv_abc',
    });
    expect(calls.every((call) => !call.url.includes('axinv_abc'))).toBe(true);
    expect(invitationSentWithSso()).toBe(true);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email/), 'kim@example.com');
    await user.type(screen.getByLabelText(/Password/), 'correct horse');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText('accept page')).toBeInTheDocument();
  });

  it('falls back to the plain start without the invitation when the server has no POST start', async () => {
    window.sessionStorage.clear();
    writePendingInvitation('axinv_pending');
    const assign = vi.spyOn(browserNavigation, 'assign').mockImplementation(() => {});
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) =>
        request.method === 'POST'
          ? jsonResponse({ detail: 'Method Not Allowed' }, { status: 405 })
          : unauthenticated(),
    });
    renderWithProviders(<LoginPage />, {
      route: `/login?return_to=${encodeURIComponent('/invitations/accept')}`,
      meta: {
        ...testMeta,
        auth: { ...testMeta.auth, password: false, oidc: [{ id: 'corp', name: 'Corp SSO' }] },
      },
    });
    const link = await screen.findByRole('link', { name: /Corp SSO/ });
    await userEvent.setup().click(link);
    await waitFor(() => expect(assign).toHaveBeenCalledWith(link.getAttribute('href')));
    expect(assign.mock.calls[0]?.[0]).not.toContain('axinv_pending');
    // The server did not get the invitation: the accept page asks for the confirmation.
    expect(invitationSentWithSso()).toBe(false);
    expect(readPendingInvitation()).toBe('axinv_pending');
    window.sessionStorage.clear();
  });

  it('shows why a single sign-on with an invitation could not start', async () => {
    window.sessionStorage.clear();
    writePendingInvitation('axinv_pending');
    const assign = vi.spyOn(browserNavigation, 'assign').mockImplementation(() => {});
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) =>
        request.method === 'POST'
          ? jsonResponse({ code: 'forbidden', status: 403, detail: 'no' }, { status: 403 })
          : unauthenticated(),
    });
    renderWithProviders(<LoginPage />, {
      route: `/login?return_to=${encodeURIComponent('/invitations/accept')}`,
      meta: {
        ...testMeta,
        auth: { ...testMeta.auth, password: false, oidc: [{ id: 'corp', name: 'Corp SSO' }] },
      },
    });
    await userEvent.setup().click(await screen.findByRole('link', { name: /Corp SSO/ }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
    expect(invitationSentWithSso()).toBe(false);
    window.sessionStorage.clear();
  });

  it('says truthfully that there is no sign-up without single sign-on', async () => {
    configureApi({ baseUrl: 'http://axentra.test', fetch: async () => unauthenticated() });
    renderWithProviders(<LoginPage />, {
      route: `/login?return_to=${encodeURIComponent('/invitations/accept?token=t')}`,
    });
    expect(await screen.findByText(/This server has no sign-up/)).toBeInTheDocument();
    expect(screen.getByText(/You confirm the invitation on the next page/)).toBeInTheDocument();
  });

  it('returns to a pending invitation after a failed single sign-on without return_to', async () => {
    window.sessionStorage.clear();
    writePendingInvitation('axinv_pending');
    const assign = vi.spyOn(browserNavigation, 'assign').mockImplementation(() => {});
    const calls = startCalls();
    renderWithProviders(<LoginPage />, {
      route: '/login?login_error=access_denied',
      meta: {
        ...testMeta,
        auth: { ...testMeta.auth, password: false, oidc: [{ id: 'corp', name: 'Corp SSO' }] },
      },
    });
    const link = await screen.findByRole('link', { name: /Corp SSO/ });
    const start = new URL(link.getAttribute('href') ?? '');
    expect(start.searchParams.get('return_to')).toBe(
      `${window.location.origin}/invitations/accept`,
    );
    expect(start.searchParams.has('invitation')).toBe(false);
    expect(screen.getByText(/It is accepted as soon as you are signed in/)).toBeInTheDocument();
    await userEvent.setup().click(link);
    await waitFor(() => expect(assign).toHaveBeenCalled());
    const post = calls.find((call) => call.method === 'POST');
    expect((await post?.json())?.invitation).toBe('axinv_pending');
    window.sessionStorage.clear();
  });

  it('keeps other accept-page parameters and the hash in return_to, but not the token', async () => {
    window.sessionStorage.clear();
    const assign = vi.spyOn(browserNavigation, 'assign').mockImplementation(() => {});
    const calls = startCalls();
    const back = '/invitations/accept?lang=de&token=axinv%2Bodd%26token#details';
    renderWithProviders(<LoginPage />, {
      route: `/login?return_to=${encodeURIComponent(back)}`,
      meta: {
        ...testMeta,
        auth: { ...testMeta.auth, password: false, oidc: [{ id: 'corp', name: 'Corp SSO' }] },
      },
    });
    const link = await screen.findByRole('link', { name: /Corp SSO/ });
    const href = link.getAttribute('href') ?? '';
    const start = new URL(href);
    expect(start.searchParams.get('return_to')).toBe(
      `${window.location.origin}/invitations/accept?lang=de#details`,
    );
    expect(href).not.toMatch(/token%3D|token=|axinv/);
    await userEvent.setup().click(link);
    await waitFor(() => expect(assign).toHaveBeenCalled());
    const body = await calls.find((call) => call.method === 'POST')?.json();
    expect(body).toEqual({
      return_to: `${window.location.origin}/invitations/accept?lang=de#details`,
      invitation: 'axinv+odd&token',
    });
    window.sessionStorage.clear();
  });

  it('sends no invitation for other return paths, even with a pending invitation', async () => {
    window.sessionStorage.clear();
    writePendingInvitation('axinv_pending');
    const assign = vi.spyOn(browserNavigation, 'assign').mockImplementation(() => {});
    const calls = startCalls();
    renderWithProviders(<LoginPage />, {
      route: `/login?return_to=${encodeURIComponent('/audit?token=not-an-invitation&tab=2')}`,
      meta: {
        ...testMeta,
        auth: { ...testMeta.auth, password: false, oidc: [{ id: 'corp', name: 'Corp SSO' }] },
      },
    });
    const link = await screen.findByRole('link', { name: /Corp SSO/ });
    const start = new URL(link.getAttribute('href') ?? '');
    // A token-like parameter never goes into return_to (the server would drop it anyway).
    expect(start.searchParams.get('return_to')).toBe(`${window.location.origin}/audit?tab=2`);
    expect(start.searchParams.has('invitation')).toBe(false);
    // A plain sign-on: the link is followed, nothing is POSTed.
    link.addEventListener('click', (event) => event.preventDefault());
    await userEvent.setup().click(link);
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    expect(assign).not.toHaveBeenCalled();
    expect(readPendingInvitation()).toBe('axinv_pending');
    window.sessionStorage.clear();
  });
});
