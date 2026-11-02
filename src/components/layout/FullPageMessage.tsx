import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { HexIcon } from '@/components/ui';
import { CenteredLayout } from './CenteredLayout';
import { Logo } from './Logo';
import styles from './FullPageMessage.module.css';

export function FullPageMessage({
  icon,
  title,
  children,
  actions,
  tone = 'neutral',
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: 'neutral' | 'danger' | 'warning' | 'brand';
}) {
  return (
    <CenteredLayout wide>
      <div className={styles.wrapper} role={tone === 'danger' ? 'alert' : undefined}>
        <HexIcon tone={tone}>{icon}</HexIcon>
        <h1 className={styles.title}>{title}</h1>
        {children ? <div className={styles.body}>{children}</div> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </CenteredLayout>
  );
}

export function SplashScreen({ label }: { label: string }) {
  return (
    <div className={styles.splash} role="status" aria-live="polite">
      <Logo variant="mark" height={72} alt="" className={styles.pulse} />
      <span className="ax-sr-only">{label}</span>
    </div>
  );
}

/** Shown while the first lazy route module loads (React Router `HydrateFallback`). */
export function InitialLoad() {
  const { t } = useTranslation();
  return <SplashScreen label={t('states.loading')} />;
}
