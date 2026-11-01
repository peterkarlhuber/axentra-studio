#!/usr/bin/env node
/**
 * Verifies that every locale has the same namespaces and exactly the same keys, that no
 * value is empty, and that interpolation placeholders ({{name}}) match across locales.
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

/** Compare all locales against the first (reference) one. Returns a list of problems. */
export function compareLocales(locales) {
  const problems = [];
  const names = Object.keys(locales);
  if (names.length < 2) return ['At least two locales are required.'];
  const [reference, ...others] = names;
  const refNamespaces = Object.keys(locales[reference]);

  for (const [locale, namespaces] of Object.entries(locales)) {
    for (const [ns, keys] of Object.entries(namespaces)) {
      for (const [key, value] of Object.entries(keys)) {
        if (typeof value !== 'string' || value.trim() === '') {
          problems.push(`${locale}/${ns}: "${key}" is empty or not a string`);
        }
      }
    }
  }

  for (const other of others) {
    const otherNamespaces = Object.keys(locales[other]);
    for (const ns of refNamespaces) {
      if (!locales[other][ns]) problems.push(`${other}: missing namespace file "${ns}.json"`);
    }
    for (const ns of otherNamespaces) {
      if (!locales[reference][ns])
        problems.push(`${reference}: missing namespace file "${ns}.json"`);
    }
    for (const ns of refNamespaces.filter((n) => locales[other][n])) {
      const a = locales[reference][ns];
      const b = locales[other][ns];
      for (const key of Object.keys(a)) {
        if (!(key in b)) problems.push(`${other}/${ns}: missing key "${key}"`);
        else if (placeholders(a[key]).join() !== placeholders(b[key]).join()) {
          problems.push(
            `${other}/${ns}: placeholders of "${key}" differ (${placeholders(a[key]).join(', ') || 'none'} vs ${placeholders(b[key]).join(', ') || 'none'})`,
          );
        }
      }
      for (const key of Object.keys(b)) {
        if (!(key in a))
          problems.push(`${reference}/${ns}: missing key "${key}" (present in ${other})`);
      }
    }
  }
  return problems;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const locales = loadLocales();
  const problems = compareLocales(locales);
  const count = Object.values(Object.values(locales)[0] ?? {}).reduce(
    (sum, keys) => sum + Object.keys(keys).length,
    0,
  );
  if (problems.length) {
    console.error(`i18n check failed with ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(
    `i18n check passed: ${Object.keys(locales).join(', ')} have identical keys (${count} keys per locale).`,
  );
}
