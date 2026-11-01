import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { compareLocales, flatten, loadLocales, placeholders } from './i18n-check.mjs';

describe('i18n parity', () => {
  it('the shipped locales have identical keys and placeholders', () => {
    const locales = loadLocales();
    expect(Object.keys(locales).sort()).toEqual(['de', 'en']);
    expect(compareLocales(locales)).toEqual([]);
  });

  it('every namespace exists in both languages', () => {
    const locales = loadLocales();
    expect(Object.keys(locales.de)).toEqual(Object.keys(locales.en));
    expect(Object.keys(locales.en).length).toBeGreaterThan(5);
  });
});

describe('i18n check helpers', () => {
  const dirs = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  });

  function fixture(tree) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-check-'));
    dirs.push(dir);
    for (const [locale, namespaces] of Object.entries(tree)) {
      fs.mkdirSync(path.join(dir, locale));
      for (const [ns, content] of Object.entries(namespaces)) {
        fs.writeFileSync(path.join(dir, locale, `${ns}.json`), JSON.stringify(content));
      }
    }
    return dir;
  }

  it('flattens nested keys and extracts placeholders', () => {
    expect(flatten({ a: { b: 'x', c: { d: 'y' } } })).toEqual({ 'a.b': 'x', 'a.c.d': 'y' });
    expect(placeholders('Hi {{ name }}, {{count}} new')).toEqual(['count', 'name']);
  });

  it('reports missing keys, empty values, placeholder drift and missing files', () => {
    const dir = fixture({
      en: { common: { a: 'A {{n}}', b: 'B' }, extra: { x: 'X' } },
      de: { common: { a: 'A', c: '' } },
    });
    const problems = compareLocales(loadLocales(dir));
    expect(problems).toEqual(
      expect.arrayContaining([
        'de/common: "c" is empty or not a string',
        'de: missing namespace file "extra.json"',
        'de/common: missing key "b" (present in en)',
        'en/common: missing key "c"',
        expect.stringContaining('placeholders of "a" differ'),
      ]),
    );
  });
});
