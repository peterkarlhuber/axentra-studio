import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { useCan } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import { Card, EmptyState, PageHeader, layout } from '@/components/ui';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { SuspendedTenantGate } from './SuspendedTenantGate';
import { InvitationsPanel } from './InvitationsPanel';

/** Invitations are tenant-scoped in the API; pick a tenant first. */
export function InvitationsPage() {
  const { t } = useTranslation('tenants');
  const { productId } = useProductScope();
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const tenantId = params.get('tenant') ?? '';

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('invitations.title')}
        description={t('invitations.description')}
        help="members-invitations#invite"
      />
      <Card>
        <div className={layout.form}>
          <div className={layout.row}>
            <TenantPicker
              productId={productId}
              value={tenantId}
              onChange={(id) => setParams(id ? { tenant: id } : {}, { replace: true })}
            />
          </div>
          {tenantId ? (
            <SuspendedTenantGate
              productId={productId}
              tenantId={tenantId}
              permission="members:read"
              bare
            >
              <InvitationsPanel
                productId={productId}
                tenantId={tenantId}
                canManage={can('members:manage', { tenantId })}
              />
            </SuspendedTenantGate>
          ) : (
            <EmptyState
              compact
              headingLevel={2}
              icon={<Building2 />}
              title={t('invitations.pickTenant')}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
