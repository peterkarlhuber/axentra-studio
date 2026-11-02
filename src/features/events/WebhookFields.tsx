import { useTranslation } from 'react-i18next';
import { Alert, FormField, Input, Switch, Textarea, layout } from '@/components/ui';
import { EventTypesField } from './EventTypesField';
import { webhookUrlProblem, type WebhookFormValues } from './events-utils';
import styles from './events.module.css';

export function TypeList({ types }: { types: string[] }) {
  return (
    <span className={layout.tags}>
      {types.map((type) => (
        <code key={type} className={styles.tag}>
          {type}
        </code>
      ))}
    </span>
  );
}

/** URL, description, event types and enabled; shared by create and edit. */
export function WebhookFields({
  productId,
  values,
  onChange,
  fields,
}: {
  productId: string;
  values: WebhookFormValues;
  onChange: (values: WebhookFormValues) => void;
  fields: Record<string, string>;
}) {
  const { t } = useTranslation('events');
  const urlIssue = webhookUrlProblem(values.url);
  const isHttp = !urlIssue && values.url.trim().toLowerCase().startsWith('http:');
  return (
    <>
      <FormField
        label={t('webhooks.url')}
        help={t('webhooks.urlHelp')}
        error={urlIssue ? t(`validation.url.${urlIssue}`) : fields.url}
        required
      >
        <Input
          type="url"
          inputMode="url"
          value={values.url}
          onChange={(event) => onChange({ ...values, url: event.target.value })}
          placeholder="https://example.com/hooks/axentra"
          autoComplete="off"
          spellCheck={false}
        />
      </FormField>
      {isHttp ? <Alert tone="warning">{t('webhooks.httpWarning')}</Alert> : null}
      <FormField label={t('webhooks.descriptionLabel')} error={fields.description}>
        <Textarea
          rows={2}
          maxLength={1000}
          value={values.description}
          onChange={(event) => onChange({ ...values, description: event.target.value })}
        />
      </FormField>
      <EventTypesField
        productId={productId}
        value={values.eventTypes}
        onChange={(eventTypes) => onChange({ ...values, eventTypes })}
        error={fields.event_types}
      />
      <Switch
        checked={values.enabled}
        onCheckedChange={(enabled) => onChange({ ...values, enabled })}
        label={t('webhooks.enabled')}
        description={t('webhooks.enabledHelp')}
      />
    </>
  );
}
