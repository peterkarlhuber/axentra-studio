import type { Meter, TenantMeterTotal } from '@/api/models';

/** Helpers shared by the usage screens. Pure functions, unit tested in usage-utils.test.ts. */

export const METER_KEY_PATTERN = /^[a-z][a-z0-9_.]{0,62}$/;
export const AGGREGATIONS = ['sum', 'max', 'last'] as const;
export const RESET_PERIODS = ['none', 'day', 'month', 'billing_period'] as const;
export const ENFORCEMENTS = ['hard', 'soft'] as const;
export const RANGE_DAYS = [7, 30, 90] as const;

/** Quantities are decimals with at most 6 places (USAGE.md). */
export function formatQuantity(value: number | null | undefined, locale: string): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value);
}

/** `YYYY-MM-DD` of a date in UTC (the API's usage days are UTC days). */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive range of the last `days` UTC days ending today. */
export function lastDays(days: number, now = new Date()): { since: string; until: string } {
  const until = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const since = new Date(until.getTime() - (days - 1) * 86_400_000);
  return { since: isoDay(since), until: isoDay(until) };
}

/** First day of the current UTC month, `YYYY-MM-DD`. */
export function monthStart(now = new Date()): string {
  return isoDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
}

/** Format a `YYYY-MM-DD` day for axis labels and tables (interpreted as a UTC day). */
export function formatDay(day: string, locale: string, style: 'short' | 'medium' = 'short') {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    ...(style === 'short' ? { day: 'numeric', month: 'short' } : { dateStyle: 'medium' }),
  }).format(date);
}

/** "Nice" upper bound and tick values (0..max) for a value axis. */
export function niceTicks(max: number, count = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const factor = [1, 2, 2.5, 5, 10].find((candidate) => candidate >= residual) ?? 10;
  const step = factor * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(Number(value.toFixed(10)));
  return ticks;
}

/** Percentage of a limit used (0..∞), or null when unlimited. */
export function usedPercent(used: number, limit: number | null | undefined): number | null {
  if (limit === null || limit === undefined) return null;
  if (limit <= 0) return used > 0 ? Infinity : 0;
  return (used / limit) * 100;
}

/** Parse a decimal input ("1,5" or "1.5"); empty -> null, invalid -> NaN. */
export function parseDecimal(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  if (!text) return null;
  if (!/^-?\d+(\.\d+)?$/.test(text)) return Number.NaN;
  return Number(text);
}

export interface MeterTotals {
  meter: Meter;
  tenants: number;
  events: number;
  value: number | null;
}

/** Combine per-tenant totals per meter: sum meters add up, max meters take the maximum. */
export function totalsByMeter(meters: Meter[], rows: TenantMeterTotal[]): MeterTotals[] {
  return meters.map((meter) => {
    const own = rows.filter((row) => row.meter === meter.key);
    const values = own.map((row) => row.value);
    const value =
      meter.aggregation === 'sum'
        ? values.reduce((sum, v) => sum + v, 0)
        : meter.aggregation === 'max' && values.length
          ? Math.max(...values)
          : null;
    return {
      meter,
      tenants: own.length,
      events: own.reduce((sum, row) => sum + row.event_count, 0),
      value,
    };
  });
}
