import {
  Building2,
  Database,
  FileClock,
  KeyRound,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface StatDefinition {
  icon: LucideIcon;
  labelKey: string;
  /** i18n key of the info tip that says what exactly is counted. */
  hintKey: string;
  /** The info tip when the overview covers only the caller's own tenants (`scope: "tenant"`). */
  tenantHintKey?: string;
  to?: (productId: string) => string;
}

/** Known overview counters; unknown numeric fields are still shown with their raw name. */
export const KNOWN_STATS: Record<string, StatDefinition> = {
  tenants: {
    icon: Building2,
    labelKey: 'stats.tenants',
    hintKey: 'stats.hints.tenants',
    tenantHintKey: 'stats.tenantHints.tenants',
    to: (p) => `/p/${p}/tenants`,
  },
  users: {
    icon: Users,
    labelKey: 'stats.users',
    hintKey: 'stats.hints.users',
    tenantHintKey: 'stats.tenantHints.users',
    to: (p) => `/p/${p}/users`,
  },
  api_keys: {
    icon: KeyRound,
    labelKey: 'stats.apiKeys',
    hintKey: 'stats.hints.apiKeys',
    to: (p) => `/p/${p}/api-keys`,
  },
  records: {
    icon: Database,
    labelKey: 'stats.records',
    hintKey: 'stats.hints.records',
    tenantHintKey: 'stats.tenantHints.records',
    to: (p) => `/p/${p}/records`,
  },
  audit_events_24h: {
    icon: FileClock,
    labelKey: 'stats.audit24h',
    hintKey: 'stats.hints.audit24h',
    to: (p) => `/audit?product_id=${p}`,
  },
  denied_events_24h: {
    icon: ShieldAlert,
    labelKey: 'stats.denied24h',
    hintKey: 'stats.hints.denied24h',
    to: (p) => `/audit?product_id=${p}&outcome=denied`,
  },
};

/**
 * Numeric counters of `GET /v1/products/{id}/overview`, known ones first. Counters the server
 * leaves `null` (product-wide ones for a caller with `scope: "tenant"`) are left out, not shown
 * as 0.
 */
export function overviewStats(overview: Record<string, unknown> | undefined) {
  if (!overview) return [];
  const order = Object.keys(KNOWN_STATS);
  return Object.entries(overview)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({ key, value: value as number }))
    .sort((a, b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}
