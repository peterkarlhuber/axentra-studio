import type { ServerSettings } from '@/api/models';

const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB'] as const;

/** Binary byte sizes (1 KiB = 1024 B), locale-aware: "1.5 MiB", "1,5 MiB". */
export function formatBytes(bytes: number, locale: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes);
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  return `${number} ${UNITS[unit]}`;
}

export const QUOTA_UNITS = { MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4 } as const;
export type QuotaUnit = keyof typeof QUOTA_UNITS;

/** Split a byte quota into the largest unit that represents it exactly (for the editor). */
export function splitBytes(bytes: number | null): { amount: string; unit: QuotaUnit } {
  if (bytes === null) return { amount: '', unit: 'GiB' };
  for (const unit of ['TiB', 'GiB', 'MiB'] as const) {
    if (bytes % QUOTA_UNITS[unit] === 0) return { amount: String(bytes / QUOTA_UNITS[unit]), unit };
  }
  return { amount: String(bytes / QUOTA_UNITS.MiB), unit: 'MiB' };
}

/** Parse a quota input: empty means "inherit" (null); otherwise a non-negative number. */
export function parseQuotaAmount(raw: string, multiplier = 1): number | null | 'invalid' {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return 'invalid';
  const result = Math.round(value * multiplier);
  return Number.isSafeInteger(result) ? result : 'invalid';
}

/** Share of a quota in percent (0-100+), or null when unlimited. */
export function usagePercent(used: number, quota: number | null): number | null {
  if (quota === null) return null;
  if (quota === 0) return used > 0 ? 100 : 0;
  return Math.round((used / quota) * 100);
}

export type MetadataParse =
  | { ok: true; value: Record<string, unknown> | undefined }
  | { ok: false; reason: 'json' | 'object' | 'values' };

/** Parse the metadata labels field: empty, or a flat JSON object of scalar values. */
export function parseMetadata(raw: string): MetadataParse {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: undefined };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, reason: 'json' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'object' };
  }
  const scalar = Object.values(parsed).every(
    (value) => value === null || ['string', 'number', 'boolean'].includes(typeof value),
  );
  if (!scalar) return { ok: false, reason: 'values' };
  return { ok: true, value: parsed as Record<string, unknown> };
}

/** `<input type="datetime-local">` value (local time) to an RFC 3339 timestamp. */
export function localDateTimeToIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** The `storage` section of `GET /v1/settings`, typed defensively (the contract is open). */
export interface StorageLimits {
  backend?: string;
  maxFileBytes?: number;
  allowedContentTypes: string[];
  storeBlockedAsInert?: boolean;
}

export function storageLimits(settings: ServerSettings | undefined): StorageLimits | undefined {
  const storage = settings?.storage;
  if (!storage) return undefined;
  const max = storage.max_file_bytes;
  const allowed = storage.allowed_content_types;
  const inert = storage.store_blocked_as_inert;
  return {
    backend: typeof storage.backend === 'string' ? storage.backend : undefined,
    maxFileBytes: typeof max === 'number' ? max : undefined,
    allowedContentTypes: Array.isArray(allowed)
      ? allowed.filter((entry): entry is string => typeof entry === 'string')
      : [],
    storeBlockedAsInert: typeof inert === 'boolean' ? inert : undefined,
  };
}

/** Whether a declared type matches an allow-list entry (`image/png`, `image/*`). */
export function contentTypeAllowed(type: string, allowed: readonly string[]): boolean {
  if (allowed.length === 0) return true;
  const normalized = type.toLowerCase().split(';')[0]?.trim() ?? '';
  return allowed.some((entry) => {
    const rule = entry.toLowerCase();
    return rule.endsWith('/*') ? normalized.startsWith(rule.slice(0, -1)) : normalized === rule;
  });
}

/** A numeric value of an open settings section (e.g. `observability.audit_retention_days`). */
export function numberSetting(section: unknown, key: string): number | undefined {
  if (!section || typeof section !== 'object') return undefined;
  const value = (section as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : undefined;
}
