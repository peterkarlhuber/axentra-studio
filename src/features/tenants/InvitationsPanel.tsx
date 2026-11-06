import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailPlus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { productsApi, tenantsApi } from '@/api/endpoints';
import type { InvitationRow, NewInvitationLike } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import {
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  FormField,
  IconButton,
  Input,
  StatusPill,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { HelpLink } from '@/help/HelpLink';
import { InfoTip } from '@/help/InfoTip';
import { InvitationSecret } from '@/features/shared/InvitationSecret';
import { ProblemAlert } from '@/features/shared/ProblemAlert';
import { RoleSelect } from '@/features/shared/RoleSelect';
import { someRoleBlocked, useRoleCeiling } from '@/features/shared/useRoleOptions';

/**
 * Invitations of one tenant (with `tenantId`) or of the product team (without it): list,
 * invite (one-time link if returned), revoke.
 */
export function InvitationsPanel({
  productId,
  tenantId,
  canManage,
}: {
  productId: string;
  tenantId?: string;
  canManage: boolean;
}) {
  const { t } = useTranslation('tenants');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const scope = tenantId === undefined ? 'product' : 'tenant';
  const key =
    tenantId === undefined
      ? queryKeys.productInvitations(productId)
      : queryKeys.invitations(productId, tenantId);
  const invitations = useQuery<InvitationRow[]>({
    queryKey: key,
    queryFn: () =>
      tenantId === undefined
        ? productsApi.invitations(productId)
        : tenantsApi.invitations(productId, tenantId),
  });
  const { roles, rolesUnavailable, blockFor } = useRoleCeiling(productId, scope, tenantId);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  // '' = the default ("member" / "product_viewer"), or the first role the caller may grant
  // (role ceiling).
  const [chosenRole, setRole] = useState('');
  const baseRole = scope === 'product' ? 'product_viewer' : 'member';
  const defaultRole =
    blockFor(baseRole) === null
      ? baseRole
      : (roles.find((candidate) => blockFor(candidate.key) === null)?.key ?? baseRole);
  const role = chosenRole || defaultRole;
  const ceilingApplies = !rolesUnavailable && someRoleBlocked(roles, blockFor);
  const [created, setCreated] = useState<NewInvitationLike | null>(null);
  const [revoking, setRevoking] = useState<InvitationRow | null>(null);

  const invite = useMutation({
    mutationFn: (): Promise<NewInvitationLike> => {
      const body = { email: email.trim(), role };
      return tenantId === undefined
        ? productsApi.invite(productId, body)
        : tenantsApi.invite(productId, tenantId, body);
    },
    onSuccess: (result) => {
      toast.success(t('invitations.sent', { email: result.invitation.email }));
      void queryClient.invalidateQueries({ queryKey: key });
      setEmail('');
      setRole('');
      // The token (and accept URL, if the server knows its public URL) is returned once.
      setCreated(result);
    },
  });

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setEmail('');
      setRole('');
      setCreated(null);
      invite.reset();
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    invite.mutate();
  };

  const columns: Column<InvitationRow>[] = [
    { id: 'email', header: t('invitations.email'), rowHeader: true, cell: (inv) => inv.email },
    { id: 'role', header: t('invitations.role'), cell: (inv) => inv.role },
    {
      id: 'status',
      header: t('invitations.status'),
      cell: (inv) => <StatusPill status={inv.status} />,
    },
    {
      id: 'expires',
      header: (
        <>
          {t('invitations.expires')}{' '}
          <InfoTip label={t('invitations.expiresAbout')} topic="members-invitations#expiry">
            {t('invitations.expiresInfo')}
          </InfoTip>
        </>
      ),
      hideOnMobile: true,
      cell: (inv) => <Time value={inv.expires_at} />,
    },
  ];
  if (canManage) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (inv) =>
        inv.status !== 'pending' ? null : (
          <IconButton
            variant="danger"
            size="sm"
            icon={<Trash2 />}
            label={t('invitations.revokeFor', { email: inv.email })}
            onClick={() => setRevoking(inv)}
          />
        ),
    });
  }

  const fields = invite.error ? fieldErrors(invite.error) : {};
  const roleHelp =
    scope === 'product' ? t('invitations.roleHelpProduct') : t('invitations.roleHelp');

  return (
    <div className={layout.form}>
      {canManage ? (
        <div className={layout.actions}>
          <Button icon={<MailPlus />} onClick={() => setOpen(true)}>
            {t('invitations.invite')}
          </Button>
        </div>
      ) : null}
      <DataTable
        caption={t('invitations.title')}
        columns={columns}
        getRowId={(inv) => inv.id}
        empty={
          <EmptyState compact headingLevel={2} icon={<MailPlus />} title={t('invitations.empty')} />
        }
        rows={invitations.data}
        status={invitations.status}
        error={invitations.error}
        onRetry={() => void invitations.refetch()}
      />
      <Dialog
        open={open}
        onOpenChange={close}
        dirty={!created && Boolean(email.trim())}
        title={created ? t('invitations.createdTitle') : t('invitations.invite')}
        description={
          created ? undefined : (
            <>
              {t('invitations.inviteDescription')}{' '}
              <HelpLink topic="members-invitations#delivery">{t('common:help.learnMore')}</HelpLink>
            </>
          )
        }
        footer={
          created ? (
            <Button variant="primary" onClick={() => close(false)}>
              {t('common:actions.done')}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => close(false)}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="submit"
                form="invite-form"
                variant="primary"
                loading={invite.isPending}
                disabled={!email.trim()}
              >
                {t('invitations.send')}
              </Button>
            </>
          )
        }
      >
        {created ? (
          <InvitationSecret invitation={created} />
        ) : (
          <form id="invite-form" className={layout.form} onSubmit={submit}>
            <FormField
              label={t('invitations.email')}
              info={t('invitations.emailInfo')}
              infoTopic="members-invitations#accept"
              error={fields.email}
              required
            >
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
            <FormField
              label={t('invitations.role')}
              help={ceilingApplies ? `${roleHelp} ${t('common:members.ceilingHelp')}` : roleHelp}
              error={fields.role}
            >
              <RoleSelect
                roles={roles}
                unavailable={rolesUnavailable}
                blockFor={blockFor}
                value={role}
                onChange={setRole}
              />
            </FormField>
            {invite.error && Object.keys(fields).length === 0 ? (
              <ProblemAlert error={invite.error} />
            ) : null}
          </form>
        )}
      </Dialog>
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(next) => (next ? undefined : setRevoking(null))}
        title={t('invitations.revokeTitle')}
        description={t('invitations.revokeBody', { email: revoking?.email })}
        confirmLabel={t('invitations.revoke')}
        onConfirm={async () => {
          if (!revoking) return;
          try {
            await (tenantId === undefined
              ? productsApi.revokeInvitation(productId, revoking.id)
              : tenantsApi.revokeInvitation(productId, tenantId, revoking.id));
            toast.success(t('invitations.revoked'));
            void queryClient.invalidateQueries({ queryKey: key });
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </div>
  );
}
