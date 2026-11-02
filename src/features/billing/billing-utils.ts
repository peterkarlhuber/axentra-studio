/** Helpers shared by the billing screens. Pure functions, unit tested in billing-utils.test.ts. */
import type { Tone } from '@/components/ui';
import type { SubscriptionStatus } from '@/api/models';

export const PLAN_KEY_PATTERN = /^[a-z][a-z0-9_-]{0,62}$/;
export const ENTITLEMENT_NAME_PATTERN = /^[a-z][a-z0-9_.]{0,62}$/;
export const CURRENCY_PATTERN = /^[A-Z]{3}$/;
export const INTERVALS = ['month', 'year'] as const;
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
];

/** The subscription state machine of BILLING.md. */
export const TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  incomplete: ['trialing', 'active', 'canceled'],
  trialing: ['active', 'past_due', 'canceled'],
  active: ['past_due', 'canceled'],
  past_due: ['active', 'canceled'],
  canceled: [],
};

export function statusTone(status: string): Tone {
  switch (status) {
    case 'active':
      return 'success';
    case 'trialing':
      return 'info';
    case 'past_due':
    case 'incomplete':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** Number of minor-unit digits of an ISO 4217 currency (EUR 2, JPY 0, KWD 3); 2 if unknown. */
export function currencyDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** Format a price stored as integer minor units with Intl in the UI language. */
export function formatMoney(amountMinor: number, currency: string, locale: string): string {
  const digits = currencyDigits(currency);
  const major = amountMinor / 10 ** digits;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(major);
  } catch {
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: digits }).format(major)} ${currency}`;
  }
}

/** Parse an amount in major units ("19.90" / "19,90") to integer minor units; NaN if invalid. */
export function toMinorUnits(raw: string, currency: string): number {
  const text = raw.trim().replace(/\s/g, '').replace(',', '.');
  const digits = currencyDigits(currency);
  const pattern = digits > 0 ? new RegExp(`^\\d+(\\.\\d{1,${digits}})?$`) : /^\d+$/;
  if (!pattern.test(text)) return Number.NaN;
  const [whole = '0', fraction = ''] = text.split('.');
  return Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || '0');
}

/** Minor units back to an editable major-unit string ("1900" EUR -> "19.00"). */
export function fromMinorUnits(amountMinor: number, currency: string): string {
  const digits = currencyDigits(currency);
  if (digits === 0) return String(amountMinor);
  const text = String(amountMinor).padStart(digits + 1, '0');
  return `${text.slice(0, -digits)}.${text.slice(-digits)}`;
}

/** Editable entitlement row: `feature.<name>: bool` or `limit.<meter>: number | null`. */
export interface EntitlementRow {
  kind: 'feature' | 'limit';
  name: string;
  enabled: boolean;
  /** Limit as typed; empty = unlimited (null). */
  limit: string;
}

export type EntitlementMap = Record<string, boolean | number | null>;

export function entitlementRows(map: Record<string, unknown> | null | undefined): EntitlementRow[] {
  return Object.entries(map ?? {}).map(([key, value]) => {
    const [prefix, ...rest] = key.split('.');
    const name = rest.join('.');
    if (prefix === 'feature') return { kind: 'feature', name, enabled: Boolean(value), limit: '' };
    return {
      kind: 'limit',
      name,
      enabled: true,
      limit: value === null || value === undefined ? '' : String(value),
    };
  });
}

/** Row problems by index ('name' | 'limit' | 'duplicate'); empty when valid. */
export function validateEntitlements(rows: EntitlementRow[]): Record<number, string> {
  const problems: Record<number, string> = {};
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const key = `${row.kind}.${row.name}`;
    if (!ENTITLEMENT_NAME_PATTERN.test(row.name)) problems[index] = 'name';
    else if (seen.has(key)) problems[index] = 'duplicate';
    else if (row.kind === 'limit' && row.limit.trim() !== '') {
      const value = Number(row.limit.trim().replace(',', '.'));
      if (!Number.isFinite(value) || value < 0) problems[index] = 'limit';
    }
    seen.add(key);
  });
  return problems;
}

export function entitlementMap(rows: EntitlementRow[]): EntitlementMap {
  const map: EntitlementMap = {};
  for (const row of rows) {
    if (row.kind === 'feature') map[`feature.${row.name}`] = row.enabled;
    else {
      const text = row.limit.trim().replace(',', '.');
      map[`limit.${row.name}`] = text === '' ? null : Number(text);
    }
  }
  return map;
}

/** Whole days from now until `iso` (rounded up), or null when past/absent. */
export function daysUntil(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (Number.isNaN(ms) || ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}
