import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import { loginPath, safeReturnPath } from '@/app/auth';
import { jsonResponse, renderWithProviders } from '@/test/utils';
import { AcceptInvitationAlias } from './AcceptInvitationAlias';
import { AcceptInvitationPage } from './AcceptInvitationPage';
import {
  acceptInvitationPath,
  invitationSentWithSso,
  invitationTokenFromPath,
  markInvitationSentWithSso,
  readPendingInvitation,
  withoutInvitationToken,
  writePendingInvitation,
} from './invitationLink';

const TOKEN = 'axinv_secret/+token';

const user = (email: string | null) => ({
  id: 'usr_1',
  email,
  name: email ? email.split('@')[0] : 'No Mail',
  has_password: Boolean(email),
});

const session = (email: string | null = 'kim@example.com') => ({
  csrf_token: 'csrf-1',
  expires_at: '2030-01-01T00:00:00Z',
  platform_role: null,
  session_id: 'ses_1',
  user: user(email),
});

const membership = {
  id: 'mem_1',
  product_id: 'prd_1',
  tenant_id: 'ten_1',
  user_id: 'usr_1',
  role: 'member',
  email: 'kim@example.com',
  name: 'kim',
  created_at: '2026-11-02T00:00:00Z',
};

const me = {
  actor_kind: 'user',
  platform_permissions: [],
  platform_role: null,
  user: user('kim@example.com'),
  products: [
    {
      permissions: [],
      role: null,
      product: { id: 'prd_1', name: 'CRM' },
      tenants: [{ permissions: [], role: 'member', tenant: { id: 'ten_1', name: 'Acme' } }],
    },
  ],
};

function problem(status: number, code: string, detail: string) {
  return jsonResponse({ status, code, title: code, detail }, { status });
}

/** Shows the current location so tests can assert that the token left the address bar. */
function Where() {
  const location = useLocation();
  return <output data-testid="where">{`${location.pathname}${location.search}`}</output>;
}

function setup(
  route: string,
  accept: (request: Request) => Response | Promise<Response>,
  email: string | null = 'kim@example.com',
) {
  const calls: { path: string; body: unknown }[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      const path = new URL(request.url).pathname;
      calls.push({
        path,
        body: request.method === 'POST' ? await request.clone().text() : null,
      });
      if (path === '/v1/auth/session') return jsonResponse(session(email));
      if (path === '/v1/me') return jsonResponse(me);
      if (path === '/v1/auth/logout') return new Response(null, { status: 204 });
      if (path === '/v1/invitations/accept') return accept(request);
      return jsonResponse({});
    },
  });
  renderWithProviders(
    <>
      <Routes>
        <Route path="/accept-invitation" element={<AcceptInvitationAlias />} />
        <Route path="/invitations/accept" element={<AcceptInvitationPage />} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
      <Where />
    </>,
    { route },
  );
  return calls;
}

beforeEach(() => window.sessionStorage.clear());
afterEach(() => {
  configureApi({ baseUrl: '' });
  setCsrfToken(null);
});

