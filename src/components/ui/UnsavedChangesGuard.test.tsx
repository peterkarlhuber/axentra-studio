import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { createMemoryRouter, Link, MemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { UnsavedChangesGuard } from './UnsavedChangesGuard';

function Form() {
  const [value, setValue] = useState('');
  return (
    <>
      <h1>Form page</h1>
      <UnsavedChangesGuard when={value !== ''} />
      <label>
        Name
        <input value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <Link to="/other">Other page</Link>
      <Link to="?tab=2">Second tab</Link>
    </>
  );
}

function renderRouter() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <Form /> },
      { path: '/other', element: <h1>Other page</h1> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

function beforeUnloadPrevented() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('UnsavedChangesGuard', () => {
  it('navigates without asking while the form is clean', async () => {
    const user = userEvent.setup();
    renderRouter();
    expect(beforeUnloadPrevented()).toBe(false);
    await user.click(screen.getByRole('link', { name: 'Other page' }));
    expect(await screen.findByRole('heading', { name: 'Other page' })).toBeInTheDocument();
  });

  it('asks before leaving a page with unsaved input, and stays on cancel', async () => {
    const user = userEvent.setup();
    const router = renderRouter();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    expect(beforeUnloadPrevented()).toBe(true);

    await user.click(screen.getByRole('link', { name: 'Other page' }));
    const dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');

    await user.click(screen.getByRole('link', { name: 'Other page' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Leave page' }),
    );
    expect(await screen.findByRole('heading', { name: 'Other page' })).toBeInTheDocument();
    expect(beforeUnloadPrevented()).toBe(false);
  });

  it('does not block changes of the query string on the same page', async () => {
    const user = userEvent.setup();
    const router = renderRouter();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    await user.click(screen.getByRole('link', { name: 'Second tab' }));
    expect(router.state.location.search).toBe('?tab=2');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('works without a data router (beforeunload only)', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Form />
      </MemoryRouter>,
    );
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    expect(beforeUnloadPrevented()).toBe(true);
  });
});
