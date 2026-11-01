import type { ReactNode } from 'react';
import clsx from '@/lib/clsx';
import styles from './DetailList.module.css';

export interface DetailItem {
  label: ReactNode;
  value: ReactNode;
  /** Render the value in the monospace font (ids, keys). */
  mono?: boolean;
}

export function DetailList({
  items,
  columns = 1,
}: {
  items: (DetailItem | null | false | undefined)[];
  columns?: 1 | 2;
}) {
  return (
    <dl className={clsx(styles.list, columns === 2 && styles.two)}>
      {items.filter(Boolean).map((item, index) => {
        const { label, value, mono } = item as DetailItem;
        return (
          <div className={styles.row} key={index}>
            <dt className={styles.label}>{label}</dt>
            <dd className={clsx(styles.value, mono && styles.mono)}>
              {value === null || value === undefined || value === '' ? (
                <span className={styles.empty}>—</span>
              ) : (
                value
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
