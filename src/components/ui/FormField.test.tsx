import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormField } from './FormField';
import { Input } from './Input';

function Harness({ onSubmit }: { onSubmit: () => void }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <FormField label="Full name" required>
        <Input />
      </FormField>
      <FormField label="Expires on">
        <Input type="date" min="2026-11-07" />
      </FormField>
      <button type="submit">Save</button>
    </form>
  );
}

describe('FormField', () => {
  it('shows the browser refusal as an inline, translated error and blocks the submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
    const name = screen.getByRole('textbox', { name: /Full name/ });
    expect(screen.getByText('Fill in this field.')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Fill in this field.');
    expect(name).toHaveFocus();

    await user.type(name, 'Ada');
    expect(screen.queryByText('Fill in this field.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps the error from the caller first', () => {
    render(
      <FormField label="Slug" error="Already taken">
        <Input required />
      </FormField>,
    );
    expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveAccessibleDescription(
      'Already taken',
    );
  });
});
