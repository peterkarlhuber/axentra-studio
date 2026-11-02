/**
 * Backend modules as reported by `GET /v1/meta` `modules[]` (see the backend's
 * `axentra.config.settings.MODULES`). `identity`, `tenancy`, `access` and `audit` are always
 * enabled on a valid server; the others are optional.
 */
export const MODULE_IDS = {
  tenants: 'tenancy',
  users: 'identity',
  access: 'access',
  records: 'data',
  files: 'storage',
  jobs: 'events',
  events: 'events',
  webhooks: 'events',
  usage: 'usage',
  billing: 'billing',
  notifications: 'notify',
  audit: 'audit',
} as const satisfies Record<string, string>;

export type StudioModule = keyof typeof MODULE_IDS;

/** Sections whose Studio screens exist in this release (Phase 1). */
export const IMPLEMENTED_MODULES: ReadonlySet<StudioModule> = new Set<StudioModule>([
  'tenants',
  'users',
  'access',
  'records',
  'audit',
  // Data & Storage
  'files',
  // Usage & Billing (studio-billing)
  'usage',
  'billing',
]);

export function isModuleEnabled(modules: readonly string[] | undefined, module: StudioModule) {
  if (!modules) return false;
  return modules.map((value) => value.toLowerCase()).includes(MODULE_IDS[module]);
}

/** Distinct backend module ids, for the dashboard's module overview. */
export const BACKEND_MODULES = [
  'identity',
  'tenancy',
  'access',
  'data',
  'audit',
  'storage',
  'events',
  'usage',
  'billing',
  'notify',
  'search',
  'realtime',
] as const;
