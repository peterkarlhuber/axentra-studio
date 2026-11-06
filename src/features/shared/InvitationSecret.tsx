import { useTranslation } from 'react-i18next';
import type { NewInvitationLike } from '@/api/models';
import { Alert, CopyField, layout } from '@/components/ui';
import { HelpLink } from '@/help/HelpLink';

/** The one-time accept link / token of a new invitation (returned only once). */
export function InvitationSecret({ invitation }: { invitation: NewInvitationLike }) {
  const { t } = useTranslation('tenants');
  return (
    <div className={layout.form}>
      <Alert tone="warning" title={t('invitations.oneTimeTitle')}>
        {t('invitations.oneTimeBody')}{' '}
        <HelpLink topic="members-invitations#delivery">{t('common:help.learnMore')}</HelpLink>
      </Alert>
      {invitation.accept_url ? (
        <CopyField label={t('invitations.link')} value={invitation.accept_url} />
      ) : null}
      <CopyField label={t('invitations.token')} value={invitation.token} secret />
      {!invitation.accept_url ? <p className={layout.muted}>{t('invitations.tokenHelp')}</p> : null}
    </div>
  );
}
