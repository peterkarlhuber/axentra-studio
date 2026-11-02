import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
import { Logo } from './Logo';
import styles from './CenteredLayout.module.css';

/**
 * Full-page layout for pre-app screens (login, setup, bootstrap errors): a navy brand
 * panel with the hexagon motif and a content card.
 */
export function CenteredLayout({
  children,
  wide,
  footer,
}: {
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <div className={clsx(styles.backdrop, 'ax-hex-motif')} aria-hidden="true" />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <div className={styles.logo}>
          <Logo height={56} alt={t('app.name')} />
        </div>
        <div className={clsx(styles.card, wide && styles.wide)}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </main>
    </div>
  );
}
