import { describe, expect, it } from 'vitest';
import type { Meter } from '@/api/models';
import {
  formatDay,
  formatQuantity,
  lastDays,
  METER_KEY_PATTERN,
  monthStart,
  niceTicks,
  parseDecimal,
  totalsByMeter,
  usedPercent,
} from './usage-utils';

describe('usage utils', () => {
  it('formats quantities with up to six decimals per locale', () => {
    expect(formatQuantity(1234.5, 'en-US')).toBe('1,234.5');
    expect(formatQuantity(1234.5, 'de-DE')).toBe('1.234,5');
    expect(formatQuantity(0.1234567, 'en-US')).toBe('0.123457');
    expect(formatQuantity(null, 'en-US')).toBe('');
  });

  it('computes UTC day ranges', () => {
    const now = new Date('2026-11-01T23:30:00Z');
    expect(lastDays(7, now)).toEqual({ since: '2026-10-26', until: '2026-11-01' });
    expect(monthStart(now)).toBe('2026-11-01');
    expect(formatDay('2026-11-01', 'en-US')).toBe('Nov 1');
    expect(formatDay('2026-11-01', 'de-DE', 'medium')).toBe('01.11.2026');
  });

  it('builds nice axis ticks', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(5)).toEqual([0, 2, 4, 6]);
    expect(niceTicks(97)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(0.3)).toEqual([0, 0.1, 0.2, 0.3]);
  });

  it('validates meter keys and parses decimals', () => {
    expect(METER_KEY_PATTERN.test('api_calls')).toBe(true);
    expect(METER_KEY_PATTERN.test('storage.bytes')).toBe(true);
    expect(METER_KEY_PATTERN.test('Api')).toBe(false);
    expect(METER_KEY_PATTERN.test('1calls')).toBe(false);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('1,5')).toBe(1.5);
    expect(parseDecimal('abc')).toBeNaN();
  });

  it('reports the used share of a limit', () => {
    expect(usedPercent(50, 200)).toBe(25);
    expect(usedPercent(5, null)).toBeNull();
    expect(usedPercent(1, 0)).toBe(Infinity);
  });

  it('combines tenant totals per meter by aggregation', () => {
    const meter = (key: string, aggregation: string) =>
      ({ id: key, key, aggregation }) as unknown as Meter;
    const rows = [
      { tenant_id: 'a', meter: 'calls', value: 5, event_count: 2 },
      { tenant_id: 'b', meter: 'calls', value: 7, event_count: 3 },
      { tenant_id: 'a', meter: 'peak', value: 9, event_count: 1 },
      { tenant_id: 'b', meter: 'peak', value: 4, event_count: 1 },
      { tenant_id: 'a', meter: 'gauge', value: 1, event_count: 1 },
    ];
    const totals = totalsByMeter(
      [meter('calls', 'sum'), meter('peak', 'max'), meter('gauge', 'last')],
      rows,
    );
    expect(totals.map((total) => [total.tenants, total.events, total.value])).toEqual([
      [2, 5, 12],
      [2, 2, 9],
      [1, 1, null],
    ]);
  });
});
