import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { storageApi } from '@/api/endpoints';
import type { StoragePolicy } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  FormField,
  Input,
  Select,
  Skeleton,
  layout,
  useToast,
} from '@/components/ui';
import { fieldErrors } from '@/lib/errors';
import { parseList } from './storage-utils';
import styles from './storage.module.css';

type Mode = 'inherit' | 'refuse' | 'store_inert';

/**
 * The product's content-type policy for blocked file types (`GET/PUT
 * /v1/products/{id}/storage/policy`): refuse or keep as inert attachments, extra blocked
 * extensions/types and extensions accepted as inert. The built-in blocklist is shown read-only.
 */
export function StoragePolicyCard({ productId, canEdit }: { productId: string; canEdit: boolean }) {
  const { t } = useTranslation('storage');
  const query = useQuery({
    queryKey: queryKeys.storagePolicy(productId),
    queryFn: () => storageApi.policy(productId),
  });
  if (query.isPending) {
    return (
      <Card title={t('policy.title')}>
        <Skeleton height={160} radius={8} />
      </Card>
    );
  }
  if (query.isError) {
    return (
      <Card title={t('policy.title')}>
        <ErrorState
          error={query.error}
          onRetry={() => void query.refetch()}
          compact
          headingLevel={3}
        />
      </Card>
    );
  }
  return (
    <PolicyForm
      key={query.data.product_version}
      productId={productId}
      policy={query.data}
      canEdit={canEdit}
    />
  );
}

function PolicyForm({
  productId,
  policy,
  canEdit,
}: {
  productId: string;
  policy: StoragePolicy;
  canEdit: boolean;
}) {
  const { t } = useTranslation('storage');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>(
    policy.blocked_types_source === 'product' ? policy.blocked_types : 'inherit',
  );
  const [blockedExtensions, setBlockedExtensions] = useState(policy.blocked_extensions.join(', '));
  const [blockedTypes, setBlockedTypes] = useState(policy.blocked_content_types.join(', '));
  const [inertExtensions, setInertExtensions] = useState(policy.inert_extensions.join(', '));

  const save = useMutation({
    mutationFn: () =>
      storageApi.setPolicy(
        productId,
        {
          blocked_types: mode === 'inherit' ? null : mode,
          blocked_extensions: parseList(blockedExtensions, { extensions: true }),
          blocked_content_types: parseList(blockedTypes),
          inert_extensions: parseList(inertExtensions, { extensions: true }),
        },
        policy.product_version,
      ),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.storagePolicy(productId), saved);
      // The policy lives in the product's settings; the product's version changed too.
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(productId), exact: true });
      toast.success(t('policy.saved'));
    },
    onError: showError,
  });
  const fields = save.error ? fieldErrors(save.error) : {};
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  const modeLabel = (value: 'refuse' | 'store_inert') => t(`policy.${value}`);

  return (
    <Card
      title={t('policy.title')}
      description={canEdit ? t('policy.description') : t('policy.readOnly')}
    >
      <form className={layout.form} onSubmit={submit} aria-label={t('policy.title')}>
        <FormField
          label={t('policy.mode')}
          help={`${t('policy.modeHelp')} ${t(`policy.source.${policy.blocked_types_source}`)}.`}
          error={fields.blocked_types}
        >
          <Select
            value={mode}
            onChange={(event) => setMode(event.target.value as Mode)}
            disabled={!canEdit}
          >
            <option value="inherit">
              {t('policy.inherit', { mode: modeLabel(policy.installation_blocked_types) })}
            </option>
            <option value="refuse">{modeLabel('refuse')}</option>
            <option value="store_inert">{modeLabel('store_inert')}</option>
          </Select>
        </FormField>
        <FormField
          label={t('policy.inertExtensions')}
          help={t('policy.inertExtensionsHelp')}
          error={fields.inert_extensions}
        >
          <Input
            value={inertExtensions}
            onChange={(event) => setInertExtensions(event.target.value)}
            disabled={!canEdit}
            spellCheck={false}
            autoComplete="off"
          />
        </FormField>
        <div className={layout.row}>
          <FormField
            label={t('policy.blockedExtensions')}
            help={t('policy.blockedExtensionsHelp')}
            error={fields.blocked_extensions}
          >
            <Input
              value={blockedExtensions}
              onChange={(event) => setBlockedExtensions(event.target.value)}
              disabled={!canEdit}
              spellCheck={false}
              autoComplete="off"
            />
          </FormField>
          <FormField
            label={t('policy.blockedContentTypes')}
            help={t('policy.blockedContentTypesHelp')}
            error={fields.blocked_content_types}
          >
            <Input
              value={blockedTypes}
              onChange={(event) => setBlockedTypes(event.target.value)}
              disabled={!canEdit}
              spellCheck={false}
              autoComplete="off"
            />
          </FormField>
        </div>
        <Alert tone="info">{t('policy.inertNote')}</Alert>
        <details className={styles.builtIn}>
          <summary>{t('policy.builtIn')}</summary>
          <p className={layout.muted}>{t('policy.builtInExtensions')}</p>
          <span className={layout.tags}>
            {policy.builtin_blocked_extensions.map((ext) => (
              <Badge key={ext}>.{ext}</Badge>
            ))}
          </span>
          <p className={layout.muted}>{t('policy.builtInTypes')}</p>
          <span className={layout.tags}>
            {policy.builtin_blocked_content_types.map((type) => (
              <Badge key={type}>{type}</Badge>
            ))}
          </span>
        </details>
        {canEdit ? (
          <div className={layout.actions}>
            <Button type="submit" variant="primary" icon={<Save />} loading={save.isPending}>
              {t('common:actions.save')}
            </Button>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
