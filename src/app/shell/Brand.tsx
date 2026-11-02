import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/layout/Logo';
import clsx from '@/lib/clsx';
import styles from './Brand.module.css';

/**
 * Sidebar brand. The sidebar is navy in both themes, so the expanded rail shows the official
 * lockup with the white wordmark plus a "Studio" tag; the collapsed rail shows the symbol only.
 */
export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  if (collapsed) {
    return (
      <span className={clsx(styles.brand, styles.collapsed)}>
        <Logo variant="mark" height={32} alt={t('app.name')} className={styles.mark} />
      </span>
    );
  }
  return (
    <span className={styles.brand}>
      <Logo surface="dark" height={36} alt="Axentra" className={styles.lockup} />
      <span className={styles.product}>{t('app.studio')}</span>
    </span>
  );
}
