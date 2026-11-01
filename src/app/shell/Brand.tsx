import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import styles from './Brand.module.css';

/**
 * Logo lockup for dark surfaces: the cropped hexagon mark plus the wordmark set as text,
 * so it stays crisp and legible on the navy sidebar in both themes.
 */
export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={clsx(styles.brand, collapsed && styles.collapsed)}>
      <img
        src="/branding/axentra-mark-64.png"
        alt=""
        width={32}
        height={32}
        className={styles.mark}
      />
      <span className={styles.text} aria-hidden="true">
        <span className={styles.word}>Axentra</span>{' '}
        <span className={styles.product}>{t('app.studio')}</span>
      </span>
      <span className="ax-sr-only">{t('app.name')}</span>
    </span>
  );
}
