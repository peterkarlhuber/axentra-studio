import { useId, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Permission } from '@/api/models';
import { Badge, Checkbox, FormField, Input } from '@/components/ui';
import { InfoTip } from '@/help/InfoTip';
import type { HelpTopic } from '@/help/manifest';
import { groupPermissions } from './permission-groups';
import styles from './access.module.css';

export function PermissionChecklist({
  permissions,
  value,
  onChange,
  disabled,
  legend,
  info,
  infoLabel,
  infoTopic,
}: {
  permissions: Permission[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  legend: string;
  /** Background info shown in a toggletip next to the legend. */
  info?: ReactNode;
  infoLabel?: string;
  infoTopic?: HelpTopic;
}) {
  const { t } = useTranslation('access');
  const [filter, setFilter] = useState('');
  const legendId = useId();
  const selected = useMemo(() => new Set(value), [value]);
  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? permissions.filter(
        (permission) =>
          permission.name.toLowerCase().includes(needle) ||
          permission.description?.toLowerCase().includes(needle),
      )
    : permissions;
  const groups = groupPermissions(visible);

  const toggle = (names: string[], on: boolean) => {
    const next = new Set(selected);
    names.forEach((name) => (on ? next.add(name) : next.delete(name)));
    onChange([...next].sort());
  };

  return (
    <fieldset className={styles.checklist} aria-labelledby={legendId} disabled={disabled}>
      <div className={styles.checklistHead}>
        <span className={styles.legend}>
          <span id={legendId}>{legend}</span>
          {info && infoTopic ? (
            <>
              {' '}
              <InfoTip label={infoLabel ?? legend} topic={infoTopic}>
                {info}
              </InfoTip>
            </>
          ) : null}
        </span>
        <span className={styles.count} aria-live="polite">
          {t('permissions.selected', { count: value.length })}
        </span>
      </div>
      <FormField label={t('permissions.filter')} hideLabel>
        <Input
          type="search"
          placeholder={t('permissions.filterPlaceholder')}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </FormField>
      {groups.length === 0 ? <p className={styles.count}>{t('permissions.noMatch')}</p> : null}
      <div className={styles.groups}>
        {groups.map((group) => {
          const names = group.items.map((item) => item.name);
          const count = names.filter((name) => selected.has(name)).length;
          const state = count === 0 ? false : count === names.length ? true : 'indeterminate';
          return (
            <div key={`${group.source}:${group.resource}`} className={styles.group}>
              <Checkbox
                checked={state}
                onCheckedChange={(on) => toggle(names, on)}
                disabled={disabled}
                label={
                  <span className={styles.groupLabel}>
                    <span className={styles.groupName}>{group.resource}</span>
                    {group.source === 'product' ? (
                      <Badge tone="brand">{t('permissions.productDefined')}</Badge>
                    ) : null}
                  </span>
                }
                description={t('permissions.groupCount', { selected: count, total: names.length })}
              />
              <div className={styles.items}>
                {group.items.map((permission) => (
                  <Checkbox
                    key={permission.name}
                    checked={selected.has(permission.name)}
                    onCheckedChange={(on) => toggle([permission.name], on)}
                    disabled={disabled}
                    label={<code>{permission.name}</code>}
                    description={
                      [
                        permission.description,
                        permission.scope
                          ? `(${t(`permissions.scopes.${permission.scope}`)})`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
