import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, KeyRound, MoreHorizontal, Plus, RotateCw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { accessApi, asItems } from '@/api/endpoints';
import type { ApiKey } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useMeta, useProductScope } from '@/app/contexts';
import { isModuleEnabled } from '@/app/modules';
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
  PageHeader,
  Select,
  StatusPill,
  Time,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { EXPIRY_PRESET_DAYS, expiryFor, minCustomDate, type ExpiryChoice } from './api-key-expiry';
import { PermissionChecklist } from './PermissionChecklist';
import { SecretRevealDialog } from './SecretRevealDialog';
import { HelpLink } from '@/help/HelpLink';
import { InfoTip } from '@/help/InfoTip';
import menuStyles from '@/components/ui/IconButton.module.css';

export function ApiKeysPage() {
  const { t } = useTranslation('access');
  const { productId } = useProductScope();
  const meta = useMeta();
  const can = useCan();
  const canManage = can('api_keys:manage');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const creating = searchParams.get('new') === '1' && canManage;
  const [secret, setSecret] = useState<{ value: string; name: string } | null>(null);
  const [confirm, setConfirm] = useState<{ action: 'rotate' | 'revoke'; key: ApiKey } | null>(null);
  const [grace, setGrace] = useState('0');
  const key = queryKeys.apiKeys(productId);
  const keys = useQuery({ queryKey: key, queryFn: () => accessApi.apiKeys(productId) });
  const rows = keys.data
    ? [...keys.data].sort(
        (a, b) =>
          Number(a.status !== 'active') - Number(b.status !== 'active') ||
          b.created_at.localeCompare(a.created_at),
      )
    : undefined;
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['products', productId, 'api-keys'] });

  const setCreating = (open: boolean) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (open) next.set('new', '1');
        else next.delete('new');
        return next;
      },
      { replace: true },
    );

  const columns: Column<ApiKey>[] = [
    {
      id: 'name',
      header: t('keys.name'),
      rowHeader: true,
      cell: (apiKey) => (
        <span className={layout.cellStack}>
          <span>{apiKey.name}</span>
          <code className={layout.muted}>{apiKey.prefix}…</code>
        </span>
      ),
    },
    {
      id: 'status',
      header: (
        <>
          {t('keys.status')}{' '}
          <InfoTip label={t('keys.statusAbout')} topic="api-keys#list">
            {t('keys.statusInfo')}
          </InfoTip>
        </>
      ),
      cell: (apiKey) => <StatusPill status={apiKey.status} />,
    },
    {
      id: 'scope',
      header: t('keys.scope'),
      hideOnMobile: true,
      cell: (apiKey) =>
        apiKey.tenant_id ? (
          <Badge tone="info">
            {t('keys.tenantScoped')}: <code>{apiKey.tenant_id}</code>
          </Badge>
        ) : (
          <Badge>{t('keys.productWide')}</Badge>
        ),
    },
    {
      id: 'permissions',
      header: t('keys.permissions'),
      hideOnMobile: true,
      cell: (apiKey) => t('keys.permissionCount', { count: apiKey.permissions.length }),
    },
    {
      id: 'lastUsed',
      header: (
        <>
          {t('keys.lastUsed')}{' '}
          <InfoTip label={t('keys.lastUsedAbout')} topic="api-keys#list">
            {t('keys.lastUsedInfo')}
          </InfoTip>
        </>
      ),
      cell: (apiKey) => <Time value={apiKey.last_used_at} />,
    },
    {
      id: 'expires',
      header: t('keys.expires'),
      hideOnMobile: true,
      cell: (apiKey) => <Time value={apiKey.expires_at} />,
    },
    {
      id: 'created',
      header: t('keys.created'),
      hideOnMobile: true,
      cell: (apiKey) => <Time value={apiKey.created_at} />,
    },
  ];
  if (canManage) {
    columns.push({
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (apiKey) =>
        apiKey.status !== 'active' ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`${menuStyles.iconButton} ${menuStyles.sm}`}
              aria-label={t('keys.actionsFor', { name: apiKey.name })}
            >
              <MoreHorizontal aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                icon={<RotateCw />}
                onSelect={() => setConfirm({ action: 'rotate', key: apiKey })}
              >
                {t('keys.rotate')}
              </DropdownMenuItem>
              <DropdownMenuItem
                tone="danger"
                icon={<Ban />}
                onSelect={() => setConfirm({ action: 'revoke', key: apiKey })}
              >
                {t('keys.revoke')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    });
  }

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('keys.title')}
        description={t('keys.description')}
        help="api-keys"
        actions={
          canManage ? (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              {t('keys.create')}
            </Button>
          ) : null
        }
      />
      <Card flush>
        <DataTable
          caption={t('keys.title')}
          columns={columns}
          getRowId={(apiKey) => apiKey.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<KeyRound />}
              title={t('keys.empty')}
              description={
                canManage ? (
                  <>
                    {t('keys.emptyBody')}{' '}
                    <HelpLink topic="api-keys#create">{t('common:help.learnMore')}</HelpLink>
                  </>
                ) : undefined
              }
            />
          }
          rows={rows}
          status={keys.status}
          error={keys.error}
          onRetry={() => void keys.refetch()}
        />
      </Card>
      {creating ? (
        <CreateKeyDialog
          productId={productId}
          tenantsEnabled={isModuleEnabled(meta.modules, 'tenants')}
          onClose={() => setCreating(false)}
          onCreated={(name, value) => {
            setCreating(false);
            setSecret({ name, value });
            void invalidate();
          }}
        />
      ) : null}
      <SecretRevealDialog
        secret={secret?.value ?? null}
        keyName={secret?.name ?? ''}
        onClose={() => setSecret(null)}
      >
        <p className={layout.muted}>
          {t('keys.secretUsage')}{' '}
          <HelpLink topic="api-keys#use">{t('common:help.learnMore')}</HelpLink>
        </p>
      </SecretRevealDialog>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirm(null);
            setGrace('0');
          }
        }}
        title={confirm?.action === 'rotate' ? t('keys.rotateTitle') : t('keys.revokeTitle')}
        description={
          confirm?.action === 'rotate'
            ? t('keys.rotateBody', { name: confirm.key.name })
            : t('keys.revokeBody', { name: confirm?.key.name })
        }
        confirmLabel={confirm?.action === 'rotate' ? t('keys.rotate') : t('keys.revoke')}
        confirmText={confirm?.action === 'revoke' ? confirm.key.name : undefined}
        onConfirm={async () => {
          if (!confirm) return;
          try {
            if (confirm.action === 'rotate') {
              const rotated = await accessApi.rotateApiKey(
                productId,
                confirm.key.id,
                Number(grace),
              );
              setSecret({ name: rotated.key.name, value: rotated.secret });
            } else {
              await accessApi.revokeApiKey(productId, confirm.key.id);
              toast.success(t('keys.revoked', { name: confirm.key.name }));
            }
            void invalidate();
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      >
        {confirm?.action === 'rotate' ? (
          <FormField
            label={t('keys.grace')}
            help={t('keys.graceHelp')}
            info={t('keys.graceInfo')}
            infoTopic="api-keys#grace-period"
          >
            <Select value={grace} onChange={(event) => setGrace(event.target.value)}>
              <option value="0">{t('keys.graceNone')}</option>
              <option value="3600">{t('keys.grace1h')}</option>
              <option value="86400">{t('keys.grace24h')}</option>
              <option value="604800">{t('keys.grace7d')}</option>
            </Select>
          </FormField>
        ) : null}
        <HelpLink topic={confirm?.action === 'rotate' ? 'api-keys#rotate' : 'api-keys#revoke'}>
          {t('common:help.learnMore')}
        </HelpLink>
      </ConfirmDialog>
    </div>
  );
}

function CreateKeyDialog({
  productId,
  tenantsEnabled,
  onClose,
  onCreated,
}: {
  productId: string;
  tenantsEnabled: boolean;
  onClose: () => void;
  onCreated: (name: string, secret: string) => void;
}) {
  const { t } = useTranslation('access');
  const showError = useErrorToast();
  const [name, setName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [expiryChoice, setExpiryChoice] = useState<ExpiryChoice>('never');
  const [customDate, setCustomDate] = useState('');
  const [expiryTouched, setExpiryTouched] = useState(false);
  const expiry = expiryFor(expiryChoice, customDate);
  // Built-in and product-defined permissions of this product (active ones only).
  const catalog = useQuery({
    queryKey: queryKeys.productPermissions(productId),
    queryFn: () => accessApi.productPermissions(productId),
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: () => {
      // Recomputed at submit so a preset counts from the moment the key is created.
      const result = expiryFor(expiryChoice, customDate);
      return accessApi.createApiKey(productId, {
        name: name.trim(),
        permissions,
        ...(tenantId ? { tenant_id: tenantId } : {}),
        ...(result.ok && result.expiresAt ? { expires_at: result.expiresAt } : {}),
      });
    },
    onSuccess: (created) => onCreated(created.key.name, created.secret),
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setExpiryTouched(true);
    if (!expiry.ok) return;
    create.mutate();
  };
  const fields = create.error ? fieldErrors(create.error) : {};
  const expiryError =
    !expiry.ok && expiryTouched
      ? expiry.reason === 'past'
        ? t('keys.expiryPast')
        : t('keys.expiryMissing')
      : fields.expires_at;

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={t('keys.create')}
      description={
        <>
          {t('keys.createDescription')}{' '}
          <HelpLink topic="api-keys#create">{t('common:help.learnMore')}</HelpLink>
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="key-form"
            variant="primary"
            loading={create.isPending}
            disabled={!name.trim() || permissions.length === 0 || (!expiry.ok && expiryTouched)}
          >
            {t('keys.createSubmit')}
          </Button>
        </>
      }
    >
      <form id="key-form" className={layout.form} onSubmit={submit}>
        <FormField label={t('keys.name')} help={t('keys.nameHelp')} error={fields.name} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
        </FormField>
        {tenantsEnabled ? (
          <TenantPicker
            productId={productId}
            value={tenantId}
            onChange={setTenantId}
            label={t('keys.tenantScope')}
            help={t('keys.tenantScopeHelp')}
            info={t('keys.tenantScopeInfo')}
            infoTopic="api-keys#tenant-scope"
            allowNone
            noneLabel={t('keys.productWide')}
          />
        ) : null}
        <FormField
          label={t('keys.expiry')}
          help={t('keys.expiryHelp')}
          info={t('keys.expiryInfo')}
          infoTopic="api-keys#expiry"
          error={expiryChoice === 'custom' ? undefined : fields.expires_at}
        >
          <Select
            value={expiryChoice}
            onChange={(event) => {
              setExpiryChoice(event.target.value as ExpiryChoice);
              setExpiryTouched(false);
            }}
          >
            <option value="never">{t('keys.expiryNever')}</option>
            {EXPIRY_PRESET_DAYS.map((days) => (
              <option key={days} value={String(days)}>
                {t('keys.expiryDays', { count: days })}
              </option>
            ))}
            <option value="custom">{t('keys.expiryCustom')}</option>
          </Select>
        </FormField>
        {expiryChoice === 'custom' ? (
          <FormField
            label={t('keys.expiryDate')}
            help={t('keys.expiryDateHelp')}
            error={expiryError}
            required
          >
            <Input
              type="date"
              min={minCustomDate()}
              value={customDate}
              onChange={(event) => setCustomDate(event.target.value)}
              onBlur={() => setExpiryTouched(true)}
            />
          </FormField>
        ) : null}
        {catalog.isError ? (
          <p role="alert" className={layout.muted}>
            {t('permissions.loadError')}
          </p>
        ) : (
          <PermissionChecklist
            legend={t('keys.permissions')}
            info={t('keys.permissionsInfo')}
            infoLabel={t('keys.permissionsAbout')}
            infoTopic="api-keys#create"
            permissions={asItems(catalog.data).filter(
              (permission) => permission.scope !== 'platform' && !permission.retired_at,
            )}
            value={permissions}
            onChange={setPermissions}
            disabled={catalog.isPending}
          />
        )}
        {fields.permissions ? <p role="alert">{fields.permissions}</p> : null}
      </form>
    </Dialog>
  );
}
