import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, Plus, Save, Send, Trash2, Wand2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { notifyApi } from '@/api/endpoints';
import type { NotifyTemplate, NotifyTemplateVariant } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useCan, useErrorToast } from '@/app/auth';
import { useProductScope } from '@/app/contexts';
import { canInAnyTenant } from '@/app/permissions';
import { useCrumbLabel } from '@/app/crumbs';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
  Time,
  layout,
  useToast,
  UnsavedChangesGuard,
} from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { describeError } from '@/lib/errors';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import {
  LOCALE_PATTERN,
  TEMPLATE_KEY_PATTERN,
  VARIABLE_PATTERN,
  displayValue,
  placeholdersIn,
  sampleValue,
  sortLocales,
} from './notify-utils';
import { RenderedView } from './RenderedView';
import { SendTestDialog } from './SendTestDialog';
import styles from './notify.module.css';

interface VariantDraft {
  subject: string;
  text: string;
  html: string;
}

interface VariableDraft {
  /** Stable row id for React keys while names are edited. */
  row: number;
  name: string;
  sample: string;
}

interface Draft {
  key: string;
  name: string;
  description: string;
  category: string;
  sensitive: boolean;
  variables: VariableDraft[];
  variants: Record<string, VariantDraft>;
}

let rowCounter = 0;
const nextRow = () => ++rowCounter;

/** The draft as compared for unsaved changes: row ids are only React keys, new on every draftFrom call. */
function comparable(draft: Draft): string {
  return JSON.stringify({
    ...draft,
    variables: draft.variables.map((variable) => ({
      name: variable.name,
      sample: variable.sample,
    })),
  });
}

function draftFrom(template: NotifyTemplate | undefined): Draft {
  if (!template) {
    return {
      key: '',
      name: '',
      description: '',
      category: 'transactional',
      sensitive: false,
      variables: [],
      variants: { en: { subject: '', text: '', html: '' } },
    };
  }
  return {
    key: template.key,
    name: template.name,
    description: template.description,
    category: template.category,
    sensitive: template.sensitive,
    variables: template.variables.map((name) => ({
      row: nextRow(),
      name,
      sample: displayValue(template.sample_data[name]),
    })),
    variants: Object.fromEntries(
      Object.entries(template.variants).map(([locale, variant]) => [
        locale,
        { subject: variant.subject, text: variant.text, html: variant.html ?? '' },
      ]),
    ),
  };
}

function apiVariants(draft: Draft): Record<string, NotifyTemplateVariant> {
  return Object.fromEntries(
    Object.entries(draft.variants).map(([locale, variant]) => [
      locale,
      {
        subject: variant.subject,
        text: variant.text,
        html: variant.html.trim() ? variant.html : null,
      },
    ]),
  );
}

function apiSampleData(draft: Draft, original: NotifyTemplate | undefined) {
  return Object.fromEntries(
    draft.variables
      .filter((variable) => variable.name.trim())
      .map((variable) => [
        variable.name.trim(),
        sampleValue(variable.sample, original?.sample_data[variable.name.trim()]),
      ]),
  );
}

const variableNames = (draft: Draft) =>
  draft.variables.map((variable) => variable.name.trim()).filter(Boolean);

/** Create or edit a notification template with a live, sandboxed preview. */
export function TemplateEditorPage() {
  const { t } = useTranslation('notify');
  const { templateKey } = useParams();
  const { productId } = useProductScope();
  const can = useCan();
  const isNew = templateKey === undefined;
  const template = useQuery({
    queryKey: queryKeys.notifyTemplate(productId, templateKey ?? ''),
    queryFn: () => notifyApi.template(productId, templateKey ?? ''),
    enabled: !isNew,
  });
  useCrumbLabel(template.data?.name || template.data?.key);

  if (!can('notify:manage')) {
    return (
      <div className={layout.stack}>
        <PageHeader title={t('editor.titleNew')} help="notifications#templates" />
        <EmptyState icon={<Lock />} title={t('editor.forbidden')} />
      </div>
    );
  }
  if (!isNew && template.isPending) {
    return (
      <div className={layout.stack} aria-busy="true">
        <Skeleton height={36} width={280} />
        <Skeleton height={240} />
      </div>
    );
  }
  if (!isNew && template.isError) {
    return (
      <div className={layout.stack}>
        <PageHeader title={templateKey ?? ''} help="notifications#templates" />
        <ErrorState error={template.error} onRetry={() => void template.refetch()} />
      </div>
    );
  }
  return (
    <TemplateEditor
      // Remount on a new server version so the form shows what was saved.
      key={`${template.data?.key ?? 'new'}:${template.data?.version ?? 0}:${template.data?.builtin ?? ''}`}
      productId={productId}
      template={template.data}
    />
  );
}

