import { Search, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { usersApi } from '@/api/endpoints';
import type { User } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useIsPlatformAdmin } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Button,
  Card,
  DataTable,
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
import { ExternalUserDialog } from './ExternalUserDialog';
import { useCursorList } from '@/lib/useCursorList';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

export function UsersPage() {
  const { t } = useTranslation('users');
  const { productId } = useProductScope();
  const isAdmin = useIsPlatformAdmin();
  const navigate = useNavigate();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'disabled'>('');
  const q = useDebouncedValue(search.trim(), 300);
  const params = { product_id: productId, q, status };
  const { tableProps } = useCursorList(queryKeys.users(params), (cursor) =>
    usersApi.list({ ...params, cursor }),
  );
  const filtered = Boolean(q || status);

  const columns: Column<User>[] = [
    {
      id: 'name',
      header: t('fields.name'),
      rowHeader: true,
      cell: (user) => (
        <span className={layout.cellStack}>
          <Link className={layout.link} to={`/p/${productId}/users/${encodeURIComponent(user.id)}`}>
            {user.name || user.email || user.id}
          </Link>
          <span className={layout.muted}>{user.email ?? user.id}</span>
        </span>
      ),
    },
    {
      id: 'status',
      header: t('fields.status'),
      cell: (user) => <StatusPill status={user.status} />,
    },
    {
      id: 'lastLogin',
      header: t('fields.lastLogin'),
      hideOnMobile: true,
      cell: (user) => <Time value={user.last_login_at} />,
    },
    {
      id: 'created',
      header: t('fields.created'),
      hideOnMobile: true,
      cell: (user) => <Time value={user.created_at} />,
    },
  ];

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        help="users"
        actions={
          isAdmin ? (
            <Button icon={<UserPlus />} onClick={() => setCreating(true)}>
              {t('external.open')}
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
              onChange={(event) => setStatus(event.target.value as '' | 'active' | 'disabled')}
            >
              <option value="">{t('filters.allStatuses')}</option>
              <option value="active">{t('common:status.active')}</option>
              <option value="disabled">{t('common:status.disabled')}</option>
            </Select>
          </FormField>
        </div>
        <DataTable
          caption={t('title')}
          columns={columns}
          getRowId={(user) => user.id}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={filtered ? <Search /> : <Users />}
              title={filtered ? t('empty.filteredTitle') : t('empty.title')}
              description={filtered ? t('empty.filteredBody') : t('empty.body')}
            />
          }
          {...tableProps}
        />
      </Card>
      {isAdmin ? (
        <ExternalUserDialog
          open={creating}
          onOpenChange={setCreating}
          onCreated={(user) => {
            setCreating(false);
            toast.success(t('external.created'));
            void navigate(`/p/${productId}/users/${encodeURIComponent(user.id)}`);
          }}
        />
      ) : null}
    </div>
  );
}
