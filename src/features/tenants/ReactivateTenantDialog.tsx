import { useTranslation } from 'react-i18next';
import type { Tenant } from '@/api/models';
import { ConfirmDialog } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';

/** Confirmation before reactivating a suspended tenant. */
export function ReactivateTenantDialog({
  tenant,
  open,
  onOpenChange,
  onConfirm,
}: {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<unknown>;
}) {
  const { t } = useTranslation('tenants');
  return (
    <ConfirmDialog
      open={open && tenant !== null}
      onOpenChange={onOpenChange}
      tone="primary"
      title={t('reactivate.title')}
      description={t('reactivate.body', { name: tenant?.name ?? '' })}
      confirmLabel={t('detail.activate')}
      onConfirm={onConfirm}
    >
      <HelpLink topic="tenants#reactivate">{t('common:help.learnMore')}</HelpLink>
    </ConfirmDialog>
  );
}
