import { createContext, useContext } from 'react';

export interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

/** Controls read their id/aria wiring from the surrounding FormField, if any. */
export function useFieldControl<P extends { id?: string | undefined }>(props: P) {
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
  };
}
