import type { ComponentProps, ReactNode } from 'react';
import clsx from '@/lib/clsx';
import styles from './Card.module.css';

export interface CardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Remove body padding (for tables that span edge to edge). */
  flush?: boolean;
  /** Show the brand gradient accent line on top. */
  accent?: boolean;
  headingLevel?: 2 | 3;
}

export function Card({
  title,
  description,
  actions,
  flush,
  accent,
  headingLevel = 2,
  className,
  children,
  ...rest
}: CardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className={clsx(styles.card, accent && styles.accent, className)} {...rest}>
      {title || actions ? (
        <header className={styles.header}>
          <div className={styles.headings}>
            {title ? <Heading className={styles.title}>{title}</Heading> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={clsx(styles.body, flush && styles.flush)}>{children}</div>
    </section>
  );
}
