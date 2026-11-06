import { screen, waitFor } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { RequireAuth } from '@/app/guards';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';
import { readPendingInvitation } from '@/features/tenants/invitationLink';
import { LoginPage } from './LoginPage';

/**
 * Security review round 3, probe `LowsProbe.test.tsx` (NF-2, NF-3): a signed-out visitor opens
 * an invitation link in any spelling the router accepts. Neither the sign-in page URL nor the
 * single sign-on start link may hold the token; the tab keeps it for the accept page.
 */
function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}${location.hash}`}</p>;
}

afterEach(() => configureApi({ baseUrl: '' }));

describe('signed-out invitation links', () => {
  it.each([
    '/invitations/accept?token=SECRET1',
    '/invitations/accept/?token=SECRET2',
    '/INVITATIONS/accept?token=SECRET3',
    '/invitations/accept?token=SECRET4&token=SECRET4b',
    '/Invitations/Accept/?TOKEN=SECRET6',
    '/invitations/%61ccept?token=SECRET7',
  ])('%s', async (link) => {
    window.sessionStorage.clear();
    const calls: Request[] = [];
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        calls.push(request);
        return jsonResponse({ code: 'unauthenticated', status: 401 }, { status: 401 });
      },
    });
    renderWithProviders(
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/invitations/accept" element={<p>accept</p>} />
          </Route>
        </Routes>
        <Where />
      </>,
      {
        route: link,
        meta: {
          ...testMeta,
          auth: { ...testMeta.auth, password: true, oidc: [{ id: 'corp', name: 'Corp SSO' }] },
        },
      },
    );
    const sso = await screen.findByRole('link', { name: /Corp SSO/ });
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent(
        `/login?return_to=${encodeURIComponent('/invitations/accept')}`,
      ),
    );
    const secret = /SECRET\d/.exec(link)?.[0] ?? '';
    expect(readPendingInvitation()).toBe(secret);
    expect(screen.getByTestId('where').textContent).not.toContain('SECRET');
    expect(sso.getAttribute('href')).not.toContain('SECRET');
    expect(screen.getByText('Sign in to accept your invitation')).toBeInTheDocument();
    expect(calls.every((call) => !call.url.includes('SECRET'))).toBe(true);
  });
});
