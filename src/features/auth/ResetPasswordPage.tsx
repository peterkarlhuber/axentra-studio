import { useQueryClient } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
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
import { describeError, fieldErrors } from '@/lib/errors';
import { passwordPolicy, passwordRefusal } from '@/lib/password';
import { useLinkToken } from './accountLink';
import { AuthLanguageSwitch } from './AuthLanguageSwitch';
import styles from './auth.module.css';

/**
 * `/reset-password?token=...`: the page of a password reset link. Sets a new password
 * (`POST /v1/auth/password-reset/confirm`); the server then ends every session of the account,
 * so this browser signs in again with the new password.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const meta = useMeta();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const token = useLinkToken();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    document.title = `${t('reset.title')} · ${t('common:app.name')}`;
  }, [t]);

  if (meta.setup_required) return <Navigate to="/setup" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setSubmitting(true);
    setError(null);
    try {
      await authApi.confirmPasswordReset({ token, new_password: password });
      // All sessions of the account ended, this browser's included.
      setCsrfToken(null);
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.removeQueries({ queryKey: queryKeys.me });
      toast.success(t('reset.successTitle'), t('reset.successBody'));
      void navigate('/login', { replace: true });
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  };

  const policy = passwordPolicy(meta);
  const invalidLink = !token || (isApiError(error) && error.code === 'invalid_token');
  const described = error && !invalidLink ? describeError(t, error) : null;
  const passwordError = passwordRefusal(t, error, policy) ?? fieldErrors(error).new_password;

  return (
    <CenteredLayout footer={<AuthLanguageSwitch />}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('reset.title')}</h1>
        <p className={styles.subtitle}>{t('reset.subtitle')}</p>
      </div>
      {invalidLink ? (
        <Alert tone="danger" title={t('reset.invalidTitle')}>
          {t('reset.invalidBody')} <Link to="/forgot-password">{t('reset.requestNew')}</Link>{' '}
          <HelpLink topic="signing-in#forgotten-password" />
        </Alert>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          {described && !passwordError ? (
            <Alert tone="danger" title={described.title}>
              {described.message}
            </Alert>
          ) : null}
          <FormField
            label={t('fields.newPassword')}
            error={passwordError}
            help={t('setup.passwordHelp', policy)}
            required
          >
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              maxLength={policy.max}
            />
          </FormField>
          <FormField
            label={t('fields.confirmPassword')}
            error={mismatch ? t('setup.passwordMismatch') : undefined}
            required
          >
            <Input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          <Alert tone="info">{t('reset.sessionsNote')}</Alert>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            icon={<KeyRound />}
          >
            {t('reset.submit')}
          </Button>
        </form>
      )}
      <p className={styles.helpRow}>
        <Link to="/login">{t('forgot.backToLogin')}</Link>
      </p>
    </CenteredLayout>
  );
}
