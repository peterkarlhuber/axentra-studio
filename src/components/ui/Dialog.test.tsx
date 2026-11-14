import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Dialog } from './Dialog';

function Harness() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  return (
    <>
      <p>{open ? 'open' : 'closed'}</p>
      <Dialog open={open} onOpenChange={setOpen} title="Edit role" dirty={value !== ''}>
        <label>
          Name
          <input value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
      </Dialog>
    </>
  );
}

function OpenerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>New tenant</button>
      <Dialog open={open} onOpenChange={setOpen} title="Create tenant" />
    </>
  );
}

describe('Dialog', () => {
  it('gives the focus back to the button that opened it (no Radix trigger)', async () => {
    const user = userEvent.setup();
    render(<OpenerHarness />);
    await user.click(screen.getByRole('button', { name: 'New tenant' }));
    await screen.findByRole('dialog', { name: 'Create tenant' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'New tenant' })).toHaveFocus();
  });

  it('closes on Escape without asking while nothing was entered', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByRole('dialog', { name: 'Edit role' });
    await user.keyboard('{Escape}');
    expect(await screen.findByText('closed')).toBeInTheDocument();
  });

  it('asks before unsaved input is discarded by Escape or the close button', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await screen.findByRole('dialog', { name: 'Edit role' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Ops');

    await user.keyboard('{Escape}');
    const ask = await screen.findByRole('dialog', { name: 'Discard your changes?' });
    await user.click(within(ask).getByRole('button', { name: 'Keep editing' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Discard your changes?' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Ops');

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await user.click(
      within(await screen.findByRole('dialog', { name: 'Discard your changes?' })).getByRole(
        'button',
        { name: 'Discard changes' },
      ),
    );
    expect(await screen.findByText('closed')).toBeInTheDocument();
  });
});
