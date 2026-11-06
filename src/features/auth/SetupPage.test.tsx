import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse, renderWithProviders, testMeta } from '@/test/utils';
import { SetupPage } from './SetupPage';

function conflict(code: string, detail: string) {
  return jsonResponse(
    { code, status: 409, title: 'Conflict', detail, request_id: 'req-1' },
    { status: 409 },
  );
}

function setup(answer: () => Response) {
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      const path = new URL(request.url).pathname;
      if (path === '/v1/auth/setup') return answer();
      if (path === '/v1/meta') return jsonResponse({ ...testMeta, setup_required: true });
      return jsonResponse({ code: 'unauthenticated', status: 401 }, { status: 401 });
    },
  });
  renderWithProviders(
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<p>login page</p>} />
    </Routes>,
    { route: '/setup', meta: { ...testMeta, setup_required: true } },
  );
}

async function submit() {
  const user = userEvent.setup();
  await user.type(
    await screen.findByLabelText(/Setup token/, { selector: 'input' }),
    'axsetup_token',
  );
  await user.type(screen.getByLabelText(/Email address/, { selector: 'input' }), 'ada@example.com');
  await user.type(screen.getByLabelText(/Full name/, { selector: 'input' }), 'Ada');
  await user.type(
    screen.getByLabelText(/^Password/, { selector: 'input' }),
    'a long enough password',
  );
  await user.type(
    screen.getByLabelText(/Repeat password/, { selector: 'input' }),
    'a long enough password',
  );
  await user.click(screen.getByRole('button', { name: 'Create administrator' }));
  return screen.findByRole('alert');
}

afterEach(() => configureApi({ baseUrl: '' }));

describe('SetupPage conflicts', () => {
  it('recognizes setup_already_completed by its code, whatever the message says', async () => {
    setup(() => conflict('setup_already_completed', 'reworded by a newer backend'));
    const alert = await submit();
    expect(alert).toHaveTextContent('Setup is already complete');
    expect(alert).toHaveTextContent('A platform administrator already exists');
    expect(alert).not.toHaveTextContent('reworded by a newer backend');
  });

  it('shows email_taken as its own error with the server reason', async () => {
    setup(() => conflict('email_taken', 'a user with this email address exists'));
    const alert = await submit();
    expect(alert).toHaveTextContent('Email address in use');
    expect(alert).toHaveTextContent('a user with this email address exists');
    expect(alert).not.toHaveTextContent('Setup is already complete');
  });

  it('falls back to the message text for older backends (code conflict)', async () => {
    setup(() => conflict('conflict', 'setup was already completed'));
    const alert = await submit();
    expect(alert).toHaveTextContent('Setup is already complete');
  });

  it('treats an older backend email conflict as a plain conflict with the reason', async () => {
    setup(() => conflict('conflict', 'a user with this email address exists'));
    const alert = await submit();
    expect(alert).toHaveTextContent('Conflict');
    expect(alert).toHaveTextContent('a user with this email address exists');
    expect(alert).not.toHaveTextContent('Setup is already complete');
  });
});

describe('SetupPage password policy', () => {
  it('shows the minimum length from the server and a refusal at the password field', async () => {
    configureApi({
      baseUrl: 'http://axentra.test',
      fetch: async (request: Request) => {
        const path = new URL(request.url).pathname;
        if (path === '/v1/auth/setup')
          return jsonResponse(
            {
              code: 'validation_failed',
              status: 422,
              title: 'Validation failed',
              detail: 'the password must have at least 16 characters',
              reason: 'too_short',
              min_length: 16,
              errors: [
                { loc: ['body', 'password'], msg: 'the password must have at least 16 characters' },
              ],
            },
            { status: 422 },
          );
        return jsonResponse({ code: 'unauthenticated', status: 401 }, { status: 401 });
      },
    });
    const meta = {
      ...testMeta,
      setup_required: true,
      auth: { ...testMeta.auth, password_policy: { min_length: 16, max_length: 1024 } },
    };
    renderWithProviders(
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
      </Routes>,
      { route: '/setup', meta },
    );
    expect(
      await screen.findByText('At least 16 characters. Not your email address.'),
    ).toBeInTheDocument();
    await submit();
    const field = screen.getByLabelText(/^Password/, { selector: 'input' });
    expect(field).toHaveAccessibleDescription(/Use at least 16 characters\./);
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });
});
