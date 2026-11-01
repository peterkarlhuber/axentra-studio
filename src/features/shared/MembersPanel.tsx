import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { MemberLike } from '@/api/models';
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
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { RoleSelect } from './RoleSelect';
import { useRoleOptions } from './useRoleOptions';

export interface MembersPanelProps {
  productId: string;
  scope: 'product' | 'tenant';
  queryKey: QueryKey;
  list: () => Promise<MemberLike[]>;
  add: (body: { email: string; role: string }) => Promise<unknown>;
  updateRole: (userId: string, role: string) => Promise<unknown>;
  remove: (userId: string) => Promise<unknown>;
  canManage: boolean;
  caption: string;
}

/** Membership table with add / change role / remove, shared by products and tenants. */
export function MembersPanel({
  productId,
  scope,
  queryKey,
  list,
  add,
  updateRole,
  remove,
  canManage,
  caption,
}: MembersPanelProps) {
  const { t } = useTranslation('common');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const { roles, isError: rolesUnavailable } = useRoleOptions(productId, scope);
  const members = useQuery({ queryKey, queryFn: list });
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [removing, setRemoving] = useState<MemberLike | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: () => add({ email: email.trim(), role }),
    onSuccess: () => {
      toast.success(t('members.added'));
      setAdding(false);
      setEmail('');
      setRole('');
      void invalidate();
    },
    onError: showError,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, next }: { userId: string; next: string }) => updateRole(userId, next),
    onSuccess: () => {
      toast.success(t('members.roleChanged'));
      void invalidate();
    },
    onError: showError,
  });

  const columns: Column<MemberLike>[] = [
    {
      id: 'user',
      header: t('members.user'),
      rowHeader: true,
      cell: (member) => (
        <span className={layout.cellStack}>
          <span>{member.name || member.email}</span>
          <span className={layout.muted}>{member.email}</span>
        </span>
      ),
    },
    {
      id: 'role',
      header: t('members.role'),
      cell: (member) =>
        canManage ? (
          <RoleSelect
            roles={roles}
            unavailable={rolesUnavailable}
            value={member.role}
            aria-label={t('members.roleFor', { name: member.name || member.email })}
            disabled={roleMutation.isPending}
            onChange={(next) =>
              next && next !== member.role
                ? roleMutation.mutate({ userId: member.user_id, next })
                : undefined
            }
          />
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
      cell: (member) => (
        <IconButton
          variant="danger"
          size="sm"
          label={t('members.removeNamed', { name: member.name || member.email })}
          icon={<Trash2 />}
          onClick={() => setRemoving(member)}
        />
      ),
    });
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
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
        onOpenChange={setAdding}
        title={t('members.add')}
        description={t('members.addDescription')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="add-member-form"
              loading={addMutation.isPending}
              disabled={!email.trim() || !role}
            >
              {t('members.add')}
            </Button>
          </>
        }
      >
        <form id="add-member-form" className={layout.form} onSubmit={submit}>
          <FormField label={t('members.email')} required>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FormField>
          <FormField label={t('members.role')} required>
            <RoleSelect
              roles={roles}
              unavailable={rolesUnavailable}
              value={role}
              onChange={setRole}
            />
          </FormField>
        </form>
      </Dialog>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => (open ? undefined : setRemoving(null))}
        title={t('members.removeTitle')}
        description={t('members.removeBody', {
          name: removing?.name || removing?.email,
        })}
        confirmLabel={t('members.remove')}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await remove(removing.user_id);
            toast.success(t('members.removed'));
            void invalidate();
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </div>
  );
}