function TemplateEditor({
  productId,
  template,
}: {
  productId: string;
  template: NotifyTemplate | undefined;
}) {
  const { t } = useTranslation('notify');
  const navigate = useNavigate();
  const toast = useToast();
  const showError = useErrorToast();
  const queryClient = useQueryClient();
  const can = useCan();
  const { access } = useProductScope();
  const canSend = can('notify:send') || canInAnyTenant(access, 'notify:send');
  const [draft, setDraft] = useState<Draft>(() => draftFrom(template));
  const [initialDraft] = useState(() => comparable(draftFrom(template)));
  const [activeLocale, setActiveLocale] = useState('en');
  const [newLocale, setNewLocale] = useState('');
  const [previewLocale, setPreviewLocale] = useState('en');
  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);
  const isNew = !template;
  const builtin = template?.builtin ?? false;
  // Sent by Axentra only (e.g. `invitation`): `POST .../notify/send` refuses it for everyone.
  const systemOnly = template?.system_only ?? false;
  const locales = sortLocales(Object.keys(draft.variants));

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const setVariant = (locale: string, field: keyof VariantDraft, value: string) =>
    setDraft((current) => ({
      ...current,
      variants: {
        ...current.variants,
        [locale]: { ...(current.variants[locale] as VariantDraft), [field]: value },
      },
    }));
  const setVariable = (row: number, patch: Partial<VariableDraft>) =>
    setDraft((current) => ({
      ...current,
      variables: current.variables.map((variable) =>
        variable.row === row ? { ...variable, ...patch } : variable,
      ),
    }));

  const declared = variableNames(draft);
  const undeclared = placeholdersIn(apiVariants(draft)).filter((name) => !declared.includes(name));
  const duplicate = declared.find((name, index) => declared.indexOf(name) !== index);
  const invalidVariable = declared.find((name) => !VARIABLE_PATTERN.test(name));
  const keyError =
    isNew && draft.key && !TEMPLATE_KEY_PATTERN.test(draft.key)
      ? t('editor.keyInvalid')
      : undefined;
  const localeError =
    newLocale && !LOCALE_PATTERN.test(newLocale)
      ? t('editor.localeInvalid')
      : newLocale && draft.variants[newLocale]
        ? t('editor.localeExists')
        : undefined;

  // ---- Live preview of the unsaved draft (POST /notify/templates/preview) ----
  // Debounce a serialized request: a fresh object on every render would restart the timer on
  // each re-render, so the preview could stop following language and text changes.
  const previewJson = useDebouncedValue(
    JSON.stringify({
      variables: declared,
      sample_data: apiSampleData(draft, template),
      variants: apiVariants(draft),
      locale: draft.variants[previewLocale] ? previewLocale : 'en',
    }),
    400,
  );
  const previewInput = useMemo(
    () => JSON.parse(previewJson) as Parameters<typeof notifyApi.previewDraft>[1],
    [previewJson],
  );
  // The server requires a subject and a text in every language; until the draft has them the
  // preview would only answer 422, so it waits and says what is missing instead.
  const previewReady = Object.values(previewInput.variants).every(
    (variant) => variant.subject.length > 0 && variant.text.length > 0,
  );
  const preview = useQuery({
    queryKey: ['products', productId, 'notify', 'draft-preview', previewInput],
    queryFn: () => notifyApi.previewDraft(productId, previewInput),
    enabled: previewReady,
    retry: false,
    placeholderData: (previous) => previous,
  });
  const previewError = preview.error ? describeError(t, preview.error) : null;

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        category: draft.category.trim() || 'transactional',
        sensitive: draft.sensitive,
        variables: declared,
        sample_data: apiSampleData(draft, template),
        variants: apiVariants(draft),
      };
      if (!template || template.builtin) {
        // Creating a template with a built-in key stores an override of the default.
        return notifyApi.createTemplate(productId, {
          ...body,
          key: template?.key ?? draft.key.trim(),
          channel: 'email',
        });
      }
      return notifyApi.updateTemplate(productId, template.key, body, template.version);
    },
    onSuccess: (saved) => {
      toast.success(t('editor.saved', { key: saved.key, version: saved.version }));
      queryClient.setQueryData(queryKeys.notifyTemplate(productId, saved.key), saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifyTemplates(productId) });
      if (isNew) void navigate(`../templates/${encodeURIComponent(saved.key)}`, { replace: true });
    },
    onError: showError,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  const canSave =
    (!isNew || (draft.key && !keyError)) &&
    Boolean(draft.variants.en?.subject.trim() && draft.variants.en?.text.trim()) &&
    !duplicate &&
    !invalidVariable;

  const addLocale = () => {
    const code = newLocale.trim().toLowerCase();
    if (!code || localeError) return;
    setDraft((current) => ({
      ...current,
      variants: { ...current.variants, [code]: { subject: '', text: '', html: '' } },
    }));
    setActiveLocale(code);
    setNewLocale('');
  };
  const removeLocale = (locale: string) => {
    setDraft((current) => ({
      ...current,
      variants: Object.fromEntries(
        Object.entries(current.variants).filter(([code]) => code !== locale),
      ),
    }));
    setActiveLocale('en');
    if (previewLocale === locale) setPreviewLocale('en');
  };

  const title = isNew ? t('editor.titleNew') : template.name || template.key;

  return (
    <div className={layout.stack}>
      <PageHeader
        title={title}
        description={isNew ? t('editor.descriptionNew') : t('editor.description')}
        help="notifications#create-template"
        meta={
          template ? (
            <span className={layout.tags}>
              <code>{template.key}</code>
              {builtin ? (
                <Badge tone="brand">{t('templates.builtin')}</Badge>
              ) : (
                <Badge>{t('templates.version', { version: template.version })}</Badge>
              )}
              {systemOnly ? <Badge tone="info">{t('templates.systemOnly')}</Badge> : null}
              {template.updated_at ? (
                <span className={layout.muted}>
                  {t('editor.updated')} <Time value={template.updated_at} />
                </span>
              ) : null}
            </span>
          ) : null
        }
        actions={
          <>
            <ButtonLink to="../.." relative="path" variant="ghost" icon={<ArrowLeft />}>
              {t('editor.back')}
            </ButtonLink>
            {template && canSend && !systemOnly ? (
              <Button icon={<Send />} onClick={() => setSending(true)}>
                {t('send.open')}
              </Button>
            ) : null}
            {template && !builtin ? (
              <Button variant="danger" icon={<Trash2 />} onClick={() => setDeleting(true)}>
                {t('templates.delete')}
              </Button>
            ) : null}
          </>
        }
      />
      {builtin ? <Alert tone="info">{t('editor.builtinHint')}</Alert> : null}
      {systemOnly ? (
        <Alert tone="info">
          {t('templates.systemOnlyHint')}{' '}
          <HelpLink topic="notifications#templates">{t('common:help.learnMore')}</HelpLink>
        </Alert>
      ) : null}
      <div className={styles.editorGrid}>
        <UnsavedChangesGuard
          when={comparable(draft) !== initialDraft && !save.isPending && !deleting}
        />
        <form className={layout.stack} onSubmit={submit} aria-label={t('editor.formLabel')}>
          <Card title={t('editor.general')}>
            <div className={layout.form}>
              {isNew ? (
                <FormField
                  label={t('fields.templateKey')}
                  help={t('editor.keyHelp')}
                  error={keyError}
                  required
                >
                  <Input
                    value={draft.key}
                    onChange={(event) => update({ key: event.target.value })}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="welcome"
                  />
                </FormField>
              ) : null}
              <FormField label={t('fields.name')}>
                <Input
                  value={draft.name}
                  onChange={(event) => update({ name: event.target.value })}
                />
              </FormField>
              <FormField label={t('fields.description')}>
                <Textarea
                  rows={2}
                  value={draft.description}
                  onChange={(event) => update({ description: event.target.value })}
                />
              </FormField>
              <FormField
                label={t('fields.category')}
                help={t('editor.categoryHelp')}
                info={t('info.category')}
                infoTopic="notifications#categories"
              >
                <Input
                  value={draft.category}
                  onChange={(event) => update({ category: event.target.value })}
                  spellCheck={false}
                  list="notify-category-suggestions"
                />
              </FormField>
              <datalist id="notify-category-suggestions">
                <option value="transactional" />
                <option value="security" />
                <option value="onboarding" />
                <option value="product" />
              </datalist>
              <FormField label={t('fields.channel')} help={t('editor.channelHelp')}>
                <Select value="email" disabled>
                  <option value="email">{t('editor.channelEmail')}</option>
                </Select>
              </FormField>
              <Switch
                checked={draft.sensitive}
                onCheckedChange={(sensitive) => update({ sensitive })}
                label={t('fields.sensitive')}
                description={t('editor.sensitiveHelp')}
              />
            </div>
          </Card>

          <Card
            title={t('editor.variables')}
            description={
              <>
                {t('editor.variablesHelp', { placeholder: '{{ name }}' })}{' '}
                <HelpLink topic="notifications#placeholders">{t('common:help.learnMore')}</HelpLink>
              </>
            }
          >
            <div className={layout.form}>
              {draft.variables.length === 0 ? (
                <p className={layout.muted}>{t('editor.noVariables')}</p>
              ) : null}
              {draft.variables.map((variable) => (
                <div key={variable.row} className={styles.variableRow}>
                  <FormField
                    label={t('editor.variableName')}
                    error={
                      variable.name && !VARIABLE_PATTERN.test(variable.name.trim())
                        ? t('editor.variableInvalid')
                        : duplicate && variable.name.trim() === duplicate
                          ? t('editor.variableDuplicate')
                          : undefined
                    }
                  >
                    <Input
                      value={variable.name}
                      onChange={(event) => setVariable(variable.row, { name: event.target.value })}
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </FormField>
                  <FormField label={t('editor.sampleValue')}>
                    <Input
                      value={variable.sample}
                      onChange={(event) =>
                        setVariable(variable.row, { sample: event.target.value })
                      }
                    />
                  </FormField>
                  <IconButton
                    icon={<X />}
                    label={t('editor.removeVariable', { name: variable.name || '…' })}
                    onClick={() =>
                      update({
                        variables: draft.variables.filter((item) => item.row !== variable.row),
                      })
                    }
                  />
                </div>
              ))}
              <div className={layout.tags}>
                <Button
                  size="sm"
                  icon={<Plus />}
                  onClick={() =>
                    update({
                      variables: [...draft.variables, { row: nextRow(), name: '', sample: '' }],
                    })
                  }
                >
                  {t('editor.addVariable')}
                </Button>
                {undeclared.length > 0 ? (
                  <Button
                    size="sm"
                    icon={<Wand2 />}
                    onClick={() =>
                      update({
                        variables: [
                          ...draft.variables,
                          ...undeclared.map((name) => ({ row: nextRow(), name, sample: '' })),
                        ],
                      })
                    }
                  >
                    {t('editor.declareUsed', { names: undeclared.join(', ') })}
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>

          <Card
            title={t('editor.variants')}
            description={
              <>
                {t('editor.variantsHelp')}{' '}
                <HelpLink topic="notifications#locale-variants">
                  {t('common:help.learnMore')}
                </HelpLink>
              </>
            }
          >
            <div className={layout.form}>
              <Tabs
                label={t('editor.variants')}
                value={draft.variants[activeLocale] ? activeLocale : 'en'}
                onValueChange={setActiveLocale}
                items={locales.map((locale) => ({
                  value: locale,
                  label: locale,
                  content: (
                    <div className={layout.form}>
                      <FormField label={t('preview.subject')} required>
                        <Input
                          value={draft.variants[locale]?.subject ?? ''}
                          onChange={(event) => setVariant(locale, 'subject', event.target.value)}
                          lang={locale}
                        />
                      </FormField>
                      <FormField label={t('preview.text')} required>
                        <Textarea
                          mono
                          rows={6}
                          value={draft.variants[locale]?.text ?? ''}
                          onChange={(event) => setVariant(locale, 'text', event.target.value)}
                          lang={locale}
                        />
                      </FormField>
                      <FormField
                        label={t('preview.html')}
                        help={t('editor.htmlHelp')}
                        info={t('info.html')}
                        infoTopic="notifications#placeholders"
                      >
                        <Textarea
                          mono
                          rows={8}
                          value={draft.variants[locale]?.html ?? ''}
                          onChange={(event) => setVariant(locale, 'html', event.target.value)}
                          spellCheck={false}
                        />
                      </FormField>
                      {locale !== 'en' ? (
                        <div>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 />}
                            onClick={() => removeLocale(locale)}
                          >
                            {t('editor.removeLocale', { locale })}
                          </Button>
                        </div>
                      ) : (
                        <p className={layout.muted}>{t('editor.enRequired')}</p>
                      )}
                    </div>
                  ),
                }))}
              />
              <div className={styles.inlineRow}>
                <FormField
                  label={t('editor.newLocale')}
                  help={t('editor.newLocaleHelp')}
                  error={localeError}
                >
                  <Input
                    value={newLocale}
                    onChange={(event) => setNewLocale(event.target.value.toLowerCase())}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addLocale();
                      }
                    }}
                    placeholder="de"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </FormField>
                <Button
                  icon={<Plus />}
                  onClick={addLocale}
                  disabled={!newLocale || Boolean(localeError)}
                >
                  {t('editor.addLocale')}
                </Button>
              </div>
            </div>
          </Card>

          <div className={layout.actions}>
            <Button
              type="submit"
              variant="primary"
              icon={<Save />}
              loading={save.isPending}
              disabled={!canSave}
            >
              {builtin ? t('editor.saveOverride') : isNew ? t('editor.create') : t('editor.save')}
            </Button>
          </div>
        </form>

        <Card
          className={styles.sticky}
          title={t('preview.title')}
          description={t('preview.description')}
          actions={
            <FormField label={t('fields.locale')} hideLabel>
              <Select
                value={previewLocale}
                onChange={(event) => setPreviewLocale(event.target.value)}
              >
                {locales.map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </Select>
            </FormField>
          }
        >
          <div
            className={layout.form}
            aria-live="polite"
            aria-busy={preview.isFetching || undefined}
          >
            {!previewReady ? (
              <p className={layout.muted}>{t('preview.incomplete')}</p>
            ) : previewError ? (
              <Alert tone="warning" title={previewError.title}>
                {previewError.error.detail ?? previewError.message}
              </Alert>
            ) : null}
            {previewReady && preview.data ? (
              <>
                <p className={layout.muted}>
                  {t('preview.renderedIn', { locale: preview.data.locale })}
                </p>
                <RenderedView
                  subject={preview.data.subject}
                  html={preview.data.html}
                  text={preview.data.text}
                  label={t('preview.frameLabel')}
                />
              </>
            ) : previewReady && preview.isPending ? (
              <Skeleton height={200} />
            ) : null}
          </div>
        </Card>
      </div>

      {sending && template ? (
        <SendTestDialog
          productId={productId}
          template={template}
          onClose={() => setSending(false)}
        />
      ) : null}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t('templates.deleteTitle')}
        description={t('templates.deleteBody', { key: template?.key })}
        confirmLabel={t('templates.delete')}
        confirmText={template?.key}
        onConfirm={async () => {
          if (!template) return;
          try {
            await notifyApi.deleteTemplate(productId, template.key, template.version);
            toast.success(t('templates.deleted', { key: template.key }));
            void queryClient.invalidateQueries({
              queryKey: ['products', productId, 'notify', 'templates'],
            });
            void navigate('../..', { relative: 'path' });
          } catch (error) {
            showError(error);
            throw error;
          }
        }}
      />
    </div>
  );
}
