import { describe, expect, it } from 'vitest';
import { safeReturnPath, loginPath } from '@/app/auth';
import { initials, switchProductPath } from '@/app/shell/shell-utils';
import { overviewStats } from '@/features/dashboard/overview';
import { parseFilterValue, previewData } from '@/features/records/records-utils';
import { contrastRatio } from './contrast';
import { slugify } from './slug';

describe('slugify', () => {
  it('derives URL-friendly slugs', () => {
    expect(slugify('Acme GmbH & Co.')).toBe('acme-gmbh-co');
    expect(slugify('Müller Straße')).toBe('muller-strasse');
    expect(slugify('  --Hello__World--  ')).toBe('hello-world');
    expect(slugify('Order Items', '_')).toBe('order_items');
    expect(slugify('x'.repeat(100))).toHaveLength(63);
  });
});

describe('safeReturnPath', () => {
  it('only allows same-origin app paths', () => {
    expect(safeReturnPath('/p/1/tenants?q=a')).toBe('/p/1/tenants?q=a');
    expect(safeReturnPath('https://evil.test')).toBe('/');
    expect(safeReturnPath('//evil.test')).toBe('/');
    expect(safeReturnPath('/\\evil.test')).toBe('/');
    expect(safeReturnPath('/login?return_to=/x')).toBe('/');
    expect(safeReturnPath(null)).toBe('/');
  });
  it('builds the login path with the return target', () => {
    expect(loginPath('/audit')).toBe('/login?return_to=%2Faudit');
    expect(loginPath('/')).toBe('/login');
  });
});

describe('shell helpers', () => {
  it('keeps the section when switching products', () => {
    expect(switchProductPath('/p/a/tenants/t1', 'b')).toBe('/p/b/tenants');
    expect(switchProductPath('/products', 'b')).toBe('/p/b/dashboard');
  });
  it('derives initials', () => {
    expect(initials('Ada Lovelace', undefined)).toBe('AL');
    expect(initials('', 'peter.k@example.com')).toBe('PK');
    expect(initials('Cher', undefined)).toBe('CH');
    expect(initials(undefined, undefined)).toBe('?');
  });
});

describe('dashboard overview', () => {
  it('lists numeric counters with known ones first', () => {
    expect(
      overviewStats({ custom: 3, label: 'x', users: 2, tenants: 1 }).map((stat) => stat.key),
    ).toEqual(['tenants', 'users', 'custom']);
    expect(overviewStats(undefined)).toEqual([]);
  });
});

describe('records helpers', () => {
  it('parses filter values as JSON when possible', () => {
    expect(parseFilterValue('42')).toBe(42);
    expect(parseFilterValue('true')).toBe(true);
    expect(parseFilterValue('{"a":1}')).toEqual({ a: 1 });
    expect(parseFilterValue('open')).toBe('open');
    expect(parseFilterValue('  ')).toBe('');
  });
  it('truncates previews', () => {
    expect(previewData({ a: 1 })).toBe('{"a":1}');
    expect(previewData({ text: 'x'.repeat(200) }, 20)).toHaveLength(20);
  });
});

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });
});
