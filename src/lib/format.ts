import { useTranslation } from 'react-i18next';

export function formatDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatRelative(value: string | null | undefined, locale: string, now = Date.now()) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.round((date.getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(seconds, 'second');
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** The Intl locale for a UI language: regional defaults for en/de, the tag itself otherwise. */
export function intlLocale(language: string): string {
  if (language === 'de') return 'de-DE';
  if (language === 'en') return 'en-US';
  return language;
}

/** Locale-aware formatters bound to the current UI language. */
export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = intlLocale(i18n.language);
  return {
    locale,
    dateTime: (value: string | null | undefined) => formatDateTime(value, locale),
    relative: (value: string | null | undefined) => formatRelative(value, locale),
    number: (value: number) => formatNumber(value, locale),
  };
}
