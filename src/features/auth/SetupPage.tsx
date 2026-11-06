import { useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router';
import { setCsrfToken } from '@/api/csrf';
import { authApi } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queryKeys';
import { useMeta } from '@/app/contexts';
import { CenteredLayout } from '@/components/layout/CenteredLayout';
import { Alert, Button, FormField, Input, useToast } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { passwordPolicy, passwordRefusal } from '@/lib/password';
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
      // 409: possibly someone completed setup in the meantime. Refreshing the server
      // information then closes this page and leads to the sign-in page.
      if (isApiError(caught) && caught.status === 409 && caught.code !== 'email_taken') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.meta });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const described = error ? describeError(t, error) : null;
  const fields = error ? fieldErrors(error) : {};
  const policy = passwordPolicy(meta);
  // A policy refusal names the field and its reason: show it translated at the field.
  const passwordError = passwordRefusal(t, error, policy) ?? fields.password;
  // The setup endpoint answers 401 for a wrong, expired or used token: not a session problem.
  const tokenRejected = isApiError(error) && error.status === 401;
  // 409 has two causes: setup was completed in the meantime (`setup_already_completed`), or the
  // email address is taken (`email_taken`). Backends before these codes answer `conflict` for
  // both; for them the message text is the only hint.
  const alreadyDone =
    isApiError(error) &&
    (error.code === 'setup_already_completed' ||
      (error.code === 'conflict' &&
        error.status === 409 &&
        /already completed/i.test(error.detail ?? '')));
  // Password policy, invalid address or an address already in use come without field details;
  // the server's reason (English) is the only precise explanation, so show it.
  const serverReason =
    isApiError(error) &&
    ((error.status === 422 && Object.keys(fields).length === 0) ||
      (error.status === 409 && !alreadyDone))
      ? error.detail
      : undefined;
  const alertTitle = tokenRejected
    ? t('setup.tokenInvalidTitle')
    : alreadyDone
      ? t('setup.alreadyDoneTitle')
      : described?.title;

  return (
    <CenteredLayout wide footer={<AuthLanguageSwitch />}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('setup.title')}</h1>
        <p className={styles.subtitle}>
          {t('setup.subtitle')} <HelpLink topic="first-run-setup">{t('setup.learnMore')}</HelpLink>
        </p>
      </div>
      <form className={styles.form} onSubmit={submit}>
        {described ? (
          <Alert tone="danger" title={alertTitle}>
            {tokenRejected ? (
              <>
                {t('setup.tokenInvalidBody')} <HelpLink topic="first-run-setup#setup-token" />
              </>
            ) : alreadyDone ? (
              <>
                {t('setup.alreadyDoneBody')} <Link to="/login">{t('setup.goToLogin')}</Link>
              </>
            ) : (
              described.message
            )}
            {serverReason ? (
              <>
                {' '}
                {t('setup.serverReason')}: <q>{serverReason}</q>
              </>
            ) : null}
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
          info={t('setup.tokenInfo')}
          infoTopic="first-run-setup#setup-token"
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
        <FormField
          label={t('fields.email')}
          error={fields.email}
          help={t('setup.emailHelp')}
          required
        >
          <Input type="email" value={form.email} onChange={update('email')} autoComplete="email" />
        </FormField>
        <FormField
          label={t('fields.password')}
          error={passwordError}
          help={t('setup.passwordHelp', policy)}
          info={t('setup.passwordInfo', policy)}
          infoTopic="first-run-setup#password-policy"
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
      <p className={styles.helpRow}>
        <Link to="/help">{t('helpCenter')}</Link>
      </p>
    </CenteredLayout>
  );
}
