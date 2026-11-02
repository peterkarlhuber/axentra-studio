import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellOff, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyApi } from '@/api/endpoints';
import type { NotifyPreferences } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useErrorToast } from '@/app/auth';
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Skeleton,
  layout,
  useToast,
} from '@/components/ui';
import { TenantPicker } from '@/features/shared/TenantPicker';
import { InfoTip } from '@/help/InfoTip';
import styles from './notify.module.css';

/**
 * The signed-in user's own opt-outs (`/notify/preferences/me`), product-wide or for one
 * tenant. Locked categories (`transactional`, `security`) are always delivered.
 */
export function PreferencesPanel({ productId }: { productId: string }) {
  const { t } = useTranslation('notify');
  const [tenantId, setTenantId] = useState('');
  const prefs = useQuery({
    queryKey: queryKeys.notifyPreferences(productId, tenantId || undefined),
    queryFn: () => notifyApi.preferences(productId, tenantId || undefined),
    retry: false,
  });

  return (
    <Card
      title={t('preferences.title')}
      description={
        <>
          {t('preferences.description')}{' '}
          <InfoTip
            label={t('help:tip.about', { topic: t('preferences.scope') })}
            topic="notifications#preferences"
          >
            {t('info.scope')}
          </InfoTip>
        </>
      }
    >
      <div className={layout.form}>
        <TenantPicker
          productId={productId}
          value={tenantId}
          onChange={setTenantId}
          allowNone
          noneLabel={t('preferences.productWide')}
          label={t('preferences.scope')}
          help={t('preferences.scopeHelp')}
        />
        {prefs.isPending ? (
          <div className={layout.form} aria-busy="true">
            <Skeleton />
            <Skeleton width="60%" />
          </div>
        ) : prefs.isError ? (
          <ErrorState
            error={prefs.error}
            onRetry={() => void prefs.refetch()}
            compact
            headingLevel={3}
          />
        ) : (
          <PreferencesForm
            key={`${tenantId}:${prefs.data.version}`}
            productId={productId}
            tenantId={tenantId || undefined}
            prefs={prefs.data}
          />
        )}
      </div>
    </Card>
  );
}

function PreferencesForm({
  productId,
  tenantId,
  prefs,
}: {
  productId: string;
  tenantId: string | undefined;
  prefs: NotifyPreferences;
}) {
  const { t } = useTranslation('notify');
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const [optedOut, setOptedOut] = useState<string[]>(prefs.opted_out);
  const locked = new Set(prefs.locked_categories);
  const categories = [...new Set([...prefs.locked_categories, ...prefs.available_categories])];
  const dirty =
    optedOut.length !== prefs.opted_out.length ||
    optedOut.some((category) => !prefs.opted_out.includes(category));

  const save = useMutation({
    mutationFn: () => notifyApi.setPreferences(productId, optedOut, prefs.version, tenantId),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.notifyPreferences(productId, tenantId), saved);
      toast.success(t('preferences.saved'));
    },
    onError: showError,
  });

  if (categories.length === 0) {
    return (
      <EmptyState
        compact
        headingLevel={3}
        icon={<BellOff />}
        title={t('preferences.empty')}
        description={t('preferences.emptyBody')}
      />
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <form className={layout.form} onSubmit={submit}>
      <fieldset className={styles.categories}>
        <legend className={styles.legend}>{t('preferences.receive')}</legend>
        {categories.map((category) =>
          locked.has(category) ? (
            <Checkbox
              key={category}
              checked
              disabled
              onCheckedChange={() => undefined}
              label={
                <span className={layout.tags}>
                  {category} <Lock aria-hidden width={14} height={14} />
                </span>
              }
              description={t('preferences.locked')}
            />
          ) : (
            <Checkbox
              key={category}
              checked={!optedOut.includes(category)}
              onCheckedChange={(receive) =>
                setOptedOut((current) =>
                  receive ? current.filter((value) => value !== category) : [...current, category],
                )
              }
              label={category}
            />
          ),
        )}
      </fieldset>
      <div className={layout.actions}>
        <Button type="submit" variant="primary" loading={save.isPending} disabled={!dirty}>
          {t('preferences.save')}
        </Button>
      </div>
    </form>
  );
}
