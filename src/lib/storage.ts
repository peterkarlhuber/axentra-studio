/**
 * Per-browser preferences in localStorage. Every access is guarded: storage can be
 * unavailable (private mode, blocked site data) and the app must work without it.
 */
const PREFIX = 'axentra.studio.';

export type PreferenceKey = 'locale' | 'theme' | 'sidebarCollapsed' | 'lastProductId';

export function readPreference(key: PreferenceKey): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writePreference(key: PreferenceKey, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage unavailable: the preference simply does not persist.
  }
}
