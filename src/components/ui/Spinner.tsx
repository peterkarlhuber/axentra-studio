import clsx from '@/lib/clsx';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label; omit when a surrounding element already announces the busy state. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <span
      className={clsx(styles.spinner, styles[size], className)}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
    >
      {label ? <span className="ax-sr-only">{label}</span> : null}
    </span>
  );
}
