import type { ComponentProps, ReactNode } from 'react';
import clsx from '@/lib/clsx';
import { Spinner } from './Spinner';
import { Tooltip } from './Tooltip';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** Accessible name, also shown as tooltip. Required: icon-only buttons need a label. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'secondary' | 'danger' | 'onDark';
  size?: 'sm' | 'md';
  loading?: boolean;
  showTooltip?: boolean;
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  loading,
  disabled,
  showTooltip = true,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      className={clsx(styles.iconButton, styles[variant], styles[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon}
    </button>
  );
  return showTooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
}
