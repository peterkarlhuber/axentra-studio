import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { LoginPage } from './LoginPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { VerifyEmailPage } from './VerifyEmailPage';

function Where({ label }: { label: string }) {
  const location = useLocation();
  return <p data-testid="where">{`${label} ${location.pathname}${location.search}`}</p>;
}

const empty = (status: number) =>
  new Response(null, { status, headers: { 'Content-Length': '0' } });
const unauthenticated = () =>
  jsonResponse({ code: 'unauthenticated', status: 401 }, { status: 401 });
const invalidToken = () =>
  jsonResponse(
    {
      code: 'invalid_token',
      status: 400,
      title: 'Invalid or expired link',
      detail: 'the link is invalid, expired or was already used',
    },
    { status: 400 },
  );

/** Records every request (cloned, so bodies can be read) and answers with `handler`. */
function serve(handler: (request: Request) => Response | Promise<Response>): Request[] {
  const calls: Request[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      calls.push(request.clone());
      if (new URL(request.url).pathname === '/v1/auth/session') return unauthenticated();
      return handler(request);
    },
  });
  return calls;
}

const posted = (calls: Request[], path: string) =>
  calls.filter((c) => c.method === 'POST' && new URL(c.url).pathname === path);

function routes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/profile" element={<Where label="profile" />} />
    </Routes>
  );
}

afterEach(() => configureApi({ baseUrl: '' }));

describe('password reset', () => {
  it('leads from the sign-in page to a neutral confirmation', async () => {
    const calls = serve(() => empty(202));
    renderWithProviders(routes(), { route: '/login' });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/Email/), 'ada@example.com');
    await user.click(screen.getByRole('link', { name: 'Forgot your password?' }));
    // The address typed on the sign-in page is carried over.
    const email = await screen.findByLabelText(/Email/);
    expect(email).toHaveValue('ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
    expect(
      screen.getByText(/If an account with a password exists for ada@example.com/),
    ).toBeInTheDocument();
    const [request] = posted(calls, '/v1/auth/password-reset');
    expect(await request!.json()).toEqual({ email: 'ada@example.com' });
  });

  it('is not offered when the server has no password sign-in', async () => {
    serve(() => empty(202));
    renderWithProviders(routes(), {
      route: '/forgot-password',
      meta: { ...testMeta, auth: { ...testMeta.auth, password: false } },
    });
    expect(await screen.findByText('No sign-in method available')).toBeInTheDocument();
  });

  it('sets the new password with the token, removes it from the address and signs in again', async () => {
    const calls = serve((request) =>
      new URL(request.url).pathname === '/v1/auth/password-reset/confirm' ? empty(204) : empty(404),
    );
    renderWithProviders(
      <>
        {routes()}
        <Routes>
          <Route path="*" element={<Where label="at" />} />
        </Routes>
      </>,
      { route: '/reset-password?token=axpwr_secret' },
    );
    // The token leaves the address bar at once.
    await waitFor(() =>
      expect(screen.getByTestId('where')).toHaveTextContent('at /reset-password'),
    );
    expect(screen.getByTestId('where')).not.toHaveTextContent('axpwr_secret');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^New password/), 'a brand new passphrase');
    await user.type(screen.getByLabelText(/^Repeat password/), 'a brand new passphrase');
    await user.click(screen.getByRole('button', { name: 'Save new password' }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('at /login'));
    const [request] = posted(calls, '/v1/auth/password-reset/confirm');
    expect(await request!.json()).toEqual({
      token: 'axpwr_secret',
      new_password: 'a brand new passphrase',
    });
  });

  it('checks the repeated password before sending', async () => {
    const calls = serve(() => empty(204));
    renderWithProviders(routes(), { route: '/reset-password?token=axpwr_t' });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/^New password/), 'a brand new passphrase');
    await user.type(screen.getByLabelText(/^Repeat password/), 'something else entirely');
    await user.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByText('The passwords do not match.')).toBeInTheDocument();
    expect(posted(calls, '/v1/auth/password-reset/confirm')).toHaveLength(0);
  });

  it('shows a policy refusal at the field and keeps the form', async () => {
    serve(() =>
      jsonResponse(
        {
          code: 'validation_failed',
          status: 422,
          reason: 'too_short',
          min_length: 12,
          errors: [{ loc: ['body', 'new_password'], msg: 'too short' }],
        },
        { status: 422 },
      ),
    );
    renderWithProviders(routes(), { route: '/reset-password?token=axpwr_t' });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/^New password/), 'shortpass12');
    await user.type(screen.getByLabelText(/^Repeat password/), 'shortpass12');
    await user.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByText('Use at least 12 characters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save new password' })).toBeInTheDocument();
  });

  it('explains an invalid link and offers a new one', async () => {
    serve(invalidToken);
    renderWithProviders(routes(), { route: '/reset-password?token=axpwr_used' });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/^New password/), 'a brand new passphrase');
    await user.type(screen.getByLabelText(/^Repeat password/), 'a brand new passphrase');
    await user.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByText('This link cannot be used')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('says so at once when the address has no token', async () => {
    serve(() => empty(404));
    renderWithProviders(routes(), { route: '/reset-password' });
    expect(await screen.findByText('This link cannot be used')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^New password/)).not.toBeInTheDocument();
  });
});

describe('email verification link', () => {
  it('confirms only on a click', async () => {
    const calls = serve(() => empty(204));
    renderWithProviders(routes(), { route: '/verify-email?token=axemv_t' });
    const button = await screen.findByRole('button', { name: 'Confirm email address' });
    expect(posted(calls, '/v1/auth/email-verification/confirm')).toHaveLength(0);
    await userEvent.setup().click(button);
    expect(await screen.findByText('Email address confirmed')).toBeInTheDocument();
    const [request] = posted(calls, '/v1/auth/email-verification/confirm');
    expect(await request!.json()).toEqual({ token: 'axemv_t' });
  });

  it('explains an invalid link', async () => {
    serve(invalidToken);
    renderWithProviders(routes(), { route: '/verify-email?token=axemv_old' });
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Confirm email address' }));
    expect(await screen.findByText('This link cannot be used')).toBeInTheDocument();
  });
});