describe('invitation links', () => {
  it('keeps accept-page return paths through sign-in, with the token', () => {
    const path = acceptInvitationPath(TOKEN);
    expect(safeReturnPath(path)).toBe(path);
    expect(loginPath(path)).toBe(`/login?return_to=${encodeURIComponent(path)}`);
    expect(invitationTokenFromPath(path)).toBe(TOKEN);
    expect(invitationTokenFromPath('/invitations/accept')).toBeNull();
    expect(invitationTokenFromPath('/audit?token=x')).toBeNull();
  });

  it('strips only the token from accept-page return paths', () => {
    expect(withoutInvitationToken(acceptInvitationPath(TOKEN))).toBe('/invitations/accept');
    expect(withoutInvitationToken(`/invitations/accept?a=1&token=${TOKEN}&b=2#x`)).toBe(
      '/invitations/accept?a=1&b=2#x',
    );
    expect(withoutInvitationToken('/invitations/accept')).toBe('/invitations/accept');
    expect(withoutInvitationToken('/audit?token=x')).toBe('/audit?token=x');
  });

  it('forwards the public /accept-invitation link to the accept page and strips the token', async () => {
    const calls = setup(`/accept-invitation?token=${encodeURIComponent(TOKEN)}`, () =>
      jsonResponse(membership),
    );
    const field = await screen.findByLabelText(/Invitation token/);
    expect(field).toHaveValue(TOKEN);
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent(/^\/invitations\/accept$/),
    );
    expect(screen.getByText(/Filled in from your invitation link/)).toBeInTheDocument();
    // Kept for this tab only, so it survives a sign-in; nothing is sent before confirming.
    expect(readPendingInvitation()).toBe(TOKEN);
    expect(calls.some((call) => call.path === '/v1/invitations/accept')).toBe(false);
    expect(await screen.findByTestId('accept-signed-in-as')).toHaveTextContent(
      'Signed in as kim@example.com',
    );
  });

  it('accepts after confirmation and names the tenant', async () => {
    const calls = setup(`/invitations/accept?token=${encodeURIComponent(TOKEN)}`, () =>
      jsonResponse(membership),
    );
    const userEvt = userEvent.setup();
    await userEvt.click(await screen.findByRole('button', { name: 'Accept invitation' }));
    expect(await screen.findByText('Invitation accepted')).toBeInTheDocument();
    expect(screen.getByText(/member of Acme in CRM with the role member/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the tenant' })).toHaveAttribute(
      'href',
      '/p/prd_1/tenants/ten_1',
    );
    const body = calls.find((call) => call.path === '/v1/invitations/accept')?.body;
    expect(JSON.parse(String(body))).toEqual({ token: TOKEN });
    expect(readPendingInvitation()).toBeNull();
  });

  it('shows an invitation accepted during single sign-on without a second confirmation', async () => {
    writePendingInvitation(TOKEN);
    markInvitationSentWithSso();
    const calls = setup('/invitations/accept?invitation_accepted=ten_1', () =>
      problem(404, 'not_found', 'the invitation is invalid or expired'),
    );
    expect(await screen.findByText('Invitation accepted')).toBeInTheDocument();
    expect(screen.getByText(/member of Acme in CRM with the role member/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the tenant' })).toHaveAttribute(
      'href',
      '/p/prd_1/tenants/ten_1',
    );
    expect(screen.queryByRole('button', { name: 'Accept invitation' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent(/^\/invitations\/accept$/),
    );
    expect(readPendingInvitation()).toBeNull();
    expect(invitationSentWithSso()).toBe(false);
    expect(calls.some((call) => call.path === '/v1/invitations/accept')).toBe(false);
  });

  it('asks for the confirmation when /v1/me does not list the tenant named after single sign-on', async () => {
    writePendingInvitation(TOKEN);
    markInvitationSentWithSso();
    setup('/invitations/accept?invitation_accepted=ten_other', () => jsonResponse(membership));
    expect(await screen.findByLabelText(/Invitation token/)).toHaveValue(TOKEN);
    expect(screen.getByRole('button', { name: 'Accept invitation' })).toBeInTheDocument();
    await waitFor(() => expect(invitationSentWithSso()).toBe(false));
    expect(readPendingInvitation()).toBe(TOKEN);
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/invitations\/accept$/);
  });

  it('ignores invitation_accepted when this tab started no single sign-on with the invitation', async () => {
    writePendingInvitation(TOKEN);
    setup('/invitations/accept?invitation_accepted=ten_1', () => jsonResponse(membership));
    expect(await screen.findByLabelText(/Invitation token/)).toHaveValue(TOKEN);
    expect(screen.getByRole('button', { name: 'Accept invitation' })).toBeInTheDocument();
    expect(screen.queryByText('Invitation accepted')).not.toBeInTheDocument();
    expect(readPendingInvitation()).toBe(TOKEN);
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent(/^\/invitations\/accept$/),
    );
  });

  it('restores the token of this tab after a sign-in without it', async () => {
    writePendingInvitation(TOKEN);
    setup('/invitations/accept', () => jsonResponse(membership));
    expect(await screen.findByLabelText(/Invitation token/)).toHaveValue(TOKEN);
  });

  it('explains the one 404 for unknown, expired, used and revoked invitations', async () => {
    setup(`/invitations/accept?token=${encodeURIComponent(TOKEN)}`, () =>
      problem(404, 'not_found', 'the invitation is invalid or expired'),
    );
    const userEvt = userEvent.setup();
    await userEvt.click(await screen.findByRole('button', { name: 'Accept invitation' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('This invitation cannot be used');
    expect(alert).toHaveTextContent(/expired/);
    expect(alert).toHaveTextContent(/already accepted/);
    expect(alert).toHaveTextContent(/revoked/);
    expect(alert).toHaveTextContent('Ask the person who invited you for a new invitation.');
    expect(readPendingInvitation()).toBeNull();
  });

  it('offers to switch accounts for an invitation to another address', async () => {
    const calls = setup(`/invitations/accept?token=${encodeURIComponent(TOKEN)}`, () =>
      problem(403, 'forbidden', 'this invitation was sent to another email address'),
    );
    const userEvt = userEvent.setup();
    await userEvt.click(await screen.findByRole('button', { name: 'Accept invitation' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /different address than the one of the account you are signed in with \(kim@example.com\)/,
    );
    await userEvt.click(
      screen.getByRole('button', { name: 'Sign out and use the invited address' }),
    );
    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(calls.some((call) => call.path === '/v1/auth/logout')).toBe(true);
    // The sign-in returns to the accept page with the token.
    const where = screen.getByTestId('where').textContent ?? '';
    const returnTo = new URLSearchParams(where.split('?')[1]).get('return_to') ?? '';
    expect(invitationTokenFromPath(returnTo)).toBe(TOKEN);
  });

  it('explains that an account without an email address cannot accept', async () => {
    setup(`/invitations/accept?token=${encodeURIComponent(TOKEN)}`, () => jsonResponse({}), null);
    expect(await screen.findByText('Your account has no email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept invitation' })).toBeDisabled();
  });

  it('offers a retry when the server cannot be reached', async () => {
    let attempts = 0;
    setup(`/invitations/accept?token=${encodeURIComponent(TOKEN)}`, () => {
      attempts += 1;
      return attempts === 1 ? problem(503, 'internal', 'unavailable') : jsonResponse(membership);
    });
    const userEvt = userEvent.setup();
    await userEvt.click(await screen.findByRole('button', { name: 'Accept invitation' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not be reached');
    await userEvt.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Invitation accepted')).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
