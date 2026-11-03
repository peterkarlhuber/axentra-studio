import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tenantsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import type { ReactNode } from 'react';
import { FormField, Select } from '@/components/ui';
import type { HelpTopic } from '@/help/manifest';

const PICKER_LIMIT = 200;

/**
 * Select a tenant of the product: the first 200 the server lists (oldest first; the list endpoint
 * has no sort parameter), sorted by name in the interface language.
 */
export function TenantPicker({
  productId,
  value,
  onChange,
  label,
  allowNone,
  noneLabel,
  help,
  info,
  infoTopic,
}: {
  productId: string;
  value: string;
  onChange: (tenantId: string) => void;
  label?: string;
  allowNone?: boolean;
  noneLabel?: string;
  help?: string;
  /** Background info in a toggletip next to the label (see `FormField`). */
  info?: ReactNode;
  infoTopic?: HelpTopic;
}) {
  const { t, i18n } = useTranslation('common');
  const params = { limit: PICKER_LIMIT };
  const query = useQuery({
    queryKey: queryKeys.tenants(productId, params),
    queryFn: () => tenantsApi.list(productId, params),
  });
  const tenants = [...(query.data?.items ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, i18n.language),
  );
  const truncated = Boolean(query.data?.next_cursor);
  const helpText = [help, truncated ? t('tenantPicker.truncated', { count: PICKER_LIMIT }) : null]
    .filter(Boolean)
    .join(' ');
  return (
    <FormField
      label={label ?? t('tenantPicker.label')}
      help={helpText || undefined}
      info={info}
      infoTopic={infoTopic}
      error={query.isError ? t('tenantPicker.error') : undefined}
    >
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={query.isPending}
      >
        {allowNone ? <option value="">{noneLabel ?? t('tenantPicker.none')}</option> : null}
        {!allowNone ? (
          <option value="" disabled>
            {query.isPending ? t('states.loading') : t('tenantPicker.choose')}
          </option>
        ) : null}
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </Select>
    </FormField>
  );
}
