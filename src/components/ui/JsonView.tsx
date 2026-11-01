import { useTranslation } from 'react-i18next';
import { CopyField } from './CopyField';
import styles from './JsonView.module.css';

/** Read-only pretty-printed JSON. Text only (no HTML injection), wraps long values. */
export function JsonView({
  value,
  label,
  maxHeight = 480,
}: {
  value: unknown;
  label: string;
  maxHeight?: number;
}) {
  const { t } = useTranslation();
  const text = JSON.stringify(value, null, 2) ?? 'null';
  return (
    <div className={styles.wrapper}>
      <pre
        className={styles.pre}
        style={{ maxHeight }}
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        <code>{text}</code>
      </pre>
      <details className={styles.copy}>
        <summary>{t('copy.copyJson')}</summary>
        <CopyField value={text} label={label} hideLabel />
      </details>
    </div>
  );
}
