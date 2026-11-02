import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { invitationsApi, meApi } from '@/api/endpoints';
import { toApiError } from '@/api/errors';
import type { Me, TenantMember } from '@/api/models';
import { queryKeys } from '@/api/queryKeys';
import { useReauthenticate, useSession } from '@/app/auth';
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
import { HelpLink } from '@/help/HelpLink';
import { describeError } from '@/lib/errors';
import {
  ACCEPT_INVITATION_PATH,
  acceptInvitationPath,
  readPendingInvitation,
  writePendingInvitation,
} from './invitationLink';

interface Accepted {
  membership: TenantMember;
  tenantName?: string;
  productName?: string;
}

/** Product and tenant names of the new membership, from the refreshed `/v1/me`. */
function describeMembership(me: Me | undefined, membership: TenantMember): Accepted {
  const product = me?.products.find((entry) => entry.product.id === membership.product_id);
  const tenant = product?.tenants.find((entry) => entry.tenant.id === membership.tenant_id);
  return { membership, productName: product?.product.name, tenantName: tenant?.tenant.name };
}

type Outcome = 'invalid' | 'wrongEmail' | 'noEmail' | 'unreachable' | 'other';

function outcomeOf(error: unknown, hasEmail: boolean): Outcome {
  const apiError = toApiError(error);
  // The server answers one 404 for unknown, expired, revoked and used tokens (no oracle).
  if (apiError.isNotFound) return 'invalid';
  if (apiError.isForbidden) return hasEmail ? 'wrongEmail' : 'noEmail';
  if (apiError.status === 0 || apiError.status >= 500 || apiError.status === 429) {
    return 'unreachable';
  }
  return 'other';
}

/**
 * `POST /v1/invitations/accept` for the signed-in user. The token comes from the link
 * (`?token=`, also via the public `/accept-invitation` alias) or is pasted. It is moved out of
 * the address bar at once (history replace), so it neither stays in the history nor leaks in a
 * `Referer`; the tab keeps it until the invitation is accepted. Nothing is sent before the user
 * confirms.
 */
