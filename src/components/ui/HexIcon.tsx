import type { ReactNode } from 'react';
import clsx from '@/lib/clsx';
import styles from './HexIcon.module.css';

/** An icon inside the Axentra hexagon, echoing the logo's node mark. */
export function HexIcon({
  children,
  tone = 'neutral',
  size = 'lg',
}: {
  children?: ReactNode;
  tone?: 'neutral' | 'danger' | 'warning' | 'brand';
  size?: 'md' | 'lg';
}) {
  return (
    <span className={clsx(styles.hex, styles[tone], styles[size])} aria-hidden="true">
      <svg viewBox="0 0 56 64" className={styles.shape}>
        <path d="M28 2 54 17v30L28 62 2 47V17Z" />
      </svg>
      <span className={styles.icon}>{children}</span>
    </span>
  );
}
