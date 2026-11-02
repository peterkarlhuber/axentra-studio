import { Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, FormField, IconButton, Input, Select } from '@/components/ui';
import type { EntitlementRow } from './billing-utils';
import styles from './billing.module.css';

/**
 * Edits a flat entitlement map as rows: `feature.<name>` on/off, or `limit.<meter key>` with a
 * number (empty = unlimited). Meter keys are suggested when the usage module is readable.
 */
export function EntitlementsEditor({
  legend,
  rows,
  onChange,
  problems,
  meterKeys = [],
}: {
  legend: string;
  rows: EntitlementRow[];
  onChange: (rows: EntitlementRow[]) => void;
  problems: Record<number, string>;
  meterKeys?: string[];
}) {
  const { t } = useTranslation('billing');
  const listId = useId();
  const update = (index: number, patch: Partial<EntitlementRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <p className={styles.help}>{t('entitlements.editorHelp')}</p>
      {meterKeys.length ? (
        <datalist id={listId}>
          {meterKeys.map((key) => (
            <option key={key} value={key} />
          ))}
        </datalist>
      ) : null}
      {rows.length === 0 ? <p className={styles.help}>{t('entitlements.none')}</p> : null}
      <ul className={styles.rows}>
        {rows.map((row, index) => {
          const problem = problems[index];
          const label = row.name || t('entitlements.rowLabel', { index: index + 1 });
          return (
            <li key={index} className={styles.entRow}>
              <FormField label={t('entitlements.kind')}>
                <Select
                  value={row.kind}
                  onChange={(event) =>
                    update(index, { kind: event.target.value as EntitlementRow['kind'] })
                  }
                >
                  <option value="feature">{t('entitlements.feature')}</option>
                  <option value="limit">{t('entitlements.limit')}</option>
                </Select>
              </FormField>
              <FormField
                label={row.kind === 'limit' ? t('entitlements.meterKey') : t('entitlements.name')}
                error={
                  problem === 'name'
                    ? t('entitlements.nameInvalid')
                    : problem === 'duplicate'
                      ? t('entitlements.duplicate')
                      : undefined
                }
              >
                <Input
                  value={row.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                  list={row.kind === 'limit' && meterKeys.length ? listId : undefined}
                  autoComplete="off"
                  spellCheck={false}
                />
              </FormField>
              {row.kind === 'feature' ? (
                <div className={styles.entValue}>
                  <Checkbox
                    checked={row.enabled}
                    onCheckedChange={(checked) => update(index, { enabled: checked === true })}
                    label={t('entitlements.enabled')}
                  />
                </div>
              ) : (
                <FormField
                  label={t('entitlements.limitValue')}
                  help={t('entitlements.limitHelp')}
                  error={problem === 'limit' ? t('entitlements.limitInvalid') : undefined}
                >
                  <Input
                    value={row.limit}
                    onChange={(event) => update(index, { limit: event.target.value })}
                    inputMode="decimal"
                    autoComplete="off"
                  />
                </FormField>
              )}
              <div className={styles.entRemove}>
                <IconButton
                  label={t('entitlements.remove', { name: label })}
                  icon={<Trash2 />}
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div>
        <Button
          size="sm"
          icon={<Plus />}
          onClick={() =>
            onChange([...rows, { kind: 'feature', name: '', enabled: true, limit: '' }])
          }
        >
          {t('entitlements.add')}
        </Button>
      </div>
    </fieldset>
  );
}
