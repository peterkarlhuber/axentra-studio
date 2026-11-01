import type { ComponentProps } from 'react';
import clsx from '@/lib/clsx';
import { useFieldControl } from './field-context';
import styles from './Input.module.css';

export type InputProps = ComponentProps<'input'>;

export function Input({ className, ...props }: InputProps) {
  const wiring = useFieldControl(props);
  return <input {...props} {...wiring} className={clsx(styles.control, className)} />;
}

export type TextareaProps = ComponentProps<'textarea'> & { mono?: boolean };

export function Textarea({ className, mono, ...props }: TextareaProps) {
  const wiring = useFieldControl(props);
  return (
    <textarea
      {...props}
      {...wiring}
      className={clsx(styles.control, styles.textarea, mono && styles.mono, className)}
    />
  );
}

export type SelectProps = ComponentProps<'select'>;

/** Native select: best keyboard, screen reader and mobile support out of the box. */
export function Select({ className, children, ...props }: SelectProps) {
  const wiring = useFieldControl(props);
  return (
    <select {...props} {...wiring} className={clsx(styles.control, styles.select, className)}>
      {children}
    </select>
  );
}
