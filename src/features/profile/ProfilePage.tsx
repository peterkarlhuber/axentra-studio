import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { asItems, authApi, meApi } from '@/api/endpoints';
import type { UserSession } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast, useMe } from '@/app/auth';
import {
  Badge,
  Button,
  Card,
  DetailList,
  ErrorState,
  FormField,
  Input,
  PageHeader,
  Skeleton,
  layout,
  useToast,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { ApiError } from '@/api/errors';
import { SessionsTable } from '@/features/shared/SessionsTable';

export function ProfilePage() {
  const { t } = useTranslation('profile');
  const me = useMe();

  if (me.isPending) {
    return (
      <div className={layout.stack} aria-busy="true">
        <Skeleton width={240} height={36} />
        <Skeleton height={180} radius={12} />
      </div>
    );
  }
  if (me.isError) return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;
  const { user, platform_role, products } = me.data;
  if (!user) return <ErrorState error={new ApiError({ status: 403, code: 'forbidden' })} />;

  return (
    <div className={layout.stack}>
      <PageHeader title={t('title')} description={t('description')} />
      <div className={layout.grid2}>
        <Card title={t('account.title')}>
          <DetailList
            items={[
              { label: t('account.email'), value: user.email },
              { label: t('account.id'), value: user.id, mono: true },
              {
                label: t('account.platformRole'),
                value: platform_role ? (
                  <Badge tone="brand">{platform_role}</Badge>
                ) : (
                  t('account.noPlatformRole')
                ),
              },
              {
                label: t('account.products'),
                value: products.length ? (
                  <span className={layout.tags}>
                    {products.map((entry) => (
                      <Badge key={entry.product.id}>
                        {entry.product.name}
                        {entry.role ? ` · ${entry.role}` : ''}
                      </Badge>
                    ))}
                  </span>
                ) : (
                  t('account.noProducts')
                ),
              },
            ]}
          />
        </Card>
        <NameForm key={user.name} name={user.name} />
      </div>
      <div className={layout.grid2}>
        <PasswordForm hasPassword={user.has_password !== false} />
        <OwnSessions />
      </div>
    </div>
  );
}

function NameForm({ name: initial }: { name: string }) {
  const { t } = useTranslation('profile');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(initial);
  const save = useMutation({
    mutationFn: () => meApi.update({ name: name.trim() }),
    onSuccess: () => {
      toast.success(t('name.saved'));
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
    onError: showError,
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  return (
    <Card title={t('name.title')}>
      <form className={layout.form} onSubmit={submit}>
        <FormField label={t('name.label')} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </FormField>
        <div className={layout.actions}>
          <Button
            type="submit"
            variant="primary"
            icon={<Save />}
            loading={save.isPending}
            disabled={!name.trim() || name.trim() === initial}
          >
            {t('common:actions.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const { t } = useTranslation('profile');
  const toast = useToast();
  const showError = useErrorToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const change = useMutation({
    mutationFn: () =>
      meApi.changePassword({ current_password: hasPassword ? current : '', new_password: next }),
    onSuccess: () => {
      toast.success(t('password.changed'));
      setCurrent('');
      setNext('');
      setConfirm('');
    },
    onError: showError,
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (next !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    change.mutate();
  };
  const fields = change.error ? fieldErrors(change.error) : {};
  return (
    <Card
      title={hasPassword ? t('password.title') : t('password.setTitle')}
      description={hasPassword ? t('password.description') : t('password.setDescription')}
    >
      <form className={layout.form} onSubmit={submit}>
        {hasPassword ? (
          <FormField label={t('password.current')} error={fields.current_password} required>
            <Input
              type="password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              autoComplete="current-password"
            />
          </FormField>
        ) : null}
        <FormField label={t('password.new')} error={fields.new_password} required>
          <Input
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            autoComplete="new-password"
          />
        </FormField>
        <FormField
          label={t('password.confirm')}
          error={mismatch ? t('password.mismatch') : undefined}
          required
        >
          <Input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </FormField>
        <div className={layout.actions}>
          <Button
            type="submit"
            variant="primary"
            icon={<KeyRound />}
            loading={change.isPending}
            disabled={(hasPassword && !current) || !next || !confirm}
          >
            {t('password.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function OwnSessions() {
  const { t } = useTranslation('profile');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: queryKeys.ownSessions, queryFn: authApi.sessions });
  const revoke = useMutation({
    mutationFn: (session: UserSession) => authApi.revokeSession(session.id),
    onSuccess: () => {
      toast.success(t('sessions.revoked'));
      void queryClient.invalidateQueries({ queryKey: queryKeys.ownSessions });
    },
    onError: showError,
  });
  return (
    <Card title={t('sessions.title')} description={t('sessions.description')} flush>
      <SessionsTable
        caption={t('sessions.title')}
        sessions={asItems(sessions.data)}
        status={sessions.status}
        error={sessions.error}
        onRetry={() => void sessions.refetch()}
        onRevoke={(session) => revoke.mutate(session)}
        revokingId={revoke.isPending ? (revoke.variables?.id ?? null) : null}
      />
    </Card>
  );
}
