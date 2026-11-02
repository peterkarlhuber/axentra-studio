import { readPreference, writePreference } from './storage';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

export function readThemePreference(): ThemePreference {
  const stored = readPreference('theme');
  return isThemePreference(stored) ? stored : 'system';
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function resolveTheme(preference: ThemePreference, prefersDark = systemPrefersDark()) {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

/**
 * Sets the theme on <html>. A change switches colours instantly: transitions are suspended
 * (`data-theme-switching`, see global.css) until the new styles have been applied.
 */
export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  if (root.getAttribute('data-theme') === theme) return;
  root.setAttribute('data-theme-switching', '');
  root.setAttribute('data-theme', theme);
  // Forcing a layout applies the new styles to the whole document while transitions are off.
  void document.body?.offsetHeight;
  const done = () => root.removeAttribute('data-theme-switching');
  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => window.requestAnimationFrame(done));
  } else {
    done();
  }
}

export function persistThemePreference(preference: ThemePreference): void {
  writePreference('theme', preference);
}
