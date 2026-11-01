import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './theme-context';

function Probe() {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <div>
      <output aria-label="state">{`${preference}/${resolved}`}</output>
      <button type="button" onClick={() => setPreference('dark')}>
        dark
      </button>
      <button type="button" onClick={() => setPreference('light')}>
        light
      </button>
      <button type="button" onClick={() => setPreference('system')}>
        system
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  it('follows the system preference by default', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('state')).toHaveTextContent('system/light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('toggles data-theme and persists the choice', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'dark' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('axentra.studio.theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'light' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem('axentra.studio.theme')).toBe('light');
  });

  it('restores a stored preference', () => {
    window.localStorage.setItem('axentra.studio.theme', 'dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('state')).toHaveTextContent('dark/dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
