import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { MailPlus, Trash2, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/api/errors';
import type { MemberLike, NewInvitationLike } from '@/api/models';
import { useErrorToast } from '@/app/auth';
import {
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  FormField,
  IconButton,
  Input,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { InvitationSecret } from './InvitationSecret';
import { ProblemAlert } from './ProblemAlert';
import { RoleSelect } from './RoleSelect';
import { someRoleBlocked, useRoleCeiling } from './useRoleOptions';

export interface MembersPanelProps {
  productId: string;
  scope: 'product' | 'tenant';
  /** The tenant (scope "tenant"), for the role ceiling of tenant roles. */
  tenantId?: string;
  queryKey: QueryKey;
  list: () => Promise<MemberLike[]>;
  add: (body: { email: string; role: string }) => Promise<unknown>;
  updateRole: (userId: string, role: string) => Promise<unknown>;
  remove: (userId: string) => Promise<unknown>;
  /**
   * Invite by email when adding fails with `404` (the server resolves only users the caller
   * can already see). Tenants invite tenant members, products invite product operators.
   */
  invite?: (body: { email: string; role: string }) => Promise<NewInvitationLike>;
  canManage: boolean;
  caption: string;
}

/**
 * Membership table with add / change role / remove, shared by products and tenants.
 * Roles above the caller's own level (role ceiling) are not offered, members holding such a
 * role cannot be changed here, and an address the server does not resolve can be invited.
 */
export function MembersPanel({
  productId,
  scope,
  tenantId,
  queryKey,
  list,
  add,
  updateRole,
  remove,
  invite,
  canManage,
  caption,
}: MembersPanelProps) {
  const { t } = useTranslation('common');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const { roles, rolesUnavailable, blockFor } = useRoleCeiling(productId, scope, tenantId);
  const members = useQuery({ queryKey, queryFn: list });
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [removing, setRemoving] = useState<MemberLike | null>(null);
  const [invitation, setInvitation] = useState<NewInvitationLike | null>(null);
  const ceilingApplies = !rolesUnavailable && someRoleBlocked(roles, blockFor);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  // A member removed in the meantime answers 404: refresh the list along with the message.
  const onRowError = (error: unknown) => {
    showError(error);
    if (isApiError(error) && error.isNotFound) void invalidate();
  };

  const addMutation = useMutation({
    mutationFn: () => add({ email: email.trim(), role }),
    onSuccess: () => {
      toast.success(t('members.added'));
      closeAdd(false);
      void invalidate();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => {
      if (!invite) throw new Error('invite is not available');
      return invite({ email: email.trim(), role });
    },
    onSuccess: (result) => {
      toast.success(t('members.invited', { email: result.invitation.email }));
      setInvitation(result);
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, next }: { userId: string; next: string }) => updateRole(userId, next),
    onSuccess: () => {
      toast.success(t('members.roleChanged'));
      void invalidate();
    },
    onError: onRowError,
  });

  function closeAdd(open: boolean) {
    setAdding(open);
    if (!open) {
      setEmail('');
      setRole('');
      setInvitation(null);
      addMutation.reset();
      inviteMutation.reset();
    }
  }

  const userNotFound = isApiError(addMutation.error) && addMutation.error.isNotFound;

  const columns: Column<MemberLike>[] = [
    {
      id: 'user',
      header: t('members.user'),
      rowHeader: true,
      cell: (member) => (
        <span className={layout.cellStack}>
          <span>{member.name || member.email || member.user_id}</span>
          <span className={layout.muted}>{member.email ?? member.user_id}</span>
        </span>
      ),
    },
    {
      id: 'role',
      header: t('members.role'),
      cell: (member) =>
        canManage && !blockFor(member.role) ? (
          <RoleSelect
            roles={roles}
            unavailable={rolesUnavailable}
            blockFor={blockFor}
            value={member.role}
            aria-label={t('members.roleFor', {
              name: member.name || member.email || member.user_id,
            })}
            disabled={roleMutation.isPending}
            onChange={(next) =>
              next && next !== member.role
                ? roleMutation.mutate({ userId: member.user_id, next })
                : undefined
            }
          />
        ) : canManage ? (
          <span className={layout.cellStack}>
            <span>{member.role}</span>
            <span className={layout.muted}>{t('members.aboveYourLevel')}</span>
          </span>
        ) : (
          member.role
        ),
    },
    {
      id: 'since',
      header: t('members.since'),
      hideOnMobile: true,
      cell: (member) => <Time value={member.created_at} />,
    },
  ];
  if (canManage) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('table.actions')}</span>,
      align: 'end',
      cell: (member) =>
        blockFor(member.role) ? null : (
          <IconButton
            variant="danger"
            size="sm"
            label={t('members.removeNamed', {
              name: member.name || member.email || member.user_id,
            })}
            icon={<Trash2 />}
            onClick={() => setRemoving(member)}
          />
        ),
    });
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    inviteMutation.reset();
    addMutation.mutate();
  };

  return (
    <div className={layout.form}>
      {canManage ? (
        <div className={layout.actions}>
          <Button icon={<UserPlus />} onClick={() => setAdding(true)}>
            {t('members.add')}
          </Button>
        </div>
      ) : null}
      <DataTable
        caption={caption}
        columns={columns}
        getRowId={(member) => member.user_id}
        empty={
          <EmptyState compact headingLevel={3} title={t('members.empty')} icon={<UserPlus />} />
        }
        rows={members.data}
        status={members.status}
        error={members.error}
        onRetry={() => void members.refetch()}
      />
      <Dialog
        open={adding}
        onOpenChange={closeAdd}
        dirty={!invitation && Boolean(email.trim())}
        title={invitation ? t('members.invitedTitle') : t('members.add')}
        description={invitation ? undefined : t('members.addDescription')}
        footer={
          invitation ? (
            <Button variant="primary" onClick={() => closeAdd(false)}>
              {t('actions.done')}
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => closeAdd(false)}>
                {t('actions.cancel')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="add-member-form"
                loading={addMutation.isPending}
                disabled={!email.trim() || !role || inviteMutation.isPending}
              >
                {t('members.add')}
              </Button>
            </>
          )
        }
      >
        {invitation ? (
          <InvitationSecret invitation={invitation} />
        ) : (
          <form id="add-member-form" className={layout.form} onSubmit={submit}>
            <FormField label={t('members.email')} required>
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (addMutation.isError) addMutation.reset();
                }}
              />
            </FormField>
            <FormField
              label={t('members.role')}
              help={ceilingApplies ? t('members.ceilingHelp') : undefined}
              required
            >
              <RoleSelect
                roles={roles}
                unavailable={rolesUnavailable}
                blockFor={blockFor}
                value={role}
                onChange={setRole}
              />
            </FormField>
            {userNotFound ? (
              <Alert tone="warning" title={t('members.notFoundTitle')}>
                {invite ? (
                  <>
                    <p>{t('members.notFoundInvite')}</p>
                    <div className={layout.actions}>
                      <Button
                        icon={<MailPlus />}
                        loading={inviteMutation.isPending}
                        disabled={!role}
                        onClick={() => inviteMutation.mutate()}
                      >
                        {t('members.inviteInstead')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p>{t('members.notFoundOperator')}</p>
                )}
              </Alert>
            ) : (
              <ProblemAlert error={addMutation.error} />
            )}
            <ProblemAlert error={inviteMutation.error} />
          </form>
        )}
      </Dialog>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => (open ? undefined : setRemoving(null))}
        title={t('members.removeTitle')}
        description={t('members.removeBody', {
          name: removing?.name || removing?.email || removing?.user_id,
        })}
        confirmLabel={t('members.remove')}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await remove(removing.user_id);
            toast.success(t('members.removed'));
            void invalidate();
          } catch (error) {
            onRowError(error);
            throw error;
          }
        }}
      />
    </div>
  );
}
