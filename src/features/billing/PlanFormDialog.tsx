import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { billingApi, usageApi } from '@/api/endpoints';
import type { Plan, PriceInput } from '@/api/models';
import { usageBillingKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useMeta } from '@/app/contexts';
import { isModuleEnabled } from '@/app/modules';
import {
  Button,
  Dialog,
  FormField,
  IconButton,
  Input,
  Select,
  Switch,
  Textarea,
  layout,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import {
  CURRENCY_PATTERN,
  entitlementMap,
  entitlementRows,
  formatMoney,
  fromMinorUnits,
  INTERVALS,
  PLAN_KEY_PATTERN,
  toMinorUnits,
  validateEntitlements,
  type EntitlementRow,
} from './billing-utils';
import { EntitlementsEditor } from './EntitlementsEditor';
import styles from './billing.module.css';

interface PriceRow {
  id: string | null;
  amount: string;
  currency: string;
  interval: 'month' | 'year';
  providerPriceId: string;
}

function priceRows(plan: Plan | null): PriceRow[] {
  return (plan?.prices ?? []).map((price) => ({
    id: price.id,
    amount: fromMinorUnits(price.amount_minor, price.currency),
    currency: price.currency,
    interval: price.interval === 'year' ? 'year' : 'month',
    providerPriceId: price.provider_price_id ?? '',
  }));
}

/** Create or edit a plan: prices (stored as minor units) and entitlements. */
export function PlanFormDialog({
  productId,
  plan,
  onClose,
  onSaved,
}: {
  productId: string;
  plan: Plan | null;
  onClose: () => void;
  onSaved: (plan: Plan, created: boolean) => void;
}) {
  const { t } = useTranslation('billing');
  const { locale } = useFormatters();
  const meta = useMeta();
  const can = useCan();
  const showError = useErrorToast();
  const [key, setKey] = useState(plan?.key ?? '');
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [trialDays, setTrialDays] = useState(String(plan?.trial_days ?? 0));
  const [active, setActive] = useState(plan?.active ?? true);
  const [prices, setPrices] = useState<PriceRow[]>(() => priceRows(plan));
  const [entitlements, setEntitlements] = useState<EntitlementRow[]>(() =>
    entitlementRows(plan?.entitlements),
  );
  const usageReadable = isModuleEnabled(meta.modules, 'usage') && can('usage:read');
  const meters = useQuery({
    queryKey: usageBillingKeys.meters(productId),
    queryFn: () => usageApi.meters(productId),
    enabled: usageReadable,
  });

  const keyInvalid = !plan && key !== '' && !PLAN_KEY_PATTERN.test(key);
  const trial = Number(trialDays);
  const trialInvalid = !/^\d+$/.test(trialDays.trim()) || trial > 365;
  const priceProblems = prices.map((row) => {
    const currency = row.currency.trim().toUpperCase();
    if (!CURRENCY_PATTERN.test(currency)) return 'currency';
    if (Number.isNaN(toMinorUnits(row.amount, currency))) return 'amount';
    return null;
  });
  const entitlementProblems = validateEntitlements(entitlements);
  const invalid =
    (!plan && (!key || keyInvalid)) ||
    !name.trim() ||
    trialInvalid ||
    priceProblems.some(Boolean) ||
    Object.keys(entitlementProblems).length > 0;

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        description: description.trim(),
        active,
        trial_days: trial,
        prices: prices.map((row): PriceInput => {
          const currency = row.currency.trim().toUpperCase();
          return {
            ...(row.id ? { id: row.id } : {}),
            amount_minor: toMinorUnits(row.amount, currency),
            currency,
            interval: row.interval,
            provider_price_id: row.providerPriceId.trim() || null,
          };
        }),
        entitlements: entitlementMap(entitlements),
      };
      return plan
        ? billingApi.updatePlan(productId, plan.id, body, plan.version)
        : billingApi.createPlan(productId, { key, ...body });
    },
    onSuccess: (saved) => onSaved(saved, !plan),
    onError: showError,
  });
  const fields = save.error ? fieldErrors(save.error) : {};
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!invalid) save.mutate();
  };
  const updatePrice = (index: number, patch: Partial<PriceRow>) =>
    setPrices((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={plan ? t('plans.editTitle', { name: plan.name }) : t('plans.create')}
      description={t('plans.formDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="plan-form"
            variant="primary"
            loading={save.isPending}
            disabled={invalid}
          >
            {plan ? t('common:actions.save') : t('plans.createSubmit')}
          </Button>
        </>
      }
    >
      <form id="plan-form" className={layout.form} onSubmit={submit}>
        <div className={layout.row}>
          <FormField label={t('plans.name')} error={fields.name} required>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <FormField
            label={t('plans.key')}
            help={plan ? t('plans.keyImmutable') : t('plans.keyHelp')}
            error={keyInvalid ? t('plans.keyInvalid') : fields.key}
            required={!plan}
          >
            <Input
              value={key}
              onChange={(event) => setKey(event.target.value)}
              readOnly={Boolean(plan)}
              autoComplete="off"
              spellCheck={false}
            />
          </FormField>
        </div>
        <FormField label={t('plans.descriptionLabel')} error={fields.description}>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
        </FormField>
        <div className={layout.row}>
          <FormField
            label={t('plans.trialDays')}
            help={t('plans.trialDaysHelp')}
            error={trialInvalid ? t('plans.trialInvalid') : fields.trial_days}
          >
            <Input
              value={trialDays}
              onChange={(event) => setTrialDays(event.target.value)}
              inputMode="numeric"
            />
          </FormField>
          <Switch
            checked={active}
            onCheckedChange={setActive}
            label={t('plans.activeLabel')}
            description={t('plans.activeHelp')}
          />
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('prices.title')}</legend>
          <p className={styles.help}>{t('prices.help')}</p>
          {prices.length === 0 ? <p className={styles.help}>{t('prices.free')}</p> : null}
          <ul className={styles.rows}>
            {prices.map((row, index) => {
              const currency = row.currency.trim().toUpperCase();
              const minor = CURRENCY_PATTERN.test(currency)
                ? toMinorUnits(row.amount, currency)
                : Number.NaN;
              return (
                <li key={index} className={styles.priceRow}>
                  <FormField
                    label={t('prices.amount')}
                    help={
                      Number.isNaN(minor)
                        ? undefined
                        : t('prices.stored', {
                            minor,
                            formatted: formatMoney(minor, currency, locale),
                          })
                    }
                    error={
                      priceProblems[index] === 'amount' ? t('prices.amountInvalid') : undefined
                    }
                  >
                    <Input
                      value={row.amount}
                      onChange={(event) => updatePrice(index, { amount: event.target.value })}
                      inputMode="decimal"
                      autoComplete="off"
                    />
                  </FormField>
                  <FormField
                    label={t('prices.currency')}
                    error={
                      priceProblems[index] === 'currency' ? t('prices.currencyInvalid') : undefined
                    }
                  >
                    <Input
                      value={row.currency}
                      onChange={(event) => updatePrice(index, { currency: event.target.value })}
                      maxLength={3}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </FormField>
                  <FormField label={t('prices.interval')}>
                    <Select
                      value={row.interval}
                      onChange={(event) =>
                        updatePrice(index, { interval: event.target.value as 'month' | 'year' })
                      }
                    >
                      {INTERVALS.map((value) => (
                        <option key={value} value={value}>
                          {t(`interval.${value}`)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField
                    label={t('prices.providerPriceId')}
                    help={t('prices.providerPriceIdHelp')}
                  >
                    <Input
                      value={row.providerPriceId}
                      onChange={(event) =>
                        updatePrice(index, { providerPriceId: event.target.value })
                      }
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </FormField>
                  <div className={styles.entRemove}>
                    <IconButton
                      label={t('prices.remove', { index: index + 1 })}
                      icon={<Trash2 />}
                      onClick={() => setPrices((rows) => rows.filter((_, i) => i !== index))}
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
                setPrices((rows) => [
                  ...rows,
                  {
                    id: null,
                    amount: '',
                    currency:
                      rows[rows.length - 1]?.currency ?? (locale === 'de-DE' ? 'EUR' : 'USD'),
                    interval: 'month',
                    providerPriceId: '',
                  },
                ])
              }
            >
              {t('prices.add')}
            </Button>
          </div>
        </fieldset>

        <EntitlementsEditor
          legend={t('entitlements.title')}
          rows={entitlements}
          onChange={setEntitlements}
          problems={entitlementProblems}
          meterKeys={(meters.data ?? []).map((meter) => meter.key)}
        />
        {fields.entitlements || fields.prices ? (
          <p role="alert" className={styles.help}>
            {fields.entitlements ?? fields.prices}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
