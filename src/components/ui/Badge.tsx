import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import { toneForStatus, type Tone } from './status';
import styles from './Badge.module.css';

export interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return <span className={clsx(styles.badge, styles[tone], className)}>{children}</span>;
}

export interface StatusPillProps {
  status: string | null | undefined;
  className?: string;
}

/** Status with a colored dot. Known statuses are translated; unknown ones are shown as-is. */
export function StatusPill({ status, className }: StatusPillProps) {
  const { t } = useTranslation();
  if (!status) return null;
  const tone = toneForStatus(status);
  return (
    <span className={clsx(styles.badge, styles.pill, styles[tone], className)}>
      <span className={styles.dot} aria-hidden="true" />
      {t(`status.${status.toLowerCase()}`, { defaultValue: status })}
    </span>
  );
}
