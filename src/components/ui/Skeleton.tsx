import type { CSSProperties } from 'react';
import clsx from '@/lib/clsx';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  className?: string;
}

/** Decorative placeholder; the busy state is announced by the surrounding region. */
export function Skeleton({ width = '100%', height = 14, radius, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
