import { useTranslation } from 'react-i18next';
import type { JobStatus, WebhookDeliveryStatus } from '@/api/models';
import { Alert, type Tone } from '@/components/ui';
import { describeError } from '@/lib/errors';
import clsx from '@/lib/clsx';
import badgeStyles from '@/components/ui/Badge.module.css';
import { DELIVERY_TONES, JOB_TONES } from './events-utils';

function Pill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={clsx(badgeStyles.badge, badgeStyles.pill, badgeStyles[tone])}>
      <span className={badgeStyles.dot} aria-hidden="true" />
      {label}
    </span>
  );
}

export function JobStatusPill({ status }: { status: JobStatus }) {
  const { t } = useTranslation('events');
  return <Pill tone={JOB_TONES[status] ?? 'neutral'} label={t(`jobStatus.${status}`)} />;
}

export function DeliveryStatusPill({ status }: { status: WebhookDeliveryStatus }) {
  const { t } = useTranslation('events');
  return <Pill tone={DELIVERY_TONES[status] ?? 'neutral'} label={t(`deliveryStatus.${status}`)} />;
}

/**
 * Error of a form submit, shown above the form. Axentra reports many validation problems
 * (cron syntax, URL rules, reserved kinds) only in `detail`, so the server text is shown as
 * the explanation next to the translated title, with the request id for support.
 */
export function FormError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  if (!error) return null;
  const described = describeError(t, error);
  if (described.error.isUnauthenticated) return null;
  const detail =
    described.issues.length > 0
      ? described.issues.map((issue) => `${issue.field}: ${issue.message}`).join('; ')
      : described.error.code === 'validation_failed' && described.error.detail
        ? described.error.detail
        : described.message;
  // Other problems (e.g. 403 "job kind ... is not open to tenant callers") keep the translated
  // message and add the server's explanation.
  const serverDetail =
    described.issues.length === 0 &&
    described.error.code !== 'validation_failed' &&
    described.error.detail &&
    described.error.detail !== detail
      ? described.error.detail
      : null;
  return (
    <Alert tone="danger" title={described.title}>
      <p>{detail}</p>
      {serverDetail ? (
        <p>
          {t('errors:serverMessage')}: {serverDetail}
        </p>
      ) : null}
      {described.requestId ? (
        <p>
          {t('errors:requestId')}: <code>{described.requestId}</code>
        </p>
      ) : null}
    </Alert>
  );
}
