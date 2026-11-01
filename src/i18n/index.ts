import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readPreference, writePreference } from '@/lib/storage';
import { namespaces, resources, SUPPORTED_LOCALES, type Locale } from './resources';

export { SUPPORTED_LOCALES, type Locale };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Map any BCP 47 tag ("de-AT", "en_US") to a supported locale, or null. */
export function matchLocale(tag: string | null | undefined): Locale | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
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

void i18n.use(initReactI18next).init({
  resources,
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
