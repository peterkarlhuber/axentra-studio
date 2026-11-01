import clsx from '@/lib/clsx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export function buttonClassName({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  className,
}: {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
  className?: string | undefined;
}) {
  return clsx(styles.button, styles[variant], styles[size], fullWidth && styles.full, className);
}
