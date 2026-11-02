import { ArrowRight, BookOpen, Compass, GraduationCap, LifeBuoy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { HelpLibrary } from './content';
import { HelpSearchBox } from './HelpSearchBox';
import { HELP_CHAPTERS, type HelpArticleId } from './manifest';
import { HelpSearchIndex, normalize, tokenize, type SearchResult } from './search';
import { useHelpLibrary } from './useHelpLibrary';
import styles from './help.module.css';

const START_HERE: { id: HelpArticleId; icon: typeof BookOpen }[] = [
  { id: 'overview', icon: Compass },
  { id: 'first-steps', icon: GraduationCap },
  { id: 'interface', icon: BookOpen },
  { id: 'troubleshooting', icon: LifeBuoy },
];

export function HelpHomePage() {
  const { t } = useTranslation('help');
  const library = useHelpLibrary();
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const debounced = useDebouncedValue(query, 150);

  // Keep the query in the URL (replace, so typing does not flood the history).
  useEffect(() => {
    const current = params.get('q') ?? '';
    if (current === debounced) return;
    setParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced, params, setParams]);

  return (
    <div className={styles.home}>
      <PageHeader title={t('center.title')} description={t('center.description')} />
      <HelpSearchBox initial={initial} onQueryChange={setQuery} />
      {library.isPending ? (
        <div className={styles.skeletons}>
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} height={56} />
          ))}
        </div>
      ) : library.isError ? (
        <ErrorState error={library.error} onRetry={() => void library.refetch()} />
      ) : debounced ? (
        <SearchResults library={library.data} query={debounced} />
      ) : (
        <Overview library={library.data} />
      )}
      <p className={styles.version}>{t('center.version', { version: __STUDIO_VERSION__ })}</p>
    </div>
  );
}

function SearchResults({ library, query }: { library: HelpLibrary; query: string }) {
  const { t } = useTranslation('help');
  const index = useMemo(() => new HelpSearchIndex(library), [library]);
  const results = useMemo(() => index.search(query), [index, query]);
  const terms = useMemo(() => tokenize(query), [query]);

  return (
    <section aria-labelledby="help-results-title" className={styles.results}>
      <h2 id="help-results-title" className={styles.resultsTitle} aria-live="polite">
        {results.length
          ? t('search.results', { count: results.length, query })
          : t('search.noResults', { query })}
      </h2>
      {results.length === 0 ? (
        <p className={styles.muted}>{t('search.noResultsHint')}</p>
      ) : (
        <ol className={styles.resultList}>
          {results.map((result) => (
            <li key={result.article}>
              <ResultCard result={result} terms={terms} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ResultCard({ result, terms }: { result: SearchResult; terms: string[] }) {
  const { t } = useTranslation('help');
  const to = `/help/${result.article}${result.anchor ? `#${result.anchor}` : ''}`;
  return (
    <Link to={to} className={styles.resultCard}>
      <span className={styles.resultTitle}>
        <Highlight text={result.title} terms={terms} />
      </span>
      {result.section ? (
        <span className={styles.resultSection}>
          {t('search.inSection', { section: result.section })}
        </span>
      ) : null}
      <span className={styles.resultSnippet}>
        <Highlight text={result.snippet} terms={terms} />
      </span>
    </Link>
  );
}

/** Marks words that contain a search term (diacritic-insensitive). */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  const parts = text.split(/([\p{L}\p{N}]+)/u);
  return (
    <>
      {parts.map((part, index) => {
        const key = normalize(part);
        return key && terms.some((term) => key.includes(term)) ? (
          <mark key={index}>{part}</mark>
        ) : (
          part
        );
      })}
    </>
  );
}

function Overview({ library }: { library: HelpLibrary }) {
  const { t } = useTranslation('help');
  return (
    <>
      <section aria-labelledby="help-start-title" className={styles.startHere}>
        <h2 id="help-start-title" className={styles.sectionTitle}>
          {t('center.startHere')}
        </h2>
        <p className={styles.muted}>{t('center.startHereDescription')}</p>
        <ul className={styles.startGrid}>
          {START_HERE.map(({ id, icon: Icon }) => {
            const article = library.get(id);
            if (!article) return null;
            return (
              <li key={id}>
                <Link to={`/help/${id}`} className={styles.startCard}>
                  <span className={styles.startIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <span className={styles.startTitle}>{article.title}</span>
                  <span className={styles.startSummary}>{article.summary}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="help-chapters-title">
        <h2 id="help-chapters-title" className={styles.sectionTitle}>
          {t('center.chapters')}
        </h2>
        <div className={styles.chapterGrid}>
          {HELP_CHAPTERS.map((chapter) => (
            <section
              key={chapter.id}
              className={styles.chapterCard}
              aria-labelledby={`help-home-${chapter.id}`}
            >
              <h3 id={`help-home-${chapter.id}`} className={styles.chapterCardTitle}>
                {t(`chapters.${chapter.id}`)}
              </h3>
              <p className={styles.chapterCount}>
                {t('center.articles', { count: chapter.articles.length })}
              </p>
              <ul>
                {chapter.articles.map((id) => {
                  const article = library.get(id);
                  return article ? (
                    <li key={id}>
                      <Link to={`/help/${id}`}>
                        <ArrowRight aria-hidden="true" />
                        {article.title}
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
