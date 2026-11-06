import { useCallback, useId, useMemo, useState, type ReactNode } from 'react';
import { InfoTip } from '@/help/InfoTip';
import type { HelpTopic } from '@/help/manifest';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import { FieldContext } from './field-context';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
  /** Always-visible one-line help under the control. */
  help?: ReactNode;
  /** Background for some users (effects, defaults, dependencies): an (i) toggletip by the label. */
  info?: ReactNode;
  /** Help article/section linked from the info tip ("Learn more"). */
  infoTopic?: HelpTopic;
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
  info,
  infoTopic,
  error,
  required = false,
  hideLabel,
  id,
  className,
}: FormFieldProps) {
  const { t } = useTranslation();
  const generated = useId();
  const controlId = id ?? `field-${generated}`;
  // The browser's constraint validation, shown as Studio's inline error (see useFieldControl).
  const [nativeError, setNativeError] = useState<string | null>(null);
  const shownError = error ?? nativeError;
  const helpId = help ? `${controlId}-help` : undefined;
  const errorId = shownError ? `${controlId}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  const reportNative = useCallback(
    (control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
      const { validity } = control;
      setNativeError(
        validity.valueMissing
          ? t('form.valueMissing')
          : validity.typeMismatch
            ? t('form.typeMismatch')
            : validity.rangeUnderflow
              ? t('form.rangeUnderflow', { min: control.getAttribute('min') ?? '' })
              : validity.rangeOverflow
                ? t('form.rangeOverflow', { max: control.getAttribute('max') ?? '' })
                : t('form.invalidValue'),
      );
      // Only the first refused control of the form takes the focus, as the browser would.
      const first = control.form?.querySelector<HTMLElement>(':invalid');
      if (!first || first === control) control.focus();
    },
    [t],
  );
  const clearNative = useCallback(() => setNativeError(null), []);
  const context = useMemo(
    () => ({
      id: controlId,
      describedBy,
      invalid: Boolean(shownError),
      required,
      reportNative,
      clearNative,
    }),
    [controlId, describedBy, shownError, required, reportNative, clearNative],
  );

  return (
    <FieldContext.Provider value={context}>
      <div className={clsx(styles.field, className)}>
        <div className={clsx(styles.labelRow, hideLabel && 'ax-sr-only')}>
          <label htmlFor={controlId} className={styles.label}>
            {label}
            {required ? (
              <span className={styles.required} aria-hidden="true">
                {' '}
                *
              </span>
            ) : null}
            {required ? <span className="ax-sr-only"> ({t('form.required')})</span> : null}
          </label>
          {info ? (
            <InfoTip
              label={t('help:tip.about', {
                topic: typeof label === 'string' ? label : t('help:tip.more'),
              })}
              topic={infoTopic}
            >
              {info}
            </InfoTip>
          ) : null}
        </div>
        {children}
        {help ? (
          <p id={helpId} className={styles.help}>
            {help}
          </p>
        ) : null}
        {shownError ? (
          <p id={errorId} className={styles.error}>
            {shownError}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
