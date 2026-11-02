import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui';
import { describeError } from '@/lib/errors';

/**
 * A failed request inside a dialog: translated title and message, the server's problem
 * `detail` as secondary information (e.g. which role permission the caller lacks) and the
 * request id for support. `children` adds a follow-up action.
 */
export function ProblemAlert({ error, children }: { error: unknown; children?: ReactNode }) {
  const { t } = useTranslation();
  if (!error) return null;
  const described = describeError(t, error);
  if (described.error.isUnauthenticated) return null;
  const detail = described.issues.length
    ? described.issues.map((issue) => `${issue.field}: ${issue.message}`).join('; ')
    : described.error.detail;
  return (
    <Alert tone={described.error.isNotFound ? 'warning' : 'danger'} title={described.title}>
      <p>{described.message}</p>
      {detail && detail !== described.message ? (
        <p>
          {t('errors:serverMessage')}: {detail}
        </p>
      ) : null}
      {described.requestId ? (
        <p>
          {t('errors:requestId')}: <code>{described.requestId}</code>
        </p>
      ) : null}
      {children}
    </Alert>
  );
}
