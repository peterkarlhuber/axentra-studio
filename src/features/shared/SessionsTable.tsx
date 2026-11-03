import { MonitorSmartphone, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserSession } from '@/api/models';
import { describeUserAgent } from '@/lib/user-agent';
import {
  Badge,
  DataTable,
  EmptyState,
  IconButton,
  Time,
  layout,
  type Column,
} from '@/components/ui';

export function SessionsTable({
  caption,
  sessions,
  status,
  error,
  onRetry,
  onRevoke,
  revokingId,
}: {
  caption: string;
  sessions: UserSession[];
  status: 'pending' | 'error' | 'success';
  error?: unknown;
  onRetry?: () => void;
  onRevoke?: (session: UserSession) => void;
  revokingId?: string | null;
}) {
  const { t } = useTranslation('common');
  const columns: Column<UserSession>[] = [
    {
      id: 'device',
      header: t('sessions.device'),
      rowHeader: true,
      cell: (session) => (
        <span className={layout.cellStack}>
          <span title={session.user_agent || undefined}>
            {describeUserAgent(session.user_agent) || t('sessions.unknownDevice')}{' '}
            {session.current ? <Badge tone="brand">{t('sessions.current')}</Badge> : null}
          </span>
          {session.ip ? <span className={layout.muted}>{session.ip}</span> : null}
        </span>
      ),
    },
    {
      id: 'method',
      header: t('sessions.method'),
      hideOnMobile: true,
      cell: (session) => <Badge>{session.auth_method}</Badge>,
    },
    {
      id: 'lastSeen',
      header: t('sessions.lastSeen'),
      cell: (session) => <Time value={session.last_seen_at} />,
    },
    {
      id: 'expires',
      header: t('sessions.expires'),
      hideOnMobile: true,
      cell: (session) => <Time value={session.expires_at} />,
    },
  ];
  if (onRevoke) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('table.actions')}</span>,
      align: 'end',
      cell: (session) =>
        session.current ? null : (
          <IconButton
            size="sm"
            variant="danger"
            icon={<Trash2 />}
            // Names the device, so every row's button is distinguishable for screen readers.
            label={t('sessions.revokeNamed', {
              device: describeUserAgent(session.user_agent) || t('sessions.unknownDevice'),
            })}
            loading={revokingId === session.id}
            onClick={() => onRevoke(session)}
          />
        ),
    });
  }
  return (
    <DataTable
      caption={caption}
      columns={columns}
      rows={sessions}
      getRowId={(session) => session.id}
      status={status}
      error={error}
      onRetry={onRetry}
      skeletonRows={3}
      empty={
        <EmptyState
          compact
          headingLevel={3}
          icon={<MonitorSmartphone />}
          title={t('sessions.empty')}
        />
      }
    />
  );
}
