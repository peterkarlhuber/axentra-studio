import { describe, expect, it } from 'vitest';
import {
  currencyDigits,
  daysUntil,
  entitlementMap,
  entitlementRows,
  formatMoney,
  fromMinorUnits,
  toMinorUnits,
  TRANSITIONS,
  validateEntitlements,
} from './billing-utils';

describe('billing utils', () => {
  it('formats minor units with Intl in German and English', () => {
    expect(formatMoney(1900, 'EUR', 'en-US')).toBe('€19.00');
    expect(formatMoney(1900, 'EUR', 'de-DE')).toBe('19,00 €');
    expect(formatMoney(500, 'JPY', 'en-US')).toBe('¥500');
    expect(formatMoney(1234, 'KWD', 'en-US')).toContain('1.234');
  });

  it('knows the minor-unit digits of a currency', () => {
    expect(currencyDigits('EUR')).toBe(2);
    expect(currencyDigits('JPY')).toBe(0);
    expect(currencyDigits('KWD')).toBe(3);
    expect(currencyDigits('??')).toBe(2);
  });

  it('converts between major and minor units without float errors', () => {
    expect(toMinorUnits('19.99', 'EUR')).toBe(1999);
    expect(toMinorUnits('19,9', 'EUR')).toBe(1990);
    expect(toMinorUnits('0.29', 'USD')).toBe(29);
    expect(toMinorUnits('1.5', 'JPY')).toBeNaN();
    expect(toMinorUnits('1.234', 'EUR')).toBeNaN();
    expect(toMinorUnits('', 'EUR')).toBeNaN();
    expect(fromMinorUnits(1900, 'EUR')).toBe('19.00');
    expect(fromMinorUnits(5, 'EUR')).toBe('0.05');
    expect(fromMinorUnits(500, 'JPY')).toBe('500');
  });

  it('round-trips entitlements and validates rows', () => {
    const map = { 'feature.sso': true, 'limit.api_calls': 1000, 'limit.storage': null };
    const rows = entitlementRows(map);
    expect(rows).toHaveLength(3);
    expect(entitlementMap(rows)).toEqual(map);
    expect(validateEntitlements(rows)).toEqual({});
    expect(
      validateEntitlements([
        { kind: 'feature', name: 'Bad', enabled: true, limit: '' },
        { kind: 'limit', name: 'calls', enabled: true, limit: '-1' },
        { kind: 'limit', name: 'calls', enabled: true, limit: '' },
      ]),
    ).toEqual({ 0: 'name', 1: 'limit', 2: 'duplicate' });
  });

  it('follows the subscription state machine', () => {
    expect(TRANSITIONS.trialing).toEqual(['active', 'past_due', 'canceled']);
    expect(TRANSITIONS.canceled).toEqual([]);
  });

  it('counts days until a date', () => {
    const now = Date.parse('2026-11-01T00:00:00Z');
    expect(daysUntil('2026-11-15T00:00:00Z', now)).toBe(14);
    expect(daysUntil('2026-10-01T00:00:00Z', now)).toBeNull();
    expect(daysUntil(null, now)).toBeNull();
  });
});
