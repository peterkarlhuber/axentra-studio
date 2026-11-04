import { useEffect, useRef, type ReactNode } from 'react';
import { claimRouteFocus } from '@/lib/route-focus';
import clsx from '@/lib/clsx';
import { HexIcon } from './HexIcon';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'danger' | 'warning';
  compact?: boolean;
  className?: string;
  /**
   * Heading level for the title, to keep the page outline valid. `1` when the state replaces a
   * whole page (for example a detail page whose item was not found): the title is then the page
   * title and receives the focus after a navigation, like PageHeader's.
   */
  headingLevel?: 1 | 2 | 3;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  tone = 'neutral',
  compact,
  className,
  headingLevel = 2,
}: EmptyStateProps) {
  const pageTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (headingLevel === 1) claimRouteFocus(pageTitle.current);
  }, [headingLevel]);
  const heading =
    headingLevel === 1 ? (
      <h1 ref={pageTitle} className={styles.title} tabIndex={-1} data-page-title>
        {title}
      </h1>
    ) : headingLevel === 2 ? (
      <h2 className={styles.title}>{title}</h2>
    ) : (
      <h3 className={styles.title}>{title}</h3>
    );
  return (
    <div className={clsx(styles.empty, compact && styles.compact, styles[tone], className)}>
      {icon !== null ? <HexIcon tone={tone}>{icon}</HexIcon> : null}
      {heading}
      {description ? <div className={styles.description}>{description}</div> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
