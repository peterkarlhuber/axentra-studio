import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  compareLocales,
  flatten,
  loadAllowlist,
  loadLocales,
  placeholders,
  pluralCategories,
} from './i18n-check.mjs';

describe('i18n parity', () => {
  it('the six shipped locales match English: keys, plurals, placeholders, no English left', () => {
    const locales = loadLocales();
    expect(Object.keys(locales).sort()).toEqual(['de', 'en', 'es', 'fr', 'it', 'pt-BR']);
    expect(
      compareLocales(locales, { allowlist: loadAllowlist(), checkUntranslated: true }),
    ).toEqual([]);
  });

  it('every namespace exists in every language', () => {
    const locales = loadLocales();
    for (const locale of Object.keys(locales)) {
      expect(Object.keys(locales[locale])).toEqual(Object.keys(locales.en));
    }
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
        'de/common: missing key "b"',
        'de/common: unexpected key "c" (not in en)',
        expect.stringContaining('placeholders of "a" differ'),
      ]),
    );
  });

  it('expects the plural forms of each language', () => {
    expect(pluralCategories('fr')).toEqual(expect.arrayContaining(['one', 'many', 'other']));
    const dir = fixture({
      en: { common: { files_one: '{{count}} file', files_other: '{{count}} files' } },
      de: { common: { files_one: '{{count}} Datei', files_other: '{{count}} Dateien' } },
      fr: { common: { files_one: 'Un fichier', files_other: '{{count}} fichiers' } },
    });
    const problems = compareLocales(loadLocales(dir));
    // German needs one/other only; French also needs `many`. A singular may drop {{count}}.
    expect(problems).toEqual(['fr/common: missing key "files_many"']);
  });

  it('flags formal address and text left in English', () => {
    const dir = fixture({
      en: { common: { save: 'Save your changes', name: 'Name' } },
      de: { common: { save: 'Speichern Sie Ihre Änderungen', name: 'Name' } },
      es: { common: { save: 'Save your changes', name: 'Nombre' } },
    });
    const problems = compareLocales(loadLocales(dir), {
      allowlist: { de: ['Name'] },
      checkUntranslated: true,
    });
    expect(problems).toEqual([
      'de/common: "save" uses a formal address form: Speichern Sie Ihre Änderungen',
      'es/common: "save" is not translated (same as English: Save your changes)',
    ]);
  });
});
