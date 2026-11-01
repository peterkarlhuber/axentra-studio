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
  to?: (productId: string) => string;
}

/** Known overview counters; unknown numeric fields are still shown with their raw name. */
export const KNOWN_STATS: Record<string, StatDefinition> = {
  tenants: { icon: Building2, labelKey: 'stats.tenants', to: (p) => `/p/${p}/tenants` },
  users: { icon: Users, labelKey: 'stats.users', to: (p) => `/p/${p}/users` },
  api_keys: { icon: KeyRound, labelKey: 'stats.apiKeys', to: (p) => `/p/${p}/api-keys` },
  records: { icon: Database, labelKey: 'stats.records', to: (p) => `/p/${p}/records` },
  audit_events_24h: {
    icon: FileClock,
    labelKey: 'stats.audit24h',
    to: (p) => `/audit?product_id=${p}`,
  },
  denied_events_24h: {
    icon: ShieldAlert,
    labelKey: 'stats.denied24h',
    to: (p) => `/audit?product_id=${p}&outcome=denied`,
  },
};

/** Numeric counters of `GET /v1/products/{id}/overview`, known ones first. */
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