export function AcceptInvitationPage() {
  const { t } = useTranslation('tenants');
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const reauthenticate = useReauthenticate();
  const user = session.data?.user;
  const hasEmail = Boolean(user?.email);

  const fromUrl = new URLSearchParams(location.search).get('token')?.trim() || null;
  const [token, setToken] = useState(() => fromUrl ?? readPendingInvitation() ?? '');
  const [fromLink, setFromLink] = useState(() => Boolean(fromUrl ?? readPendingInvitation()));

  // A link opened while the page is shown (another invitation) replaces the token.
  const [seenUrlToken, setSeenUrlToken] = useState(fromUrl);
  if (fromUrl && fromUrl !== seenUrlToken) {
    setSeenUrlToken(fromUrl);
    setToken(fromUrl);
    setFromLink(true);
  }

  useEffect(() => {
    if (!fromUrl) return;
    writePendingInvitation(fromUrl);
    const rest = new URLSearchParams(location.search);
    rest.delete('token');
    const search = rest.toString();
    void navigate(
      { pathname: ACCEPT_INVITATION_PATH, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true },
    );
  }, [fromUrl, location.search, location.hash, navigate]);

  const accept = useMutation({
    mutationFn: async (): Promise<Accepted> => {
      const membership = await invitationsApi.accept(token.trim());
      writePendingInvitation(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products() }),
      ]);
      const me = await queryClient.fetchQuery({ queryKey: queryKeys.me, queryFn: meApi.get });
      return describeMembership(me, membership);
    },
    onError: (error) => {
      // A token the server refuses for good is of no further use in this tab.
      if (toApiError(error).isNotFound) writePendingInvitation(null);
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    accept.mutate();
  };
  const switchAccount = () =>
    reauthenticate.mutate(acceptInvitationPath(token.trim() || readPendingInvitation()));

  const outcome = accept.error ? outcomeOf(accept.error, hasEmail) : null;
  const described = accept.error ? describeError(t, accept.error) : null;
  const account = user?.email ?? user?.name ?? '';

  if (accept.isSuccess) {
    const { membership, tenantName, productName } = accept.data;
    const tenantPath = `/p/${encodeURIComponent(membership.product_id)}/tenants/${encodeURIComponent(membership.tenant_id)}`;
    return (
      <div className={layout.stack}>
        <PageHeader title={t('accept.title')} help="members-invitations#accept" />
        <Card>
          <EmptyState
            icon={<CheckCircle2 />}
            title={t('accept.successTitle')}
            description={
              tenantName
                ? t('accept.successBodyNamed', {
                    tenant: tenantName,
                    product: productName ?? membership.product_id,
                    role: membership.role,
                  })
                : t('accept.successBody', { role: membership.role })
            }
            action={
              <div className={layout.actions}>
                <ButtonLink to={tenantPath} variant="primary">
                  {t('accept.openTenant')}
                </ButtonLink>
                <ButtonLink to="/" variant="secondary">
                  {t('accept.continue')}
                </ButtonLink>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={layout.stack}>
      <PageHeader
        title={t('accept.title')}
        description={t('accept.description')}
        help="members-invitations#accept"
      />
      <Card>
        <form className={layout.form} onSubmit={submit}>
          {account ? (
            <p className={layout.muted} data-testid="accept-signed-in-as">
              <Trans
                t={t}
                i18nKey="accept.signedInAs"
                values={{ account }}
                components={{ strong: <strong /> }}
              />{' '}
              <Button
                variant="ghost"
                size="sm"
                icon={<LogOut />}
                loading={reauthenticate.isPending}
                onClick={switchAccount}
              >
                {t('accept.switchAccount')}
              </Button>
            </p>
          ) : null}

          {user && !hasEmail ? (
            <Alert tone="warning" title={t('accept.noEmailTitle')}>
              {t('accept.noEmail')}{' '}
              <HelpLink topic="members-invitations#troubleshooting">
                {t('common:help.learnMore')}
              </HelpLink>
            </Alert>
          ) : null}

          {outcome && described ? (
            <Alert tone="danger" title={t(`accept.outcomes.${outcome}.title`)}>
              {outcome === 'invalid' ? (
                <>
                  <p>{t('accept.outcomes.invalid.body')}</p>
                  <ul>
                    <li>{t('accept.outcomes.invalid.expired')}</li>
                    <li>{t('accept.outcomes.invalid.used')}</li>
                    <li>{t('accept.outcomes.invalid.revoked')}</li>
                    <li>{t('accept.outcomes.invalid.mistyped')}</li>
                  </ul>
                  <p>{t('accept.outcomes.invalid.next')}</p>
                </>
              ) : outcome === 'wrongEmail' ? (
                <p>{t('accept.outcomes.wrongEmail.body', { account })}</p>
              ) : outcome === 'noEmail' ? (
                <p>{t('accept.noEmail')}</p>
              ) : outcome === 'unreachable' ? (
                <p>{t('accept.outcomes.unreachable.body')}</p>
              ) : (
                <p>{described.message}</p>
              )}
              {described.requestId ? (
                <p>
                  {t('errors:requestId')}: <code>{described.requestId}</code>
                </p>
              ) : null}
              <HelpLink topic="members-invitations#troubleshooting">
                {t('common:help.learnMore')}
              </HelpLink>
            </Alert>
          ) : null}

          <FormField
            label={t('accept.token')}
            help={fromLink && token ? t('accept.tokenFromLink') : t('accept.tokenHelp')}
            required
          >
            <Input
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setFromLink(false);
              }}
              spellCheck={false}
              autoComplete="off"
            />
          </FormField>
          <div className={layout.actions}>
            {outcome === 'wrongEmail' ? (
              <Button
                variant="primary"
                icon={<LogOut />}
                loading={reauthenticate.isPending}
                onClick={switchAccount}
              >
                {t('accept.switchAccountAction')}
              </Button>
            ) : outcome === 'unreachable' ? (
              <Button
                type="submit"
                variant="primary"
                icon={<RefreshCw />}
                loading={accept.isPending}
                disabled={!token.trim()}
              >
                {t('common:actions.retry')}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                icon={<MailCheck />}
                loading={accept.isPending}
                disabled={!token.trim() || !hasEmail}
              >
                {t('accept.submit')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
