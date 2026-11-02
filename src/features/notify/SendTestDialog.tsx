import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Send } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyApi, tenantsApi } from '@/api/endpoints';
import type { NotifyMessage, NotifyRendered, NotifyTemplate } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  FormField,
  Input,
  Select,
  layout,
  useToast,
} from '@/components/ui';
import { describeError } from '@/lib/errors';
import { TenantPicker } from '@/features/shared/TenantPicker';
import {
  displayValue,
  messageTone,
  newIdempotencyKey,
  sampleValue,
  sortLocales,
} from './notify-utils';
import { RenderedView } from './RenderedView';
import styles from './notify.module.css';

type RecipientKind = 'member' | 'email';

/**
 * Send one notification from a template to a tenant member or an address
 * (`POST /tenants/{id}/notify/send`). Each dialog uses one `Idempotency-Key`, so a repeated
 * click after a network error cannot enqueue the message twice.
 */
export function SendTestDialog({
  productId,
  template,
  onClose,
}: {
  productId: string;
  template: NotifyTemplate;
  onClose: () => void;
}) {
  const { t } = useTranslation('notify');
  const can = useCan();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const formId = useId();
  const [tenantId, setTenantId] = useState('');
  const [kind, setKind] = useState<RecipientKind>('member');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [locale, setLocale] = useState('');
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      template.variables.map((name) => [name, displayValue(template.sample_data[name])]),
    ),
  );
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [sent, setSent] = useState<NotifyMessage | null>(null);
  const [preview, setPreview] = useState<NotifyRendered | null>(null);
  const canSendHere = tenantId ? can('notify:send', { tenantId }) : true;

  const members = useQuery({
    queryKey: queryKeys.tenantMembers(productId, tenantId),
    queryFn: () => tenantsApi.members(productId, tenantId),
    enabled: Boolean(tenantId) && kind === 'member',
  });

  const variables = () =>
    Object.fromEntries(
      Object.entries(values).map(([name, text]) => [
        name,
        sampleValue(text, template.sample_data[name]),
      ]),
    );

  const previewMutation = useMutation({
    mutationFn: () =>
      notifyApi.previewTemplate(productId, template.key, {
        locale: locale || null,
        variables: variables(),
      }),
    onSuccess: setPreview,
  });

  const send = useMutation({
    mutationFn: () =>
      notifyApi.send(
        productId,
        tenantId,
        {
          template_key: template.key,
          to: kind === 'member' ? { user_id: userId } : { email: email.trim() },
          variables: variables(),
          locale: locale || null,
        },
        idempotencyKey,
      ),
    onSuccess: (message) => {
      setSent(message);
      // The next send from this dialog is a new message, not a replay.
      setIdempotencyKey(newIdempotencyKey());
      toast.success(t('send.queued', { status: t(`status.${message.status}`) }));
      void queryClient.invalidateQueries({ queryKey: ['products', productId, 'notify'] });
    },
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send.mutate();
  };
  const recipientReady = kind === 'member' ? Boolean(userId) : email.trim().includes('@');
  const previewError = previewMutation.error ? describeError(t, previewMutation.error) : null;

  return (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="lg"
      title={t('send.title', { name: template.name || template.key })}
      description={t('send.description')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common:actions.close')}
          </Button>
          <Button
            icon={<Eye />}
            onClick={() => previewMutation.mutate()}
            loading={previewMutation.isPending}
          >
            {t('send.preview')}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            icon={<Send />}
            loading={send.isPending}
            disabled={!tenantId || !recipientReady || !canSendHere}
          >
            {t('send.submit')}
          </Button>
        </>
      }
    >
      <form id={formId} className={layout.form} onSubmit={submit}>
        <TenantPicker
          productId={productId}
          value={tenantId}
          onChange={(value) => {
            setTenantId(value);
            setUserId('');
          }}
          help={t('send.tenantHelp')}
        />
        {!canSendHere ? <Alert tone="warning">{t('send.noPermission')}</Alert> : null}
        <FormField label={t('send.recipientKind')}>
          <Select value={kind} onChange={(event) => setKind(event.target.value as RecipientKind)}>
            <option value="member">{t('send.toMember')}</option>
            <option value="email">{t('send.toEmail')}</option>
          </Select>
        </FormField>
        {kind === 'member' ? (
          <FormField
            label={t('send.member')}
            help={tenantId ? t('send.memberHelp') : t('send.chooseTenantFirst')}
            error={members.isError ? describeError(t, members.error).message : undefined}
            required
          >
            <Select
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              disabled={!tenantId || members.isPending}
            >
              <option value="" disabled>
                {members.isFetching ? t('common:states.loading') : t('send.chooseMember')}
              </option>
              {(members.data ?? []).map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.name ? `${member.name} <${member.email}>` : member.email}
                </option>
              ))}
            </Select>
          </FormField>
        ) : (
          <FormField label={t('send.email')} help={t('send.emailHelp')} required>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </FormField>
        )}
        <FormField label={t('fields.locale')} help={t('send.localeHelp')}>
          <Select value={locale} onChange={(event) => setLocale(event.target.value)}>
            <option value="">{t('send.localeAuto')}</option>
            {sortLocales(Object.keys(template.variants)).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </FormField>
        {template.variables.length > 0 ? (
          <fieldset className={styles.categories}>
            <legend className={styles.legend}>{t('send.variables')}</legend>
            {template.variables.map((name) => (
              <FormField key={name} label={<code>{name}</code>}>
                <Input
                  value={values[name] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [name]: event.target.value }))
                  }
                  spellCheck={false}
                />
              </FormField>
            ))}
          </fieldset>
        ) : null}
        {template.sensitive ? <Alert tone="info">{t('send.sensitive')}</Alert> : null}
      </form>
      {previewError ? (
        <Alert tone="danger" title={previewError.title}>
          {previewError.error.detail ?? previewError.message}
        </Alert>
      ) : null}
      {preview ? (
        <div className={layout.form}>
          <h3 className={styles.sectionTitle}>
            {t('send.previewTitle', { locale: preview.locale })}
          </h3>
          <RenderedView
            subject={preview.subject}
            html={preview.html}
            text={preview.text}
            label={t('send.previewTitle', { locale: preview.locale })}
          />
        </div>
      ) : null}
      {sent ? (
        <Alert tone="success" title={t('send.sentTitle')}>
          <p>
            <code>{sent.id}</code> ·{' '}
            <Badge tone={messageTone(sent.status)}>{t(`status.${sent.status}`)}</Badge>
          </p>
          <p>{t('send.dispatchHint')}</p>
        </Alert>
      ) : null}
    </Dialog>
  );
}
