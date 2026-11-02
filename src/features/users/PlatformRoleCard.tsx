import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/api/endpoints';
import type { User } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import { Button, Card, ConfirmDialog, FormField, Select, layout, useToast } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';

type PlatformRole = 'platform_admin' | 'platform_viewer' | 'none';
const ROLES: PlatformRole[] = ['none', 'platform_viewer', 'platform_admin'];

/** Grant or remove installation-wide roles (`PATCH /v1/users/{id}` `platform_role`). */
export function PlatformRoleCard({ user, isSelf }: { user: User; isSelf: boolean }) {
  const { t } = useTranslation('users');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const current = (user.platform_role ?? 'none') as PlatformRole;
  const [role, setRole] = useState<PlatformRole>(current);
  const [confirming, setConfirming] = useState(false);

  const save = useMutation({
    mutationFn: () => usersApi.update(user.id, { platform_role: role }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.user(user.id), updated);
      if (isSelf) void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      toast.success(t('platformRole.saved'));
    },
    onError: showError,
  });

  return (
    <Card title={t('platformRole.title')} description={t('platformRole.description')}>
      <div className={layout.form}>
        <FormField label={t('fields.platformRole')} help={t(`platformRoles.help.${role}`)}>
          <Select value={role} onChange={(event) => setRole(event.target.value as PlatformRole)}>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {t(`platformRoles.${value}`)}
              </option>
            ))}
          </Select>
        </FormField>
        <div className={layout.actions}>
          <Button
            variant="primary"
            icon={<Save />}
            disabled={role === current}
            loading={save.isPending}
            onClick={() => setConfirming(true)}
          >
            {t('platformRole.apply')}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        tone={role === 'platform_admin' || isSelf ? 'danger' : 'primary'}
        title={t('platformRole.confirmTitle')}
        description={t('platformRole.confirmBody', {
          name: user.name || user.email || user.id,
          role: t(`platformRoles.${role}`),
        })}
        confirmLabel={t('platformRole.apply')}
        confirmText={role === 'platform_admin' ? (user.email ?? user.id) : undefined}
        onConfirm={() => save.mutateAsync()}
      >
        <HelpLink topic="users#platform-role">{t('common:help.learnMore')}</HelpLink>
      </ConfirmDialog>
    </Card>
  );
}
