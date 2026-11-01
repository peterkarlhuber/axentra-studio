import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { tenantsApi } from '@/api/endpoints';
import type { Tenant } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Button,
  Card,
  DataTable,
  Dialog,
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
import { slugify } from '@/lib/slug';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useCursorList } from '@/lib/useCursorList';

export function TenantsPage() {
  const { t } = useTranslation('tenants');
  const { productId } = useProductScope();
  const can = useCan();
  const navigate = useNavigate();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'suspended'>('');
  const q = useDebouncedValue(search.trim(), 300);
  const creating = searchParams.get('new') === '1' && can('tenants:create');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const effectiveSlug = slugTouched ? slug : slugify(name);
  const filtered = Boolean(q || status);

  const params = { q, status };
  const { tableProps } = useCursorList(queryKeys.tenants(productId, params), (cursor) =>
    tenantsApi.list(productId, { ...params, cursor }),
  );

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

  const create = useMutation({
    mutationFn: () =>
      tenantsApi.create(productId, { name: name.trim(), slug: effectiveSlug.trim() }),
    onSuccess: (tenant) => {
      toast.success(t('create.success', { name: tenant.name }));
      setName('');
      setSlug('');
      setSlugTouched(false);
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'tenants'] });
      void navigate(`/p/${productId}/tenants/${encodeURIComponent(tenant.id)}`);
    },
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  const columns: Column<Tenant>[] = [
    {
      id: 'name',
      header: t('fields.name'),
      rowHeader: true,
      cell: (tenant) => (
        <Link
          className={layout.link}
          to={`/p/${productId}/tenants/${encodeURIComponent(tenant.id)}`}
        >
          {tenant.name}
        </Link>
      ),
    },
    {
      id: 'slug',
      header: t('fields.slug'),
      hideOnMobile: true,
      cell: (tenant) => <code className={layout.mono}>{tenant.slug}</code>,
    },
    {
      id: 'status',
      header: t('fields.status'),
      cell: (tenant) => <StatusPill status={tenant.status} />,
    },
    {
      id: 'members',
      header: t('fields.members'),
      hideOnMobile: true,
      align: 'end',
      cell: (tenant) => tenant.member_count ?? '',
    },
    {
      id: 'created',
      header: t('fields.created'),
      hideOnMobile: true,
      cell: (tenant) => <Time value={tenant.created_at} />,
    },
  ];

  const fields = create.error ? fieldErrors(create.error) : {};

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          can('tenants:create') ? (
            <Button variant="primary" icon={<Plus />} onClick={() => setCreating(true)}>
              {t('create.open')}
            </Button>
          ) : null
        }
      />
      <Card flush>
        <div className={layout.toolbar} role="search">
          <FormField label={t('search')}>
            <Input
              type="search"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </FormField>
          <FormField label={t('fields.status')}>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as '' | 'active' | 'suspended')}
            >
              <option value="">{t('filters.allStatuses')}</option>
              <option value="active">{t('common:status.active')}</option>
              <option value="suspended">{t('common:status.suspended')}</option>
            </Select>
          </FormField>
        </div>
        <DataTable
          caption={t('title')}
          columns={columns}
          getRowId={(tenant) => tenant.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={filtered ? <Search /> : <Building2 />}
              title={filtered ? t('empty.filteredTitle') : t('empty.title')}
              description={filtered ? t('empty.filteredBody') : t('empty.body')}
            />
          }
          {...tableProps}
        />
      </Card>
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title={t('create.title')}
        description={t('create.description')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              form="tenant-form"
              variant="primary"
              loading={create.isPending}
              disabled={!name.trim() || !effectiveSlug.trim()}
            >
              {t('create.submit')}
            </Button>
          </>
        }
      >
        <form id="tenant-form" className={layout.form} onSubmit={submit}>
          <FormField label={t('fields.name')} error={fields.name} required>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <FormField
            label={t('fields.slug')}
            help={t('create.slugHelp')}
            error={fields.slug}
            required
          >
            <Input
              value={effectiveSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              spellCheck={false}
              autoComplete="off"
            />
          </FormField>
        </form>
      </Dialog>
    </div>
  );
}
