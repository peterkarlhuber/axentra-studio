import { marked, type Token, type Tokens } from 'marked';
import type { Locale } from '@/i18n';
import { parseFrontMatter, splitHeadingAnchor } from './frontmatter';
import { HELP_ARTICLE_IDS, isHelpArticleId, type HelpArticleId } from './manifest';

export interface HelpHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface HelpArticle {
  id: HelpArticleId;
  locale: Locale;
  title: string;
  summary: string;
  keywords: string[];
  related: HelpArticleId[];
  tokens: Token[];
  headings: HelpHeading[];
}

export type HelpLibrary = ReadonlyMap<HelpArticleId, HelpArticle>;

/* Articles are bundled per locale and loaded on first use, so the help center costs nothing
 * until someone opens it. */
const sources = import.meta.glob<string>('./content/*/*.md', { query: '?raw', import: 'default' });

/** Remove inline markdown for plain-text uses (search, headings in the table of contents). */
export function plainText(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|~~)(.*?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseArticle(id: HelpArticleId, locale: Locale, source: string): HelpArticle {
  const { meta, body } = parseFrontMatter(source);
  const tokens = marked.lexer(body, { gfm: true });
  const headings: HelpHeading[] = [];
  for (const token of tokens) {
    if (token.type !== 'heading') continue;
    const heading = token as Tokens.Heading;
    if (heading.depth !== 2 && heading.depth !== 3) continue;
    const { text, id: anchor } = splitHeadingAnchor(heading.text);
    if (anchor) headings.push({ id: anchor, text: plainText(text), level: heading.depth });
  }
  return {
    id,
    locale,
    title: meta.title,
    summary: meta.summary,
    keywords: meta.keywords,
    related: meta.related.filter(isHelpArticleId),
    tokens,
    headings,
  };
}

const cache = new Map<Locale, Promise<HelpLibrary>>();

async function loadSource(locale: string, id: string): Promise<string | null> {
  const loader = sources[`./content/${locale}/${id}.md`];
  return loader ? loader() : null;
}

/**
 * Load every article of one locale. `related` is structural and comes from the English file;
 * a locale without an article yields no entry (the help check fails CI before that happens).
 */
export function loadLibrary(locale: Locale): Promise<HelpLibrary> {
  let pending = cache.get(locale);
  if (!pending) {
    pending = Promise.all(
      HELP_ARTICLE_IDS.map(async (id) => {
        const [source, english] = await Promise.all([
          loadSource(locale, id),
          locale === 'en' ? null : loadSource('en', id),
        ]);
        if (source === null) return null;
        const article = parseArticle(id, locale, source);
        if (english !== null) article.related = parseArticle(id, 'en', english).related;
        return article;
      }),
    ).then((articles) => {
      const library = new Map<HelpArticleId, HelpArticle>();
      for (const article of articles) if (article) library.set(article.id, article);
      return library;
    });
    pending.catch(() => cache.delete(locale));
    cache.set(locale, pending);
  }
  return pending;
}
