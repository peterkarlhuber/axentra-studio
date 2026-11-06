import * as RadixDialog from '@radix-ui/react-dialog';
import { ArrowLeft, BookOpen, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ErrorState, IconButton, Skeleton } from '@/components/ui';
import { ArticleBody } from './ArticleBody';
import { helpHref } from './help-context';
import { splitTopic, type HelpTopic } from './manifest';
import { useHelpLibrary, useHelpProductId } from './useHelpLibrary';
import styles from './help.module.css';

const HIGHLIGHT = styles.highlight ?? 'highlight';

const PANEL_PREFIX = 'help-panel-';

/**
 * The content of the help side panel. It is loaded on demand by `HelpProvider`, so the help
 * library and the Markdown renderer stay out of the initial bundle.
 */
export default function HelpPanelContent({
  topic,
  canGoBack,
  onBack,
  onTopic,
}: {
  topic: HelpTopic;
  canGoBack: boolean;
  onBack: () => void;
  onTopic: (topic: HelpTopic) => void;
}) {
  const { t } = useTranslation('help');
  const library = useHelpLibrary();
  const productId = useHelpProductId();
  const { article: articleId, anchor } = splitTopic(topic);
  const article = library.data?.get(articleId);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Scroll to the requested section once the article is rendered.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !article) return;
    const target = anchor
      ? body.querySelector<HTMLElement>(`#${CSS.escape(PANEL_PREFIX + anchor)}`)
      : null;
    if (target) {
      target.scrollIntoView({ block: 'start' });
      target.classList.add(HIGHLIGHT);
      const timer = window.setTimeout(() => target.classList.remove(HIGHLIGHT), 2400);
      return () => window.clearTimeout(timer);
    }
    body.scrollTop = 0;
    return undefined;
  }, [article, anchor]);

  return (
    <>
      <div className={styles.panelHeader}>
        {canGoBack ? (
          <IconButton label={t('panel.back')} icon={<ArrowLeft />} onClick={onBack} />
        ) : (
          <span className={styles.panelIcon} aria-hidden="true">
            <BookOpen />
          </span>
        )}
        <div className={styles.panelHeadings}>
          <p className={styles.panelEyebrow}>{t('panel.title')}</p>
          <RadixDialog.Title className={styles.panelTitle}>
            {article?.title ?? t('panel.title')}
          </RadixDialog.Title>
        </div>
        <RadixDialog.Close asChild>
          <IconButton label={t('panel.close')} icon={<X />} showTooltip={false} />
        </RadixDialog.Close>
      </div>
      <div ref={bodyRef} className={styles.panelBody}>
        {library.isPending ? (
          <div className={styles.skeletons}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} height={16} />
            ))}
          </div>
        ) : library.isError ? (
          <ErrorState error={library.error} onRetry={() => void library.refetch()} compact />
        ) : article ? (
          <>
            {article.summary ? <p className={styles.lead}>{article.summary}</p> : null}
            <ArticleBody
              article={article}
              library={library.data}
              headingLevel={2}
              context={{
                topicHref: helpHref,
                onTopic,
                productId,
                idPrefix: PANEL_PREFIX,
                headingShift: 1,
              }}
            />
          </>
        ) : (
          <p>{t('center.notFoundDescription', { id: articleId })}</p>
        )}
      </div>
      <div className={styles.panelFooter}>
        <Link className={styles.panelFullLink} to={helpHref(topic)}>
          <BookOpen aria-hidden="true" />
          {t('panel.openFull')}
        </Link>
      </div>
    </>
  );
}
