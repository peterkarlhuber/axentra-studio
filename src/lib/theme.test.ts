import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme } from './theme';

describe('applyTheme', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.removeAttribute('data-theme-switching');
  });

  it('suspends transitions until the new theme has been painted', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');

    applyTheme('dark');
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root).toHaveAttribute('data-theme-switching');
    frames.shift()?.(0);
    expect(root).toHaveAttribute('data-theme-switching');
    frames.shift()?.(0);
    expect(root).not.toHaveAttribute('data-theme-switching');
  });

  it('does nothing when the theme is unchanged', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    document.documentElement.setAttribute('data-theme', 'dark');
    applyTheme('dark');
    expect(document.documentElement).not.toHaveAttribute('data-theme-switching');
    expect(raf).not.toHaveBeenCalled();
  });
});
