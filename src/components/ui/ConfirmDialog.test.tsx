import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

function Harness({ onConfirm }: { onConfirm: () => unknown }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <p>{open ? 'open' : 'closed'}</p>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete tenant"
        confirmLabel="Delete"
        confirmText="acme"
        onConfirm={onConfirm}
      />
    </>
  );
}

describe('ConfirmDialog', () => {
  it('enables confirm only after typing the exact text', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    const dialog = await screen.findByRole('dialog', { name: 'Delete tenant' });
    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(dialog).toBeInTheDocument();
    expect(confirm).toBeDisabled();

    const input = screen.getByRole('textbox');
    await user.type(input, 'acm');
    expect(confirm).toBeDisabled();
    await user.type(input, 'e');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText('closed')).toBeInTheDocument());
  });

  it('stays open when the action fails', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error('nope'));
    render(<Harness onConfirm={onConfirm} />);
    await user.type(await screen.findByRole('textbox'), 'acme');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });

  it('cancels without confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('closed')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
