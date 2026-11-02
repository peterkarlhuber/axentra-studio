import { AlertOctagon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button, ErrorState } from '@/components/ui';
import { isApiError } from '@/api/errors';
import styles from './RouteErrorBoundary.module.css';

/** Last-resort boundary for render errors and failed lazy chunks. */
export function RouteErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (isApiError(error)) return <ErrorState error={error} />;
  const status = isRouteErrorResponse(error) ? error.status : undefined;
  return (
    <div className={styles.wrapper} role="alert">
      <AlertOctagon aria-hidden className={styles.icon} />
      <h1 className={styles.title}>{t('crash.title')}</h1>
      <p className={styles.body}>{status === 404 ? t('crash.notFound') : t('crash.body')}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        {t('crash.reload')}
      </Button>
      <p className={styles.body}>
        <a href="/help/troubleshooting#something-went-wrong">{t('help:tip.learnMore')}</a>
      </p>
    </div>
  );
}
