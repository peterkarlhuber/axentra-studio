import {
  Activity,
  BarChart3,
  CalendarClock,
  Bell,
  Boxes,
  Building2,
  CreditCard,
  Database,
  FileClock,
  Gauge,
  FolderOpen,
  HardDrive,
  KeyRound,
  LifeBuoy,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Mail,
  Radio,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import type { Me } from '@/api/models';
import type { StudioModule } from './modules';
import { canAccess } from './permissions';

export interface NavItem {
  id: string;
  /** i18n key in the `nav` namespace. */
  labelKey: string;
  icon: LucideIcon;
  /** Product-scoped items get the product id; platform items ignore it. */
  to: (productId: string) => string;
  scope: 'product' | 'platform';
  module?: StudioModule;
  /**
   * Shown only when this returns true for the signed-in user. Only for screens that are useless
   * without a permission; a direct visit still explains the refusal (`403` state). Screens that
   * offer something to everyone (Settings: personal preferences; Monitoring and System health:
   * public readiness checks) stay visible and explain the parts the user cannot read.
   */
  visibleTo?: (me: Me) => boolean;
}

/**
 * The audit log needs `platform:audit` (installation-wide) or `audit:read` in a product
 * (`GET /v1/audit`); tenant roles never grant it.
 */
export function canReadAudit(me: Me): boolean {
  return (
    canAccess(me, 'platform:audit') ||
    me.products.some((access) => canAccess(me, 'audit:read', access))
  );
}

export interface NavGroup {
  id: string;
  /** Group heading; omitted for top-level single items. */
  labelKey?: string;
  items: NavItem[];
}

const p = (path: string) => (productId: string) => `/p/${encodeURIComponent(productId)}/${path}`;
const platform = (path: string) => () => path;

/** The Studio navigation, in the order defined in docs/UX.md. */
export const NAVIGATION: NavGroup[] = [
  {
    id: 'top',
    items: [
      {
        id: 'dashboard',
        labelKey: 'dashboard',
        icon: LayoutDashboard,
        to: p('dashboard'),
        scope: 'product',
      },
      {
        id: 'products',
        labelKey: 'products',
        icon: Boxes,
        to: platform('/products'),
        scope: 'platform',
      },
    ],
  },
  {
    id: 'identity',
    labelKey: 'groups.identity',
    items: [
      {
        id: 'tenants',
        labelKey: 'tenants',
        icon: Building2,
        to: p('tenants'),
        scope: 'product',
        module: 'tenants',
      },
      {
        id: 'users',
        labelKey: 'users',
        icon: Users,
        to: p('users'),
        scope: 'product',
        module: 'users',
      },
      {
        id: 'invitations',
        labelKey: 'invitations',
        icon: Mail,
        to: p('invitations'),
        scope: 'product',
        module: 'tenants',
      },
    ],
  },
  {
    id: 'access',
    labelKey: 'groups.access',
    items: [
      {
        id: 'roles',
        labelKey: 'roles',
        icon: ShieldCheck,
        to: p('roles'),
        scope: 'product',
        module: 'access',
      },
      {
        id: 'permissions',
        labelKey: 'permissions',
        icon: LockKeyhole,
        to: p('permissions'),
        scope: 'product',
        module: 'access',
      },
      {
        id: 'apiKeys',
        labelKey: 'apiKeys',
        icon: KeyRound,
        to: p('api-keys'),
        scope: 'product',
        module: 'access',
      },
    ],
  },
  {
    id: 'data',
    labelKey: 'groups.data',
    items: [
      // Data & Storage: overview of collections, storage usage and retention
      {
        id: 'dataOverview',
        labelKey: 'dataOverview',
        icon: HardDrive,
        to: p('data'),
        scope: 'product',
        module: 'records',
      },
      {
        id: 'records',
        labelKey: 'records',
        icon: Database,
        to: p('records'),
        scope: 'product',
        module: 'records',
      },
      {
        id: 'files',
        labelKey: 'files',
        icon: FolderOpen,
        to: p('files'),
        scope: 'product',
        module: 'files',
      },
    ],
  },
  {
    id: 'events',
    labelKey: 'groups.events',
    items: [
      {
        id: 'jobs',
        labelKey: 'jobs',
        icon: ListChecks,
        to: p('jobs'),
        scope: 'product',
        module: 'jobs',
      },
      {
        id: 'schedules',
        labelKey: 'schedules',
        icon: CalendarClock,
        to: p('schedules'),
        scope: 'product',
        module: 'schedules',
      },
      {
        id: 'events',
        labelKey: 'events',
        icon: Radio,
        to: p('events'),
        scope: 'product',
        module: 'events',
      },
      {
        id: 'webhooks',
        labelKey: 'webhooks',
        icon: Webhook,
        to: p('webhooks'),
        scope: 'product',
        module: 'webhooks',
      },
    ],
  },
  {
    id: 'billing',
    labelKey: 'groups.billing',
    items: [
      {
        id: 'usage',
        labelKey: 'usage',
        icon: BarChart3,
        to: p('usage'),
        scope: 'product',
        module: 'usage',
      },
      {
        id: 'plans',
        labelKey: 'plans',
        icon: Receipt,
        to: p('plans'),
        scope: 'product',
        module: 'billing',
      },
      {
        id: 'subscriptions',
        labelKey: 'subscriptions',
        icon: CreditCard,
        to: p('subscriptions'),
        scope: 'product',
        module: 'billing',
      },
    ],
  },
  {
    id: 'notifications',
    items: [
      {
        id: 'notifications',
        labelKey: 'notifications',
        icon: Bell,
        to: p('notifications'),
        scope: 'product',
        module: 'notifications',
      },
    ],
  },
  {
    id: 'monitoring',
    labelKey: 'groups.monitoring',
    items: [
      {
        id: 'audit',
        labelKey: 'audit',
        icon: FileClock,
        to: platform('/audit'),
        scope: 'platform',
        module: 'audit',
        visibleTo: canReadAudit,
      },
      {
        id: 'health',
        labelKey: 'health',
        icon: Activity,
        to: platform('/health'),
        scope: 'platform',
      },
      // monitoring area
      {
        id: 'monitoring',
        labelKey: 'monitoring',
        icon: Gauge,
        to: platform('/monitoring'),
        scope: 'platform',
      },
    ],
  },
  {
    id: 'settings',
    items: [
      {
        id: 'settings',
        labelKey: 'settings',
        icon: Settings,
        to: platform('/settings'),
        scope: 'platform',
      },
      {
        id: 'help',
        labelKey: 'help',
        icon: LifeBuoy,
        to: platform('/help'),
        scope: 'platform',
      },
    ],
  },
];
