import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/layout/Logo';
import clsx from '@/lib/clsx';
import styles from './Brand.module.css';

/**
 * Sidebar brand. The sidebar is navy in both themes, so the expanded rail shows the official
 * lockup with the white wordmark plus a "Studio" tag (smaller in the mobile drawer); the
 * collapsed rail shows the symbol only.
 */
export function Brand({
  collapsed = false,
  compact = false,
}: {
  collapsed?: boolean;
  /** Smaller lockup for the mobile drawer, which keeps room for its close button. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  if (collapsed) {
    return (
      <span className={clsx(styles.brand, styles.collapsed)}>
        <Logo variant="mark" height={32} alt={t('app.name')} className={styles.mark} />
      </span>
    );
  }
  return (
    <span className={clsx(styles.brand, compact && styles.compact)}>
      <Logo surface="dark" height={compact ? 30 : 36} alt="Axentra" className={styles.lockup} />
      <span className={styles.product}>{t('app.studio')}</span>
    </span>
  );
}
