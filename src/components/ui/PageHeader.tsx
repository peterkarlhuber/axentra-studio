import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { claimRouteFocus } from '@/lib/route-focus';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: ReactNode;
  /** Plain-text title for the document title when `title` is not a string. */
  documentTitle?: string;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}

/**
 * Page title (the single h1). It receives focus after route changes, so screen reader
 * users hear the new page name, and it sets the document title.
 */
export function PageHeader({ title, documentTitle, description, actions, meta }: PageHeaderProps) {
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
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
