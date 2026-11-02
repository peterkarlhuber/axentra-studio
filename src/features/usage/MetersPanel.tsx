import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gauge, MoreHorizontal, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { usageApi } from '@/api/endpoints';
import type { Meter, MeterInput, MeterPatch } from '@/api/models';
import { usageBillingKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  FormField,
  Input,
  Select,
  Textarea,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import menuStyles from '@/components/ui/IconButton.module.css';
import { fieldErrors } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import {
  AGGREGATIONS,
  ENFORCEMENTS,
  formatQuantity,
  METER_KEY_PATTERN,
  parseDecimal,
  RESET_PERIODS,
} from './usage-utils';

/** Meter definitions of the product: list, create, edit, (de)activate, delete. */
export function MetersPanel({ productId, canManage }: { productId: string; canManage: boolean }) {
  const { t } = useTranslation('usage');
  const { locale } = useFormatters();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Meter | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Meter | null>(null);
  const key = usageBillingKeys.meters(productId);
  const meters = useQuery({ queryKey: key, queryFn: () => usageApi.meters(productId) });
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['products', productId, 'usage'] });

  const toggle = useMutation({
    mutationFn: (meter: Meter) =>
      usageApi.updateMeter(productId, meter.id, { active: !meter.active }, meter.version),
    onSuccess: (meter) => {
      toast.success(meter.active ? t('meters.activated') : t('meters.deactivated'));
      void invalidate();
    },
    onError: showError,
  });

  const columns: Column<Meter>[] = [
    {
      id: 'key',
      header: t('meters.key'),
      rowHeader: true,
      cell: (meter) => (
        <span className={layout.cellStack}>
          <code>{meter.key}</code>
          {meter.name ? <span className={layout.muted}>{meter.name}</span> : null}
        </span>
      ),
    },
    { id: 'unit', header: t('meters.unit'), cell: (meter) => meter.unit || '—' },
    {
      id: 'aggregation',
      header: t('meters.aggregation'),
      hideOnMobile: true,
      cell: (meter) => t(`aggregation.${meter.aggregation}`, { defaultValue: meter.aggregation }),
    },
    {
      id: 'period',
      header: t('meters.resetPeriod'),
      hideOnMobile: true,
      cell: (meter) => t(`period.${meter.reset_period}`, { defaultValue: meter.reset_period }),
    },
    {
      id: 'limit',
      header: t('meters.defaultLimit'),
      cell: (meter) =>
        meter.default_limit === null ? (
          t('limits.unlimited')
        ) : (
          <span className={layout.cellStack}>
            <span>{formatQuantity(meter.default_limit, locale)}</span>
            <span className={layout.muted}>
              {t(`enforcement.${meter.default_enforcement}`, {
                defaultValue: meter.default_enforcement,
              })}
            </span>
          </span>
        ),
    },
    {
      id: 'status',
      header: t('meters.status'),
      cell: (meter) =>
        meter.active ? (
          <Badge tone="success">{t('meters.active')}</Badge>
        ) : (
          <Badge>{t('meters.inactive')}</Badge>
        ),
    },
  ];
  if (canManage) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (meter) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`${menuStyles.iconButton} ${menuStyles.sm}`}
            aria-label={t('meters.actionsFor', { key: meter.key })}
          >
            <MoreHorizontal aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem icon={<Pencil />} onSelect={() => setEditing(meter)}>
              {t('meters.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem icon={<Power />} onSelect={() => toggle.mutate(meter)}>
              {meter.active ? t('meters.deactivate') : t('meters.activate')}
            </DropdownMenuItem>
            <DropdownMenuItem tone="danger" icon={<Trash2 />} onSelect={() => setDeleting(meter)}>
              {t('meters.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return (
    <Card
      flush
      title={t('meters.title')}
      description={t('meters.description')}
      actions={
        canManage ? (
          <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setEditing('new')}>
            {t('meters.create')}
          </Button>
        ) : null
      }
    >
      <DataTable
        caption={t('meters.title')}
        columns={columns}
        rows={meters.data}
        getRowId={(meter) => meter.id}
        status={meters.status}
        error={meters.error}
        onRetry={() => void meters.refetch()}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={<Gauge />}
            title={t('meters.empty')}
            description={canManage ? t('meters.emptyBody') : undefined}
          />
        }
      />
      {editing ? (
        <MeterFormDialog
          productId={productId}
          meter={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(meter, created) => {
            setEditing(null);
            toast.success(
              created
                ? t('meters.created', { key: meter.key })
                : t('meters.saved', { key: meter.key }),
            );
            void invalidate();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title={t('meters.deleteTitle')}
        description={t('meters.deleteBody', { key: deleting?.key })}
        confirmLabel={t('meters.delete')}
        confirmText={deleting?.key}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await usageApi.deleteMeter(productId, deleting.id, deleting.version);
            toast.success(t('meters.deleted', { key: deleting.key }));
            void invalidate();
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </Card>
  );
}

function MeterFormDialog({
  productId,
  meter,
  onClose,
  onSaved,
}: {
  productId: string;
  meter: Meter | null;
  onClose: () => void;
  onSaved: (meter: Meter, created: boolean) => void;
}) {
  const { t } = useTranslation('usage');
  const showError = useErrorToast();
  const [key, setKey] = useState(meter?.key ?? '');
  const [name, setName] = useState(meter?.name ?? '');
  const [unit, setUnit] = useState(meter?.unit ?? '');
  const [description, setDescription] = useState(meter?.description ?? '');
  const [aggregation, setAggregation] = useState<string>(meter?.aggregation ?? 'sum');
  const [period, setPeriod] = useState<string>(meter?.reset_period ?? 'month');
  const [limit, setLimit] = useState(
    meter?.default_limit === null || meter?.default_limit === undefined
      ? ''
      : String(meter.default_limit),
  );
  const [enforcement, setEnforcement] = useState<string>(meter?.default_enforcement ?? 'hard');

  const parsedLimit = parseDecimal(limit);
  const limitInvalid = Number.isNaN(parsedLimit) || (parsedLimit !== null && parsedLimit < 0);
  const keyInvalid = !meter && key !== '' && !METER_KEY_PATTERN.test(key);

  const save = useMutation({
    mutationFn: () => {
      if (meter) {
        const patch: MeterPatch = {
          name: name.trim(),
          unit: unit.trim(),
          description: description.trim(),
          default_limit: parsedLimit,
          default_enforcement: enforcement as 'hard' | 'soft',
        };
        return usageApi.updateMeter(productId, meter.id, patch, meter.version);
      }
      const body: MeterInput = {
        key,
        name: name.trim(),
        unit: unit.trim(),
        description: description.trim(),
        aggregation: aggregation as MeterInput['aggregation'],
        reset_period: period as MeterInput['reset_period'],
        default_limit: parsedLimit,
        default_enforcement: enforcement as MeterInput['default_enforcement'],
      };
      return usageApi.createMeter(productId, body);
    },
    onSuccess: (saved) => onSaved(saved, !meter),
    onError: showError,
  });
  const fields = save.error ? fieldErrors(save.error) : {};
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={meter ? t('meters.editTitle', { key: meter.key }) : t('meters.create')}
      description={meter ? t('meters.editDescription') : t('meters.createDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="meter-form"
            variant="primary"
            loading={save.isPending}
            disabled={(!meter && (!key || keyInvalid)) || limitInvalid}
          >
            {meter ? t('common:actions.save') : t('meters.createSubmit')}
          </Button>
        </>
      }
    >
      <form id="meter-form" className={layout.form} onSubmit={submit}>
        <FormField
          label={t('meters.key')}
          help={meter ? t('meters.immutable') : t('meters.keyHelp')}
          error={keyInvalid ? t('meters.keyInvalid') : fields.key}
          required={!meter}
        >
          <Input
            value={key}
            onChange={(event) => setKey(event.target.value)}
            readOnly={Boolean(meter)}
            autoComplete="off"
            spellCheck={false}
          />
        </FormField>
        <div className={layout.row}>
          <FormField label={t('meters.name')} error={fields.name}>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <FormField label={t('meters.unit')} help={t('meters.unitHelp')} error={fields.unit}>
            <Input value={unit} onChange={(event) => setUnit(event.target.value)} />
          </FormField>
        </div>
        <div className={layout.row}>
          <FormField
            label={t('meters.aggregation')}
            help={meter ? t('meters.immutable') : t('meters.aggregationHelp')}
          >
            <Select
              value={aggregation}
              onChange={(event) => setAggregation(event.target.value)}
              disabled={Boolean(meter)}
            >
              {AGGREGATIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`aggregation.${value}`)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label={t('meters.resetPeriod')}
            help={meter ? t('meters.immutable') : t('meters.resetPeriodHelp')}
          >
            <Select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              disabled={Boolean(meter)}
            >
              {RESET_PERIODS.map((value) => (
                <option key={value} value={value}>
                  {t(`period.${value}`)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className={layout.row}>
          <FormField
            label={t('meters.defaultLimit')}
            help={t('meters.defaultLimitHelp')}
            error={limitInvalid ? t('meters.limitInvalid') : fields.default_limit}
          >
            <Input
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
            />
          </FormField>
          <FormField label={t('meters.enforcement')} help={t('meters.enforcementHelp')}>
            <Select value={enforcement} onChange={(event) => setEnforcement(event.target.value)}>
              {ENFORCEMENTS.map((value) => (
                <option key={value} value={value}>
                  {t(`enforcement.${value}`)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label={t('meters.descriptionLabel')} error={fields.description}>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
