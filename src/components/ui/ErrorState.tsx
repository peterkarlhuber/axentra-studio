import { AlertTriangle, Lock, RefreshCw, SearchX, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { errorTopic } from '@/help/error-topics';
import { HelpLink } from '@/help/HelpLink';
import { describeError } from '@/lib/errors';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import styles from './ErrorState.module.css';

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
  headingLevel?: 2 | 3;
}

/** Translated error with the request id for support, plus an optional retry. */
export function ErrorState({ error, onRetry, compact, headingLevel }: ErrorStateProps) {
  const { t } = useTranslation();
  const described = describeError(t, error);
  const { error: apiError } = described;
  const icon = apiError.isForbidden ? (
    <Lock />
  ) : apiError.isNotFound ? (
    <SearchX />
  ) : apiError.code === 'network_error' ? (
    <WifiOff />
  ) : (
    <AlertTriangle />
  );
  return (
    <div role="alert">
      <EmptyState
        compact={compact}
        headingLevel={headingLevel}
        tone={apiError.isForbidden || apiError.isNotFound ? 'warning' : 'danger'}
        icon={icon}
        title={described.title}
        description={
          <>
            <p>{described.message}</p>
            <p className={styles.help}>
              <HelpLink topic={errorTopic(apiError.code)} icon />
            </p>
            {described.issues.length > 0 ? (
              <ul className={styles.issues}>
                {described.issues.map((issue) => (
                  <li key={`${issue.field}:${issue.message}`}>
                    {issue.field ? <code>{issue.field}</code> : null} {issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
            {apiError.detail || described.requestId ? (
              <details className={styles.details}>
                <summary>{t('errors:details')}</summary>
                <dl>
                  {apiError.status ? (
                    <>
                      <dt>{t('errors:status')}</dt>
                      <dd>{apiError.status}</dd>
                    </>
                  ) : null}
                  <dt>{t('errors:code')}</dt>
                  <dd>
                    <code>{apiError.code}</code>
                  </dd>
                  {apiError.detail ? (
                    <>
                      <dt>{t('errors:serverMessage')}</dt>
                      <dd>{apiError.detail}</dd>
                    </>
                  ) : null}
                  {described.requestId ? (
                    <>
                      <dt>{t('errors:requestId')}</dt>
                      <dd>
                        <code>{described.requestId}</code>
                      </dd>
                    </>
                  ) : null}
                </dl>
              </details>
            ) : null}
          </>
        }
        action={
          onRetry && !apiError.isForbidden && !apiError.isNotFound ? (
            <Button icon={<RefreshCw />} onClick={onRetry}>
              {t('actions.retry')}
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
