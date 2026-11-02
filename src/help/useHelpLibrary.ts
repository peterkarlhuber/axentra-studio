import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { MetaContext } from '@/app/contexts';
import { readPreference } from '@/lib/storage';
import { useTranslation } from 'react-i18next';
import { isLocale, type Locale } from '@/i18n';
import { loadLibrary } from './content';

export function useHelpLocale(): Locale {
  const { i18n } = useTranslation();
  return isLocale(i18n.language) ? i18n.language : 'en';
}

/** All articles of the current UI language (loaded once per language, then cached). */
export function useHelpLibrary() {
  const locale = useHelpLocale();
  return useQuery({
    queryKey: ['help-library', locale],
    queryFn: () => loadLibrary(locale),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Product for `app:` links in articles: the product in single-product mode, else the last used
 * one. Works without server metadata (the help center is reachable when the API is not).
 */
export function useHelpProductId(): string | undefined {
  const meta = useContext(MetaContext);
  if (meta?.mode === 'single' && meta.product?.id) return meta.product.id;
  return readPreference('lastProductId') ?? undefined;
}
