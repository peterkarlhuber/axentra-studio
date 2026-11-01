import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from '@/lib/clsx';
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
          <img
            src="/branding/axentra-logo-transparent.png"
            alt={t('app.name')}
            width={188}
            height={65}
            className={styles.logoLight}
          />
          <img
            src="/branding/axentra-logo-on-dark.png"
            alt={t('app.name')}
            width={188}
            height={65}
            className={styles.logoDark}
          />
        </div>
        <div className={clsx(styles.card, wide && styles.wide)}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </main>
    </div>
  );
}
