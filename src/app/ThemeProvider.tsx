import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyTheme,
  persistThemePreference,
  readThemePreference,
  resolveTheme,
  systemPrefersDark,
  type ThemePreference,
} from '@/lib/theme';
import { ThemeContext } from './theme-context';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readThemePreference);
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolved = resolveTheme(preference, prefersDark);

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference: (next: ThemePreference) => {
        persistThemePreference(next);
        setPreferenceState(next);
      },
    }),
    [preference, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
