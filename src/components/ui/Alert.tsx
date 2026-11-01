import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import clsx from '@/lib/clsx';
import styles from './Alert.module.css';

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle };

/** Inline message block. `role="alert"` for errors so they are announced immediately. */
export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = ICONS[tone];
  return (
    <div
      className={clsx(styles.alert, styles[tone], className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon aria-hidden className={styles.icon} />
      <div className={styles.text}>
        {title ? <p className={styles.title}>{title}</p> : null}
        {children ? <div className={styles.body}>{children}</div> : null}
      </div>
    </div>
  );
}
