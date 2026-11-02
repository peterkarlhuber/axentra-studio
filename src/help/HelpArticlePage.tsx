import { ChevronLeft, ChevronRight, Link2, ListTree, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { IconButton } from '@/components/ui/IconButton';
import { claimRouteFocus } from '@/lib/route-focus';
import { ArticleBody } from './ArticleBody';
import type { HelpArticle, HelpLibrary } from './content';
import { HelpChapterNav } from './HelpChapterNav';
import { helpHref } from './help-context';
import { HelpSearchBox } from './HelpSearchBox';
import { chapterOf, HELP_ARTICLE_IDS, isHelpArticleId, type HelpArticleId } from './manifest';
import { useHelpLibrary, useHelpProductId } from './useHelpLibrary';
import styles from './help.module.css';

const HIGHLIGHT = styles.highlight ?? 'highlight';

export function HelpArticlePage() {
  const { articleId = '' } = useParams();
  const library = useHelpLibrary();

  if (!isHelpArticleId(articleId)) return <ArticleNotFound id={articleId} />;
  if (library.isPending) {
    return (
      <div className={styles.skeletons}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton key={index} height={index === 0 ? 36 : 18} />
        ))}
      </div>
    );
  }
  if (library.isError) {
    return <ErrorState error={library.error} onRetry={() => void library.refetch()} />;
  }
  const article = library.data.get(articleId);
  if (!article) return <ArticleNotFound id={articleId} />;
  return (
    <ArticleView key={`${article.locale}-${article.id}`} article={article} library={library.data} />
  );
}

function ArticleNotFound({ id }: { id: string }) {
  const { t } = useTranslation('help');
  return (
    <EmptyState
      title={<span data-page-title>{t('center.notFoundTitle')}</span>}
      description={t('center.notFoundDescription', { id })}
      action={<Link to="/help">{t('center.home')}</Link>}
    />
  );
}

function ArticleView({ article, library }: { article: HelpArticle; library: HelpLibrary }) {
  const { t } = useTranslation('help');
  const { hash } = useLocation();
  const productId = useHelpProductId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const chapter = chapterOf(article.id);
  const index = HELP_ARTICLE_IDS.indexOf(article.id);
  const previous = library.get(HELP_ARTICLE_IDS[index - 1] as HelpArticleId);
  const next = library.get(HELP_ARTICLE_IDS[index + 1] as HelpArticleId);

  useEffect(() => {
    document.title = `${article.title} · ${t('center.title')} · ${t('common:app.name')}`;
  }, [article.title, t]);

  useEffect(() => {
    claimRouteFocus(titleRef.current);
  }, []);

  // Scroll to (and focus) the section named in the URL fragment.
  useEffect(() => {
    const anchor = decodeURIComponent(hash.replace(/^#/, ''));
    if (!anchor) {
      window.scrollTo({ top: 0 });
      return;
    }
    const target = document.getElementById(anchor);
    if (!target) return;
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
    target.classList.add(HIGHLIGHT);
    const timer = window.setTimeout(() => target.classList.remove(HIGHLIGHT), 2400);
    return () => window.clearTimeout(timer);
  }, [hash, article]);

  return (
    <div className={styles.articleLayout}>
      <aside className={styles.sidebar}>
        <HelpSearchBox />
        <details className={styles.mobileChapters}>
          <summary>
            <Menu aria-hidden="true" />
            {t('center.allChapters')}
          </summary>
          <HelpChapterNav library={library} current={article.id} />
        </details>
        <div className={styles.desktopChapters}>
          <HelpChapterNav library={library} current={article.id} />
        </div>
      </aside>

      <article className={styles.article} aria-labelledby="help-article-title">
        <nav aria-label={t('article.breadcrumb')} className={styles.articleCrumbs}>
          <ol>
            <li>
              <Link to="/help">{t('center.title')}</Link>
            </li>
            <li>
              <ChevronRight aria-hidden="true" />
              <span>{t(`chapters.${chapter}`)}</span>
            </li>
          </ol>
        </nav>
        <header className={styles.articleHeader}>
          <h1
            id="help-article-title"
            ref={titleRef}
            tabIndex={-1}
            data-page-title
            className={styles.articleTitle}
          >
            {article.title}
          </h1>
          <CopyLinkButton id={article.id} />
        </header>
        {article.summary ? <p className={styles.lead}>{article.summary}</p> : null}

        {article.headings.length > 2 ? (
          <details className={styles.mobileToc}>
            <summary>
              <ListTree aria-hidden="true" />
              {t('article.onThisPage')}
            </summary>
            <Toc article={article} />
          </details>
        ) : null}

        <ArticleBody
          article={article}
          library={library}
          context={{ topicHref: helpHref, productId }}
        />

        <nav className={styles.pager} aria-label={t('article.pager')}>
          {previous ? (
            <Link to={`/help/${previous.id}`} className={styles.pagerLink} rel="prev">
              <span className={styles.pagerLabel}>
                <ChevronLeft aria-hidden="true" />
                {t('article.previous')}
              </span>
              <span className={styles.pagerTitle}>{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/help/${next.id}`} className={styles.pagerLink} data-next rel="next">
              <span className={styles.pagerLabel}>
                {t('article.next')}
                <ChevronRight aria-hidden="true" />
              </span>
              <span className={styles.pagerTitle}>{next.title}</span>
            </Link>
          ) : null}
        </nav>
      </article>

      {article.headings.length > 2 ? (
        <aside className={styles.tocColumn} aria-labelledby="help-toc-title">
          <p id="help-toc-title" className={styles.tocTitle}>
            {t('article.onThisPage')}
          </p>
          <Toc article={article} />
        </aside>
      ) : null}
    </div>
  );
}

function Toc({ article }: { article: HelpArticle }) {
  return (
    <ul className={styles.toc}>
      {article.headings.map((heading) => (
        <li key={heading.id} data-level={heading.level}>
          <Link to={{ hash: heading.id }} replace>
            {heading.text}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CopyLinkButton({ id }: { id: HelpArticleId }) {
  const { t } = useTranslation('help');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <>
      <IconButton
        variant="ghost"
        label={t('article.copyLink')}
        icon={<Link2 />}
        onClick={() =>
          void navigator.clipboard
            .writeText(`${window.location.origin}/help/${id}`)
            .then(() => setCopied(true))
            .catch(() => undefined)
        }
      />
      <span className="ax-sr-only" role="status">
        {copied ? t('article.linkCopied') : ''}
      </span>
    </>
  );
}
