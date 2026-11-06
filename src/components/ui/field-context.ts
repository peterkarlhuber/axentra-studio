import { createContext, useContext, type FormEvent } from 'react';

export interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  /** The browser refused the control on submit (constraint validation): show Studio's error. */
  reportNative?: (control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => void;
  /** The value changed: drop an error from `reportNative`. */
  clearNative?: () => void;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

interface WiredProps {
  id?: string | undefined;
  // The caller's own handlers (typed per element by React) are called first.
  onInvalid?: unknown;
  onInput?: unknown;
}

/**
 * Controls read their id/aria wiring from the surrounding FormField, if any. Inside a FormField
 * the browser's own validation bubble (untranslated, styled by the browser) is replaced by the
 * field's inline error: the control still blocks the submit, the FormField shows why.
 */
export function useFieldControl<P extends WiredProps>(props: P) {
  const field = useContext(FieldContext);
  const ariaInvalid = (props as { 'aria-invalid'?: unknown })['aria-invalid'];
  const ariaDescribedBy = (props as { 'aria-describedby'?: string })['aria-describedby'];
  const invalid = field?.invalid || ariaInvalid === true || ariaInvalid === 'true';
  return {
    id: props.id ?? field?.id,
    'aria-describedby':
      [ariaDescribedBy, field?.describedBy].filter(Boolean).join(' ') || undefined,
    'aria-invalid': invalid || undefined,
    required: (props as { required?: boolean }).required ?? field?.required,
    onInvalid: (event: FormEvent<Control>) => {
      (props.onInvalid as ((event: FormEvent<Control>) => void) | undefined)?.(event);
      if (!field?.reportNative || event.defaultPrevented) return;
      event.preventDefault();
      field.reportNative(event.currentTarget);
    },
    onInput: (event: FormEvent<Control>) => {
      (props.onInput as ((event: FormEvent<Control>) => void) | undefined)?.(event);
      field?.clearNative?.();
    },
  };
}
