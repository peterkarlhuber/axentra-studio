import type { ComponentProps, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './button-class';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export interface ButtonProps extends ComponentProps<'button'>, CommonProps {
  loading?: boolean;
}

export function Button({
  variant,
  size,
  icon,
  iconRight,
  fullWidth,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon ? <span className={styles.icon}>{icon}</span> : null}
      {children ? <span className={styles.label}>{children}</span> : null}
      {iconRight && !loading ? <span className={styles.icon}>{iconRight}</span> : null}
    </button>
  );
}

export interface ButtonLinkProps extends LinkProps, CommonProps {}

/** A router link that looks like a button (navigation, not an action). */
export function ButtonLink({
  variant,
  size,
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName({ variant, size, fullWidth, className })} {...rest}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.label}>{children}</span>
      {iconRight ? <span className={styles.icon}>{iconRight}</span> : null}
    </Link>
  );
}
