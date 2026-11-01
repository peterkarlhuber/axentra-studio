import { useTranslation } from 'react-i18next';
import type { ComponentProps } from 'react';
import { Input, Select } from '@/components/ui';
import type { Role } from '@/api/models';

/**
 * Role picker. Falls back to a free-text input when the role catalog cannot be read
 * (e.g. the caller lacks `roles:manage`), so assigning a known role name still works.
 */
export function RoleSelect({
  roles,
  unavailable,
  value,
  onChange,
  ...rest
}: {
  roles: Role[];
  unavailable: boolean;
  value: string;
  onChange: (value: string) => void;
} & Omit<ComponentProps<'select'>, 'value' | 'onChange'>) {
  const { t } = useTranslation();
  if (unavailable || roles.length === 0) {
    return (
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('roles.placeholder')}
        aria-label={rest['aria-label']}
      />
    );
  }
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} {...rest}>
      <option value="" disabled>
        {t('roles.choose')}
      </option>
      {roles.map((role) => (
        <option key={role.key} value={role.key}>
          {role.name}
          {role.builtin ? '' : ` (${role.key})`}
        </option>
      ))}
    </Select>
  );
}
