import * as RadixSwitch from '@radix-ui/react-switch';
import { useId, type ReactNode } from 'react';
import styles from './Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
}: SwitchProps) {
  const generated = useId();
  const controlId = id ?? `sw-${generated}`;
  const descriptionId = description ? `${controlId}-desc` : undefined;
  return (
    <div className={styles.row}>
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
      <RadixSwitch.Root
        id={controlId}
        className={styles.root}
        checked={checked}
        disabled={disabled}
        aria-describedby={descriptionId}
        onCheckedChange={onCheckedChange}
      >
        <RadixSwitch.Thumb className={styles.thumb} />
      </RadixSwitch.Root>
    </div>
  );
}
