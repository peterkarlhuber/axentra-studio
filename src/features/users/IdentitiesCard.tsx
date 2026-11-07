import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link2, Unlink } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/api/endpoints';
import type { ExternalIdentity, User } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  IconButton,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { ProblemAlert } from '@/features/shared/ProblemAlert';
import { HelpLink } from '@/help/HelpLink';
import { fieldErrors } from '@/lib/errors';
import { IdentityFields } from './IdentityFields';
import { issuerName, useOidcIssuers } from './oidc-providers';

const identityId = (identity: Pick<ExternalIdentity, 'provider' | 'subject'>) =>
  `${identity.provider}\n${identity.subject}`;

/**
 * The user's external (single sign-on) identities (`GET /v1/users/{id}/identities`, needs
 * `users:manage`). Platform administrators link and unlink identities, for example to fix an
 * account after a migration; unlinking ends all of the user's sessions.
 */
export function IdentitiesCard({ user, canEdit }: { user: User; canEdit: boolean }) {
  const { t } = useTranslation('users');
  const toast = useToast();
  const queryClient = useQueryClient();
  const issuers = useOidcIssuers(canEdit);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState<ExternalIdentity | null>(null);
  const [unlinkError, setUnlinkError] = useState<unknown>(null);
  const query = useQuery({
    queryKey: queryKeys.userIdentities(user.id),
    queryFn: () => usersApi.identities(user.id),
  });
  const userName = user.name || user.email || user.id;

  const columns: Column<ExternalIdentity>[] = [
    {
      id: 'provider',
      header: t('identities.provider'),
      rowHeader: true,
      cell: (row) => {
        const name = issuerName(issuers, row.provider);
        return (
          <span className={layout.cellStack}>
            {name ? <span>{name}</span> : null}
            <span className={name ? `${layout.muted} ${layout.mono}` : layout.mono}>
              {row.provider}
            </span>
          </span>
        );
      },
    },
    {
      id: 'subject',
      header: t('identities.subject'),
      cell: (row) => <span className={layout.mono}>{row.subject}</span>,
    },
    {
      id: 'email',
      header: t('identities.email'),
      hideOnMobile: true,
      cell: (row) => row.email || <span className={layout.muted}>{t('identities.noEmail')}</span>,
    },
    {
      id: 'created',
      header: t('identities.linked'),
      hideOnMobile: true,
      cell: (row) => <Time value={row.created_at} />,
    },
  ];
  if (canEdit) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (row) => (
        <IconButton
          size="sm"
          icon={<Unlink />}
          label={t('identities.unlinkNamed', {
            provider: issuerName(issuers, row.provider) ?? row.provider,
          })}
          onClick={() => {
            setUnlinkError(null);
            setUnlinking(row);
          }}
        />
      ),
    });
  }

  return (
    <Card
      title={t('identities.title')}
      description={
        <>
          {t('identities.description')}{' '}
          <HelpLink topic="users#identities">{t('common:help.learnMore')}</HelpLink>
        </>
      }
      actions={
        canEdit ? (
          <Button size="sm" icon={<Link2 />} onClick={() => setLinking(true)}>
            {t('identities.link')}
          </Button>
        ) : null
      }
      flush
    >
      <DataTable
        caption={t('identities.title')}
        columns={columns}
        getRowId={identityId}
        rows={query.data}
        status={query.status}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Link2 />}
            title={t('identities.empty')}
            description={user.has_password ? t('identities.emptyPassword') : undefined}
          />
        }
      />
      {canEdit ? (
        <LinkIdentityDialog
          userId={user.id}
          open={linking}
          onOpenChange={setLinking}
          issuers={issuers}
        />
      ) : null}
      <ConfirmDialog
        open={unlinking !== null}
        onOpenChange={(open) => (open ? undefined : setUnlinking(null))}
        title={t('identities.unlinkTitle')}
        description={t('identities.unlinkBody', {
          name: userName,
          provider: unlinking
            ? (issuerName(issuers, unlinking.provider) ?? unlinking.provider)
            : '',
        })}
        confirmLabel={t('identities.unlink')}
        onConfirm={async () => {
          if (!unlinking) return;
          setUnlinkError(null);
          try {
            const result = await usersApi.unlinkIdentity(user.id, unlinking);
            toast.success(t('identities.unlinked', { count: result.revoked }));
            void queryClient.invalidateQueries({ queryKey: queryKeys.userIdentities(user.id) });
            void queryClient.invalidateQueries({ queryKey: queryKeys.userSessions(user.id) });
          } catch (error) {
            setUnlinkError(error);
            throw error;
          }
        }}
      >
        <ProblemAlert error={unlinkError} />
        <HelpLink topic="users#unlink-identity">{t('common:help.learnMore')}</HelpLink>
      </ConfirmDialog>
    </Card>
  );
}

function LinkIdentityDialog({
  userId,
  open,
  onOpenChange,
  issuers,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issuers: ReturnType<typeof useOidcIssuers>;
}) {
  const { t } = useTranslation('users');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState('');
  const [subject, setSubject] = useState('');
  const link = useMutation({
    mutationFn: () =>
      usersApi.linkIdentity(userId, { provider: provider.trim(), subject: subject.trim() }),
    onSuccess: () => {
      toast.success(t('identities.linkedToast'));
      void queryClient.invalidateQueries({ queryKey: queryKeys.userIdentities(userId) });
      onOpenChange(false);
    },
  });
  // Closed (Cancel, discard, linked): the next opening starts empty.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setProvider('');
      setSubject('');
      link.reset();
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    link.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dirty={Boolean(provider.trim() || subject.trim())}
      title={t('identities.linkTitle')}
      description={t('identities.linkDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="link-identity-form"
            variant="primary"
            loading={link.isPending}
            disabled={!provider.trim() || !subject.trim()}
          >
            {t('identities.link')}
          </Button>
        </>
      }
    >
      <form id="link-identity-form" className={layout.form} onSubmit={submit}>
        <IdentityFields
          provider={provider}
          subject={subject}
          onProviderChange={setProvider}
          onSubjectChange={setSubject}
          issuers={issuers}
          errors={link.error ? fieldErrors(link.error) : {}}
        />
        <ProblemAlert error={link.error} />
      </form>
    </Dialog>
  );
}
