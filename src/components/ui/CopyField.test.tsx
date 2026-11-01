import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CopyField } from './CopyField';
import { TooltipProvider } from './Tooltip';
import { ToastProvider } from './Toast';
import { useToast } from './toast-context';

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('CopyField', () => {
  it('masks secrets until revealed', async () => {
    renderWithTooltip(<CopyField label="Secret" value="s3cr3t" secret />);
    const input = screen.getByLabelText('Secret');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show value' }));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('copies to the clipboard and announces it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    renderWithTooltip(<CopyField label="Key" value="ax_123" />);
    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    expect(writeText).toHaveBeenCalledWith('ax_123');
    expect(await screen.findByRole('status')).toHaveTextContent('Copied to clipboard');
  });

  it('reports a clipboard failure', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    renderWithTooltip(<CopyField label="Key" value="ax_123" />);
    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    expect(await screen.findByRole('status')).not.toHaveTextContent(/^$/);
  });
});

function ToastTrigger() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.error('Save failed', 'Try again later', 'req-42')}>
      fail
    </button>
  );
}

describe('Toast', () => {
  it('shows an error toast with the request id', async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'fail' }));
    });
    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
    expect(screen.getAllByText(/req-42/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
  });
});
