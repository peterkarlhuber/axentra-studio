import type { ReactNode } from 'react';
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
  /** Heading level for the title, to keep the page outline valid. */
  headingLevel?: 2 | 3;
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
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className={clsx(styles.empty, compact && styles.compact, styles[tone], className)}>
      {icon !== null ? <HexIcon tone={tone}>{icon}</HexIcon> : null}
      <Heading className={styles.title}>{title}</Heading>
      {description ? <div className={styles.description}>{description}</div> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
