import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { asItems, usersApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast, useIsPlatformAdmin, useSession } from '@/app/auth';
import { PlatformRoleCard } from './PlatformRoleCard';
import { useCrumbLabel } from '@/app/crumbs';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  DetailList,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusPill,
  Time,
  layout,
  useToast,
} from '@/components/ui';
import { SessionsTable } from '@/features/shared/SessionsTable';

export function UserDetailPage() {
  const { t } = useTranslation('users');
  const { userId = '' } = useParams();
  const can = useCan();
  const { data: session } = useSession();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<'disable' | 'revoke' | null>(null);
  const canManage = can('users:manage');
  const isAdmin = useIsPlatformAdmin();
  const user = useQuery({ queryKey: queryKeys.user(userId), queryFn: () => usersApi.get(userId) });
  const sessions = useQuery({
    queryKey: queryKeys.userSessions(userId),
    queryFn: () => usersApi.sessions(userId),
    enabled: canManage,
  });
  useCrumbLabel(user.data?.name || user.data?.email);

  const setStatus = useMutation({
    mutationFn: (status: 'active' | 'disabled') => usersApi.update(userId, { status }),
    onSuccess: (updated, status) => {
      queryClient.setQueryData(queryKeys.user(userId), updated);
      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
      toast.success(status === 'disabled' ? t('detail.disabled') : t('detail.enabled'));
    },
    onError: showError,
  });

  if (user.isPending) {
    return (
      <div className={layout.stack} aria-busy="true">
        <Skeleton width={260} height={36} />
        <Skeleton height={200} radius={12} />
      </div>
    );
  }
  if (user.isError) return <ErrorState error={user.error} onRetry={() => void user.refetch()} />;

  const data = user.data;
  const isSelf = session?.user.id === data.id;
  const disabled = data.status === 'disabled';

  return (
    <div className={layout.stack}>
      <PageHeader
        title={data.name || data.email}
        meta={
          <>
            <StatusPill status={data.status} />
            <code className={layout.mono}>{data.id}</code>
          </>
        }
        actions={
          canManage ? (
            <>
              <Button icon={<LogOut />} onClick={() => setConfirm('revoke')}>
                {t('detail.revokeSessions')}
              </Button>
              {disabled ? (
                <Button
                  variant="primary"
                  icon={<UserCheck />}
                  loading={setStatus.isPending}
                  onClick={() => setStatus.mutate('active')}
                >
                  {t('detail.enable')}
                </Button>
              ) : !isSelf ? (
                <Button variant="danger" icon={<UserX />} onClick={() => setConfirm('disable')}>
                  {t('detail.disable')}
                </Button>
              ) : null}
            </>
          ) : null
        }
      />
      {disabled ? <Alert tone="warning">{t('detail.disabledNotice')}</Alert> : null}
      <div className={layout.grid2}>
        <Card title={t('detail.profile')}>
          <DetailList
            items={[
              { label: t('fields.name'), value: data.name },
              { label: t('fields.email'), value: data.email },
              { label: t('fields.status'), value: <StatusPill status={data.status} /> },
              { label: t('fields.locale'), value: data.locale },
              {
                label: t('fields.platformRole'),
                value: data.platform_role
                  ? t(`platformRoles.${data.platform_role}`, { defaultValue: data.platform_role })
                  : t('platformRoles.none'),
              },
              {
                label: t('fields.password'),
                value: data.has_password ? t('detail.hasPassword') : t('detail.noPassword'),
              },
              {
                label: t('fields.lastLogin'),
                value: <Time value={data.last_login_at} mode="absolute" />,
              },
              {
                label: t('fields.created'),
                value: <Time value={data.created_at} mode="absolute" />,
              },
            ]}
          />
        </Card>
        {canManage && isAdmin ? <PlatformRoleCard user={data} isSelf={isSelf} /> : null}
        {canManage ? (
          <Card title={t('detail.sessions')} flush>
            <SessionsTable
              caption={t('detail.sessions')}
              sessions={asItems(sessions.data)}
              status={sessions.status}
              error={sessions.error}
              onRetry={() => void sessions.refetch()}
            />
          </Card>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => (open ? undefined : setConfirm(null))}
        title={confirm === 'disable' ? t('detail.disableTitle') : t('detail.revokeTitle')}
        description={
          confirm === 'disable'
            ? t('detail.disableBody', { name: data.name || data.email })
            : t('detail.revokeBody', { name: data.name || data.email })
        }
        confirmLabel={confirm === 'disable' ? t('detail.disable') : t('detail.revokeSessions')}
        confirmText={confirm === 'disable' ? data.email : undefined}
        onConfirm={async () => {
          try {
            if (confirm === 'disable') {
              await setStatus.mutateAsync('disabled');
            } else {
              const result = await usersApi.revokeSessions(userId);
              toast.success(t('detail.sessionsRevoked', { count: result.revoked }));
              void queryClient.invalidateQueries({ queryKey: queryKeys.userSessions(userId) });
            }
          } catch (error) {
            if (confirm !== 'disable') showError(error);
            throw error;
          }
        }}
      />
    </div>
  );
}
