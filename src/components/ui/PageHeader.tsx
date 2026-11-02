import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHelpButton } from '@/help/PageHelpButton';
import type { HelpTopic } from '@/help/manifest';
import { claimRouteFocus } from '@/lib/route-focus';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: ReactNode;
  /** Plain-text title for the document title when `title` is not a string. */
  documentTitle?: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  /** Help article for this page; shows a help button that opens it in the side panel. */
  help?: HelpTopic;
}

/**
 * Page title (the single h1). It receives focus after route changes, so screen reader
 * users hear the new page name, and it sets the document title.
 */
export function PageHeader({
  title,
  documentTitle,
  description,
  actions,
  meta,
  help,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLHeadingElement>(null);
  const plain = documentTitle ?? (typeof title === 'string' ? title : undefined);

  useEffect(() => {
    claimRouteFocus(ref.current);
  }, []);

  useEffect(() => {
    if (plain) document.title = `${plain} · ${t('app.name')}`;
  }, [plain, t]);

  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <h1 ref={ref} className={styles.title} tabIndex={-1} data-page-title>
          {title}
        </h1>
        {description ? <p className={styles.description}>{description}</p> : null}
        {meta ? <div className={styles.meta}>{meta}</div> : null}
      </div>
      {actions || help ? (
        <div className={styles.actions}>
          {help ? <PageHelpButton topic={help} /> : null}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
