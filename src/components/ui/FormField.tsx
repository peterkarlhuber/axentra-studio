import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import { FieldContext } from './field-context';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Hide the label visually but keep it for assistive technology. */
  hideLabel?: boolean;
  id?: string;
  className?: string;
}

/**
 * Label + control + help + error with correct aria wiring. The control (Input, Select,
 * Textarea) picks up `id`, `aria-describedby`, `aria-invalid` and `required` from context.
 */
export function FormField({
  label,
  children,
  help,
  error,
  required = false,
  hideLabel,
  id,
  className,
}: FormFieldProps) {
  const { t } = useTranslation();
  const generated = useId();
  const controlId = id ?? `field-${generated}`;
  const helpId = help ? `${controlId}-help` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider
      value={{ id: controlId, describedBy, invalid: Boolean(error), required }}
    >
      <div className={clsx(styles.field, className)}>
        <label htmlFor={controlId} className={clsx(styles.label, hideLabel && 'ax-sr-only')}>
          {label}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
          {required ? <span className="ax-sr-only"> ({t('form.required')})</span> : null}
        </label>
        {children}
        {help ? (
          <p id={helpId} className={styles.help}>
            {help}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className={styles.error}>
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
