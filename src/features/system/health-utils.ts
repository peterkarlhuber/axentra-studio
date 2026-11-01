import type { Health } from '@/api/models';

/** `checks` is a map of dependency name -> passing. */
export function healthChecks(health: Health | undefined): { name: string; ok: boolean }[] {
  return Object.entries(health?.checks ?? {})
    .map(([name, ok]) => ({ name, ok: Boolean(ok) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
