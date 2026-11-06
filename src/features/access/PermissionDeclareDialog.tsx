import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { accessApi } from '@/api/endpoints';
import type { Permission } from '@/api/models';
import {
  Button,
  Checkbox,
  Dialog,
  FormField,
  Input,
  Select,
  Textarea,
  layout,
  useToast,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { ProblemAlert } from '@/features/shared/ProblemAlert';

/** `<namespace>.<resource>:<action>`, as Axentra's PRODUCT_PERMISSION_RE (at most 128 characters). */
const NAME_RE =
  /^[a-z][a-z0-9_-]{0,39}\.[a-z][a-z0-9_]{0,39}(?:\.[a-z][a-z0-9_]{0,39}){0,3}:[a-z][a-z0-9_]{0,39}$/;

/** Built-in roles that can hold a product permission beyond owners and admins, per scope. */
const DEFAULT_ROLE_CHOICES = {
  tenant: ['member', 'viewer', 'product_support', 'product_viewer'],
  product: ['product_support', 'product_viewer'],
} as const;

function isValidPermissionName(name: string): boolean {
  return name.length <= 128 && NAME_RE.test(name);
}

/**
 * Declare a product permission over the API (`PUT .../permissions/{name}`), or change or
 * re-activate one declared that way. Permissions registered by the product's code are changed
 * in the code (the server answers `409`).
 */
export function PermissionDeclareDialog({
  productId,
  permission,
  onClose,
}: {
  productId: string;
  /** The API-declared permission to change; undefined to declare a new one. */
  permission?: Permission;
  onClose: () => void;
}) {
  const { t } = useTranslation('access');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(permission?.name ?? '');
  const [scope, setScope] = useState<'product' | 'tenant'>(
    permission?.scope === 'product' ? 'product' : 'tenant',
  );
  const [description, setDescription] = useState(permission?.description ?? '');
  const [defaultRoles, setDefaultRoles] = useState<string[]>([
    ...(permission?.default_roles ?? []),
  ]);
  // '' = automatic (read-like when the name ends in ":read").
  const [readLike, setReadLike] = useState<'' | 'yes' | 'no'>(
    permission?.read_like === undefined || permission?.read_like === null
      ? ''
      : permission.read_like
        ? 'yes'
        : 'no',
  );
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();
  const nameError =
    touched && trimmed && !isValidPermissionName(trimmed) ? t('declare.nameInvalid') : undefined;
  const choices = DEFAULT_ROLE_CHOICES[scope];
  const roles = defaultRoles.filter((role) => (choices as readonly string[]).includes(role));

  const save = useMutation({
    mutationFn: () =>
      accessApi.declarePermission(productId, trimmed, {
        scope,
        description: description.trim(),
        default_roles: roles,
        read_like: readLike === '' ? null : readLike === 'yes',
      }),
    onSuccess: (saved) => {
      toast.success(
        permission
          ? t('declare.updated', { name: saved.name })
          : t('declare.created', { name: saved.name }),
      );
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'permissions'] });
      onClose();
    },
  });
  const fields = save.error ? fieldErrors(save.error) : {};
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!isValidPermissionName(trimmed)) return;
    save.mutate();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={permission ? t('declare.editTitle', { name: permission.name }) : t('declare.title')}
      description={t('declare.description')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="permission-form"
            variant="primary"
            loading={save.isPending}
            disabled={!trimmed}
          >
            {permission ? t('common:actions.save') : t('declare.submit')}
          </Button>
        </>
      }
    >
      <form id="permission-form" className={layout.form} onSubmit={submit} noValidate>
        <FormField
          label={t('catalog.name')}
          help={t('declare.nameHelp')}
          error={nameError ?? fields.name}
          required
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setTouched(true)}
            readOnly={Boolean(permission)}
            placeholder="crm.deals:approve"
            spellCheck={false}
            autoComplete="off"
          />
        </FormField>
        <FormField
          label={t('catalog.scope')}
          help={t(`declare.scopeHelp.${scope}`)}
          error={fields.scope}
          required
        >
          <Select
            value={scope}
            onChange={(event) => setScope(event.target.value as 'product' | 'tenant')}
          >
            <option value="tenant">{t('permissions.scopes.tenant')}</option>
            <option value="product">{t('permissions.scopes.product')}</option>
          </Select>
        </FormField>
        <FormField label={t('declare.descriptionField')} error={fields.description}>
          <Textarea
            rows={2}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormField>
        <fieldset className={layout.form}>
          <legend>{t('catalog.defaultRoles')}</legend>
          <p className={layout.muted}>{t('declare.defaultRolesHelp')}</p>
          {choices.map((role) => (
            <Checkbox
              key={role}
              label={<code>{role}</code>}
              checked={roles.includes(role)}
              onCheckedChange={(checked) =>
                setDefaultRoles((current) =>
                  checked ? [...current, role] : current.filter((entry) => entry !== role),
                )
              }
            />
          ))}
        </fieldset>
        <FormField
          label={t('declare.readLike')}
          help={t('declare.readLikeHelp')}
          error={fields.read_like}
        >
          <Select
            value={readLike}
            onChange={(event) => setReadLike(event.target.value as '' | 'yes' | 'no')}
          >
            <option value="">{t('declare.readLikeAuto')}</option>
            <option value="yes">{t('declare.readLikeYes')}</option>
            <option value="no">{t('declare.readLikeNo')}</option>
          </Select>
        </FormField>
        {save.error && Object.keys(fields).length === 0 ? (
          <ProblemAlert error={save.error} />
        ) : null}
      </form>
    </Dialog>
  );
}
