#!/usr/bin/env node
/**
 * Verifies that every locale has the same namespaces and keys as English (plural forms per
 * locale), that no value is empty, that placeholders ({{name}}) match, that no text was left
 * in English (except allowlisted identifiers) and that no formal address form slipped in.
 * Exits non-zero on any difference. Used in CI (`npm run i18n:check`) and in unit tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LOCALES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/i18n/locales',
);

/** Flatten nested objects into dotted keys. */
export function flatten(tree, prefix = '') {
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value, full));
    } else {
      out[full] = value;
    }
  }
  return out;
}

export function placeholders(value) {
  return [...String(value).matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]).sort();
}

/** Load `{ [locale]: { [namespace]: flatKeys } }` from a locales directory. */
export function loadLocales(dir = LOCALES_DIR) {
  const result = {};
  for (const locale of fs.readdirSync(dir).sort()) {
    const localeDir = path.join(dir, locale);
    if (!fs.statSync(localeDir).isDirectory()) continue;
    result[locale] = {};
    for (const file of fs
      .readdirSync(localeDir)
      .filter((f) => f.endsWith('.json'))
      .sort()) {
      const raw = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf8'));
      result[locale][file.replace(/\.json$/, '')] = flatten(raw);
    }
  }
  return result;
}

export const REFERENCE_LOCALE = 'en';
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/** Plural categories a locale needs (i18next uses Intl.PluralRules). */
export function pluralCategories(locale) {
  return new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
}

/**
 * Formal address forms that must not appear: the UI addresses users informally in every
 * language (German "du", Spanish "tú", French "tu", Italian "tu"; Brazilian "você" is informal).
 * Case-sensitive where the formal pronoun is capitalized.
 */
export const FORMAL_ADDRESS = {
  de: /\b(Sie|Ihnen|Ihr|Ihre|Ihrem|Ihren|Ihrer|Ihres)\b/,
  es: /\b(usted|ustedes)\b/i,
  fr: /\b(vous|votre|vos)\b/i,
  it: /\b(Lei|La sua|Le sue|Suo|Sua)\b/,
  'pt-BR': /\b(o senhor|a senhora)\b/i,
};

/** Values that may equal the English text (identifiers, loanwords). See untranslated.json. */
export function loadAllowlist(dir = LOCALES_DIR) {
  const file = path.join(dir, '..', 'untranslated.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

function hasWords(value) {
  // Text with at least one word of 4+ letters that is not inside {{…}} or `…`.
  const stripped = String(value)
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[\w.-]+:[\w.*-]+/g, ' ');
  return /\p{L}{4,}/u.test(stripped);
}

/**
 * Compare every locale with the English reference. Plural keys (`x_one`, `x_other`, …) are
 * grouped: each locale must provide exactly the categories its plural rules use.
 * Returns a list of problems (empty = OK).
 */
export function compareLocales(locales, { allowlist = {}, checkUntranslated = false } = {}) {
  const problems = [];
  const names = Object.keys(locales);
  if (names.length < 2) return ['At least two locales are required.'];
  const reference = locales[REFERENCE_LOCALE] ? REFERENCE_LOCALE : names[0];
  const refNamespaces = Object.keys(locales[reference]);

  for (const [locale, namespaces] of Object.entries(locales)) {
    for (const [ns, keys] of Object.entries(namespaces)) {
      for (const [key, value] of Object.entries(keys)) {
        if (typeof value !== 'string' || value.trim() === '') {
          problems.push(`${locale}/${ns}: "${key}" is empty or not a string`);
        } else if (FORMAL_ADDRESS[locale]?.test(value)) {
          problems.push(`${locale}/${ns}: "${key}" uses a formal address form: ${value}`);
        }
      }
    }
  }

  for (const other of names.filter((name) => name !== reference)) {
    for (const ns of refNamespaces) {
      if (!locales[other][ns]) problems.push(`${other}: missing namespace file "${ns}.json"`);
    }
    for (const ns of Object.keys(locales[other])) {
      if (!locales[reference][ns])
        problems.push(`${reference}: missing namespace file "${ns}.json" (present in ${other})`);
    }
    const categories = pluralCategories(other);
    for (const ns of refNamespaces.filter((n) => locales[other][n])) {
      const a = locales[reference][ns];
      const b = locales[other][ns];
      const pluralBases = new Set(
        Object.keys(a)
          .filter((key) => PLURAL_SUFFIX.test(key))
          .map((key) => key.replace(PLURAL_SUFFIX, '')),
      );
      const expected = new Set();
      for (const key of Object.keys(a)) {
        if (!PLURAL_SUFFIX.test(key)) expected.add(key);
      }
      for (const base of pluralBases) {
        for (const category of categories) expected.add(`${base}_${category}`);
      }
      for (const key of expected) {
        if (!(key in b)) {
          problems.push(`${other}/${ns}: missing key "${key}"`);
          continue;
        }
        const plural = PLURAL_SUFFIX.exec(key);
        const base = plural ? key.replace(PLURAL_SUFFIX, '') : key;
        const source = plural ? (a[`${base}_other`] ?? a[key]) : a[key];
        const want = placeholders(source);
        const got = placeholders(b[key]);
        // A singular form may leave out {{count}} ("every second" instead of "every 1 second").
        const ok =
          plural && (plural[1] === 'one' || plural[1] === 'zero')
            ? got.every((name) => want.includes(name)) &&
              want.filter((name) => name !== 'count').every((name) => got.includes(name))
            : want.join() === got.join();
        if (!ok) {
          problems.push(
            `${other}/${ns}: placeholders of "${key}" differ (${want.join(', ') || 'none'} vs ${got.join(', ') || 'none'})`,
          );
        }
        if (
          checkUntranslated &&
          !plural &&
          b[key] === a[key] &&
          hasWords(a[key]) &&
          !(allowlist[other] ?? []).includes(a[key]) &&
          !(allowlist['*'] ?? []).includes(a[key])
        ) {
          problems.push(`${other}/${ns}: "${key}" is not translated (same as English: ${a[key]})`);
        }
      }
      for (const key of Object.keys(b)) {
        if (!expected.has(key))
          problems.push(`${other}/${ns}: unexpected key "${key}" (not in ${reference})`);
      }
    }
  }
  return problems;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const locales = loadLocales();
  const problems = compareLocales(locales, {
    allowlist: loadAllowlist(),
    checkUntranslated: true,
  });
  const count = Object.values(locales.en ?? {}).reduce(
    (sum, keys) => sum + Object.keys(keys).length,
    0,
  );
  if (problems.length) {
    console.error(`i18n check failed with ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(
    `i18n check passed: ${Object.keys(locales).join(', ')} match the English keys (${count} English keys).`,
  );
}
