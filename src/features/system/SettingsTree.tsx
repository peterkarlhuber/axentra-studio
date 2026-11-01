import styles from './system.module.css';

function renderValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value))
    return value.length === 0
      ? '[]'
      : value
          .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
          .join(', ');
  return String(value);
}

/** Nested settings rendered as a key tree (read-only). */
export function SettingsTree({ value, label }: { value: Record<string, unknown>; label?: string }) {
  return (
    <ul className={styles.tree} aria-label={label}>
      {Object.entries(value).map(([key, child]) =>
        child && typeof child === 'object' && !Array.isArray(child) ? (
          <li key={key}>
            <div className={styles.treeGroup}>{key}</div>
            <SettingsTree value={child as Record<string, unknown>} />
          </li>
        ) : (
          <li key={key} className={styles.treeRow}>
            <span className={styles.treeKey}>{key}</span>
            <span className={styles.treeValue}>{renderValue(child)}</span>
          </li>
        ),
      )}
    </ul>
  );
}
