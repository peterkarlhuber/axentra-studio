import { useTranslation } from 'react-i18next';
import type { ComponentProps } from 'react';
import { Input, Select } from '@/components/ui';
import type { Role } from '@/api/models';
import type { CeilingBlock } from '@/app/permissions';

/**
 * Role picker. Falls back to a free-text input when the role catalog cannot be read
 * (e.g. the caller lacks `roles:read`), so assigning a known role name still works.
 * With `blockFor`, roles above the caller's own level (role ceiling) are listed but disabled.
 */
export function RoleSelect({
  roles,
  unavailable,
  value,
  onChange,
  blockFor,
  ...rest
}: {
  roles: Role[];
  unavailable: boolean;
  value: string;
  onChange: (value: string) => void;
  blockFor?: (key: string) => CeilingBlock;
} & Omit<ComponentProps<'select'>, 'value' | 'onChange'>) {
  const { t } = useTranslation();
  if (unavailable || roles.length === 0) {
    return (
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('roles.placeholder')}
        id={rest.id}
        aria-label={rest['aria-label']}
        aria-describedby={rest['aria-describedby']}
      />
    );
  }
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} {...rest}>
      <option value="" disabled>
        {t('roles.choose')}
      </option>
      {roles.map((role) => {
        const blocked = blockFor?.(role.key) ?? null;
        const label = `${role.name}${role.builtin ? '' : ` (${role.key})`}`;
        return (
          <option key={role.key} value={role.key} disabled={blocked !== null && role.key !== value}>
            {blocked ? t('roles.notGrantable', { role: label }) : label}
          </option>
        );
      })}
    </Select>
  );
}
