import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { jobsApi } from '@/api/endpoints';
import type { Job } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import { useCrumbLabel } from '@/app/crumbs';
import {
  Alert,
  Badge,
  Button,
  Card,
  DetailList,
  ErrorState,
  JsonView,
  PageHeader,
  Skeleton,
  Time,
  layout,
} from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { canCancelJob, canRetryJob, isSkippedJob } from './events-utils';
import { JobActionDialog } from './JobsPage';
import { JobStatusPill } from './shared';
import styles from './events.module.css';

/** Unfinished jobs are polled so the page follows the job without a manual reload. */
const POLL_MS = 3000;

export function JobDetailPage() {
  const { t } = useTranslation('events');
  const { jobId = '' } = useParams();
  const { productId } = useProductScope();
  const can = useCan();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<{ action: 'retry' | 'cancel'; job: Job } | null>(null);
  const key = queryKeys.job(productId, jobId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => jobsApi.get(productId, jobId),
    refetchInterval: (current) => {
      const status = current.state.data?.status;
      return status === 'queued' || status === 'running' ? POLL_MS : false;
    },
  });
  useCrumbLabel(query.data?.kind);

  if (query.isPending) {
    return (
      <div className={layout.stack} aria-busy="true">
        <Skeleton width={260} height={36} />
        <Skeleton height={240} radius={12} />
      </div>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const job = query.data;
  const canManage = can('jobs:manage');

  return (
    <div className={layout.stack}>
      <PageHeader
        title={<code>{job.kind}</code>}
        documentTitle={job.kind}
        help="jobs#job-detail"
        meta={
          <>
            <JobStatusPill status={job.status} />
            <code className={layout.mono}>{job.id}</code>
          </>
        }
        actions={
          canManage ? (
            <>
              {canRetryJob(job.status) ? (
                <Button icon={<RotateCcw />} onClick={() => setConfirm({ action: 'retry', job })}>
                  {t('jobs.retry')}
                </Button>
              ) : null}
              {canCancelJob(job.status) && !job.cancel_requested ? (
                <Button
                  variant="danger"
                  icon={<Ban />}
                  onClick={() => setConfirm({ action: 'cancel', job })}
                >
                  {t('jobs.cancel')}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />
      {job.cancel_requested && job.status === 'running' ? (
        <Alert tone="warning">
          {t('jobs.cancelRequestedNotice')}{' '}
          <HelpLink topic="jobs#cancel">{t('common:help.learnMore')}</HelpLink>
        </Alert>
      ) : null}
      <div className={layout.grid2}>
        <Card title={t('jobs.detail.details')}>
          <DetailList
            items={[
              { label: t('jobs.id'), value: job.id, mono: true },
              { label: t('jobs.kind'), value: job.kind, mono: true },
              { label: t('jobs.status'), value: <JobStatusPill status={job.status} /> },
              {
                label: t('jobs.tenant'),
                value: job.tenant_id ?? t('jobs.productLevel'),
                mono: Boolean(job.tenant_id),
              },
              {
                label: t('jobs.attempts'),
                value: t('jobs.attemptsValue', { attempts: job.attempts, max: job.max_attempts }),
              },
              { label: t('jobs.priority'), value: String(job.priority) },
              { label: t('jobs.idempotencyKey'), value: job.idempotency_key, mono: true },
              {
                label: t('jobs.detail.schedule'),
                value: job.schedule_id ? (
                  <Link className={layout.link} to="../../schedules" relative="path">
                    <code>{job.schedule_id}</code>
                  </Link>
                ) : null,
              },
              { label: t('jobs.detail.worker'), value: job.worker, mono: true },
              {
                label: t('jobs.detail.cancelRequested'),
                value: job.cancel_requested ? <Badge tone="warning">{t('yes')}</Badge> : null,
              },
              { label: t('jobs.detail.createdBy'), value: job.created_by, mono: true },
            ]}
          />
        </Card>
        <Card title={t('jobs.detail.timeline')}>
          <DetailList
            items={[
              { label: t('jobs.created'), value: <Time value={job.created_at} mode="absolute" /> },
              {
                label: t('jobs.detail.runAfter'),
                value: <Time value={job.run_after} mode="absolute" />,
              },
              {
                label: t('jobs.detail.started'),
                value: job.started_at ? <Time value={job.started_at} mode="absolute" /> : null,
              },
              {
                label: t('jobs.detail.leaseUntil'),
                value: job.lease_until ? <Time value={job.lease_until} mode="absolute" /> : null,
              },
              {
                label: t('jobs.detail.finished'),
                value: job.finished_at ? <Time value={job.finished_at} mode="absolute" /> : null,
              },
              { label: t('jobs.updated'), value: <Time value={job.updated_at} mode="absolute" /> },
            ]}
          />
        </Card>
      </div>
      {isSkippedJob(job) ? (
        <Alert tone="warning" title={t('jobs.detail.skippedTitle')}>
          <p>{t('jobs.detail.skippedBody')}</p>
          <HelpLink topic="jobs#statuses">{t('common:help.learnMore')}</HelpLink>
        </Alert>
      ) : null}
      <Card title={t('jobs.detail.lastError')} description={t('jobs.detail.lastErrorHelp')}>
        {job.last_error ? (
          <pre
            className={styles.errorText}
            role="region"
            tabIndex={0}
            aria-label={t('jobs.detail.lastError')}
          >
            {job.last_error}
          </pre>
        ) : (
          <p className={layout.muted}>{t('jobs.detail.noError')}</p>
        )}
      </Card>
      <div className={layout.grid2}>
        <Card title={t('jobs.payload')} description={t('jobs.detail.redactedHelp')}>
          <JsonView value={job.payload ?? {}} label={t('jobs.payload')} maxHeight={320} />
        </Card>
        <Card title={t('jobs.detail.result')}>
          {job.result === null || job.result === undefined ? (
            <p className={layout.muted}>{t('jobs.detail.noResult')}</p>
          ) : (
            <JsonView value={job.result} label={t('jobs.detail.result')} maxHeight={320} />
          )}
        </Card>
      </div>
      <JobActionDialog
        productId={productId}
        value={confirm}
        onClose={() => setConfirm(null)}
        onDone={(updated) => {
          queryClient.setQueryData(key, updated);
          void queryClient.invalidateQueries({ queryKey: ['products', productId, 'jobs'] });
        }}
      />
    </div>
  );
}
