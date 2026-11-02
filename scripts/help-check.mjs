#!/usr/bin/env node
/**
 * Validates the in-app help center (src/help): every article of the manifest exists in all
 * six locales, front matter is complete, section anchors are identical across locales, links
 * (`help:`, `app:`) and diagrams resolve, help topics used in the code exist, translations
 * have the same structure as English and contain no English paragraphs or formal address.
 * Exits non-zero on any problem. Used in CI (`npm run help:check`) and in unit tests.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { FORMAL_ADDRESS } from './i18n-check.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LOCALES = ['en', 'de', 'es', 'fr', 'pt-BR', 'it'];
const DIAGRAMS = ['architecture', 'hierarchy', 'job-lifecycle', 'webhook-delivery', 'key-rotation'];
const CALLOUT = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/;
const ANCHOR = /\s*\{#([a-z0-9][a-z0-9-]*)\}\s*$/;

/** Article ids per chapter, read from src/help/manifest.ts. */
export function readManifest(root = ROOT) {
  const source = fs.readFileSync(path.join(root, 'src/help/manifest.ts'), 'utf8');
  const ids = [];
  for (const match of source.matchAll(/articles:\s*\[([^\]]*)\]/g)) {
    for (const id of match[1].matchAll(/'([a-z0-9-]+)'/g)) ids.push(id[1]);
  }
  return ids;
}

/** Sidebar ids from src/app/navigation.ts plus the extra targets of src/help/app-links.ts. */
export function readAppLinkIds(root = ROOT) {
  const nav = fs.readFileSync(path.join(root, 'src/app/navigation.ts'), 'utf8');
  const extra = fs.readFileSync(path.join(root, 'src/help/app-links.ts'), 'utf8');
  const ids = [...nav.matchAll(/^\s{8}id: '([a-zA-Z]+)'/gm)].map((m) => m[1]);
  const block = /EXTRA_TARGETS[^{]*\{([\s\S]*?)\n\};/.exec(extra)?.[1] ?? '';
  ids.push(...[...block.matchAll(/^\s{2}([a-zA-Z]+):/gm)].map((m) => m[1]));
  return new Set(ids);
}

function frontMatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  const fields = {};
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const index = line.indexOf(':');
      if (index > 0) {
        let value = line.slice(index + 1).trim();
        if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
        fields[line.slice(0, index).trim()] = value;
      }
    }
  }
  return { fields, body: match ? source.slice(match[0].length) : source };
}

/** Walk all tokens (blocks and inline) depth-first. */
function walk(tokens, visit) {
  for (const token of tokens ?? []) {
    visit(token);
    if (token.tokens) walk(token.tokens, visit);
    if (token.items) walk(token.items, visit);
    if (token.type === 'table') {
      for (const cell of [...token.header, ...token.rows.flat()]) walk(cell.tokens, visit);
    }
  }
}

/** Structure and facts of one article, used for validation and cross-locale comparison. */
export function analyze(source) {
  const { fields, body } = frontMatter(source);
  const tokens = marked.lexer(body, { gfm: true });
  const anchors = [];
  const problems = [];
  const links = [];
  const diagrams = [];
  const shape = [];
  const paragraphs = [];
  const prose = [];
  for (const token of tokens) {
    if (token.type === 'space') continue;
    if (token.type === 'heading') {
      const match = ANCHOR.exec(token.text);
      if (token.depth === 1) problems.push('uses a level-1 heading (the title is the h1)');
      if (token.depth <= 3 && !match) problems.push(`heading without {#anchor}: "${token.text}"`);
      if (match) {
        if (anchors.includes(match[1])) problems.push(`duplicate anchor #${match[1]}`);
        anchors.push(match[1]);
      }
      shape.push(`h${token.depth}`);
      prose.push(token.text.replace(ANCHOR, ''));
      continue;
    }
    if (token.type === 'code') {
      if (token.lang === 'diagram') diagrams.push(token.text.trim());
      shape.push(token.lang === 'diagram' ? `diagram:${token.text.trim()}` : `code`);
      continue;
    }
    if (token.type === 'blockquote') {
      const kind = CALLOUT.exec(token.text)?.[1];
      shape.push(kind ? `callout:${kind}` : 'quote');
    } else if (token.type === 'list') {
      shape.push(`${token.ordered ? 'ol' : 'ul'}:${token.items.length}`);
    } else if (token.type === 'table') {
      shape.push(`table:${token.header.length}x${token.rows.length}`);
    } else {
      shape.push(token.type);
    }
    if (token.type === 'paragraph') paragraphs.push(token.text.trim());
    prose.push(token.raw);
  }
  walk(tokens, (token) => {
    if (token.type === 'link') links.push(token.href);
    if (token.type === 'html' && /<\w/.test(token.text)) problems.push('contains raw HTML');
  });
  return { fields, anchors, problems, links, diagrams, shape, paragraphs, prose: prose.join('\n') };
}

/** Topics used by code: `help="…"`, `topic="…"`, `infoTopic="…"` and `helpTopic: '…'`. */
export function codeTopics(root = ROOT) {
  const found = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        for (const match of text.matchAll(
          /\b(?:help|topic|infoTopic|helpTopic|[a-zA-Z]+Topic)\s*[=:]\s*\{?\s*['"]([a-z0-9-]+(?:#[a-z0-9-]+)?)['"]/g,
        )) {
          found.push({ file: path.relative(root, full), topic: match[1] });
        }
      }
    }
  };
  visit(path.join(root, 'src'));
  return found;
}

