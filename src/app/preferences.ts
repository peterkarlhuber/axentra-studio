import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { meApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { isLocale, setLocale, type Locale } from '@/i18n';
import { readPreference } from '@/lib/storage';
import { isThemePreference, type ThemePreference } from '@/lib/theme';
import { useMe } from './auth';
import { useTheme } from './theme-context';

/**
 * Language and theme live in localStorage (instant, works signed out) and in the user's
 * server-side preferences via `PATCH /v1/me` (follows the user across browsers).
 */
export function usePreferences() {
  const { i18n } = useTranslation();
  const { preference: theme, setPreference: setThemeLocal } = useTheme();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  const save = useMutation({
    mutationFn: meApi.update,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  });

  const locale: Locale = isLocale(i18n.language) ? i18n.language : 'en';

  const setLanguage = (next: Locale) => {
    void setLocale(next);
    if (me?.user) save.mutate({ locale: next });
  };

  const setTheme = (next: ThemePreference) => {
    setThemeLocal(next);
    if (me?.user) save.mutate({ preferences: { ...(me.user.preferences ?? {}), theme: next } });
  };

  return { locale, theme, setLanguage, setTheme, saving: save.isPending, saveError: save.error };
}

/**
 * On first load of `/v1/me`, adopt the server-side preferences when this browser has no
 * explicit local choice yet.
 */
export function useAdoptServerPreferences() {
  const { data: me } = useMe();
  const { setPreference } = useTheme();
  const adopted = useRef(false);

  useEffect(() => {
    if (!me?.user || adopted.current) return;
    adopted.current = true;
    const serverLocale = me.user.locale?.toLowerCase().split(/[-_]/)[0];
    if (!readPreference('locale') && isLocale(serverLocale)) void setLocale(serverLocale);
    const serverTheme = me.user.preferences?.theme;
    if (!readPreference('theme') && isThemePreference(serverTheme)) setPreference(serverTheme);
  }, [me, setPreference]);
}
