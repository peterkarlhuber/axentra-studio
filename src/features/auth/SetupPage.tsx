import { useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';
import { setCsrfToken } from '@/api/csrf';
import { authApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useMeta } from '@/app/contexts';
import { CenteredLayout } from '@/components/layout/CenteredLayout';
import { Alert, Button, FormField, Input, useToast } from '@/components/ui';
import { describeError, fieldErrors } from '@/lib/errors';
import { AuthLanguageSwitch } from './AuthLanguageSwitch';
import styles from './auth.module.css';

/** First-run setup: creates the first platform administrator (`POST /v1/auth/setup`). */
export function SetupPage() {
  const { t } = useTranslation('auth');
  const meta = useMeta();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({
    setup_token: '',
    email: '',
    name: '',
    password: '',
    confirm: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    document.title = `${t('setup.title')} · ${t('common:app.name')}`;
  }, [t]);

  if (!meta.setup_required) return <Navigate to="/login" replace />;

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setSubmitting(true);
    setError(null);
    try {
      // Setup signs the new administrator in and returns the browser session.
      const session = await authApi.setup({
        setup_token: form.setup_token.trim(),
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
      });
      setCsrfToken(session.csrf_token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.meta });
      queryClient.setQueryData(queryKeys.session, session);
      toast.success(t('setup.successTitle'), t('setup.successBody'));
      void navigate('/', { replace: true });
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };

  const described = error ? describeError(t, error) : null;
  const fields = error ? fieldErrors(error) : {};

  return (
    <CenteredLayout wide footer={<AuthLanguageSwitch />}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('setup.title')}</h1>
        <p className={styles.subtitle}>{t('setup.subtitle')}</p>
      </div>
      <form className={styles.form} onSubmit={submit}>
        {described ? (
          <Alert tone="danger" title={described.title}>
            {described.message}
            {described.requestId ? (
              <>
                {' '}
                ({t('errors:requestId')}: <code>{described.requestId}</code>)
              </>
            ) : null}
          </Alert>
        ) : null}
        <FormField
          label={t('fields.setupToken')}
          help={
            <>
              {t('setup.tokenHelp')} <code>axentra admin setup-token</code>
            </>
          }
          error={fields.setup_token}
          required
        >
          <Input
            value={form.setup_token}
            onChange={update('setup_token')}
            autoComplete="off"
            spellCheck={false}
          />
        </FormField>
        <FormField label={t('fields.name')} error={fields.name} required>
          <Input value={form.name} onChange={update('name')} autoComplete="name" />
        </FormField>
        <FormField label={t('fields.email')} error={fields.email} required>
          <Input type="email" value={form.email} onChange={update('email')} autoComplete="email" />
        </FormField>
        <FormField
          label={t('fields.password')}
          error={fields.password}
          help={t('setup.passwordHelp')}
          required
        >
          <Input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
          />
        </FormField>
        <FormField
          label={t('fields.confirmPassword')}
          error={mismatch ? t('setup.passwordMismatch') : undefined}
          required
        >
          <Input
            type="password"
            value={form.confirm}
            onChange={update('confirm')}
            autoComplete="new-password"
          />
        </FormField>
        <Button type="submit" variant="primary" size="lg" loading={submitting} icon={<Sparkles />}>
          {t('setup.submit')}
        </Button>
      </form>
    </CenteredLayout>
  );
}
