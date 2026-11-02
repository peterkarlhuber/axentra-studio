import type { Token, Tokens } from 'marked';
import { plainText, type HelpArticle, type HelpLibrary } from './content';
import { splitHeadingAnchor } from './frontmatter';
import type { HelpArticleId } from './manifest';

/** Lower case, without diacritics, so "Schlussel" finds "Schlüssel" and "publicacion" finds "publicación". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
}

interface Section {
  anchor: string | null;
  heading: string;
  text: string;
  /** Normalized heading and text, searched with substring matching. */
  headingKey: string;
  textKey: string;
}

interface Entry {
  article: HelpArticle;
  titleKey: string;
  summaryKey: string;
  keywordKey: string;
  sections: Section[];
}

export interface SearchResult {
  article: HelpArticleId;
  title: string;
  summary: string;
  /** Best matching section, for deep links and "in section …". */
  anchor: string | null;
  section: string | null;
  snippet: string;
  score: number;
}

function blockText(token: Token): string {
  switch (token.type) {
    case 'code':
      return (token as Tokens.Code).lang === 'diagram' ? '' : (token as Tokens.Code).text;
    case 'table': {
      const table = token as Tokens.Table;
      return [...table.header, ...table.rows.flat()].map((cell) => plainText(cell.text)).join(' ');
    }
    case 'list':
      return (token as Tokens.List).items.map((item) => plainText(item.text)).join(' ');
    case 'blockquote':
      return plainText((token as Tokens.Blockquote).text.replace(/^\s*\[![A-Z]+\]\s*/, ''));
    case 'space':
    case 'hr':
      return '';
    default:
      return 'text' in token ? plainText(String(token.text)) : '';
  }
}

function sectionsOf(article: HelpArticle): Section[] {
  const sections: Section[] = [];
  let current: Omit<Section, 'headingKey' | 'textKey'> = { anchor: null, heading: '', text: '' };
  const push = () => {
    if (current.heading || current.text.trim())
      sections.push({
        ...current,
        headingKey: normalize(current.heading),
        textKey: normalize(current.text),
      });
  };
  for (const token of article.tokens) {
    if (token.type === 'heading') {
      push();
      const { text, id } = splitHeadingAnchor((token as Tokens.Heading).text);
      current = { anchor: id, heading: plainText(text), text: '' };
    } else {
      current.text += ` ${blockText(token)}`;
    }
  }
  push();
  return sections;
}

export class HelpSearchIndex {
  private readonly entries: Entry[];

  constructor(library: HelpLibrary) {
    this.entries = [...library.values()].map((article) => ({
      article,
      titleKey: normalize(article.title),
      summaryKey: normalize(article.summary),
      keywordKey: normalize(article.keywords.join(' ')),
      sections: sectionsOf(article),
    }));
  }

  search(query: string, limit = 20): SearchResult[] {
    const terms = [...new Set(tokenize(query))].filter(
      (term) => term.length >= 2 || /\d/.test(term),
    );
    if (terms.length === 0) return [];
    const results: SearchResult[] = [];

    for (const entry of this.entries) {
      let score = 0;
      let allFound = true;
      for (const term of terms) {
        const inTitle = wordScore(entry.titleKey, term);
        const inKeywords = wordScore(entry.keywordKey, term);
        const inSummary = wordScore(entry.summaryKey, term);
        const inSections = entry.sections.some(
          (section) => section.headingKey.includes(term) || section.textKey.includes(term),
        );
        if (!inTitle && !inKeywords && !inSummary && !inSections) {
          allFound = false;
          break;
        }
        score += inTitle * 12 + inKeywords * 6 + inSummary * 3 + (inSections ? 1 : 0);
      }
      if (!allFound) continue;

      // The section that matches most terms (headings count double) becomes the deep link.
      let best: Section | null = null;
      let bestScore = 0;
      for (const section of entry.sections) {
        let sectionScore = 0;
        for (const term of terms) {
          sectionScore += wordScore(section.headingKey, term) * 2;
          sectionScore += Math.min(countOccurrences(section.textKey, term), 3);
        }
        if (sectionScore > bestScore) {
          best = section;
          bestScore = sectionScore;
        }
      }
      score += bestScore;
      if (normalize(query).trim() === entry.titleKey) score += 50;

      results.push({
        article: entry.article.id,
        title: entry.article.title,
        summary: entry.article.summary,
        anchor: best?.anchor ?? null,
        section: best?.anchor ? best.heading : null,
        snippet: best ? snippet(best.text, terms) : entry.article.summary,
        score,
      });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

/** 2 for a whole word or word start, 1 for a substring (German compounds), 0 for no match. */
function wordScore(haystack: string, term: string): number {
  const index = haystack.indexOf(term);
  if (index < 0) return 0;
  const before = index === 0 ? ' ' : (haystack[index - 1] ?? ' ');
  return /[\p{L}\p{N}]/u.test(before) ? 1 : 2;
}

function countOccurrences(haystack: string, term: string): number {
  let count = 0;
  let index = haystack.indexOf(term);
  while (index >= 0 && count < 10) {
    count += 1;
    index = haystack.indexOf(term, index + term.length);
  }
  return count;
}

/** About 180 characters of text around the first matching term. */
export function snippet(text: string, terms: string[], size = 180): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const key = normalize(clean);
  const positions = terms.map((term) => key.indexOf(term)).filter((index) => index >= 0);
  const first = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, first - Math.floor(size / 3));
  const end = Math.min(clean.length, start + size);
  return `${start > 0 ? '…' : ''}${clean.slice(start, end).trim()}${end < clean.length ? '…' : ''}`;
}
