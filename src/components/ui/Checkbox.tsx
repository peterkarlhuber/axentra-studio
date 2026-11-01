import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
  name,
}: CheckboxProps) {
  const generated = useId();
  const controlId = id ?? `cb-${generated}`;
  const descriptionId = description ? `${controlId}-desc` : undefined;
  return (
    <div className={styles.row}>
      <RadixCheckbox.Root
        id={controlId}
        name={name}
        className={styles.box}
        checked={checked}
        disabled={disabled}
        aria-describedby={descriptionId}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      >
        <RadixCheckbox.Indicator className={styles.indicator}>
          {checked === 'indeterminate' ? <Minus aria-hidden /> : <Check aria-hidden />}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <div className={styles.text}>
        <label htmlFor={controlId} className={styles.label}>
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
