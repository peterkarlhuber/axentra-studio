import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { HelpArticle, HelpLibrary } from './content';
import { Markdown, type MarkdownContext } from './Markdown';
import styles from './help.module.css';

/** The rendered article text plus its "Related topics" list. */
export function ArticleBody({
  article,
  library,
  context,
  headingLevel = 1,
}: {
  article: HelpArticle;
  library: HelpLibrary;
  context: MarkdownContext;
  /** 1 on the help center page (the article title is the page h1), 2 in the side panel. */
  headingLevel?: 1 | 2;
}) {
  const { t } = useTranslation('help');
  const related = article.related
    .map((id) => library.get(id))
    .filter((entry): entry is HelpArticle => Boolean(entry));
  const RelatedHeading = headingLevel === 1 ? 'h2' : 'h3';
  return (
    <div className={styles.prose} lang={article.locale}>
      <Markdown tokens={article.tokens} context={{ ...context, articleId: article.id }} />
      {related.length > 0 ? (
        <nav className={styles.related} aria-labelledby={`${context.idPrefix ?? ''}related`}>
          <RelatedHeading id={`${context.idPrefix ?? ''}related`} className={styles.relatedTitle}>
            {t('article.related')}
          </RelatedHeading>
          <ul>
            {related.map((entry) => (
              <li key={entry.id}>
                <Link
                  to={context.topicHref(entry.id)}
                  onClick={
                    context.onTopic
                      ? (event) => {
                          event.preventDefault();
                          context.onTopic?.(entry.id);
                        }
                      : undefined
                  }
                >
                  <span className={styles.relatedName}>{entry.title}</span>
                  <span className={styles.relatedSummary}>{entry.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
