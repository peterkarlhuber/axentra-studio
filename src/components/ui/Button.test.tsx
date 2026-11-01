import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { FormField } from './FormField';
import { Input } from './Input';
import { StatusPill } from './Badge';
import { toneForStatus } from './status';
import { toSortParam } from './sort';

describe('Button', () => {
  it('defaults to type=button and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and busy while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Save/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('FormField', () => {
  it('wires label, help, error and required state to the control', () => {
    render(
      <FormField label="Email" help="Used for login" error="Invalid address" required>
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Invalid address Used for login');
  });

  it('leaves a valid field without aria-invalid', () => {
    render(
      <FormField label="Name">
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid', 'true');
  });
});

describe('StatusPill', () => {
  it('translates known statuses and keeps unknown ones', () => {
    const { rerender } = render(<StatusPill status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    rerender(<StatusPill status="weird_state" />);
    expect(screen.getByText('weird_state')).toBeInTheDocument();
  });

  it('maps statuses to tones', () => {
    expect(toneForStatus('ACTIVE')).toBe('success');
    expect(toneForStatus('suspended')).toBe('warning');
    expect(toneForStatus('revoked')).toBe('danger');
    expect(toneForStatus('mystery')).toBe('neutral');
    expect(toneForStatus(null)).toBe('neutral');
  });
});

describe('toSortParam', () => {
  it('builds the API sort parameter', () => {
    expect(toSortParam({ key: 'created_at', direction: 'desc' })).toBe('-created_at');
    expect(toSortParam({ key: 'id', direction: 'asc' })).toBe('id');
    expect(toSortParam(null)).toBeUndefined();
  });
});
