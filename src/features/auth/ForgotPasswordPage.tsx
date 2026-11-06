import { Send } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation } from 'react-router';
import { authApi } from '@/api/endpoints';
import { useMeta } from '@/app/contexts';
import { CenteredLayout } from '@/components/layout/CenteredLayout';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';
import { describeError } from '@/lib/errors';
import { AuthLanguageSwitch } from './AuthLanguageSwitch';
import styles from './auth.module.css';

/**
 * `/forgot-password`: asks the server to email a reset link (`POST /v1/auth/password-reset`).
 * The server answers the same for every address, so the page does too: it never tells whether
 * an account exists.
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const meta = useMeta();
  const location = useLocation();
  const prefill = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefill);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    document.title = `${t('forgot.title')} · ${t('common:app.name')}`;
  }, [t]);

  if (meta.setup_required) return <Navigate to="/setup" replace />;
  if (!meta.auth.password) return <Navigate to="/login" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.requestPasswordReset({ email: email.trim() });
      setSentTo(email.trim());
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };
  const described = error ? describeError(t, error) : null;

  return (
    <CenteredLayout footer={<AuthLanguageSwitch />}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('forgot.title')}</h1>
        <p className={styles.subtitle}>{t('forgot.subtitle')}</p>
      </div>
      {sentTo ? (
        <Alert tone="success" title={t('forgot.sentTitle')}>
          {t('forgot.sentBody', { email: sentTo })}{' '}
          <HelpLink topic="signing-in#forgotten-password" />
        </Alert>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          {described ? (
            <Alert tone="danger" title={described.title}>
              {described.message}
            </Alert>
          ) : null}
          <FormField label={t('fields.email')} help={t('forgot.emailHelp')} required>
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            icon={<Send />}
          >
            {t('forgot.submit')}
          </Button>
        </form>
      )}
      <p className={styles.helpRow}>
        <Link to="/login" state={email.trim() ? { email: email.trim() } : undefined}>
          {t('forgot.backToLogin')}
        </Link>
      </p>
    </CenteredLayout>
  );
}
