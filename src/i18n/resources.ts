/**
 * Translations live in `locales/<lng>/<namespace>.json`, one namespace per feature;
 * `npm run i18n:check` verifies all locales have the same keys as English.
 *
 * English (the fallback) is bundled; every other language is a separate chunk per namespace,
 * loaded when it is selected (see `loadNamespace`), so the app does not ship six languages up front.
 */
export type Tree = { [key: string]: string | Tree };

const modules = import.meta.glob<{ default: Tree }>('./locales/en/*.json', { eager: true });
const lazyModules = import.meta.glob<{ default: Tree }>([
  './locales/*/*.json',
  '!./locales/en/*.json',
]);

export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr', 'pt-BR', 'it'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Each language's own name (endonym), shown in language pickers. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  'pt-BR': 'Português (Brasil)',
  it: 'Italiano',
};

export const resources: Record<string, Record<string, Tree>> = {};
const namespaceSet = new Set<string>();

for (const [path, module] of Object.entries(modules)) {
  const match = /\.\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
  if (!match) continue;
  const [, lng, ns] = match as unknown as [string, string, string];
  resources[lng] ??= {};
  resources[lng][ns] = module.default;
  namespaceSet.add(ns);
}

export const namespaces = [...namespaceSet].sort();

/** Loads one namespace of a non-English language (English is always present). */
export async function loadNamespace(lng: string, ns: string): Promise<Tree> {
  if (lng === 'en') return resources.en?.[ns] ?? {};
  const load = lazyModules[`./locales/${lng}/${ns}.json`];
  if (!load) throw new Error(`No translations for ${lng}/${ns}`);
  return (await load()).default;
}
