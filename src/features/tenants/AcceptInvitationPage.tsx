import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { invitationsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  FormField,
  Input,
  PageHeader,
  layout,
} from '@/components/ui';
import { describeError } from '@/lib/errors';
import { HelpLink } from '@/help/HelpLink';

/** `POST /v1/invitations/accept` for the signed-in user (token from the link or pasted). */
export function AcceptInvitationPage() {
  const { t } = useTranslation('tenants');
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const queryClient = useQueryClient();
  const accept = useMutation({
    mutationFn: () => invitationsApi.accept(token.trim()),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products() }),
      ]),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    accept.mutate();
  };
  const described = accept.error ? describeError(t, accept.error) : null;
  // The two refusals people actually hit get a specific, actionable message.
  const errorMessage = !described
    ? null
    : described.error.isNotFound
      ? t('accept.invalid')
      : described.error.isForbidden
        ? t('accept.wrongEmail')
        : described.message;

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('accept.title')}
        description={t('accept.description')}
        help="members-invitations#accept"
      />
      <Card>
        {accept.isSuccess ? (
          <EmptyState
            icon={<CheckCircle2 />}
            title={t('accept.successTitle')}
            description={t('accept.successBody')}
            action={
              <ButtonLink to="/" variant="primary">
                {t('accept.continue')}
              </ButtonLink>
            }
          />
        ) : (
          <form className={layout.form} onSubmit={submit}>
            {described ? (
              <Alert tone="danger" title={described.title}>
                {errorMessage}{' '}
                {described.requestId ? (
                  <>
                    {t('errors:requestId')}: <code>{described.requestId}</code>{' '}
                  </>
                ) : null}
                <HelpLink topic="members-invitations#troubleshooting">
                  {t('common:help.learnMore')}
                </HelpLink>
              </Alert>
            ) : null}
            <FormField label={t('accept.token')} required>
              <Input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </FormField>
            <div className={layout.actions}>
              <Button
                type="submit"
                variant="primary"
                icon={<MailCheck />}
                loading={accept.isPending}
                disabled={!token.trim()}
              >
                {t('accept.submit')}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
