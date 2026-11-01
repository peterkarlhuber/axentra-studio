/**
 * Loads every `locales/<lng>/<namespace>.json` file at build time.
 * One namespace per feature; `npm run i18n:check` verifies both locales have identical keys.
 */
type Tree = { [key: string]: string | Tree };

const modules = import.meta.glob<{ default: Tree }>('./locales/*/*.json', { eager: true });

export const SUPPORTED_LOCALES = ['en', 'de'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

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
