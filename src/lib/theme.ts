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

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function persistThemePreference(preference: ThemePreference): void {
  writePreference('theme', preference);
}