export function checkHelp(root = ROOT) {
  const problems = [];
  const ids = readManifest(root);
  const appIds = readAppLinkIds(root);
  const contentDir = path.join(root, 'src/help/content');
  const english = {};

  for (const locale of LOCALES) {
    const dir = path.join(contentDir, locale);
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
    for (const file of files) {
      if (!ids.includes(file.replace(/\.md$/, '')))
        problems.push(`${locale}/${file}: not listed in src/help/manifest.ts`);
    }
    for (const id of ids) {
      const file = path.join(dir, `${id}.md`);
      if (!fs.existsSync(file)) {
        problems.push(`${locale}/${id}.md: missing`);
        continue;
      }
      const info = analyze(fs.readFileSync(file, 'utf8'));
      const where = `${locale}/${id}.md`;
      for (const problem of info.problems) problems.push(`${where}: ${problem}`);
      for (const field of ['title', 'summary', 'keywords']) {
        if (!info.fields[field]) problems.push(`${where}: front matter "${field}" is missing`);
      }
      if (locale === 'en') {
        english[id] = info;
        for (const rel of (info.fields.related ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)) {
          if (!ids.includes(rel))
            problems.push(`${where}: related article "${rel}" does not exist`);
        }
      } else if ('related' in info.fields) {
        problems.push(`${where}: "related" belongs only in the English file`);
      }
      for (const name of info.diagrams) {
        if (!DIAGRAMS.includes(name)) problems.push(`${where}: unknown diagram "${name}"`);
      }
      if (FORMAL_ADDRESS[locale]?.test(info.prose.replace(/`[^`]*`/g, ''))) {
        problems.push(
          `${where}: formal address form (${FORMAL_ADDRESS[locale].exec(info.prose)?.[0]})`,
        );
      }
      info.where = where;
      info.locale = locale;
      info.id = id;
      english[`${locale}:${id}`] = info;
    }
  }

  // Links (validated against English anchors, which are the same in every locale).
  for (const [key, info] of Object.entries(english)) {
    if (!key.includes(':')) continue;
    for (const href of info.links) {
      if (href.startsWith('help:')) {
        const [article, anchor] = href.slice(5).split('#');
        const target = english[article];
        if (!ids.includes(article)) problems.push(`${info.where}: link to unknown article ${href}`);
        else if (anchor && target && !target.anchors.includes(anchor))
          problems.push(`${info.where}: link to unknown anchor ${href}`);
      } else if (href.startsWith('app:')) {
        if (!appIds.has(href.slice(4))) problems.push(`${info.where}: unknown app link ${href}`);
      } else if (href.startsWith('#')) {
        if (!english[info.id]?.anchors.includes(href.slice(1)))
          problems.push(`${info.where}: link to unknown anchor ${href} on the same page`);
      } else if (!/^https:\/\//.test(href)) {
        problems.push(
          `${info.where}: unsupported link "${href}" (use help:, app:, #anchor or https://)`,
        );
      }
    }
  }

  // Translations: same anchors, same structure, no English paragraphs left.
  for (const id of ids) {
    const en = english[id];
    if (!en) continue;
    const enParagraphs = new Set(
      en.paragraphs.filter((p) => /\p{L}{4,}.*\s.*\p{L}{4,}/u.test(p) && p.length > 40),
    );
    for (const locale of LOCALES.slice(1)) {
      const info = english[`${locale}:${id}`];
      if (!info) continue;
      if (info.anchors.join() !== en.anchors.join())
        problems.push(
          `${info.where}: anchors differ from English (${diff(en.anchors, info.anchors)})`,
        );
      if (info.shape.join() !== en.shape.join())
        problems.push(
          `${info.where}: structure differs from English (${firstDifference(en.shape, info.shape)})`,
        );
      for (const paragraph of info.paragraphs) {
        if (enParagraphs.has(paragraph))
          problems.push(`${info.where}: paragraph left in English: "${paragraph.slice(0, 60)}…"`);
      }
    }
  }

  // Topics used by screens.
  for (const { file, topic } of codeTopics(root)) {
    const [article, anchor] = topic.split('#');
    if (!ids.includes(article)) problems.push(`${file}: help topic "${topic}" has no article`);
    else if (anchor && english[article] && !english[article].anchors.includes(anchor))
      problems.push(`${file}: help topic "${topic}" has no such section`);
  }
  return { problems, articles: ids.length };
}

function diff(a, b) {
  const missing = a.filter((x) => !b.includes(x));
  const extra = b.filter((x) => !a.includes(x));
  return [
    missing.length ? `missing ${missing.join(', ')}` : '',
    extra.length ? `extra ${extra.join(', ')}` : '',
    !missing.length && !extra.length ? 'order' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

function firstDifference(a, b) {
  const index = a.findIndex((value, i) => value !== b[i]);
  const at = index === -1 ? a.length : index;
  return `block ${at + 1}: English ${a[at] ?? 'end'}, translation ${b[at] ?? 'end'}`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { problems, articles } = checkHelp();
  if (problems.length) {
    console.error(`help check failed with ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(`help check passed: ${articles} articles in ${LOCALES.length} locales.`);
}
