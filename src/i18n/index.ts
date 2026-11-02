import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readPreference, writePreference } from '@/lib/storage';
import type { BackendModule } from 'i18next';
import {
  loadNamespace,
  LOCALE_NAMES,
  namespaces,
  resources,
  SUPPORTED_LOCALES,
  type Locale,
} from './resources';

export { LOCALE_NAMES, SUPPORTED_LOCALES, type Locale };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Map any BCP 47 tag ("de-AT", "en_US", "pt-PT", "pt_br") to a supported locale, or null.
 * Portuguese of any region maps to pt-BR, the only Portuguese variant Studio ships.
 */
export function matchLocale(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  if (base === 'pt') return 'pt-BR';
  return isLocale(base) ? base : null;
}

export function detectLocale(): Locale {
  const stored = matchLocale(readPreference('locale'));
  if (stored) return stored;
  const languages = typeof navigator !== 'undefined' ? (navigator.languages ?? []) : [];
  for (const tag of languages) {
    const match = matchLocale(tag);
    if (match) return match;
  }
  return 'en';
}

export function setLocale(locale: Locale): Promise<unknown> {
  writePreference('locale', locale);
  return i18n.changeLanguage(locale);
}

/** Loads non-English languages on demand from their lazy chunks. */
const lazyBackend: BackendModule = {
  type: 'backend',
  init: () => undefined,
  read: (language, namespace, callback) => {
    loadNamespace(language, namespace).then(
      (data) => callback(null, data),
      (error: unknown) => callback(error instanceof Error ? error : new Error(String(error)), null),
    );
  },
};

/** Resolves when the initial language is loaded; `main.tsx` waits for it before rendering. */
export const i18nReady = i18n
  .use(lazyBackend)
  .use(initReactI18next)
  .init({
    resources,
    partialBundledLanguages: true,
    lng: detectLocale(),
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: namespaces,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });

const syncDocumentLanguage = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
syncDocumentLanguage(i18n.language);
i18n.on('languageChanged', syncDocumentLanguage);

export default i18n;
