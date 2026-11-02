import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { accessApi, asItems } from '@/api/endpoints';
import type { Role } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  FormField,
  IconButton,
  Input,
  PageHeader,
  Select,
  Textarea,
  layout,
  useToast,
  type Column,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { slugify } from '@/lib/slug';
import { PermissionChecklist } from './PermissionChecklist';
import { grantableFor } from './permission-groups';
import { HelpLink } from '@/help/HelpLink';
import styles from './access.module.css';

type EditorState =
  { mode: 'create' } | { mode: 'edit'; role: Role } | { mode: 'view'; role: Role } | null;

export function RolesPage() {
  const { t } = useTranslation('access');
  const { productId } = useProductScope();
  const can = useCan();
  const canManage = can('roles:manage');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const rolesQuery = useQuery({
    queryKey: queryKeys.roles(productId),
    queryFn: () => accessApi.roles(productId),
  });
  const roles = asItems(rolesQuery.data);
  const builtIn = roles.filter((role) => role.builtin);
  const custom = roles.filter((role) => !role.builtin);

  const permissionSummary = (role: Role) => (
    <span className={layout.tags}>
      {role.permissions.slice(0, 3).map((name) => (
        <Badge key={name}>{name}</Badge>
      ))}
      {role.permissions.length > 3 ? (
        <Badge tone="brand">{t('roles.more', { count: role.permissions.length - 3 })}</Badge>
      ) : null}
    </span>
  );

  const baseColumns: Column<Role>[] = [
    {
      id: 'name',
      header: t('roles.name'),
      rowHeader: true,
      cell: (role) => (
        <span className={layout.cellStack}>
          <span>
            {role.name} <code className={layout.muted}>{role.key}</code>
          </span>
          {role.description ? <span className={layout.muted}>{role.description}</span> : null}
        </span>
      ),
    },
    {
      id: 'scope',
      header: t('roles.scope'),
      hideOnMobile: true,
      cell: (role) => (
        <Badge tone={role.scope === 'product' ? 'brand' : 'info'}>
          {t(`roles.scopes.${role.scope}`)}
        </Badge>
      ),
    },
    { id: 'permissions', header: t('roles.permissions'), cell: permissionSummary },
  ];

  const builtInColumns: Column<Role>[] = [
    ...baseColumns,
    {
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (role) => (
        <IconButton
          size="sm"
          icon={<Eye />}
          label={t('roles.viewNamed', { name: role.name })}
          onClick={() => setEditor({ mode: 'view', role })}
        />
      ),
    },
  ];

  const customColumns: Column<Role>[] = [
    ...baseColumns,
    {
      id: 'actions',
      header: <span className="ax-sr-only">{t('common:table.actions')}</span>,
      align: 'end',
      cell: (role) =>
        canManage ? (
          <span className={layout.tags}>
            <IconButton
              size="sm"
              icon={<Pencil />}
              label={t('roles.editNamed', { name: role.name })}
              onClick={() => setEditor({ mode: 'edit', role })}
            />
            <IconButton
              size="sm"
              variant="danger"
              icon={<Trash2 />}
              label={t('roles.deleteNamed', { name: role.name })}
              onClick={() => setDeleting(role)}
            />
          </span>
        ) : (
          <IconButton
            size="sm"
            icon={<Eye />}
            label={t('roles.viewNamed', { name: role.name })}
            onClick={() => setEditor({ mode: 'view', role })}
          />
        ),
    },
  ];

  const tableState = {
    status: rolesQuery.status,
    error: rolesQuery.error,
    onRetry: () => void rolesQuery.refetch(),
  };

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('roles.title')}
        description={t('roles.description')}
        help="roles-permissions"
        actions={
          canManage ? (
            <Button variant="primary" icon={<Plus />} onClick={() => setEditor({ mode: 'create' })}>
              {t('roles.create')}
            </Button>
          ) : null
        }
      />
      <Card flush title={t('roles.custom')} description={t('roles.customDescription')}>
        <DataTable
          caption={t('roles.custom')}
          columns={customColumns}
          rows={custom}
          getRowId={(role) => role.key}
          empty={
            <EmptyState
              compact
              headingLevel={3}
              icon={<ShieldCheck />}
              title={t('roles.customEmpty')}
              description={
                canManage ? (
                  <>
                    {t('roles.customEmptyBody')}{' '}
                    <HelpLink topic="roles-permissions#create">
                      {t('common:help.learnMore')}
                    </HelpLink>
                  </>
                ) : undefined
              }
            />
          }
          {...tableState}
        />
      </Card>
      <Card
        flush
        title={
          <span className={layout.tags}>
            <Lock aria-hidden width={16} height={16} /> {t('roles.builtIn')}
          </span>
        }
        description={t('roles.builtInDescription')}
      >
        <DataTable
          caption={t('roles.builtIn')}
          columns={builtInColumns}
          rows={builtIn}
          getRowId={(role) => role.key}
          {...tableState}
        />
      </Card>
      {editor ? (
        <RoleEditor
          key={editor.mode === 'create' ? 'create' : editor.role.key}
          state={editor}
          productId={productId}
          onClose={() => setEditor(null)}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title={t('roles.deleteTitle')}
        description={t('roles.deleteBody', { name: deleting?.name })}
        confirmLabel={t('roles.delete')}
        confirmText={deleting?.name}
        onConfirm={async () => {
          if (!deleting?.id) return;
          try {
            await accessApi.deleteRole(productId, deleting.id);
            toast.success(t('roles.deleted', { name: deleting.name }));
            void queryClient.invalidateQueries({ queryKey: queryKeys.roles(productId) });
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      >
        <HelpLink topic="roles-permissions#delete">{t('common:help.learnMore')}</HelpLink>
      </ConfirmDialog>
    </div>
  );
}

function RoleEditor({
  state,
  productId,
  onClose,
}: {
  state: NonNullable<EditorState>;
  productId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('access');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const role = state.mode === 'create' ? undefined : state.role;
  const readOnly = state.mode === 'view';
  const [name, setName] = useState(role?.name ?? '');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [scope, setScope] = useState<'product' | 'tenant'>(role?.scope ?? 'tenant');
  const effectiveKey = keyTouched ? key : slugify(name, '_');
  const [description, setDescription] = useState(role?.description ?? '');
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  // Built-in and product-defined permissions of this product (active ones only).
  const catalog = useQuery({
    queryKey: queryKeys.productPermissions(productId),
    queryFn: () => accessApi.productPermissions(productId),
    staleTime: 60_000,
  });
  const effectiveScope = role?.scope ?? scope;
  // Tenant roles hold tenant permissions; product roles also product ones; never platform.
  const allowed = grantableFor(asItems(catalog.data), effectiveScope);
  const allowedNames = new Set(allowed.map((permission) => permission.name));
  const selectedAllowed = catalog.data
    ? permissions.filter((name) => allowedNames.has(name))
    : permissions;

  const save = useMutation({
    mutationFn: () => {
      const common = {
        name: name.trim(),
        description: description.trim(),
        permissions: selectedAllowed,
      };
      return role?.id
        ? accessApi.updateRole(productId, role.id, common, role.version)
        : accessApi.createRole(productId, { ...common, key: effectiveKey.trim(), scope });
    },
    onSuccess: (saved) => {
      toast.success(
        role ? t('roles.updated', { name: saved.name }) : t('roles.created', { name: saved.name }),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles(productId) });
      onClose();
    },
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  const fields = save.error ? fieldErrors(save.error) : {};
  const title =
    state.mode === 'create'
      ? t('roles.create')
      : state.mode === 'edit'
        ? t('roles.editNamed', { name: role?.name })
        : role?.name;

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={title}
      description={
        readOnly
          ? role?.builtin
            ? t('roles.builtInReadOnly')
            : role?.description
          : t('roles.editorDescription')
      }
      footer={
        readOnly ? (
          <Button onClick={onClose}>{t('common:actions.close')}</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              form="role-form"
              variant="primary"
              loading={save.isPending}
              disabled={!name.trim() || (!role && !effectiveKey.trim())}
            >
              {t('common:actions.save')}
            </Button>
          </>
        )
      }
    >
      {readOnly ? (
        <ul className={styles.permList} aria-label={t('roles.permissions')}>
          {(role?.permissions ?? []).map((permission) => (
            <li key={permission}>
              <Badge>{permission}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <form id="role-form" className={layout.form} onSubmit={submit}>
          <FormField label={t('roles.name')} error={fields.name} required>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          {!role ? (
            <div className={layout.row}>
              <FormField
                label={t('roles.key')}
                help={t('roles.keyHelp')}
                info={t('roles.keyInfo')}
                infoTopic="roles-permissions#create"
                error={fields.key}
                required
              >
                <Input
                  value={effectiveKey}
                  onChange={(event) => {
                    setKeyTouched(true);
                    setKey(event.target.value);
                  }}
                  spellCheck={false}
                  autoComplete="off"
                />
              </FormField>
              <FormField
                label={t('roles.scope')}
                help={t(`roles.scopeHelp.${scope}`)}
                info={t('roles.scopeInfo')}
                infoTopic="roles-permissions#create"
                error={fields.scope}
                required
              >
                <Select
                  value={scope}
                  onChange={(event) => setScope(event.target.value as 'product' | 'tenant')}
                >
                  <option value="tenant">{t('roles.scopes.tenant')}</option>
                  <option value="product">{t('roles.scopes.product')}</option>
                </Select>
              </FormField>
            </div>
          ) : null}
          <FormField label={t('roles.descriptionField')} error={fields.description}>
            <Textarea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
          {catalog.isError ? (
            <p role="alert" className={layout.muted}>
              {t('permissions.loadError')}
            </p>
          ) : (
            <PermissionChecklist
              legend={t('roles.permissions')}
              info={t('roles.permissionsInfo')}
              infoLabel={t('roles.permissionsAbout')}
              infoTopic="members-invitations#role-ceiling"
              permissions={allowed}
              value={selectedAllowed}
              onChange={setPermissions}
              disabled={catalog.isPending}
            />
          )}
          {fields.permissions ? <p role="alert">{fields.permissions}</p> : null}
        </form>
      )}
    </Dialog>
  );
}
